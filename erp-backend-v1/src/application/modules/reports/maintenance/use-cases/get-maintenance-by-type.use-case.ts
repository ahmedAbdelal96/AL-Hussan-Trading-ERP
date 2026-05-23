import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  MaintenanceByTypeFiltersDto,
  MaintenanceByTypeResponseDto,
  MaintenanceTypeBreakdownDto,
  TopAssetForTypeDto,
} from '../dto';
import {
  MaintenanceType,
  MaintenanceStatus,
  AssetType,
  Prisma,
} from '@prisma/client';

/**
 * Use Case: Get Maintenance By Type Report
 *
 * Analyzes maintenance patterns across 4 maintenance types to optimize
 * maintenance strategy and resource allocation.
 *
 * Business Value:
 * - Identify which types dominate (high corrective = poor preventive)
 * - Optimize resource allocation by type
 * - Track cost efficiency per maintenance type
 * - Plan staffing based on type frequency
 *
 * Performance Optimization:
 * - Parallel queries for each maintenance type
 * - Efficient asset aggregation with groupBy
 * - Optional top assets only queried when requested
 */
@Injectable()
export class GetMaintenanceByTypeUseCase {
  private readonly logger = new Logger(GetMaintenanceByTypeUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute the maintenance by type report generation
   */
  async execute(
    filters: MaintenanceByTypeFiltersDto,
  ): Promise<MaintenanceByTypeResponseDto> {
    this.logger.log('Generating maintenance by type report');

    try {
      const whereClause = this.buildWhereClause(filters);

      // Get total count for percentage calculations
      const totalCount = await this.prisma.maintenanceRequest.count({
        where: whereClause,
      });

      // Get breakdown by type
      const breakdown = await this.getTypeBreakdown(
        whereClause,
        totalCount,
        filters,
      );

      // Apply filters and sorting
      let filteredBreakdown = breakdown;

      if (filters.minRequests) {
        filteredBreakdown = breakdown.filter(
          (item) => item.count >= filters.minRequests!,
        );
      }

      // Sort results
      filteredBreakdown = this.sortBreakdown(
        filteredBreakdown,
        filters.sortBy,
        filters.sortOrder,
      );

      // Determine date range for response
      const startDate =
        filters.startDate || new Date(0).toISOString().split('T')[0];
      const endDate = filters.endDate || new Date().toISOString().split('T')[0];

      return {
        totalRequests: totalCount,
        breakdown: filteredBreakdown,
        startDate,
        endDate,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate maintenance by type report: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(
    filters: MaintenanceByTypeFiltersDto,
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

    if (filters.status) {
      where.status = filters.status;
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

  /**
   * Get detailed breakdown by maintenance type
   */
  private async getTypeBreakdown(
    whereClause: Prisma.MaintenanceRequestWhereInput,
    totalCount: number,
    filters: MaintenanceByTypeFiltersDto,
  ): Promise<MaintenanceTypeBreakdownDto[]> {
    const types = Object.values(MaintenanceType);

    // Query all types in parallel
    const breakdownPromises = types.map(async (type) => {
      const typeWhere: Prisma.MaintenanceRequestWhereInput = {
        ...whereClause,
        maintenanceType: type,
      };

      // Get counts and cost aggregations
      const [countData, costData, completedData] = await Promise.all([
        this.prisma.maintenanceRequest.count({ where: typeWhere }),
        this.prisma.maintenanceRequest.aggregate({
          where: typeWhere,
          _sum: {
            estimatedCost: true,
            actualCost: true,
          },
        }),
        this.prisma.maintenanceRequest.findMany({
          where: {
            ...typeWhere,
            status: MaintenanceStatus.COMPLETED,
            startedAt: { not: null },
            completedAt: { not: null },
          },
          select: {
            startedAt: true,
            completedAt: true,
          },
        }),
      ]);

      // Calculate average duration for completed requests
      let avgDuration = 0;
      if (completedData.length > 0) {
        const totalDays = completedData.reduce((sum, req) => {
          const start = new Date(req.startedAt!);
          const end = new Date(req.completedAt!);
          const days =
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0);
        avgDuration = Math.round((totalDays / completedData.length) * 10) / 10;
      }

      const count = countData;
      const completedCount = completedData.length;
      const estimatedCost = Number(costData._sum.estimatedCost || 0);
      const actualCost = Number(costData._sum.actualCost || 0);
      const costVariance = estimatedCost - actualCost;
      const costVariancePercentage =
        estimatedCost > 0
          ? Math.round((costVariance / estimatedCost) * 1000) / 10
          : 0;
      const completionRate =
        count > 0 ? Math.round((completedCount / count) * 1000) / 10 : 0;

      // Get top assets if requested
      let topAssets: TopAssetForTypeDto[] | undefined;
      if (filters.includeTopAssets) {
        topAssets = await this.getTopAssetsForType(typeWhere);
      }

      return {
        type,
        count,
        percentage:
          totalCount > 0 ? Math.round((count / totalCount) * 1000) / 10 : 0,
        totalEstimatedCost: estimatedCost,
        totalActualCost: actualCost,
        costVariance,
        costVariancePercentage,
        averageDuration: avgDuration,
        completedCount,
        completionRate,
        topAssets,
      };
    });

    const results = await Promise.all(breakdownPromises);

    // Filter out types with zero count
    return results.filter((item) => item.count > 0);
  }

  /**
   * Get top 5 assets for a specific maintenance type
   */
  private async getTopAssetsForType(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<TopAssetForTypeDto[]> {
    const assetCounts = await this.prisma.maintenanceRequest.groupBy({
      by: ['assetId'],
      where: whereClause,
      _count: true,
      _sum: {
        actualCost: true,
      },
      orderBy: {
        _count: {
          assetId: 'desc',
        },
      },
      take: 5,
    });

    // Get asset details
    const assetIds = assetCounts.map((item) => item.assetId);
    const assets = await this.prisma.asset.findMany({
      where: {
        id: { in: assetIds },
      },
      select: {
        id: true,
        assetNumber: true,
        name: true,
        assetType: true,
      },
    });

    // Map to response DTOs
    return assetCounts.map((item) => {
      const asset = assets.find((a) => a.id === item.assetId);
      if (!asset) {
        return {
          assetId: item.assetId,
          assetNumber: 'N/A',
          assetName: 'Unknown',
          assetType: AssetType.OTHER,
          maintenanceCount: item._count,
          totalCost: Number(item._sum.actualCost || 0),
        };
      }
      return {
        assetId: item.assetId,
        assetNumber: asset.assetNumber,
        assetName: asset.name,
        assetType: asset.assetType,
        maintenanceCount: item._count,
        totalCost: Number(item._sum.actualCost || 0),
      };
    });
  }

  /**
   * Sort breakdown based on sort criteria
   */
  private sortBreakdown(
    breakdown: MaintenanceTypeBreakdownDto[],
    sortBy?: 'count' | 'cost' | 'duration' | 'type',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): MaintenanceTypeBreakdownDto[] {
    const sorted = [...breakdown];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'count':
          comparison = a.count - b.count;
          break;
        case 'cost':
          comparison = a.totalActualCost - b.totalActualCost;
          break;
        case 'duration':
          comparison = a.averageDuration - b.averageDuration;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          comparison = a.count - b.count;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }
}
