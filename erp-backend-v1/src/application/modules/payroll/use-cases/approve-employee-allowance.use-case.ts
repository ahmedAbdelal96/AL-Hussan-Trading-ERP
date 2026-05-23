/**
 * Approve Employee Allowance Use Case
 * Business logic for approving an employee allowance
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
  EMPLOYEE_ALLOWANCE_REPOSITORY,
  type IEmployeeAllowanceRepository,
} from '../repositories';
import { ApproveEmployeeAllowanceDto } from '../dto';
import { EmployeeAllowanceEntity } from '../entities';

@Injectable()
export class ApproveEmployeeAllowanceUseCase {
  constructor(
    @Inject(EMPLOYEE_ALLOWANCE_REPOSITORY)
    private readonly employeeAllowanceRepository: IEmployeeAllowanceRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(ApproveEmployeeAllowanceUseCase.name);
  }

  async execute(
    id: string,
    dto: ApproveEmployeeAllowanceDto,
    userId: string,
  ): Promise<EmployeeAllowanceEntity> {
    this.logger.log(`Approving employee allowance with ID: ${id}`);

    try {
      // Check if employee allowance exists
      const existing = await this.employeeAllowanceRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(
          this.i18n.t('payroll.allowance.notFound', { args: { id } }),
        );
      }

      // Validate not already approved - use isApproved() method from entity
      if (existing.isApproved()) {
        throw new BadRequestException(
          this.i18n.t('payroll.allowance.alreadyApproved'),
        );
      }

      // Approve employee allowance
      const approved = await this.employeeAllowanceRepository.approve(
        id,
        userId,
        dto.rowVersion,
      );

      this.logger.log(`Employee allowance approved successfully: ${id}`);

      return approved;
    } catch (error) {
      this.logger.log(`Failed to approve employee allowance: ${error.message}`);
      throw error;
    }
  }
}
