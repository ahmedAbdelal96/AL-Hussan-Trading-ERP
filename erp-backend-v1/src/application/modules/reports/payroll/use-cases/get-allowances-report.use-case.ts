import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import {
  AllowancesReportFiltersDto,
  AllowancesReportResponseDto,
  AllowanceSummaryItemDto,
  AllowancesByFrequencyDto,
} from '../dto';
import { EmployeeStatus } from '@prisma/client';
import { resolveEmployeeIdsBySiteThroughProjects } from './payroll-scope.helper';

@Injectable()
export class GetAllowancesReportUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: AllowancesReportFiltersDto,
  ): Promise<AllowancesReportResponseDto> {
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
      select: { id: true },
    });

    const employeeIds = employees.map((emp) => emp.id);

    const allowances = await this.prisma.employeeAllowance.findMany({
      where: {
        employeeId: { in: employeeIds },
        ...(filters.allowanceTypeId && {
          allowanceTypeId: filters.allowanceTypeId,
        }),
        ...(filters.isActive !== undefined && {
          isActive: filters.isActive,
        }),
        effectiveFrom: { lte: endDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: startDate } }],
      },
      include: {
        allowanceType: true,
      },
    });

    const totalAmount = allowances.reduce(
      (sum, a) => sum + Number(a.amount),
      0,
    );
    const activeCount = allowances.filter(
      (a) => a.status === 'APPROVED',
    ).length;
    const inactiveCount = allowances.filter(
      (a) => a.status !== 'APPROVED',
    ).length;
    const pendingCount = 0; // If you have pending status

    // Group by allowance type
    const typeMap = new Map<
      string,
      {
        type: any;
        total: number;
        active: number;
        inactive: number;
        amounts: number[];
      }
    >();

    allowances.forEach((allowance) => {
      const typeId = allowance.allowanceTypeId;
      const existing = typeMap.get(typeId) || {
        type: allowance.allowanceType,
        total: 0,
        active: 0,
        inactive: 0,
        amounts: [],
      };
      existing.total += Number(allowance.amount);
      existing.active += allowance.status === 'APPROVED' ? 1 : 0;
      existing.inactive += allowance.status !== 'APPROVED' ? 1 : 0;
      existing.amounts.push(Number(allowance.amount));
      typeMap.set(typeId, existing);
    });

    const byAllowanceType: AllowanceSummaryItemDto[] = Array.from(
      typeMap.entries(),
    ).map(([typeId, data]) => ({
      allowanceTypeId: typeId,
      allowanceTypeName: data.type.name,
      allowanceTypeNameAr: data.type.nameAr,
      totalMonthlyAmount: data.total,
      activeCount: data.active,
      inactiveCount: data.inactive,
      pendingCount: 0,
      avgAmount: data.total / (data.active + data.inactive),
      minAmount: Math.min(...data.amounts),
      maxAmount: Math.max(...data.amounts),
      percentageOfTotal: this.baseReportService.calculatePercentage(
        data.total,
        totalAmount,
      ),
    }));

    // Group by frequency
    const frequencyMap = new Map<string, { total: number; count: number }>();
    allowances.forEach((allowance) => {
      const freq = allowance.frequency;
      const existing = frequencyMap.get(freq) || { total: 0, count: 0 };
      existing.total += Number(allowance.amount);
      existing.count += 1;
      frequencyMap.set(freq, existing);
    });

    const byFrequency: AllowancesByFrequencyDto[] = Array.from(
      frequencyMap.entries(),
    ).map(([frequency, data]) => ({
      frequency: frequency as any,
      totalAmount: data.total,
      count: data.count,
      percentageOfTotal: this.baseReportService.calculatePercentage(
        data.total,
        totalAmount,
      ),
    }));

    return {
      totalAmount,
      totalActive: activeCount,
      totalInactive: inactiveCount,
      totalPending: pendingCount,
      byAllowanceType,
      byFrequency,
      currency: 'SAR',
      month,
      year,
      generatedAt: new Date(),
    };
  }
}
