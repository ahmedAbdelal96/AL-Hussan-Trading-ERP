/**
 * ============================================================================
 * GET ASSETS BY LOCATION USE CASE
 * ============================================================================
 *
 * Business logic for generating assets distribution by location report.
 * Analyzes geographic distribution with capacity and utilization insights.
 *
 * @module GetAssetsByLocationUseCase
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { AssetStatus } from '@prisma/client';
import {
  AssetsByLocationFiltersDto,
  AssetsByLocationResponseDto,
  LocationBreakdownDto,
  TypeDistributionDto,
} from '../dto';

@Injectable()
export class GetAssetsByLocationUseCase {
  private readonly logger = new Logger(GetAssetsByLocationUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute assets by location report
   */
  async execute(
    filters: AssetsByLocationFiltersDto,
  ): Promise<AssetsByLocationResponseDto> {
    try {
      this.logger.log('Generating assets by location report...');

      // Build common filters
      const whereClause = this.buildWhereClause(filters);

      // Get total metrics
      const totalMetrics = await this.getTotalMetrics(whereClause);

      // Get location breakdown
      let locationBreakdown = await this.getLocationBreakdown(
        whereClause,
        totalMetrics.totalAssets,
        filters,
      );

      // Apply minimum assets filter
      if (filters.minAssets && filters.minAssets > 1) {
        locationBreakdown = locationBreakdown.filter(
          (item) => item.assetCount >= (filters.minAssets || 1),
        );
      }

      // Sort results
      const sortedBreakdown = this.sortBreakdown(
        locationBreakdown,
        filters.sortBy || 'assetCount',
        filters.sortOrder || 'desc',
      );

      // Find top locations
      const topLocation =
        sortedBreakdown.length > 0
          ? sortedBreakdown.reduce((prev, current) =>
              prev.assetCount > current.assetCount ? prev : current,
            ).location
          : 'N/A';

      const highestValueLocation =
        sortedBreakdown.length > 0
          ? sortedBreakdown.reduce((prev, current) =>
              prev.totalValue > current.totalValue ? prev : current,
            ).location
          : 'N/A';

      const averageAssetsPerLocation =
        sortedBreakdown.length > 0
          ? totalMetrics.totalAssets / sortedBreakdown.length
          : 0;

      const response: AssetsByLocationResponseDto = {
        breakdown: sortedBreakdown,
        totalLocations: sortedBreakdown.length,
        totalAssets: totalMetrics.totalAssets,
        totalValue: Number(totalMetrics.totalValue),
        topLocation,
        highestValueLocation,
        averageAssetsPerLocation:
          Math.round(averageAssetsPerLocation * 100) / 100,
      };

      this.logger.log('Assets by location report generated successfully');
      return response;
    } catch (error) {
      this.logger.error('Error generating assets by location report', error);
      throw error;
    }
  }

  /**
   * Build WHERE clause from filters
   */
  private buildWhereClause(filters: AssetsByLocationFiltersDto): any {
    const where: any = {
      deletedAt: null,
      currentLocation: { not: null }, // Only include assets with location
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
   * Get location breakdown
   */
  private async getLocationBreakdown(
    whereClause: any,
    totalAssets: number,
    filters: AssetsByLocationFiltersDto,
  ): Promise<LocationBreakdownDto[]> {
    // Get location aggregations
    const locationAggregations = await this.prisma.asset.groupBy({
      where: whereClause,
      by: ['currentLocation'],
      _count: { id: true },
      _sum: { purchasePrice: true },
    });

    // Build breakdown for each location
    const breakdown = await Promise.all(
      locationAggregations.map(async (locAgg) => {
        const location = locAgg.currentLocation || 'Unknown';

        const [typeDistribution, utilizationRate, statusCounts] =
          await Promise.all([
            this.getTypeDistribution(whereClause, location),
            filters.includeUtilization
              ? this.getUtilizationRate(whereClause, location)
              : Promise.resolve(undefined),
            this.getStatusCounts(whereClause, location),
          ]);

        const assetCount = locAgg._count.id;
        const totalValue = Number(locAgg._sum.purchasePrice || 0);
        const percentage =
          totalAssets > 0 ? (assetCount / totalAssets) * 100 : 0;

        const breakdownItem: LocationBreakdownDto = {
          location,
          assetCount,
          totalValue,
          percentage: Math.round(percentage * 100) / 100,
          typeDistribution,
          utilizationRate,
          availableAssets: statusCounts.available,
          assetsInUse: statusCounts.inUse,
        };

        return breakdownItem;
      }),
    );

    return breakdown;
  }

  /**
   * Get type distribution for a location
   */
  private async getTypeDistribution(
    whereClause: any,
    location: string,
  ): Promise<TypeDistributionDto[]> {
    const locationWhere = { ...whereClause, currentLocation: location };

    const totalForLocation = await this.prisma.asset.count({
      where: locationWhere,
    });

    const typeCounts = await this.prisma.asset.groupBy({
      where: locationWhere,
      by: ['assetType'],
      _count: { id: true },
    });

    return typeCounts.map((item) => ({
      assetType: item.assetType,
      count: item._count.id,
      percentage:
        totalForLocation > 0
          ? Math.round((item._count.id / totalForLocation) * 10000) / 100
          : 0,
    }));
  }

  /**
   * Get utilization rate for a location
   */
  private async getUtilizationRate(
    whereClause: any,
    location: string,
  ): Promise<number> {
    const locationWhere = { ...whereClause, currentLocation: location };

    const totalAssets = await this.prisma.asset.count({
      where: locationWhere,
    });

    const assetsInUse = await this.prisma.asset.count({
      where: {
        ...locationWhere,
        status: AssetStatus.IN_USE,
      },
    });

    if (totalAssets === 0) return 0;

    const utilizationRate = (assetsInUse / totalAssets) * 100;
    return Math.round(utilizationRate * 10) / 10;
  }

  /**
   * Get status counts for a location
   */
  private async getStatusCounts(whereClause: any, location: string) {
    const locationWhere = { ...whereClause, currentLocation: location };

    const [available, inUse] = await Promise.all([
      this.prisma.asset.count({
        where: { ...locationWhere, status: AssetStatus.AVAILABLE },
      }),
      this.prisma.asset.count({
        where: { ...locationWhere, status: AssetStatus.IN_USE },
      }),
    ]);

    return { available, inUse };
  }

  /**
   * Sort breakdown
   */
  private sortBreakdown(
    breakdown: LocationBreakdownDto[],
    sortBy: string,
    sortOrder: string,
  ): LocationBreakdownDto[] {
    const sorted = [...breakdown].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'assetCount':
          comparison = a.assetCount - b.assetCount;
          break;
        case 'totalValue':
          comparison = a.totalValue - b.totalValue;
          break;
        case 'location':
          comparison = a.location.localeCompare(b.location);
          break;
        case 'utilizationRate':
          comparison = (a.utilizationRate || 0) - (b.utilizationRate || 0);
          break;
        default:
          comparison = a.assetCount - b.assetCount;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }
}
