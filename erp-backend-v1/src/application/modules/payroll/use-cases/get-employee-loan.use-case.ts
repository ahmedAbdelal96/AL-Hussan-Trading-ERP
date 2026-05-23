/**
 * Get Employee Loan Use Case
 * Business logic for retrieving a single employee loan by ID
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  EMPLOYEE_LOAN_REPOSITORY,
  type IEmployeeLoanRepository,
} from '../repositories';
import { EmployeeLoanEntity } from '../entities';

@Injectable()
export class GetEmployeeLoanUseCase {
  constructor(
    @Inject(EMPLOYEE_LOAN_REPOSITORY)
    private readonly employeeLoanRepository: IEmployeeLoanRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(GetEmployeeLoanUseCase.name);
  }

  async execute(id: string): Promise<EmployeeLoanEntity> {
    this.logger.log(`Fetching employee loan with ID: ${id}`);

    const employeeLoan = await this.employeeLoanRepository.findById(id);

    if (!employeeLoan) {
      throw new NotFoundException(
        this.i18n.t('payroll.loan.notFound', { args: { id } }),
      );
    }

    return employeeLoan;
  }
}
