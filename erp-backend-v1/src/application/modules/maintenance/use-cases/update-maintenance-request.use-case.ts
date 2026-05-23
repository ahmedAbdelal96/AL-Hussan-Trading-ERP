import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CostType, MaintenanceStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  IMaintenanceRepository,
  MAINTENANCE_REPOSITORY,
} from '../repositories';
import {
  UpdateMaintenanceRequestDto,
  MaintenanceRequestResponseDto,
} from '../dto';

/** Valid status transitions for maintenance workflow */
const VALID_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  [MaintenanceStatus.PENDING]: [
    MaintenanceStatus.IN_PROGRESS,
    MaintenanceStatus.ON_HOLD,
    MaintenanceStatus.CANCELLED,
  ],
  [MaintenanceStatus.IN_PROGRESS]: [
    MaintenanceStatus.ON_HOLD,
    MaintenanceStatus.COMPLETED,
    MaintenanceStatus.CANCELLED,
  ],
  [MaintenanceStatus.ON_HOLD]: [
    MaintenanceStatus.IN_PROGRESS,
    MaintenanceStatus.CANCELLED,
  ],
  [MaintenanceStatus.COMPLETED]: [],
  [MaintenanceStatus.CANCELLED]: [],
};

const LOCKED_FINANCE_STATUSES = new Set<PaymentStatus>([
  PaymentStatus.APPROVED,
  PaymentStatus.PAID,
  PaymentStatus.PARTIALLY_PAID,
  PaymentStatus.OVERDUE,
]);

/**
 * Use case for updating a maintenance request.
 *
 * Key behaviour on COMPLETED transition:
 *  - If actualCost > 0 and no Cost record exists yet (idempotency guard):
 *    • Allocates cost across projects using the snapshot stored in
 *      MaintenanceProjectAllocation.
 *    • Creates one Cost record.
 *      - Single-project: direct Cost only (no CostAllocation row)
 *      - Multi-project: allocated Cost + CostAllocation rows
 *    • Updates allocatedAmount on each MaintenanceProjectAllocation row.
 */
@Injectable()
export class UpdateMaintenanceRequestUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly repository: IMaintenanceRepository,
    private readonly logger: WinstonLoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    id: string,
    dto: UpdateMaintenanceRequestDto,
    userId: string,
  ): Promise<MaintenanceRequestResponseDto> {
    try {
      // ── 1. Load current record ────────────────────────────────────────────
      const current = await this.repository.findById(id);
      if (!current) {
        throw new NotFoundException('Maintenance request not found');
      }

      const financeCost = await this.prisma.cost.findFirst({
        where: {
          referenceType: 'maintenance_request',
          referenceId: id,
        },
        select: {
          id: true,
          paymentStatus: true,
        },
      });

      if (
        dto.actualCost !== undefined &&
        dto.actualCost !== current.actualCost &&
        financeCost &&
        LOCKED_FINANCE_STATUSES.has(financeCost.paymentStatus)
      ) {
        throw new BadRequestException(
          'Actual cost cannot be changed after finance approval.',
        );
      }

      // ── 2. Validate status transition ─────────────────────────────────────
      if (dto.status && dto.status !== current.status) {
        const allowed = VALID_TRANSITIONS[current.status] || [];
        if (!allowed.includes(dto.status)) {
          throw new BadRequestException(
            `Cannot transition from ${current.status} to ${dto.status}`,
          );
        }
      }

      // ── 2.5. Override allocation percentages if user adjusted them ────────
      const isCompletingNow =
        dto.status === MaintenanceStatus.COMPLETED &&
        current.status !== MaintenanceStatus.COMPLETED;

      if (
        isCompletingNow &&
        dto.projectAllocations &&
        dto.projectAllocations.length > 0
      ) {
        // Validate that all percentages sum to 100 (±0.01 float tolerance)
        const total = dto.projectAllocations.reduce(
          (sum, a) => sum + a.percentage,
          0,
        );
        if (Math.abs(total - 100) > 0.01) {
          throw new BadRequestException(
            `Allocation percentages must sum to 100. Provided total: ${total.toFixed(2)}`,
          );
        }

        // Validate every provided projectId belongs to this maintenance record
        const existingAllocations =
          await this.prisma.maintenanceProjectAllocation.findMany({
            where: { maintenanceId: id },
            select: { projectId: true },
          });
        const existingProjectIds = new Set(
          existingAllocations.map((a) => a.projectId),
        );

        for (const override of dto.projectAllocations) {
          if (!existingProjectIds.has(override.projectId)) {
            throw new BadRequestException(
              `Project "${override.projectId}" is not part of this maintenance request's allocations.`,
            );
          }
        }

        // Persist the new percentages — createCostRecords will read them
        for (const override of dto.projectAllocations) {
          await this.prisma.maintenanceProjectAllocation.updateMany({
            where: { maintenanceId: id, projectId: override.projectId },
            data: { percentage: override.percentage },
          });
        }

        this.logger.log(
          `Allocation percentages overridden for maintenance ${id} by user ${userId}.`,
        );
      }

      // ── 3. Persist the update ─────────────────────────────────────────────
      const completedAt =
        dto.completedAt !== undefined
          ? new Date(dto.completedAt)
          : isCompletingNow
            ? new Date()
            : undefined;

      const entity = await this.repository.update(id, {
        maintenanceType: dto.maintenanceType,
        priority: dto.priority,
        status: dto.status,
        title: dto.title,
        description: dto.description,
        scheduledDate: dto.scheduledDate
          ? new Date(dto.scheduledDate)
          : undefined,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined,
        completedAt,
        estimatedCost: dto.estimatedCost,
        actualCost: dto.actualCost,
        vendor: dto.vendor,
        vendorContact: dto.vendorContact,
        assignedTo: dto.assignedTo,
        odometerReading: dto.odometerReading,
        workPerformed: dto.workPerformed,
        partsReplaced: dto.partsReplaced,
        notes: dto.notes,
        rowVersion: dto.rowVersion,
      });

      this.logger.log(`Maintenance request updated: ${id}`);

      // ── 4. COMPLETED + actualCost → create cost allocation records ────────
      const actualCost =
        dto.actualCost !== undefined ? dto.actualCost : entity.actualCost;

      if (isCompletingNow && actualCost && actualCost > 0) {
        await this.createCostRecords(id, entity, actualCost, userId);
      }

      // ── 4.5. Revert asset status on COMPLETED or CANCELLED ────────────────
      const isCancellingNow =
        dto.status === MaintenanceStatus.CANCELLED &&
        current.status !== MaintenanceStatus.CANCELLED;

      if (isCompletingNow || isCancellingNow) {
        const assetData = await this.prisma.asset.findUnique({
          where: { id: entity.assetId },
          select: { previousStatus: true },
        });
        await this.prisma.asset.update({
          where: { id: entity.assetId },
          data: {
            status: assetData?.previousStatus ?? 'AVAILABLE',
            previousStatus: null,
            ...(isCompletingNow && { lastMaintenanceDate: new Date() }),
          },
        });
        this.logger.log(
          `Asset ${entity.assetId} status reverted to ` +
            `${assetData?.previousStatus ?? 'AVAILABLE'} after maintenance ${id} ` +
            `was ${dto.status}.`,
        );
      }

      // ── 5. Build response ─────────────────────────────────────────────────
      const allocations =
        await this.prisma.maintenanceProjectAllocation.findMany({
          where: { maintenanceId: id },
          include: { project: { select: { name: true } } },
        });
      const responseFinanceCost = await this.prisma.cost.findFirst({
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
        projectAllocations: allocations.map((a) => ({
          id: a.id,
          projectId: a.projectId,
          projectName: (a as any).project?.name ?? null,
          percentage: Number(a.percentage),
          allocatedAmount: a.allocatedAmount ? Number(a.allocatedAmount) : null,
          note: a.note,
        })),
        financeCost: responseFinanceCost
          ? {
              id: responseFinanceCost.id,
              amount: Number(responseFinanceCost.amount),
              paymentStatus: responseFinanceCost.paymentStatus,
              approvedAt: responseFinanceCost.approvedAt,
              rejectedReason: responseFinanceCost.rejectedReason,
              approver: responseFinanceCost.approver,
            }
          : null,
      };
    } catch (error) {
      this.logger.error('Failed to update maintenance request');
      throw error;
    }
  }

  /**
   * Creates Cost + CostAllocation records for a completed maintenance request.
   * Idempotent: skips silently if a Cost record already references this maintenance.
   */
  private async createCostRecords(
    maintenanceId: string,
    entity: any,
    actualCost: number,
    userId: string,
  ): Promise<void> {
    // Idempotency check: never create duplicate Cost records
    const existingCost = await this.prisma.cost.findFirst({
      where: {
        referenceType: 'maintenance_request',
        referenceId: maintenanceId,
      },
    });
    if (existingCost) {
      this.logger.warn(
        `Cost record already exists for maintenance ${maintenanceId} — skipping creation.`,
      );
      return;
    }

    const allocations = await this.prisma.maintenanceProjectAllocation.findMany(
      {
        where: { maintenanceId },
      },
    );

    await this.prisma.$transaction(async (tx) => {
      const isMultiProject = allocations.length > 1;

      // Create the master Cost record
      const cost = await tx.cost.create({
        data: {
          projectId: allocations.length === 1 ? allocations[0].projectId : null,
          isAllocated: isMultiProject,
          costType: CostType.MAINTENANCE,
          referenceType: 'maintenance_request',
          referenceId: maintenanceId,
          amount: actualCost,
          amountBeforeTax: actualCost,
          currency: 'SAR',
          transactionDate: new Date(),
          description: `Maintenance: ${entity.title} (${entity.maintenanceNumber})`,
          createdBy: userId,
        },
      });

      if (isMultiProject && allocations.length > 0) {
        // Precise allocation arithmetic — last row absorbs rounding remainder
        let distributed = 0;
        for (let i = 0; i < allocations.length; i++) {
          const alloc = allocations[i];
          const isLast = i === allocations.length - 1;
          const amount = isLast
            ? Math.round((actualCost - distributed) * 100) / 100
            : Math.round((Number(alloc.percentage) / 100) * actualCost * 100) /
              100;

          distributed += isLast ? 0 : amount;

          // Create CostAllocation row
          await tx.costAllocation.create({
            data: {
              costId: cost.id,
              projectId: alloc.projectId,
              allocatedAmount: amount,
              percentage: alloc.percentage,
              notes: alloc.note ?? null,
            },
          });

          // Update allocation snapshot with the real amount
          await tx.maintenanceProjectAllocation.update({
            where: { id: alloc.id },
            data: { allocatedAmount: amount },
          });
        }
      }
    });

    this.logger.log(
      `Cost records created for maintenance ${entity.maintenanceNumber}: ` +
        `${actualCost} SAR across ${allocations.length || 0} project(s).`,
    );
  }
}
