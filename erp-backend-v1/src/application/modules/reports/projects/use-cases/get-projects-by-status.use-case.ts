/**
 * ============================================================================
 * GET PROJECTS BY STATUS USE CASE
 * ============================================================================
 *
 * Groups projects by status with detailed metrics per status
 *
 * Features:
 * - Status breakdown with counts and percentages
 * - Budget and cost analysis per status
 * - Sortable results
 * - Minimum project threshold filtering
 * - Localized status names (EN/AR)
 *
 * @module GetProjectsByStatusUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import {
  ProjectsByStatusFiltersDto,
  ProjectsByStatusResponseDto,
  StatusBreakdownItemDto,
} from '../dto';
import { ProjectStatus, Prisma } from '@prisma/client';

@Injectable()
export class GetProjectsByStatusUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  /**
   * Execute the use case
   */
  async execute(
    filters: ProjectsByStatusFiltersDto,
  ): Promise<ProjectsByStatusResponseDto> {
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
        status: true,
        budget: true,
        completionPercentage: true,
      },
    });

    // Get costs for all projects
    const projectIds = projects.map((p) => p.id);
    const costs = await this.getCosts(projectIds);

    // Group by status manually
    const statusMap = new Map<
      ProjectStatus,
      Array<{
        id: string;
        budget: number;
        completion: number;
        actualCost: number;
      }>
    >();

    projects.forEach((project) => {
      if (!statusMap.has(project.status)) {
        statusMap.set(project.status, []);
      }

      statusMap.get(project.status)!.push({
        id: project.id,
        budget: project.budget ? Number(project.budget) : 0,
        completion: Number(project.completionPercentage || 0),
        actualCost: costs.get(project.id) || 0,
      });
    });

    // Calculate totals
    const totalProjects = projects.length;
    const totalBudget = projects.reduce(
      (sum, p) => sum + (p.budget ? Number(p.budget) : 0),
      0,
    );
    const totalActualCost = Array.from(costs.values()).reduce(
      (sum, cost) => sum + cost,
      0,
    );

    // Build status items
    let items: StatusBreakdownItemDto[] = Array.from(statusMap.entries()).map(
      ([status, projectsInStatus]) => {
        const projectCount = projectsInStatus.length;
        const statusBudget = projectsInStatus.reduce(
          (sum, p) => sum + p.budget,
          0,
        );
        const statusCost = projectsInStatus.reduce(
          (sum, p) => sum + p.actualCost,
          0,
        );
        const avgCompletion =
          projectCount > 0
            ? projectsInStatus.reduce((sum, p) => sum + p.completion, 0) /
              projectCount
            : 0;
        const avgBudgetUtilization =
          statusBudget > 0 ? (statusCost / statusBudget) * 100 : 0;

        return {
          status,
          statusName: this.getStatusName(status),
          statusNameAr: this.getStatusNameAr(status),
          projectCount,
          percentage: this.baseReportService.calculatePercentage(
            projectCount,
            totalProjects,
          ),
          totalBudget: this.baseReportService.roundNumber(statusBudget),
          totalActualCost: this.baseReportService.roundNumber(statusCost),
          budgetVariance: this.baseReportService.roundNumber(
            statusBudget - statusCost,
          ),
          avgCompletion: this.baseReportService.roundNumber(avgCompletion),
          avgBudgetUtilization:
            this.baseReportService.roundNumber(avgBudgetUtilization),
        };
      },
    );

    // Apply minimum projects filter
    if (filters.minProjects && filters.minProjects > 1) {
      items = items.filter((item) => item.projectCount >= filters.minProjects!);
    }

    // Apply sorting
    items = this.sortItems(items, filters.sortBy, filters.sortOrder);

    return {
      items,
      totalProjects,
      totalBudget: this.baseReportService.roundNumber(totalBudget),
      totalActualCost: this.baseReportService.roundNumber(totalActualCost),
      currency: 'SAR',
      month,
      year,
      generatedAt: new Date(),
    };
  }

  /**
   * Build base Prisma filter
   */
  private buildBaseFilter(
    filters: ProjectsByStatusFiltersDto,
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
   * Sort items based on sortBy and sortOrder
   */
  private sortItems(
    items: StatusBreakdownItemDto[],
    sortBy?: 'count' | 'budget' | 'completion' | 'actualCost',
    sortOrder?: 'asc' | 'desc',
  ): StatusBreakdownItemDto[] {
    const order = sortOrder || 'desc';
    const field = sortBy || 'count';

    return items.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (field) {
        case 'count':
          aValue = a.projectCount;
          bValue = b.projectCount;
          break;
        case 'budget':
          aValue = a.totalBudget;
          bValue = b.totalBudget;
          break;
        case 'completion':
          aValue = a.avgCompletion;
          bValue = b.avgCompletion;
          break;
        case 'actualCost':
          aValue = a.totalActualCost;
          bValue = b.totalActualCost;
          break;
        default:
          aValue = a.projectCount;
          bValue = b.projectCount;
      }

      return order === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }

  /**
   * Get English status name
   */
  private getStatusName(status: ProjectStatus): string {
    const names: Record<ProjectStatus, string> = {
      DRAFT: 'Draft',
      PLANNING: 'Planning',
      ACTIVE: 'Active',
      ON_HOLD: 'On Hold',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      ARCHIVED: 'Archived',
    };
    return names[status];
  }

  /**
   * Get Arabic status name
   */
  private getStatusNameAr(status: ProjectStatus): string {
    const names: Record<ProjectStatus, string> = {
      DRAFT: 'مسودة',
      PLANNING: 'تخطيط',
      ACTIVE: 'نشط',
      ON_HOLD: 'معلق',
      COMPLETED: 'مكتمل',
      CANCELLED: 'ملغي',
      ARCHIVED: 'مؤرشف',
    };
    return names[status];
  }
}
