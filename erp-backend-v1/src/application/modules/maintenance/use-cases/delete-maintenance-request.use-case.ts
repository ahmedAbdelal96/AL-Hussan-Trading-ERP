import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { MaintenanceStatus } from '@prisma/client';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  IMaintenanceRepository,
  MAINTENANCE_REPOSITORY,
} from '../repositories';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';

/**
 * Use case for deleting a maintenance request
 * Only PENDING and CANCELLED requests can be hard-deleted.
 * IN_PROGRESS/COMPLETED requests are set to CANCELLED instead.
 */
@Injectable()
export class DeleteMaintenanceRequestUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly repository: IMaintenanceRepository,
    private readonly logger: WinstonLoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    id: string,
    userId: string,
    rowVersion?: number,
  ): Promise<void> {
    try {
      const request = await this.repository.findById(id);
      if (!request) {
        throw new NotFoundException('Maintenance request not found');
      }

      // Only allow hard delete for PENDING or CANCELLED requests
      if (
        request.status === MaintenanceStatus.PENDING ||
        request.status === MaintenanceStatus.CANCELLED
      ) {
        // Integrity guard:
        // If this maintenance request already has a linked finance cost, deleting it
        // would leave orphan `cost.referenceId` records (polymorphic reference).
        // Keep finance as source of truth and block destructive delete.
        const linkedCostsCount = await this.prisma.cost.count({
          where: {
            referenceType: 'maintenance_request',
            referenceId: id,
          },
        });

        if (linkedCostsCount > 0) {
          throw new ConflictException(
            'Cannot delete maintenance request because financial costs are linked to it. Cancel it instead.',
          );
        }

        await this.repository.delete(id, userId, rowVersion);
        this.logger.log(`Maintenance request deleted: ${id}`);
      } else {
        // For active/completed requests, cancel instead of delete
        await this.repository.update(id, {
          status: MaintenanceStatus.CANCELLED,
        });
        this.logger.log(
          `Maintenance request cancelled (was ${request.status}): ${id}`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to delete maintenance request');
      throw error;
    }
  }
}
