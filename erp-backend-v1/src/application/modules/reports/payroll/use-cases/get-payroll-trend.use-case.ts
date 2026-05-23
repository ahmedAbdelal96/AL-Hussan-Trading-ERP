import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import {
  PayrollTrendFiltersDto,
  PayrollTrendResponseDto,
  MonthlyPayrollDataPointDto,
} from '../dto';
import { EmployeeStatus, DeductionStatus } from '@prisma/client';
import { resolveEmployeeIdsBySiteThroughProjects } from './payroll-scope.helper';

@Injectable()
export class GetPayrollTrendUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: PayrollTrendFiltersDto,
  ): Promise<PayrollTrendResponseDto> {
    const months = filters.months || 12;
    const now = new Date();
    const endMonth = now.getMonth() + 1;
    const endYear = now.getFullYear();

    const data: MonthlyPayrollDataPointDto[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(endYear, endMonth - 1 - i, 1);
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();

      const monthData = await this.getMonthlyPayroll(
        month,
        year,
        filters.departmentId,
        filters.siteId,
        filters.includeComponents,
      );

      data.push(monthData);
    }

    const totalPayroll = data.reduce((sum, d) => sum + d.netPayroll, 0);
    const avgMonthlyPayroll = totalPayroll / months;
    const highestPayroll = Math.max(...data.map((d) => d.netPayroll));
    const lowestPayroll = Math.min(...data.map((d) => d.netPayroll));

    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (data.length >= 2) {
      const firstHalf = data
        .slice(0, Math.floor(data.length / 2))
        .reduce((sum, d) => sum + d.netPayroll, 0);
      const secondHalf = data
        .slice(Math.floor(data.length / 2))
        .reduce((sum, d) => sum + d.netPayroll, 0);

      if (secondHalf > firstHalf * 1.05) trend = 'up';
      else if (secondHalf < firstHalf * 0.95) trend = 'down';
    }

    const overallGrowthRate =
      data.length >= 2
        ? this.baseReportService.calculatePercentage(
            data[data.length - 1].netPayroll - data[0].netPayroll,
            data[0].netPayroll,
          )
        : 0;

    return {
      data,
      totalPayroll,
      avgMonthlyPayroll,
      highestPayroll,
      lowestPayroll,
      trend,
      overallGrowthRate,
      currency: 'SAR',
      monthsCount: months,
      generatedAt: new Date(),
    };
  }

  private async getMonthlyPayroll(
    month: number,
    year: number,
    departmentId?: string,
    siteId?: string,
    includeComponents?: boolean,
  ): Promise<MonthlyPayrollDataPointDto> {
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const siteEmployeeIds = siteId
      ? await resolveEmployeeIdsBySiteThroughProjects(
          this.prisma,
          siteId,
          startDate,
          endDate,
        )
      : null;

    // Build payslip filter
    const payslipWhere: any = {
      payPeriodMonth: month,
      payPeriodYear: year,
      ...(siteEmployeeIds ? { employeeId: { in: siteEmployeeIds } } : {}),
    };
    if (departmentId) {
      payslipWhere.employee = {};
      if (departmentId) payslipWhere.employee.departmentId = departmentId;
    }

    const payslipCount = await this.prisma.payslip.count({
      where: payslipWhere,
    });

    if (payslipCount > 0) {
      // Use actual Payslip data
      const agg = await this.prisma.payslip.aggregate({
        where: payslipWhere,
        _sum: {
          baseSalary: true,
          totalAllowances: true,
          totalDeductions: true,
          netSalary: true,
        },
      });

      const totalBaseSalaries = Number(agg._sum.baseSalary || 0);
      const totalAllowances = Number(agg._sum.totalAllowances || 0);
      const totalDeductions = Number(agg._sum.totalDeductions || 0);
      const netPayroll = Number(agg._sum.netSalary || 0);

      return {
        month: monthStr,
        monthName: monthNames[month - 1],
        totalBaseSalaries: includeComponents ? totalBaseSalaries : 0,
        totalAllowances: includeComponents ? totalAllowances : 0,
        totalDeductions: includeComponents ? totalDeductions : 0,
        netPayroll,
        employeeCount: payslipCount,
        avgSalaryPerEmployee: payslipCount > 0 ? netPayroll / payslipCount : 0,
      };
    }

    // Estimation fallback
    const employees = await this.prisma.employee.findMany({
      where: {
        status: EmployeeStatus.ACTIVE,
        ...(departmentId && { departmentId }),
        ...(siteEmployeeIds && { id: { in: siteEmployeeIds } }),
      },
      select: { id: true, baseSalary: true },
    });

    const employeeIds = employees.map((emp) => emp.id);
    const totalBaseSalaries = employees.reduce(
      (sum, emp) => sum + (emp.baseSalary ? Number(emp.baseSalary) : 0),
      0,
    );

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

    const totalAllowances = Number(allowancesAgg._sum?.amount) || 0;
    const totalDeductions = Number(deductionsAgg._sum.amount) || 0;
    const netPayroll = totalBaseSalaries + totalAllowances - totalDeductions;

    return {
      month: monthStr,
      monthName: monthNames[month - 1],
      totalBaseSalaries: includeComponents ? totalBaseSalaries : 0,
      totalAllowances: includeComponents ? totalAllowances : 0,
      totalDeductions: includeComponents ? totalDeductions : 0,
      netPayroll,
      employeeCount: employees.length,
      avgSalaryPerEmployee:
        employees.length > 0 ? netPayroll / employees.length : 0,
    };
  }
}
