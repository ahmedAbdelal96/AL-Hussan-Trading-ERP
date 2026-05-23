/**
 * Get Employee Payslips Use Case
 * Business logic for retrieving all payslips for a specific employee
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { PAYSLIP_REPOSITORY, type IPayslipRepository } from '../repositories';
import { PayslipResponseDto } from '../dto';

@Injectable()
export class GetEmployeePayslipsUseCase {
  constructor(
    @Inject(PAYSLIP_REPOSITORY)
    private readonly payslipRepository: IPayslipRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetEmployeePayslipsUseCase.name);
  }

  async execute(employeeId: string): Promise<PayslipResponseDto[]> {
    this.logger.log(`Fetching payslips for employee: ${employeeId}`);

    try {
      const payslips =
        await this.payslipRepository.findByEmployeeId(employeeId);

      this.logger.log(
        `Found ${payslips.length} payslips for employee ${employeeId}`,
      );

      return payslips;
    } catch (error) {
      this.logger.error(`Failed to fetch employee payslips: ${error.message}`);
      throw error;
    }
  }
}
