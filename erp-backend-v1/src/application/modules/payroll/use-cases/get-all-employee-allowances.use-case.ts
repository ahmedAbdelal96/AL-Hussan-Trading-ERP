/**
 * Get All Employee Allowances Use Case
 * Business logic for retrieving all employee allowances with filters
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  EMPLOYEE_ALLOWANCE_REPOSITORY,
  type IEmployeeAllowanceRepository,
} from '../repositories';
import { EmployeeAllowanceFiltersDto } from '../dto';
import { EmployeeAllowanceEntity } from '../entities';

@Injectable()
export class GetAllEmployeeAllowancesUseCase {
  constructor(
    @Inject(EMPLOYEE_ALLOWANCE_REPOSITORY)
    private readonly employeeAllowanceRepository: IEmployeeAllowanceRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetAllEmployeeAllowancesUseCase.name);
  }

  async execute(filters: EmployeeAllowanceFiltersDto): Promise<{
    data: EmployeeAllowanceEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log('Fetching all employee allowances with filters');

    const result = await this.employeeAllowanceRepository.findAll(filters);

    return result;
  }
}
