/**
 * List Deleted Employee Deductions Use Case
 * Business logic for retrieving soft-deleted employee deductions
 * Only accessible to SUPERADMIN role
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
export class ListDeletedEmployeeDeductionsUseCase {
  constructor(
    @Inject(EMPLOYEE_DEDUCTION_REPOSITORY)
    private readonly employeeDeductionRepository: IEmployeeDeductionRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(ListDeletedEmployeeDeductionsUseCase.name);
  }

  async execute(filters: EmployeeDeductionFiltersDto): Promise<{
    data: EmployeeDeductionEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log('Retrieving deleted employee deductions');

    try {
      const result =
        await this.employeeDeductionRepository.findDeleted(filters);

      this.logger.log(
        `Retrieved ${result.data.length} deleted employee deductions`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve deleted employee deductions: ${error.message}`,
      );
      throw error;
    }
  }
}
