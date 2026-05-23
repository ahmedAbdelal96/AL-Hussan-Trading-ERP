/**
 * Get Employee Allowance Use Case
 * Business logic for retrieving a single employee allowance by ID
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  EMPLOYEE_ALLOWANCE_REPOSITORY,
  type IEmployeeAllowanceRepository,
} from '../repositories';
import { EmployeeAllowanceEntity } from '../entities';

@Injectable()
export class GetEmployeeAllowanceUseCase {
  constructor(
    @Inject(EMPLOYEE_ALLOWANCE_REPOSITORY)
    private readonly employeeAllowanceRepository: IEmployeeAllowanceRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(GetEmployeeAllowanceUseCase.name);
  }

  async execute(id: string): Promise<EmployeeAllowanceEntity> {
    this.logger.log(`Fetching employee allowance with ID: ${id}`);

    const employeeAllowance =
      await this.employeeAllowanceRepository.findById(id);

    if (!employeeAllowance) {
      throw new NotFoundException(
        this.i18n.t('payroll.allowance.notFound', { args: { id } }),
      );
    }

    return employeeAllowance;
  }
}
