import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  MaintenanceByAssetFiltersDto,
  MaintenanceByAssetResponseDto,
  AssetMaintenanceBreakdownDto,
  MaintenanceHistoryEntryDto,
} from '../dto';
import { MaintenanceType, Prisma } from '@prisma/client';

/**
 * Use Case: Get Maintenance By Asset Report
 *
 * Asset-centric maintenance analysis for lifecycle management
 * and maintenance budgeting decisions.
 *
 * Business Value:
 * - Identify high-maintenance assets for replacement
 * - Track maintenance patterns per asset
 * - Budget allocation by asset
 * - Warranty and lifecycle planning
 */
@Injectable()
export class GetMaintenanceByAssetUseCase {
  private readonly logger = new Logger(GetMaintenanceByAssetUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: MaintenanceByAssetFiltersDto,
  ): Promise<MaintenanceByAssetResponseDto> {
    this.logger.log('Generating maintenance by asset report');

    try {
      const whereClause = this.buildWhereClause(filters);

      // Get asset maintenance counts
      const assetCounts = await this.prisma.maintenanceRequest.groupBy({
        by: ['assetId'],
        where: whereClause,
        _count: true,
        _sum: {
          actualCost: true,
        },
      });

      // Filter by frequency if specified
      let filteredAssets = assetCounts;
      if (filters.minFrequency) {
        filteredAssets = assetCounts.filter(
          (item) => item._count >= filters.minFrequency!,
        );
      }

      // Get detailed breakdown for each asset
      const breakdown = await this.getAssetBreakdown(
        filteredAssets,
        whereClause,
        filters,
      );

      // Sort results
      const sortedBreakdown = this.sortBreakdown(breakdown, filters.sortBy);
      const { page, limit, startIndex, endIndex } = this.getPagination(filters);
      const paginatedBreakdown = sortedBreakdown.slice(startIndex, endIndex);

      const totalRequests = assetCounts.reduce(
        (sum, item) => sum + item._count,
        0,
      );
      const avgFrequency =
        assetCounts.length > 0
          ? Math.round((totalRequests / assetCounts.length) * 100) / 100
          : 0;

      const startDate =
        filters.startDate || new Date(0).toISOString().split('T')[0];
      const endDate = filters.endDate || new Date().toISOString().split('T')[0];

      return {
        totalAssets: assetCounts.length,
        totalMaintenanceRequests: totalRequests,
        breakdown: paginatedBreakdown,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: sortedBreakdown.length,
          totalPages: Math.ceil(sortedBreakdown.length / limit),
          hasNextPage: endIndex < sortedBreakdown.length,
          hasPreviousPage: page > 1,
        },
        averageMaintenanceFrequency: avgFrequency,
        startDate,
        endDate,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate maintenance by asset report: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private buildWhereClause(
    filters: MaintenanceByAssetFiltersDto,
  ): Prisma.MaintenanceRequestWhereInput {
    const where: Prisma.MaintenanceRequestWhereInput = {};

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    if (filters.maintenanceType) {
      where.maintenanceType = filters.maintenanceType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.assetType) {
      where.asset = { assetType: filters.assetType };
    }

    if (filters.assetId) {
      where.assetId = filters.assetId;
    }

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    if (filters.vendor) {
      where.vendor = {
        contains: filters.vendor,
        mode: 'insensitive' as Prisma.QueryMode,
      };
    }

    return where;
  }

  private async getAssetBreakdown(
    assetCounts: Array<{
      assetId: string;
      _count: number;
      _sum: { actualCost: any };
    }>,
    whereClause: Prisma.MaintenanceRequestWhereInput,
    filters: MaintenanceByAssetFiltersDto,
  ): Promise<AssetMaintenanceBreakdownDto[]> {
    const assetIds = assetCounts.map((item) => item.assetId);

    // Get asset details
    const assets = await this.prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: {
        id: true,
        assetNumber: true,
        name: true,
        assetType: true,
        purchasePrice: true,
      },
    });

    // Build breakdown for each asset
    const breakdownPromises = assetCounts.map(async (item) => {
      const asset = assets.find((a) => a.id === item.assetId);
      if (!asset) return null;

      const assetWhere: Prisma.MaintenanceRequestWhereInput = {
        ...whereClause,
        assetId: item.assetId,
      };

      // Get type counts
      const [preventiveCount, correctiveCount, lastMaintenance] =
        await Promise.all([
          this.prisma.maintenanceRequest.count({
            where: {
              ...assetWhere,
              maintenanceType: MaintenanceType.PREVENTIVE,
            },
          }),
          this.prisma.maintenanceRequest.count({
            where: {
              ...assetWhere,
              maintenanceType: MaintenanceType.CORRECTIVE,
            },
          }),
          this.prisma.maintenanceRequest.findFirst({
            where: assetWhere,
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
        ]);

      const totalCost = Number(item._sum.actualCost || 0);
      const maintenanceCount = item._count;
      const avgCostPerMaintenance =
        maintenanceCount > 0
          ? Math.round((totalCost / maintenanceCount) * 100) / 100
          : 0;

      const lastMaintenanceDate = lastMaintenance?.createdAt || new Date();
      const now = new Date();
      const daysSince = Math.floor(
        (now.getTime() - new Date(lastMaintenanceDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // Cost to value ratio
      let assetValue: number | undefined;
      let costToValueRatio: number | undefined;
      if (filters.includeCostRatio && asset.purchasePrice) {
        assetValue = Number(asset.purchasePrice);
        costToValueRatio =
          assetValue > 0 ? Math.round((totalCost / assetValue) * 1000) / 10 : 0;
      }

      // Recent history
      let recentHistory: MaintenanceHistoryEntryDto[] | undefined;
      if (filters.includeHistory) {
        recentHistory = await this.getRecentHistory(assetWhere);
      }

      return {
        assetId: item.assetId,
        assetNumber: asset.assetNumber,
        assetName: asset.name,
        assetType: asset.assetType,
        maintenanceCount,
        totalCost,
        averageCostPerMaintenance: avgCostPerMaintenance,
        lastMaintenanceDate,
        daysSinceLastMaintenance: daysSince,
        preventiveCount,
        correctiveCount,
        assetValue,
        costToValueRatio,
        recentHistory,
      };
    });

    const results = await Promise.all(breakdownPromises);
    return results.filter(
      (item) => item !== null,
    ) as AssetMaintenanceBreakdownDto[];
  }

  private async getRecentHistory(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<MaintenanceHistoryEntryDto[]> {
    const recent = await this.prisma.maintenanceRequest.findMany({
      where: whereClause,
      select: {
        maintenanceNumber: true,
        maintenanceType: true,
        status: true,
        createdAt: true,
        actualCost: true,
        description: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return recent.map((req) => ({
      maintenanceNumber: req.maintenanceNumber,
      type: req.maintenanceType,
      status: req.status,
      date: req.createdAt,
      cost: Number(req.actualCost || 0),
      description: req.description || 'N/A',
    }));
  }

  private sortBreakdown(
    breakdown: AssetMaintenanceBreakdownDto[],
    sortBy?: 'frequency' | 'cost' | 'lastMaintenance' | 'assetName',
  ): AssetMaintenanceBreakdownDto[] {
    const sorted = [...breakdown];

    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'frequency':
          return b.maintenanceCount - a.maintenanceCount;
        case 'cost':
          return b.totalCost - a.totalCost;
        case 'lastMaintenance':
          return (
            new Date(b.lastMaintenanceDate).getTime() -
            new Date(a.lastMaintenanceDate).getTime()
          );
        case 'assetName':
          return a.assetName.localeCompare(b.assetName);
        default:
          return b.maintenanceCount - a.maintenanceCount;
      }
    });

    return sorted;
  }

  private getPagination(filters: MaintenanceByAssetFiltersDto) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return { page, limit, startIndex, endIndex };
  }
}
