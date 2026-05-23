import { Injectable } from '@nestjs/common';
import { CostType, Prisma, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import { ProjectLaborCostFiltersDto } from '../dto/projects-filters.dto';
import {
  LaborCostSummaryDto,
  ProjectEmployeeCostDetailDto,
  ProjectLaborCostItemDto,
  ProjectLaborCostResponseDto,
} from '../dto/projects-responses-part3.dto';

const LABOR_COST_TYPES = [CostType.SALARY, CostType.ALLOWANCE] as const;

@Injectable()
export class GetProjectLaborCostUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReport: BaseReportService,
  ) {}

  async execute(
    filters: ProjectLaborCostFiltersDto,
  ): Promise<ProjectLaborCostResponseDto> {
    const now = new Date();
    const month = filters.month ?? now.getMonth() + 1;
    const year = filters.year ?? now.getFullYear();
    const sortBy = filters.sortBy ?? 'totalLaborCost';
    const sortOrder = filters.sortOrder ?? 'desc';
    const includeEmployeeDetails = filters.includeEmployeeDetails ?? false;

    const projectWhere: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(filters.siteId && { siteId: filters.siteId }),
      ...(filters.managerId && { managerId: filters.managerId }),
      ...(filters.projectStatus && { status: filters.projectStatus }),
      OR: [
        {
          status: {
            in: [
              ProjectStatus.ACTIVE,
              ProjectStatus.PLANNING,
              ProjectStatus.ON_HOLD,
            ],
          },
        },
        {
          createdAt: {
            lte: new Date(year, month, 0, 23, 59, 59, 999),
          },
        },
      ],
    };

    const projects = await this.prisma.project.findMany({
      where: projectWhere,
      select: {
        id: true,
        projectCode: true,
        name: true,
        status: true,
        budget: true,
        siteId: true,
        site: { select: { name: true } },
      },
      orderBy: { projectCode: 'asc' },
    });

    if (projects.length === 0) {
      return this.buildEmptyResponse();
    }

    const projectIds = projects.map((p) => p.id);

    const [
      directLaborByType,
      allocatedLaborRows,
      otherDirectCostsAgg,
      otherAllocatedCosts,
      employeeAssignments,
    ] = await Promise.all([
      this.prisma.cost.groupBy({
        by: ['projectId', 'costType'],
        where: {
          projectId: { in: projectIds },
          costType: { in: [...LABOR_COST_TYPES] },
        },
        _sum: { amount: true },
      }),
      this.prisma.costAllocation.findMany({
        where: {
          projectId: { in: projectIds },
          cost: {
            projectId: null,
            isAllocated: true,
            costType: { in: [...LABOR_COST_TYPES] },
          },
        },
        select: {
          projectId: true,
          allocatedAmount: true,
          cost: {
            select: {
              costType: true,
              referenceType: true,
              referenceId: true,
            },
          },
        },
      }),
      this.prisma.cost.groupBy({
        by: ['projectId'],
        where: {
          projectId: { in: projectIds },
          costType: { notIn: [...LABOR_COST_TYPES] },
          isAllocated: false,
        },
        _sum: { amount: true },
      }),
      this.prisma.costAllocation.findMany({
        where: {
          projectId: { in: projectIds },
          cost: {
            projectId: null,
            isAllocated: true,
            costType: { notIn: [...LABOR_COST_TYPES] },
          },
        },
        select: {
          projectId: true,
          allocatedAmount: true,
        },
      }),
      this.prisma.projectEmployee.findMany({
        where: {
          projectId: { in: projectIds },
          isActive: true,
        },
        select: {
          projectId: true,
          employeeId: true,
          percentage: true,
          employee: {
            select: {
              id: true,
              employeeNumber: true,
              firstName: true,
              lastName: true,
              position: { select: { nameEn: true, nameAr: true } },
              department: { select: { nameEn: true, nameAr: true } },
            },
          },
        },
      }),
    ]);

    const employeeCostMap = new Map<
      string,
      Map<string, { salary: number; allowance: number }>
    >();

    if (includeEmployeeDetails) {
      const [directPayslipCosts, allocatedPayslipCosts] = await Promise.all([
        this.prisma.cost.findMany({
          where: {
            projectId: { in: projectIds },
            costType: { in: [...LABOR_COST_TYPES] },
            referenceType: 'Payslip',
            referenceId: { not: null },
          },
          select: {
            projectId: true,
            costType: true,
            amount: true,
            referenceId: true,
          },
        }),
        this.prisma.costAllocation.findMany({
          where: {
            projectId: { in: projectIds },
            cost: {
              projectId: null,
              isAllocated: true,
              costType: { in: [...LABOR_COST_TYPES] },
              referenceType: 'Payslip',
              referenceId: { not: null },
            },
          },
          select: {
            projectId: true,
            allocatedAmount: true,
            cost: {
              select: {
                costType: true,
                referenceId: true,
              },
            },
          },
        }),
      ]);

      const payslipIds = [
        ...new Set([
          ...directPayslipCosts
            .map((c) => c.referenceId)
            .filter((id): id is string => !!id),
          ...allocatedPayslipCosts
            .map((a) => a.cost.referenceId)
            .filter((id): id is string => !!id),
        ]),
      ];

      const payslips = payslipIds.length
        ? await this.prisma.payslip.findMany({
            where: { id: { in: payslipIds } },
            select: { id: true, employeeId: true },
          })
        : [];

      const payslipEmployeeMap = new Map(
        payslips.map((p) => [p.id, p.employeeId] as const),
      );

      const addEmployeeCost = (
        projectId: string,
        employeeId: string,
        costType: CostType,
        amount: number,
      ) => {
        if (!employeeCostMap.has(projectId)) {
          employeeCostMap.set(projectId, new Map());
        }
        const projectEmployeeMap = employeeCostMap.get(projectId)!;
        if (!projectEmployeeMap.has(employeeId)) {
          projectEmployeeMap.set(employeeId, { salary: 0, allowance: 0 });
        }
        const current = projectEmployeeMap.get(employeeId)!;
        if (costType === CostType.SALARY) current.salary += amount;
        if (costType === CostType.ALLOWANCE) current.allowance += amount;
      };

      directPayslipCosts.forEach((cost) => {
        if (!cost.projectId || !cost.referenceId) return;
        const employeeId = payslipEmployeeMap.get(cost.referenceId);
        if (!employeeId) return;
        addEmployeeCost(
          cost.projectId,
          employeeId,
          cost.costType,
          Number(cost.amount),
        );
      });

      allocatedPayslipCosts.forEach((alloc) => {
        if (!alloc.cost.referenceId) return;
        const employeeId = payslipEmployeeMap.get(alloc.cost.referenceId);
        if (!employeeId) return;
        addEmployeeCost(
          alloc.projectId,
          employeeId,
          alloc.cost.costType,
          Number(alloc.allocatedAmount),
        );
      });
    }

    const laborMap = new Map<string, { salary: number; allowance: number }>();
    directLaborByType.forEach((row) => {
      if (!row.projectId) return;
      if (!laborMap.has(row.projectId)) {
        laborMap.set(row.projectId, { salary: 0, allowance: 0 });
      }
      const current = laborMap.get(row.projectId)!;
      const amount = Number(row._sum.amount ?? 0);
      if (row.costType === CostType.SALARY) current.salary += amount;
      if (row.costType === CostType.ALLOWANCE) current.allowance += amount;
    });

    allocatedLaborRows.forEach((row) => {
      if (!laborMap.has(row.projectId)) {
        laborMap.set(row.projectId, { salary: 0, allowance: 0 });
      }
      const current = laborMap.get(row.projectId)!;
      const amount = Number(row.allocatedAmount ?? 0);
      if (row.cost.costType === CostType.SALARY) current.salary += amount;
      if (row.cost.costType === CostType.ALLOWANCE) current.allowance += amount;
    });

    const otherCostsMap = new Map<string, number>();
    otherDirectCostsAgg.forEach((row) => {
      if (!row.projectId) return;
      otherCostsMap.set(row.projectId, Number(row._sum.amount ?? 0));
    });

    const otherAllocatedMap = new Map<string, number>();
    otherAllocatedCosts.forEach((row) => {
      const existing = otherAllocatedMap.get(row.projectId) ?? 0;
      otherAllocatedMap.set(
        row.projectId,
        existing + Number(row.allocatedAmount ?? 0),
      );
    });

    const assignmentMap = new Map<string, typeof employeeAssignments>();
    employeeAssignments.forEach((assignment) => {
      if (!assignmentMap.has(assignment.projectId)) {
        assignmentMap.set(assignment.projectId, []);
      }
      assignmentMap.get(assignment.projectId)!.push(assignment);
    });

    const items: ProjectLaborCostItemDto[] = projects.map((project) => {
      const labor = laborMap.get(project.id) ?? { salary: 0, allowance: 0 };
      const salaryCost = labor.salary;
      const allowanceCost = labor.allowance;
      const totalLaborCost = salaryCost + allowanceCost;
      const otherCosts =
        (otherCostsMap.get(project.id) ?? 0) +
        (otherAllocatedMap.get(project.id) ?? 0);
      const totalProjectCost = totalLaborCost + otherCosts;
      const budget = Number(project.budget ?? 0);

      const laborBudgetPercentage =
        budget > 0
          ? this.baseReport.roundNumber((totalLaborCost / budget) * 100)
          : 0;
      const laborCostShare =
        totalProjectCost > 0
          ? this.baseReport.roundNumber(
              (totalLaborCost / totalProjectCost) * 100,
            )
          : 0;

      const assignments = assignmentMap.get(project.id) ?? [];

      let employeeDetails: ProjectEmployeeCostDetailDto[] | undefined;
      if (includeEmployeeDetails) {
        const projectEmployeeCosts = employeeCostMap.get(project.id);
        employeeDetails = assignments.map((assignment) => {
          const costs = projectEmployeeCosts?.get(assignment.employeeId) ?? {
            salary: 0,
            allowance: 0,
          };

          return {
            employeeId: assignment.employeeId,
            employeeCode: assignment.employee.employeeNumber,
            fullName: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
            position:
              assignment.employee.position?.nameEn ??
              assignment.employee.position?.nameAr ??
              '',
            department:
              assignment.employee.department?.nameEn ??
              assignment.employee.department?.nameAr ??
              '',
            allocationPercentage: Number(assignment.percentage ?? 0),
            salaryCost: this.baseReport.roundNumber(costs.salary),
            allowanceCost: this.baseReport.roundNumber(costs.allowance),
            totalLaborCost: this.baseReport.roundNumber(
              costs.salary + costs.allowance,
            ),
          };
        });

        employeeDetails.sort((a, b) => b.totalLaborCost - a.totalLaborCost);
      }

      return {
        projectId: project.id,
        projectCode: project.projectCode,
        projectName: project.name,
        status: project.status,
        siteId: project.siteId ?? undefined,
        siteName: project.site?.name ?? undefined,
        budget: this.baseReport.roundNumber(budget),
        salaryCost: this.baseReport.roundNumber(salaryCost),
        allowanceCost: this.baseReport.roundNumber(allowanceCost),
        totalLaborCost: this.baseReport.roundNumber(totalLaborCost),
        otherCosts: this.baseReport.roundNumber(otherCosts),
        totalProjectCost: this.baseReport.roundNumber(totalProjectCost),
        laborBudgetPercentage,
        laborCostShare,
        assignedEmployeeCount: assignments.length,
        ...(includeEmployeeDetails && { employeeDetails }),
      };
    });

    items.sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case 'totalLaborCost':
          diff = a.totalLaborCost - b.totalLaborCost;
          break;
        case 'employeeCount':
          diff = a.assignedEmployeeCount - b.assignedEmployeeCount;
          break;
        case 'laborPercentage':
          diff = a.laborCostShare - b.laborCostShare;
          break;
      }
      return sortOrder === 'asc' ? diff : -diff;
    });

    const totalLaborCost = items.reduce(
      (sum, item) => sum + item.totalLaborCost,
      0,
    );
    const totalSalaryCost = items.reduce(
      (sum, item) => sum + item.salaryCost,
      0,
    );
    const totalAllowanceCost = items.reduce(
      (sum, item) => sum + item.allowanceCost,
      0,
    );
    const totalBudget = items.reduce((sum, item) => sum + item.budget, 0);
    const totalProjectCost = items.reduce(
      (sum, item) => sum + item.totalProjectCost,
      0,
    );
    const totalAssignedEmployees = items.reduce(
      (sum, item) => sum + item.assignedEmployeeCount,
      0,
    );

    const summary: LaborCostSummaryDto = {
      totalLaborCost: this.baseReport.roundNumber(totalLaborCost),
      totalSalaryCost: this.baseReport.roundNumber(totalSalaryCost),
      totalAllowanceCost: this.baseReport.roundNumber(totalAllowanceCost),
      totalBudget: this.baseReport.roundNumber(totalBudget),
      totalProjectCost: this.baseReport.roundNumber(totalProjectCost),
      overallLaborShare:
        totalProjectCost > 0
          ? this.baseReport.roundNumber(
              (totalLaborCost / totalProjectCost) * 100,
            )
          : 0,
      totalAssignedEmployees,
      avgLaborCostPerProject:
        items.length > 0
          ? this.baseReport.roundNumber(totalLaborCost / items.length)
          : 0,
    };

    return {
      projects: items,
      summary,
      projectCount: items.length,
      currency: 'SAR',
      generatedAt: new Date().toISOString(),
    };
  }

  private buildEmptyResponse(): ProjectLaborCostResponseDto {
    return {
      projects: [],
      summary: {
        totalLaborCost: 0,
        totalSalaryCost: 0,
        totalAllowanceCost: 0,
        totalBudget: 0,
        totalProjectCost: 0,
        overallLaborShare: 0,
        totalAssignedEmployees: 0,
        avgLaborCostPerProject: 0,
      },
      projectCount: 0,
      currency: 'SAR',
      generatedAt: new Date().toISOString(),
    };
  }
}
