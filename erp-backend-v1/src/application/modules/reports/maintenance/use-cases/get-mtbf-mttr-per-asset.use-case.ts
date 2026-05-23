import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  MaintenanceMtbfMttrFiltersDto,
  MaintenanceMtbfMttrResponseDto,
  AssetMtbfMttrItemDto,
  MtbfMttrSummaryDto,
} from '../dto';
import { MaintenanceStatus, Prisma } from '@prisma/client';

/**
 * Use Case: Get MTBF/MTTR Per Asset Report
 *
 * Calculates Mean Time Between Failures (MTBF) and Mean Time To Repair (MTTR)
 * broken down per individual asset — the per-asset complement to the global
 * performance report which only returns aggregate values.
 *
 * MTTR: avg(completedAt - startedAt) for COMPLETED requests with both dates
 * MTBF: avg gap between consecutive completedAt dates (proxy for failures)
 *
 * Reliability Score: clamp(mtbf / (mtbf + mttr) * 100, 0, 100)
 *   → 100 = rarely breaks + fast to fix
 *   → 0   = breaks often or takes forever to fix
 */
@Injectable()
export class GetMtbfMttrPerAssetUseCase {
  private readonly logger = new Logger(GetMtbfMttrPerAssetUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: MaintenanceMtbfMttrFiltersDto,
  ): Promise<MaintenanceMtbfMttrResponseDto> {
    this.logger.log('Generating MTBF/MTTR per asset report');

    try {
      const baseWhere = this.buildWhereClause(filters);
      const completedWhere: Prisma.MaintenanceRequestWhereInput = {
        ...baseWhere,
        status: MaintenanceStatus.COMPLETED,
      };

      // Fetch completed requests (for MTBF/MTTR) and all requests (for total count)
      const [completedRequests, allRequests] = await Promise.all([
        this.prisma.maintenanceRequest.findMany({
          where: completedWhere,
          select: {
            assetId: true,
            startedAt: true,
            completedAt: true,
            createdAt: true,
            asset: {
              select: {
                assetNumber: true,
                name: true,
                assetType: true,
              },
            },
          },
          orderBy: { completedAt: 'asc' },
        }),
        this.prisma.maintenanceRequest.findMany({
          where: baseWhere,
          select: { assetId: true },
        }),
      ]);

      // Build total count map (all statuses)
      const totalCountMap = new Map<string, number>();
      for (const r of allRequests) {
        totalCountMap.set(r.assetId, (totalCountMap.get(r.assetId) ?? 0) + 1);
      }

      // Group completed requests by assetId
      const byAsset = new Map<
        string,
        {
          assetNumber: string;
          assetName: string;
          assetType: string;
          records: Array<{
            startedAt: Date | null;
            completedAt: Date | null;
            createdAt: Date;
          }>;
        }
      >();

      for (const r of completedRequests) {
        const existing = byAsset.get(r.assetId);
        if (existing) {
          existing.records.push({
            startedAt: r.startedAt,
            completedAt: r.completedAt,
            createdAt: r.createdAt,
          });
        } else {
          byAsset.set(r.assetId, {
            assetNumber: r.asset.assetNumber,
            assetName: r.asset.name,
            assetType: r.asset.assetType,
            records: [
              {
                startedAt: r.startedAt,
                completedAt: r.completedAt,
                createdAt: r.createdAt,
              },
            ],
          });
        }
      }

      const minCompleted = filters.minCompletedCount ?? 1;

      // Build asset items
      const items: AssetMtbfMttrItemDto[] = [];

      for (const [assetId, info] of byAsset.entries()) {
        const completedCount = info.records.length;
        if (completedCount < minCompleted) continue;

        const mttr = this.calcMttr(info.records);
        const mtbf = this.calcMtbf(info.records);
        const reliabilityScore = this.calcReliability(mtbf, mttr);

        // Sort records by createdAt for first/last dates
        const sortedByCreated = [...info.records].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        );
        const sortedByCompleted = info.records
          .filter((r) => r.completedAt)
          .sort(
            (a, b) =>
              new Date(a.completedAt!).getTime() -
              new Date(b.completedAt!).getTime(),
          );

        items.push({
          assetId,
          assetNumber: info.assetNumber,
          assetName: info.assetName,
          assetType: info.assetType,
          totalMaintenanceCount: totalCountMap.get(assetId) ?? completedCount,
          completedCount,
          mttr,
          mtbf,
          firstMaintenanceDate: sortedByCreated[0]?.createdAt.toISOString(),
          lastMaintenanceDate:
            sortedByCompleted[
              sortedByCompleted.length - 1
            ]?.completedAt?.toISOString(),
          reliabilityScore,
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
        generatedAt: new Date().toISOString(),
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate MTBF/MTTR per asset report: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private buildWhereClause(
    filters: MaintenanceMtbfMttrFiltersDto,
  ): Prisma.MaintenanceRequestWhereInput {
    const where: Prisma.MaintenanceRequestWhereInput = {};

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }
    if (filters.maintenanceType)
      where.maintenanceType = filters.maintenanceType;
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

  private calcMttr(
    records: Array<{ startedAt: Date | null; completedAt: Date | null }>,
  ): number {
    const eligible = records.filter((r) => r.startedAt && r.completedAt);
    if (eligible.length === 0) return 0;

    const totalDays = eligible.reduce((sum, r) => {
      const days =
        (new Date(r.completedAt!).getTime() -
          new Date(r.startedAt!).getTime()) /
        (1000 * 60 * 60 * 24);
      return sum + Math.max(0, days);
    }, 0);

    return Math.round((totalDays / eligible.length) * 10) / 10;
  }

  private calcMtbf(records: Array<{ completedAt: Date | null }>): number {
    const sorted = records
      .filter((r) => r.completedAt)
      .map((r) => new Date(r.completedAt!).getTime())
      .sort((a, b) => a - b);

    if (sorted.length < 2) return 0;

    let totalGap = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalGap += (sorted[i] - sorted[i - 1]) / (1000 * 60 * 60 * 24);
    }

    return Math.round((totalGap / (sorted.length - 1)) * 10) / 10;
  }

  private calcReliability(mtbf: number, mttr: number): number {
    if (mtbf === 0) return 0;
    const raw = (mtbf / (mtbf + mttr)) * 100;
    return Math.round(Math.min(100, Math.max(0, raw)) * 10) / 10;
  }

  private sortItems(
    items: AssetMtbfMttrItemDto[],
    sortBy?: string,
    sortOrder?: string,
  ): void {
    const dir = sortOrder === 'asc' ? 1 : -1;

    items.sort((a, b) => {
      switch (sortBy) {
        case 'mttr':
          return (a.mttr - b.mttr) * dir;
        case 'mtbf':
          return (a.mtbf - b.mtbf) * dir;
        case 'assetName':
          return a.assetName.localeCompare(b.assetName) * dir;
        case 'failureCount':
          return (a.completedCount - b.completedCount) * dir;
        default:
          // Default: highest reliability score first
          return b.reliabilityScore - a.reliabilityScore;
      }
    });
  }

  private buildSummary(items: AssetMtbfMttrItemDto[]): MtbfMttrSummaryDto {
    if (items.length === 0) {
      return {
        totalAssets: 0,
        avgMttr: 0,
        avgMtbf: 0,
        avgReliabilityScore: 0,
      };
    }

    const mttrItems = items.filter((i) => i.completedCount >= 1);
    const mtbfItems = items.filter((i) => i.mtbf > 0);

    const avgMttr =
      mttrItems.length > 0
        ? Math.round(
            (mttrItems.reduce((s, i) => s + i.mttr, 0) / mttrItems.length) * 10,
          ) / 10
        : 0;

    const avgMtbf =
      mtbfItems.length > 0
        ? Math.round(
            (mtbfItems.reduce((s, i) => s + i.mtbf, 0) / mtbfItems.length) * 10,
          ) / 10
        : 0;

    const avgReliabilityScore =
      Math.round(
        (items.reduce((s, i) => s + i.reliabilityScore, 0) / items.length) * 10,
      ) / 10;

    return {
      totalAssets: items.length,
      avgMttr,
      avgMtbf,
      avgReliabilityScore,
    };
  }

  private getPagination(filters: MaintenanceMtbfMttrFiltersDto) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return { page, limit, startIndex, endIndex };
  }
}
