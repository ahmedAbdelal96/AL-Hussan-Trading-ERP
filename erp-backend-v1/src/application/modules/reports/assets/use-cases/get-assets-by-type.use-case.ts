/**
 * ============================================================================
 * GET ASSETS BY TYPE USE CASE
 * ============================================================================
 *
 * Business logic for generating assets breakdown by type report.
 * Analyzes asset distribution across different types with value and status metrics.
 *
 * @module GetAssetsByTypeUseCase
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { AssetType } from '@prisma/client';
import {
  AssetsByTypeFiltersDto,
  AssetsByTypeResponseDto,
  AssetTypeBreakdownDto,
  StatusDistributionDto,
  TopManufacturerDto,
} from '../dto';

@Injectable()
export class GetAssetsByTypeUseCase {
  private readonly logger = new Logger(GetAssetsByTypeUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute assets by type report
   */
  async execute(
    filters: AssetsByTypeFiltersDto,
  ): Promise<AssetsByTypeResponseDto> {
    try {
      this.logger.log('Generating assets by type report...');

      // Build common filters
      const whereClause = this.buildWhereClause(filters);

      // Get total metrics first
      const totalMetrics = await this.getTotalMetrics(whereClause);

      // Get type breakdown with parallel queries
      const typeBreakdown = await this.getTypeBreakdown(
        whereClause,
        totalMetrics.totalAssets,
        filters,
      );

      // Apply minimum assets filter if specified
      let filteredBreakdown = typeBreakdown;
      if (filters.minAssets && filters.minAssets > 1) {
        filteredBreakdown = typeBreakdown.filter(
          (item) => item.assetCount >= (filters.minAssets || 1),
        );
      }

      // Sort results
      const sortedBreakdown = this.sortBreakdown(
        filteredBreakdown,
        filters.sortBy || 'assetCount',
        filters.sortOrder || 'desc',
      );

      // Find most common and highest value types
      const mostCommonType =
        sortedBreakdown.length > 0
          ? sortedBreakdown.reduce((prev, current) =>
              prev.assetCount > current.assetCount ? prev : current,
            ).assetType
          : AssetType.OTHER;

      const highestValueType =
        sortedBreakdown.length > 0
          ? sortedBreakdown.reduce((prev, current) =>
              prev.totalValue > current.totalValue ? prev : current,
            ).assetType
          : AssetType.OTHER;

      const response: AssetsByTypeResponseDto = {
        breakdown: sortedBreakdown,
        totalAssets: totalMetrics.totalAssets,
        totalValue: Number(totalMetrics.totalValue),
        mostCommonType,
        highestValueType,
      };

      this.logger.log('Assets by type report generated successfully');
      return response;
    } catch (error) {
      this.logger.error('Error generating assets by type report', error);
      throw error;
    }
  }

  /**
   * Build WHERE clause from filters
   */
  private buildWhereClause(filters: AssetsByTypeFiltersDto): any {
    const where: any = {
      deletedAt: null,
    };

    if (filters.startDate || filters.endDate) {
      where.purchaseDate = {};
      if (filters.startDate) where.purchaseDate.gte = filters.startDate;
      if (filters.endDate) where.purchaseDate.lte = filters.endDate;
    }

    if (filters.assetType) where.assetType = filters.assetType;
    if (filters.status) where.status = filters.status;

    if (filters.location) {
      where.currentLocation = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    if (filters.category) where.category = filters.category;
    if (filters.manufacturer) where.manufacturer = filters.manufacturer;

    return where;
  }

  /**
   * Get total metrics
   */
  private async getTotalMetrics(whereClause: any) {
    const result = await this.prisma.asset.aggregate({
      where: whereClause,
      _count: { id: true },
      _sum: { purchasePrice: true },
    });

    return {
      totalAssets: result._count.id,
      totalValue: result._sum.purchasePrice || 0,
    };
  }

  /**
   * Get type breakdown
   */
  private async getTypeBreakdown(
    whereClause: any,
    totalAssets: number,
    filters: AssetsByTypeFiltersDto,
  ): Promise<AssetTypeBreakdownDto[]> {
    // Get type aggregations
    const typeAggregations = await this.prisma.asset.groupBy({
      where: whereClause,
      by: ['assetType'],
      _count: { id: true },
      _sum: { purchasePrice: true },
      _avg: { purchasePrice: true },
    });

    // Build breakdown for each type
    const breakdown = await Promise.all(
      typeAggregations.map(async (typeAgg) => {
        const [statusDistribution, averageAge, topManufacturers] =
          await Promise.all([
            this.getStatusDistribution(whereClause, typeAgg.assetType),
            this.getAverageAge(whereClause, typeAgg.assetType),
            filters.includeManufacturers
              ? this.getTopManufacturers(whereClause, typeAgg.assetType)
              : Promise.resolve(undefined),
          ]);

        const assetCount = typeAgg._count.id;
        const totalValue = Number(typeAgg._sum.purchasePrice || 0);
        const averageValue = Number(typeAgg._avg.purchasePrice || 0);
        const percentage =
          totalAssets > 0 ? (assetCount / totalAssets) * 100 : 0;

        const breakdownItem: AssetTypeBreakdownDto = {
          assetType: typeAgg.assetType,
          assetCount,
          totalValue,
          percentage: Math.round(percentage * 100) / 100,
          averageValue: Math.round(averageValue * 100) / 100,
          averageAge: Math.round(averageAge * 10) / 10,
          statusDistribution,
          topManufacturers,
        };

        return breakdownItem;
      }),
    );

    return breakdown;
  }

  /**
   * Get status distribution for a type
   */
  private async getStatusDistribution(
    whereClause: any,
    assetType: AssetType,
  ): Promise<StatusDistributionDto[]> {
    const typeWhere = { ...whereClause, assetType };

    const totalForType = await this.prisma.asset.count({
      where: typeWhere,
    });

    const statusCounts = await this.prisma.asset.groupBy({
      where: typeWhere,
      by: ['status'],
      _count: { id: true },
    });

    return statusCounts.map((item) => ({
      status: item.status,
      count: item._count.id,
      percentage:
        totalForType > 0
          ? Math.round((item._count.id / totalForType) * 10000) / 100
          : 0,
    }));
  }

  /**
   * Get average age for a type
   */
  private async getAverageAge(
    whereClause: any,
    assetType: AssetType,
  ): Promise<number> {
    const assets = await this.prisma.asset.findMany({
      where: { ...whereClause, assetType },
      select: { purchaseDate: true },
    });

    if (assets.length === 0) return 0;

    const now = new Date();
    const totalAge = assets.reduce((sum, asset) => {
      if (!asset.purchaseDate) return sum;
      const ageInMs = now.getTime() - asset.purchaseDate.getTime();
      const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365);
      return sum + ageInYears;
    }, 0);

    return totalAge / assets.length;
  }

  /**
   * Get top manufacturers for a type
   */
  private async getTopManufacturers(
    whereClause: any,
    assetType: AssetType,
  ): Promise<TopManufacturerDto[]> {
    const manufacturers = await this.prisma.asset.groupBy({
      where: {
        ...whereClause,
        assetType,
        manufacturer: { not: null },
      },
      by: ['manufacturer'],
      _count: { id: true },
      _sum: { purchasePrice: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    return manufacturers.map((item) => ({
      manufacturer: item.manufacturer || 'Unknown',
      count: item._count.id,
      totalValue: Number(item._sum.purchasePrice || 0),
    }));
  }

  /**
   * Sort breakdown
   */
  private sortBreakdown(
    breakdown: AssetTypeBreakdownDto[],
    sortBy: string,
    sortOrder: string,
  ): AssetTypeBreakdownDto[] {
    const sorted = [...breakdown].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'assetCount':
          comparison = a.assetCount - b.assetCount;
          break;
        case 'totalValue':
          comparison = a.totalValue - b.totalValue;
          break;
        case 'assetType':
          comparison = a.assetType.localeCompare(b.assetType);
          break;
        default:
          comparison = a.assetCount - b.assetCount;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }
}
