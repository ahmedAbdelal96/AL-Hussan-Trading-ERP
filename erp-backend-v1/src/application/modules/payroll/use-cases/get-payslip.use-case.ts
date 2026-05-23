/**
 * Get Payslip by ID Use Case
 * Business logic for retrieving a single payslip
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { PAYSLIP_REPOSITORY, type IPayslipRepository } from '../repositories';
import { PayslipResponseDto } from '../dto';

@Injectable()
export class GetPayslipUseCase {
  constructor(
    @Inject(PAYSLIP_REPOSITORY)
    private readonly payslipRepository: IPayslipRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetPayslipUseCase.name);
  }

  async execute(id: string): Promise<PayslipResponseDto> {
    this.logger.log(`Fetching payslip with ID: ${id}`);

    try {
      const payslip = await this.payslipRepository.findById(id);

      if (!payslip) {
        throw new NotFoundException(`Payslip with ID ${id} not found`);
      }

      this.logger.log(`Payslip found: ${id}`);

      return payslip;
    } catch (error) {
      this.logger.error(`Failed to fetch payslip: ${error.message}`);
      throw error;
    }
  }
}
