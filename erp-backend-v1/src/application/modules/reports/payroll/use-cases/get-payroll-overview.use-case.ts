/**
 * ============================================================================
 * GET PAYROLL OVERVIEW USE CASE
 * ============================================================================
 *
 * Returns high-level KPIs for monthly payroll dashboard.
 *
 * Data Source Priority:
 * 1. Payslip records (actual processed payroll) - for months where payroll ran
 * 2. Employee/Allowance/Deduction estimation - for months without payslips
 *
 * Business Rules:
 * - Defaults to current month/year if not specified
 * - Payslip-based: accurate historical data, unaffected by employee changes
 * - Estimation-based: uses ACTIVE employees + approved allowances/deductions
 * - Includes month-over-month comparison if requested
 *
 * @module GetPayrollOverviewUseCase
 * @version 2.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import { EmployeeStatus, DeductionStatus } from '@prisma/client';
import { PayrollOverviewFiltersDto, PayrollOverviewResponseDto } from '../dto';
import { resolveEmployeeIdsBySiteThroughProjects } from './payroll-scope.helper';

@Injectable()
export class GetPayrollOverviewUseCase {
  constructor(
    private prisma: PrismaService,
    private baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: PayrollOverviewFiltersDto,
  ): Promise<PayrollOverviewResponseDto> {
    const now = new Date();
    const month = filters.month || now.getMonth() + 1;
    const year = filters.year || now.getFullYear();
    const { startDate, endDate } = this.getPeriodBounds(month, year);
    const siteEmployeeIds = filters.siteId
      ? await resolveEmployeeIdsBySiteThroughProjects(
          this.prisma,
          filters.siteId,
          startDate,
          endDate,
        )
      : null;

    // Build payslip filter (for processed months)
    const payslipWhere: any = {
      payPeriodMonth: month,
      payPeriodYear: year,
      ...(siteEmployeeIds ? { employeeId: { in: siteEmployeeIds } } : {}),
    };
    if (filters.departmentId) {
      payslipWhere.employee = {};
      payslipWhere.employee.departmentId = filters.departmentId;
    }

    // Check if payroll has been processed for this period
    const payslipCount = await this.prisma.payslip.count({
      where: payslipWhere,
    });

    if (payslipCount > 0) {
      return this.getFromPayslips(filters, month, year, payslipWhere);
    }

    return this.getFromEstimation(filters, month, year, siteEmployeeIds);
  }

  /**
   * Get overview from actual processed Payslip records (accurate historical data)
   */
  private async getFromPayslips(
    filters: PayrollOverviewFiltersDto,
    month: number,
    year: number,
    payslipWhere: any,
  ): Promise<PayrollOverviewResponseDto> {
    const [agg, employeeCount] = await Promise.all([
      this.prisma.payslip.aggregate({
        where: payslipWhere,
        _sum: {
          baseSalary: true,
          totalAllowances: true,
          totalDeductions: true,
          netSalary: true,
        },
        _avg: {
          baseSalary: true,
          totalAllowances: true,
          totalDeductions: true,
          netSalary: true,
        },
      }),
      this.prisma.payslip.count({ where: payslipWhere }),
    ]);

    const totalBaseSalaries = Number(agg._sum.baseSalary || 0);
    const totalAllowances = Number(agg._sum.totalAllowances || 0);
    const totalDeductions = Number(agg._sum.totalDeductions || 0);
    const netPayroll = Number(agg._sum.netSalary || 0);

    const avgSalaryPerEmployee = Number(agg._avg.netSalary || 0);
    const avgBaseSalary = Number(agg._avg.baseSalary || 0);
    const avgAllowances = Number(agg._avg.totalAllowances || 0);
    const avgDeductions = Number(agg._avg.totalDeductions || 0);

    // Previous month comparison
    let monthGrowthRate: number | undefined;
    let previousMonthPayroll: number | undefined;
    let previousMonthEmployeeCount: number | undefined;

    if (filters.includeComparison !== false) {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const { startDate: prevStartDate, endDate: prevEndDate } =
        this.getPeriodBounds(prevMonth, prevYear);
      const prevSiteEmployeeIds = filters.siteId
        ? await resolveEmployeeIdsBySiteThroughProjects(
            this.prisma,
            filters.siteId,
            prevStartDate,
            prevEndDate,
          )
        : null;

      const prevPayslipWhere: any = {
        payPeriodMonth: prevMonth,
        payPeriodYear: prevYear,
        ...(prevSiteEmployeeIds
          ? { employeeId: { in: prevSiteEmployeeIds } }
          : {}),
      };
      if (filters.departmentId) {
        prevPayslipWhere.employee = {};
        prevPayslipWhere.employee.departmentId = filters.departmentId;
      }

      const prevPayslipCount = await this.prisma.payslip.count({
        where: prevPayslipWhere,
      });

      if (prevPayslipCount > 0) {
        // Previous month also has payslips - use actual data
        const prevAgg = await this.prisma.payslip.aggregate({
          where: prevPayslipWhere,
          _sum: { netSalary: true },
        });
        previousMonthPayroll = Number(prevAgg._sum.netSalary || 0);
        previousMonthEmployeeCount = prevPayslipCount;
      } else {
        // Previous month has no payslips - estimate
        previousMonthPayroll = await this.estimateNetPayroll(
          prevMonth,
          prevYear,
          filters,
        );
        previousMonthEmployeeCount = undefined;
      }

      monthGrowthRate = this.baseReportService.calculatePercentage(
        netPayroll - previousMonthPayroll,
        previousMonthPayroll,
      );
    }

    return {
      totalBaseSalaries,
      totalAllowances,
      totalDeductions,
      netPayroll,
      employeeCount,
      avgSalaryPerEmployee,
      avgBaseSalary,
      avgAllowances,
      avgDeductions,
      monthGrowthRate,
      previousMonthPayroll,
      previousMonthEmployeeCount,
      currency: 'SAR',
      month,
      year,
      generatedAt: new Date(),
    };
  }

  /**
   * Estimate overview from Employee/Allowance/Deduction data
   * Used for months where payroll has not been processed yet
   */
  private async getFromEstimation(
    filters: PayrollOverviewFiltersDto,
    month: number,
    year: number,
    siteEmployeeIds: string[] | null,
  ): Promise<PayrollOverviewResponseDto> {
    const employeeStatus = filters.employeeStatus || EmployeeStatus.ACTIVE;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const employeeWhere: any = { status: employeeStatus };
    if (filters.departmentId) employeeWhere.departmentId = filters.departmentId;
    if (siteEmployeeIds) employeeWhere.id = { in: siteEmployeeIds };

    const employees = await this.prisma.employee.findMany({
      where: employeeWhere,
      select: { id: true, baseSalary: true },
    });

    const employeeIds = employees.map((e) => e.id);

    const [allowancesAgg, deductionsAgg] = await Promise.all([
      this.prisma.employeeAllowance.aggregate({
        where: {
          employeeId: { in: employeeIds },
          status: 'APPROVED',
          effectiveFrom: { lte: endDate },
          AND: [
            {
              OR: [{ effectiveTo: null }, { effectiveTo: { gte: startDate } }],
            },
            {
              OR: [
                { frequency: 'MONTHLY' },
                {
                  AND: [
                    { frequency: 'ONE_TIME' },
                    { effectiveFrom: { gte: startDate, lte: endDate } },
                  ],
                },
              ],
            },
          ],
        },
        _sum: { amount: true },
      }),
      this.prisma.employeeDeduction.aggregate({
        where: {
          employeeId: { in: employeeIds },
          deductionDate: { gte: startDate, lte: endDate },
          status: DeductionStatus.APPROVED,
        },
        _sum: { amount: true },
      }),
    ]);

    let totalBaseSalaries = 0;
    employees.forEach((emp) => {
      if (emp.baseSalary) totalBaseSalaries += Number(emp.baseSalary);
    });

    const totalAllowances = Number(allowancesAgg._sum?.amount || 0);
    const totalDeductions = Number(deductionsAgg._sum.amount || 0);
    const netPayroll = totalBaseSalaries + totalAllowances - totalDeductions;
    const employeeCount = employees.length;

    const avgSalaryPerEmployee =
      employeeCount > 0 ? netPayroll / employeeCount : 0;
    const avgBaseSalary =
      employeeCount > 0 ? totalBaseSalaries / employeeCount : 0;
    const avgAllowances =
      employeeCount > 0 ? totalAllowances / employeeCount : 0;
    const avgDeductions =
      employeeCount > 0 ? totalDeductions / employeeCount : 0;

    let monthGrowthRate: number | undefined;
    let previousMonthPayroll: number | undefined;
    let previousMonthEmployeeCount: number | undefined;

    if (filters.includeComparison !== false) {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;

      const prevPayslipWhere: any = {
        payPeriodMonth: prevMonth,
        payPeriodYear: prevYear,
      };
      const { startDate: prevStartDate, endDate: prevEndDate } =
        this.getPeriodBounds(prevMonth, prevYear);
      const prevSiteEmployeeIds = filters.siteId
        ? await resolveEmployeeIdsBySiteThroughProjects(
            this.prisma,
            filters.siteId,
            prevStartDate,
            prevEndDate,
          )
        : null;
      if (prevSiteEmployeeIds) {
        prevPayslipWhere.employeeId = { in: prevSiteEmployeeIds };
      }
      if (filters.departmentId) {
        prevPayslipWhere.employee = {};
        prevPayslipWhere.employee.departmentId = filters.departmentId;
      }

      const prevPayslipCount = await this.prisma.payslip.count({
        where: prevPayslipWhere,
      });

      if (prevPayslipCount > 0) {
        const prevAgg = await this.prisma.payslip.aggregate({
          where: prevPayslipWhere,
          _sum: { netSalary: true },
        });
        previousMonthPayroll = Number(prevAgg._sum.netSalary || 0);
        previousMonthEmployeeCount = prevPayslipCount;
      } else {
        previousMonthPayroll = await this.estimateNetPayroll(
          prevMonth,
          prevYear,
          filters,
        );
      }

      monthGrowthRate = this.baseReportService.calculatePercentage(
        netPayroll - (previousMonthPayroll || 0),
        previousMonthPayroll || 0,
      );
    }

    return {
      totalBaseSalaries,
      totalAllowances,
      totalDeductions,
      netPayroll,
      employeeCount,
      avgSalaryPerEmployee,
      avgBaseSalary,
      avgAllowances,
      avgDeductions,
      monthGrowthRate,
      previousMonthPayroll,
      previousMonthEmployeeCount,
      currency: 'SAR',
      month,
      year,
      generatedAt: new Date(),
    };
  }

  /**
   * Quick estimation of net payroll for a given month (for comparison only)
   */
  private async estimateNetPayroll(
    month: number,
    year: number,
    filters: PayrollOverviewFiltersDto,
  ): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const employeeWhere: any = {
      status: filters.employeeStatus || EmployeeStatus.ACTIVE,
      createdAt: { lte: endDate },
    };
    if (filters.departmentId) employeeWhere.departmentId = filters.departmentId;
    if (filters.siteId) {
      const siteEmployeeIds = await resolveEmployeeIdsBySiteThroughProjects(
        this.prisma,
        filters.siteId,
        startDate,
        endDate,
      );
      employeeWhere.id = { in: siteEmployeeIds };
    }

    const employees = await this.prisma.employee.findMany({
      where: employeeWhere,
      select: { id: true, baseSalary: true },
    });

    const employeeIds = employees.map((e) => e.id);
    let baseSalaries = 0;
    employees.forEach((emp) => {
      if (emp.baseSalary) baseSalaries += Number(emp.baseSalary);
    });

    const [allowancesAgg, deductionsAgg] = await Promise.all([
      this.prisma.employeeAllowance.aggregate({
        where: {
          employeeId: { in: employeeIds },
          status: 'APPROVED',
          effectiveFrom: { lte: endDate },
          AND: [
            {
              OR: [{ effectiveTo: null }, { effectiveTo: { gte: startDate } }],
            },
            {
              OR: [
                { frequency: 'MONTHLY' },
                {
                  AND: [
                    { frequency: 'ONE_TIME' },
                    { effectiveFrom: { gte: startDate, lte: endDate } },
                  ],
                },
              ],
            },
          ],
        },
        _sum: { amount: true },
      }),
      this.prisma.employeeDeduction.aggregate({
        where: {
          employeeId: { in: employeeIds },
          deductionDate: { gte: startDate, lte: endDate },
          status: DeductionStatus.APPROVED,
        },
        _sum: { amount: true },
      }),
    ]);

    return (
      baseSalaries +
      Number(allowancesAgg._sum?.amount || 0) -
      Number(deductionsAgg._sum.amount || 0)
    );
  }

  private getPeriodBounds(
    month: number,
    year: number,
  ): {
    startDate: Date;
    endDate: Date;
  } {
    return {
      startDate: new Date(year, month - 1, 1),
      endDate: new Date(year, month, 0, 23, 59, 59, 999),
    };
  }
}
