import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  IProjectCostRepository,
  PROJECT_COST_REPOSITORY,
} from '../repositories';
import { CreateProjectCostDto, ProjectCostResponseDto } from '../dto';
import { assertProjectIsEditable } from '../../projects/use-cases/project-status.guard';

/**
 * Use case for creating a new project cost entry
 *
 * Supports 3 cost types:
 * 1. Single Project Cost: Provide projectId
 * 2. General Expense: Don't provide projectId or allocations
 * 3. Allocated Cost: Provide allocations array (min 2 projects)
 *
 * Validation is handled by repository layer
 */
@Injectable()
export class CreateProjectCostUseCase {
  constructor(
    @Inject(PROJECT_COST_REPOSITORY)
    private readonly repository: IProjectCostRepository,
    private readonly logger: WinstonLoggerService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.setContext(CreateProjectCostUseCase.name);
  }

  async execute(
    dto: CreateProjectCostDto,
    userId: string,
  ): Promise<ProjectCostResponseDto> {
    // Validate project status before creating a cost against it
    if (dto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
        select: { id: true, name: true, status: true },
      });
      if (!project) {
        throw new NotFoundException(`Project ${dto.projectId} not found`);
      }
      assertProjectIsEditable(project);
    }

    const cost = await this.repository.create(dto, userId);

    // Determine cost type for logging
    const costType = cost.isAllocated
      ? `allocated to ${cost.getAllocationCount()} projects`
      : cost.projectId
        ? `for project ${cost.projectId}`
        : 'as general expense';

    this.logger.log(`Cost created: ${cost.id} ${costType}`);

    return {
      id: cost.id,
      projectId: cost.projectId,
      isAllocated: cost.isAllocated,
      costType: cost.costType,
      referenceType: cost.referenceType,
      referenceId: cost.referenceId,
      categoryId: cost.categoryId,
      amount: cost.amount,
      amountBeforeTax: cost.amountBeforeTax,
      taxRate: cost.taxRate,
      taxAmount: cost.taxAmount,
      currency: cost.currency,
      transactionDate: cost.transactionDate,
      description: cost.description,
      invoiceNumber: cost.invoiceNumber,
      paymentStatus: cost.paymentStatus,
      paidDate: cost.paidDate,
      paymentMethod: cost.paymentMethod,
      paymentReference: cost.paymentReference,
      approvedBy: cost.approvedBy,
      approvedAt: cost.approvedAt,
      rejectedReason: cost.rejectedReason,
      notes: cost.notes,
      createdBy: cost.createdBy,
      createdAt: cost.createdAt,
      updatedAt: cost.updatedAt,
      rowVersion: cost.rowVersion,
      project: cost.project,
      category: cost.category,
      creator: cost.creator,
      allocations: cost.allocations,
    };
  }
}
