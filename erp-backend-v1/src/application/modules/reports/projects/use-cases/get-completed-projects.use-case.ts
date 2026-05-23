/**
 * ============================================================================
 * GET COMPLETED PROJECTS USE CASE
 * ============================================================================
 *
 * Analysis of completed projects with success metrics and performance scoring
 *
 * Features:
 * - Project success rate calculation
 * - Performance scoring (0-100 scale)
 * - Duration vs budget performance
 * - Success criteria evaluation
 * - Performance categorization (Excellent/Good/Fair/Poor)
 *
 * @module GetCompletedProjectsUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import {
  CompletedProjectsFiltersDto,
  CompletedProjectsResponseDto,
  CompletedProjectItemDto,
  PerformanceCategorySummaryDto,
} from '../dto';
import { ProjectStatus, Prisma } from '@prisma/client';

type PerformanceCategory = 'Excellent' | 'Good' | 'Fair' | 'Poor';

@Injectable()
export class GetCompletedProjectsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  /**
   * Execute the use case
   */
  async execute(
    filters: CompletedProjectsFiltersDto,
  ): Promise<CompletedProjectsResponseDto> {
    const now = new Date();
    const month = filters.month || now.getMonth() + 1;
    const year = filters.year || now.getFullYear();

    // Build base filter
    const baseFilter = this.buildBaseFilter(filters, month, year);

    // Get completed projects
    const projects = await this.prisma.project.findMany({
      where: {
        ...baseFilter,
        status: ProjectStatus.COMPLETED,
      },
      select: {
        id: true,
        projectCode: true,
        name: true,
        plannedStartDate: true,
        actualStartDate: true,
        plannedEndDate: true,
        actualEndDate: true,
        completionPercentage: true,
        budget: true,
        managerId: true,
        siteId: true,
      },
    });

    // Get costs for all projects
    const projectIds = projects.map((p) => p.id);
    const costs = await this.getCosts(projectIds);

    // Build completed project items
    const completedItems: CompletedProjectItemDto[] = projects
      .map((project) => {
        const budget = project.budget ? Number(project.budget) : 0;
        const actualCost = costs.get(project.id) || 0;
        const budgetVariance = budget - actualCost;
        const budgetPerformance = budget > 0 ? (actualCost / budget) * 100 : 0;
        const withinBudget = budgetPerformance <= 105; // 5% tolerance

        // Calculate duration metrics
        const { actualDuration, plannedDuration, durationVariance, onTime } =
          this.calculateDurationMetrics(
            project.plannedStartDate,
            project.actualStartDate,
            project.plannedEndDate,
            project.actualEndDate,
          );

        // Calculate project score
        const projectScore = this.calculateProjectScore(
          onTime,
          withinBudget,
          budgetPerformance,
          durationVariance,
          plannedDuration,
        );

        // Determine success
        const isSuccessful = onTime && withinBudget && projectScore >= 60;

        // Apply successful only filter
        if (filters.successfulOnly && !isSuccessful) {
          return null;
        }

        return {
          projectId: project.id,
          projectCode: project.projectCode,
          projectName: project.name,
          managerName: undefined, // Will need to fetch separately if needed
          siteName: undefined, // Will need to fetch separately if needed
          plannedStartDate: project.plannedStartDate
            ?.toISOString()
            .split('T')[0],
          actualStartDate: project.actualStartDate?.toISOString().split('T')[0],
          plannedEndDate: project.plannedEndDate?.toISOString().split('T')[0],
          actualEndDate: project.actualEndDate?.toISOString().split('T')[0],
          actualDuration,
          plannedDuration,
          durationVariance,
          onTime,
          budget: this.baseReportService.roundNumber(budget),
          actualCost: this.baseReportService.roundNumber(actualCost),
          budgetVariance: this.baseReportService.roundNumber(budgetVariance),
          budgetPerformance:
            this.baseReportService.roundNumber(budgetPerformance),
          withinBudget,
          isSuccessful,
          projectScore: this.baseReportService.roundNumber(projectScore),
        };
      })
      .filter((item) => item !== null) as CompletedProjectItemDto[];

    // Sort projects
    const sortedProjects = this.sortProjects(
      completedItems,
      filters.sortBy || 'projectScore',
    );

    // Calculate performance summary
    const performanceSummary = this.calculatePerformanceSummary(sortedProjects);

    // Calculate totals
    const totalCompleted = sortedProjects.length;
    const successfulCount = sortedProjects.filter((p) => p.isSuccessful).length;
    const successRate =
      totalCompleted > 0 ? (successfulCount / totalCompleted) * 100 : 0;
    const onTimeCount = sortedProjects.filter((p) => p.onTime).length;
    const withinBudgetCount = sortedProjects.filter(
      (p) => p.withinBudget,
    ).length;

    const avgDuration =
      totalCompleted > 0
        ? sortedProjects.reduce((sum, p) => sum + p.actualDuration, 0) /
          totalCompleted
        : 0;

    const avgDurationVariance =
      totalCompleted > 0
        ? sortedProjects.reduce((sum, p) => sum + p.durationVariance, 0) /
          totalCompleted
        : 0;

    const avgBudgetPerformance =
      totalCompleted > 0
        ? sortedProjects.reduce((sum, p) => sum + p.budgetPerformance, 0) /
          totalCompleted
        : 0;

    const avgProjectScore =
      totalCompleted > 0
        ? sortedProjects.reduce((sum, p) => sum + p.projectScore, 0) /
          totalCompleted
        : 0;

    const totalBudget = sortedProjects.reduce((sum, p) => sum + p.budget, 0);
    const totalActualCost = sortedProjects.reduce(
      (sum, p) => sum + p.actualCost,
      0,
    );
    const totalSaved = totalBudget - totalActualCost;

    return {
      projects: sortedProjects,
      performanceSummary,
      totalCompleted,
      successfulCount,
      successRate: this.baseReportService.roundNumber(successRate),
      onTimeCount,
      withinBudgetCount,
      avgDuration: this.baseReportService.roundNumber(avgDuration),
      avgDurationVariance:
        this.baseReportService.roundNumber(avgDurationVariance),
      avgBudgetPerformance:
        this.baseReportService.roundNumber(avgBudgetPerformance),
      avgProjectScore: this.baseReportService.roundNumber(avgProjectScore),
      totalBudget: this.baseReportService.roundNumber(totalBudget),
      totalActualCost: this.baseReportService.roundNumber(totalActualCost),
      totalSaved: this.baseReportService.roundNumber(totalSaved),
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
    filters: CompletedProjectsFiltersDto,
    month: number,
    year: number,
  ): Prisma.ProjectWhereInput {
    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
    };

    // Use completion date filters if specified
    if (filters.completionMonth && filters.completionYear) {
      const startDate = new Date(
        filters.completionYear,
        filters.completionMonth - 1,
        1,
      );
      const endDate = new Date(
        filters.completionYear,
        filters.completionMonth,
        0,
        23,
        59,
        59,
        999,
      );
      where.actualEndDate = { gte: startDate, lte: endDate };
    } else {
      // Default to filter by updated date
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      where.updatedAt = { gte: startDate, lte: endDate };
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
   * Get costs for projects
   */
  private async getCosts(projectIds: string[]): Promise<Map<string, number>> {
    if (projectIds.length === 0) {
      return new Map();
    }

    const costs = await this.prisma.cost.groupBy({
      by: ['projectId'],
      where: { projectId: { in: projectIds } },
      _sum: { amount: true },
    });

    const costMap = new Map<string, number>();
    costs.forEach((cost) => {
      if (cost.projectId) {
        costMap.set(
          cost.projectId,
          cost._sum.amount ? Number(cost._sum.amount) : 0,
        );
      }
    });

    return costMap;
  }

  /**
   * Calculate duration metrics
   */
  private calculateDurationMetrics(
    plannedStart: Date | null,
    actualStart: Date | null,
    plannedEnd: Date | null,
    actualEnd: Date | null,
  ) {
    // Actual duration
    const actualDuration =
      actualStart && actualEnd
        ? Math.ceil(
            (actualEnd.getTime() - actualStart.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;

    // Planned duration
    const plannedDuration =
      plannedStart && plannedEnd
        ? Math.ceil(
            (plannedEnd.getTime() - plannedStart.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;

    // Duration variance (negative = took longer)
    const durationVariance = plannedDuration - actualDuration;

    // On time if completed within 5% tolerance
    const tolerance = plannedDuration * 0.05;
    const onTime = Math.abs(durationVariance) <= tolerance;

    return {
      actualDuration,
      plannedDuration,
      durationVariance,
      onTime,
    };
  }

  /**
   * Calculate project score (0-100)
   *
   * Scoring criteria:
   * - Time performance: 40 points
   * - Budget performance: 40 points
   * - Overall quality: 20 points
   */
  private calculateProjectScore(
    onTime: boolean,
    withinBudget: boolean,
    budgetPerformance: number,
    durationVariance: number,
    plannedDuration: number,
  ): number {
    let score = 0;

    // Time performance (40 points)
    if (plannedDuration > 0) {
      const durationPerformance = Math.abs(durationVariance) / plannedDuration;
      if (durationPerformance <= 0.05) {
        score += 40; // Perfect timing
      } else if (durationPerformance <= 0.1) {
        score += 35; // Good timing
      } else if (durationPerformance <= 0.2) {
        score += 25; // Acceptable
      } else if (durationPerformance <= 0.3) {
        score += 15; // Below average
      } else {
        score += 5; // Poor
      }
    } else {
      score += 20; // No data, give partial credit
    }

    // Budget performance (40 points)
    if (budgetPerformance <= 95) {
      score += 40; // Under budget
    } else if (budgetPerformance <= 100) {
      score += 38; // On budget
    } else if (budgetPerformance <= 105) {
      score += 35; // Slightly over
    } else if (budgetPerformance <= 110) {
      score += 25; // Over budget
    } else if (budgetPerformance <= 120) {
      score += 15; // Significantly over
    } else {
      score += 5; // Way over budget
    }

    // Overall quality (20 points)
    if (onTime && withinBudget) {
      score += 20; // Both criteria met
    } else if (onTime || withinBudget) {
      score += 10; // One criterion met
    } else {
      score += 5; // Neither met
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate performance summary
   */
  private calculatePerformanceSummary(
    projects: CompletedProjectItemDto[],
  ): PerformanceCategorySummaryDto[] {
    const categoryMap = new Map<
      PerformanceCategory,
      { count: number; totalScore: number }
    >();

    projects.forEach((project) => {
      const category = this.categorizePerformance(project.projectScore);

      if (!categoryMap.has(category)) {
        categoryMap.set(category, { count: 0, totalScore: 0 });
      }

      const data = categoryMap.get(category)!;
      data.count++;
      data.totalScore += project.projectScore;
    });

    const totalProjects = projects.length;

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      projectCount: data.count,
      percentage: this.baseReportService.calculatePercentage(
        data.count,
        totalProjects,
      ),
      avgScore: this.baseReportService.roundNumber(
        data.count > 0 ? data.totalScore / data.count : 0,
      ),
    }));
  }

  /**
   * Categorize performance
   */
  private categorizePerformance(score: number): PerformanceCategory {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  }

  /**
   * Sort projects
   */
  private sortProjects(
    projects: CompletedProjectItemDto[],
    sortBy:
      | 'projectScore'
      | 'actualDuration'
      | 'budgetPerformance'
      | 'completionDate',
  ): CompletedProjectItemDto[] {
    return projects.sort((a, b) => {
      let aValue: number | Date;
      let bValue: number | Date;

      switch (sortBy) {
        case 'projectScore':
          aValue = a.projectScore;
          bValue = b.projectScore;
          return bValue - aValue; // Descending
        case 'actualDuration':
          aValue = a.actualDuration;
          bValue = b.actualDuration;
          return aValue - bValue; // Ascending
        case 'budgetPerformance':
          aValue = a.budgetPerformance;
          bValue = b.budgetPerformance;
          return aValue - bValue; // Ascending
        case 'completionDate':
          aValue = a.actualEndDate ? new Date(a.actualEndDate).getTime() : 0;
          bValue = b.actualEndDate ? new Date(b.actualEndDate).getTime() : 0;
          return bValue - aValue; // Most recent first
        default:
          return 0;
      }
    });
  }
}
