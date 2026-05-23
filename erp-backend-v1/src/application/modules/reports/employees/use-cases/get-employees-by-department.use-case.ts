/**
 * ============================================================================
 * GET EMPLOYEES BY DEPARTMENT USE CASE
 * ============================================================================
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  EmployeesByDepartmentFiltersDto,
  EmployeesByDepartmentResponseDto,
  DepartmentItemDto,
} from '../dto';
import { EmployeeStatus } from '@prisma/client';
import { BaseReportService } from '../../services/base-report.service';

@Injectable()
export class GetEmployeesByDepartmentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: EmployeesByDepartmentFiltersDto,
  ): Promise<EmployeesByDepartmentResponseDto> {
    // Build where clause
    const where: any = {};

    if (filters.employmentType) {
      where.employmentType = filters.employmentType;
    }

    if (filters.status) {
      where.status = filters.status;
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
        department: { select: { nameEn: true, nameAr: true } },
        status: true,
        hireDate: true,
        terminationDate: true,
        baseSalary: true,
      },
    });

    // Group by department
    const deptMap = new Map<
      string,
      {
        employeeCount: number;
        activeCount: number;
        inactiveCount: number;
        onLeaveCount: number;
        tenures: number[];
        newHires: number;
        terminations: number;
        totalSalary: number;
      }
    >();

    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (filters.month && filters.year) {
      startDate = new Date(filters.year, filters.month - 1, 1);
      endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);
    }

    employees.forEach((e) => {
      const dept = e.department?.nameEn || 'Unknown';

      if (!deptMap.has(dept)) {
        deptMap.set(dept, {
          employeeCount: 0,
          activeCount: 0,
          inactiveCount: 0,
          onLeaveCount: 0,
          tenures: [],
          newHires: 0,
          terminations: 0,
          totalSalary: 0,
        });
      }

      const deptData = deptMap.get(dept)!;
      deptData.employeeCount++;

      // Status counts
      if (e.status === EmployeeStatus.ACTIVE) deptData.activeCount++;
      else if (e.status === EmployeeStatus.INACTIVE) deptData.inactiveCount++;
      else if (e.status === EmployeeStatus.ON_LEAVE) deptData.onLeaveCount++;

      // Tenure calculation
      const endDateForTenure = e.terminationDate
        ? new Date(e.terminationDate)
        : now;
      const hireDate = new Date(e.hireDate);
      const tenureDays = Math.floor(
        (endDateForTenure.getTime() - hireDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      deptData.tenures.push(tenureDays / 365);

      // New hires and terminations in period
      if (startDate && endDate) {
        const hire = new Date(e.hireDate);
        if (hire >= startDate && hire <= endDate) {
          deptData.newHires++;
        }

        if (e.terminationDate) {
          const term = new Date(e.terminationDate);
          if (term >= startDate && term <= endDate) {
            deptData.terminations++;
          }
        }
      }

      // Salary costs (if requested)
      if (filters.includeSalaryCosts && e.baseSalary) {
        deptData.totalSalary += Number(e.baseSalary) || 0;
      }
    });

    const totalEmployees = employees.length;

    // Convert to array and calculate metrics
    let departments: DepartmentItemDto[] = Array.from(deptMap.entries()).map(
      ([department, data]) => {
        const avgTenure =
          data.tenures.length > 0
            ? data.tenures.reduce((sum, t) => sum + t, 0) / data.tenures.length
            : 0;

        const item: DepartmentItemDto = {
          department,
          employeeCount: data.employeeCount,
          activeCount: data.activeCount,
          inactiveCount: data.inactiveCount,
          onLeaveCount: data.onLeaveCount,
          percentage:
            totalEmployees > 0
              ? (data.employeeCount / totalEmployees) * 100
              : 0,
          avgTenure: parseFloat(avgTenure.toFixed(2)),
          newHires: data.newHires,
          terminations: data.terminations,
        };

        if (filters.includeSalaryCosts) {
          item.totalSalaryCosts = data.totalSalary;
          item.avgSalary =
            data.employeeCount > 0 ? data.totalSalary / data.employeeCount : 0;
        }

        return item;
      },
    );

    // Filter by minEmployees
    if (filters.minEmployees) {
      departments = departments.filter(
        (d) => d.employeeCount >= filters.minEmployees!,
      );
    }

    // Sort departments
    const sortBy = filters.sortBy || 'employeeCount';
    const sortOrder = filters.sortOrder || 'desc';

    departments.sort((a, b) => {
      let valA: number | string;
      let valB: number | string;

      switch (sortBy) {
        case 'employeeCount':
          valA = a.employeeCount;
          valB = b.employeeCount;
          break;
        case 'activeCount':
          valA = a.activeCount;
          valB = b.activeCount;
          break;
        case 'avgTenure':
          valA = a.avgTenure;
          valB = b.avgTenure;
          break;
        case 'department':
        default:
          valA = a.department;
          valB = b.department;
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

    // Optional lightweight search on grouped rows
    if (filters.search) {
      const query = filters.search.trim().toLowerCase();
      departments = departments.filter((d) =>
        d.department.toLowerCase().includes(query),
      );
    }

    // Pagination on grouped rows
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 15;
    const totalDepartments = departments.length;
    const start = (page - 1) * limit;
    const paginatedDepartments = departments.slice(start, start + limit);

    const avgEmployeesPerDepartment =
      totalDepartments > 0 ? totalEmployees / totalDepartments : 0;

    const response: EmployeesByDepartmentResponseDto = {
      departments: paginatedDepartments,
      totalEmployees,
      totalDepartments,
      avgEmployeesPerDepartment: parseFloat(
        avgEmployeesPerDepartment.toFixed(2),
      ),
      meta: this.baseReportService.calculatePaginationMeta(
        page,
        limit,
        totalDepartments,
      ),
      month: filters.month || undefined,
      year: filters.year || undefined,
      generatedAt: new Date(),
    };

    if (filters.includeSalaryCosts) {
      response.totalSalaryCosts = departments.reduce(
        (sum, d) => sum + (d.totalSalaryCosts || 0),
        0,
      );
    }

    return response;
  }
}
