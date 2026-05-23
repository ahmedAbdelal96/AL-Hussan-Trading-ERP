/**
 * ============================================================================
 * GET STATUS DISTRIBUTION USE CASE
 * ============================================================================
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  StatusDistributionFiltersDto,
  StatusDistributionResponseDto,
  StatusItemDto,
  StatusTrendDto,
} from '../dto';
import { EmployeeStatus } from '@prisma/client';

@Injectable()
export class GetStatusDistributionUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: StatusDistributionFiltersDto,
  ): Promise<StatusDistributionResponseDto> {
    // Build where clause
    const where: any = {};

    if (filters.department) {
      where.department = filters.department;
    }

    if (filters.employmentType) {
      where.employmentType = filters.employmentType;
    }

    // Date filtering
    if (filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);

      where.hireDate = { lte: endDate };
      where.OR = [
        { terminationDate: null },
        { terminationDate: { gte: startDate } },
      ];
    }

    // Get all employees
    const employees = await this.prisma.employee.findMany({
      where,
      select: {
        id: true,
        status: true,
        gender: true,
        hireDate: true,
        terminationDate: true,
      },
    });

    // Status names (localization)
    const statusNames: Record<EmployeeStatus, { en: string; ar: string }> = {
      ACTIVE: { en: 'Active', ar: 'نشط' },
      INACTIVE: { en: 'Inactive', ar: 'غير نشط' },
      ON_LEAVE: { en: 'On Leave', ar: 'في إجازة' },
      SUSPENDED: { en: 'Suspended', ar: 'موقوف' },
      TERMINATED: { en: 'Terminated', ar: 'منتهي الخدمة' },
    };

    // Group by status
    const statusMap = new Map<
      EmployeeStatus,
      {
        count: number;
        maleCount: number;
        femaleCount: number;
        tenures: number[];
      }
    >();

    const now = new Date();

    employees.forEach((e) => {
      if (!statusMap.has(e.status)) {
        statusMap.set(e.status, {
          count: 0,
          maleCount: 0,
          femaleCount: 0,
          tenures: [],
        });
      }

      const statusData = statusMap.get(e.status)!;
      statusData.count++;

      if (e.gender === 'MALE') statusData.maleCount++;
      else if (e.gender === 'FEMALE') statusData.femaleCount++;

      // Calculate tenure
      const endDate = e.terminationDate ? new Date(e.terminationDate) : now;
      const hireDate = new Date(e.hireDate);
      const tenure =
        (endDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      statusData.tenures.push(tenure);
    });

    const totalEmployees = employees.length;

    // Build status breakdown
    const statusBreakdown: StatusItemDto[] = Array.from(
      statusMap.entries(),
    ).map(([status, data]) => {
      const avgTenure =
        data.tenures.length > 0
          ? data.tenures.reduce((sum, t) => sum + t, 0) / data.tenures.length
          : 0;

      return {
        status,
        statusName: statusNames[status].en,
        statusNameAr: statusNames[status].ar,
        employeeCount: data.count,
        percentage:
          totalEmployees > 0 ? (data.count / totalEmployees) * 100 : 0,
        maleCount: data.maleCount,
        femaleCount: data.femaleCount,
        avgTenure: parseFloat(avgTenure.toFixed(2)),
      };
    });

    // Sort status breakdown
    const sortBy = filters.sortBy || 'employeeCount';
    const sortOrder = filters.sortOrder || 'desc';

    statusBreakdown.sort((a, b) => {
      let valA: number | string;
      let valB: number | string;

      switch (sortBy) {
        case 'employeeCount':
          valA = a.employeeCount;
          valB = b.employeeCount;
          break;
        case 'percentage':
          valA = a.percentage;
          valB = b.percentage;
          break;
        case 'status':
        default:
          valA = a.status;
          valB = b.status;
          break;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortOrder === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });

    // Calculate percentages
    const activeCount = statusMap.get(EmployeeStatus.ACTIVE)?.count || 0;
    const inactiveCount = statusMap.get(EmployeeStatus.INACTIVE)?.count || 0;
    const onLeaveCount = statusMap.get(EmployeeStatus.ON_LEAVE)?.count || 0;

    const activePercentage =
      totalEmployees > 0 ? (activeCount / totalEmployees) * 100 : 0;
    const inactivePercentage =
      totalEmployees > 0 ? (inactiveCount / totalEmployees) * 100 : 0;
    const onLeavePercentage =
      totalEmployees > 0 ? (onLeaveCount / totalEmployees) * 100 : 0;

    // Availability rate (active employees)
    const availabilityRate = activePercentage;

    // HISTORICAL TREND (if requested)
    let historicalTrend: StatusTrendDto[] | undefined;

    if (filters.includeTrend) {
      const trendMonths = 12;
      historicalTrend = [];

      for (let i = trendMonths - 1; i >= 0; i--) {
        const trendDate = new Date();
        trendDate.setMonth(trendDate.getMonth() - i);
        const trendYear = trendDate.getFullYear();
        const trendMonth = trendDate.getMonth() + 1;

        const trendStartDate = new Date(trendYear, trendMonth - 1, 1);
        const trendEndDate = new Date(trendYear, trendMonth, 0, 23, 59, 59);

        const trendWhere: any = { ...where };
        trendWhere.hireDate = { lte: trendEndDate };
        trendWhere.OR = [
          { terminationDate: null },
          { terminationDate: { gte: trendStartDate } },
        ];

        const trendEmployees = await this.prisma.employee.findMany({
          where: trendWhere,
          select: {
            status: true,
          },
        });

        const trendActiveCount = trendEmployees.filter(
          (e) => e.status === EmployeeStatus.ACTIVE,
        ).length;
        const trendInactiveCount = trendEmployees.filter(
          (e) => e.status === EmployeeStatus.INACTIVE,
        ).length;
        const trendOnLeaveCount = trendEmployees.filter(
          (e) => e.status === EmployeeStatus.ON_LEAVE,
        ).length;
        const trendSuspendedCount = trendEmployees.filter(
          (e) => e.status === EmployeeStatus.SUSPENDED,
        ).length;

        historicalTrend.push({
          month: `${trendYear}-${String(trendMonth).padStart(2, '0')}`,
          activeCount: trendActiveCount,
          inactiveCount: trendInactiveCount,
          onLeaveCount: trendOnLeaveCount,
          suspendedCount: trendSuspendedCount,
          totalEmployees: trendEmployees.length,
        });
      }
    }

    return {
      statusBreakdown,
      historicalTrend,
      totalEmployees,
      activePercentage: parseFloat(activePercentage.toFixed(2)),
      inactivePercentage: parseFloat(inactivePercentage.toFixed(2)),
      onLeavePercentage: parseFloat(onLeavePercentage.toFixed(2)),
      availabilityRate: parseFloat(availabilityRate.toFixed(2)),
      month: filters.month || undefined,
      year: filters.year || undefined,
      generatedAt: new Date(),
    };
  }
}
