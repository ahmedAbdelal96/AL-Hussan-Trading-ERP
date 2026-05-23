/**
 * ============================================================================
 * GET PROJECT COST BREAKDOWN USE CASE
 * ============================================================================
 *
 * Report 8: Breaks down all costs per project by CostType.
 * Answers: "Where is the money going in each project?"
 *
 * Data Sources:
 *   - Project (base info + budget)
 *   - Cost (direct costs by type: costType, projectId)
 *   - CostAllocation (allocated costs: allocatedAmount, projectId)
 *   - Site (site name for display)
 *
 * Cost Model:
 *   totalCost = directCosts + allocatedCosts
 *   directCosts  = Cost WHERE projectId = X (grouped by costType)
 *   allocatedCosts = CostAllocation WHERE projectId = X
 *
 * @module GetProjectCostBreakdownUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { CostType, Prisma, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import { ProjectCostBreakdownFiltersDto } from '../dto/projects-filters.dto';
import {
  CostTypeBreakdownItemDto,
  CostTypeTotalDto,
  ProjectCostBreakdownItemDto,
  ProjectCostBreakdownResponseDto,
} from '../dto/projects-responses-part3.dto';
import { getDefaultAccountingCostWhere } from '../../../finance/utils/cost-accounting-status.util';

@Injectable()
export class GetProjectCostBreakdownUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReport: BaseReportService,
  ) {}

  async execute(
    filters: ProjectCostBreakdownFiltersDto,
  ): Promise<ProjectCostBreakdownResponseDto> {
    const now = new Date();
    const month = filters.month ?? now.getMonth() + 1;
    const year = filters.year ?? now.getFullYear();
    const sortBy = filters.sortBy ?? 'totalCost';
    const sortOrder = filters.sortOrder ?? 'desc';

    // ── 1. Fetch matching projects ─────────────────────────────────────────
    const projectWhere: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(filters.siteId && { siteId: filters.siteId }),
      ...(filters.managerId && { managerId: filters.managerId }),
      ...(filters.projectStatus && { status: filters.projectStatus }),
      // Include projects that were active or created up to this month/year
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
          actualEndDate: {
            gte: new Date(year, month - 1, 1),
            lte: new Date(year, month, 0, 23, 59, 59, 999),
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

    // ── 2. Direct costs grouped by (projectId, costType) ─────────────────
    const directCostsByType = await this.prisma.cost.groupBy({
      by: ['projectId', 'costType'],
      where: {
        projectId: { in: projectIds },
        isAllocated: false,
        ...getDefaultAccountingCostWhere(),
        ...(filters.costType && { costType: filters.costType }),
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    // Direct costs total per project (for directCosts field)
    const directCostsByProject = await this.prisma.cost.groupBy({
      by: ['projectId'],
      where: {
        projectId: { in: projectIds },
        isAllocated: false,
        ...getDefaultAccountingCostWhere(),
      },
      _sum: { amount: true },
    });

    // ── 3. Allocated costs per project ────────────────────────────────────
    const allocatedCostsByProject = await this.prisma.costAllocation.groupBy({
      by: ['projectId'],
      where: {
        projectId: { in: projectIds },
        cost: getDefaultAccountingCostWhere(),
      },
      _sum: { allocatedAmount: true },
    });

    // ── 4. Build lookup maps ──────────────────────────────────────────────
    // Direct cost by project → Map<projectId, number>
    const directTotalMap = new Map<string, number>();
    for (const row of directCostsByProject) {
      if (row.projectId) {
        directTotalMap.set(row.projectId, Number(row._sum.amount ?? 0));
      }
    }

    // Allocated cost by project → Map<projectId, number>
    const allocatedTotalMap = new Map<string, number>();
    for (const row of allocatedCostsByProject) {
      allocatedTotalMap.set(
        row.projectId,
        Number(row._sum.allocatedAmount ?? 0),
      );
    }

    // Direct costs by type → Map<projectId, CostTypeBreakdownItemDto[]>
    const typeBreakdownMap = new Map<
      string,
      Map<CostType, { amount: number; count: number }>
    >();
    for (const row of directCostsByType) {
      if (!row.projectId) continue;
      if (!typeBreakdownMap.has(row.projectId)) {
        typeBreakdownMap.set(row.projectId, new Map());
      }
      typeBreakdownMap.get(row.projectId)!.set(row.costType, {
        amount: Number(row._sum.amount ?? 0),
        count: row._count.id,
      });
    }

    // ── 5. Build per-project items ────────────────────────────────────────
    const items: ProjectCostBreakdownItemDto[] = projects.map((p) => {
      const directCosts = directTotalMap.get(p.id) ?? 0;
      const allocatedCosts = allocatedTotalMap.get(p.id) ?? 0;
      const totalCost = directCosts + allocatedCosts;
      const budget = Number(p.budget ?? 0);
      const budgetVariance = budget - totalCost;
      const budgetUtilization =
        budget > 0
          ? this.baseReport.roundNumber((totalCost / budget) * 100)
          : 0;

      // Build cost by type breakdown
      const typeMap =
        typeBreakdownMap.get(p.id) ??
        new Map<CostType, { amount: number; count: number }>();
      const costByType: CostTypeBreakdownItemDto[] = [];
      for (const [costType, data] of typeMap.entries()) {
        costByType.push({
          costType,
          amount: this.baseReport.roundNumber(data.amount),
          percentage:
            totalCost > 0
              ? this.baseReport.roundNumber((data.amount / totalCost) * 100)
              : 0,
          transactionCount: data.count,
        });
      }
      // Sort by amount desc
      costByType.sort((a, b) => b.amount - a.amount);

      return {
        projectId: p.id,
        projectCode: p.projectCode,
        projectName: p.name,
        status: p.status,
        siteId: p.siteId ?? undefined,
        siteName: p.site?.name ?? undefined,
        budget: this.baseReport.roundNumber(budget),
        totalCost: this.baseReport.roundNumber(totalCost),
        budgetVariance: this.baseReport.roundNumber(budgetVariance),
        budgetUtilization,
        directCosts: this.baseReport.roundNumber(directCosts),
        allocatedCosts: this.baseReport.roundNumber(allocatedCosts),
        costByType,
      };
    });

    // ── 6. Sort ───────────────────────────────────────────────────────────
    items.sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case 'totalCost':
          diff = a.totalCost - b.totalCost;
          break;
        case 'budget':
          diff = a.budget - b.budget;
          break;
        case 'utilization':
          diff = a.budgetUtilization - b.budgetUtilization;
          break;
        case 'projectName':
          diff = a.projectName.localeCompare(b.projectName);
          break;
      }
      return sortOrder === 'asc' ? diff : -diff;
    });

    // ── 7. Build cost type summary across all projects ────────────────────
    const globalTypeMap = new Map<
      CostType,
      { total: number; projectSet: Set<string> }
    >();
    for (const item of items) {
      for (const ct of item.costByType) {
        if (!globalTypeMap.has(ct.costType)) {
          globalTypeMap.set(ct.costType, { total: 0, projectSet: new Set() });
        }
        const entry = globalTypeMap.get(ct.costType)!;
        entry.total += ct.amount;
        entry.projectSet.add(item.projectId);
      }
    }

    const grandTotalCost = items.reduce((s, i) => s + i.totalCost, 0);
    const grandTotalBudget = items.reduce((s, i) => s + i.budget, 0);

    const costTypesSummary: CostTypeTotalDto[] = [];
    for (const [costType, data] of globalTypeMap.entries()) {
      costTypesSummary.push({
        costType,
        totalAmount: this.baseReport.roundNumber(data.total),
        percentage:
          grandTotalCost > 0
            ? this.baseReport.roundNumber((data.total / grandTotalCost) * 100)
            : 0,
        projectCount: data.projectSet.size,
      });
    }
    costTypesSummary.sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      projects: items,
      grandTotalCost: this.baseReport.roundNumber(grandTotalCost),
      grandTotalBudget: this.baseReport.roundNumber(grandTotalBudget),
      overallBudgetUtilization:
        grandTotalBudget > 0
          ? this.baseReport.roundNumber(
              (grandTotalCost / grandTotalBudget) * 100,
            )
          : 0,
      costTypesSummary,
      projectCount: items.length,
      currency: 'SAR',
      generatedAt: new Date().toISOString(),
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private buildEmptyResponse(): ProjectCostBreakdownResponseDto {
    return {
      projects: [],
      grandTotalCost: 0,
      grandTotalBudget: 0,
      overallBudgetUtilization: 0,
      costTypesSummary: [],
      projectCount: 0,
      currency: 'SAR',
      generatedAt: new Date().toISOString(),
    };
  }
}
