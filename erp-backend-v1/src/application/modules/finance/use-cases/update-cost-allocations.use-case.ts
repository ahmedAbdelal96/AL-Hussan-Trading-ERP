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
import { CostAllocationValidatorService } from '../services/cost-allocation-validator.service';
import { UpdateCostAllocationsDto } from '../dto/update-cost-allocations.dto';
import { CostAllocationsListResponseDto } from '../dto/cost-allocation-response.dto';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';

/**
 * Use case for updating cost allocations
 *
 * Business Rules:
 * 1. Only allocated costs can have their allocations updated
 * 2. Cannot update allocations for paid costs (immutable after payment)
 * 3. Must provide at least 2 project allocations
 * 4. Sum of allocations must equal 100% or total cost amount
 *
 * Strategy: Full replacement
 * - Deletes all existing allocations
 * - Creates new allocations
 * - Uses transaction for atomicity
 *
 * Use Cases:
 * - Reallocate cost after project scope changes
 * - Fix incorrect allocation percentages
 * - Add/remove projects from allocation
 */
@Injectable()
export class UpdateCostAllocationsUseCase {
  constructor(
    @Inject(PROJECT_COST_REPOSITORY)
    private readonly costRepository: IProjectCostRepository,
    private readonly allocationRepository: CostAllocationRepository,
    private readonly validator: CostAllocationValidatorService,
    private readonly logger: WinstonLoggerService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.setContext(UpdateCostAllocationsUseCase.name);
  }

  async execute(
    costId: string,
    dto: UpdateCostAllocationsDto,
  ): Promise<CostAllocationsListResponseDto> {
    // Fetch cost with allocations
    const cost = await this.costRepository.findById(costId, true);

    if (!cost) {
      throw new NotFoundException(`Cost with ID ${costId} not found`);
    }

    // Validation: Cost must be allocated
    if (!cost.isAllocated) {
      throw new BadRequestException(
        'Cannot update allocations for non-allocated cost. This cost is either a single-project cost or general expense.',
      );
    }

    // Validation: Cannot update allocations for paid costs
    if (cost.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Cannot update allocations for paid costs. Allocations are immutable after payment.',
      );
    }

    // Validate allocations
    const validation = this.validator.validateAllocations(
      dto.allocations,
      cost.amount,
    );

    if (!validation.isValid) {
      this.validator.logValidationResult(validation, 'Update Allocations');
      throw new BadRequestException(
        `Allocation validation failed: ${validation.errors.join(', ')}`,
      );
    }

    // Validate all projects exist
    const projectIds = dto.allocations.map((a) => a.projectId);
    const projects = await this.prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true },
    });

    if (projects.length !== projectIds.length) {
      const foundIds = projects.map((p) => p.id);
      const missingIds = projectIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Projects not found: ${missingIds.join(', ')}`,
      );
    }

    // Calculate allocations (amounts from percentages or vice versa)
    const usingPercentages = dto.allocations.every(
      (a) => a.percentage !== undefined,
    );
    const calculatedAllocations = usingPercentages
      ? this.validator.calculateAmountsFromPercentages(
          dto.allocations,
          cost.amount,
        )
      : this.validator.calculatePercentagesFromAmounts(
          dto.allocations,
          cost.amount,
        );

    // Update allocations in transaction
    await this.prisma.$transaction(async (tx) => {
      const updateWhere: any = { id: costId, isAllocated: true };
      if (typeof dto.rowVersion === 'number') {
        updateWhere.rowVersion = dto.rowVersion;
      }
      const costUpdate = await tx.cost.updateMany({
        where: updateWhere,
        data: { rowVersion: { increment: 1 } },
      });
      if (costUpdate.count === 0) {
        throw new ConflictException(
          'Cost was modified by another user. Refresh and try again.',
        );
      }

      await this.allocationRepository.updateAllocations(
        costId,
        calculatedAllocations.map((calc, index) => ({
          projectId: calc.projectId,
          allocatedAmount: calc.amount,
          percentage: calc.percentage,
          notes: dto.allocations[index].notes,
        })),
        tx,
      );
    });

    this.logger.log(
      `Allocations updated for cost ${costId} (${dto.allocations.length} projects)`,
    );

    // Fetch and return updated allocations
    const allocations = await this.allocationRepository.findByCostId(
      costId,
      undefined,
      true,
    );

    const stats = await this.allocationRepository.getStatistics(costId);

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
      isValid: Math.abs(stats.totalPercentage - 100) <= 0.01,
      validationMessages:
        Math.abs(stats.totalPercentage - 100) > 0.01
          ? [`Sum of percentages: ${stats.totalPercentage}% (expected 100%)`]
          : undefined,
    };
  }
}
