import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  MaintenanceBudgetActualFiltersDto,
  MaintenanceBudgetActualResponseDto,
  BudgetPeriodItemDto,
  BudgetActualSummaryDto,
} from '../dto';
import { Prisma } from '@prisma/client';

/**
 * Use Case: Get Maintenance Budget vs. Actual Report
 *
 * Compares estimatedCost (budget) against actualCost (spend) grouped by:
 *   - month      → "YYYY-MM" buckets
 *   - assetType  → VEHICLE | EQUIPMENT | TOOL | etc.
 *   - maintenanceType → PREVENTIVE | CORRECTIVE | etc.
 *
 * Budget status thresholds:
 *   OVER_BUDGET  → actual > estimated * 1.05
 *   UNDER_BUDGET → actual < estimated * 0.95
 *   ON_BUDGET    → within ±5 %
 */
@Injectable()
export class GetMaintenanceBudgetActualUseCase {
  private readonly logger = new Logger(GetMaintenanceBudgetActualUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: MaintenanceBudgetActualFiltersDto,
  ): Promise<MaintenanceBudgetActualResponseDto> {
    this.logger.log('Generating maintenance budget vs actual report');

    try {
      const whereClause = this.buildWhereClause(filters);
      const groupBy = filters.groupBy ?? 'month';

      const requests = await this.prisma.maintenanceRequest.findMany({
        where: whereClause,
        select: {
          estimatedCost: true,
          actualCost: true,
          maintenanceType: true,
          createdAt: true,
          asset: {
            select: { assetType: true },
          },
        },
      });

      // Group records and aggregate
      const buckets = new Map<
        string,
        { requestCount: number; estimatedCost: number; actualCost: number }
      >();

      for (const r of requests) {
        const period = this.getPeriod(r, groupBy);
        const estimated = Number(r.estimatedCost ?? 0);
        const actual = Number(r.actualCost ?? 0);

        const existing = buckets.get(period);
        if (existing) {
          existing.requestCount += 1;
          existing.estimatedCost += estimated;
          existing.actualCost += actual;
        } else {
          buckets.set(period, {
            requestCount: 1,
            estimatedCost: estimated,
            actualCost: actual,
          });
        }
      }

      // Build period items, sorted by period key
      const items: BudgetPeriodItemDto[] = Array.from(buckets.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, v]) => {
          const variance = v.estimatedCost - v.actualCost;
          const variancePercentage =
            v.estimatedCost > 0
              ? Math.round((variance / v.estimatedCost) * 1000) / 10
              : null;
          const budgetStatus = this.getBudgetStatus(
            v.estimatedCost,
            v.actualCost,
          );

          return {
            period,
            requestCount: v.requestCount,
            estimatedCost: Math.round(v.estimatedCost * 100) / 100,
            actualCost: Math.round(v.actualCost * 100) / 100,
            variance: Math.round(variance * 100) / 100,
            variancePercentage,
            budgetStatus,
          };
        });
      const { page, limit, startIndex, endIndex } = this.getPagination(filters);
      const paginatedItems = items.slice(startIndex, endIndex);

      const summary = this.buildSummary(items);

      return {
        items: paginatedItems,
        summary,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: items.length,
          totalPages: Math.ceil(items.length / limit),
          hasNextPage: endIndex < items.length,
          hasPreviousPage: page > 1,
        },
        groupBy,
        currency: 'SAR',
        generatedAt: new Date().toISOString(),
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate budget vs actual report: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private buildWhereClause(
    filters: MaintenanceBudgetActualFiltersDto,
  ): Prisma.MaintenanceRequestWhereInput {
    const where: Prisma.MaintenanceRequestWhereInput = {};

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }
    if (filters.maintenanceType)
      where.maintenanceType = filters.maintenanceType;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assetType) where.asset = { assetType: filters.assetType };
    if (filters.assetId) where.assetId = filters.assetId;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.vendor) {
      where.vendor = {
        contains: filters.vendor,
        mode: 'insensitive' as Prisma.QueryMode,
      };
    }

    return where;
  }

  private getPeriod(
    record: {
      createdAt: Date;
      maintenanceType: string;
      asset: { assetType: string };
    },
    groupBy: 'month' | 'assetType' | 'maintenanceType',
  ): string {
    switch (groupBy) {
      case 'month': {
        const d = new Date(record.createdAt);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
      }
      case 'assetType':
        return record.asset.assetType;
      case 'maintenanceType':
        return record.maintenanceType;
    }
  }

  private getBudgetStatus(
    estimated: number,
    actual: number,
  ): 'UNDER_BUDGET' | 'ON_BUDGET' | 'OVER_BUDGET' {
    if (estimated === 0 && actual === 0) return 'ON_BUDGET';
    if (estimated === 0) return 'OVER_BUDGET';
    if (actual > estimated * 1.05) return 'OVER_BUDGET';
    if (actual < estimated * 0.95) return 'UNDER_BUDGET';
    return 'ON_BUDGET';
  }

  private buildSummary(items: BudgetPeriodItemDto[]): BudgetActualSummaryDto {
    const totalRequests = items.reduce((s, i) => s + i.requestCount, 0);
    const totalEstimated =
      Math.round(items.reduce((s, i) => s + i.estimatedCost, 0) * 100) / 100;
    const totalActual =
      Math.round(items.reduce((s, i) => s + i.actualCost, 0) * 100) / 100;
    const totalVariance =
      Math.round((totalEstimated - totalActual) * 100) / 100;
    const variancePercentage =
      totalEstimated > 0
        ? Math.round((totalVariance / totalEstimated) * 1000) / 10
        : null;

    const overBudgetCount = items.filter(
      (i) => i.budgetStatus === 'OVER_BUDGET',
    ).length;
    const underBudgetCount = items.filter(
      (i) => i.budgetStatus === 'UNDER_BUDGET',
    ).length;
    const onBudgetCount = items.filter(
      (i) => i.budgetStatus === 'ON_BUDGET',
    ).length;

    return {
      totalRequests,
      totalEstimated,
      totalActual,
      totalVariance,
      variancePercentage,
      overBudgetCount,
      underBudgetCount,
      onBudgetCount,
    };
  }

  private getPagination(filters: MaintenanceBudgetActualFiltersDto) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return { page, limit, startIndex, endIndex };
  }
}
