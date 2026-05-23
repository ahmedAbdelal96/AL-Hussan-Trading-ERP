import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  MaintenanceCostPerAssetFiltersDto,
  MaintenanceCostPerAssetResponseDto,
  AssetCostItemDto,
  AssetCostByTypeDto,
  CostPerAssetSummaryDto,
} from '../dto';
import { Prisma } from '@prisma/client';

/**
 * Use Case: Get Maintenance Cost Per Asset Report
 *
 * Provides a detailed cost breakdown per individual asset, including:
 * - Total estimated vs. actual cost
 * - Cost variance and variance percentage
 * - Average cost per request
 * - Cost-to-value ratio (actual cost / purchase price) — optional
 * - Per-type breakdown — optional
 *
 * All statuses are included so we capture the full spend picture.
 */
@Injectable()
export class GetMaintenanceCostPerAssetUseCase {
  private readonly logger = new Logger(GetMaintenanceCostPerAssetUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: MaintenanceCostPerAssetFiltersDto,
  ): Promise<MaintenanceCostPerAssetResponseDto> {
    this.logger.log('Generating maintenance cost per asset report');

    try {
      const whereClause = this.buildWhereClause(filters);

      const requests = await this.prisma.maintenanceRequest.findMany({
        where: whereClause,
        select: {
          assetId: true,
          maintenanceType: true,
          estimatedCost: true,
          actualCost: true,
          asset: {
            select: {
              assetNumber: true,
              name: true,
              assetType: true,
              purchasePrice: true,
            },
          },
        },
      });

      // Group by assetId
      const byAsset = new Map<
        string,
        {
          assetNumber: string;
          assetName: string;
          assetType: string;
          purchasePrice: Prisma.Decimal | null;
          records: Array<{
            maintenanceType: string;
            estimatedCost: Prisma.Decimal | null;
            actualCost: Prisma.Decimal | null;
          }>;
        }
      >();

      for (const r of requests) {
        const existing = byAsset.get(r.assetId);
        if (existing) {
          existing.records.push({
            maintenanceType: r.maintenanceType,
            estimatedCost: r.estimatedCost,
            actualCost: r.actualCost,
          });
        } else {
          byAsset.set(r.assetId, {
            assetNumber: r.asset.assetNumber,
            assetName: r.asset.name,
            assetType: r.asset.assetType,
            purchasePrice: r.asset.purchasePrice ?? null,
            records: [
              {
                maintenanceType: r.maintenanceType,
                estimatedCost: r.estimatedCost,
                actualCost: r.actualCost,
              },
            ],
          });
        }
      }

      const minCost = filters.minCost ?? 0;

      const items: AssetCostItemDto[] = [];

      for (const [assetId, info] of byAsset.entries()) {
        const totalEstimated = info.records.reduce(
          (s, r) => s + Number(r.estimatedCost ?? 0),
          0,
        );
        const totalActual = info.records.reduce(
          (s, r) => s + Number(r.actualCost ?? 0),
          0,
        );

        if (totalActual < minCost) continue;

        const costVariance = totalEstimated - totalActual;
        const variancePercentage =
          totalEstimated > 0
            ? Math.round((costVariance / totalEstimated) * 1000) / 10
            : null;
        const avgCostPerRequest =
          info.records.length > 0
            ? Math.round((totalActual / info.records.length) * 100) / 100
            : 0;

        const purchasePriceNum = info.purchasePrice
          ? Number(info.purchasePrice)
          : null;
        const costToValueRatio =
          purchasePriceNum && purchasePriceNum > 0
            ? Math.round((totalActual / purchasePriceNum) * 1000) / 10
            : null;

        let costByType: AssetCostByTypeDto[] | undefined;
        if (filters.includeTypeBreakdown) {
          const typeMap = new Map<
            string,
            { requestCount: number; estimatedCost: number; actualCost: number }
          >();
          for (const r of info.records) {
            const t = r.maintenanceType;
            const existing = typeMap.get(t);
            if (existing) {
              existing.requestCount += 1;
              existing.estimatedCost += Number(r.estimatedCost ?? 0);
              existing.actualCost += Number(r.actualCost ?? 0);
            } else {
              typeMap.set(t, {
                requestCount: 1,
                estimatedCost: Number(r.estimatedCost ?? 0),
                actualCost: Number(r.actualCost ?? 0),
              });
            }
          }
          costByType = Array.from(typeMap.entries()).map(
            ([maintenanceType, v]) => ({
              maintenanceType,
              requestCount: v.requestCount,
              estimatedCost: Math.round(v.estimatedCost * 100) / 100,
              actualCost: Math.round(v.actualCost * 100) / 100,
            }),
          );
        }

        items.push({
          assetId,
          assetNumber: info.assetNumber,
          assetName: info.assetName,
          assetType: info.assetType,
          requestCount: info.records.length,
          totalEstimated: Math.round(totalEstimated * 100) / 100,
          totalActual: Math.round(totalActual * 100) / 100,
          costVariance: Math.round(costVariance * 100) / 100,
          variancePercentage,
          avgCostPerRequest,
          purchasePrice: purchasePriceNum,
          costToValueRatio,
          costByType,
        });
      }

      // Sort
      this.sortItems(items, filters.sortBy, filters.sortOrder);
      const { page, limit, startIndex, endIndex } = this.getPagination(filters);
      const paginatedItems = items.slice(startIndex, endIndex);

      const summary = this.buildSummary(items);

      return {
        assets: paginatedItems,
        summary,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: items.length,
          totalPages: Math.ceil(items.length / limit),
          hasNextPage: endIndex < items.length,
          hasPreviousPage: page > 1,
        },
        currency: 'SAR',
        generatedAt: new Date().toISOString(),
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate cost per asset report: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private buildWhereClause(
    filters: MaintenanceCostPerAssetFiltersDto,
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

  private sortItems(
    items: AssetCostItemDto[],
    sortBy?: string,
    sortOrder?: string,
  ): void {
    const dir = sortOrder === 'asc' ? 1 : -1;

    items.sort((a, b) => {
      switch (sortBy) {
        case 'totalCost':
          return (a.totalActual - b.totalActual) * dir;
        case 'avgCost':
          return (a.avgCostPerRequest - b.avgCostPerRequest) * dir;
        case 'assetName':
          return a.assetName.localeCompare(b.assetName) * dir;
        case 'requestCount':
          return (a.requestCount - b.requestCount) * dir;
        case 'costRatio':
          return ((a.costToValueRatio ?? 0) - (b.costToValueRatio ?? 0)) * dir;
        default:
          return b.totalActual - a.totalActual;
      }
    });
  }

  private buildSummary(items: AssetCostItemDto[]): CostPerAssetSummaryDto {
    if (items.length === 0) {
      return {
        totalAssets: 0,
        grandTotalActual: 0,
        grandTotalEstimated: 0,
        totalVariance: 0,
        avgCostPerAsset: 0,
      };
    }

    const grandTotalActual =
      Math.round(items.reduce((s, i) => s + i.totalActual, 0) * 100) / 100;
    const grandTotalEstimated =
      Math.round(items.reduce((s, i) => s + i.totalEstimated, 0) * 100) / 100;
    const totalVariance =
      Math.round((grandTotalEstimated - grandTotalActual) * 100) / 100;
    const avgCostPerAsset =
      Math.round((grandTotalActual / items.length) * 100) / 100;

    const mostExpensive = items.reduce(
      (max, i) => (i.totalActual > max.totalActual ? i : max),
      items[0],
    );

    return {
      totalAssets: items.length,
      grandTotalActual,
      grandTotalEstimated,
      totalVariance,
      avgCostPerAsset,
      mostExpensiveAssetName: mostExpensive.assetName,
    };
  }

  private getPagination(filters: MaintenanceCostPerAssetFiltersDto) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return { page, limit, startIndex, endIndex };
  }
}
