import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import {
  PayrollByDepartmentFiltersDto,
  PayrollByDepartmentResponseDto,
  DepartmentPayrollItemDto,
} from '../dto';
import { EmployeeStatus, DeductionStatus } from '@prisma/client';
import { resolveEmployeeIdsBySiteThroughProjects } from './payroll-scope.helper';

@Injectable()
export class GetPayrollByDepartmentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: PayrollByDepartmentFiltersDto,
  ): Promise<PayrollByDepartmentResponseDto> {
    const now = new Date();
    const month = filters.month || now.getMonth() + 1;
    const year = filters.year || now.getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const siteEmployeeIds = filters.siteId
      ? await resolveEmployeeIdsBySiteThroughProjects(
          this.prisma,
          filters.siteId,
          startDate,
          endDate,
        )
      : null;

    // Check if payroll has been processed for this period
    const payslipWhere: any = {
      payPeriodMonth: month,
      payPeriodYear: year,
      ...(siteEmployeeIds ? { employeeId: { in: siteEmployeeIds } } : {}),
    };

    const payslipCount = await this.prisma.payslip.count({
      where: payslipWhere,
    });

    if (payslipCount > 0) {
      return this.getFromPayslips(filters, month, year, payslipWhere);
    }

    return this.getFromEstimation(filters, month, year, siteEmployeeIds);
  }

  /**
   * Get department payroll from actual processed Payslip records
   */
  private async getFromPayslips(
    filters: PayrollByDepartmentFiltersDto,
    month: number,
    year: number,
    payslipWhere: any,
  ): Promise<PayrollByDepartmentResponseDto> {
    const payslips = await this.prisma.payslip.findMany({
      where: payslipWhere,
      select: {
        baseSalary: true,
        totalAllowances: true,
        totalDeductions: true,
        netSalary: true,
        employeeId: true,
        employee: {
          select: { department: { select: { nameEn: true, nameAr: true } } },
        },
      },
    });

    // Group by department
    const departmentMap = new Map<
      string,
      {
        totalBaseSalaries: number;
        totalAllowances: number;
        totalDeductions: number;
        netPayroll: number;
        employeeCount: number;
      }
    >();

    payslips.forEach((payslip) => {
      const dept = payslip.employee?.department?.nameEn || 'Unknown';
      const existing = departmentMap.get(dept) || {
        totalBaseSalaries: 0,
        totalAllowances: 0,
        totalDeductions: 0,
        netPayroll: 0,
        employeeCount: 0,
      };
      existing.totalBaseSalaries += Number(payslip.baseSalary || 0);
      existing.totalAllowances += Number(payslip.totalAllowances || 0);
      existing.totalDeductions += Number(payslip.totalDeductions || 0);
      existing.netPayroll += Number(payslip.netSalary || 0);
      existing.employeeCount += 1;
      departmentMap.set(dept, existing);
    });

    let totalPayroll = 0;
    let totalEmployees = 0;

    const departmentItems: DepartmentPayrollItemDto[] = Array.from(
      departmentMap.entries(),
    )
      .filter(([, data]) => data.employeeCount >= (filters.minEmployees || 0))
      .map(([deptName, data]) => {
        totalPayroll += data.netPayroll;
        totalEmployees += data.employeeCount;

        return {
          departmentId: deptName,
          departmentName: deptName,
          departmentNameAr: deptName,
          employeeCount: data.employeeCount,
          totalBaseSalaries: data.totalBaseSalaries,
          totalAllowances: data.totalAllowances,
          totalDeductions: data.totalDeductions,
          netPayroll: data.netPayroll,
          percentageOfTotal: 0,
          avgBaseSalary: data.totalBaseSalaries / data.employeeCount,
          avgAllowances: data.totalAllowances / data.employeeCount,
          avgDeductions: data.totalDeductions / data.employeeCount,
          avgSalaryPerEmployee: data.netPayroll / data.employeeCount,
        };
      });

    // Calculate percentages
    departmentItems.forEach((item) => {
      item.percentageOfTotal = this.baseReportService.calculatePercentage(
        item.netPayroll,
        totalPayroll,
      );
    });

    // Sort
    const sortBy = filters.sortBy || 'netPayroll';
    const sortOrder = filters.sortOrder || 'desc';
    departmentItems.sort((a, b) => {
      const aValue = a[sortBy] || 0;
      const bValue = b[sortBy] || 0;
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return {
      departments: departmentItems,
      totalPayroll,
      totalEmployees,
      currency: 'SAR',
      month,
      year,
      generatedAt: new Date(),
    };
  }

  /**
   * Estimate department payroll from Employee/Allowance/Deduction data
   * Used for months where payroll has not been processed yet
   */
  private async getFromEstimation(
    filters: PayrollByDepartmentFiltersDto,
    month: number,
    year: number,
    siteEmployeeIds: string[] | null,
  ): Promise<PayrollByDepartmentResponseDto> {
    const employeeStatus = filters.employeeStatus || EmployeeStatus.ACTIVE;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const employees = await this.prisma.employee.findMany({
      where: {
        status: employeeStatus,
        ...(siteEmployeeIds && { id: { in: siteEmployeeIds } }),
        departmentId: { not: null },
      },
      select: {
        id: true,
        department: { select: { nameEn: true, nameAr: true } },
        baseSalary: true,
      },
    });

    // Group employees by department
    const departmentMap = new Map<string, typeof employees>();
    employees.forEach((emp) => {
      if (emp.department?.nameEn) {
        const existing = departmentMap.get(emp.department.nameEn) || [];
        existing.push(emp);
        departmentMap.set(emp.department.nameEn, existing);
      }
    });

    const departments = Array.from(departmentMap.entries())
      .map(([deptName, emps]) => ({
        id: deptName,
        name: deptName,
        nameAr: emps[0]?.department?.nameAr || deptName,
        employees: emps,
      }))
      .filter((dept) => dept.employees.length >= (filters.minEmployees || 0));

    const employeeIds = employees.map((emp) => emp.id);

    const [allowancesMap, deductionsMap] = await Promise.all([
      this.getEmployeeAllowances(employeeIds, startDate, endDate),
      this.getEmployeeDeductions(employeeIds, startDate, endDate),
    ]);

    let totalPayroll = 0;
    let totalEmployees = 0;

    const departmentItems: DepartmentPayrollItemDto[] = departments.map(
      (dept) => {
        let totalBaseSalaries = 0;
        let totalAllowances = 0;
        let totalDeductions = 0;
        const employeeCount = dept.employees.length;

        dept.employees.forEach((employee) => {
          const baseSalary = employee.baseSalary
            ? Number(employee.baseSalary)
            : 0;
          const allowances = allowancesMap.get(employee.id) || 0;
          const deductions = deductionsMap.get(employee.id) || 0;

          totalBaseSalaries += baseSalary;
          totalAllowances += allowances;
          totalDeductions += deductions;
        });

        const netPayroll =
          totalBaseSalaries + totalAllowances - totalDeductions;

        totalPayroll += netPayroll;
        totalEmployees += employeeCount;

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          departmentNameAr: dept.nameAr,
          employeeCount,
          totalBaseSalaries,
          totalAllowances,
          totalDeductions,
          netPayroll,
          percentageOfTotal: 0,
          avgBaseSalary: totalBaseSalaries / employeeCount,
          avgAllowances: totalAllowances / employeeCount,
          avgDeductions: totalDeductions / employeeCount,
          avgSalaryPerEmployee: netPayroll / employeeCount,
        };
      },
    );

    departmentItems.forEach((item) => {
      item.percentageOfTotal = this.baseReportService.calculatePercentage(
        item.netPayroll,
        totalPayroll,
      );
    });

    const sortBy = filters.sortBy || 'netPayroll';
    const sortOrder = filters.sortOrder || 'desc';
    departmentItems.sort((a, b) => {
      const aValue = a[sortBy] || 0;
      const bValue = b[sortBy] || 0;
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return {
      departments: departmentItems,
      totalPayroll,
      totalEmployees,
      currency: 'SAR',
      month,
      year,
      generatedAt: new Date(),
    };
  }

  private async getEmployeeAllowances(
    employeeIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<Map<string, number>> {
    const allowances = await this.prisma.employeeAllowance.findMany({
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
      select: { employeeId: true, amount: true },
    });

    const map = new Map<string, number>();
    allowances.forEach((allowance) => {
      const current = map.get(allowance.employeeId) || 0;
      map.set(allowance.employeeId, current + Number(allowance.amount));
    });

    return map;
  }

  private async getEmployeeDeductions(
    employeeIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<Map<string, number>> {
    const deductions = await this.prisma.employeeDeduction.findMany({
      where: {
        employeeId: { in: employeeIds },
        deductionDate: { gte: startDate, lte: endDate },
        status: DeductionStatus.APPROVED,
      },
      select: { employeeId: true, amount: true },
    });

    const map = new Map<string, number>();
    deductions.forEach((deduction) => {
      const current = map.get(deduction.employeeId) || 0;
      map.set(deduction.employeeId, current + Number(deduction.amount));
    });

    return map;
  }
}
