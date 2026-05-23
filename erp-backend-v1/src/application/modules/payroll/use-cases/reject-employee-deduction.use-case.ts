/**
 * Reject Employee Deduction Use Case
 * Business logic for rejecting an employee deduction
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  EMPLOYEE_DEDUCTION_REPOSITORY,
  type IEmployeeDeductionRepository,
} from '../repositories';
import { RejectEmployeeDeductionDto } from '../dto';

@Injectable()
export class RejectEmployeeDeductionUseCase {
  constructor(
    @Inject(EMPLOYEE_DEDUCTION_REPOSITORY)
    private readonly employeeDeductionRepository: IEmployeeDeductionRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(RejectEmployeeDeductionUseCase.name);
  }

  async execute(
    id: string,
    dto: RejectEmployeeDeductionDto,
    userId: string,
  ): Promise<void> {
    this.logger.log(`Rejecting employee deduction with ID: ${id}`);

    try {
      // Check if employee deduction exists
      const existing = await this.employeeDeductionRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(
          this.i18n.t('payroll.deduction.notFound', { args: { id } }),
        );
      }

      // Validate not already approved or rejected
      if (existing.approvedBy && existing.approvedAt) {
        throw new BadRequestException(
          this.i18n.t('payroll.deduction.alreadyProcessed'),
        );
      }

      // Auto-approved types should not go through this process
      const autoApprovedTypes = ['TAX', 'INSURANCE', 'LOAN_REPAYMENT'];
      if (autoApprovedTypes.includes(existing.deductionType)) {
        throw new BadRequestException(
          this.i18n.t('payroll.deduction.autoApprovedType'),
        );
      }

      // Reject employee deduction (soft delete with rejection reason)
      await this.employeeDeductionRepository.reject(
        id,
        userId,
        dto.rejectionReason,
        dto.rowVersion,
      );

      this.logger.log(`Employee deduction rejected successfully: ${id}`);
    } catch (error) {
      this.logger.log(`Failed to reject employee deduction: ${error.message}`);
      throw error;
    }
  }
}
