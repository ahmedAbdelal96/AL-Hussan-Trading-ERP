/**
 * ============================================================================
 * GET COMPANY P&L USE CASE
 * ============================================================================
 *
 * Company-level Profit & Loss statement.
 *
 * ── Revenue definition ──────────────────────────────────────────────────────
 * There is no Invoice/Revenue table in the schema.
 * Revenue = sum(project.budget) for projects with status IN
 *   [ACTIVE, ON_HOLD, COMPLETED]
 * This represents contracted values, not collected cash.
 * The `revenueSource` field in the response makes this explicit.
 *
 * ── Cost definition ─────────────────────────────────────────────────────────
 * Single source of truth = the `costs` table.
 * ProcessPayroll writes SALARY cost records, so Payslip is NOT added again.
 * CostAllocation records represent internal project distribution of costs
 * that already exist in `costs`; they are NOT summed to avoid double-counting.
 * REJECTED costs are excluded; all other payment statuses are included.
 *
 * ── Cost buckets ────────────────────────────────────────────────────────────
 * Labor:      SALARY, ALLOWANCE
 * Materials:  MATERIAL, PURCHASE
 * Equipment:  EQUIPMENT_RENTAL
 * Field Ops:  FUEL, TRANSPORTATION, MAINTENANCE
 * Admin:      UTILITY, INSURANCE, TAX, SUBCONTRACTOR, OTHER
 *
 * ── Performance ─────────────────────────────────────────────────────────────
 * Independent queries (costByType, revenue, topProjects, trend) are executed
 * in parallel via Promise.all.  The monthly trend uses raw SQL for efficiency.
 */

import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { RedisCacheService } from '../../../../../infrastructure/cache/redis-cache.service';
import {
  CompanyPnlFiltersDto,
  PnlPeriodEnum,
  CompanyPnlResponseDto,
  PnlCostTypeDetailDto,
  PnlMonthlyPointDto,
  PnlProjectBreakdownDto,
  PeriodBoundaryDto,
} from '../dto';
import {
  getRiyadhDateParts,
  getRiyadhMonthRange,
  getRiyadhQuarterFromMonth,
  getRiyadhQuarterRange,
  getRiyadhYearRange,
} from '../utils/riyadh-period.util';

// ── Cost classification map ──────────────────────────────────────────────────
const LABOR_TYPES = ['SALARY', 'ALLOWANCE'];
const MATERIALS_TYPES = ['MATERIAL', 'PURCHASE'];
const EQUIPMENT_TYPES = ['EQUIPMENT_RENTAL'];
const FIELD_OPS_TYPES = ['FUEL', 'TRANSPORTATION', 'MAINTENANCE'];
const ADMIN_TYPES = ['UTILITY', 'INSURANCE', 'TAX', 'SUBCONTRACTOR', 'OTHER'];

/** Revenue-eligible project statuses (not planning, not cancelled/archived) */
const REVENUE_STATUSES = ['ACTIVE', 'ON_HOLD', 'COMPLETED'];

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

@Injectable()
export class GetCompanyPnlUseCase {
  private static readonly CACHE_TTL_SECONDS = 90;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  private buildCacheKey(filters: CompanyPnlFiltersDto): string {
    const normalized = Object.entries(filters || {})
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      )
      .sort(([a], [b]) => a.localeCompare(b));
    const hash = createHash('sha1')
      .update(JSON.stringify(normalized))
      .digest('hex');
    return `reports:executive:pnl:${hash}`;
  }

  async execute(filters: CompanyPnlFiltersDto): Promise<CompanyPnlResponseDto> {
    const cacheKey = this.buildCacheKey(filters);
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const period = this.resolvePeriod(filters);

        // Cost filter: period window + exclude rejected payments
        const costWhere: Prisma.CostWhereInput = {
          paymentStatus: { notIn: ['REJECTED'] },
          transactionDate: {
            gte: new Date(period.startDate),
            lte: new Date(period.endDate),
          },
        };

        // ── Fire all base queries in parallel ────────────────────────────────────
        const [costByTypeRows, revenueAgg, topProjectsData, monthlyTrendData] =
          await Promise.all([
            // 1. Cost breakdown by type
            this.prisma.cost.groupBy({
              by: ['costType'],
              where: costWhere,
              _sum: { amount: true },
              orderBy: { _sum: { amount: 'desc' } },
            }),

            // 2. Revenue: contracted project values
            this.prisma.project.aggregate({
              where: {
                deletedAt: null,
                status: { in: REVENUE_STATUSES as any[] },
                budget: { not: null },
              },
              _sum: { budget: true },
            }),

            // 3. Top 10 projects by cost in period (optional)
            filters.includeProjectBreakdown
              ? this.getTopProjectsByCost(costWhere, 10)
              : Promise.resolve(null),

            // 4. 12-month trend (optional — raw SQL)
            filters.includeMonthlyTrend
              ? this.getMonthlyTrend(12)
              : Promise.resolve(null),
          ]);

        // ── Aggregate costs into buckets ─────────────────────────────────────────
        const costMap = new Map<string, number>();
        let totalCosts = 0;

        for (const row of costByTypeRows) {
          const amount = Math.round(Number(row._sum.amount ?? 0) * 100) / 100;
          costMap.set(row.costType, amount);
          totalCosts += amount;
        }
        totalCosts = Math.round(totalCosts * 100) / 100;

        const sumBucket = (types: string[]): number =>
          Math.round(
            types.reduce((sum, t) => sum + (costMap.get(t) ?? 0), 0) * 100,
          ) / 100;

        const laborCost = sumBucket(LABOR_TYPES);
        const materialsCost = sumBucket(MATERIALS_TYPES);
        const equipmentCost = sumBucket(EQUIPMENT_TYPES);
        const fieldOpsCost = sumBucket(FIELD_OPS_TYPES);
        const adminCost = sumBucket(ADMIN_TYPES);

        // ── Revenue & profitability ───────────────────────────────────────────────
        const totalRevenue =
          Math.round(Number(revenueAgg._sum.budget ?? 0) * 100) / 100;
        const grossProfit = Math.round((totalRevenue - totalCosts) * 100) / 100;
        const grossMarginPct =
          totalRevenue > 0
            ? Math.round((grossProfit / totalRevenue) * 10000) / 100
            : null;
        const costToRevenueRatio =
          totalRevenue > 0
            ? Math.round((totalCosts / totalRevenue) * 10000) / 100
            : null;

        // ── Optional: per-CostType detail array ──────────────────────────────────
        let costByType: PnlCostTypeDetailDto[] | undefined;
        if (filters.includeCostBreakdown) {
          costByType = costByTypeRows.map((row) => ({
            costType: row.costType,
            amount: costMap.get(row.costType) ?? 0,
            percentage:
              totalCosts > 0
                ? Math.round(
                    ((costMap.get(row.costType) ?? 0) / totalCosts) * 10000,
                  ) / 100
                : 0,
          }));
        }

        // ── Optional: top-projects breakdown ─────────────────────────────────────
        let topProjectsByCost: PnlProjectBreakdownDto[] | undefined;
        if (filters.includeProjectBreakdown && topProjectsData) {
          topProjectsByCost = topProjectsData.map((p) => {
            const contractValue = Math.round(p.contractValue * 100) / 100;
            const pCosts = Math.round(p.totalCosts * 100) / 100;
            const pProfit = Math.round((contractValue - pCosts) * 100) / 100;
            return {
              projectId: p.projectId,
              projectCode: p.projectCode,
              projectName: p.projectName,
              projectStatus: p.projectStatus,
              contractValue,
              totalCosts: pCosts,
              grossProfit: pProfit,
              grossMarginPct:
                contractValue > 0
                  ? Math.round((pProfit / contractValue) * 10000) / 100
                  : null,
            };
          });
        }

        return {
          period,
          totalRevenue,
          revenueSource: 'contracted_project_values',
          laborCost,
          materialsCost,
          equipmentCost,
          fieldOpsCost,
          adminCost,
          totalCosts,
          grossProfit,
          grossMarginPct,
          costToRevenueRatio,
          ...(costByType && { costByType }),
          ...(monthlyTrendData && { monthlyTrend: monthlyTrendData }),
          ...(topProjectsByCost && { topProjectsByCost }),
          currency: 'SAR',
          generatedAt: new Date().toISOString(),
        };
      },
      GetCompanyPnlUseCase.CACHE_TTL_SECONDS,
    );
  }

  // ── Period resolution ──────────────────────────────────────────────────────

  private resolvePeriod(filters: CompanyPnlFiltersDto): PeriodBoundaryDto {
    const nowRiyadh = getRiyadhDateParts();
    const period = filters.period ?? PnlPeriodEnum.MONTHLY;

    if (
      period === PnlPeriodEnum.CUSTOM &&
      filters.startDate &&
      filters.endDate
    ) {
      return {
        startDate: filters.startDate,
        endDate: filters.endDate,
        label: `${filters.startDate} - ${filters.endDate}`,
      };
    }

    if (period === PnlPeriodEnum.ANNUAL) {
      const year = filters.year ?? nowRiyadh.year;
      const range = getRiyadhYearRange(year);
      return {
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
        label: `FY ${year}`,
      };
    }

    if (period === PnlPeriodEnum.QUARTERLY) {
      const year = filters.year ?? nowRiyadh.year;
      const quarter = getRiyadhQuarterFromMonth(nowRiyadh.month);
      const range = getRiyadhQuarterRange(year, quarter);
      return {
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
        label: `Q${quarter} ${year}`,
      };
    }

    // Default: MONTHLY
    const year = filters.year ?? nowRiyadh.year;
    const month = filters.month ?? nowRiyadh.month;
    const range = getRiyadhMonthRange(year, month);
    return {
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString(),
      label: `${MONTH_NAMES[month - 1]} ${year}`,
    };
  }

  // ── Top projects by cost ───────────────────────────────────────────────────
  /**
   * Aggregates costs per project in the given window, then joins project metadata.
   * Using two Prisma queries + JS merge to avoid a raw SQL join.
   *
   * Note: costs with projectId = null (general expenses) are excluded here
   * because they are not attributable to a specific project.
   */
  private async getTopProjectsByCost(
    costWhere: Prisma.CostWhereInput,
    limit: number,
  ): Promise<
    Array<{
      projectId: string;
      projectCode: string;
      projectName: string;
      projectStatus: string;
      contractValue: number;
      totalCosts: number;
    }>
  > {
    // Step 1: group costs by projectId
    const costGroups = await this.prisma.cost.groupBy({
      by: ['projectId'],
      where: {
        ...costWhere,
        projectId: { not: null }, // only project-attributed costs
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    if (costGroups.length === 0) return [];

    const projectIds = costGroups
      .map((g) => g.projectId)
      .filter(Boolean) as string[];

    // Step 2: fetch project metadata
    const projects = await this.prisma.project.findMany({
      where: { id: { in: projectIds }, deletedAt: null },
      select: {
        id: true,
        projectCode: true,
        name: true,
        status: true,
        budget: true,
      },
    });

    const projectMap = new Map(projects.map((p) => [p.id, p]));

    return costGroups
      .map((g) => {
        const project = projectMap.get(g.projectId!);
        if (!project) return null;
        return {
          projectId: project.id,
          projectCode: project.projectCode,
          projectName: project.name,
          projectStatus: project.status,
          contractValue: Number(project.budget ?? 0),
          totalCosts: Number(g._sum.amount ?? 0),
        };
      })
      .filter(Boolean) as any[];
  }

  // ── 12-month trend (raw SQL) ───────────────────────────────────────────────
  /**
   * Returns monthly revenue + cost + profit for the last N months.
   *
   * Revenue per month = project budgets for projects whose actualStartDate
   * falls in that month.  When actualStartDate is null, plannedStartDate
   * is used as a fallback.  This gives a "when work started" revenue model
   * rather than an all-time snapshot.
   *
   * Costs per month = sum(Cost.amount) grouped by transaction_date month.
   */
  private async getMonthlyTrend(months: number): Promise<PnlMonthlyPointDto[]> {
    const startFrom = new Date();
    startFrom.setMonth(startFrom.getMonth() - (months - 1));
    startFrom.setDate(1);
    startFrom.setHours(0, 0, 0, 0);

    // Monthly costs
    const costRows = await this.prisma.$queryRaw<
      Array<{ month: string; total_cost: string }>
    >(
      Prisma.sql`
        SELECT
          TO_CHAR(DATE_TRUNC('month', transaction_date), 'YYYY-MM') AS month,
          COALESCE(SUM(amount), 0)::TEXT AS total_cost
        FROM costs
        WHERE
          payment_status <> 'REJECTED'
          AND transaction_date >= ${startFrom}
        GROUP BY DATE_TRUNC('month', transaction_date)
        ORDER BY DATE_TRUNC('month', transaction_date) ASC
      `,
    );

    // Monthly contracted revenue (projects that became active per month)
    const revenueRows = await this.prisma.$queryRaw<
      Array<{ month: string; total_revenue: string }>
    >(
      Prisma.sql`
        SELECT
          TO_CHAR(DATE_TRUNC('month',
            COALESCE(actual_start_date, planned_start_date)
          ), 'YYYY-MM') AS month,
          COALESCE(SUM(budget), 0)::TEXT AS total_revenue
        FROM projects
        WHERE
          deleted_at IS NULL
          AND status IN ('ACTIVE', 'ON_HOLD', 'COMPLETED')
          AND budget IS NOT NULL
          AND COALESCE(actual_start_date, planned_start_date) >= ${startFrom}
        GROUP BY DATE_TRUNC('month',
          COALESCE(actual_start_date, planned_start_date)
        )
        ORDER BY DATE_TRUNC('month',
          COALESCE(actual_start_date, planned_start_date)
        ) ASC
      `,
    );

    // Build a unified map of all months that appear in either dataset
    const dataMap = new Map<string, { revenue: number; totalCosts: number }>();

    for (const r of revenueRows) {
      dataMap.set(r.month, {
        revenue: Number(r.total_revenue),
        totalCosts: 0,
      });
    }
    for (const r of costRows) {
      const existing = dataMap.get(r.month);
      if (existing) {
        existing.totalCosts = Number(r.total_cost);
      } else {
        dataMap.set(r.month, { revenue: 0, totalCosts: Number(r.total_cost) });
      }
    }

    return Array.from(dataMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const revenue = Math.round(data.revenue * 100) / 100;
        const totalCosts = Math.round(data.totalCosts * 100) / 100;
        const grossProfit = Math.round((revenue - totalCosts) * 100) / 100;
        return {
          month,
          revenue,
          totalCosts,
          grossProfit,
          grossMarginPct:
            revenue > 0
              ? Math.round((grossProfit / revenue) * 10000) / 100
              : null,
        };
      });
  }
}
