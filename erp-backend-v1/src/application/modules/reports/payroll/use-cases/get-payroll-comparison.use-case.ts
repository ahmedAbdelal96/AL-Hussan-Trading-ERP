import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import {
  PayrollComparisonFiltersDto,
  PayrollComparisonResponseDto,
  PeriodPayrollDataDto,
  PayrollVarianceDto,
  EmployeeChangesDto,
} from '../dto';
import { EmployeeStatus, DeductionStatus } from '@prisma/client';
import { resolveEmployeeIdsBySiteThroughProjects } from './payroll-scope.helper';

@Injectable()
export class GetPayrollComparisonUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: PayrollComparisonFiltersDto,
  ): Promise<PayrollComparisonResponseDto> {
    const { month1, year1, month2, year2 } =
      this.resolveComparisonPeriods(filters);

    const [period1, period2] = await Promise.all([
      this.getPeriodData(month1, year1, filters.departmentId, filters.siteId),
      this.getPeriodData(month2, year2, filters.departmentId, filters.siteId),
    ]);

    const variance: PayrollVarianceDto = {
      baseSalariesDiff: period2.totalBaseSalaries - period1.totalBaseSalaries,
      baseSalariesChangePercent: this.baseReportService.calculatePercentage(
        period2.totalBaseSalaries - period1.totalBaseSalaries,
        period1.totalBaseSalaries,
      ),
      allowancesDiff: period2.totalAllowances - period1.totalAllowances,
      allowancesChangePercent: this.baseReportService.calculatePercentage(
        period2.totalAllowances - period1.totalAllowances,
        period1.totalAllowances,
      ),
      deductionsDiff: period2.totalDeductions - period1.totalDeductions,
      deductionsChangePercent: this.baseReportService.calculatePercentage(
        period2.totalDeductions - period1.totalDeductions,
        period1.totalDeductions,
      ),
      netPayrollDiff: period2.netPayroll - period1.netPayroll,
      netPayrollChangePercent: this.baseReportService.calculatePercentage(
        period2.netPayroll - period1.netPayroll,
        period1.netPayroll,
      ),
      employeeCountDiff: period2.employeeCount - period1.employeeCount,
      employeeCountChangePercent: this.baseReportService.calculatePercentage(
        period2.employeeCount - period1.employeeCount,
        period1.employeeCount,
      ),
    };

    let employeeChanges: EmployeeChangesDto | undefined;
    if (filters.includeEmployeeChanges) {
      employeeChanges = {
        newHires: Math.max(0, period2.employeeCount - period1.employeeCount),
        resignations: Math.max(
          0,
          period1.employeeCount - period2.employeeCount,
        ),
        netChange: period2.employeeCount - period1.employeeCount,
        salaryIncreasesCount: 0,
        salaryDecreasesCount: 0,
      };
    }

    return {
      period1,
      period2,
      variance,
      employeeChanges,
      currency: 'SAR',
      generatedAt: new Date(),
    };
  }

  private resolveComparisonPeriods(filters: PayrollComparisonFiltersDto): {
    month1: number;
    year1: number;
    month2: number;
    year2: number;
  } {
    const hasAnyPeriodInput =
      filters.month1 !== undefined ||
      filters.year1 !== undefined ||
      filters.month2 !== undefined ||
      filters.year2 !== undefined;

    const hasAllPeriodInput =
      filters.month1 !== undefined &&
      filters.year1 !== undefined &&
      filters.month2 !== undefined &&
      filters.year2 !== undefined;

    if (hasAnyPeriodInput && !hasAllPeriodInput) {
      throw new BadRequestException(
        'When using custom comparison period, month1/year1/month2/year2 are all required.',
      );
    }

    if (hasAllPeriodInput) {
      return {
        month1: filters.month1!,
        year1: filters.year1!,
        month2: filters.month2!,
        year2: filters.year2!,
      };
    }

    // Default behavior: compare current month against previous month.
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
    const previousMonth = prevMonthDate.getMonth() + 1;
    const previousYear = prevMonthDate.getFullYear();

    return {
      month1: previousMonth,
      year1: previousYear,
      month2: currentMonth,
      year2: currentYear,
    };
  }

  private async getPeriodData(
    month: number,
    year: number,
    departmentId?: string,
    siteId?: string,
  ): Promise<PeriodPayrollDataDto> {
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
      // Use actual Payslip data for this period
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
        month,
        year,
        periodLabel: `${monthNames[month - 1]} ${year}`,
        totalBaseSalaries,
        totalAllowances,
        totalDeductions,
        netPayroll,
        employeeCount: payslipCount,
        avgSalaryPerEmployee: payslipCount > 0 ? netPayroll / payslipCount : 0,
      };
    }

    // Estimation fallback for months without processed payroll
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
      month,
      year,
      periodLabel: `${monthNames[month - 1]} ${year}`,
      totalBaseSalaries,
      totalAllowances,
      totalDeductions,
      netPayroll,
      employeeCount: employees.length,
      avgSalaryPerEmployee:
        employees.length > 0 ? netPayroll / employees.length : 0,
    };
  }
}
