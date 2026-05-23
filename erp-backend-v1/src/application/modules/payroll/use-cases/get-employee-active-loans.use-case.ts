/**
 * Get Employee Loans Use Case
 * Business logic for retrieving all loans for a specific employee
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  EMPLOYEE_LOAN_REPOSITORY,
  type IEmployeeLoanRepository,
} from '../repositories';
import { EmployeeLoanEntity } from '../entities';

@Injectable()
export class GetEmployeeActiveLoansUseCase {
  constructor(
    @Inject(EMPLOYEE_LOAN_REPOSITORY)
    private readonly employeeLoanRepository: IEmployeeLoanRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetEmployeeActiveLoansUseCase.name);
  }

  async execute(employeeId: string): Promise<EmployeeLoanEntity[]> {
    this.logger.log(`Fetching loans for employee: ${employeeId}`);

    const loans =
      await this.employeeLoanRepository.findAllByEmployeeId(employeeId);

    return loans;
  }
}
