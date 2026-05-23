import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { IMaintenanceRepository } from './maintenance.repository.interface';
import {
  MaintenanceRequestEntity,
  MaintenanceAttachmentEntity,
} from '../entities';
import { MaintenanceFiltersDto } from '../dto';
import { MaintenanceAttachment, Prisma } from '@prisma/client';

const maintenanceRequestInclude = {
  attachments: true,
  asset: {
    select: {
      id: true,
      name: true,
      assetNumber: true,
    },
  },
} satisfies Prisma.MaintenanceRequestInclude;

type MaintenanceRecord = Prisma.MaintenanceRequestGetPayload<{
  include: typeof maintenanceRequestInclude;
}>;
type AttachmentRecord = MaintenanceAttachment;

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const toErrorTrace = (error: unknown): string =>
  error instanceof Error ? (error.stack ?? error.message) : String(error);

/**
 * Implementation of MaintenanceRepository
 * Handles all database operations for maintenance requests
 */
@Injectable()
export class MaintenanceRepository implements IMaintenanceRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {}

  /**
   * Create new maintenance request
   */
  async create(
    data: Partial<MaintenanceRequestEntity>,
    userId: string,
  ): Promise<MaintenanceRequestEntity> {
    try {
      // Use serializable transaction to prevent race condition on number generation
      const maintenance = await this.prisma.$transaction(
        async (tx) => {
          // Generate number inside transaction
          const lastMaintenance = await tx.maintenanceRequest.findFirst({
            orderBy: { maintenanceNumber: 'desc' },
            select: { maintenanceNumber: true },
          });

          let maintenanceNumber = 'MNT-0001';
          if (lastMaintenance) {
            const lastNumber = parseInt(
              lastMaintenance.maintenanceNumber.split('-')[1],
              10,
            );
            maintenanceNumber = `MNT-${(lastNumber + 1).toString().padStart(4, '0')}`;
          }

          return tx.maintenanceRequest.create({
            data: {
              maintenanceNumber,
              assetId: data.assetId!,
              projectId: data.projectId,
              maintenanceType: data.maintenanceType!,
              priority: data.priority,
              status: data.status,
              title: data.title!,
              description: data.description,
              scheduledDate: data.scheduledDate,
              startedAt: data.startedAt,
              completedAt: data.completedAt,
              estimatedCost: data.estimatedCost,
              actualCost: data.actualCost,
              vendor: data.vendor,
              vendorContact: data.vendorContact,
              assignedTo: data.assignedTo,
              odometerReading: data.odometerReading,
              workPerformed: data.workPerformed,
              partsReplaced: data.partsReplaced,
              notes: data.notes,
              createdBy: userId,
            },
            include: maintenanceRequestInclude,
          });
        },
        { isolationLevel: 'Serializable' },
      );

      this.logger.log('Maintenance request created');

      if (!maintenance) {
        throw new NotFoundException('Maintenance request not found');
      }

      return this.mapToEntity(maintenance);
    } catch (error) {
      this.logger.error('Failed to create maintenance request');
      throw error;
    }
  }

  /**
   * Find maintenance request by ID
   */
  async findById(id: string): Promise<MaintenanceRequestEntity | null> {
    try {
      const maintenance = await this.prisma.maintenanceRequest.findUnique({
        where: { id },
        include: maintenanceRequestInclude,
      });

      return maintenance ? this.mapToEntity(maintenance) : null;
    } catch (error) {
      this.logger.error('Failed to find maintenance request');
      throw error;
    }
  }

  /**
   * Find all maintenance requests with filters and pagination
   */
  async findAll(
    filters: MaintenanceFiltersDto,
  ): Promise<{ data: MaintenanceRequestEntity[]; total: number }> {
    try {
      const {
        assetId,
        projectId,
        maintenanceType,
        priority,
        status,
        assignedTo,
        scheduledDateFrom,
        scheduledDateTo,
        page = 1,
        limit = 10,
      } = filters;

      // Build where clause
      const where: Prisma.MaintenanceRequestWhereInput = {};

      if (assetId) where.assetId = assetId;
      if (projectId) where.projectId = projectId;
      if (maintenanceType) where.maintenanceType = maintenanceType;
      if (priority) where.priority = priority;
      if (status) where.status = status;
      if (assignedTo) where.assignedTo = assignedTo;

      // Date range filter
      if (scheduledDateFrom || scheduledDateTo) {
        where.scheduledDate = {};
        if (scheduledDateFrom) {
          where.scheduledDate.gte = new Date(scheduledDateFrom);
        }
        if (scheduledDateTo) {
          where.scheduledDate.lte = new Date(scheduledDateTo);
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries in parallel for performance
      const [maintenance, total] = await Promise.all([
        this.prisma.maintenanceRequest.findMany({
          where,
          include: maintenanceRequestInclude,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.maintenanceRequest.count({ where }),
      ]);

      this.logger.debug(
        `Maintenance requests fetched: ${maintenance.length} of ${total}`,
      );

      return {
        data: maintenance.map((m) => this.mapToEntity(m)),
        total,
      };
    } catch (error) {
      this.logger.error('Failed to fetch maintenance requests');
      throw error;
    }
  }

  /**
   * Update maintenance request
   */
  async update(
    id: string,
    data: Partial<MaintenanceRequestEntity>,
  ): Promise<MaintenanceRequestEntity> {
    try {
      const expectedRowVersion =
        typeof data.rowVersion === 'number'
          ? Number(data.rowVersion)
          : undefined;

      // Build update data - only include fields that are provided
      const updateData: Prisma.MaintenanceRequestUpdateInput = {};

      // Handle project relation
      if (data.projectId !== undefined) {
        updateData.project = data.projectId
          ? { connect: { id: data.projectId } }
          : { disconnect: true };
      }

      if (data.maintenanceType)
        updateData.maintenanceType = data.maintenanceType;
      if (data.priority) updateData.priority = data.priority;
      if (data.status) updateData.status = data.status;
      if (data.title) updateData.title = data.title;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.scheduledDate !== undefined)
        updateData.scheduledDate = data.scheduledDate;
      if (data.startedAt !== undefined) updateData.startedAt = data.startedAt;
      if (data.completedAt !== undefined)
        updateData.completedAt = data.completedAt;
      if (data.estimatedCost !== undefined)
        updateData.estimatedCost = data.estimatedCost;
      if (data.actualCost !== undefined)
        updateData.actualCost = data.actualCost;
      if (data.vendor !== undefined) updateData.vendor = data.vendor;
      if (data.vendorContact !== undefined)
        updateData.vendorContact = data.vendorContact;
      if (data.assignedTo !== undefined)
        updateData.assignedTo = data.assignedTo;
      if (data.odometerReading !== undefined)
        updateData.odometerReading = data.odometerReading;
      if (data.workPerformed !== undefined)
        updateData.workPerformed = data.workPerformed;
      if (data.partsReplaced !== undefined)
        updateData.partsReplaced = data.partsReplaced;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.approvedBy !== undefined)
        updateData.approvedBy = data.approvedBy;
      if (data.approvedAt !== undefined)
        updateData.approvedAt = data.approvedAt;
      updateData.rowVersion = { increment: 1 };

      let maintenance: MaintenanceRecord | null;
      if (expectedRowVersion !== undefined) {
        const { count } = await this.prisma.maintenanceRequest.updateMany({
          where: { id, rowVersion: expectedRowVersion },
          data: updateData,
        });
        if (count === 0) {
          throw new ConflictException(
            'Maintenance request was modified by another user. Refresh and try again.',
          );
        }
        maintenance = await this.prisma.maintenanceRequest.findUnique({
          where: { id },
          include: maintenanceRequestInclude,
        });
      } else {
        maintenance = await this.prisma.maintenanceRequest.update({
          where: { id },
          data: updateData,
          include: maintenanceRequestInclude,
        });
      }

      this.logger.log('Maintenance request updated');

      if (!maintenance) {
        throw new NotFoundException('Maintenance request not found');
      }

      return this.mapToEntity(maintenance);
    } catch (error: unknown) {
      this.logger.error('Failed to update maintenance request');

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Maintenance request not found');
      }

      throw error;
    }
  }

  /**
   * Delete maintenance request (soft delete not implemented in schema)
   * Hard delete for now
   */
  async delete(id: string, userId: string, rowVersion?: number): Promise<void> {
    try {
      if (typeof rowVersion === 'number') {
        const result = await this.prisma.maintenanceRequest.deleteMany({
          where: { id, rowVersion },
        });

        if (result.count === 0) {
          throw new ConflictException(
            'Maintenance request was modified by another user. Refresh and try again.',
          );
        }
      } else {
        await this.prisma.maintenanceRequest.delete({
          where: { id },
        });
      }

      this.logger.log('Maintenance request deleted');
    } catch (error: unknown) {
      this.logger.error('Failed to delete maintenance request');

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Maintenance request not found');
      }

      throw error;
    }
  }

  /**
   * Generate next maintenance number (MNT-0001, MNT-0002, etc.)
   */
  async generateMaintenanceNumber(): Promise<string> {
    try {
      // Get the last maintenance request ordered by maintenance number
      const lastMaintenance = await this.prisma.maintenanceRequest.findFirst({
        orderBy: { maintenanceNumber: 'desc' },
        select: { maintenanceNumber: true },
      });

      if (!lastMaintenance) {
        return 'MNT-0001';
      }

      // Extract number from last maintenance number (e.g., "MNT-0001" -> 1)
      const lastNumber = parseInt(
        lastMaintenance.maintenanceNumber.split('-')[1],
        10,
      );
      const nextNumber = lastNumber + 1;

      // Format with leading zeros (e.g., 1 -> "0001")
      return `MNT-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      this.logger.error('Failed to generate maintenance number');
      throw error;
    }
  }

  /**
   * Upload attachment for maintenance request
   */
  async uploadAttachment(
    maintenanceId: string,
    fileData: {
      fileName: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
      description?: string;
    },
    userId: string,
  ): Promise<MaintenanceAttachmentEntity> {
    try {
      const attachment = await this.prisma.maintenanceAttachment.create({
        data: {
          maintenanceId,
          fileName: fileData.fileName,
          filePath: fileData.filePath,
          fileSize: fileData.fileSize,
          mimeType: fileData.mimeType,
          description: fileData.description,
          uploadedBy: userId,
        },
      });

      this.logger.log('Maintenance attachment uploaded');

      return this.mapAttachmentToEntity(attachment);
    } catch (error) {
      this.logger.error('Failed to upload maintenance attachment');
      throw error;
    }
  }

  /**
   * Get attachments for maintenance request
   */
  async getAttachments(
    maintenanceId: string,
  ): Promise<MaintenanceAttachmentEntity[]> {
    try {
      const attachments = await this.prisma.maintenanceAttachment.findMany({
        where: { maintenanceId },
        orderBy: { uploadedAt: 'desc' },
      });

      return attachments.map((a) => this.mapAttachmentToEntity(a));
    } catch (error) {
      this.logger.error('Failed to get maintenance attachments');
      throw error;
    }
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(id: string): Promise<void> {
    try {
      await this.prisma.maintenanceAttachment.delete({
        where: { id },
      });

      this.logger.log('Maintenance attachment deleted');
    } catch (error: unknown) {
      this.logger.error('Failed to delete maintenance attachment');

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Attachment not found');
      }

      throw error;
    }
  }

  /**
   * Map Prisma MaintenanceRequest to Entity
   */
  private mapToEntity(data: MaintenanceRecord): MaintenanceRequestEntity {
    return new MaintenanceRequestEntity({
      id: data.id,
      maintenanceNumber: data.maintenanceNumber,
      assetId: data.assetId,
      projectId: data.projectId,
      maintenanceType: data.maintenanceType,
      priority: data.priority,
      status: data.status,
      title: data.title,
      description: data.description,
      scheduledDate: data.scheduledDate,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      estimatedCost: data.estimatedCost
        ? Number(data.estimatedCost.toString())
        : null,
      actualCost: data.actualCost ? Number(data.actualCost.toString()) : null,
      vendor: data.vendor,
      vendorContact: data.vendorContact,
      assignedTo: data.assignedTo,
      odometerReading: data.odometerReading,
      workPerformed: data.workPerformed,
      partsReplaced: data.partsReplaced,
      notes: data.notes,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      rowVersion: data.rowVersion,
      asset: data.asset
        ? {
            id: data.asset.id,
            name: data.asset.name,
            assetNumber: data.asset.assetNumber,
          }
        : null,
    });
  }

  /**
   * Map Prisma MaintenanceAttachment to Entity
   */
  private mapAttachmentToEntity(
    data: AttachmentRecord,
  ): MaintenanceAttachmentEntity {
    return new MaintenanceAttachmentEntity({
      id: data.id,
      maintenanceId: data.maintenanceId,
      fileName: data.fileName,
      filePath: data.filePath,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      description: data.description,
      uploadedBy: data.uploadedBy,
      uploadedAt: data.uploadedAt,
    });
  }

  /**
   * Count maintenance requests with filter
   */
  async count(filter: Prisma.MaintenanceRequestWhereInput): Promise<number> {
    try {
      return await this.prisma.maintenanceRequest.count({
        where: filter,
      });
    } catch (error: unknown) {
      this.logger.error(
        'MaintenanceRepository.count',
        `Error counting maintenance requests: ${toErrorMessage(error)}`,
        toErrorTrace(error),
      );
      throw error;
    }
  }

  /**
   * Group by for statistics
   */
  async groupBy(
    params: Prisma.MaintenanceRequestGroupByArgs & {
      by: Prisma.MaintenanceRequestScalarFieldEnum[];
    },
  ): Promise<any[]> {
    try {
      const groupByFn = this.prisma.maintenanceRequest.groupBy.bind(
        this.prisma.maintenanceRequest,
      ) as (args: Prisma.MaintenanceRequestGroupByArgs) => Promise<any[]>;
      return await groupByFn(params);
    } catch (error: unknown) {
      this.logger.error(
        'MaintenanceRepository.groupBy',
        `Error in groupBy operation: ${toErrorMessage(error)}`,
        toErrorTrace(error),
      );
      throw error;
    }
  }

  /**
   * Find many with includes for complex queries
   */
  async findMany(
    params: Prisma.MaintenanceRequestFindManyArgs,
  ): Promise<any[]> {
    try {
      return await this.prisma.maintenanceRequest.findMany(params);
    } catch (error: unknown) {
      this.logger.error(
        'MaintenanceRepository.findMany',
        `Error in findMany operation: ${toErrorMessage(error)}`,
        toErrorTrace(error),
      );
      throw error;
    }
  }
}
