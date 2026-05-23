import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  IProjectCostRepository,
  PROJECT_COST_REPOSITORY,
} from '../repositories';
import { CostAllocationRepository } from '../repositories/cost-allocation.repository';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';

/**
 * Use case for converting allocated cost back to regular cost
 *
 * Converts:
 * - Allocated cost → Single-project cost (if projectId provided)
 * - Allocated cost → General expense (if no projectId provided)
 *
 * Business Rules:
 * 1. Cannot convert paid costs (immutable after payment)
 * 2. All allocations will be deleted
 * 3. Cost will be updated: isAllocated=false, projectId=provided or null
 *
 * Process:
 * 1. Validate cost exists and is allocated
 * 2. Validate cost is not paid
 * 3. Delete all allocation records
 * 4. Update cost: set isAllocated=false, projectId=provided or null
 * 5. All in transaction for atomicity
 *
 * Use Cases:
 * - Allocation was mistake: Revert to single project cost
 * - Project scope changed: Cost now belongs to single project
 * - Simplify accounting: Convert to general expense
 */
@Injectable()
export class DeleteCostAllocationsUseCase {
  constructor(
    @Inject(PROJECT_COST_REPOSITORY)
    private readonly costRepository: IProjectCostRepository,
    private readonly allocationRepository: CostAllocationRepository,
    private readonly logger: WinstonLoggerService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.setContext(DeleteCostAllocationsUseCase.name);
  }

  async execute(
    costId: string,
    newProjectId?: string,
    rowVersion?: number,
  ): Promise<{ success: boolean; message: string }> {
    // Fetch cost
    const cost = await this.costRepository.findById(costId, true);

    if (!cost) {
      throw new NotFoundException(`Cost with ID ${costId} not found`);
    }

    // Validation: Cost must be allocated
    if (!cost.isAllocated) {
      throw new BadRequestException(
        'Cost is not allocated. Cannot delete allocations that do not exist.',
      );
    }

    // Validation: Cannot convert paid costs
    if (cost.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Cannot modify paid costs. Costs are immutable after payment.',
      );
    }

    // Validate project if provided
    if (newProjectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: newProjectId },
        select: { id: true, name: true },
      });

      if (!project) {
        throw new NotFoundException(
          `Project with ID ${newProjectId} not found`,
        );
      }
    }

    const allocationCount = cost.getAllocationCount();

    // Delete allocations and update cost in transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete all allocation records
      await this.allocationRepository.deleteByCostId(costId, tx);

      // Update cost: set isAllocated=false, projectId=provided or null
      const updateWhere: any = { id: costId, isAllocated: true };
      if (typeof rowVersion === 'number') {
        updateWhere.rowVersion = rowVersion;
      }
      const updateResult = await tx.cost.updateMany({
        where: updateWhere,
        data: {
          isAllocated: false,
          projectId: newProjectId || null,
          rowVersion: { increment: 1 },
        },
      });
      if (updateResult.count === 0) {
        throw new ConflictException(
          'Cost was modified by another user. Refresh and try again.',
        );
      }
    });

    const newType = newProjectId ? 'single-project cost' : 'general expense';

    this.logger.log(
      `Converted allocated cost ${costId} (${allocationCount} allocations) to ${newType}`,
    );

    return {
      success: true,
      message: `Successfully converted cost from allocated (${allocationCount} projects) to ${newType}`,
    };
  }
}
