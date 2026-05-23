/**
 * List Deleted Employee Allowances Use Case
 * Business logic for retrieving soft-deleted employee allowances
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
export class ListDeletedEmployeeAllowancesUseCase {
  constructor(
    @Inject(EMPLOYEE_ALLOWANCE_REPOSITORY)
    private readonly employeeAllowanceRepository: IEmployeeAllowanceRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(ListDeletedEmployeeAllowancesUseCase.name);
  }

  async execute(filters: EmployeeAllowanceFiltersDto): Promise<{
    data: EmployeeAllowanceEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log('Retrieving deleted employee allowances');

    try {
      const result =
        await this.employeeAllowanceRepository.findDeleted(filters);

      this.logger.log(
        `Retrieved ${result.data.length} deleted employee allowances`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve deleted employee allowances: ${error.message}`,
      );
      throw error;
    }
  }
}
