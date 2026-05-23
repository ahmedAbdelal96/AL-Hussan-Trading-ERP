/**
 * Get All Payslips Use Case
 * Business logic for retrieving payslips with filters and pagination
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { PAYSLIP_REPOSITORY, type IPayslipRepository } from '../repositories';
import { PayslipFiltersDto, PaginatedPayslipsDto } from '../dto';

@Injectable()
export class GetAllPayslipsUseCase {
  constructor(
    @Inject(PAYSLIP_REPOSITORY)
    private readonly payslipRepository: IPayslipRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetAllPayslipsUseCase.name);
  }

  async execute(filters: PayslipFiltersDto): Promise<PaginatedPayslipsDto> {
    this.logger.log(
      `Fetching payslips with filters: ${JSON.stringify(filters)}`,
    );

    try {
      const result = await this.payslipRepository.findAll(filters);

      this.logger.log(`Found ${result.total} payslips`);

      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch payslips: ${error.message}`);
      throw error;
    }
  }
}
