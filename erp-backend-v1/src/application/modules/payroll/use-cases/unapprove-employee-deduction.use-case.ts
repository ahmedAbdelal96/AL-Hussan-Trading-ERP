/**
 * Unapprove Employee Deduction Use Case
 * Business logic for cancelling the approval of an employee deduction
 * Only allowed if the salary has not been paid yet
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import {
  EMPLOYEE_DEDUCTION_REPOSITORY,
  type IEmployeeDeductionRepository,
} from '../repositories';
import { EmployeeDeductionEntity } from '../entities';
import { UnapproveEmployeeDeductionDto } from '../dto';
import { DeductionType } from '@prisma/client';

@Injectable()
export class UnapproveEmployeeDeductionUseCase {
  constructor(
    @Inject(EMPLOYEE_DEDUCTION_REPOSITORY)
    private readonly employeeDeductionRepository: IEmployeeDeductionRepository,
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(UnapproveEmployeeDeductionUseCase.name);
  }

  async execute(
    id: string,
    dto: UnapproveEmployeeDeductionDto,
    userId: string,
  ): Promise<EmployeeDeductionEntity> {
    this.logger.log(`Unapproving employee deduction with ID: ${id}`);

    try {
      // Check if employee deduction exists
      const existing = await this.employeeDeductionRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(
          this.i18n.t('payroll.deduction.notFound', { args: { id } }),
        );
      }

      // Validate that deduction is approved
      if (!existing.approvedBy || !existing.approvedAt) {
        throw new BadRequestException(
          this.i18n.t('payroll.deduction.notApproved'),
        );
      }

      if (existing.deductionType === DeductionType.LOAN_REPAYMENT) {
        throw new BadRequestException(
          'LOAN_REPAYMENT deductions cannot be unapproved manually. Use loan payment workflow.',
        );
      }

      // Extract month and year from deduction date
      const deductionDate = new Date(existing.deductionDate);
      const month = deductionDate.getMonth() + 1; // JavaScript months are 0-indexed
      const year = deductionDate.getFullYear();

      this.logger.log(
        `Checking for paid payslip - Employee: ${existing.employeeId}, Month: ${month}, Year: ${year}`,
      );

      // Check if there's a paid payslip for this employee in the same period
      const paidPayslip = await this.prisma.payslip.findFirst({
        where: {
          employeeId: existing.employeeId,
          payPeriodMonth: month,
          payPeriodYear: year,
          isPaid: true,
        },
        select: {
          id: true,
          payDate: true,
          paidAt: true,
        },
      });

      if (paidPayslip) {
        this.logger.warn(
          `Cannot unapprove deduction - Payslip already paid: ${paidPayslip.id}`,
        );
        throw new BadRequestException(
          this.i18n.t('payroll.deduction.cannotUnapprove.salaryPaid', {
            args: {
              month,
              year,
              paidDate: paidPayslip.paidAt?.toISOString() || 'N/A',
            },
          }),
        );
      }

      // Warn if deduction is auto-approved type (but allow unapproval)
      const autoApprovedTypes = ['TAX', 'INSURANCE', 'LOAN_REPAYMENT'];
      if (autoApprovedTypes.includes(existing.deductionType)) {
        this.logger.warn(
          `Unapproving auto-approved type deduction: ${existing.deductionType}. This may be re-applied automatically.`,
        );
      }

      // Unapprove employee deduction
      const unapproved = await this.employeeDeductionRepository.unapprove(
        id,
        dto.notes,
        dto.rowVersion,
      );

      this.logger.log(
        `Employee deduction unapproved successfully: ${id} by user: ${userId}`,
      );

      return unapproved;
    } catch (error) {
      this.logger.error(
        `Failed to unapprove employee deduction: ${error.message}`,
      );
      throw error;
    }
  }
}
