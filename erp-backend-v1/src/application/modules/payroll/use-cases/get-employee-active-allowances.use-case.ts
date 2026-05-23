/**
 * Get Employee Active Allowances Use Case
 * Business logic for retrieving all active allowances for a specific employee
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  EMPLOYEE_ALLOWANCE_REPOSITORY,
  type IEmployeeAllowanceRepository,
} from '../repositories';
import { EmployeeAllowanceEntity } from '../entities';

@Injectable()
export class GetEmployeeActiveAllowancesUseCase {
  constructor(
    @Inject(EMPLOYEE_ALLOWANCE_REPOSITORY)
    private readonly employeeAllowanceRepository: IEmployeeAllowanceRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetEmployeeActiveAllowancesUseCase.name);
  }

  async execute(employeeId: string): Promise<EmployeeAllowanceEntity[]> {
    this.logger.log(`Fetching active allowances for employee: ${employeeId}`);

    // Fetch all allowances for the employee (not just approved ones)
    // This allows the frontend to display and manage all statuses (PENDING, APPROVED, REJECTED)
    const allowances =
      await this.employeeAllowanceRepository.findByEmployeeId(employeeId);

    return allowances;
  }
}
