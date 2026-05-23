/**
 * ============================================================================
 * GET ASSETS OVERVIEW USE CASE
 * ============================================================================
 *
 * Business logic for generating comprehensive assets overview report.
 * Provides key performance indicators and dashboard metrics.
 *
 * @module GetAssetsOverviewUseCase
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { AssetStatus } from '@prisma/client';
import {
  AssetsOverviewFiltersDto,
  AssetsOverviewResponseDto,
  PeriodComparisonDto,
  WarrantyStatusDto,
} from '../dto';

@Injectable()
export class GetAssetsOverviewUseCase {
  private readonly logger = new Logger(GetAssetsOverviewUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute assets overview report
   */
  async execute(
    filters: AssetsOverviewFiltersDto,
  ): Promise<AssetsOverviewResponseDto> {
    try {
      this.logger.log('Generating assets overview report...');

      // Build common filters
      const whereClause = this.buildWhereClause(filters);

      // Execute parallel queries for performance
      const [
        totalMetrics,
        statusBreakdown,
        newAcquisitions,
        retirements,
        utilizationData,
        comparison,
        warrantyStatus,
      ] = await Promise.all([
        this.getTotalMetrics(whereClause),
        this.getStatusBreakdown(whereClause),
        this.getNewAcquisitions(filters),
        this.getRetirements(filters),
        this.getUtilizationData(whereClause),
        filters.includeComparison
          ? this.getPeriodComparison(filters)
          : Promise.resolve(undefined),
        filters.includeWarrantyStatus
          ? this.getWarrantyStatus(whereClause)
          : Promise.resolve(undefined),
      ]);

      // Calculate derived metrics
      const totalDepreciation = this.calculateTotalDepreciation(
        Number(totalMetrics.totalValue),
      );

      const response: AssetsOverviewResponseDto = {
        totalAssets: totalMetrics.totalAssets,
        totalValue: Number(totalMetrics.totalValue),
        averageValue: Number(totalMetrics.averageValue),
        availableAssets: statusBreakdown.available,
        assetsInUse: statusBreakdown.inUse,
        assetsUnderMaintenance: statusBreakdown.underMaintenance,
        assetsOutOfService: statusBreakdown.outOfService,
        retiredAssets: statusBreakdown.retired,
        newAcquisitions: newAcquisitions.count,
        newAcquisitionsValue: Number(newAcquisitions.totalValue),
        assetsRetiredThisPeriod: retirements,
        utilizationRate: utilizationData.utilizationRate,
        maintenanceRate: utilizationData.maintenanceRate,
        availabilityRate: utilizationData.availabilityRate,
        totalDepreciation,
        comparison,
        warrantyStatus,
      };

      this.logger.log('Assets overview report generated successfully');
      return response;
    } catch (error) {
      this.logger.error('Error generating assets overview report', error);
      throw error;
    }
  }

  /**
   * Build WHERE clause from filters
   */
  private buildWhereClause(filters: AssetsOverviewFiltersDto): any {
    const where: any = {
      deletedAt: null, // Exclude soft-deleted assets
    };

    // Date range filter (purchase date)
    if (filters.startDate || filters.endDate) {
      where.purchaseDate = {};
      if (filters.startDate) {
        where.purchaseDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.purchaseDate.lte = filters.endDate;
      }
    }

    // Asset type filter
    if (filters.assetType) {
      where.assetType = filters.assetType;
    }

    // Status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Location filter (partial match)
    if (filters.location) {
      where.currentLocation = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    // Category filter
    if (filters.category) {
      where.category = filters.category;
    }

    // Manufacturer filter
    if (filters.manufacturer) {
      where.manufacturer = filters.manufacturer;
    }

    return where;
  }

  /**
   * Get total assets metrics
   */
  private async getTotalMetrics(whereClause: any) {
    const result = await this.prisma.asset.aggregate({
      where: whereClause,
      _count: { id: true },
      _sum: { purchasePrice: true },
      _avg: { purchasePrice: true },
    });

    return {
      totalAssets: result._count.id,
      totalValue: result._sum.purchasePrice || 0,
      averageValue: result._avg.purchasePrice || 0,
    };
  }

  /**
   * Get status breakdown
   */
  private async getStatusBreakdown(whereClause: any) {
    const statusCounts = await this.prisma.asset.groupBy({
      where: whereClause,
      by: ['status'],
      _count: { id: true },
    });

    const breakdown = {
      available: 0,
      inUse: 0,
      underMaintenance: 0,
      outOfService: 0,
      retired: 0,
    };

    statusCounts.forEach((item) => {
      switch (item.status) {
        case AssetStatus.AVAILABLE:
          breakdown.available = item._count.id;
          break;
        case AssetStatus.IN_USE:
          breakdown.inUse = item._count.id;
          break;
        case AssetStatus.UNDER_MAINTENANCE:
          breakdown.underMaintenance = item._count.id;
          break;
        case AssetStatus.OUT_OF_SERVICE:
          breakdown.outOfService = item._count.id;
          break;
        case AssetStatus.RETIRED:
          breakdown.retired = item._count.id;
          break;
      }
    });

    return breakdown;
  }

  /**
   * Get new acquisitions in period
   */
  private async getNewAcquisitions(filters: AssetsOverviewFiltersDto) {
    const where: any = { deletedAt: null };

    // Use date range for acquisition filtering
    if (filters.startDate || filters.endDate) {
      where.purchaseDate = {};
      if (filters.startDate) {
        where.purchaseDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.purchaseDate.lte = filters.endDate;
      }
    }

    const result = await this.prisma.asset.aggregate({
      where,
      _count: { id: true },
      _sum: { purchasePrice: true },
    });

    return {
      count: result._count.id,
      totalValue: result._sum.purchasePrice || 0,
    };
  }

  /**
   * Get assets retired in period
   */
  private async getRetirements(
    filters: AssetsOverviewFiltersDto,
  ): Promise<number> {
    const where: any = {
      status: AssetStatus.RETIRED,
    };

    // Use date range for retirement filtering
    if (filters.startDate || filters.endDate) {
      where.updatedAt = {};
      if (filters.startDate) {
        where.updatedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.updatedAt.lte = filters.endDate;
      }
    }

    const count = await this.prisma.asset.count({ where });
    return count;
  }

  /**
   * Get utilization data
   */
  private async getUtilizationData(whereClause: any) {
    const totalAssets = await this.prisma.asset.count({
      where: whereClause,
    });

    const assetsInUse = await this.prisma.asset.count({
      where: {
        ...whereClause,
        status: AssetStatus.IN_USE,
      },
    });

    const assetsUnderMaintenance = await this.prisma.asset.count({
      where: {
        ...whereClause,
        status: AssetStatus.UNDER_MAINTENANCE,
      },
    });

    const availableAssets = await this.prisma.asset.count({
      where: {
        ...whereClause,
        status: AssetStatus.AVAILABLE,
      },
    });

    // Calculate rates
    const utilizationRate =
      totalAssets > 0 ? (assetsInUse / totalAssets) * 100 : 0;

    const maintenanceRate =
      totalAssets > 0 ? (assetsUnderMaintenance / totalAssets) * 100 : 0;

    const availabilityRate =
      totalAssets > 0
        ? ((availableAssets + assetsInUse) / totalAssets) * 100
        : 0;

    return {
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      maintenanceRate: Math.round(maintenanceRate * 10) / 10,
      availabilityRate: Math.round(availabilityRate * 10) / 10,
    };
  }

  /**
   * Get period comparison data
   */
  private async getPeriodComparison(
    filters: AssetsOverviewFiltersDto,
  ): Promise<PeriodComparisonDto | undefined> {
    if (!filters.startDate || !filters.endDate) {
      return undefined;
    }

    // Calculate previous period
    const periodLength =
      filters.endDate.getTime() - filters.startDate.getTime();
    const previousStartDate = new Date(
      filters.startDate.getTime() - periodLength,
    );
    const previousEndDate = new Date(filters.startDate.getTime());

    const previousWhere = {
      ...this.buildWhereClause(filters),
      purchaseDate: {
        gte: previousStartDate,
        lte: previousEndDate,
      },
    };

    const previousMetrics = await this.getTotalMetrics(previousWhere);

    const currentWhere = this.buildWhereClause(filters);
    const currentMetrics = await this.getTotalMetrics(currentWhere);

    const assetChange =
      currentMetrics.totalAssets - previousMetrics.totalAssets;
    const valueChange =
      Number(currentMetrics.totalValue) - Number(previousMetrics.totalValue);

    const assetChangePercentage =
      previousMetrics.totalAssets > 0
        ? (assetChange / previousMetrics.totalAssets) * 100
        : 0;

    const valueChangePercentage =
      Number(previousMetrics.totalValue) > 0
        ? (valueChange / Number(previousMetrics.totalValue)) * 100
        : 0;

    return {
      totalAssets: previousMetrics.totalAssets,
      totalValue: Number(previousMetrics.totalValue),
      assetChange,
      valueChange,
      assetChangePercentage: Math.round(assetChangePercentage * 100) / 100,
      valueChangePercentage: Math.round(valueChangePercentage * 100) / 100,
    };
  }

  /**
   * Get warranty status breakdown
   */
  private async getWarrantyStatus(
    whereClause: any,
  ): Promise<WarrantyStatusDto | undefined> {
    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const [activeWarranty, expiredWarranty, expiringSoon, noWarranty] =
      await Promise.all([
        // Active warranty
        this.prisma.asset.count({
          where: {
            ...whereClause,
            warrantyExpiry: { gt: now },
          },
        }),

        // Expired warranty
        this.prisma.asset.count({
          where: {
            ...whereClause,
            warrantyExpiry: { lte: now },
          },
        }),

        // Expiring soon (within 90 days)
        this.prisma.asset.count({
          where: {
            ...whereClause,
            warrantyExpiry: {
              gt: now,
              lte: ninetyDaysFromNow,
            },
          },
        }),

        // No warranty information
        this.prisma.asset.count({
          where: {
            ...whereClause,
            warrantyExpiry: null,
          },
        }),
      ]);

    return {
      activeWarranty,
      expiredWarranty,
      expiringSoon,
      noWarranty,
    };
  }

  /**
   * Calculate total depreciation (simple straight-line method)
   * Assuming 20% annual depreciation rate
   */
  private calculateTotalDepreciation(totalValue: number): number {
    // Simple estimation: 20% annual depreciation
    // This is a simplified calculation; actual depreciation
    // should be calculated per asset based on age and type
    const estimatedDepreciationRate = 0.12; // 12% average
    return Math.round(totalValue * estimatedDepreciationRate);
  }
}
