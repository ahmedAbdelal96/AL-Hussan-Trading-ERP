/**
 * Update Employee Deduction Use Case
 * Business logic for updating an existing employee deduction
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DeductionType } from '@prisma/client';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  type IEmployeeDeductionRepository,
  EMPLOYEE_DEDUCTION_REPOSITORY,
} from '../repositories';
import { UpdateEmployeeDeductionDto } from '../dto';
import { EmployeeDeductionEntity } from '../entities';

@Injectable()
export class UpdateEmployeeDeductionUseCase {
  constructor(
    @Inject(EMPLOYEE_DEDUCTION_REPOSITORY)
    private readonly employeeDeductionRepository: IEmployeeDeductionRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(UpdateEmployeeDeductionUseCase.name);
  }

  async execute(
    id: string,
    dto: UpdateEmployeeDeductionDto,
  ): Promise<EmployeeDeductionEntity> {
    this.logger.log(`Updating employee deduction with ID: ${id}`);

    try {
      // Check if employee deduction exists
      const existing = await this.employeeDeductionRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(
          `Employee deduction with ID ${id} not found`,
        );
      }

      // Validate amount if provided
      if (dto.amount !== undefined && dto.amount <= 0) {
        throw new BadRequestException(
          'Deduction amount must be greater than 0',
        );
      }

      // Loan repayment deductions are system-managed immutable records.
      if (existing.deductionType === DeductionType.LOAN_REPAYMENT) {
        throw new BadRequestException(
          'LOAN_REPAYMENT deductions cannot be updated manually. Use loan payment workflow.',
        );
      }

      // Update employee deduction
      const updated = await this.employeeDeductionRepository.update(id, dto);

      this.logger.log(`Employee deduction updated successfully: ${id}`);

      return updated;
    } catch (error) {
      this.logger.log(`Failed to update employee deduction: ${error.message}`);
      throw error;
    }
  }
}
