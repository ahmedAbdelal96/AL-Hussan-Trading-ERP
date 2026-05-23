/**
 * Get All Employee Deductions Use Case
 * Business logic for retrieving all employee deductions with filters
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  type IEmployeeDeductionRepository,
  EMPLOYEE_DEDUCTION_REPOSITORY,
} from '../repositories';
import { EmployeeDeductionFiltersDto } from '../dto';
import { EmployeeDeductionEntity } from '../entities';

@Injectable()
export class GetAllEmployeeDeductionsUseCase {
  constructor(
    @Inject(EMPLOYEE_DEDUCTION_REPOSITORY)
    private readonly employeeDeductionRepository: IEmployeeDeductionRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetAllEmployeeDeductionsUseCase.name);
  }

  async execute(filters: EmployeeDeductionFiltersDto): Promise<{
    data: EmployeeDeductionEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log('Fetching all employee deductions with filters');

    const result = await this.employeeDeductionRepository.findAll(filters);

    return result;
  }
}
