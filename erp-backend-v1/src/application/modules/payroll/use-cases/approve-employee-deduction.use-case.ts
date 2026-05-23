/**
 * Approve Employee Deduction Use Case
 * Business logic for approving an employee deduction
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
  EMPLOYEE_DEDUCTION_REPOSITORY,
  type IEmployeeDeductionRepository,
} from '../repositories';
import { EmployeeDeductionEntity } from '../entities';
import { ApproveEmployeeDeductionDto } from '../dto';

@Injectable()
export class ApproveEmployeeDeductionUseCase {
  constructor(
    @Inject(EMPLOYEE_DEDUCTION_REPOSITORY)
    private readonly employeeDeductionRepository: IEmployeeDeductionRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(ApproveEmployeeDeductionUseCase.name);
  }

  async execute(
    id: string,
    dto: ApproveEmployeeDeductionDto,
    userId: string,
  ): Promise<EmployeeDeductionEntity> {
    this.logger.log(`Approving employee deduction with ID: ${id}`);

    try {
      // Check if employee deduction exists
      const existing = await this.employeeDeductionRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(
          this.i18n.t('payroll.deduction.notFound', { args: { id } }),
        );
      }

      // Validate not already approved
      if (existing.approvedBy && existing.approvedAt) {
        throw new BadRequestException(
          this.i18n.t('payroll.deduction.alreadyApproved'),
        );
      }

      // Auto-approved types should not go through this process
      const autoApprovedTypes = ['TAX', 'INSURANCE', 'LOAN_REPAYMENT'];
      if (autoApprovedTypes.includes(existing.deductionType)) {
        throw new BadRequestException(
          this.i18n.t('payroll.deduction.autoApprovedType'),
        );
      }

      // Approve employee deduction
      const approved = await this.employeeDeductionRepository.approve(
        id,
        userId,
        dto.notes,
        dto.rowVersion,
      );

      this.logger.log(`Employee deduction approved successfully: ${id}`);

      return approved;
    } catch (error) {
      this.logger.log(`Failed to approve employee deduction: ${error.message}`);
      throw error;
    }
  }
}
