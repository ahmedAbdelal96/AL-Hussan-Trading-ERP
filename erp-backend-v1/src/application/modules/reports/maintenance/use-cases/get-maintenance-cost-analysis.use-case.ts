import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  MaintenanceCostAnalysisFiltersDto,
  MaintenanceCostAnalysisResponseDto,
  CostByTypeDto,
  CostByAssetTypeDto,
  CostByVendorDto,
  MonthlyCostTrendDto,
  TopCostlyMaintenanceDto,
} from '../dto';
import { MaintenanceType, Prisma } from '@prisma/client';

/**
 * Use Case: Get Maintenance Cost Analysis Report
 *
 * Comprehensive financial analysis for maintenance budgeting
 * and cost control.
 *
 * Business Value:
 * - Budget planning and forecasting
 * - Vendor cost comparison
 * - Cost control and variance management
 * - Identify cost-saving opportunities
 */
@Injectable()
export class GetMaintenanceCostAnalysisUseCase {
  private readonly logger = new Logger(GetMaintenanceCostAnalysisUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: MaintenanceCostAnalysisFiltersDto,
  ): Promise<MaintenanceCostAnalysisResponseDto> {
    this.logger.log('Generating maintenance cost analysis report');

    try {
      const whereClause = this.buildWhereClause(filters);

      // Get total metrics and cost breakdowns in parallel
      const [
        totalMetrics,
        costByType,
        costByAssetType,
        costByVendor,
        monthlyTrends,
        topCostly,
      ] = await Promise.all([
        this.getTotalCostMetrics(whereClause),
        this.getCostByType(whereClause),
        this.getCostByAssetType(whereClause),
        this.getCostByVendor(whereClause),
        filters.includeTrends
          ? this.getMonthlyCostTrends(whereClause)
          : Promise.resolve(undefined),
        filters.includeTopCostly
          ? this.getTopCostlyRequests(whereClause)
          : Promise.resolve(undefined),
      ]);

      const startDate =
        filters.startDate || new Date(0).toISOString().split('T')[0];
      const endDate = filters.endDate || new Date().toISOString().split('T')[0];

      return {
        ...totalMetrics,
        costByType,
        costByAssetType,
        costByVendor: costByVendor.length > 0 ? costByVendor : undefined,
        monthlyTrends,
        topCostlyRequests: topCostly,
        startDate,
        endDate,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate cost analysis report: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private buildWhereClause(
    filters: MaintenanceCostAnalysisFiltersDto,
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

    if (filters.vendor) {
      where.vendor = {
        contains: filters.vendor,
        mode: 'insensitive' as Prisma.QueryMode,
      };
    }

    // Cost range filters
    if (filters.minCost !== undefined || filters.maxCost !== undefined) {
      where.actualCost = {};
      if (filters.minCost !== undefined) {
        where.actualCost.gte = filters.minCost;
      }
      if (filters.maxCost !== undefined) {
        where.actualCost.lte = filters.maxCost;
      }
    }

    return where;
  }

  private async getTotalCostMetrics(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ) {
    const [count, costs] = await Promise.all([
      this.prisma.maintenanceRequest.count({ where: whereClause }),
      this.prisma.maintenanceRequest.aggregate({
        where: whereClause,
        _sum: {
          estimatedCost: true,
          actualCost: true,
        },
      }),
    ]);

    const totalEstimatedCost = Number(costs._sum.estimatedCost || 0);
    const totalActualCost = Number(costs._sum.actualCost || 0);
    const totalCostVariance = totalEstimatedCost - totalActualCost;
    const variancePercentage =
      totalEstimatedCost > 0
        ? Math.round((totalCostVariance / totalEstimatedCost) * 1000) / 10
        : 0;
    const avgCostPerRequest =
      count > 0 ? Math.round((totalActualCost / count) * 100) / 100 : 0;

    return {
      totalRequests: count,
      totalEstimatedCost,
      totalActualCost,
      totalCostVariance,
      variancePercentage,
      averageCostPerRequest: avgCostPerRequest,
    };
  }

  private async getCostByType(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<CostByTypeDto[]> {
    const types = Object.values(MaintenanceType);

    const results = await Promise.all(
      types.map(async (type) => {
        const typeWhere = { ...whereClause, maintenanceType: type };

        const [count, costs] = await Promise.all([
          this.prisma.maintenanceRequest.count({ where: typeWhere }),
          this.prisma.maintenanceRequest.aggregate({
            where: typeWhere,
            _sum: {
              estimatedCost: true,
              actualCost: true,
            },
          }),
        ]);

        if (count === 0) return null;

        const estimatedCost = Number(costs._sum.estimatedCost || 0);
        const actualCost = Number(costs._sum.actualCost || 0);
        const costVariance = estimatedCost - actualCost;
        const variancePercentage =
          estimatedCost > 0
            ? Math.round((costVariance / estimatedCost) * 1000) / 10
            : 0;
        const avgCost =
          count > 0 ? Math.round((actualCost / count) * 100) / 100 : 0;

        return {
          type,
          requestCount: count,
          estimatedCost,
          actualCost,
          costVariance,
          variancePercentage,
          averageCostPerRequest: avgCost,
        };
      }),
    );

    return results.filter((item): item is CostByTypeDto => item !== null);
  }

  private async getCostByAssetType(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<CostByAssetTypeDto[]> {
    const assetTypeData = await this.prisma.maintenanceRequest.groupBy({
      by: ['assetId'],
      where: whereClause,
      _count: true,
      _sum: {
        actualCost: true,
      },
    });

    if (assetTypeData.length === 0) return [];

    const assetIds = assetTypeData.map((item) => item.assetId);
    const assets = await this.prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: {
        id: true,
        assetType: true,
      },
    });

    // Group by asset type
    const typeMap = new Map<
      string,
      { count: number; requests: number; cost: number }
    >();

    assetTypeData.forEach((item) => {
      const asset = assets.find((a) => a.id === item.assetId);
      if (!asset) return;

      const existing = typeMap.get(asset.assetType) || {
        count: 0,
        requests: 0,
        cost: 0,
      };
      existing.count++;
      existing.requests += item._count;
      existing.cost += Number(item._sum.actualCost || 0);
      typeMap.set(asset.assetType, existing);
    });

    const results: CostByAssetTypeDto[] = [];
    typeMap.forEach((data, assetType) => {
      const avgCostPerRequest =
        data.requests > 0
          ? Math.round((data.cost / data.requests) * 100) / 100
          : 0;
      const avgCostPerAsset =
        data.count > 0 ? Math.round((data.cost / data.count) * 100) / 100 : 0;

      results.push({
        assetType: assetType as any,
        assetCount: data.count,
        requestCount: data.requests,
        totalCost: Math.round(data.cost * 100) / 100,
        averageCostPerRequest: avgCostPerRequest,
        averageCostPerAsset: avgCostPerAsset,
      });
    });

    return results.sort((a, b) => b.totalCost - a.totalCost);
  }

  private async getCostByVendor(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<CostByVendorDto[]> {
    const vendorData = await this.prisma.maintenanceRequest.groupBy({
      by: ['vendor'],
      where: {
        ...whereClause,
        vendor: { not: null },
      },
      _count: true,
      _sum: {
        actualCost: true,
      },
    });

    const totalCost = vendorData.reduce(
      (sum, item) => sum + Number(item._sum.actualCost || 0),
      0,
    );

    return vendorData
      .map((item) => {
        if (!item.vendor) return null;

        const cost = Number(item._sum.actualCost || 0);
        const avgCost =
          item._count > 0 ? Math.round((cost / item._count) * 100) / 100 : 0;
        const percentage =
          totalCost > 0 ? Math.round((cost / totalCost) * 1000) / 10 : 0;

        return {
          vendor: item.vendor,
          requestCount: item._count,
          totalCost: Math.round(cost * 100) / 100,
          averageCostPerRequest: avgCost,
          percentageOfTotalCost: percentage,
        };
      })
      .filter((item): item is CostByVendorDto => item !== null)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10); // Top 10 vendors
  }

  private async getMonthlyCostTrends(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<MonthlyCostTrendDto[]> {
    const requests = await this.prisma.maintenanceRequest.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        estimatedCost: true,
        actualCost: true,
      },
    });

    // Group by month
    const monthMap = new Map<
      string,
      { count: number; estimated: number; actual: number }
    >();

    requests.forEach((req) => {
      const date = new Date(req.createdAt);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const existing = monthMap.get(month) || {
        count: 0,
        estimated: 0,
        actual: 0,
      };
      existing.count++;
      existing.estimated += Number(req.estimatedCost || 0);
      existing.actual += Number(req.actualCost || 0);
      monthMap.set(month, existing);
    });

    const trends: MonthlyCostTrendDto[] = [];
    monthMap.forEach((data, month) => {
      const variance = data.estimated - data.actual;
      const variancePercentage =
        data.estimated > 0
          ? Math.round((variance / data.estimated) * 1000) / 10
          : 0;

      trends.push({
        month,
        requestCount: data.count,
        estimatedCost: Math.round(data.estimated * 100) / 100,
        actualCost: Math.round(data.actual * 100) / 100,
        costVariance: Math.round(variance * 100) / 100,
        variancePercentage,
      });
    });

    return trends.sort((a, b) => a.month.localeCompare(b.month));
  }

  private async getTopCostlyRequests(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<TopCostlyMaintenanceDto[]> {
    const costly = await this.prisma.maintenanceRequest.findMany({
      where: whereClause,
      select: {
        maintenanceNumber: true,
        title: true,
        assetId: true,
        maintenanceType: true,
        estimatedCost: true,
        actualCost: true,
        asset: {
          select: {
            assetNumber: true,
            name: true,
          },
        },
      },
      orderBy: {
        actualCost: 'desc',
      },
      take: 10,
    });

    return costly.map((req) => {
      const estimatedCost = Number(req.estimatedCost || 0);
      const actualCost = Number(req.actualCost || 0);
      const costVariance = estimatedCost - actualCost;
      const variancePercentage =
        estimatedCost > 0
          ? Math.round((costVariance / estimatedCost) * 1000) / 10
          : 0;

      return {
        maintenanceNumber: req.maintenanceNumber,
        title: req.title,
        assetId: req.assetId,
        assetNumber: req.asset.assetNumber,
        assetName: req.asset.name,
        type: req.maintenanceType,
        estimatedCost,
        actualCost,
        costVariance,
        variancePercentage,
      };
    });
  }
}
