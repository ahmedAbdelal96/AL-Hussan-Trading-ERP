/**
 * Update Employee Allowance Use Case
 * Business logic for updating an existing employee allowance
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  EMPLOYEE_ALLOWANCE_REPOSITORY,
  type IEmployeeAllowanceRepository,
} from '../repositories';
import { UpdateEmployeeAllowanceDto } from '../dto';
import { EmployeeAllowanceEntity } from '../entities';

@Injectable()
export class UpdateEmployeeAllowanceUseCase {
  constructor(
    @Inject(EMPLOYEE_ALLOWANCE_REPOSITORY)
    private readonly employeeAllowanceRepository: IEmployeeAllowanceRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(UpdateEmployeeAllowanceUseCase.name);
  }

  async execute(
    id: string,
    dto: UpdateEmployeeAllowanceDto,
  ): Promise<EmployeeAllowanceEntity> {
    this.logger.log(`Updating employee allowance with ID: ${id}`);

    try {
      // Check if employee allowance exists
      const existing = await this.employeeAllowanceRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(
          `Employee allowance with ID ${id} not found`,
        );
      }

      // Validate amount if provided
      if (dto.amount !== undefined && dto.amount <= 0) {
        throw new BadRequestException(
          'Allowance amount must be greater than 0',
        );
      }

      // Update employee allowance
      const updated = await this.employeeAllowanceRepository.update(id, dto);

      this.logger.log(`Employee allowance updated successfully: ${id}`);

      return updated;
    } catch (error) {
      this.logger.log(`Failed to update employee allowance: ${error.message}`);
      throw error;
    }
  }
}
