/**
 * Get Employee Deduction Use Case
 * Business logic for retrieving a single employee deduction by ID
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  type IEmployeeDeductionRepository,
  EMPLOYEE_DEDUCTION_REPOSITORY,
} from '../repositories';
import { EmployeeDeductionEntity } from '../entities';

@Injectable()
export class GetEmployeeDeductionUseCase {
  constructor(
    @Inject(EMPLOYEE_DEDUCTION_REPOSITORY)
    private readonly employeeDeductionRepository: IEmployeeDeductionRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetEmployeeDeductionUseCase.name);
  }

  async execute(id: string): Promise<EmployeeDeductionEntity> {
    this.logger.log(`Fetching employee deduction with ID: ${id}`);

    const employeeDeduction =
      await this.employeeDeductionRepository.findById(id);

    if (!employeeDeduction) {
      throw new NotFoundException(`Employee deduction with ID ${id} not found`);
    }

    return employeeDeduction;
  }
}
