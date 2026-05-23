/**
 * Preview Payroll Use Case
 * Calculates salary components for all employees WITHOUT saving
 * Used to show management what payroll would look like before processing
 */

import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  EMPLOYEE_ALLOWANCE_REPOSITORY,
  type IEmployeeAllowanceRepository,
  EMPLOYEE_LOAN_REPOSITORY,
  type IEmployeeLoanRepository,
} from '../repositories';
import {
  PreviewPayrollDto,
  PreviewPayrollResponseDto,
  PreviewEmployeePayroll,
} from '../dto';
import { PayrollCalculatorService } from './payroll-calculator.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { EmployeeStatus } from '@prisma/client';

type PreviewEmployeeRecord = Prisma.EmployeeGetPayload<{
  select: {
    id: true;
    firstName: true;
    lastName: true;
    employeeNumber: true;
    department: { select: { nameAr: true; nameEn: true } };
    position: { select: { nameAr: true; nameEn: true } };
    baseSalary: true;
  };
}>;

@Injectable()
export class PreviewPayrollUseCase {
  constructor(
    @Inject(EMPLOYEE_ALLOWANCE_REPOSITORY)
    private readonly allowanceRepository: IEmployeeAllowanceRepository,
    @Inject(EMPLOYEE_LOAN_REPOSITORY)
    private readonly loanRepository: IEmployeeLoanRepository,
    private readonly calculator: PayrollCalculatorService,
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(PreviewPayrollUseCase.name);
  }

  async execute(dto: PreviewPayrollDto): Promise<PreviewPayrollResponseDto> {
    this.logger.log(
      `Previewing payroll for ${dto.payPeriodMonth}/${dto.payPeriodYear}`,
    );

    // Validate period
    if (dto.payPeriodMonth < 1 || dto.payPeriodMonth > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }
    if (dto.payPeriodYear < 2000 || dto.payPeriodYear > 2100) {
      throw new BadRequestException('Year must be between 2000 and 2100');
    }

    // Check if already processed
    const existingPayslips = await this.prisma.payslip.findMany({
      where: {
        payPeriodMonth: dto.payPeriodMonth,
        payPeriodYear: dto.payPeriodYear,
        ...(dto.employeeIds && { employeeId: { in: dto.employeeIds } }),
      },
      select: { id: true },
    });
    const alreadyProcessed = existingPayslips.length > 0;

    // Get active employees
    const employees = await this.prisma.employee.findMany({
      where: {
        status: EmployeeStatus.ACTIVE,
        deletedAt: null,
        ...(dto.employeeIds && { id: { in: dto.employeeIds } }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeNumber: true,
        department: { select: { nameAr: true, nameEn: true } },
        position: { select: { nameAr: true, nameEn: true } },
        baseSalary: true,
      },
    });

    if (employees.length === 0) {
      throw new BadRequestException('No active employees found');
    }

    // Calculate for each employee
    const results = await Promise.allSettled(
      employees.map((emp) =>
        this.previewEmployee(emp, dto.payPeriodMonth, dto.payPeriodYear),
      ),
    );

    // Compile response
    const employeeResults: PreviewEmployeePayroll[] = [];
    const errors: {
      employeeId: string;
      employeeName: string;
      error: string;
    }[] = [];

    let totalGrossSalary = new Prisma.Decimal(0);
    let totalDeductions = new Prisma.Decimal(0);
    let totalNetSalary = new Prisma.Decimal(0);

    results.forEach((result, index) => {
      const emp = employees[index];
      if (result.status === 'fulfilled') {
        employeeResults.push(result.value);
        totalGrossSalary = totalGrossSalary.plus(
          new Prisma.Decimal(result.value.grossSalary),
        );
        totalDeductions = totalDeductions.plus(
          new Prisma.Decimal(result.value.totalDeductions),
        );
        totalNetSalary = totalNetSalary.plus(
          new Prisma.Decimal(result.value.netSalary),
        );
      } else {
        errors.push({
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          error: result.reason.message,
        });
      }
    });

    return {
      alreadyProcessed,
      totalEmployees: employees.length,
      totalGrossSalary: totalGrossSalary.toNumber(),
      totalDeductions: totalDeductions.toNumber(),
      totalNetSalary: totalNetSalary.toNumber(),
      employees: employeeResults,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async previewEmployee(
    employee: PreviewEmployeeRecord,
    month: number,
    year: number,
  ): Promise<PreviewEmployeePayroll> {
    // Validate employee has a base salary
    if (!employee.baseSalary || Number(employee.baseSalary) <= 0) {
      throw new Error(
        `لم يتم تحديد الراتب الأساسي للموظف ${employee.firstName} ${employee.lastName} (${employee.employeeNumber})`,
      );
    }

    // Get active allowances at the specific date
    const allowances =
      await this.allowanceRepository.findActiveByEmployeeIdAtDate(
        employee.id,
        month,
        year,
      );

    // Get active loans at the specific date
    const loans = await this.loanRepository.findActiveByEmployeeIdAtDate(
      employee.id,
      month,
      year,
    );

    // Get deductions for this month
    const deductions = await this.calculator.getMonthlyDeductions(
      employee.id,
      month,
      year,
    );

    // Calculate salary components using employee.baseSalary directly
    const components = this.calculator.calculateSalaryComponents(
      employee.baseSalary,
      allowances,
      loans,
      deductions,
    );

    return {
      employeeId: employee.id,
      employeeNumber: employee.employeeNumber,
      firstName: employee.firstName,
      lastName: employee.lastName,
      department:
        employee.department?.nameAr || employee.department?.nameEn || '',
      ...components,
    };
  }
}
