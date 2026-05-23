import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  IProjectCostRepository,
  PROJECT_COST_REPOSITORY,
} from '../repositories';
import { ProjectCostResponseDto } from '../dto';

/**
 * Use case for retrieving a single project cost by ID
 * Now includes allocation details for allocated costs
 */
@Injectable()
export class GetProjectCostUseCase {
  constructor(
    @Inject(PROJECT_COST_REPOSITORY)
    private readonly repository: IProjectCostRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(GetProjectCostUseCase.name);
  }

  async execute(
    id: string,
    includeRelations: boolean = true,
  ): Promise<ProjectCostResponseDto> {
    const cost = await this.repository.findById(id, includeRelations);

    if (!cost) {
      throw new NotFoundException(
        this.i18n.t('finance.projectCost.notFound', { args: { id } }),
      );
    }

    this.logger.log(`Project cost retrieved: ${id}`);

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
      approver: cost.approver,
      allocations: cost.allocations,
    };
  }
}
