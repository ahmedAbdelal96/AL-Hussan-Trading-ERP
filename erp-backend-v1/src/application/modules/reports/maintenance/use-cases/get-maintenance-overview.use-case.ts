import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  MaintenanceOverviewFiltersDto,
  MaintenanceOverviewResponseDto,
  StatusDistributionDto,
  TypeDistributionDto,
  PriorityDistributionDto,
  PeriodComparisonDto,
  OverdueMaintenanceDto,
} from '../dto';
import { MaintenanceStatus, Prisma } from '@prisma/client';

/**
 * Use Case: Get Maintenance Overview Report
 *
 * Provides comprehensive dashboard view of maintenance operations with KPIs,
 * distributions, and optional period comparison.
 *
 * Business Value:
 * - Quick assessment of maintenance department health
 * - Identify bottlenecks and efficiency opportunities
 * - Track cost performance and savings
 * - Monitor overdue items for risk management
 *
 * Performance Optimization:
 * - Parallel query execution for independent metrics
 * - Efficient aggregations using Prisma's groupBy
 * - Optional features only queried when requested
 */
@Injectable()
export class GetMaintenanceOverviewUseCase {
  private readonly logger = new Logger(GetMaintenanceOverviewUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute the maintenance overview report generation
   */
  async execute(
    filters: MaintenanceOverviewFiltersDto,
  ): Promise<MaintenanceOverviewResponseDto> {
    this.logger.log('Generating maintenance overview report');

    try {
      // Build base where clause
      const whereClause = this.buildWhereClause(filters);

      // Execute parallel queries for performance
      const [
        totalMetrics,
        statusDistribution,
        typeDistribution,
        priorityDistribution,
        overdueCount,
        periodComparison,
        overdueAlerts,
      ] = await Promise.all([
        this.getTotalMetrics(whereClause),
        this.getStatusDistribution(whereClause),
        this.getTypeDistribution(whereClause),
        this.getPriorityDistribution(whereClause),
        this.getOverdueCount(whereClause),
        filters.includeComparison
          ? this.getPeriodComparison(filters)
          : Promise.resolve(undefined),
        filters.includeOverdueAlerts
          ? this.getOverdueAlerts(whereClause)
          : Promise.resolve(undefined),
      ]);

      // Calculate derived metrics
      const totalRequests = totalMetrics.total;
      const completedRequests = totalMetrics.completed;
      const completionRate =
        totalRequests > 0
          ? Math.round((completedRequests / totalRequests) * 1000) / 10
          : 0;

      const overduePercentage =
        totalRequests > 0
          ? Math.round((overdueCount / totalRequests) * 1000) / 10
          : 0;

      // Calculate cost metrics
      const totalEstimatedCost = Number(totalMetrics.estimatedCost || 0);
      const totalActualCost = Number(totalMetrics.actualCost || 0);
      const costSavings = totalEstimatedCost - totalActualCost;
      const costSavingsPercentage =
        totalEstimatedCost > 0
          ? Math.round((costSavings / totalEstimatedCost) * 1000) / 10
          : 0;

      return {
        totalRequests,
        completedRequests,
        inProgressRequests: totalMetrics.inProgress,
        pendingRequests: totalMetrics.pending,
        completionRate,
        averageRepairTime: totalMetrics.avgRepairTime,
        totalEstimatedCost,
        totalActualCost,
        costSavings,
        costSavingsPercentage,
        statusDistribution,
        typeDistribution,
        priorityDistribution,
        overdueCount,
        overduePercentage,
        periodComparison,
        overdueAlerts,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate maintenance overview report: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(
    filters: MaintenanceOverviewFiltersDto,
  ): Prisma.MaintenanceRequestWhereInput {
    const where: Prisma.MaintenanceRequestWhereInput = {};

    // Date range filter
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    // Type filter
    if (filters.maintenanceType) {
      where.maintenanceType = filters.maintenanceType;
    }

    // Status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Priority filter
    if (filters.priority) {
      where.priority = filters.priority;
    }

    // Asset type filter (requires join)
    if (filters.assetType) {
      where.asset = {
        assetType: filters.assetType,
      };
    }

    // Specific asset filter
    if (filters.assetId) {
      where.assetId = filters.assetId;
    }

    // Project filter
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    // Assigned employee filter
    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    // Vendor filter
    if (filters.vendor) {
      where.vendor = {
        contains: filters.vendor,
        mode: 'insensitive' as Prisma.QueryMode,
      };
    }

    return where;
  }

  /**
   * Get total metrics with status counts and repair time
   */
  private async getTotalMetrics(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ) {
    // Get count by status
    const statusCounts = await this.prisma.maintenanceRequest.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
    });

    // Get cost aggregations
    const costAggregations = await this.prisma.maintenanceRequest.aggregate({
      where: whereClause,
      _sum: {
        estimatedCost: true,
        actualCost: true,
      },
    });

    // Calculate average repair time for completed requests
    const completedRequests = await this.prisma.maintenanceRequest.findMany({
      where: {
        ...whereClause,
        status: MaintenanceStatus.COMPLETED,
        startedAt: { not: null },
        completedAt: { not: null },
      },
      select: {
        startedAt: true,
        completedAt: true,
      },
    });

    let avgRepairTime = 0;
    if (completedRequests.length > 0) {
      const totalDays = completedRequests.reduce((sum, req) => {
        const start = new Date(req.startedAt!);
        const end = new Date(req.completedAt!);
        const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      avgRepairTime =
        Math.round((totalDays / completedRequests.length) * 10) / 10;
    }

    // Calculate status-specific counts
    const total = statusCounts.reduce((sum, item) => sum + item._count, 0);
    const completed =
      statusCounts.find((s) => s.status === MaintenanceStatus.COMPLETED)
        ?._count || 0;
    const inProgress =
      statusCounts.find((s) => s.status === MaintenanceStatus.IN_PROGRESS)
        ?._count || 0;
    const pending =
      statusCounts.find((s) => s.status === MaintenanceStatus.PENDING)
        ?._count || 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      avgRepairTime,
      estimatedCost: costAggregations._sum.estimatedCost,
      actualCost: costAggregations._sum.actualCost,
    };
  }

  /**
   * Get distribution by status
   */
  private async getStatusDistribution(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<StatusDistributionDto[]> {
    const results = await this.prisma.maintenanceRequest.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
      _sum: {
        actualCost: true,
      },
    });

    const total = results.reduce((sum, item) => sum + item._count, 0);

    return results.map((item) => ({
      status: item.status,
      count: item._count,
      percentage: total > 0 ? Math.round((item._count / total) * 1000) / 10 : 0,
      totalCost: Number(item._sum.actualCost || 0),
    }));
  }

  /**
   * Get distribution by maintenance type
   */
  private async getTypeDistribution(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<TypeDistributionDto[]> {
    const results = await this.prisma.maintenanceRequest.groupBy({
      by: ['maintenanceType'],
      where: whereClause,
      _count: true,
      _sum: {
        actualCost: true,
      },
    });

    const total = results.reduce((sum, item) => sum + item._count, 0);

    return results.map((item) => ({
      type: item.maintenanceType,
      count: item._count,
      percentage: total > 0 ? Math.round((item._count / total) * 1000) / 10 : 0,
      totalCost: Number(item._sum.actualCost || 0),
    }));
  }

  /**
   * Get distribution by priority
   */
  private async getPriorityDistribution(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<PriorityDistributionDto[]> {
    const results = await this.prisma.maintenanceRequest.groupBy({
      by: ['priority'],
      where: whereClause,
      _count: true,
      _sum: {
        actualCost: true,
      },
    });

    const total = results.reduce((sum, item) => sum + item._count, 0);

    return results.map((item) => ({
      priority: item.priority,
      count: item._count,
      percentage: total > 0 ? Math.round((item._count / total) * 1000) / 10 : 0,
      totalCost: Number(item._sum.actualCost || 0),
    }));
  }

  /**
   * Get count of overdue maintenance requests
   */
  private async getOverdueCount(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<number> {
    const now = new Date();

    return this.prisma.maintenanceRequest.count({
      where: {
        ...whereClause,
        scheduledDate: {
          lt: now,
        },
        status: {
          in: [MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS],
        },
      },
    });
  }

  /**
   * Get period comparison data
   */
  private async getPeriodComparison(
    filters: MaintenanceOverviewFiltersDto,
  ): Promise<PeriodComparisonDto | undefined> {
    if (!filters.startDate || !filters.endDate) {
      return undefined;
    }

    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    const periodLength = endDate.getTime() - startDate.getTime();

    // Calculate previous period dates
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = startDate;

    // Build where clause for previous period
    const previousWhere = this.buildWhereClause({
      ...filters,
      startDate: previousStartDate.toISOString(),
      endDate: previousEndDate.toISOString(),
    });

    // Get previous period metrics
    const previousMetrics = await this.getTotalMetrics(previousWhere);

    // Calculate changes
    const currentWhere = this.buildWhereClause(filters);
    const currentMetrics = await this.getTotalMetrics(currentWhere);

    const countChange = currentMetrics.total - previousMetrics.total;
    const countChangePercentage =
      previousMetrics.total > 0
        ? Math.round((countChange / previousMetrics.total) * 1000) / 10
        : 0;

    const currentCost = Number(currentMetrics.actualCost || 0);
    const previousCost = Number(previousMetrics.actualCost || 0);
    const costChange = currentCost - previousCost;
    const costChangePercentage =
      previousCost > 0
        ? Math.round((costChange / previousCost) * 1000) / 10
        : 0;

    return {
      previousPeriodCount: previousMetrics.total,
      previousPeriodCompleted: previousMetrics.completed,
      previousPeriodCost: previousCost,
      countChangePercentage,
      costChangePercentage,
    };
  }

  /**
   * Get overdue maintenance alerts
   */
  private async getOverdueAlerts(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<OverdueMaintenanceDto[]> {
    const now = new Date();

    const overdueRequests = await this.prisma.maintenanceRequest.findMany({
      where: {
        ...whereClause,
        scheduledDate: {
          lt: now,
        },
        status: {
          in: [MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS],
        },
      },
      select: {
        maintenanceNumber: true,
        title: true,
        assetId: true,
        priority: true,
        scheduledDate: true,
        estimatedCost: true,
        asset: {
          select: {
            assetNumber: true,
            name: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
      take: 20, // Limit to top 20 most overdue
    });

    return overdueRequests.map((req) => {
      const scheduledDate = new Date(req.scheduledDate!);
      const daysOverdue = Math.floor(
        (now.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        maintenanceNumber: req.maintenanceNumber,
        title: req.title,
        assetId: req.assetId,
        assetNumber: req.asset.assetNumber,
        assetName: req.asset.name,
        priority: req.priority,
        scheduledDate: scheduledDate,
        daysOverdue,
        estimatedCost: Number(req.estimatedCost || 0),
      };
    });
  }
}
