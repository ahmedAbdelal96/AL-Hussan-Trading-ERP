/**
 * Process Payroll Use Case
 * Business logic for generating monthly payslips for employees
 *
 * This use case:
 * 1. Fetches active employees (or specific employees if provided)
 * 2. Calculates salary components for each employee
 * 3. Generates payslips with proper calculations
 * 4. Records loan installment payments
 * 5. Allocates salary costs to linked projects
 *    - Single-project: direct Cost only (no CostAllocation row)
 *    - Multi-project: allocated Cost + CostAllocation rows
 * 6. Handles errors gracefully and returns summary
 */

import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  Prisma,
  ProjectStatus,
  CostType,
  PaymentStatus,
  LoanRepaymentSource,
} from '@prisma/client';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  PAYSLIP_REPOSITORY,
  type IPayslipRepository,
  EMPLOYEE_ALLOWANCE_REPOSITORY,
  type IEmployeeAllowanceRepository,
  EMPLOYEE_LOAN_REPOSITORY,
  type IEmployeeLoanRepository,
} from '../repositories';
import { ProcessPayrollDto, ProcessPayrollResponseDto } from '../dto';
import { PayrollCalculatorService } from './payroll-calculator.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { EmployeeStatus } from '@prisma/client';

/** Project statuses eligible to receive salary cost allocation */
const ALLOWED_PROJECT_STATUSES: ProjectStatus[] = [
  ProjectStatus.ACTIVE,
  ProjectStatus.ON_HOLD,
  ProjectStatus.PLANNING,
];

@Injectable()
export class ProcessPayrollUseCase {
  constructor(
    @Inject(PAYSLIP_REPOSITORY)
    private readonly payslipRepository: IPayslipRepository,
    @Inject(EMPLOYEE_ALLOWANCE_REPOSITORY)
    private readonly allowanceRepository: IEmployeeAllowanceRepository,
    @Inject(EMPLOYEE_LOAN_REPOSITORY)
    private readonly loanRepository: IEmployeeLoanRepository,
    private readonly calculator: PayrollCalculatorService,
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(ProcessPayrollUseCase.name);
  }

  async execute(
    dto: ProcessPayrollDto,
    userId: string,
  ): Promise<ProcessPayrollResponseDto> {
    this.logger.log(
      `Processing payroll for ${dto.payPeriodMonth}/${dto.payPeriodYear}`,
    );

    try {
      this.validatePeriod(dto.payPeriodMonth, dto.payPeriodYear);

      const employees = await this.getActiveEmployees(dto.employeeIds);

      if (employees.length === 0) {
        throw new BadRequestException('No active employees found to process');
      }

      // Partial-recovery: identify employees that already have payslips for
      // this period (e.g. from a previous run that crashed mid-way).
      // We skip them instead of blocking the entire batch.
      const existingPayslips = await this.prisma.payslip.findMany({
        where: {
          payPeriodMonth: dto.payPeriodMonth,
          payPeriodYear: dto.payPeriodYear,
          employeeId: { in: employees.map((e) => e.id) },
        },
      });

      const alreadyProcessedIds = new Set(
        existingPayslips.map((p) => p.employeeId),
      );
      const toProcess = employees.filter((e) => !alreadyProcessedIds.has(e.id));

      if (toProcess.length === 0) {
        throw new BadRequestException(
          `Payroll already fully processed for ` +
            `${dto.payPeriodMonth}/${dto.payPeriodYear}. ` +
            `Found ${existingPayslips.length} existing payslips.`,
        );
      }

      if (alreadyProcessedIds.size > 0) {
        this.logger.warn(
          `${alreadyProcessedIds.size} employee(s) already have payslips for ` +
            `${dto.payPeriodMonth}/${dto.payPeriodYear} — skipping them ` +
            `and resuming for the remaining ${toProcess.length}.`,
        );
      }

      const payDate = dto.payDate
        ? new Date(dto.payDate)
        : this.getLastDayOfMonth(dto.payPeriodYear, dto.payPeriodMonth);

      // Recovery step:
      // Existing payslips may come from a previous partial run where payroll
      // rows were created but finance allocation failed before completion.
      // Re-run allocation safely (idempotent guard inside allocation method).
      await this.recoverExistingPayslipAllocations(
        existingPayslips,
        employees,
        payDate,
        userId,
      );

      const results = await Promise.allSettled(
        toProcess.map((employee) =>
          this.processEmployeePayslip(
            employee,
            dto.payPeriodMonth,
            dto.payPeriodYear,
            payDate,
            userId,
            dto.notes,
          ),
        ),
      );

      const response = this.compileResponse(
        results,
        toProcess,
        existingPayslips,
      );

      this.logger.log(
        `Payroll processing completed: ${response.successful}/${response.totalProcessed} successful`,
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to process payroll: ${error.message}`);
      throw error;
    }
  }

  private validatePeriod(month: number, year: number): void {
    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }
    if (year < 2000 || year > 2100) {
      throw new BadRequestException('Year must be between 2000 and 2100');
    }
  }

  private async getActiveEmployees(employeeIds?: string[]) {
    return this.prisma.employee.findMany({
      where: {
        status: EmployeeStatus.ACTIVE,
        deletedAt: null,
        ...(employeeIds && { id: { in: employeeIds } }),
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
  }

  private getLastDayOfMonth(year: number, month: number): Date {
    return new Date(year, month, 0);
  }

  private async processEmployeePayslip(
    employee: any,
    month: number,
    year: number,
    payDate: Date,
    userId: string,
    notes?: string,
  ) {
    if (!employee.baseSalary || Number(employee.baseSalary) <= 0) {
      throw new BadRequestException(
        `لم يتم تحديد الراتب الأساسي للموظف ${employee.employeeNumber}`,
      );
    }

    const allowances =
      await this.allowanceRepository.findActiveByEmployeeIdAtDate(
        employee.id as string,
        month,
        year,
      );

    const loans = await this.loanRepository.findActiveByEmployeeIdAtDate(
      employee.id as string,
      month,
      year,
    );

    const deductions = await this.calculator.getMonthlyDeductions(
      employee.id as string,
      month,
      year,
    );

    const salaryComponents = this.calculator.calculateSalaryComponents(
      employee.baseSalary as Prisma.Decimal,
      allowances,
      loans,
      deductions,
    );

    const payslip = await this.payslipRepository.create(
      {
        employeeId: employee.id,
        payPeriodMonth: month,
        payPeriodYear: year,
        payDate: payDate,
        ...salaryComponents,
        notes,
      },
      userId,
    );

    // Record loan installment payments
    for (const loan of loans) {
      const alreadyPaidThisMonth = deductions.some(
        (d) => d.deductionType === 'LOAN_REPAYMENT' && d.loanId === loan.id,
      );
      if (alreadyPaidThisMonth) continue;
      await this.loanRepository.payInstallment(
        loan.id,
        userId,
        payDate,
        undefined,
        LoanRepaymentSource.PAYROLL_PROCESS,
      );
    }

    // Allocate salary cost to linked projects
    await this.allocateSalaryCostToProjects(employee, payslip, payDate, userId);

    return payslip;
  }

  /**
   * Creates Cost + CostAllocation records for employees assigned to projects.
   *
   * Logic (mirrors maintenance cost allocation):
   * - No active assignments with percentage → overhead employee, skip.
   * - All linked projects ineligible (COMPLETED/CANCELLED) → overhead, skip.
   * - Some ineligible → redistribute percentages among eligible ones (sum = 100).
   */
  private async allocateSalaryCostToProjects(
    employee: any,
    payslip: any,
    payDate: Date,
    userId: string,
  ): Promise<void> {
    // Idempotency guard: if a Cost record already references this payslip
    // (e.g. the previous run created payslip but crashed before committing
    // allocations, then recovered), skip re-creation.
    const existingCost = await this.prisma.cost.findFirst({
      where: { referenceType: 'Payslip', referenceId: payslip.id },
      select: { id: true },
    });
    if (existingCost) {
      this.logger.warn(
        `Cost already exists for payslip ${payslip.id} ` +
          `(employee ${employee.employeeNumber}) — skipping allocation.`,
      );
      return;
    }

    const assignments = await this.prisma.projectEmployee.findMany({
      where: {
        employeeId: employee.id,
        isActive: true,
        percentage: { not: null },
      },
      select: {
        projectId: true,
        percentage: true,
        project: { select: { id: true, name: true, status: true } },
      },
    });

    if (assignments.length === 0) return;

    const eligible = assignments.filter((a) =>
      ALLOWED_PROJECT_STATUSES.includes(a.project.status),
    );

    if (eligible.length === 0) {
      this.logger.warn(
        `Employee ${employee.employeeNumber}: all linked projects are ineligible. Salary treated as overhead.`,
      );
      return;
    }

    const ineligible = assignments.filter(
      (a) => !ALLOWED_PROJECT_STATUSES.includes(a.project.status),
    );

    // Normalise percentages so they always sum to exactly 100
    const totalEligiblePct = eligible.reduce(
      (sum, a) => sum + Number(a.percentage),
      0,
    );

    let redistributionNote: string | undefined;
    if (ineligible.length > 0) {
      const excluded = ineligible
        .map((a) => `"${a.project.name}" (${a.project.status})`)
        .join(', ');
      redistributionNote =
        `Projects excluded (ineligible status): ${excluded}. ` +
        `Percentages redistributed among eligible projects.`;
      this.logger.warn(
        `Employee ${employee.employeeNumber}: ${redistributionNote}`,
      );
    }

    let runningSum = 0;
    const allocations = eligible.map((a, idx) => {
      const isLast = idx === eligible.length - 1;
      const pct = isLast
        ? 100 - runningSum
        : Math.round((Number(a.percentage) / totalEligiblePct) * 10000) / 100;
      runningSum += isLast ? 0 : pct;
      return { projectId: a.projectId, percentage: pct };
    });

    const grossSalary = new Prisma.Decimal(payslip.grossSalary as string);
    const isMultiProject = allocations.length > 1;

    await this.prisma.$transaction(async (tx) => {
      const cost = await tx.cost.create({
        data: {
          costType: CostType.SALARY,
          referenceType: 'Payslip',
          referenceId: payslip.id,
          amount: grossSalary,
          amountBeforeTax: grossSalary,
          currency: 'SAR',
          transactionDate: payDate,
          description:
            `Salary – ${employee.firstName} ${employee.lastName} ` +
            `(${employee.employeeNumber}) – ` +
            `${payslip.payPeriodMonth}/${payslip.payPeriodYear}`,
          isAllocated: isMultiProject,
          projectId: isMultiProject ? null : allocations[0].projectId,
          paymentStatus: PaymentStatus.PAID,
          notes: redistributionNote ?? null,
          createdBy: userId,
        },
      });

      if (isMultiProject) {
        await tx.costAllocation.createMany({
          data: allocations.map((a) => ({
            costId: cost.id,
            projectId: a.projectId,
            percentage: a.percentage,
            allocatedAmount: grossSalary
              .times(a.percentage)
              .dividedBy(100)
              .toDecimalPlaces(2),
          })),
        });
      }
    });

    this.logger.log(
      `Salary cost allocated for ${employee.employeeNumber}: ` +
        allocations
          .map((a) => `${a.percentage.toFixed(2)}% → ${a.projectId}`)
          .join(', '),
    );
  }

  private async recoverExistingPayslipAllocations(
    existingPayslips: any[],
    employees: any[],
    payDate: Date,
    userId: string,
  ): Promise<void> {
    if (existingPayslips.length === 0) return;

    const employeeById = new Map(
      employees.map((employee) => [employee.id, employee]),
    );

    const recoveryResults = await Promise.allSettled(
      existingPayslips.map(async (payslip) => {
        const employee = employeeById.get(payslip.employeeId);
        if (!employee) return;

        await this.allocateSalaryCostToProjects(
          employee,
          payslip,
          payDate,
          userId,
        );
      }),
    );

    const failed = recoveryResults.filter(
      (result) => result.status === 'rejected',
    ).length;
    if (failed > 0) {
      this.logger.warn(
        `Salary allocation recovery failed for ${failed}/${existingPayslips.length} existing payslip(s).`,
      );
    }
  }

  private compileResponse(
    results: any[],
    employees: any[],
    existingPayslips: any[] = [],
  ): ProcessPayrollResponseDto {
    // Pre-seed totals and successes from payslips that were already processed
    // in a previous (possibly partial) run.
    const successful: any[] = [...existingPayslips];
    const errors: any[] = [];

    let totalGrossSalary = existingPayslips.reduce(
      (sum, p) => sum.plus(new Prisma.Decimal(p.grossSalary as string)),
      new Prisma.Decimal(0),
    );
    let totalDeductions = existingPayslips.reduce(
      (sum, p) => sum.plus(new Prisma.Decimal(p.totalDeductions as string)),
      new Prisma.Decimal(0),
    );
    let totalNetSalary = existingPayslips.reduce(
      (sum, p) => sum.plus(new Prisma.Decimal(p.netSalary as string)),
      new Prisma.Decimal(0),
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
        totalGrossSalary = totalGrossSalary.plus(
          new Prisma.Decimal(result.value.grossSalary as string),
        );
        totalDeductions = totalDeductions.plus(
          new Prisma.Decimal(result.value.totalDeductions as string),
        );
        totalNetSalary = totalNetSalary.plus(
          new Prisma.Decimal(result.value.netSalary as string),
        );
      } else {
        errors.push({
          employeeId: employees[index].id,
          employeeName: `${employees[index].firstName} ${employees[index].lastName}`,
          error: result.reason.message,
        });
      }
    });

    return {
      totalProcessed: results.length + existingPayslips.length,
      successful: successful.length,
      failed: errors.length,
      totalGrossSalary: totalGrossSalary.toNumber(),
      totalDeductions: totalDeductions.toNumber(),
      totalNetSalary: totalNetSalary.toNumber(),
      payslips: successful,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
