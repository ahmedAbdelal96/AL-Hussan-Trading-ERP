/**
 * Delete Allowance Type Use Case
 * Business logic for deleting an allowance type
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  ALLOWANCE_TYPE_REPOSITORY,
  EMPLOYEE_ALLOWANCE_REPOSITORY,
  type IAllowanceTypeRepository,
  type IEmployeeAllowanceRepository,
} from '../repositories';

@Injectable()
export class DeleteAllowanceTypeUseCase {
  constructor(
    @Inject(ALLOWANCE_TYPE_REPOSITORY)
    private readonly allowanceTypeRepository: IAllowanceTypeRepository,
    @Inject(EMPLOYEE_ALLOWANCE_REPOSITORY)
    private readonly employeeAllowanceRepository: IEmployeeAllowanceRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(DeleteAllowanceTypeUseCase.name);
  }

  async execute(id: string, rowVersion?: number): Promise<void> {
    this.logger.log(`Deleting allowance type with ID: ${id}`);

    try {
      // Check if allowance type exists
      const existing = await this.allowanceTypeRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(
          this.i18n.t('payroll.allowance.typeNotFound', { args: { id } }),
        );
      }

      // Check if allowance type is in use
      const employeeAllowances = await this.employeeAllowanceRepository.findAll(
        {
          allowanceTypeId: id,
          page: 1,
          limit: 1,
        },
      );

      if (employeeAllowances.total > 0) {
        throw new BadRequestException(
          this.i18n.t('payroll.allowance.typeInUse', {
            args: { count: employeeAllowances.total },
          }),
        );
      }

      // Delete allowance type
      await this.allowanceTypeRepository.delete(id, rowVersion);

      this.logger.log(`Allowance type deleted successfully: ${id}`);
    } catch (error) {
      this.logger.log(`Failed to delete allowance type: ${error.message}`);
      throw error;
    }
  }
}
