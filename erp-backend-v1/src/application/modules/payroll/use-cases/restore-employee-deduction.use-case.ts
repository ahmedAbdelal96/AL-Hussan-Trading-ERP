/**
 * Restore Employee Deduction Use Case
 * Business logic for restoring a soft-deleted employee deduction
 * Only accessible to SUPERADMIN role
 */

import { Injectable, Inject } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  type IEmployeeDeductionRepository,
  EMPLOYEE_DEDUCTION_REPOSITORY,
} from '../repositories';
import { EmployeeDeductionEntity } from '../entities';

@Injectable()
export class RestoreEmployeeDeductionUseCase {
  constructor(
    @Inject(EMPLOYEE_DEDUCTION_REPOSITORY)
    private readonly employeeDeductionRepository: IEmployeeDeductionRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(RestoreEmployeeDeductionUseCase.name);
  }

  async execute(id: string): Promise<EmployeeDeductionEntity> {
    this.logger.log(`Restoring employee deduction with ID: ${id}`);

    try {
      // Restore employee deduction (repository handles validation)
      const restoredDeduction =
        await this.employeeDeductionRepository.restore(id);

      this.logger.log(`Employee deduction restored successfully: ${id}`);
      return restoredDeduction;
    } catch (error) {
      this.logger.error(
        `Failed to restore employee deduction: ${error.message}`,
      );
      throw error;
    }
  }
}
