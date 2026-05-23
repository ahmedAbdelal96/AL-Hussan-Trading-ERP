/**
 * ============================================================================
 * GET TURNOVER ANALYSIS USE CASE
 * ============================================================================
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  TurnoverAnalysisFiltersDto,
  TurnoverAnalysisResponseDto,
  MonthlyTurnoverDto,
  TerminationReasonDto,
  DepartmentTurnoverDto,
} from '../dto';

@Injectable()
export class GetTurnoverAnalysisUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: TurnoverAnalysisFiltersDto,
  ): Promise<TurnoverAnalysisResponseDto> {
    const periodMonths = filters.months || 12;

    // Calculate date range
    const endYear = filters.year || new Date().getFullYear();
    const endMonth = filters.month || new Date().getMonth() + 1;
    const endDate = new Date(endYear, endMonth, 0, 23, 59, 59);

    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - periodMonths + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Build where clause
    const where: any = {};

    if (filters.department) {
      where.departmentId = filters.department;
    }

    if (filters.employmentType) {
      where.employmentType = filters.employmentType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    // Get all employees
    const employees = await this.prisma.employee.findMany({
      where,
      select: {
        id: true,
        hireDate: true,
        terminationDate: true,
        terminationReason: true,
        department: { select: { nameEn: true } },
      },
    });

    // MONTHLY TREND
    const monthlyTrend: MonthlyTurnoverDto[] = [];
    let totalNewHires = 0;
    let totalTerminations = 0;

    for (let i = 0; i < periodMonths; i++) {
      const monthStart = new Date(startDate);
      monthStart.setMonth(monthStart.getMonth() + i);
      const monthEnd = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      // Employees hired in this month
      const newHires = employees.filter((e) => {
        const hireDate = new Date(e.hireDate);
        return hireDate >= monthStart && hireDate <= monthEnd;
      }).length;

      // Employees terminated in this month
      const terminations = employees.filter((e) => {
        if (!e.terminationDate) return false;
        const termDate = new Date(e.terminationDate);
        return termDate >= monthStart && termDate <= monthEnd;
      }).length;

      // Total employees at end of month
      const totalEmployees = employees.filter((e) => {
        const hireDate = new Date(e.hireDate);
        if (hireDate > monthEnd) return false;

        if (e.terminationDate) {
          const termDate = new Date(e.terminationDate);
          if (termDate < monthEnd) return false;
        }

        return true;
      }).length;

      const netChange = newHires - terminations;
      const turnoverRate =
        totalEmployees > 0 ? (terminations / totalEmployees) * 100 : 0;

      monthlyTrend.push({
        month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        newHires,
        terminations,
        netChange,
        totalEmployees,
        turnoverRate: parseFloat(turnoverRate.toFixed(2)),
      });

      totalNewHires += newHires;
      totalTerminations += terminations;
    }

    const netChange = totalNewHires - totalTerminations;

    // Calculate average, min, max turnover rates
    const turnoverRates = monthlyTrend.map((m) => m.turnoverRate);
    const avgTurnoverRate =
      turnoverRates.length > 0
        ? turnoverRates.reduce((sum, r) => sum + r, 0) / turnoverRates.length
        : 0;
    const maxTurnoverRate =
      turnoverRates.length > 0 ? Math.max(...turnoverRates) : 0;
    const minTurnoverRate =
      turnoverRates.length > 0 ? Math.min(...turnoverRates) : 0;

    // TERMINATION REASONS (if requested)
    let terminationReasons: TerminationReasonDto[] | undefined;

    if (filters.includeReasons) {
      const terminated = employees.filter((e) => {
        if (!e.terminationDate) return false;
        const termDate = new Date(e.terminationDate);
        return termDate >= startDate && termDate <= endDate;
      });

      const reasonMap = new Map<string, number>();
      terminated.forEach((e) => {
        const reason = e.terminationReason || 'Unknown';
        reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
      });

      const totalTerminated = terminated.length;

      terminationReasons = Array.from(reasonMap.entries())
        .map(([reason, count]) => ({
          reason,
          count,
          percentage: totalTerminated > 0 ? (count / totalTerminated) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);
    }

    // DEPARTMENT BREAKDOWN (if requested)
    let departmentTurnover: DepartmentTurnoverDto[] | undefined;

    if (filters.includeDepartmentBreakdown) {
      const deptMap = new Map<
        string,
        {
          totalEmployees: number;
          terminations: number;
          tenures: number[];
        }
      >();

      employees.forEach((e) => {
        const dept = e.department?.nameEn || 'Unknown';

        if (!deptMap.has(dept)) {
          deptMap.set(dept, {
            totalEmployees: 0,
            terminations: 0,
            tenures: [],
          });
        }

        const deptData = deptMap.get(dept)!;

        // Count as employee if active during period
        const hireDate = new Date(e.hireDate);
        if (hireDate <= endDate) {
          if (!e.terminationDate || new Date(e.terminationDate) >= startDate) {
            deptData.totalEmployees++;
          }
        }

        // Count terminations in period
        if (e.terminationDate) {
          const termDate = new Date(e.terminationDate);
          if (termDate >= startDate && termDate <= endDate) {
            deptData.terminations++;

            // Calculate tenure of leaver
            const tenure =
              (termDate.getTime() - hireDate.getTime()) /
              (1000 * 60 * 60 * 24 * 365);
            deptData.tenures.push(tenure);
          }
        }
      });

      departmentTurnover = Array.from(deptMap.entries())
        .map(([department, data]) => {
          const turnoverRate =
            data.totalEmployees > 0
              ? (data.terminations / data.totalEmployees) * 100
              : 0;

          const avgTenureOfLeavers =
            data.tenures.length > 0
              ? data.tenures.reduce((sum, t) => sum + t, 0) /
                data.tenures.length
              : 0;

          return {
            department,
            totalEmployees: data.totalEmployees,
            terminations: data.terminations,
            turnoverRate: parseFloat(turnoverRate.toFixed(2)),
            avgTenureOfLeavers: parseFloat(avgTenureOfLeavers.toFixed(2)),
          };
        })
        .sort((a, b) => b.turnoverRate - a.turnoverRate);
    }

    // TENURE OF TERMINATED EMPLOYEES
    const terminatedInPeriod = employees.filter((e) => {
      if (!e.terminationDate) return false;
      const termDate = new Date(e.terminationDate);
      return termDate >= startDate && termDate <= endDate;
    });

    let avgTenureOfTerminated = 0;
    if (terminatedInPeriod.length > 0) {
      const tenures = terminatedInPeriod.map((e) => {
        const hireDate = new Date(e.hireDate);
        const termDate = new Date(e.terminationDate!);
        return (
          (termDate.getTime() - hireDate.getTime()) /
          (1000 * 60 * 60 * 24 * 365)
        );
      });
      avgTenureOfTerminated =
        tenures.reduce((sum, t) => sum + t, 0) / tenures.length;
    }

    // VOLUNTARY TERMINATION RATE
    const voluntaryTerminations = terminatedInPeriod.filter(
      (e) =>
        e.terminationReason?.toLowerCase().includes('resignation') ||
        e.terminationReason?.toLowerCase().includes('voluntary'),
    ).length;

    const voluntaryTerminationRate =
      totalTerminations > 0
        ? (voluntaryTerminations / totalTerminations) * 100
        : 0;

    // RISK ASSESSMENT
    const isHighRisk = avgTurnoverRate > 10;
    const riskLevel: 'Low' | 'Medium' | 'High' =
      avgTurnoverRate > 10 ? 'High' : avgTurnoverRate > 5 ? 'Medium' : 'Low';

    return {
      monthlyTrend,
      terminationReasons,
      departmentTurnover,
      totalNewHires,
      totalTerminations,
      netChange,
      avgTurnoverRate: parseFloat(avgTurnoverRate.toFixed(2)),
      maxTurnoverRate: parseFloat(maxTurnoverRate.toFixed(2)),
      minTurnoverRate: parseFloat(minTurnoverRate.toFixed(2)),
      avgTenureOfTerminated: parseFloat(avgTenureOfTerminated.toFixed(2)),
      voluntaryTerminationRate: parseFloat(voluntaryTerminationRate.toFixed(2)),
      isHighRisk,
      riskLevel,
      periodMonths,
      generatedAt: new Date(),
    };
  }
}
