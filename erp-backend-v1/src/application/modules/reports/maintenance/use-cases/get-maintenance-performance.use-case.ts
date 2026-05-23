import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  MaintenancePerformanceFiltersDto,
  MaintenancePerformanceResponseDto,
  EmployeePerformanceDto,
  VendorPerformanceDto,
  MTTRByTypeDto,
  OnTimeMetricsDto,
} from '../dto';
import { MaintenanceStatus, MaintenanceType, Prisma } from '@prisma/client';

/**
 * Use Case: Get Maintenance Performance Report
 *
 * Performance metrics and KPIs for continuous improvement
 * including MTTR, MTBF, and completion rates.
 *
 * Business Value:
 * - Identify top and bottom performers
 * - Set realistic SLAs
 * - Optimize resource allocation
 * - Vendor management and selection
 */
@Injectable()
export class GetMaintenancePerformanceUseCase {
  private readonly logger = new Logger(GetMaintenancePerformanceUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: MaintenancePerformanceFiltersDto,
  ): Promise<MaintenancePerformanceResponseDto> {
    this.logger.log('Generating maintenance performance report');

    try {
      const whereClause = this.buildWhereClause(filters);

      const [
        totalMetrics,
        mttrByType,
        onTimeMetrics,
        employeePerformance,
        vendorPerformance,
        emergencyMetrics,
      ] = await Promise.all([
        this.getTotalPerformanceMetrics(whereClause),
        filters.includeMTTR
          ? this.getMTTRByType(whereClause)
          : Promise.resolve([]),
        filters.includeOnTimeMetrics
          ? this.getOnTimeMetrics(whereClause)
          : Promise.resolve(undefined),
        filters.includeEmployeeMetrics
          ? this.getEmployeePerformance(whereClause)
          : Promise.resolve(undefined),
        filters.includeVendorMetrics
          ? this.getVendorPerformance(whereClause)
          : Promise.resolve(undefined),
        this.getEmergencyResponseMetrics(whereClause),
      ]);

      const startDate =
        filters.startDate || new Date(0).toISOString().split('T')[0];
      const endDate = filters.endDate || new Date().toISOString().split('T')[0];

      return {
        ...totalMetrics,
        mttrByType,
        onTimeMetrics,
        employeePerformance,
        vendorPerformance,
        ...emergencyMetrics,
        startDate,
        endDate,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate performance report: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private buildWhereClause(
    filters: MaintenancePerformanceFiltersDto,
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

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.assetType) {
      where.asset = { assetType: filters.assetType };
    }

    if (filters.assetId) {
      where.assetId = filters.assetId;
    }

    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
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

    return where;
  }

  private async getTotalPerformanceMetrics(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ) {
    const totalCount = await this.prisma.maintenanceRequest.count({
      where: whereClause,
    });

    const completedCount = await this.prisma.maintenanceRequest.count({
      where: {
        ...whereClause,
        status: MaintenanceStatus.COMPLETED,
      },
    });

    // Calculate MTTR (Mean Time To Repair)
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

    let mttr = 0;
    if (completedRequests.length > 0) {
      const totalDays = completedRequests.reduce((sum, req) => {
        const start = new Date(req.startedAt!);
        const end = new Date(req.completedAt!);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      }, 0);
      mttr = Math.round((totalDays / completedRequests.length) * 10) / 10;
    }

    // Estimate MTBF (Mean Time Between Failures) - simplified calculation
    const mtbf =
      completedRequests.length > 1 ? this.calculateMTBF(completedRequests) : 0;

    const completionRate =
      totalCount > 0
        ? Math.round((completedCount / totalCount) * 1000) / 10
        : 0;

    return {
      totalRequests: totalCount,
      completedRequests: completedCount,
      overallCompletionRate: completionRate,
      mttr,
      mtbf,
    };
  }

  private calculateMTBF(
    completedRequests: Array<{
      startedAt: Date | null;
      completedAt: Date | null;
    }>,
  ) {
    if (completedRequests.length < 2) return 0;

    // Sort by completion date
    const sorted = completedRequests
      .filter((r) => r.completedAt)
      .sort(
        (a, b) =>
          new Date(a.completedAt!).getTime() -
          new Date(b.completedAt!).getTime(),
      );

    if (sorted.length < 2) return 0;

    // Calculate average time between completions (as proxy for MTBF)
    let totalDaysBetween = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1].completedAt!);
      const curr = new Date(sorted[i].completedAt!);
      const days = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      totalDaysBetween += days;
    }

    return Math.round((totalDaysBetween / (sorted.length - 1)) * 10) / 10;
  }

  private async getMTTRByType(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<MTTRByTypeDto[]> {
    const types = Object.values(MaintenanceType);

    const results = await Promise.all(
      types.map(async (type) => {
        const completed = await this.prisma.maintenanceRequest.findMany({
          where: {
            ...whereClause,
            maintenanceType: type,
            status: MaintenanceStatus.COMPLETED,
            startedAt: { not: null },
            completedAt: { not: null },
          },
          select: {
            startedAt: true,
            completedAt: true,
          },
        });

        if (completed.length === 0) return null;

        const totalDays = completed.reduce((sum, req) => {
          const start = new Date(req.startedAt!);
          const end = new Date(req.completedAt!);
          return (
            sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          );
        }, 0);

        const mttr = Math.round((totalDays / completed.length) * 10) / 10;

        return {
          type,
          mttr,
          completedCount: completed.length,
        };
      }),
    );

    return results.filter((item): item is MTTRByTypeDto => item !== null);
  }

  private async getOnTimeMetrics(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<OnTimeMetricsDto> {
    const completed = await this.prisma.maintenanceRequest.findMany({
      where: {
        ...whereClause,
        status: MaintenanceStatus.COMPLETED,
        scheduledDate: { not: null },
        completedAt: { not: null },
      },
      select: {
        scheduledDate: true,
        completedAt: true,
      },
    });

    let onTimeCount = 0;
    let lateCount = 0;
    let totalDelayDays = 0;

    completed.forEach((req) => {
      const scheduled = new Date(req.scheduledDate!);
      const completed = new Date(req.completedAt!);

      if (completed <= scheduled) {
        onTimeCount++;
      } else {
        lateCount++;
        const delayDays =
          (completed.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24);
        totalDelayDays += delayDays;
      }
    });

    const totalCompleted = completed.length;
    const onTimeRate =
      totalCompleted > 0
        ? Math.round((onTimeCount / totalCompleted) * 1000) / 10
        : 0;
    const avgDelayDays =
      lateCount > 0 ? Math.round((totalDelayDays / lateCount) * 10) / 10 : 0;

    return {
      totalCompleted,
      onTimeCompletions: onTimeCount,
      lateCompletions: lateCount,
      onTimeRate,
      averageDelayDays: avgDelayDays,
    };
  }

  private async getEmployeePerformance(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<EmployeePerformanceDto[]> {
    const employeeData = await this.prisma.maintenanceRequest.groupBy({
      by: ['assignedTo'],
      where: {
        ...whereClause,
        assignedTo: { not: null },
      },
      _count: true,
    });

    const performances = await Promise.all(
      employeeData.map(async (item) => {
        if (!item.assignedTo) return null;

        const empWhere = { ...whereClause, assignedTo: item.assignedTo };

        const [completed, completedData] = await Promise.all([
          this.prisma.maintenanceRequest.count({
            where: {
              ...empWhere,
              status: MaintenanceStatus.COMPLETED,
            },
          }),
          this.prisma.maintenanceRequest.findMany({
            where: {
              ...empWhere,
              status: MaintenanceStatus.COMPLETED,
              startedAt: { not: null },
              completedAt: { not: null },
            },
            select: {
              startedAt: true,
              completedAt: true,
              scheduledDate: true,
            },
          }),
          this.prisma.maintenanceRequest.count({
            where: {
              ...empWhere,
              status: MaintenanceStatus.COMPLETED,
              scheduledDate: { not: null },
              completedAt: { not: null },
            },
          }),
        ]);

        // Calculate avg completion time
        let avgTime = 0;
        if (completedData.length > 0) {
          const totalDays = completedData.reduce((sum, req) => {
            const start = new Date(req.startedAt!);
            const end = new Date(req.completedAt!);
            return (
              sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
            );
          }, 0);
          avgTime = Math.round((totalDays / completedData.length) * 10) / 10;
        }

        // Calculate on-time completions
        let onTimeCount = 0;
        completedData.forEach((req) => {
          if (req.scheduledDate && req.completedAt) {
            const scheduled = new Date(req.scheduledDate);
            const completed = new Date(req.completedAt);
            if (completed <= scheduled) {
              onTimeCount++;
            }
          }
        });

        const completionRate =
          item._count > 0
            ? Math.round((completed / item._count) * 1000) / 10
            : 0;
        const onTimeRate =
          completedData.length > 0
            ? Math.round((onTimeCount / completedData.length) * 1000) / 10
            : 0;

        return {
          employeeId: item.assignedTo,
          employeeName: 'Employee', // Would need to join with User table
          assignedCount: item._count,
          completedCount: completed,
          completionRate,
          averageCompletionTime: avgTime,
          onTimeCompletions: onTimeCount,
          onTimeRate,
        };
      }),
    );

    return performances
      .filter((item): item is EmployeePerformanceDto => item !== null)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 10);
  }

  private async getVendorPerformance(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<VendorPerformanceDto[]> {
    const vendorData = await this.prisma.maintenanceRequest.groupBy({
      by: ['vendor'],
      where: {
        ...whereClause,
        vendor: { not: null },
      },
      _count: true,
      _sum: {
        actualCost: true,
        estimatedCost: true,
      },
    });

    const performances = await Promise.all(
      vendorData.map(async (item) => {
        if (!item.vendor) return null;

        const vendorWhere = { ...whereClause, vendor: item.vendor };

        const [completed, completedData] = await Promise.all([
          this.prisma.maintenanceRequest.count({
            where: {
              ...vendorWhere,
              status: MaintenanceStatus.COMPLETED,
            },
          }),
          this.prisma.maintenanceRequest.findMany({
            where: {
              ...vendorWhere,
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

        let avgTime = 0;
        if (completedData.length > 0) {
          const totalDays = completedData.reduce((sum, req) => {
            const start = new Date(req.startedAt!);
            const end = new Date(req.completedAt!);
            return (
              sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
            );
          }, 0);
          avgTime = Math.round((totalDays / completedData.length) * 10) / 10;
        }

        const totalCost = Number(item._sum.actualCost || 0);
        const estimatedCost = Number(item._sum.estimatedCost || 0);
        const avgCost =
          item._count > 0
            ? Math.round((totalCost / item._count) * 100) / 100
            : 0;
        const completionRate =
          item._count > 0
            ? Math.round((completed / item._count) * 1000) / 10
            : 0;
        const costVariance = estimatedCost - totalCost;
        const costVariancePercentage =
          estimatedCost > 0
            ? Math.round((costVariance / estimatedCost) * 1000) / 10
            : 0;

        return {
          vendor: item.vendor,
          assignedCount: item._count,
          completedCount: completed,
          completionRate,
          averageCompletionTime: avgTime,
          totalCost: Math.round(totalCost * 100) / 100,
          averageCostPerRequest: avgCost,
          costVariancePercentage,
        };
      }),
    );

    return performances
      .filter((item): item is VendorPerformanceDto => item !== null)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 10);
  }

  private async getEmergencyResponseMetrics(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ) {
    const emergencyRequests = await this.prisma.maintenanceRequest.findMany({
      where: {
        ...whereClause,
        maintenanceType: MaintenanceType.EMERGENCY,
        startedAt: { not: undefined },
      },
      select: {
        createdAt: true,
        startedAt: true,
      },
    });

    if (emergencyRequests.length === 0) {
      return {
        emergencyResponseRate: 0,
        averageEmergencyResponseTime: 0,
      };
    }

    // Calculate response time in hours
    const totalResponseHours = emergencyRequests.reduce((sum, req) => {
      const created = new Date(req.createdAt);
      const started = new Date(req.startedAt!);
      const hours = (started.getTime() - created.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    // Count requests responded within 2 hours (SLA example)
    const slaHours = 2;
    const withinSLA = emergencyRequests.filter((req) => {
      const created = new Date(req.createdAt);
      const started = new Date(req.startedAt!);
      const hours = (started.getTime() - created.getTime()) / (1000 * 60 * 60);
      return hours <= slaHours;
    }).length;

    const responseRate =
      emergencyRequests.length > 0
        ? Math.round((withinSLA / emergencyRequests.length) * 1000) / 10
        : 0;
    const avgResponseTime =
      Math.round((totalResponseHours / emergencyRequests.length) * 10) / 10;

    return {
      emergencyResponseRate: responseRate,
      averageEmergencyResponseTime: avgResponseTime,
    };
  }
}
