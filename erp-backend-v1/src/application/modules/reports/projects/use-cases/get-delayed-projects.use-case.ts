/**
 * ============================================================================
 * GET DELAYED PROJECTS USE CASE
 * ============================================================================
 *
 * Analysis of delayed projects with risk assessment
 *
 * Features:
 * - Delay categorization (Minor/Moderate/Major/Critical)
 * - Budget at risk calculation
 * - Critical project identification
 * - Delay reason tracking
 * - Risk assessment metrics
 *
 * @module GetDelayedProjectsUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import {
  DelayedProjectsFiltersDto,
  DelayedProjectsResponseDto,
  DelayedProjectItemDto,
  DelayCategorySummaryDto,
} from '../dto';
import { ProjectStatus, Prisma } from '@prisma/client';

type DelayCategory = 'Minor' | 'Moderate' | 'Major' | 'Critical';

@Injectable()
export class GetDelayedProjectsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  /**
   * Execute the use case
   */
  async execute(
    filters: DelayedProjectsFiltersDto,
  ): Promise<DelayedProjectsResponseDto> {
    const now = new Date();
    const month = filters.month || now.getMonth() + 1;
    const year = filters.year || now.getFullYear();

    // Build base filter
    const baseFilter = this.buildBaseFilter(filters, month, year);

    // Get all active/planning projects
    const projects = await this.prisma.project.findMany({
      where: {
        ...baseFilter,
        status: { in: [ProjectStatus.ACTIVE, ProjectStatus.PLANNING] },
        plannedEndDate: { not: null },
      },
      select: {
        id: true,
        projectCode: true,
        name: true,
        status: true,
        plannedStartDate: true,
        actualStartDate: true,
        plannedEndDate: true,
        completionPercentage: true,
        budget: true,
        progressNotes: true,
        lastProgressUpdate: true,
        managerId: true,
        siteId: true,
      },
    });

    // Get costs for all projects
    const projectIds = projects.map((p) => p.id);
    const costs = await this.getCosts(projectIds);

    // Calculate delay and filter delayed projects
    const currentDate = new Date();
    const delayedItems: DelayedProjectItemDto[] = projects
      .map((project) => {
        const completion = Number(project.completionPercentage || 0);
        const budget = project.budget ? Number(project.budget) : 0;
        const actualCost = costs.get(project.id) || 0;

        // Calculate expected completion date
        const { expectedCompletionDate, delayDays } =
          this.calculateExpectedCompletion(
            project.actualStartDate,
            project.plannedEndDate!,
            completion,
            currentDate,
          );

        // Only include delayed projects
        if (delayDays <= 0) {
          return null;
        }

        // Apply minimum delay filter
        if (filters.minDelayDays && delayDays < filters.minDelayDays) {
          return null;
        }

        const isCritical = this.isCriticalDelay(delayDays, completion);

        // Apply at-risk filter
        if (filters.atRiskOnly && !isCritical) {
          return null;
        }

        const delayCategory = this.categorizeDelay(delayDays);
        const budgetAtRisk = isCritical ? budget - actualCost : 0;
        const delayReason = this.inferDelayReason(
          project.progressNotes,
          completion,
          delayDays,
        );

        return {
          projectId: project.id,
          projectCode: project.projectCode,
          projectName: project.name,
          status: project.status,
          managerName: undefined, // Will need to fetch separately if needed
          siteName: undefined, // Will need to fetch separately if needed
          plannedStartDate: project.plannedStartDate
            ?.toISOString()
            .split('T')[0],
          actualStartDate: project.actualStartDate?.toISOString().split('T')[0],
          plannedEndDate: project.plannedEndDate!.toISOString().split('T')[0],
          expectedCompletionDate: expectedCompletionDate
            .toISOString()
            .split('T')[0],
          completionPercentage: this.baseReportService.roundNumber(completion),
          budget: this.baseReportService.roundNumber(budget),
          actualCost: this.baseReportService.roundNumber(actualCost),
          delayDays,
          delayCategory,
          isCritical,
          budgetAtRisk: this.baseReportService.roundNumber(budgetAtRisk),
          delayReason,
          lastProgressUpdate: project.lastProgressUpdate
            ?.toISOString()
            .split('T')[0],
        };
      })
      .filter((item) => item !== null) as DelayedProjectItemDto[];

    // Sort delayed projects
    const sortedProjects = this.sortProjects(
      delayedItems,
      filters.sortBy || 'delayDays',
    );

    // Calculate delay summary
    const delaySummary = this.calculateDelaySummary(sortedProjects);

    // Calculate totals
    const totalDelayedProjects = sortedProjects.length;
    const criticalProjectsCount = sortedProjects.filter(
      (p) => p.isCritical,
    ).length;
    const avgDelayDays =
      totalDelayedProjects > 0
        ? sortedProjects.reduce((sum, p) => sum + p.delayDays, 0) /
          totalDelayedProjects
        : 0;
    const maxDelayDays =
      totalDelayedProjects > 0
        ? Math.max(...sortedProjects.map((p) => p.delayDays))
        : 0;
    const totalBudgetAtRisk = sortedProjects.reduce(
      (sum, p) => sum + p.budgetAtRisk,
      0,
    );
    const avgCompletion =
      totalDelayedProjects > 0
        ? sortedProjects.reduce((sum, p) => sum + p.completionPercentage, 0) /
          totalDelayedProjects
        : 0;

    // Calculate percentage of active projects
    const activeProjects = await this.prisma.project.count({
      where: {
        status: ProjectStatus.ACTIVE,
        deletedAt: null,
      },
    });
    const percentageOfActive =
      activeProjects > 0 ? (totalDelayedProjects / activeProjects) * 100 : 0;

    return {
      projects: sortedProjects,
      delaySummary,
      totalDelayedProjects,
      criticalProjectsCount,
      avgDelayDays: this.baseReportService.roundNumber(avgDelayDays),
      maxDelayDays,
      totalBudgetAtRisk: this.baseReportService.roundNumber(totalBudgetAtRisk),
      avgCompletion: this.baseReportService.roundNumber(avgCompletion),
      percentageOfActive:
        this.baseReportService.roundNumber(percentageOfActive),
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
    filters: DelayedProjectsFiltersDto,
    month: number,
    year: number,
  ): Prisma.ProjectWhereInput {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
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
   * Calculate expected completion date and delay
   */
  private calculateExpectedCompletion(
    actualStart: Date | null,
    plannedEnd: Date,
    completion: number,
    currentDate: Date,
  ): { expectedCompletionDate: Date; delayDays: number } {
    let expectedCompletionDate: Date;

    if (actualStart && completion > 0 && completion < 100) {
      // Calculate based on current progress rate
      const elapsedDays = Math.ceil(
        (currentDate.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      const daysToComplete = (elapsedDays / completion) * 100;
      expectedCompletionDate = new Date(
        actualStart.getTime() + daysToComplete * 24 * 60 * 60 * 1000,
      );
    } else {
      // Use planned end date
      expectedCompletionDate = plannedEnd;
    }

    // Calculate delay (positive = delayed)
    const delayDays = Math.ceil(
      (expectedCompletionDate.getTime() - plannedEnd.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return { expectedCompletionDate, delayDays };
  }

  /**
   * Determine if delay is critical
   */
  private isCriticalDelay(delayDays: number, completion: number): boolean {
    // Critical if:
    // - Delay > 60 days OR
    // - Delay > 30 days AND completion < 50%
    return delayDays > 60 || (delayDays > 30 && completion < 50);
  }

  /**
   * Categorize delay
   */
  private categorizeDelay(delayDays: number): DelayCategory {
    if (delayDays > 60) return 'Critical';
    if (delayDays > 30) return 'Major';
    if (delayDays > 7) return 'Moderate';
    return 'Minor';
  }

  /**
   * Infer delay reason from progress notes
   */
  private inferDelayReason(
    progressNotes: string | null,
    completion: number,
    delayDays: number,
  ): string {
    // Simple inference logic
    if (completion < 10) {
      return 'Project not started or in early stages';
    }
    if (completion < 30) {
      return 'Slow initial progress';
    }
    if (delayDays > 60) {
      return 'Significant delays affecting project timeline';
    }
    if (progressNotes && progressNotes.length > 0) {
      return 'See progress notes for details';
    }
    return 'Behind schedule';
  }

  /**
   * Calculate delay summary
   */
  private calculateDelaySummary(
    projects: DelayedProjectItemDto[],
  ): DelayCategorySummaryDto[] {
    const categoryMap = new Map<
      string,
      { count: number; totalDelay: number; totalBudgetAtRisk: number }
    >();

    projects.forEach((project) => {
      if (!categoryMap.has(project.delayCategory)) {
        categoryMap.set(project.delayCategory, {
          count: 0,
          totalDelay: 0,
          totalBudgetAtRisk: 0,
        });
      }

      const data = categoryMap.get(project.delayCategory)!;
      data.count++;
      data.totalDelay += project.delayDays;
      data.totalBudgetAtRisk += project.budgetAtRisk;
    });

    const totalProjects = projects.length;

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      projectCount: data.count,
      percentage: this.baseReportService.calculatePercentage(
        data.count,
        totalProjects,
      ),
      avgDelayDays: this.baseReportService.roundNumber(
        data.count > 0 ? data.totalDelay / data.count : 0,
      ),
      totalBudgetAtRisk: this.baseReportService.roundNumber(
        data.totalBudgetAtRisk,
      ),
    }));
  }

  /**
   * Sort projects
   */
  private sortProjects(
    projects: DelayedProjectItemDto[],
    sortBy: 'delayDays' | 'completion' | 'budgetAtRisk',
  ): DelayedProjectItemDto[] {
    return projects.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case 'delayDays':
          aValue = a.delayDays;
          bValue = b.delayDays;
          break;
        case 'completion':
          aValue = a.completionPercentage;
          bValue = b.completionPercentage;
          break;
        case 'budgetAtRisk':
          aValue = a.budgetAtRisk;
          bValue = b.budgetAtRisk;
          break;
      }

      return bValue - aValue; // Descending (most delayed first)
    });
  }
}
