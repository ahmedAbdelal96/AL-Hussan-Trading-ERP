/**
 * ============================================================================
 * GET EMPLOYEES OVERVIEW USE CASE
 * ============================================================================
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  EmployeesOverviewFiltersDto,
  EmployeesOverviewResponseDto,
  PreviousPeriodDataDto,
  GrowthRateDto,
  SimpleDepartmentBreakdownDto,
} from '../dto';
import { EmployeeStatus } from '@prisma/client';

@Injectable()
export class GetEmployeesOverviewUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: EmployeesOverviewFiltersDto,
  ): Promise<EmployeesOverviewResponseDto> {
    // Build where clause
    const where: Record<string, unknown> = {};

    if (filters.department) {
      where.department = filters.department;
    }

    if (filters.employmentType) {
      where.employmentType = filters.employmentType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    // Date filtering (employees hired before/during period)
    if (filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);

      // Employees who were hired before period ended
      where.hireDate = {
        lte: endDate,
      };

      // Exclude terminated employees who left before period started
      where.OR = [
        { terminationDate: null },
        { terminationDate: { gte: startDate } },
      ];
    }

    // Get all employees matching filters
    const employees = await this.prisma.employee.findMany({
      where,
      select: {
        id: true,
        status: true,
        gender: true,
        hireDate: true,
        terminationDate: true,
        department: { select: { nameAr: true, nameEn: true } },
      },
    });

    const totalEmployees = employees.length;

    // Count by status
    const activeEmployees = employees.filter(
      (e) => e.status === EmployeeStatus.ACTIVE,
    ).length;
    const inactiveEmployees = employees.filter(
      (e) => e.status === EmployeeStatus.INACTIVE,
    ).length;
    const onLeaveEmployees = employees.filter(
      (e) => e.status === EmployeeStatus.ON_LEAVE,
    ).length;
    const suspendedEmployees = employees.filter(
      (e) => e.status === EmployeeStatus.SUSPENDED,
    ).length;

    // Gender counts
    const maleCount = employees.filter((e) => e.gender === 'MALE').length;
    const femaleCount = employees.filter((e) => e.gender === 'FEMALE').length;
    const genderDiversityRatio =
      totalEmployees > 0
        ? Math.min(maleCount, femaleCount) / totalEmployees
        : 0;

    // Calculate hiring metrics for the period
    let newHires = 0;
    let terminations = 0;
    let employeesInProbation = 0;

    if (filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);

      // New hires in this period
      newHires = employees.filter((e) => {
        const hireDate = new Date(e.hireDate);
        return hireDate >= startDate && hireDate <= endDate;
      }).length;

      // Terminations in this period
      terminations = employees.filter((e) => {
        if (!e.terminationDate) return false;
        const termDate = new Date(e.terminationDate);
        return termDate >= startDate && termDate <= endDate;
      }).length;

      // Probation: hired within last 90 days
      const probationDate = new Date(endDate);
      probationDate.setDate(probationDate.getDate() - 90);
      employeesInProbation = employees.filter((e) => {
        const hireDate = new Date(e.hireDate);
        return hireDate >= probationDate && hireDate <= endDate;
      }).length;
    }

    const netChange = newHires - terminations;
    const turnoverRate =
      totalEmployees > 0 ? (terminations / totalEmployees) * 100 : 0;

    // Calculate average tenure
    const now = new Date();
    let totalTenureDays = 0;
    employees.forEach((e) => {
      const endDate = e.terminationDate ? new Date(e.terminationDate) : now;
      const startDate = new Date(e.hireDate);
      const tenureDays = Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      totalTenureDays += tenureDays;
    });
    const avgTenure =
      totalEmployees > 0 ? totalTenureDays / totalEmployees / 365 : 0;

    // Optional: Department breakdown
    let departmentBreakdown: SimpleDepartmentBreakdownDto[] | undefined;
    if (filters.includeDepartmentBreakdown) {
      const deptMap = new Map<string, number>();
      employees.forEach((e) => {
        const dept = e.department?.nameAr || e.department?.nameEn || 'غير محدد';
        deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
      });

      departmentBreakdown = Array.from(deptMap.entries()).map(
        ([department, employeeCount]) => ({
          department,
          employeeCount,
          percentage:
            totalEmployees > 0 ? (employeeCount / totalEmployees) * 100 : 0,
        }),
      );
    }

    // Optional: Previous period comparison
    let previousPeriod: PreviousPeriodDataDto | undefined;
    let growthRate: GrowthRateDto | undefined;

    if (filters.includeComparison && filters.month && filters.year) {
      const prevMonth = filters.month === 1 ? 12 : filters.month - 1;
      const prevYear = filters.month === 1 ? filters.year - 1 : filters.year;

      const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
      const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59);

      const prevWhere: Record<string, unknown> = { ...where };
      prevWhere.hireDate = { lte: prevEndDate };
      prevWhere.OR = [
        { terminationDate: null },
        { terminationDate: { gte: prevStartDate } },
      ];

      const prevEmployees = await this.prisma.employee.findMany({
        where: prevWhere,
        select: {
          id: true,
          status: true,
          hireDate: true,
          terminationDate: true,
        },
      });

      const prevTotalEmployees = prevEmployees.length;
      const prevActiveEmployees = prevEmployees.filter(
        (e) => e.status === EmployeeStatus.ACTIVE,
      ).length;

      const prevNewHires = prevEmployees.filter((e) => {
        const hireDate = new Date(e.hireDate);
        return hireDate >= prevStartDate && hireDate <= prevEndDate;
      }).length;

      const prevTerminations = prevEmployees.filter((e) => {
        if (!e.terminationDate) return false;
        const termDate = new Date(e.terminationDate);
        return termDate >= prevStartDate && termDate <= prevEndDate;
      }).length;

      let prevTotalTenureDays = 0;
      prevEmployees.forEach((e) => {
        const endDate = e.terminationDate
          ? new Date(e.terminationDate)
          : prevEndDate;
        const startDate = new Date(e.hireDate);
        const tenureDays = Math.floor(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        prevTotalTenureDays += tenureDays;
      });
      const prevAvgTenure =
        prevTotalEmployees > 0
          ? prevTotalTenureDays / prevTotalEmployees / 365
          : 0;

      previousPeriod = {
        totalEmployees: prevTotalEmployees,
        activeEmployees: prevActiveEmployees,
        newHires: prevNewHires,
        terminations: prevTerminations,
        avgTenure: parseFloat(prevAvgTenure.toFixed(2)),
      };

      // Calculate growth rates
      const calcGrowth = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      growthRate = {
        totalEmployeesGrowth: parseFloat(
          calcGrowth(totalEmployees, prevTotalEmployees).toFixed(2),
        ),
        activeEmployeesGrowth: parseFloat(
          calcGrowth(activeEmployees, prevActiveEmployees).toFixed(2),
        ),
        newHiresChange: parseFloat(
          calcGrowth(newHires, prevNewHires).toFixed(2),
        ),
        terminationsChange: parseFloat(
          calcGrowth(terminations, prevTerminations).toFixed(2),
        ),
      };
    }

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      onLeaveEmployees,
      suspendedEmployees,
      newHires,
      terminations,
      netChange,
      turnoverRate: parseFloat(turnoverRate.toFixed(2)),
      avgTenure: parseFloat(avgTenure.toFixed(2)),
      employeesInProbation,
      maleCount,
      femaleCount,
      genderDiversityRatio: parseFloat(genderDiversityRatio.toFixed(2)),
      previousPeriod,
      growthRate,
      departmentBreakdown,
      month: filters.month || undefined,
      year: filters.year || undefined,
      generatedAt: new Date(),
    };
  }
}
