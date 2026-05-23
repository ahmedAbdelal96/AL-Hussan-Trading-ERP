/**
 * Update Employee Loan Use Case
 * Business logic for updating an existing employee loan
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  EMPLOYEE_LOAN_REPOSITORY,
  type IEmployeeLoanRepository,
} from '../repositories';
import { UpdateEmployeeLoanDto } from '../dto';
import { EmployeeLoanEntity } from '../entities';

@Injectable()
export class UpdateEmployeeLoanUseCase {
  constructor(
    @Inject(EMPLOYEE_LOAN_REPOSITORY)
    private readonly employeeLoanRepository: IEmployeeLoanRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(UpdateEmployeeLoanUseCase.name);
  }

  async execute(
    id: string,
    dto: UpdateEmployeeLoanDto,
  ): Promise<EmployeeLoanEntity> {
    this.logger.log(`Updating employee loan with ID: ${id}`);

    try {
      // Check if employee loan exists
      const existing = await this.employeeLoanRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(`Employee loan with ID ${id} not found`);
      }

      // Validate installment count if provided
      if (dto.installments !== undefined && dto.installments <= 0) {
        throw new BadRequestException(
          'Installment count must be greater than 0',
        );
      }

      // Update employee loan
      const updated = await this.employeeLoanRepository.update(id, dto);

      this.logger.log(`Employee loan updated successfully: ${id}`);

      return updated;
    } catch (error) {
      this.logger.log(`Failed to update employee loan: ${error.message}`);
      throw error;
    }
  }
}
