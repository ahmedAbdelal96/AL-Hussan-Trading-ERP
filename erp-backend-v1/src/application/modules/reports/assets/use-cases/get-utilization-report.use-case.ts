/**
 * ============================================================================
 * GET UTILIZATION REPORT USE CASE
 * ============================================================================
 *
 * Business logic for generating asset utilization and performance report.
 * Analyzes operational efficiency, operation hours, and idle asset identification.
 *
 * @module GetUtilizationReportUseCase
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  UtilizationReportFiltersDto,
  UtilizationReportResponseDto,
  TypeUtilizationDto,
  AssetOperationSummaryDto,
  IdleAssetDto,
} from '../dto';

@Injectable()
export class GetUtilizationReportUseCase {
  private readonly logger = new Logger(GetUtilizationReportUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute utilization report
   */
  async execute(
    filters: UtilizationReportFiltersDto,
  ): Promise<UtilizationReportResponseDto> {
    try {
      this.logger.log('Generating utilization report...');

      // Build common filters
      const whereClause = this.buildWhereClause(filters);

      // Get total assets count
      const totalAssets = await this.prisma.asset.count({
        where: whereClause,
      });

      // Get utilization metrics
      const [
        utilizationMetrics,
        byType,
        mostUtilized,
        leastUtilized,
        idleAssets,
      ] = await Promise.all([
        this.getUtilizationMetrics(whereClause, filters),
        this.getUtilizationByType(whereClause, filters),
        filters.includeOperations
          ? this.getMostUtilizedAssets(whereClause, filters)
          : Promise.resolve(undefined),
        filters.includeOperations
          ? this.getLeastUtilizedAssets(whereClause, filters)
          : Promise.resolve(undefined),
        filters.includeIdleAssets
          ? this.getIdleAssets(whereClause)
          : Promise.resolve(undefined),
      ]);

      const response: UtilizationReportResponseDto = {
        overallUtilization: utilizationMetrics.overallUtilization,
        totalOperationHours: utilizationMetrics.totalOperationHours,
        totalAssets,
        highUtilizationCount: utilizationMetrics.highUtilizationCount,
        lowUtilizationCount: utilizationMetrics.lowUtilizationCount,
        idleAssetsCount: utilizationMetrics.idleAssetsCount,
        byType,
        mostUtilized,
        leastUtilized,
        idleAssets,
        totalFuelConsumption: utilizationMetrics.totalFuelConsumption,
        totalDistance: utilizationMetrics.totalDistance,
      };

      this.logger.log('Utilization report generated successfully');
      return response;
    } catch (error) {
      this.logger.error('Error generating utilization report', error);
      throw error;
    }
  }

  /**
   * Build WHERE clause from filters
   */
  private buildWhereClause(filters: UtilizationReportFiltersDto): any {
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
   * Get overall utilization metrics
   */
  private async getUtilizationMetrics(
    whereClause: any,
    filters: UtilizationReportFiltersDto,
  ) {
    // Get all assets with their operations
    const assets = await this.prisma.asset.findMany({
      where: whereClause,
      select: {
        id: true,
        operations: {
          where: this.buildOperationDateFilter(filters),
          select: {
            startTime: true,
            endTime: true,
            fuelConsumed: true,
            startOdometer: true,
            endOdometer: true,
          },
        },
      },
    });

    let totalOperationHours = 0;
    let totalFuelConsumption = 0;
    let totalDistance = 0;
    let highUtilizationCount = 0;
    let lowUtilizationCount = 0;
    let idleAssetsCount = 0;

    // Calculate utilization for each asset
    assets.forEach((asset) => {
      const operations = asset.operations;
      let assetHours = 0;
      let assetFuel = 0;
      let assetDistance = 0;

      operations.forEach((op) => {
        // Calculate operation hours
        if (op.startTime && op.endTime) {
          const hours =
            (op.endTime.getTime() - op.startTime.getTime()) / (1000 * 60 * 60);
          assetHours += hours;
        }

        // Sum fuel consumption
        if (op.fuelConsumed) {
          assetFuel += Number(op.fuelConsumed);
        }

        // Calculate distance
        if (op.startOdometer && op.endOdometer) {
          assetDistance += op.endOdometer - op.startOdometer;
        }
      });

      totalOperationHours += assetHours;
      totalFuelConsumption += assetFuel;
      totalDistance += assetDistance;

      // Categorize utilization (simplified: based on operation count)
      const utilizationRate = this.calculateUtilizationRate(operations.length);

      if (operations.length === 0) {
        idleAssetsCount++;
      } else if (utilizationRate > 80) {
        highUtilizationCount++;
      } else if (utilizationRate < 50) {
        lowUtilizationCount++;
      }
    });

    // Calculate overall utilization
    const activeAssets = assets.length - idleAssetsCount;
    const overallUtilization =
      assets.length > 0 ? (activeAssets / assets.length) * 100 : 0;

    return {
      overallUtilization: Math.round(overallUtilization * 10) / 10,
      totalOperationHours: Math.round(totalOperationHours * 10) / 10,
      totalFuelConsumption:
        totalFuelConsumption > 0
          ? Math.round(totalFuelConsumption * 10) / 10
          : undefined,
      totalDistance: totalDistance > 0 ? Math.round(totalDistance) : undefined,
      highUtilizationCount,
      lowUtilizationCount,
      idleAssetsCount,
    };
  }

  /**
   * Get utilization by asset type
   */
  private async getUtilizationByType(
    whereClause: any,
    filters: UtilizationReportFiltersDto,
  ): Promise<TypeUtilizationDto[]> {
    // Get assets grouped by type
    const assetsByType = await this.prisma.asset.findMany({
      where: whereClause,
      select: {
        assetType: true,
        operations: {
          where: this.buildOperationDateFilter(filters),
          select: {
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    // Group by type
    const typeMap = new Map<string, any[]>();
    assetsByType.forEach((asset) => {
      const type = asset.assetType;
      if (!typeMap.has(type)) {
        typeMap.set(type, []);
      }
      typeMap.get(type)!.push(asset);
    });

    // Calculate metrics for each type
    const breakdown: TypeUtilizationDto[] = [];

    typeMap.forEach((assets, type) => {
      let totalHours = 0;
      let highUtil = 0;
      let lowUtil = 0;
      let idle = 0;
      let totalUtilization = 0;

      assets.forEach((asset) => {
        const operations = asset.operations;
        let assetHours = 0;

        operations.forEach((op) => {
          if (op.startTime && op.endTime) {
            const hours =
              (op.endTime.getTime() - op.startTime.getTime()) /
              (1000 * 60 * 60);
            assetHours += hours;
          }
        });

        totalHours += assetHours;

        const utilizationRate = this.calculateUtilizationRate(
          operations.length as number,
        );
        totalUtilization += utilizationRate;

        if (operations.length === 0) {
          idle++;
        } else if (utilizationRate > 80) {
          highUtil++;
        } else if (utilizationRate < 50) {
          lowUtil++;
        }
      });

      const averageUtilization =
        assets.length > 0 ? totalUtilization / assets.length : 0;

      breakdown.push({
        assetType: type as any,
        assetCount: assets.length,
        averageUtilization: Math.round(averageUtilization * 10) / 10,
        totalHours: Math.round(totalHours * 10) / 10,
        highUtilization: highUtil,
        lowUtilization: lowUtil,
        idleAssets: idle,
      });
    });

    // Sort by asset count descending
    return breakdown.sort((a, b) => b.assetCount - a.assetCount);
  }

  /**
   * Get most utilized assets
   */
  private async getMostUtilizedAssets(
    whereClause: any,
    filters: UtilizationReportFiltersDto,
  ): Promise<AssetOperationSummaryDto[]> {
    const assets = await this.prisma.asset.findMany({
      where: whereClause,
      select: {
        id: true,
        assetNumber: true,
        name: true,
        assetType: true,
        operations: {
          where: this.buildOperationDateFilter(filters),
          select: {
            startTime: true,
            endTime: true,
            fuelConsumed: true,
            startOdometer: true,
            endOdometer: true,
          },
        },
      },
    });

    // Calculate summaries
    const summaries = assets
      .map((asset) => this.buildOperationSummary(asset))
      .filter((summary) => summary.operationCount > 0);

    // Sort by total hours descending and take top 10
    return summaries.sort((a, b) => b.totalHours - a.totalHours).slice(0, 10);
  }

  /**
   * Get least utilized assets
   */
  private async getLeastUtilizedAssets(
    whereClause: any,
    filters: UtilizationReportFiltersDto,
  ): Promise<AssetOperationSummaryDto[]> {
    const assets = await this.prisma.asset.findMany({
      where: whereClause,
      select: {
        id: true,
        assetNumber: true,
        name: true,
        assetType: true,
        operations: {
          where: this.buildOperationDateFilter(filters),
          select: {
            startTime: true,
            endTime: true,
            fuelConsumed: true,
            startOdometer: true,
            endOdometer: true,
          },
        },
      },
    });

    // Calculate summaries (exclude idle assets)
    const summaries = assets
      .map((asset) => this.buildOperationSummary(asset))
      .filter((summary) => summary.operationCount > 0);

    // Sort by total hours ascending and take bottom 10
    return summaries.sort((a, b) => a.totalHours - b.totalHours).slice(0, 10);
  }

  /**
   * Get idle assets
   */
  private async getIdleAssets(whereClause: any): Promise<IdleAssetDto[]> {
    const assets = await this.prisma.asset.findMany({
      where: whereClause,
      select: {
        id: true,
        assetNumber: true,
        name: true,
        assetType: true,
        status: true,
        currentLocation: true,
        updatedAt: true,
        operations: {
          orderBy: { endTime: 'desc' },
          take: 1,
          select: {
            endTime: true,
          },
        },
      },
    });

    // Filter idle assets (no operations)
    const now = new Date();
    const idleAssets = assets
      .filter((asset) => asset.operations.length === 0)
      .map((asset) => {
        const lastOperation = asset.operations[0]?.endTime || null;
        const daysIdle = lastOperation
          ? Math.floor(
              (now.getTime() - lastOperation.getTime()) / (1000 * 60 * 60 * 24),
            )
          : Math.floor(
              (now.getTime() - asset.updatedAt.getTime()) /
                (1000 * 60 * 60 * 24),
            );

        return {
          assetId: asset.id,
          assetNumber: asset.assetNumber,
          name: asset.name,
          assetType: asset.assetType,
          status: asset.status,
          daysIdle,
          lastOperation,
          location: asset.currentLocation || 'Unknown',
        };
      });

    // Sort by days idle descending
    return idleAssets.sort((a, b) => b.daysIdle - a.daysIdle).slice(0, 20);
  }

  /**
   * Build operation summary for an asset
   */
  private buildOperationSummary(asset: any): AssetOperationSummaryDto {
    let totalHours = 0;
    let totalFuel = 0;
    let totalDistance = 0;
    let lastOperation: Date | null = null;

    asset.operations.forEach((op: any) => {
      if (op.startTime && op.endTime) {
        const hours =
          (op.endTime.getTime() - op.startTime.getTime()) / (1000 * 60 * 60);
        totalHours += hours;

        if (!lastOperation || op.endTime > lastOperation) {
          lastOperation = op.endTime;
        }
      }

      if (op.fuelConsumption) {
        totalFuel += op.fuelConsumption;
      }

      if (op.startOdometer && op.endOdometer) {
        totalDistance += op.endOdometer - op.startOdometer;
      }
    });

    const utilizationRate = this.calculateUtilizationRate(
      (asset.operations?.length as number) || 0,
    );

    return {
      assetId: asset.id,
      assetNumber: asset.assetNumber,
      name: asset.name,
      assetType: asset.assetType,
      totalHours: Math.round(totalHours * 10) / 10,
      operationCount: asset.operations?.length || 0,
      totalFuelConsumption:
        totalFuel > 0 ? Math.round(totalFuel * 10) / 10 : undefined,
      totalDistance: totalDistance > 0 ? Math.round(totalDistance) : undefined,
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      lastOperation: lastOperation || new Date(),
    };
  }

  /**
   * Calculate utilization rate (simplified)
   * Based on number of operations
   */
  private calculateUtilizationRate(operationCount: number): number {
    // Simplified calculation: more operations = higher utilization
    // In a real system, this would be based on actual hours vs available hours
    if (operationCount === 0) return 0;
    if (operationCount >= 50) return 95;
    if (operationCount >= 30) return 80;
    if (operationCount >= 15) return 60;
    if (operationCount >= 5) return 40;
    return 20;
  }

  /**
   * Build operation date filter
   */
  private buildOperationDateFilter(filters: UtilizationReportFiltersDto): any {
    const where: any = {};

    if (filters.startDate || filters.endDate) {
      where.startTime = {};
      if (filters.startDate) where.startTime.gte = filters.startDate;
      if (filters.endDate) where.startTime.lte = filters.endDate;
    }

    return where;
  }
}
