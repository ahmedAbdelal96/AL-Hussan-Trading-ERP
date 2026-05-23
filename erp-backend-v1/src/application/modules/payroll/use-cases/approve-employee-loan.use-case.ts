/**
 * Approve Employee Loan Use Case
 * Business logic for approving an employee loan
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
import { ApproveEmployeeLoanDto } from '../dto';
import { EmployeeLoanEntity } from '../entities';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class ApproveEmployeeLoanUseCase {
  constructor(
    @Inject(EMPLOYEE_LOAN_REPOSITORY)
    private readonly employeeLoanRepository: IEmployeeLoanRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(ApproveEmployeeLoanUseCase.name);
  }

  async execute(
    id: string,
    dto: ApproveEmployeeLoanDto,
    userId: string,
  ): Promise<EmployeeLoanEntity> {
    this.logger.log(`Approving employee loan with ID: ${id}`);

    try {
      // Check if employee loan exists
      const existing = await this.employeeLoanRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(
          this.i18n.t('payroll.loan.notFound', { args: { id } }),
        );
      }

      // Validate status - can only approve PENDING loans
      if (existing.status !== LoanStatus.PENDING) {
        throw new BadRequestException(
          this.i18n.t('payroll.loan.cannotApprove', {
            args: { status: existing.status },
          }),
        );
      }

      // Approve employee loan (status changes to APPROVED)
      const approved = await this.employeeLoanRepository.approve(
        id,
        userId,
        dto.notes,
        dto.rowVersion,
      );

      this.logger.log(`Employee loan approved successfully: ${id}`);

      return approved;
    } catch (error) {
      this.logger.log(`Failed to approve employee loan: ${error.message}`);
      throw error;
    }
  }
}
