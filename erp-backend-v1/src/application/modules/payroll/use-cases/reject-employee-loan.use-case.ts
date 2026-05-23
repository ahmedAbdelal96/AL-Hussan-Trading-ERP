/**
 * Reject Employee Loan Use Case
 * Business logic for rejecting an employee loan
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
import { RejectEmployeeLoanDto } from '../dto';
import { EmployeeLoanEntity } from '../entities';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class RejectEmployeeLoanUseCase {
  constructor(
    @Inject(EMPLOYEE_LOAN_REPOSITORY)
    private readonly employeeLoanRepository: IEmployeeLoanRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(RejectEmployeeLoanUseCase.name);
  }

  async execute(
    id: string,
    dto: RejectEmployeeLoanDto,
    userId: string,
  ): Promise<EmployeeLoanEntity> {
    this.logger.log(`Rejecting employee loan with ID: ${id}`);

    try {
      // Check if employee loan exists
      const existing = await this.employeeLoanRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(`Employee loan with ID ${id} not found`);
      }

      // Validate status - can only reject PENDING loans
      if (existing.status !== LoanStatus.PENDING) {
        throw new BadRequestException(
          `Cannot reject loan: current status is ${existing.status}. Only PENDING loans can be rejected.`,
        );
      }

      // Reject employee loan (status changes to REJECTED)
      const rejected = await this.employeeLoanRepository.reject(
        id,
        userId,
        dto.rejectionReason,
        dto.rowVersion,
      );

      this.logger.log(`Employee loan rejected successfully: ${id}`);

      return rejected;
    } catch (error) {
      this.logger.log(`Failed to reject employee loan: ${error.message}`);
      throw error;
    }
  }
}
