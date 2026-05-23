import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import {
  PayrollBySiteFiltersDto,
  PayrollBySiteResponseDto,
  SitePayrollItemDto,
} from '../dto';
import { EmployeeStatus } from '@prisma/client';

type SiteShare = {
  siteId: string;
  siteName: string;
  siteCode: string;
  percentage: number;
};

type EmployeeBreakdown = {
  baseSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
};

@Injectable()
export class GetPayrollBySiteUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: PayrollBySiteFiltersDto,
  ): Promise<PayrollBySiteResponseDto> {
    const now = new Date();
    const month = filters.month || now.getMonth() + 1;
    const year = filters.year || now.getFullYear();
    const employeeStatus = filters.employeeStatus || EmployeeStatus.ACTIVE;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const distribution = await this.buildEmployeeSiteDistribution(
      startDate,
      endDate,
      filters.siteId,
    );
    const employeeIds = Array.from(distribution.keys());

    if (employeeIds.length === 0) {
      return {
        sites: [],
        totalPayroll: 0,
        totalEmployees: 0,
        currency: 'SAR',
        month,
        year,
        generatedAt: new Date(),
      };
    }

    const breakdownByEmployee = await this.getEmployeeBreakdowns(
      employeeIds,
      month,
      year,
      startDate,
      endDate,
      employeeStatus,
      filters.departmentId,
    );

    const siteAccumulator = new Map<
      string,
      SitePayrollItemDto & { _employees: Set<string> }
    >();

    for (const [employeeId, shares] of distribution.entries()) {
      const employeeBreakdown = breakdownByEmployee.get(employeeId);
      if (!employeeBreakdown) continue;

      const totalPct = shares.reduce((sum, s) => sum + s.percentage, 0);
      if (totalPct <= 0) continue;

      // Keep behavior aligned with payroll processing: normalize active shares to 100%.
      for (const share of shares) {
        const ratio = share.percentage / totalPct;
        const current = siteAccumulator.get(share.siteId) || {
          siteId: share.siteId,
          siteName: share.siteName,
          siteNameAr: share.siteName,
          siteCode: share.siteCode,
          employeeCount: 0,
          totalBaseSalaries: 0,
          totalAllowances: 0,
          totalDeductions: 0,
          netPayroll: 0,
          percentageOfTotal: 0,
          avgSalaryPerEmployee: 0,
          avgBaseSalary: 0,
          avgAllowances: 0,
          avgDeductions: 0,
          _employees: new Set<string>(),
        };

        current.totalBaseSalaries += employeeBreakdown.baseSalary * ratio;
        current.totalAllowances += employeeBreakdown.totalAllowances * ratio;
        current.totalDeductions += employeeBreakdown.totalDeductions * ratio;
        current.netPayroll += employeeBreakdown.netSalary * ratio;
        current._employees.add(employeeId);

        siteAccumulator.set(share.siteId, current);
      }
    }

    const items = Array.from(siteAccumulator.values())
      .map((site) => {
        const employeeCount = site._employees.size;
        return {
          siteId: site.siteId,
          siteName: site.siteName,
          siteNameAr: site.siteNameAr,
          siteCode: site.siteCode,
          employeeCount,
          totalBaseSalaries: Number(site.totalBaseSalaries.toFixed(2)),
          totalAllowances: Number(site.totalAllowances.toFixed(2)),
          totalDeductions: Number(site.totalDeductions.toFixed(2)),
          netPayroll: Number(site.netPayroll.toFixed(2)),
          percentageOfTotal: 0,
          avgSalaryPerEmployee:
            employeeCount > 0
              ? Number((site.netPayroll / employeeCount).toFixed(2))
              : 0,
          avgBaseSalary:
            employeeCount > 0
              ? Number((site.totalBaseSalaries / employeeCount).toFixed(2))
              : 0,
          avgAllowances:
            employeeCount > 0
              ? Number((site.totalAllowances / employeeCount).toFixed(2))
              : 0,
          avgDeductions:
            employeeCount > 0
              ? Number((site.totalDeductions / employeeCount).toFixed(2))
              : 0,
        } as SitePayrollItemDto;
      })
      .filter((s) => s.employeeCount >= (filters.minEmployees || 0));

    const totalPayroll = items.reduce((sum, s) => sum + s.netPayroll, 0);
    const totalEmployees = new Set(
      Array.from(siteAccumulator.values()).flatMap((s) =>
        Array.from(s._employees),
      ),
    ).size;

    items.forEach((item) => {
      item.percentageOfTotal = this.baseReportService.calculatePercentage(
        item.netPayroll,
        totalPayroll,
      );
    });

    const sortBy = filters.sortBy || 'totalPayroll';
    const sortOrder = filters.sortOrder || 'desc';
    items.sort((a, b) => {
      const aValue =
        sortBy === 'employeeCount'
          ? a.employeeCount
          : sortBy === 'avgSalary'
            ? a.avgSalaryPerEmployee
            : a.netPayroll;
      const bValue =
        sortBy === 'employeeCount'
          ? b.employeeCount
          : sortBy === 'avgSalary'
            ? b.avgSalaryPerEmployee
            : b.netPayroll;
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return {
      sites: items,
      totalPayroll: Number(totalPayroll.toFixed(2)),
      totalEmployees,
      currency: 'SAR',
      month,
      year,
      generatedAt: new Date(),
    };
  }

  private async buildEmployeeSiteDistribution(
    startDate: Date,
    endDate: Date,
    siteId?: string,
  ): Promise<Map<string, SiteShare[]>> {
    const assignments = await this.prisma.projectEmployee.findMany({
      where: {
        percentage: { not: null },
        assignedDate: { lte: endDate },
        OR: [{ endDate: null }, { endDate: { gte: startDate } }],
        project: {
          deletedAt: null,
          siteId: { not: null },
          ...(siteId && { siteId }),
        },
      },
      select: {
        employeeId: true,
        percentage: true,
        project: {
          select: {
            site: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    const byEmployee = new Map<string, Map<string, SiteShare>>();
    for (const assignment of assignments) {
      const site = assignment.project.site;
      if (!site) continue;

      const employeeMap =
        byEmployee.get(assignment.employeeId) || new Map<string, SiteShare>();
      const existing = employeeMap.get(site.id) || {
        siteId: site.id,
        siteName: site.name,
        siteCode: site.code,
        percentage: 0,
      };
      existing.percentage += Number(assignment.percentage || 0);
      employeeMap.set(site.id, existing);
      byEmployee.set(assignment.employeeId, employeeMap);
    }

    const result = new Map<string, SiteShare[]>();
    for (const [employeeId, siteMap] of byEmployee.entries()) {
      result.set(employeeId, Array.from(siteMap.values()));
    }
    return result;
  }

  private async getEmployeeBreakdowns(
    employeeIds: string[],
    month: number,
    year: number,
    startDate: Date,
    endDate: Date,
    employeeStatus: EmployeeStatus,
    departmentId?: string,
  ): Promise<Map<string, EmployeeBreakdown>> {
    const payslips = await this.prisma.payslip.findMany({
      where: {
        payPeriodMonth: month,
        payPeriodYear: year,
        employeeId: { in: employeeIds },
        employee: {
          status: employeeStatus,
          deletedAt: null,
          ...(departmentId && { departmentId }),
        },
      },
      select: {
        employeeId: true,
        baseSalary: true,
        totalAllowances: true,
        totalDeductions: true,
        netSalary: true,
      },
    });

    if (payslips.length > 0) {
      const fromPayslips = new Map<string, EmployeeBreakdown>();
      for (const p of payslips) {
        fromPayslips.set(p.employeeId, {
          baseSalary: Number(p.baseSalary || 0),
          totalAllowances: Number(p.totalAllowances || 0),
          totalDeductions: Number(p.totalDeductions || 0),
          netSalary: Number(p.netSalary || 0),
        });
      }
      return fromPayslips;
    }

    const employees = await this.prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
        status: employeeStatus,
        deletedAt: null,
        ...(departmentId && { departmentId }),
      },
      select: {
        id: true,
        baseSalary: true,
      },
    });

    const filteredEmployeeIds = employees.map((e) => e.id);

    const [allowances, deductions] = await Promise.all([
      this.prisma.employeeAllowance.findMany({
        where: {
          employeeId: { in: filteredEmployeeIds },
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
        select: { employeeId: true, amount: true },
      }),
      this.prisma.employeeDeduction.findMany({
        where: {
          employeeId: { in: filteredEmployeeIds },
          status: 'APPROVED',
          deductionDate: { gte: startDate, lte: endDate },
        },
        select: { employeeId: true, amount: true },
      }),
    ]);

    const allowanceMap = new Map<string, number>();
    for (const allowance of allowances) {
      allowanceMap.set(
        allowance.employeeId,
        (allowanceMap.get(allowance.employeeId) || 0) +
          Number(allowance.amount || 0),
      );
    }

    const deductionMap = new Map<string, number>();
    for (const deduction of deductions) {
      deductionMap.set(
        deduction.employeeId,
        (deductionMap.get(deduction.employeeId) || 0) +
          Number(deduction.amount || 0),
      );
    }

    const result = new Map<string, EmployeeBreakdown>();
    for (const employee of employees) {
      const baseSalary = Number(employee.baseSalary || 0);
      const totalAllowances = allowanceMap.get(employee.id) || 0;
      const totalDeductions = deductionMap.get(employee.id) || 0;
      result.set(employee.id, {
        baseSalary,
        totalAllowances,
        totalDeductions,
        netSalary: baseSalary + totalAllowances - totalDeductions,
      });
    }
    return result;
  }
}
