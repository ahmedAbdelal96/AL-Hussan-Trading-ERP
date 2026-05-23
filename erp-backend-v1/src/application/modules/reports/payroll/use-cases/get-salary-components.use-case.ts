import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import {
  SalaryComponentsFiltersDto,
  SalaryComponentsResponseDto,
  AllowanceTypeBreakdownDto,
  DeductionTypeBreakdownDto,
} from '../dto';
import { EmployeeStatus, DeductionStatus } from '@prisma/client';
import { resolveEmployeeIdsBySiteThroughProjects } from './payroll-scope.helper';

@Injectable()
export class GetSalaryComponentsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: SalaryComponentsFiltersDto,
  ): Promise<SalaryComponentsResponseDto> {
    const now = new Date();
    const month = filters.month || now.getMonth() + 1;
    const year = filters.year || now.getFullYear();
    const employeeStatus = filters.employeeStatus || EmployeeStatus.ACTIVE;

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

    const employees = await this.prisma.employee.findMany({
      where: {
        status: employeeStatus,
        ...(filters.departmentId && { departmentId: filters.departmentId }),
        ...(siteEmployeeIds && { id: { in: siteEmployeeIds } }),
      },
      select: {
        id: true,
        baseSalary: true,
      },
    });

    const employeeIds = employees.map((emp) => emp.id);
    const totalBaseSalaries = employees.reduce(
      (sum, emp) => sum + (emp.baseSalary ? Number(emp.baseSalary) : 0),
      0,
    );

    // Get allowances by type
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
      include: {
        allowanceType: true,
      },
    });

    // Get deductions by type
    const deductions = await this.prisma.employeeDeduction.findMany({
      where: {
        employeeId: { in: employeeIds },
        deductionDate: { gte: startDate, lte: endDate },
        status: DeductionStatus.APPROVED,
      },
    });

    const totalAllowances = allowances.reduce(
      (sum, a) => sum + Number(a.amount),
      0,
    );
    const totalDeductions = deductions.reduce(
      (sum, d) => sum + Number(d.amount),
      0,
    );
    const netPayroll = totalBaseSalaries + totalAllowances - totalDeductions;

    // Group allowances by type
    const allowanceTypesMap = new Map<
      string,
      { type: any; total: number; count: number }
    >();
    allowances.forEach((allowance) => {
      const typeId = allowance.allowanceTypeId;
      const typeName = allowance.allowanceType?.name || 'Unknown';
      const existing = allowanceTypesMap.get(typeId) || {
        type: { id: typeId, name: typeName },
        total: 0,
        count: 0,
      };
      existing.total += Number(allowance.amount);
      existing.count += 1;
      allowanceTypesMap.set(typeId, existing);
    });

    const allowanceTypes: AllowanceTypeBreakdownDto[] = Array.from(
      allowanceTypesMap.entries(),
    ).map(([typeId, data]) => ({
      allowanceTypeId: typeId,
      allowanceTypeName: data.type.name,
      allowanceTypeNameAr: data.type.nameAr,
      totalAmount: data.total,
      employeeCount: data.count,
      percentageOfTotal: this.baseReportService.calculatePercentage(
        data.total,
        totalAllowances,
      ),
      avgPerEmployee: data.total / data.count,
    }));

    // Group deductions by type
    const deductionTypesMap = new Map<
      string,
      { total: number; count: number }
    >();
    deductions.forEach((deduction) => {
      const type = deduction.deductionType;
      const existing = deductionTypesMap.get(type) || {
        total: 0,
        count: 0,
      };
      existing.total += Number(deduction.amount);
      existing.count += 1;
      deductionTypesMap.set(type, existing);
    });

    const deductionTypes: DeductionTypeBreakdownDto[] = Array.from(
      deductionTypesMap.entries(),
    ).map(([type, data]) => ({
      deductionType: type as any,
      deductionTypeName: this.getDeductionTypeName(type),
      displayName: this.getDeductionTypeName(type),
      totalAmount: data.total,
      employeeCount: data.count,
      percentageOfTotal: this.baseReportService.calculatePercentage(
        data.total,
        totalDeductions,
      ),
      avgPerEmployee: data.total / data.count,
    }));

    return {
      totalBaseSalaries,
      totalAllowances,
      totalDeductions,
      netPayroll,
      baseSalariesPercentage: this.baseReportService.calculatePercentage(
        totalBaseSalaries,
        netPayroll,
      ),
      allowancesPercentage: this.baseReportService.calculatePercentage(
        totalAllowances,
        netPayroll,
      ),
      deductionsPercentage: this.baseReportService.calculatePercentage(
        totalDeductions,
        totalBaseSalaries + totalAllowances,
      ),
      allowanceTypes: filters.includeAllowanceTypes ? allowanceTypes : [],
      deductionTypes: filters.includeDeductionTypes ? deductionTypes : [],
      currency: 'SAR',
      month,
      year,
      generatedAt: new Date(),
    };
  }

  private getDeductionTypeName(type: string): string {
    const names: Record<string, string> = {
      LOAN_REPAYMENT: 'Loan Repayment',
      INSURANCE: 'Insurance',
      TAX: 'Tax',
      PENALTY: 'Penalty',
      ADVANCE_DEDUCTION: 'Advance Deduction',
      ABSENCE: 'Absence',
      OTHER: 'Other',
    };
    return names[type] || type;
  }
}
