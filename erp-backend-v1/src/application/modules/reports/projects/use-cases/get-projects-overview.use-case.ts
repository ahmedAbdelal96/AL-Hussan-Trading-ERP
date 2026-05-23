/**
 * ============================================================================
 * GET PROJECTS OVERVIEW USE CASE
 * ============================================================================
 *
 * Comprehensive overview report with key metrics and optional breakdowns
 *
 * Features:
 * - 12 key performance indicators
 * - Optional cost breakdown by type
 * - Optional previous period comparison
 * - Parallel query execution
 * - Comprehensive filtering
 *
 * @module GetProjectsOverviewUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import {
  ProjectsOverviewFiltersDto,
  ProjectsOverviewResponseDto,
  CostTypeBreakdownDto,
  PeriodComparisonDto,
} from '../dto';
import { ProjectStatus, Prisma } from '@prisma/client';
import { getDefaultAccountingCostWhere } from '../../../finance/utils/cost-accounting-status.util';

@Injectable()
export class GetProjectsOverviewUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  /**
   * Execute the use case
   */
  async execute(
    filters: ProjectsOverviewFiltersDto,
  ): Promise<ProjectsOverviewResponseDto> {
    const now = new Date();
    const month = filters.month || now.getMonth() + 1;
    const year = filters.year || now.getFullYear();

    // Build base filter
    const baseFilter = this.buildBaseFilter(filters, month, year);

    // Execute all queries in parallel for performance
    const [projects, totalCosts, costBreakdown, previousPeriodData] =
      await Promise.all([
        // 1. Get all projects with basic info
        this.prisma.project.findMany({
          where: baseFilter,
          select: {
            id: true,
            status: true,
            budget: true,
            completionPercentage: true,
            createdAt: true,
          },
        }),

        // 2. Get total actual costs from ProjectCost
        this.getTotalCosts(baseFilter),

        // 3. Get cost breakdown by type (if requested)
        filters.includeCostBreakdown
          ? this.getCostBreakdown(baseFilter)
          : Promise.resolve(undefined),

        // 4. Get previous period data (if requested)
        filters.includeComparison
          ? this.getPreviousPeriodData(filters, month, year)
          : Promise.resolve(undefined),
      ]);

    // Calculate metrics
    const totalProjects = projects.length;
    const activeProjects = projects.filter(
      (p) => p.status === ProjectStatus.ACTIVE,
    ).length;
    const planningProjects = projects.filter(
      (p) => p.status === ProjectStatus.PLANNING,
    ).length;
    const onHoldProjects = projects.filter(
      (p) => p.status === ProjectStatus.ON_HOLD,
    ).length;
    const completedProjects = projects.filter(
      (p) => p.status === ProjectStatus.COMPLETED,
    ).length;
    const cancelledProjects = projects.filter(
      (p) => p.status === ProjectStatus.CANCELLED,
    ).length;

    // Budget calculations
    const totalBudget = projects.reduce(
      (sum, p) => sum + (p.budget ? Number(p.budget) : 0),
      0,
    );
    const totalActualCost = totalCosts;
    const budgetVariance = totalBudget - totalActualCost;
    const budgetUtilization =
      totalBudget > 0 ? (totalActualCost / totalBudget) * 100 : 0;

    // Completion calculations
    const avgCompletion =
      totalProjects > 0
        ? projects.reduce(
            (sum, p) => sum + Number(p.completionPercentage || 0),
            0,
          ) / totalProjects
        : 0;

    const completionRate =
      totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

    // Calculate growth rate if comparison data available
    let growthRate: number | undefined;
    if (previousPeriodData) {
      const currentTotal = totalProjects;
      const previousTotal = previousPeriodData.totalProjects;
      if (previousTotal > 0) {
        growthRate = ((currentTotal - previousTotal) / previousTotal) * 100;
      }
    }

    return {
      // Key Metrics
      totalProjects,
      activeProjects,
      planningProjects,
      onHoldProjects,
      completedProjects,
      cancelledProjects,
      totalBudget: this.baseReportService.roundNumber(totalBudget),
      totalActualCost: this.baseReportService.roundNumber(totalActualCost),
      budgetVariance: this.baseReportService.roundNumber(budgetVariance),
      budgetUtilization: this.baseReportService.roundNumber(budgetUtilization),
      avgCompletion: this.baseReportService.roundNumber(avgCompletion),
      completionRate: this.baseReportService.roundNumber(completionRate),

      // Optional data
      costBreakdown,
      previousPeriod: previousPeriodData,
      growthRate: growthRate
        ? this.baseReportService.roundNumber(growthRate)
        : undefined,

      // Metadata
      currency: 'SAR',
      month,
      year,
      generatedAt: new Date(),
    };
  }

  /**
   * Build base Prisma filter from filters
   */
  private buildBaseFilter(
    filters: ProjectsOverviewFiltersDto,
    month: number,
    year: number,
  ): Prisma.ProjectWhereInput {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      // Projects created or updated within the period
      OR: [
        {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          updatedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        // Or active/ongoing projects
        {
          status: {
            in: [ProjectStatus.ACTIVE, ProjectStatus.PLANNING],
          },
        },
      ],
    };

    // Apply optional filters
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
   * Get total actual costs (direct + allocated via CostAllocation)
   */
  private async getTotalCosts(
    projectFilter: Prisma.ProjectWhereInput,
  ): Promise<number> {
    const projects = await this.prisma.project.findMany({
      where: projectFilter,
      select: { id: true },
    });

    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) {
      return 0;
    }

    const [directResult, allocatedResult] = await Promise.all([
      this.prisma.cost.aggregate({
        where: {
          projectId: { in: projectIds },
          ...getDefaultAccountingCostWhere(),
        },
        _sum: { amount: true },
      }),
      this.prisma.costAllocation.aggregate({
        where: {
          projectId: { in: projectIds },
          cost: getDefaultAccountingCostWhere(),
        },
        _sum: { allocatedAmount: true },
      }),
    ]);

    return (
      Number(directResult._sum.amount || 0) +
      Number(allocatedResult._sum.allocatedAmount || 0)
    );
  }

  /**
   * Get cost breakdown by type (direct + allocated costs)
   */
  private async getCostBreakdown(
    projectFilter: Prisma.ProjectWhereInput,
  ): Promise<CostTypeBreakdownDto[]> {
    const projects = await this.prisma.project.findMany({
      where: projectFilter,
      select: { id: true },
    });

    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) {
      return [];
    }

    // Direct costs grouped by type
    const directCosts = await this.prisma.cost.groupBy({
      by: ['costType'],
      where: {
        projectId: { in: projectIds },
        ...getDefaultAccountingCostWhere(),
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    // Allocated costs with their Cost.costType
    const allocatedCosts = await this.prisma.costAllocation.findMany({
      where: {
        projectId: { in: projectIds },
        cost: getDefaultAccountingCostWhere(),
      },
      select: {
        allocatedAmount: true,
        cost: { select: { costType: true } },
      },
    });

    // Merge into costType → { amount, count } map
    const typeMap = new Map<string, { amount: number; count: number }>();

    directCosts.forEach((c) => {
      const existing = typeMap.get(c.costType) || { amount: 0, count: 0 };
      existing.amount += Number(c._sum.amount || 0);
      existing.count += c._count.id;
      typeMap.set(c.costType, existing);
    });

    allocatedCosts.forEach((a) => {
      const existing = typeMap.get(a.cost.costType) || { amount: 0, count: 0 };
      existing.amount += Number(a.allocatedAmount || 0);
      existing.count += 1;
      typeMap.set(a.cost.costType, existing);
    });

    const totalAmount = Array.from(typeMap.values()).reduce(
      (sum, v) => sum + v.amount,
      0,
    );

    return Array.from(typeMap.entries())
      .map(([costType, data]) => ({
        costType: costType as any,
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
   * Get previous period data for comparison
   */
  private async getPreviousPeriodData(
    filters: ProjectsOverviewFiltersDto,
    currentMonth: number,
    currentYear: number,
  ): Promise<PeriodComparisonDto | undefined> {
    // Calculate previous month/year
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear--;
    }

    const prevFilter = this.buildBaseFilter(filters, prevMonth, prevYear);

    const [prevProjects, prevCosts] = await Promise.all([
      this.prisma.project.findMany({
        where: prevFilter,
        select: {
          id: true,
          status: true,
          budget: true,
          completionPercentage: true,
        },
      }),
      this.getTotalCosts(prevFilter),
    ]);

    const totalProjects = prevProjects.length;
    const activeProjects = prevProjects.filter(
      (p) => p.status === ProjectStatus.ACTIVE,
    ).length;
    const completedProjects = prevProjects.filter(
      (p) => p.status === ProjectStatus.COMPLETED,
    ).length;
    const totalBudget = prevProjects.reduce(
      (sum, p) => sum + (p.budget ? Number(p.budget) : 0),
      0,
    );
    const avgCompletion =
      totalProjects > 0
        ? prevProjects.reduce(
            (sum, p) => sum + Number(p.completionPercentage || 0),
            0,
          ) / totalProjects
        : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalBudget: this.baseReportService.roundNumber(totalBudget),
      totalActualCost: this.baseReportService.roundNumber(prevCosts),
      avgCompletion: this.baseReportService.roundNumber(avgCompletion),
    };
  }
}
