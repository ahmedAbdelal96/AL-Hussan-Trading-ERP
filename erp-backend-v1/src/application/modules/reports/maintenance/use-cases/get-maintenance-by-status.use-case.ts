import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  MaintenanceByStatusFiltersDto,
  MaintenanceByStatusResponseDto,
  MaintenanceStatusBreakdownDto,
  StatusTransitionDto,
  DelayedMaintenanceAlertDto,
} from '../dto';
import { MaintenanceStatus, Prisma } from '@prisma/client';

/**
 * Use Case: Get Maintenance By Status Report
 *
 * Tracks maintenance requests through their lifecycle to identify
 * workflow bottlenecks and optimize process efficiency.
 *
 * Business Value:
 * - Identify workflow bottlenecks
 * - Monitor completion efficiency
 * - Track cancellation patterns
 * - Optimize status transition times
 *
 * Performance Optimization:
 * - Parallel queries for status metrics
 * - Efficient status grouping
 * - Optional features only computed when requested
 */
@Injectable()
export class GetMaintenanceByStatusUseCase {
  private readonly logger = new Logger(GetMaintenanceByStatusUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: MaintenanceByStatusFiltersDto,
  ): Promise<MaintenanceByStatusResponseDto> {
    this.logger.log('Generating maintenance by status report');

    try {
      const whereClause = this.buildWhereClause(filters);

      const totalCount = await this.prisma.maintenanceRequest.count({
        where: whereClause,
      });

      const [breakdown, delayedAlerts] = await Promise.all([
        this.getStatusBreakdown(whereClause, totalCount, filters),
        filters.includeAlerts
          ? this.getDelayedAlerts(whereClause)
          : Promise.resolve(undefined),
      ]);

      // Calculate overall metrics
      const completedCount =
        breakdown.find((b) => b.status === MaintenanceStatus.COMPLETED)
          ?.count || 0;
      const cancelledCount =
        breakdown.find((b) => b.status === MaintenanceStatus.CANCELLED)
          ?.count || 0;

      const overallCompletionRate =
        totalCount > 0
          ? Math.round((completedCount / totalCount) * 1000) / 10
          : 0;
      const cancellationRate =
        totalCount > 0
          ? Math.round((cancelledCount / totalCount) * 1000) / 10
          : 0;

      // Apply sorting
      const sortedBreakdown = this.sortBreakdown(breakdown, filters.sortBy);

      const startDate =
        filters.startDate || new Date(0).toISOString().split('T')[0];
      const endDate = filters.endDate || new Date().toISOString().split('T')[0];

      return {
        totalRequests: totalCount,
        breakdown: sortedBreakdown,
        overallCompletionRate,
        cancelledCount,
        cancellationRate,
        delayedAlerts,
        startDate,
        endDate,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate maintenance by status report: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private buildWhereClause(
    filters: MaintenanceByStatusFiltersDto,
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

  private async getStatusBreakdown(
    whereClause: Prisma.MaintenanceRequestWhereInput,
    totalCount: number,
    filters: MaintenanceByStatusFiltersDto,
  ): Promise<MaintenanceStatusBreakdownDto[]> {
    const statuses = Object.values(MaintenanceStatus);

    const breakdownPromises = statuses.map(async (status) => {
      const statusWhere: Prisma.MaintenanceRequestWhereInput = {
        ...whereClause,
        status,
      };

      const [countData, costData, statusRecords] = await Promise.all([
        this.prisma.maintenanceRequest.count({ where: statusWhere }),
        this.prisma.maintenanceRequest.aggregate({
          where: statusWhere,
          _sum: { actualCost: true },
        }),
        this.prisma.maintenanceRequest.findMany({
          where: statusWhere,
          select: {
            createdAt: true,
            startedAt: true,
            completedAt: true,
            updatedAt: true,
          },
        }),
      ]);

      // Calculate average days in status
      const now = new Date();
      let totalDaysInStatus = 0;
      let avgCompletionTime = 0;

      statusRecords.forEach((record) => {
        if (
          status === MaintenanceStatus.COMPLETED &&
          record.startedAt &&
          record.completedAt
        ) {
          const start = new Date(record.startedAt);
          const end = new Date(record.completedAt);
          const days =
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
          totalDaysInStatus += days;
        } else {
          const created = new Date(record.createdAt);
          const current =
            status === MaintenanceStatus.COMPLETED && record.completedAt
              ? new Date(record.completedAt)
              : now;
          const days =
            (current.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          totalDaysInStatus += days;
        }
      });

      const avgDaysInStatus =
        statusRecords.length > 0
          ? Math.round((totalDaysInStatus / statusRecords.length) * 10) / 10
          : 0;

      // Calculate completion time for COMPLETED status
      if (status === MaintenanceStatus.COMPLETED) {
        const completedWithTimes = statusRecords.filter(
          (r) => r.startedAt && r.completedAt,
        );
        if (completedWithTimes.length > 0) {
          const totalCompletionDays = completedWithTimes.reduce((sum, r) => {
            const start = new Date(r.startedAt!);
            const end = new Date(r.completedAt!);
            return (
              sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
            );
          }, 0);
          avgCompletionTime =
            Math.round((totalCompletionDays / completedWithTimes.length) * 10) /
            10;
        }
      }

      // Get transitions if requested (simplified - showing as undefined for now)
      let transitions: StatusTransitionDto[] | undefined;
      if (filters.includeTransitions) {
        transitions = []; // Simplified: would require tracking status changes in separate table
      }

      return {
        status,
        count: countData,
        percentage:
          totalCount > 0 ? Math.round((countData / totalCount) * 1000) / 10 : 0,
        totalCost: Number(costData._sum.actualCost || 0),
        averageDaysInStatus: avgDaysInStatus,
        averageCompletionTime: avgCompletionTime,
        transitions,
      };
    });

    const results = await Promise.all(breakdownPromises);
    return results.filter((item) => item.count > 0);
  }

  private async getDelayedAlerts(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<DelayedMaintenanceAlertDto[]> {
    const thresholdDays = 14; // Consider delayed if in status > 14 days
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

    const delayedRequests = await this.prisma.maintenanceRequest.findMany({
      where: {
        ...whereClause,
        status: {
          in: [
            MaintenanceStatus.PENDING,
            MaintenanceStatus.IN_PROGRESS,
            MaintenanceStatus.ON_HOLD,
          ],
        },
        createdAt: {
          lt: thresholdDate,
        },
      },
      select: {
        maintenanceNumber: true,
        title: true,
        status: true,
        assetId: true,
        priority: true,
        createdAt: true,
        asset: {
          select: {
            assetNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 20,
    });

    const now = new Date();
    return delayedRequests.map((req) => {
      const created = new Date(req.createdAt);
      const daysInStatus = Math.floor(
        (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        maintenanceNumber: req.maintenanceNumber,
        title: req.title,
        status: req.status,
        assetId: req.assetId,
        assetNumber: req.asset.assetNumber,
        daysInCurrentStatus: daysInStatus,
        priority: req.priority,
      };
    });
  }

  private sortBreakdown(
    breakdown: MaintenanceStatusBreakdownDto[],
    sortBy?: 'count' | 'status' | 'avgDuration',
  ): MaintenanceStatusBreakdownDto[] {
    const sorted = [...breakdown];

    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'count':
          return b.count - a.count;
        case 'status':
          return a.status.localeCompare(b.status);
        case 'avgDuration':
          return b.averageDaysInStatus - a.averageDaysInStatus;
        default:
          return b.count - a.count;
      }
    });

    return sorted;
  }
}
