/**
 * Get Employee Deductions Summary Use Case
 * Business logic for retrieving total deductions by type for an employee
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  type IEmployeeDeductionRepository,
  EMPLOYEE_DEDUCTION_REPOSITORY,
} from '../repositories';
import { DeductionType } from '@prisma/client';

export interface EmployeeDeductionsSummary {
  employeeId: string;
  deductions: {
    type: DeductionType;
    total: number;
  }[];
  totalDeductions: number;
}

@Injectable()
export class GetEmployeeDeductionsSummaryUseCase {
  constructor(
    @Inject(EMPLOYEE_DEDUCTION_REPOSITORY)
    private readonly employeeDeductionRepository: IEmployeeDeductionRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetEmployeeDeductionsSummaryUseCase.name);
  }

  async execute(
    employeeId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<EmployeeDeductionsSummary> {
    this.logger.log(`Fetching deductions summary for employee: ${employeeId}`);

    // Get totals for each deduction type
    const deductionTypes = Object.values(DeductionType);
    const deductions = await Promise.all(
      deductionTypes.map(async (type) => {
        const total = await this.employeeDeductionRepository.getTotalByType(
          employeeId,
          type,
          startDate,
          endDate,
        );
        return { type, total };
      }),
    );

    // Calculate total deductions
    const totalDeductions = deductions.reduce(
      (sum, deduction) => sum + deduction.total,
      0,
    );

    return {
      employeeId,
      deductions: deductions.filter((d) => d.total > 0), // Only return types with actual deductions
      totalDeductions,
    };
  }
}
