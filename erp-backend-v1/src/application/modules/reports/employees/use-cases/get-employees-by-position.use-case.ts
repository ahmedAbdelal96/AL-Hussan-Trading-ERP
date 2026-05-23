/**
 * ============================================================================
 * GET EMPLOYEES BY POSITION USE CASE
 * ============================================================================
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  EmployeesByPositionFiltersDto,
  EmployeesByPositionResponseDto,
  PositionItemDto,
} from '../dto';
import { EmployeeStatus } from '@prisma/client';
import { BaseReportService } from '../../services/base-report.service';

@Injectable()
export class GetEmployeesByPositionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: EmployeesByPositionFiltersDto,
  ): Promise<EmployeesByPositionResponseDto> {
    // Build where clause
    const where: any = {};

    if (filters.department) {
      where.department = filters.department;
    }

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
        position: { select: { nameEn: true, nameAr: true } },
        status: true,
        hireDate: true,
        dateOfBirth: true,
      },
    });

    // Group by position
    const positionMap = new Map<
      string,
      {
        count: number;
        activeCount: number;
        tenures: number[];
        ages: number[];
        newHires: number;
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
      const position = e.position?.nameEn || 'Unknown';

      if (!positionMap.has(position)) {
        positionMap.set(position, {
          count: 0,
          activeCount: 0,
          tenures: [],
          ages: [],
          newHires: 0,
        });
      }

      const posData = positionMap.get(position)!;
      posData.count++;

      // Active count
      if (e.status === EmployeeStatus.ACTIVE) {
        posData.activeCount++;
      }

      // Tenure
      const hireDate = new Date(e.hireDate);
      const tenureDays = Math.floor(
        (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      posData.tenures.push(tenureDays / 365);

      // Age
      if (e.dateOfBirth) {
        const dob = new Date(e.dateOfBirth);
        const age = Math.floor(
          (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365),
        );
        posData.ages.push(age);
      }

      // New hires
      if (startDate && endDate) {
        const hire = new Date(e.hireDate);
        if (hire >= startDate && hire <= endDate) {
          posData.newHires++;
        }
      }
    });

    const totalEmployees = employees.length;

    // Convert to array
    let positions: PositionItemDto[] = Array.from(positionMap.entries()).map(
      ([position, data]) => {
        const avgTenure =
          data.tenures.length > 0
            ? data.tenures.reduce((sum, t) => sum + t, 0) / data.tenures.length
            : 0;

        const avgAge =
          data.ages.length > 0
            ? data.ages.reduce((sum, a) => sum + a, 0) / data.ages.length
            : 0;

        return {
          position,
          employeeCount: data.count,
          activeCount: data.activeCount,
          percentage:
            totalEmployees > 0 ? (data.count / totalEmployees) * 100 : 0,
          avgTenure: parseFloat(avgTenure.toFixed(2)),
          avgAge: parseFloat(avgAge.toFixed(1)),
          newHires: data.newHires,
        };
      },
    );

    // Filter by minEmployees
    if (filters.minEmployees) {
      positions = positions.filter(
        (p) => p.employeeCount >= filters.minEmployees!,
      );
    }

    // Sort
    const sortBy = filters.sortBy || 'employeeCount';
    const sortOrder = filters.sortOrder || 'desc';

    positions.sort((a, b) => {
      let valA: number | string;
      let valB: number | string;

      switch (sortBy) {
        case 'employeeCount':
          valA = a.employeeCount;
          valB = b.employeeCount;
          break;
        case 'avgTenure':
          valA = a.avgTenure;
          valB = b.avgTenure;
          break;
        case 'position':
        default:
          valA = a.position;
          valB = b.position;
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

    if (filters.search) {
      const query = filters.search.trim().toLowerCase();
      positions = positions.filter((p) =>
        p.position.toLowerCase().includes(query),
      );
    }

    const isPaginationRequested =
      typeof filters.page === 'number' || typeof filters.limit === 'number';
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 15;
    const totalPositions = positions.length;
    const start = (page - 1) * limit;
    const paginatedPositions = isPaginationRequested
      ? positions.slice(start, start + limit)
      : positions;

    const avgEmployeesPerPosition =
      totalPositions > 0 ? totalEmployees / totalPositions : 0;

    return {
      positions: paginatedPositions,
      totalEmployees,
      totalPositions,
      avgEmployeesPerPosition: parseFloat(avgEmployeesPerPosition.toFixed(2)),
      meta: this.baseReportService.calculatePaginationMeta(
        page,
        limit,
        totalPositions,
      ),
      month: filters.month || undefined,
      year: filters.year || undefined,
      generatedAt: new Date(),
    };
  }
}
