import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import {
  IMaintenanceRepository,
  MAINTENANCE_REPOSITORY,
} from '../repositories';
import {
  CreateMaintenanceRequestDto,
  MaintenanceRequestResponseDto,
} from '../dto';

/** Project statuses that are eligible to bear maintenance costs */
const ALLOWED_PROJECT_STATUSES: ProjectStatus[] = [
  ProjectStatus.ACTIVE,
  ProjectStatus.ON_HOLD,
  ProjectStatus.PLANNING,
];

/**
 * Use case for creating a new maintenance request.
 *
 * Project cost allocation is derived automatically from the asset's active
 * ProjectAsset records:
 *  - If the asset has no project assignments → allowed, no cost allocation.
 *  - If ALL linked projects are ineligible → BadRequestException.
 *  - If SOME are ineligible → redistribute percentages among eligible ones
 *    and record a note explaining the exclusions.
 */
@Injectable()
export class CreateMaintenanceRequestUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly repository: IMaintenanceRepository,
    private readonly logger: WinstonLoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    dto: CreateMaintenanceRequestDto,
    userId: string,
  ): Promise<MaintenanceRequestResponseDto> {
    this.logger.log(`Creating maintenance request for asset ${dto.assetId}`);

    // ── 1. Resolve project allocations from the asset's active assignments ──
    const activeAssignments = await this.prisma.projectAsset.findMany({
      where: { assetId: dto.assetId, isActive: true },
      select: {
        projectId: true,
        percentage: true,
        project: { select: { id: true, name: true, status: true } },
      },
    });

    // Separate eligible vs ineligible projects
    const eligible = activeAssignments.filter((pa) =>
      ALLOWED_PROJECT_STATUSES.includes(pa.project.status),
    );
    const ineligible = activeAssignments.filter(
      (pa) => !ALLOWED_PROJECT_STATUSES.includes(pa.project.status),
    );

    // Guard: asset IS linked to projects but NONE are eligible
    if (activeAssignments.length > 0 && eligible.length === 0) {
      const projectList = activeAssignments
        .map((pa) => `"${pa.project.name}" (${pa.project.status})`)
        .join(', ');
      throw new BadRequestException(
        `Cannot create maintenance request: all projects linked to this asset are inactive. ` +
          `Linked projects: ${projectList}. ` +
          `Allowed statuses: ${ALLOWED_PROJECT_STATUSES.join(', ')}.`,
      );
    }

    // ── 2. Normalise percentages if some projects were excluded ─────────────
    type AllocationInput = {
      projectId: string;
      percentage: number;
      note?: string;
    };
    let allocations: AllocationInput[] = [];
    let allocationNote: string | undefined;

    if (eligible.length > 0) {
      const totalEligiblePct = eligible.reduce(
        (sum, pa) => sum + Number(pa.percentage),
        0,
      );

      if (ineligible.length > 0) {
        // Build exclusion note
        const excluded = ineligible
          .map((pa) => `"${pa.project.name}" (${pa.project.status})`)
          .join(', ');
        allocationNote =
          `The following projects were excluded because their status is not eligible: ` +
          `${excluded}. Percentages redistributed among eligible projects.`;
        this.logger.warn(allocationNote);
      }

      // Normalise: redistribute excluded percentages so sum = exactly 100
      let runningSum = 0;
      allocations = eligible.map((pa, idx) => {
        const isLast = idx === eligible.length - 1;
        // Last item absorbs rounding remainder to guarantee exact 100%
        const pct = isLast
          ? 100 - runningSum
          : Math.round((Number(pa.percentage) / totalEligiblePct) * 10000) /
            100;
        runningSum += isLast ? 0 : pct;
        return {
          projectId: pa.projectId,
          percentage: pct,
          note: allocationNote,
        };
      });
    }

    // ── 3. Primary project = highest allocation (or null if unassigned) ──────
    const primaryProjectId =
      allocations.length > 0
        ? allocations.reduce((max, a) =>
            a.percentage > max.percentage ? a : max,
          ).projectId
        : null;

    // ── 4. Persist inside a transaction ─────────────────────────────────────
    const entity = await this.prisma.$transaction(
      async (tx) => {
        // Generate maintenance number inside the transaction (race-condition-safe)
        const lastMaintenance = await tx.maintenanceRequest.findFirst({
          orderBy: { maintenanceNumber: 'desc' },
          select: { maintenanceNumber: true },
        });
        let maintenanceNumber = 'MNT-0001';
        if (lastMaintenance) {
          const lastNum = parseInt(
            lastMaintenance.maintenanceNumber.split('-')[1],
            10,
          );
          maintenanceNumber = `MNT-${(lastNum + 1).toString().padStart(4, '0')}`;
        }

        // Create the maintenance request
        const created = await tx.maintenanceRequest.create({
          data: {
            maintenanceNumber,
            assetId: dto.assetId,
            projectId: primaryProjectId,
            maintenanceType: dto.maintenanceType,
            priority: dto.priority,
            title: dto.title,
            description: dto.description,
            scheduledDate: dto.scheduledDate
              ? new Date(dto.scheduledDate)
              : null,
            estimatedCost: dto.estimatedCost,
            vendor: dto.vendor,
            vendorContact: dto.vendorContact,
            assignedTo: dto.assignedTo,
            odometerReading: dto.odometerReading,
            notes: dto.notes,
            createdBy: userId,
          },
          include: {
            attachments: true,
            asset: { select: { id: true, name: true, assetNumber: true } },
          },
        });

        // Create allocation snapshot records
        if (allocations.length > 0) {
          await tx.maintenanceProjectAllocation.createMany({
            data: allocations.map((a) => ({
              maintenanceId: created.id,
              projectId: a.projectId,
              percentage: a.percentage,
              note: a.note ?? null,
            })),
          });
        }

        return created;
      },
      { isolationLevel: 'Serializable' },
    );

    this.logger.log(`Maintenance request created: ${entity.maintenanceNumber}`);

    // ── 5. Update asset status to UNDER_MAINTENANCE (outside serializable tx) ─
    const currentAsset = await this.prisma.asset.findUnique({
      where: { id: dto.assetId },
      select: { status: true },
    });
    await this.prisma.asset.update({
      where: { id: dto.assetId },
      data: {
        status: 'UNDER_MAINTENANCE',
        previousStatus: currentAsset?.status ?? 'AVAILABLE',
      },
    });

    // ── 7. Fetch full record with allocations for response ───────────────────
    const allocationsRecord =
      await this.prisma.maintenanceProjectAllocation.findMany({
        where: { maintenanceId: entity.id },
        include: { project: { select: { name: true } } },
      });

    return this.mapToResponseDto(entity, allocationsRecord);
  }

  private mapToResponseDto(
    entity: any,
    allocations: any[],
  ): MaintenanceRequestResponseDto {
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
        projectName: a.project?.name ?? null,
        percentage: Number(a.percentage),
        allocatedAmount: a.allocatedAmount ? Number(a.allocatedAmount) : null,
        note: a.note,
      })),
    };
  }
}
