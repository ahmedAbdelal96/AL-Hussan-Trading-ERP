/**
 * Delete Employee Deduction Use Case
 * Business logic for deleting an employee deduction
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
  type IEmployeeDeductionRepository,
  EMPLOYEE_DEDUCTION_REPOSITORY,
} from '../repositories';
import { DeductionType } from '@prisma/client';

@Injectable()
export class DeleteEmployeeDeductionUseCase {
  constructor(
    @Inject(EMPLOYEE_DEDUCTION_REPOSITORY)
    private readonly employeeDeductionRepository: IEmployeeDeductionRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(DeleteEmployeeDeductionUseCase.name);
  }

  async execute(
    id: string,
    userId: string,
    rowVersion?: number,
  ): Promise<void> {
    this.logger.log(`Deleting employee deduction with ID: ${id}`);

    try {
      // Check if employee deduction exists
      const existing = await this.employeeDeductionRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(
          this.i18n.t('payroll.deduction.notFound', { args: { id } }),
        );
      }

      if (existing.deductionType === DeductionType.LOAN_REPAYMENT) {
        throw new BadRequestException(
          'LOAN_REPAYMENT deductions cannot be deleted manually. Use loan payment workflow.',
        );
      }

      // Soft delete employee deduction
      await this.employeeDeductionRepository.delete(id, userId, rowVersion);

      this.logger.log(`Employee deduction soft deleted successfully: ${id}`);
    } catch (error) {
      this.logger.log(`Failed to delete employee deduction: ${error.message}`);
      throw error;
    }
  }
}
