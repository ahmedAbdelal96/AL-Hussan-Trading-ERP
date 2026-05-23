import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  IProjectCostRepository,
  PROJECT_COST_REPOSITORY,
} from '../repositories';
import { CostAllocationRepository } from '../repositories/cost-allocation.repository';
import { CostAllocationsListResponseDto } from '../dto/cost-allocation-response.dto';

/**
 * Use case for retrieving cost allocations
 *
 * Returns:
 * - List of allocations with project details
 * - Summary statistics (total amount, project count)
 * - Validation status (is sum = 100%?)
 *
 * Use Cases:
 * - Display allocation breakdown in UI
 * - Verify allocation accuracy
 * - Audit trail for cost distribution
 */
@Injectable()
export class GetCostAllocationsUseCase {
  constructor(
    @Inject(PROJECT_COST_REPOSITORY)
    private readonly costRepository: IProjectCostRepository,
    private readonly allocationRepository: CostAllocationRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetCostAllocationsUseCase.name);
  }

  async execute(costId: string): Promise<CostAllocationsListResponseDto> {
    // Verify cost exists
    const cost = await this.costRepository.findById(costId, false);

    if (!cost) {
      throw new NotFoundException(`Cost with ID ${costId} not found`);
    }

    // Validate cost is allocated
    if (!cost.isAllocated) {
      throw new BadRequestException(
        'This cost is not allocated across multiple projects. It is either a single-project cost or general expense.',
      );
    }

    // Fetch allocations with project details
    const allocations = await this.allocationRepository.findByCostId(
      costId,
      undefined,
      true, // Include project details
    );

    // Get statistics
    const stats = await this.allocationRepository.getStatistics(costId);

    // Validate allocation sum
    const isValid = Math.abs(stats.totalPercentage - 100) <= 0.01;
    const validationMessages: string[] = [];

    if (!isValid) {
      validationMessages.push(
        `Sum of percentages: ${stats.totalPercentage.toFixed(2)}% (expected 100%)`,
      );
    }

    if (Math.abs(stats.totalAmount - cost.amount) > 0.01) {
      validationMessages.push(
        `Sum of amounts: ${stats.totalAmount.toFixed(2)} (expected ${cost.amount.toFixed(2)})`,
      );
    }

    this.logger.log(
      `Retrieved ${allocations.length} allocations for cost ${costId}`,
    );

    return {
      costId,
      totalAmount: cost.amount,
      projectCount: allocations.length,
      allocations: allocations.map((a) => ({
        id: a.id,
        costId: a.costId,
        projectId: a.projectId,
        allocatedAmount: a.allocatedAmount,
        percentage: a.percentage,
        notes: a.notes,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        project: a.project,
      })),
      isValid,
      validationMessages:
        validationMessages.length > 0 ? validationMessages : undefined,
    };
  }
}
