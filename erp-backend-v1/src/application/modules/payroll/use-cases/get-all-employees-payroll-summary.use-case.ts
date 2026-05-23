/**
 * Get All Employees Payroll Summary Use Case
 * Business logic for retrieving payroll summaries for multiple employees
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  type IEmployeeAllowanceRepository,
  EMPLOYEE_ALLOWANCE_REPOSITORY,
  type IEmployeeDeductionRepository,
  EMPLOYEE_DEDUCTION_REPOSITORY,
} from '../repositories';
import {
  EmployeePayrollSummaryDto,
  AllowanceBreakdownDto,
  DeductionBreakdownDto,
} from '../dto';
import { DeductionType } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';

@Injectable()
export class GetAllEmployeesPayrollSummaryUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EMPLOYEE_ALLOWANCE_REPOSITORY)
    private readonly employeeAllowanceRepository: IEmployeeAllowanceRepository,
    @Inject(EMPLOYEE_DEDUCTION_REPOSITORY)
    private readonly employeeDeductionRepository: IEmployeeDeductionRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetAllEmployeesPayrollSummaryUseCase.name);
  }

  async execute(
    employeeIds: string[],
    periodStart?: Date,
    periodEnd?: Date,
  ): Promise<EmployeePayrollSummaryDto[]> {
    this.logger.log(
      `Fetching payroll summaries for ${employeeIds.length} employees`,
    );

    const summaries = await Promise.all(
      employeeIds.map((employeeId) =>
        this.getEmployeeSummary(employeeId, periodStart, periodEnd),
      ),
    );

    return summaries;
  }

  private async getEmployeeSummary(
    employeeId: string,
    periodStart?: Date,
    periodEnd?: Date,
  ): Promise<EmployeePayrollSummaryDto> {
    // Get baseSalary directly from the employee record
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { baseSalary: true },
    });
    const baseSalary = employee?.baseSalary ? Number(employee.baseSalary) : 0;

    // Get active allowances
    const activeAllowances =
      await this.employeeAllowanceRepository.findActiveByEmployeeId(employeeId);
    const allowanceBreakdown: AllowanceBreakdownDto[] = activeAllowances.map(
      (allowance) => ({
        allowanceType: allowance.allowanceType?.name || 'Unknown',
        amount: Number(allowance.amount),
        frequency: allowance.frequency,
      }),
    );
    const totalAllowances = allowanceBreakdown.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    // Get deductions for the period
    const deductions = await this.employeeDeductionRepository.findByDateRange(
      periodStart ||
        new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      periodEnd || new Date(),
      employeeId,
    );

    // Group deductions by type and calculate totals
    const deductionMap = new Map<DeductionType, number>();
    deductions.forEach((deduction) => {
      const current = deductionMap.get(deduction.deductionType) || 0;
      deductionMap.set(
        deduction.deductionType,
        current + Number(deduction.amount),
      );
    });

    const deductionBreakdown: DeductionBreakdownDto[] = Array.from(
      deductionMap.entries(),
    ).map(([type, amount]) => ({
      deductionType: type,
      amount,
    }));
    const totalDeductions = deductionBreakdown.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    // Calculate net salary
    const netSalary = baseSalary + totalAllowances - totalDeductions;

    return {
      employeeId,
      baseSalary,
      totalAllowances,
      allowanceBreakdown,
      totalDeductions,
      deductionBreakdown,
      netSalary,
      currency: 'SAR', // Default to SAR, could be configurable
      periodStart,
      periodEnd,
    };
  }
}
