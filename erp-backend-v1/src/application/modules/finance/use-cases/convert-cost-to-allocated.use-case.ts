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
import { CostAllocationInputDto } from '../dto/cost-allocation-input.dto';
import { CostAllocationsListResponseDto } from '../dto/cost-allocation-response.dto';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';

/**
 * Use case for converting a regular cost to an allocated cost
 *
 * Converts:
 * - Single-project cost → Allocated cost across multiple projects
 * - General expense → Allocated cost across multiple projects
 *
 * Business Rules:
 * 1. Cannot convert paid costs (immutable after payment)
 * 2. Must provide at least 2 project allocations
 * 3. Sum must equal 100% or total amount
 * 4. If original cost has projectId, it can be included in allocations
 *
 * Process:
 * 1. Validate cost exists and is not paid
 * 2. Validate allocations
 * 3. Update cost: set isAllocated=true, projectId=null
 * 4. Create allocation records
 * 5. All in transaction for atomicity
 *
 * Use Cases:
 * - Project scope expanded: Need to split cost across multiple projects
 * - Realize cost should be shared: Convert from single project to allocated
 * - General expense attribution: Assign general expense to specific projects
 */
@Injectable()
export class ConvertCostToAllocatedUseCase {
  constructor(
    @Inject(PROJECT_COST_REPOSITORY)
    private readonly costRepository: IProjectCostRepository,
    private readonly allocationRepository: CostAllocationRepository,
    private readonly validator: CostAllocationValidatorService,
    private readonly logger: WinstonLoggerService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.setContext(ConvertCostToAllocatedUseCase.name);
  }

  async execute(
    costId: string,
    allocations: CostAllocationInputDto[],
    rowVersion?: number,
  ): Promise<CostAllocationsListResponseDto> {
    // Fetch cost
    const cost = await this.costRepository.findById(costId, true);

    if (!cost) {
      throw new NotFoundException(`Cost with ID ${costId} not found`);
    }

    // Validation: Cost must not be allocated already
    if (cost.isAllocated) {
      throw new BadRequestException(
        'Cost is already allocated. Use UpdateCostAllocationsUseCase to modify allocations.',
      );
    }

    // Validation: Cannot convert paid costs
    if (cost.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Cannot convert paid costs to allocated. Costs are immutable after payment.',
      );
    }

    // Validate allocations
    const validation = this.validator.validateAllocations(
      allocations,
      cost.amount,
    );

    if (!validation.isValid) {
      this.validator.logValidationResult(validation, 'Convert to Allocated');
      throw new BadRequestException(
        `Allocation validation failed: ${validation.errors.join(', ')}`,
      );
    }

    // Validate all projects exist
    const projectIds = allocations.map((a) => a.projectId);
    const projects = await this.prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true },
    });

    if (projects.length !== projectIds.length) {
      const foundIds = projects.map((p) => p.id);
      const missingIds = projectIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Projects not found: ${missingIds.join(', ')}`,
      );
    }

    // Calculate allocations (amounts from percentages or vice versa)
    const usingPercentages = allocations.every(
      (a) => a.percentage !== undefined,
    );
    const calculatedAllocations = usingPercentages
      ? this.validator.calculateAmountsFromPercentages(allocations, cost.amount)
      : this.validator.calculatePercentagesFromAmounts(
          allocations,
          cost.amount,
        );

    // Convert cost in transaction
    await this.prisma.$transaction(async (tx) => {
      // Update cost: set isAllocated=true, projectId=null
      const updateWhere: any = { id: costId, isAllocated: false };
      if (typeof rowVersion === 'number') {
        updateWhere.rowVersion = rowVersion;
      }
      const updateResult = await tx.cost.updateMany({
        where: updateWhere,
        data: {
          isAllocated: true,
          projectId: null, // Allocated costs don't have single projectId
          rowVersion: { increment: 1 },
        },
      });
      if (updateResult.count === 0) {
        throw new ConflictException(
          'Cost was modified by another user. Refresh and try again.',
        );
      }

      // Create allocation records
      await this.allocationRepository.createMany(
        costId,
        calculatedAllocations.map((calc, index) => ({
          projectId: calc.projectId,
          allocatedAmount: calc.amount,
          percentage: calc.percentage,
          notes: allocations[index].notes,
        })),
        tx,
      );
    });

    const originalType = cost.projectId
      ? 'single-project cost'
      : 'general expense';
    const projectNames = projects.map((p) => p.name).join(', ');

    this.logger.log(
      `Converted ${originalType} ${costId} to allocated cost across ${allocations.length} projects: ${projectNames}`,
    );

    // Fetch and return allocations
    const newAllocations = await this.allocationRepository.findByCostId(
      costId,
      undefined,
      true,
    );

    const stats = await this.allocationRepository.getStatistics(costId);

    return {
      costId,
      totalAmount: cost.amount,
      projectCount: newAllocations.length,
      allocations: newAllocations.map((a) => ({
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
