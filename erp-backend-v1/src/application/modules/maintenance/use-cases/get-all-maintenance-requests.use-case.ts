import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  IMaintenanceRepository,
  MAINTENANCE_REPOSITORY,
} from '../repositories';
import { MaintenanceFiltersDto, MaintenanceRequestResponseDto } from '../dto';

@Injectable()
export class GetAllMaintenanceRequestsUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly repository: IMaintenanceRepository,
    private readonly logger: WinstonLoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(filters: MaintenanceFiltersDto): Promise<{
    data: MaintenanceRequestResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const { data, total } = await this.repository.findAll(filters);
      const maintenanceIds = data.map((entity) => entity.id);
      const financeCosts =
        maintenanceIds.length > 0
          ? await this.prisma.cost.findMany({
              where: {
                referenceType: 'maintenance_request',
                referenceId: { in: maintenanceIds },
              },
              select: {
                id: true,
                referenceId: true,
                amount: true,
                paymentStatus: true,
                approvedAt: true,
                rejectedReason: true,
                approver: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            })
          : [];

      const financeCostByMaintenanceId = new Map(
        financeCosts.map((cost) => [cost.referenceId, cost]),
      );

      return {
        data: data.map((entity) => {
          const financeCost = financeCostByMaintenanceId.get(entity.id);

          return {
            id: entity.id,
            maintenanceNumber: entity.maintenanceNumber,
            assetId: entity.assetId,
            projectId: entity.projectId,
            maintenanceType: entity.maintenanceType,
            priority: entity.priority,
            status: entity.status,
            title: entity.title,
            description: entity.description,
            scheduledDate: entity.scheduledDate,
            startedAt: entity.startedAt,
            completedAt: entity.completedAt,
            estimatedCost: entity.estimatedCost,
            actualCost: entity.actualCost,
            vendor: entity.vendor,
            vendorContact: entity.vendorContact,
            assignedTo: entity.assignedTo,
            odometerReading: entity.odometerReading,
            workPerformed: entity.workPerformed,
            partsReplaced: entity.partsReplaced,
            notes: entity.notes,
            approvedBy: entity.approvedBy,
            approvedAt: entity.approvedAt,
            createdBy: entity.createdBy,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            rowVersion: entity.rowVersion,
            asset: entity.asset
              ? {
                  id: entity.asset.id,
                  name: entity.asset.name,
                  assetNumber: entity.asset.assetNumber,
                }
              : null,
            financeCost: financeCost
              ? {
                  id: financeCost.id,
                  amount: Number(financeCost.amount),
                  paymentStatus: financeCost.paymentStatus,
                  approvedAt: financeCost.approvedAt,
                  rejectedReason: financeCost.rejectedReason,
                  approver: financeCost.approver,
                }
              : null,
          };
        }),
        total,
        page: filters.page || 1,
        limit: filters.limit || 10,
      };
    } catch (error) {
      this.logger.error('Failed to get all maintenance requests');
      throw error;
    }
  }
}
