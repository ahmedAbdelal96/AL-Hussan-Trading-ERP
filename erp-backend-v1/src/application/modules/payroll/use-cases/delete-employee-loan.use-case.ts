/**
 * Delete Employee Loan Use Case
 * Business logic for deleting an employee loan (only if PENDING or REJECTED)
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
  EMPLOYEE_LOAN_REPOSITORY,
  type IEmployeeLoanRepository,
} from '../repositories';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class DeleteEmployeeLoanUseCase {
  constructor(
    @Inject(EMPLOYEE_LOAN_REPOSITORY)
    private readonly employeeLoanRepository: IEmployeeLoanRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(DeleteEmployeeLoanUseCase.name);
  }

  async execute(id: string, rowVersion?: number): Promise<void> {
    this.logger.log(`Deleting employee loan with ID: ${id}`);

    try {
      // Check if employee loan exists
      const existing = await this.employeeLoanRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(
          this.i18n.t('payroll.loan.notFound', { args: { id } }),
        );
      }

      // Only allow deletion if status is PENDING or REJECTED
      if (
        existing.status !== LoanStatus.PENDING &&
        existing.status !== LoanStatus.REJECTED
      ) {
        throw new BadRequestException(
          this.i18n.t('payroll.loan.cannotDelete', {
            args: { status: existing.status },
          }),
        );
      }

      // Delete employee loan
      await this.employeeLoanRepository.delete(id, rowVersion);

      this.logger.log(`Employee loan deleted successfully: ${id}`);
    } catch (error) {
      this.logger.log(`Failed to delete employee loan: ${error.message}`);
      throw error;
    }
  }
}
