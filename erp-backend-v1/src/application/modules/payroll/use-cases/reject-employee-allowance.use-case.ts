/**
 * Reject Employee Allowance Use Case
 * Business logic for rejecting an employee allowance
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
import { RejectEmployeeAllowanceDto } from '../dto';
import { EmployeeAllowanceEntity } from '../entities';

@Injectable()
export class RejectEmployeeAllowanceUseCase {
  constructor(
    @Inject(EMPLOYEE_ALLOWANCE_REPOSITORY)
    private readonly employeeAllowanceRepository: IEmployeeAllowanceRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(RejectEmployeeAllowanceUseCase.name);
  }

  async execute(
    id: string,
    dto: RejectEmployeeAllowanceDto,
    userId: string,
  ): Promise<EmployeeAllowanceEntity> {
    this.logger.log(`Rejecting employee allowance with ID: ${id}`);

    try {
      // Check if employee allowance exists
      const existing = await this.employeeAllowanceRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(
          `Employee allowance with ID ${id} not found`,
        );
      }

      // Validate not already approved - use isApproved() method from entity
      if (existing.isApproved()) {
        throw new BadRequestException(
          'Employee allowance has already been processed',
        );
      }

      // Reject employee allowance
      const rejected = await this.employeeAllowanceRepository.reject(
        id,
        userId,
        dto.rejectionReason,
        dto.rowVersion,
      );

      this.logger.log(`Employee allowance rejected successfully: ${id}`);

      return rejected;
    } catch (error) {
      this.logger.log(`Failed to reject employee allowance: ${error.message}`);
      throw error;
    }
  }
}
