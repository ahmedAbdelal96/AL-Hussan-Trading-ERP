/**
 * ============================================================================
 * GET EMPLOYEE ASSIGNMENT USE CASE
 * ============================================================================
 *
 * Report 8: Per-employee project deployment with allocation percentages.
 * Answers: "Where is each employee deployed and are they over/under allocated?"
 *
 * Allocation status logic:
 * - OVERHEAD: all active assignments have percentage = null, OR no assignments
 * - OVER_ALLOCATED: sum(percentage) > 100
 * - FULLY_ALLOCATED: 80 <= sum(percentage) <= 100
 * - UNDER_ALLOCATED: sum(percentage) < 80 (with at least one non-null %)
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  EmployeeAssignmentFiltersDto,
  EmployeeAssignmentResponseDto,
  EmployeeAssignmentItemDto,
  AssignmentSummaryDto,
  ProjectAssignmentDto,
} from '../dto';

type AllocationStatus =
  | 'OVERHEAD'
  | 'OVER_ALLOCATED'
  | 'FULLY_ALLOCATED'
  | 'UNDER_ALLOCATED';

function calcAllocationStatus(
  totalPct: number,
  hasNonNull: boolean,
): AllocationStatus {
  if (!hasNonNull) return 'OVERHEAD';
  if (totalPct > 100) return 'OVER_ALLOCATED';
  if (totalPct >= 80) return 'FULLY_ALLOCATED';
  return 'UNDER_ALLOCATED';
}

@Injectable()
export class GetEmployeeAssignmentUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: EmployeeAssignmentFiltersDto,
  ): Promise<EmployeeAssignmentResponseDto> {
    const activeOnly = filters.activeOnly !== false; // default true

    // Build employee where clause
    const where: any = { deletedAt: null };
    if (filters.department) {
      where.department = {
        nameEn: { contains: filters.department, mode: 'insensitive' },
      };
    }
    if (filters.status) where.status = filters.status;
    if (filters.employmentType) where.employmentType = filters.employmentType;

    const employees = await this.prisma.employee.findMany({
      where,
      select: {
        id: true,
        employeeNumber: true,
        firstName: true,
        lastName: true,
        department: { select: { nameEn: true } },
        position: { select: { nameEn: true } },
        employmentType: true,
        projectAssignments: {
          where: activeOnly ? { isActive: true } : {},
          select: {
            percentage: true,
            isActive: true,
            role: true,
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    // Build result items
    let items: EmployeeAssignmentItemDto[] = employees.map((emp) => {
      const assignments: ProjectAssignmentDto[] = emp.projectAssignments.map(
        (pa) => ({
          projectId: pa.project.id,
          projectName: pa.project.name,
          projectStatus: pa.project.status,
          role: pa.role ?? null,
          allocationPercentage:
            pa.percentage !== null ? Number(pa.percentage) : null,
          isActive: pa.isActive,
        }),
      );

      const nonNullPcts = assignments
        .filter((a) => a.allocationPercentage !== null)
        .map((a) => a.allocationPercentage as number);

      const totalPct = nonNullPcts.reduce((sum, p) => sum + p, 0);
      const hasNonNull = nonNullPcts.length > 0;
      const allocationStatus = calcAllocationStatus(totalPct, hasNonNull);

      return {
        employeeId: emp.id,
        employeeNumber: emp.employeeNumber,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.nameEn ?? '',
        position: emp.position?.nameEn ?? '',
        employmentType: emp.employmentType,
        totalAllocationPercentage: totalPct,
        allocationStatus,
        activeProjectCount: assignments.filter((a) => a.isActive).length,
        assignments,
      };
    });

    // Apply allocationStatus filter (post-aggregation)
    if (filters.allocationStatus) {
      items = items.filter(
        (i) => i.allocationStatus === filters.allocationStatus,
      );
    }

    // Sort
    const sortBy = filters.sortBy ?? 'employeeName';
    const sortOrder = filters.sortOrder ?? 'asc';
    items.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'employeeName') {
        cmp = a.employeeName.localeCompare(b.employeeName);
      } else if (sortBy === 'allocationPct') {
        cmp = a.totalAllocationPercentage - b.totalAllocationPercentage;
      } else if (sortBy === 'projectCount') {
        cmp = a.activeProjectCount - b.activeProjectCount;
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    // Summary
    const summary: AssignmentSummaryDto = {
      totalEmployees: items.length,
      overheadCount: items.filter((i) => i.allocationStatus === 'OVERHEAD')
        .length,
      overAllocatedCount: items.filter(
        (i) => i.allocationStatus === 'OVER_ALLOCATED',
      ).length,
      fullyAllocatedCount: items.filter(
        (i) => i.allocationStatus === 'FULLY_ALLOCATED',
      ).length,
      underAllocatedCount: items.filter(
        (i) => i.allocationStatus === 'UNDER_ALLOCATED',
      ).length,
      avgAllocationPercentage:
        items.length > 0
          ? Math.round(
              items.reduce((s, i) => s + i.totalAllocationPercentage, 0) /
                items.length,
            )
          : 0,
    };

    return {
      employees: items,
      summary,
      generatedAt: new Date().toISOString(),
    };
  }
}
