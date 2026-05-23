import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import {
  IMaintenanceRepository,
  MAINTENANCE_REPOSITORY,
} from '../repositories';
import { MaintenanceRequestResponseDto } from '../dto';

/**
 * Use case for getting a maintenance request by ID
 */
@Injectable()
export class GetMaintenanceRequestUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly repository: IMaintenanceRepository,
    private readonly logger: WinstonLoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string): Promise<MaintenanceRequestResponseDto> {
    try {
      const entity = await this.repository.findById(id);

      if (!entity) {
        throw new NotFoundException(
          `Maintenance request with ID ${id} not found`,
        );
      }

      // Get attachments
      const attachments = await this.repository.getAttachments(id);

      // Get project allocations with project names
      const allocations =
        await this.prisma.maintenanceProjectAllocation.findMany({
          where: { maintenanceId: id },
          include: { project: { select: { id: true, name: true } } },
          orderBy: { percentage: 'desc' },
        });
      const financeCost = await this.prisma.cost.findFirst({
        where: {
          referenceType: 'maintenance_request',
          referenceId: id,
        },
        select: {
          id: true,
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
      });

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
        attachments: attachments.map((a) => ({
          id: a.id,
          maintenanceId: a.maintenanceId,
          fileName: a.fileName,
          filePath: a.filePath,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
          description: a.description,
          uploadedBy: a.uploadedBy,
          uploadedAt: a.uploadedAt,
        })),
        projectAllocations: allocations.map((a) => ({
          id: a.id,
          projectId: a.projectId,
          projectName: a.project?.name ?? null,
          percentage: Number(a.percentage),
          allocatedAmount: a.allocatedAmount ? Number(a.allocatedAmount) : null,
          note: a.note,
        })),
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
    } catch (error) {
      this.logger.error('Failed to get maintenance request');
      throw error;
    }
  }
}
