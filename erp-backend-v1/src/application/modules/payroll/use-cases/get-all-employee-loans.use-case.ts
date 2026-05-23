/**
 * Get All Employee Loans Use Case
 * Business logic for retrieving all employee loans with filters
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  EMPLOYEE_LOAN_REPOSITORY,
  type IEmployeeLoanRepository,
} from '../repositories';
import { EmployeeLoanFiltersDto } from '../dto';
import { EmployeeLoanEntity } from '../entities';

@Injectable()
export class GetAllEmployeeLoansUseCase {
  constructor(
    @Inject(EMPLOYEE_LOAN_REPOSITORY)
    private readonly employeeLoanRepository: IEmployeeLoanRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetAllEmployeeLoansUseCase.name);
  }

  async execute(filters: EmployeeLoanFiltersDto): Promise<{
    data: EmployeeLoanEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log('Fetching all employee loans with filters');

    const result = await this.employeeLoanRepository.findAll(filters);

    return result;
  }
}
