import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { RedisCacheService } from '../../../../../infrastructure/cache/redis-cache.service';
import {
  ExecutiveDashboardFiltersDto,
  DashboardPeriodEnum,
  ExecutiveDashboardResponseDto,
  ExecutiveKpiDto,
  ProjectStatusSliceDto,
  MonthlyCostPointDto,
  CostByTypeSliceDto,
  PeriodBoundaryDto,
} from '../dto';
import {
  getRiyadhDateParts,
  getRiyadhMonthRange,
  getRiyadhQuarterFromMonth,
  getRiyadhQuarterRange,
  getRiyadhYearRange,
} from '../utils/riyadh-period.util';

const LABOR_COST_TYPES = ['SALARY', 'ALLOWANCE'];
const ACTIVE_ASSET_STATUSES = ['AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE'];
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
export class GetExecutiveDashboardUseCase {
  private static readonly CACHE_TTL_SECONDS = 60;
  private static readonly STALE_CACHE_TTL_SECONDS = 300;
  private readonly logger = new Logger(GetExecutiveDashboardUseCase.name);
  private readonly inFlightRequests = new Map<
    string,
    Promise<ExecutiveDashboardResponseDto>
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  private buildCacheKey(filters: ExecutiveDashboardFiltersDto): string {
    const normalized = Object.entries(filters || {})
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      )
      .sort(([a], [b]) => a.localeCompare(b));

    const hash = createHash('sha1')
      .update(JSON.stringify(normalized))
      .digest('hex');

    return `reports:executive:dashboard:${hash}`;
  }

  private getFreshKey(baseKey: string): string {
    return `${baseKey}:fresh`;
  }

  private getStaleKey(baseKey: string): string {
    return `${baseKey}:stale`;
  }

  async execute(
    filters: ExecutiveDashboardFiltersDto,
  ): Promise<ExecutiveDashboardResponseDto> {
    const baseKey = this.buildCacheKey(filters);
    const freshKey = this.getFreshKey(baseKey);
    const staleKey = this.getStaleKey(baseKey);

    const fresh = await this.cache.get<ExecutiveDashboardResponseDto>(freshKey);
    if (fresh) {
      return fresh;
    }

    const stale = await this.cache.get<ExecutiveDashboardResponseDto>(staleKey);
    if (stale) {
      // SWR: serve stale immediately and refresh in background once.
      this.triggerBackgroundRefresh(baseKey, filters);
      return stale;
    }

    return this.getOrCreateInFlight(baseKey, () =>
      this.computeAndCache(baseKey, filters),
    );
  }

  private triggerBackgroundRefresh(
    baseKey: string,
    filters: ExecutiveDashboardFiltersDto,
  ): void {
    this.getOrCreateInFlight(baseKey, () =>
      this.computeAndCache(baseKey, filters),
    ).catch((error) => {
      this.logger.warn(
        `Background executive dashboard refresh failed: ${error.message}`,
      );
    });
  }

  private getOrCreateInFlight(
    requestKey: string,
    factory: () => Promise<ExecutiveDashboardResponseDto>,
  ): Promise<ExecutiveDashboardResponseDto> {
    const existing = this.inFlightRequests.get(requestKey);
    if (existing) {
      return existing;
    }

    const promise = (async () => {
      try {
        return await factory();
      } finally {
        this.inFlightRequests.delete(requestKey);
      }
    })();

    this.inFlightRequests.set(requestKey, promise);
    return promise;
  }

  private async computeAndCache(
    baseKey: string,
    filters: ExecutiveDashboardFiltersDto,
  ): Promise<ExecutiveDashboardResponseDto> {
    const payload = await this.computeDashboard(filters);
    await Promise.all([
      this.cache.set(
        this.getFreshKey(baseKey),
        payload,
        GetExecutiveDashboardUseCase.CACHE_TTL_SECONDS,
      ),
      this.cache.set(
        this.getStaleKey(baseKey),
        payload,
        GetExecutiveDashboardUseCase.STALE_CACHE_TTL_SECONDS,
      ),
    ]);
    return payload;
  }

  private async computeDashboard(
    filters: ExecutiveDashboardFiltersDto,
  ): Promise<ExecutiveDashboardResponseDto> {
    const period = this.resolvePeriod(filters);
    const { startDate, endDate } = period;
    const costDateFilter = { gte: new Date(startDate), lte: new Date(endDate) };

    const [
      activeProjectsAgg,
      atRiskCount,
      allProjectsAgg,
      assetsByStatus,
      headcount,
      laborCostAgg,
      totalCostAgg,
      maintenanceOverdueCount,
      maintenancePendingCount,
      costByTypeData,
      monthlyCostTrend,
    ] = await Promise.all([
      this.prisma.project.aggregate({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
        },
        _count: { id: true },
        _sum: { budget: true },
      }),
      this.prisma.project.count({
        where: {
          deletedAt: null,
          status: { notIn: ['COMPLETED', 'CANCELLED', 'ARCHIVED', 'DRAFT'] },
          plannedEndDate: { lt: new Date() },
        },
      }),
      this.prisma.project.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.asset.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.employee.count({
        where: { deletedAt: null, status: 'ACTIVE' },
      }),
      this.prisma.cost.aggregate({
        where: {
          paymentStatus: { notIn: ['REJECTED'] },
          costType: { in: LABOR_COST_TYPES as any[] },
          transactionDate: costDateFilter,
        },
        _sum: { amount: true },
      }),
      this.prisma.cost.aggregate({
        where: {
          paymentStatus: { notIn: ['REJECTED'] },
          transactionDate: costDateFilter,
        },
        _sum: { amount: true },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          scheduledDate: { lt: new Date() },
        },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS', 'ON_HOLD'] },
        },
      }),
      this.prisma.cost.groupBy({
        by: ['costType'],
        where: {
          paymentStatus: { notIn: ['REJECTED'] },
          transactionDate: costDateFilter,
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      this.getMonthlyCostTrend(),
    ]);

    const totalContractValue = Number(activeProjectsAgg._sum.budget ?? 0);
    const laborCostPeriod = Number(laborCostAgg._sum.amount ?? 0);
    const totalCostsPeriod = Number(totalCostAgg._sum.amount ?? 0);
    const budgetUtilizationPct =
      totalContractValue > 0
        ? Math.round((totalCostsPeriod / totalContractValue) * 10000) / 100
        : null;

    const assetStatusMap = new Map<string, number>();
    for (const row of assetsByStatus) {
      assetStatusMap.set(row.status, row._count.id);
    }
    const inUse = assetStatusMap.get('IN_USE') ?? 0;
    const fleetTotal = ACTIVE_ASSET_STATUSES.reduce(
      (sum, status) => sum + (assetStatusMap.get(status) ?? 0),
      0,
    );
    const assetUtilizationPct =
      fleetTotal > 0 ? Math.round((inUse / fleetTotal) * 10000) / 100 : 0;

    const kpi: ExecutiveKpiDto = {
      activeProjects: activeProjectsAgg._count.id,
      atRiskProjects: atRiskCount,
      totalContractValue: Math.round(totalContractValue * 100) / 100,
      laborCostPeriod: Math.round(laborCostPeriod * 100) / 100,
      totalCostsPeriod: Math.round(totalCostsPeriod * 100) / 100,
      budgetUtilizationPct,
      headcount,
      assetUtilizationPct,
      idleAssets: assetStatusMap.get('AVAILABLE') ?? 0,
      maintenanceOverdue: maintenanceOverdueCount,
      maintenancePending: maintenancePendingCount,
    };

    const totalProjects = allProjectsAgg.reduce(
      (sum, row) => sum + row._count.id,
      0,
    );
    const projectStatusDistribution: ProjectStatusSliceDto[] =
      allProjectsAgg.map((row) => ({
        status: row.status,
        count: row._count.id,
        percentage:
          totalProjects > 0
            ? Math.round((row._count.id / totalProjects) * 10000) / 100
            : 0,
      }));

    const costByType: CostByTypeSliceDto[] = costByTypeData.map((row) => ({
      costType: row.costType,
      amount: Math.round(Number(row._sum.amount ?? 0) * 100) / 100,
      percentage:
        totalCostsPeriod > 0
          ? Math.round(
              (Number(row._sum.amount ?? 0) / totalCostsPeriod) * 10000,
            ) / 100
          : 0,
    }));

    return {
      kpi,
      projectStatusDistribution,
      monthlyCostTrend,
      costByType,
      currency: 'SAR',
      period,
      generatedAt: new Date().toISOString(),
    };
  }

  private resolvePeriod(
    filters: ExecutiveDashboardFiltersDto,
  ): PeriodBoundaryDto {
    const nowRiyadh = getRiyadhDateParts();
    const period = filters.period ?? DashboardPeriodEnum.MTD;

    if (
      period === DashboardPeriodEnum.CUSTOM &&
      filters.startDate &&
      filters.endDate
    ) {
      return {
        startDate: filters.startDate,
        endDate: filters.endDate,
        label: `${filters.startDate} - ${filters.endDate}`,
      };
    }

    if (period === DashboardPeriodEnum.YTD) {
      const range = getRiyadhYearRange(nowRiyadh.year);
      return {
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
        label: `YTD ${nowRiyadh.year}`,
      };
    }

    if (period === DashboardPeriodEnum.QTD) {
      const quarter = getRiyadhQuarterFromMonth(nowRiyadh.month);
      const range = getRiyadhQuarterRange(nowRiyadh.year, quarter);
      return {
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
        label: `Q${quarter} ${nowRiyadh.year}`,
      };
    }

    const monthRange = getRiyadhMonthRange(nowRiyadh.year, nowRiyadh.month);
    return {
      startDate: monthRange.start.toISOString(),
      endDate: monthRange.end.toISOString(),
      label: `${MONTH_NAMES[nowRiyadh.month - 1]} ${nowRiyadh.year}`,
    };
  }

  private async getMonthlyCostTrend(): Promise<MonthlyCostPointDto[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const rows = await this.prisma.$queryRaw<
      Array<{
        month: string;
        labor_cost: string;
        other_cost: string;
        total_cost: string;
      }>
    >(
      Prisma.sql`
        SELECT
          TO_CHAR(DATE_TRUNC('month', transaction_date), 'YYYY-MM') AS month,
          COALESCE(SUM(CASE WHEN cost_type IN ('SALARY', 'ALLOWANCE') THEN amount ELSE 0 END), 0)::TEXT  AS labor_cost,
          COALESCE(SUM(CASE WHEN cost_type NOT IN ('SALARY', 'ALLOWANCE') THEN amount ELSE 0 END), 0)::TEXT AS other_cost,
          COALESCE(SUM(amount), 0)::TEXT AS total_cost
        FROM costs
        WHERE
          payment_status <> 'REJECTED'
          AND transaction_date >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', transaction_date)
        ORDER BY DATE_TRUNC('month', transaction_date) ASC
      `,
    );

    return rows.map((row) => ({
      month: row.month,
      laborCost: Math.round(Number(row.labor_cost) * 100) / 100,
      otherCost: Math.round(Number(row.other_cost) * 100) / 100,
      totalCost: Math.round(Number(row.total_cost) * 100) / 100,
    }));
  }
}
