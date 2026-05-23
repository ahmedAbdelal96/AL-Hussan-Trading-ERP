/**
 * Create Employee Loan Use Case
 * Business logic for creating a new employee loan
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
  EMPLOYEE_LOAN_REPOSITORY,
  type IEmployeeLoanRepository,
} from '../repositories';
import { CreateEmployeeLoanDto } from '../dto';
import { EmployeeLoanEntity } from '../entities';
import { assertEmployeeCanReceiveLoan } from './employee-payroll-status.guard';

@Injectable()
export class CreateEmployeeLoanUseCase {
  constructor(
    @Inject(EMPLOYEE_LOAN_REPOSITORY)
    private readonly employeeLoanRepository: IEmployeeLoanRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.setContext(CreateEmployeeLoanUseCase.name);
  }

  async execute(
    dto: CreateEmployeeLoanDto,
    userId: string,
  ): Promise<EmployeeLoanEntity> {
    this.logger.log(`Creating employee loan for employee: ${dto.employeeId}`);

    try {
      // Validate employee exists and is eligible for a new loan (stricter than allowance)
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
        select: { id: true, employeeNumber: true, status: true },
      });
      if (!employee) {
        throw new NotFoundException(`Employee ${dto.employeeId} not found`);
      }
      assertEmployeeCanReceiveLoan(employee);

      // Validate loan amount is positive
      if (dto.amount <= 0) {
        throw new BadRequestException(
          this.i18n.t('payroll.loan.amountInvalid'),
        );
      }

      // Validate installment count is positive
      if (dto.installments <= 0) {
        throw new BadRequestException(
          this.i18n.t('payroll.loan.installmentCountInvalid'),
        );
      }

      // Calculate installment amount
      const installmentAmount = dto.amount / dto.installments;

      // Create loan with calculated installmentAmount and PENDING status
      const loanData = {
        ...dto,
        installmentAmount,
      };

      const employeeLoan = await this.employeeLoanRepository.create(
        loanData,
        userId,
      );

      this.logger.log(
        `Employee loan created successfully with ID: ${employeeLoan.id}`,
      );

      return employeeLoan;
    } catch (error) {
      this.logger.log(`Failed to create employee loan: ${error.message}`);
      throw error;
    }
  }
}
