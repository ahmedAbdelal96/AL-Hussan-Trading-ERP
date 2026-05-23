/**
 * ============================================================================
 * GET ASSETS BY STATUS USE CASE
 * ============================================================================
 *
 * Business logic for generating assets breakdown by status report.
 * Analyzes asset distribution across different statuses with operational insights.
 *
 * @module GetAssetsByStatusUseCase
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { AssetStatus } from '@prisma/client';
import {
  AssetsByStatusFiltersDto,
  AssetsByStatusResponseDto,
  AssetStatusBreakdownDto,
  StatusTransitionDto,
  AssetAlertDto,
} from '../dto';

@Injectable()
export class GetAssetsByStatusUseCase {
  private readonly logger = new Logger(GetAssetsByStatusUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute assets by status report
   */
  async execute(
    filters: AssetsByStatusFiltersDto,
  ): Promise<AssetsByStatusResponseDto> {
    try {
      this.logger.log('Generating assets by status report...');

      // Build common filters
      const whereClause = this.buildWhereClause(filters);

      // Get total metrics
      const totalMetrics = await this.getTotalMetrics(whereClause);

      // Get status breakdown
      const statusBreakdown = await this.getStatusBreakdown(
        whereClause,
        totalMetrics.totalAssets,
      );

      // Sort breakdown
      const sortedBreakdown = this.sortBreakdown(
        statusBreakdown,
        filters.sortBy || 'assetCount',
        filters.sortOrder || 'desc',
      );

      // Get optional data
      const [transitions, alerts] = await Promise.all([
        filters.includeTransitions
          ? this.getStatusTransitions(filters)
          : Promise.resolve(undefined),
        filters.includeAlerts
          ? this.getAssetAlerts(whereClause)
          : Promise.resolve(undefined),
      ]);

      // Calculate operational efficiency
      const operationalEfficiency = this.calculateOperationalEfficiency(
        statusBreakdown,
        totalMetrics.totalAssets,
      );

      const response: AssetsByStatusResponseDto = {
        breakdown: sortedBreakdown,
        totalAssets: totalMetrics.totalAssets,
        totalValue: Number(totalMetrics.totalValue),
        transitions,
        alerts,
        operationalEfficiency,
      };

      this.logger.log('Assets by status report generated successfully');
      return response;
    } catch (error) {
      this.logger.error('Error generating assets by status report', error);
      throw error;
    }
  }

  /**
   * Build WHERE clause from filters
   */
  private buildWhereClause(filters: AssetsByStatusFiltersDto): any {
    const where: any = {
      deletedAt: null,
    };

    if (filters.startDate || filters.endDate) {
      where.updatedAt = {};
      if (filters.startDate) where.updatedAt.gte = filters.startDate;
      if (filters.endDate) where.updatedAt.lte = filters.endDate;
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
   * Get status breakdown
   */
  private async getStatusBreakdown(
    whereClause: any,
    totalAssets: number,
  ): Promise<AssetStatusBreakdownDto[]> {
    // Get status aggregations
    const statusAggregations = await this.prisma.asset.groupBy({
      where: whereClause,
      by: ['status'],
      _count: { id: true },
      _sum: { purchasePrice: true },
    });

    // Build breakdown for each status
    const breakdown = await Promise.all(
      statusAggregations.map(async (statusAgg) => {
        const [averageAge, averageDaysInStatus] = await Promise.all([
          this.getAverageAge(whereClause, statusAgg.status),
          this.getAverageDaysInStatus(whereClause, statusAgg.status),
        ]);

        const assetCount = statusAgg._count.id;
        const totalValue = Number(statusAgg._sum.purchasePrice || 0);
        const percentage =
          totalAssets > 0 ? (assetCount / totalAssets) * 100 : 0;

        const breakdownItem: AssetStatusBreakdownDto = {
          status: statusAgg.status,
          assetCount,
          totalValue,
          percentage: Math.round(percentage * 100) / 100,
          averageAge: Math.round(averageAge * 10) / 10,
          averageDaysInStatus: Math.round(averageDaysInStatus),
        };

        return breakdownItem;
      }),
    );

    return breakdown;
  }

  /**
   * Get average age for a status
   */
  private async getAverageAge(
    whereClause: any,
    status: AssetStatus,
  ): Promise<number> {
    const assets = await this.prisma.asset.findMany({
      where: { ...whereClause, status },
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
   * Get average days in current status
   */
  private async getAverageDaysInStatus(
    whereClause: any,
    status: AssetStatus,
  ): Promise<number> {
    const assets = await this.prisma.asset.findMany({
      where: { ...whereClause, status },
      select: { updatedAt: true },
    });

    if (assets.length === 0) return 0;

    const now = new Date();
    const totalDays = assets.reduce((sum, asset) => {
      const daysInStatus =
        (now.getTime() - asset.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      return sum + daysInStatus;
    }, 0);

    return totalDays / assets.length;
  }

  /**
   * Get status transitions (simplified - based on updatedAt changes)
   */
  private async getStatusTransitions(
    filters: AssetsByStatusFiltersDto,
  ): Promise<StatusTransitionDto[]> {
    // This is a simplified implementation
    // In a real system, you would track status changes in a separate table
    // For now, we'll return sample data structure

    // Query assets that changed status in the period
    const where: any = { deletedAt: null };

    if (filters.startDate || filters.endDate) {
      where.updatedAt = {};
      if (filters.startDate) where.updatedAt.gte = filters.startDate;
      if (filters.endDate) where.updatedAt.lte = filters.endDate;
    }

    // Get status changes (this would normally come from an audit log)
    const statusChanges = await this.prisma.asset.groupBy({
      where,
      by: ['status'],
      _count: { id: true },
      _max: { updatedAt: true },
    });

    // Convert to transitions format
    // Note: This is simplified; real implementation needs audit trail
    const transitions: StatusTransitionDto[] = statusChanges.map((item) => ({
      fromStatus: AssetStatus.AVAILABLE, // Placeholder
      toStatus: item.status,
      count: item._count.id,
      lastTransition: item._max.updatedAt || new Date(),
    }));

    return transitions;
  }

  /**
   * Get assets requiring attention
   */
  private async getAssetAlerts(whereClause: any): Promise<AssetAlertDto[]> {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get assets under maintenance for too long
    const maintenanceAssets = await this.prisma.asset.findMany({
      where: {
        ...whereClause,
        status: AssetStatus.UNDER_MAINTENANCE,
        updatedAt: { lte: thirtyDaysAgo },
      },
      select: {
        id: true,
        assetNumber: true,
        name: true,
        status: true,
        updatedAt: true,
      },
      take: 20,
    });

    // Get assets out of service
    const outOfServiceAssets = await this.prisma.asset.findMany({
      where: {
        ...whereClause,
        status: AssetStatus.OUT_OF_SERVICE,
      },
      select: {
        id: true,
        assetNumber: true,
        name: true,
        status: true,
        updatedAt: true,
      },
      take: 20,
    });

    // Combine and format alerts
    const alerts: AssetAlertDto[] = [];

    maintenanceAssets.forEach((asset) => {
      const daysInStatus = Math.floor(
        (now.getTime() - asset.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      alerts.push({
        assetId: asset.id,
        assetNumber: asset.assetNumber,
        name: asset.name,
        status: asset.status,
        alertReason: `Under maintenance for ${daysInStatus}+ days`,
        daysInStatus,
      });
    });

    outOfServiceAssets.forEach((asset) => {
      const daysInStatus = Math.floor(
        (now.getTime() - asset.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      alerts.push({
        assetId: asset.id,
        assetNumber: asset.assetNumber,
        name: asset.name,
        status: asset.status,
        alertReason: 'Out of service - requires review',
        daysInStatus,
      });
    });

    return alerts;
  }

  /**
   * Calculate operational efficiency
   * (Available + In Use) / Total Assets
   */
  private calculateOperationalEfficiency(
    breakdown: AssetStatusBreakdownDto[],
    totalAssets: number,
  ): number {
    if (totalAssets === 0) return 0;

    const availableCount =
      breakdown.find((item) => item.status === AssetStatus.AVAILABLE)
        ?.assetCount || 0;

    const inUseCount =
      breakdown.find((item) => item.status === AssetStatus.IN_USE)
        ?.assetCount || 0;

    const operationalCount = availableCount + inUseCount;
    const efficiency = (operationalCount / totalAssets) * 100;

    return Math.round(efficiency * 10) / 10;
  }

  /**
   * Sort breakdown
   */
  private sortBreakdown(
    breakdown: AssetStatusBreakdownDto[],
    sortBy: string,
    sortOrder: string,
  ): AssetStatusBreakdownDto[] {
    const sorted = [...breakdown].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'assetCount':
          comparison = a.assetCount - b.assetCount;
          break;
        case 'totalValue':
          comparison = a.totalValue - b.totalValue;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = a.assetCount - b.assetCount;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }
}
