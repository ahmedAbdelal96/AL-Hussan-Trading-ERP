/**
 * Pay Loan Installment Use Case
 * Business logic for processing a loan installment payment
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  EMPLOYEE_LOAN_REPOSITORY,
  type IEmployeeLoanRepository,
} from '../repositories';
import { PayLoanInstallmentDto } from '../dto';
import { EmployeeLoanEntity } from '../entities';
import { LoanRepaymentSource, LoanStatus } from '@prisma/client';

@Injectable()
export class PayLoanInstallmentUseCase {
  constructor(
    @Inject(EMPLOYEE_LOAN_REPOSITORY)
    private readonly employeeLoanRepository: IEmployeeLoanRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(PayLoanInstallmentUseCase.name);
  }

  async execute(
    loanId: string,
    dto: PayLoanInstallmentDto,
    userId: string,
  ): Promise<EmployeeLoanEntity> {
    this.logger.log(`Processing installment payment for loan: ${loanId}`);

    try {
      // Check if employee loan exists
      const existing = await this.employeeLoanRepository.findById(loanId);
      if (!existing) {
        throw new NotFoundException(
          `Employee loan with ID ${loanId} not found`,
        );
      }

      // Validate loan is approved
      if (existing.status !== LoanStatus.APPROVED) {
        throw new BadRequestException(
          `Cannot process payment: loan status is ${existing.status}. Only APPROVED loans can have installments paid.`,
        );
      }

      // Validate loan is not fully paid
      if (existing.paidInstallments >= existing.installments) {
        throw new BadRequestException('Loan is already fully paid');
      }

      // Call repository method which handles the transaction
      // It will increment paidInstallments and update status to COMPLETED if fully paid
      const paymentDate = dto.deductionDate
        ? new Date(dto.deductionDate)
        : new Date();
      const updated = await this.employeeLoanRepository.payInstallment(
        loanId,
        userId,
        paymentDate,
        dto.rowVersion,
        LoanRepaymentSource.MANUAL,
      );

      this.logger.log(
        `Loan installment paid successfully. Paid: ${updated.paidInstallments}/${updated.installments}`,
      );

      return updated;
    } catch (error) {
      this.logger.log(
        `Failed to process loan installment payment: ${error.message}`,
      );
      throw error;
    }
  }
}
