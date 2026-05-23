import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  PreventiveMaintenanceFiltersDto,
  PreventiveMaintenanceResponseDto,
  UpcomingPreventiveMaintenanceDto,
  OverduePreventiveMaintenanceDto,
  UnscheduledAssetDto,
  CostSavingsAnalysisDto,
} from '../dto';
import { MaintenanceType, MaintenanceStatus, Prisma } from '@prisma/client';

/**
 * Use Case: Get Preventive Maintenance Report
 *
 * Strategic preventive maintenance planning and ROI analysis
 * to reduce costs and improve asset reliability.
 *
 * Business Value:
 * - Proactive maintenance scheduling
 * - Cost reduction through preventive strategy
 * - Asset reliability improvement
 * - Risk mitigation
 */
@Injectable()
export class GetPreventiveMaintenanceUseCase {
  private readonly logger = new Logger(GetPreventiveMaintenanceUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: PreventiveMaintenanceFiltersDto,
  ): Promise<PreventiveMaintenanceResponseDto> {
    this.logger.log('Generating preventive maintenance report');

    try {
      const whereClause = this.buildWhereClause(filters);

      const [
        totalMetrics,
        upcomingSchedule,
        overduePreventive,
        unscheduledAssets,
        costSavings,
      ] = await Promise.all([
        this.getTotalPreventiveMetrics(whereClause),
        filters.includeUpcoming
          ? this.getUpcomingPreventive(whereClause, filters.daysAhead || 30)
          : Promise.resolve(undefined),
        filters.includeOverdue
          ? this.getOverduePreventive(whereClause)
          : Promise.resolve(undefined),
        filters.includeUnscheduled
          ? this.getUnscheduledAssets(filters)
          : Promise.resolve(undefined),
        filters.includeCostSavings
          ? this.getCostSavingsAnalysis(filters)
          : Promise.resolve(undefined),
      ]);

      const startDate =
        filters.startDate || new Date(0).toISOString().split('T')[0];
      const endDate = filters.endDate || new Date().toISOString().split('T')[0];

      return {
        ...totalMetrics,
        upcomingSchedule,
        overduePreventive,
        unscheduledAssets,
        costSavings,
        startDate,
        endDate,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate preventive maintenance report: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private buildWhereClause(
    filters: PreventiveMaintenanceFiltersDto,
  ): Prisma.MaintenanceRequestWhereInput {
    const where: Prisma.MaintenanceRequestWhereInput = {
      maintenanceType: MaintenanceType.PREVENTIVE,
    };

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

  private async getTotalPreventiveMetrics(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ) {
    const [totalCount, completedCount, upcomingCount, overdueCount, costs] =
      await Promise.all([
        this.prisma.maintenanceRequest.count({ where: whereClause }),
        this.prisma.maintenanceRequest.count({
          where: {
            ...whereClause,
            status: MaintenanceStatus.COMPLETED,
          },
        }),
        this.prisma.maintenanceRequest.count({
          where: {
            ...whereClause,
            status: {
              in: [MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS],
            },
            scheduledDate: {
              gte: new Date(),
            },
          },
        }),
        this.prisma.maintenanceRequest.count({
          where: {
            ...whereClause,
            status: {
              in: [MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS],
            },
            scheduledDate: {
              lt: new Date(),
            },
          },
        }),
        this.prisma.maintenanceRequest.aggregate({
          where: whereClause,
          _sum: {
            actualCost: true,
          },
        }),
      ]);

    // Count those completed on or before scheduled date
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
    completed.forEach((req) => {
      const scheduled = new Date(req.scheduledDate!);
      const completedDate = new Date(req.completedAt!);
      if (completedDate <= scheduled) {
        onTimeCount++;
      }
    });

    const complianceRate =
      completed.length > 0
        ? Math.round((onTimeCount / completed.length) * 1000) / 10
        : 0;

    return {
      totalPreventiveCount: totalCount,
      completedPreventiveCount: completedCount,
      upcomingCount,
      overdueCount,
      complianceRate,
      totalPreventiveCost: Number(costs._sum.actualCost || 0),
    };
  }

  private async getUpcomingPreventive(
    whereClause: Prisma.MaintenanceRequestWhereInput,
    daysAhead: number,
  ): Promise<UpcomingPreventiveMaintenanceDto[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const upcoming = await this.prisma.maintenanceRequest.findMany({
      where: {
        ...whereClause,
        status: {
          in: [MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS],
        },
        scheduledDate: {
          gte: now,
          lte: futureDate,
        },
      },
      select: {
        maintenanceNumber: true,
        title: true,
        assetId: true,
        scheduledDate: true,
        estimatedCost: true,
        status: true,
        asset: {
          select: {
            assetNumber: true,
            name: true,
            assetType: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
      take: 50,
    });

    return upcoming.map((req) => {
      const scheduled = new Date(req.scheduledDate!);
      const daysUntil = Math.ceil(
        (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        maintenanceNumber: req.maintenanceNumber,
        title: req.title,
        assetId: req.assetId,
        assetNumber: req.asset.assetNumber,
        assetName: req.asset.name,
        assetType: req.asset.assetType,
        scheduledDate: scheduled,
        daysUntilDue: daysUntil,
        estimatedCost: Number(req.estimatedCost || 0),
        status: req.status,
      };
    });
  }

  private async getOverduePreventive(
    whereClause: Prisma.MaintenanceRequestWhereInput,
  ): Promise<OverduePreventiveMaintenanceDto[]> {
    const now = new Date();

    const overdue = await this.prisma.maintenanceRequest.findMany({
      where: {
        ...whereClause,
        status: {
          in: [MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS],
        },
        scheduledDate: {
          lt: now,
        },
      },
      select: {
        maintenanceNumber: true,
        title: true,
        assetId: true,
        scheduledDate: true,
        priority: true,
        asset: {
          select: {
            assetNumber: true,
            name: true,
            assetType: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
      take: 50,
    });

    return overdue.map((req) => {
      const scheduled = new Date(req.scheduledDate!);
      const daysOverdue = Math.floor(
        (now.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        assetId: req.assetId,
        assetNumber: req.asset.assetNumber,
        assetName: req.asset.name,
        assetType: req.asset.assetType,
        maintenanceNumber: req.maintenanceNumber,
        title: req.title,
        scheduledDate: scheduled,
        daysOverdue,
        priority: req.priority,
      };
    });
  }

  private async getUnscheduledAssets(
    filters: PreventiveMaintenanceFiltersDto,
  ): Promise<UnscheduledAssetDto[]> {
    // Find assets with corrective maintenance but no preventive
    const assetsWithCorrectiveOnly = await this.prisma.asset.findMany({
      where: {
        assetType: filters.assetType,
        maintenance: {
          some: {
            maintenanceType: MaintenanceType.CORRECTIVE,
          },
          none: {
            maintenanceType: MaintenanceType.PREVENTIVE,
          },
        },
      },
      select: {
        id: true,
        assetNumber: true,
        name: true,
        assetType: true,
        purchaseDate: true,
        maintenance: {
          where: {
            maintenanceType: MaintenanceType.CORRECTIVE,
          },
          select: {
            actualCost: true,
          },
        },
      },
      take: 50,
    });

    const now = new Date();

    return assetsWithCorrectiveOnly.map((asset) => {
      const purchaseDate = asset.purchaseDate || new Date();
      const daysSince = Math.floor(
        (now.getTime() - new Date(purchaseDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const correctiveCount = asset.maintenance.length;
      const totalCorrectiveCost = asset.maintenance.reduce(
        (sum, m) => sum + Number(m.actualCost || 0),
        0,
      );

      return {
        assetId: asset.id,
        assetNumber: asset.assetNumber,
        assetName: asset.name,
        assetType: asset.assetType,
        purchaseDate: new Date(purchaseDate),
        daysSincePurchase: daysSince,
        correctiveMaintenanceCount: correctiveCount,
        totalCorrectiveCost: Math.round(totalCorrectiveCost * 100) / 100,
      };
    });
  }

  private async getCostSavingsAnalysis(
    filters: PreventiveMaintenanceFiltersDto,
  ): Promise<CostSavingsAnalysisDto> {
    const baseWhere: Prisma.MaintenanceRequestWhereInput = {};

    if (filters.startDate || filters.endDate) {
      baseWhere.createdAt = {};
      if (filters.startDate) {
        baseWhere.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        baseWhere.createdAt.lte = new Date(filters.endDate);
      }
    }

    if (filters.assetType) {
      baseWhere.asset = { assetType: filters.assetType };
    }

    // Get preventive maintenance data
    const [preventiveData, correctiveData] = await Promise.all([
      this.prisma.maintenanceRequest.aggregate({
        where: {
          ...baseWhere,
          maintenanceType: MaintenanceType.PREVENTIVE,
        },
        _count: true,
        _sum: {
          actualCost: true,
        },
      }),
      this.prisma.maintenanceRequest.aggregate({
        where: {
          ...baseWhere,
          maintenanceType: MaintenanceType.CORRECTIVE,
        },
        _count: true,
        _sum: {
          actualCost: true,
        },
      }),
    ]);

    const preventiveCount = preventiveData._count || 0;
    const preventiveCost = Number(preventiveData._sum.actualCost || 0);
    const correctiveCount = correctiveData._count || 0;
    const correctiveCost = Number(correctiveData._sum.actualCost || 0);

    const avgPreventiveCost =
      preventiveCount > 0
        ? Math.round((preventiveCost / preventiveCount) * 100) / 100
        : 0;
    const avgCorrectiveCost =
      correctiveCount > 0
        ? Math.round((correctiveCost / correctiveCount) * 100) / 100
        : 0;

    // Estimated savings: assume each preventive maintenance prevents 2 corrective maintenances
    const estimatedSavingsPerPreventive =
      avgCorrectiveCost * 2 - avgPreventiveCost > 0
        ? Math.round((avgCorrectiveCost * 2 - avgPreventiveCost) * 100) / 100
        : 0;

    const totalEstimatedSavings =
      Math.round(estimatedSavingsPerPreventive * preventiveCount * 100) / 100;

    const preventiveToCorrectiveRatio =
      correctiveCount > 0
        ? Math.round(
            (preventiveCount / (preventiveCount + correctiveCount)) * 1000,
          ) / 10
        : 0;

    return {
      preventiveCount,
      preventiveCost: Math.round(preventiveCost * 100) / 100,
      correctiveCount,
      correctiveCost: Math.round(correctiveCost * 100) / 100,
      avgPreventiveCost,
      avgCorrectiveCost,
      estimatedSavingsPerPreventive,
      totalEstimatedSavings,
      preventiveToCorrectiveRatio,
    };
  }
}
