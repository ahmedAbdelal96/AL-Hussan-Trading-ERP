/**
 * Delete Employee Allowance Use Case
 * Business logic for deleting an employee allowance
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  EMPLOYEE_ALLOWANCE_REPOSITORY,
  type IEmployeeAllowanceRepository,
} from '../repositories';

@Injectable()
export class DeleteEmployeeAllowanceUseCase {
  constructor(
    @Inject(EMPLOYEE_ALLOWANCE_REPOSITORY)
    private readonly employeeAllowanceRepository: IEmployeeAllowanceRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(DeleteEmployeeAllowanceUseCase.name);
  }

  async execute(
    id: string,
    userId: string,
    rowVersion?: number,
  ): Promise<void> {
    this.logger.log(`Deleting employee allowance with ID: ${id}`);

    try {
      // Check if employee allowance exists
      const existing = await this.employeeAllowanceRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(
          this.i18n.t('payroll.allowance.notFound', { args: { id } }),
        );
      }

      // Soft delete employee allowance
      await this.employeeAllowanceRepository.delete(id, userId, rowVersion);

      this.logger.log(
        `Employee allowance soft deleted successfully: ${id} by user ${userId}`,
      );
    } catch (error) {
      this.logger.log(`Failed to delete employee allowance: ${error.message}`);
      throw error;
    }
  }
}
