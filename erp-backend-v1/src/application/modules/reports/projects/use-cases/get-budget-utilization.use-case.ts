/**
 * ============================================================================
 * GET BUDGET UTILIZATION USE CASE
 * ============================================================================
 *
 * Comprehensive budget vs actual cost analysis
 *
 * Features:
 * - Budget status classification (within/over/under)
 * - Cost efficiency calculations
 * - Optional cost breakdown by category
 * - Budget variance tracking
 * - Risk identification (over-budget projects)
 *
 * @module GetBudgetUtilizationUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import {
  BudgetUtilizationFiltersDto,
  BudgetUtilizationResponseDto,
  ProjectBudgetItemDto,
  BudgetStatusSummaryDto,
  CostCategoryBreakdownDto,
  BudgetStatus,
} from '../dto';
import { ProjectStatus, Prisma } from '@prisma/client';

@Injectable()
export class GetBudgetUtilizationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  /**
   * Execute the use case
   */
  async execute(
    filters: BudgetUtilizationFiltersDto,
  ): Promise<BudgetUtilizationResponseDto> {
    const now = new Date();
    const month = filters.month || now.getMonth() + 1;
    const year = filters.year || now.getFullYear();

    // Build base filter
    const baseFilter = this.buildBaseFilter(filters, month, year);

    // Get all projects
    const projects = await this.prisma.project.findMany({
      where: baseFilter,
      select: {
        id: true,
        projectCode: true,
        name: true,
        status: true,
        budget: true,
        completionPercentage: true,
      },
    });

    // Get costs for all projects
    const projectIds = projects.map((p) => p.id);
    const [costs, costBreakdown] = await Promise.all([
      this.getCosts(projectIds),
      filters.includeCostBreakdown
        ? this.getCostBreakdown(projectIds)
        : Promise.resolve(undefined),
    ]);

    // Build project budget items
    const projectItems: ProjectBudgetItemDto[] = projects
      .map((project) => {
        const budget = project.budget ? Number(project.budget) : 0;
        const actualCost = costs.get(project.id) || 0;
        const budgetVariance = budget - actualCost;
        const utilization = budget > 0 ? (actualCost / budget) * 100 : 0;
        const completion = Number(project.completionPercentage || 0);

        // Cost efficiency: how much completion per utilization
        const costEfficiency =
          utilization > 0 ? (completion / utilization) * 100 : 0;

        const budgetStatus = this.determineBudgetStatus(
          budget,
          actualCost,
          utilization,
        );

        return {
          projectId: project.id,
          projectCode: project.projectCode,
          projectName: project.name,
          status: project.status,
          budgetStatus,
          budget: this.baseReportService.roundNumber(budget),
          actualCost: this.baseReportService.roundNumber(actualCost),
          budgetVariance: this.baseReportService.roundNumber(budgetVariance),
          utilization: this.baseReportService.roundNumber(utilization),
          completionPercentage: this.baseReportService.roundNumber(completion),
          costEfficiency: this.baseReportService.roundNumber(costEfficiency),
        };
      })
      .filter((item) => {
        // Apply budget status filter if specified
        if (
          filters.budgetStatus &&
          item.budgetStatus !== filters.budgetStatus
        ) {
          return false;
        }
        // Apply minimum budget filter
        if (filters.minBudget && item.budget < filters.minBudget) {
          return false;
        }
        return true;
      });

    // Sort projects
    const sortedProjects = this.sortProjects(
      projectItems,
      filters.sortBy || 'budgetVariance',
    );

    // Calculate budget status summary
    const budgetStatusSummary = this.calculateBudgetStatusSummary(projectItems);

    // Calculate totals
    const totalProjects = projectItems.length;
    const totalBudget = projectItems.reduce((sum, p) => sum + p.budget, 0);
    const totalActualCost = projectItems.reduce(
      (sum, p) => sum + p.actualCost,
      0,
    );
    const totalVariance = totalBudget - totalActualCost;
    const avgUtilization =
      totalProjects > 0
        ? projectItems.reduce((sum, p) => sum + p.utilization, 0) /
          totalProjects
        : 0;
    const avgCostEfficiency =
      totalProjects > 0
        ? projectItems.reduce((sum, p) => sum + p.costEfficiency, 0) /
          totalProjects
        : 0;

    const overBudgetCount = projectItems.filter(
      (p) => p.budgetStatus === BudgetStatus.OVER_BUDGET,
    ).length;
    const withinBudgetCount = projectItems.filter(
      (p) => p.budgetStatus === BudgetStatus.WITHIN_BUDGET,
    ).length;
    const underBudgetCount = projectItems.filter(
      (p) => p.budgetStatus === BudgetStatus.UNDER_BUDGET,
    ).length;

    return {
      projects: sortedProjects,
      budgetStatusSummary,
      costBreakdown,
      totalProjects,
      totalBudget: this.baseReportService.roundNumber(totalBudget),
      totalActualCost: this.baseReportService.roundNumber(totalActualCost),
      totalVariance: this.baseReportService.roundNumber(totalVariance),
      avgUtilization: this.baseReportService.roundNumber(avgUtilization),
      avgCostEfficiency: this.baseReportService.roundNumber(avgCostEfficiency),
      overBudgetCount,
      withinBudgetCount,
      underBudgetCount,
      currency: 'SAR',
      month,
      year,
      generatedAt: new Date(),
    };
  }

  /**
   * Build base filter
   */
  private buildBaseFilter(
    filters: BudgetUtilizationFiltersDto,
    month: number,
    year: number,
  ): Prisma.ProjectWhereInput {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      budget: { not: null }, // Only projects with budget
      OR: [
        { createdAt: { gte: startDate, lte: endDate } },
        { updatedAt: { gte: startDate, lte: endDate } },
        { status: { in: [ProjectStatus.ACTIVE, ProjectStatus.PLANNING] } },
      ],
    };

    if (filters.projectStatus) {
      where.status = filters.projectStatus;
    }

    if (filters.siteId) {
      where.siteId = filters.siteId;
    }

    if (filters.managerId) {
      where.managerId = filters.managerId;
    }

    return where;
  }

  /**
   * Get costs for projects (direct + allocated via CostAllocation)
   */
  private async getCosts(projectIds: string[]): Promise<Map<string, number>> {
    if (projectIds.length === 0) {
      return new Map();
    }

    const [directCosts, allocatedCosts] = await Promise.all([
      // Direct costs: Cost.projectId = projectId
      this.prisma.cost.groupBy({
        by: ['projectId'],
        where: { projectId: { in: projectIds } },
        _sum: { amount: true },
      }),
      // Allocated costs: only from true allocated parent costs
      // (projectId=null, isAllocated=true) to avoid double counting.
      this.prisma.costAllocation.findMany({
        where: {
          projectId: { in: projectIds },
          cost: {
            projectId: null,
            isAllocated: true,
          },
        },
        select: {
          projectId: true,
          allocatedAmount: true,
        },
      }),
    ]);

    const costMap = new Map<string, number>();

    directCosts.forEach((cost) => {
      if (cost.projectId) {
        costMap.set(cost.projectId, Number(cost._sum.amount || 0));
      }
    });

    allocatedCosts.forEach((alloc) => {
      const existing = costMap.get(alloc.projectId) || 0;
      costMap.set(
        alloc.projectId,
        existing + Number(alloc.allocatedAmount || 0),
      );
    });

    return costMap;
  }

  /**
   * Get cost breakdown by category (direct + allocated costs)
   */
  private async getCostBreakdown(
    projectIds: string[],
  ): Promise<CostCategoryBreakdownDto[]> {
    if (projectIds.length === 0) {
      return [];
    }

    // Direct costs with category
    const directCosts = await this.prisma.cost.groupBy({
      by: ['categoryId'],
      where: {
        projectId: { in: projectIds },
        categoryId: { not: null },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    // Allocated costs with category (via Cost.categoryId)
    const allocatedCosts = await this.prisma.costAllocation.findMany({
      where: { projectId: { in: projectIds } },
      select: {
        allocatedAmount: true,
        cost: {
          select: { categoryId: true, projectId: true, isAllocated: true },
        },
      },
    });

    // Merge into categoryId → { amount, count } map
    const catMap = new Map<string | null, { amount: number; count: number }>();

    directCosts.forEach((c) => {
      const key = c.categoryId;
      const existing = catMap.get(key) || { amount: 0, count: 0 };
      existing.amount += Number(c._sum.amount || 0);
      existing.count += c._count.id;
      catMap.set(key, existing);
    });

    allocatedCosts.forEach((a) => {
      if (a.cost.projectId !== null || !a.cost.isAllocated) {
        return;
      }
      const key = a.cost.categoryId;
      const existing = catMap.get(key) || { amount: 0, count: 0 };
      existing.amount += Number(a.allocatedAmount || 0);
      existing.count += 1;
      catMap.set(key, existing);
    });

    const categoryIds = Array.from(catMap.keys()).filter(
      (id): id is string => id !== null,
    );

    const categories = await this.prisma.costCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));
    const totalAmount = Array.from(catMap.values()).reduce(
      (sum, v) => sum + v.amount,
      0,
    );

    return Array.from(catMap.entries())
      .map(([categoryId, data]) => ({
        categoryName: categoryId
          ? categoryNameMap.get(categoryId) || 'Unknown'
          : 'Uncategorized',
        totalAmount: this.baseReportService.roundNumber(data.amount),
        transactionCount: data.count,
        percentage: this.baseReportService.calculatePercentage(
          data.amount,
          totalAmount,
        ),
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  /**
   * Determine budget status
   */
  private determineBudgetStatus(
    budget: number,
    actualCost: number,
    utilization: number,
  ): BudgetStatus {
    if (budget === 0) {
      return BudgetStatus.NO_BUDGET;
    }

    // Within ±5% tolerance
    if (utilization >= 95 && utilization <= 105) {
      return BudgetStatus.WITHIN_BUDGET;
    }

    if (utilization > 105) {
      return BudgetStatus.OVER_BUDGET;
    }

    return BudgetStatus.UNDER_BUDGET;
  }

  /**
   * Calculate budget status summary
   */
  private calculateBudgetStatusSummary(
    projects: ProjectBudgetItemDto[],
  ): BudgetStatusSummaryDto[] {
    const statusMap = new Map<
      BudgetStatus,
      { count: number; budget: number; cost: number; variance: number }
    >();

    projects.forEach((project) => {
      if (!statusMap.has(project.budgetStatus)) {
        statusMap.set(project.budgetStatus, {
          count: 0,
          budget: 0,
          cost: 0,
          variance: 0,
        });
      }

      const data = statusMap.get(project.budgetStatus)!;
      data.count++;
      data.budget += project.budget;
      data.cost += project.actualCost;
      data.variance += project.budgetVariance;
    });

    const totalProjects = projects.length;

    return Array.from(statusMap.entries()).map(([status, data]) => ({
      budgetStatus: status,
      projectCount: data.count,
      percentage: this.baseReportService.calculatePercentage(
        data.count,
        totalProjects,
      ),
      totalBudget: this.baseReportService.roundNumber(data.budget),
      totalActualCost: this.baseReportService.roundNumber(data.cost),
      totalVariance: this.baseReportService.roundNumber(data.variance),
    }));
  }

  /**
   * Sort projects
   */
  private sortProjects(
    projects: ProjectBudgetItemDto[],
    sortBy: 'budgetVariance' | 'utilization' | 'actualCost' | 'budget',
  ): ProjectBudgetItemDto[] {
    return projects.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case 'budgetVariance':
          aValue = Math.abs(a.budgetVariance);
          bValue = Math.abs(b.budgetVariance);
          break;
        case 'utilization':
          aValue = a.utilization;
          bValue = b.utilization;
          break;
        case 'actualCost':
          aValue = a.actualCost;
          bValue = b.actualCost;
          break;
        case 'budget':
          aValue = a.budget;
          bValue = b.budget;
          break;
      }

      return bValue - aValue; // Always descending
    });
  }
}
