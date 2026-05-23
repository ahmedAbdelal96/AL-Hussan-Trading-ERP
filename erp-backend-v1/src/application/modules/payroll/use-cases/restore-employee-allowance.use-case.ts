/**
 * Restore Employee Allowance Use Case
 * Business logic for restoring a soft-deleted employee allowance
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  EMPLOYEE_ALLOWANCE_REPOSITORY,
  type IEmployeeAllowanceRepository,
} from '../repositories';
import { EmployeeAllowanceEntity } from '../entities';

@Injectable()
export class RestoreEmployeeAllowanceUseCase {
  constructor(
    @Inject(EMPLOYEE_ALLOWANCE_REPOSITORY)
    private readonly employeeAllowanceRepository: IEmployeeAllowanceRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(RestoreEmployeeAllowanceUseCase.name);
  }

  async execute(id: string): Promise<EmployeeAllowanceEntity> {
    this.logger.log(`Restoring soft-deleted employee allowance: ${id}`);

    try {
      const restored = await this.employeeAllowanceRepository.restore(id);

      this.logger.log(
        `Employee allowance restored successfully: ${restored.id}`,
      );

      return restored;
    } catch (error) {
      this.logger.error(
        `Failed to restore employee allowance: ${error.message}`,
      );
      throw error;
    }
  }
}
