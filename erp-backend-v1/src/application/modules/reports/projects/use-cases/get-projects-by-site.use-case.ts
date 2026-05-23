/**
 * ============================================================================
 * GET PROJECTS BY SITE USE CASE
 * ============================================================================
 *
 * Geographic/Site-based distribution of projects
 *
 * Features:
 * - Site grouping with project counts
 * - Status breakdown per site
 * - Budget analysis per site
 * - Sortable results
 * - Site relation handling
 *
 * @module GetProjectsBySiteUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import {
  ProjectsBySiteFiltersDto,
  ProjectsBySiteResponseDto,
  SiteBreakdownItemDto,
} from '../dto';
import { ProjectStatus, Prisma } from '@prisma/client';

@Injectable()
export class GetProjectsBySiteUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  /**
   * Execute the use case
   */
  async execute(
    filters: ProjectsBySiteFiltersDto,
  ): Promise<ProjectsBySiteResponseDto> {
    const now = new Date();
    const month = filters.month || now.getMonth() + 1;
    const year = filters.year || now.getFullYear();

    // Build base filter
    const baseFilter = this.buildBaseFilter(filters, month, year);

    // Get all projects with site relation
    const projects = await this.prisma.project.findMany({
      where: {
        ...baseFilter,
        siteId: { not: null }, // Only projects with site
      },
      select: {
        id: true,
        siteId: true,
        status: true,
        budget: true,
        completionPercentage: true,
        site: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Get costs for all projects
    const projectIds = projects.map((p) => p.id);
    const costs = await this.getCosts(projectIds);

    // Group by site manually
    const siteMap = new Map<
      string,
      {
        site: {
          id: string;
          name: string;
          code: string;
        };
        projects: Array<{
          status: ProjectStatus;
          budget: number;
          completion: number;
          actualCost: number;
        }>;
      }
    >();

    projects.forEach((project) => {
      if (!project.siteId || !project.site) return;

      if (!siteMap.has(project.siteId)) {
        siteMap.set(project.siteId, {
          site: project.site,
          projects: [],
        });
      }

      siteMap.get(project.siteId)!.projects.push({
        status: project.status,
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

    // Build site items
    let sites: SiteBreakdownItemDto[] = Array.from(siteMap.entries()).map(
      ([siteId, siteData]) => {
        const projectCount = siteData.projects.length;
        const activeCount = siteData.projects.filter(
          (p) => p.status === ProjectStatus.ACTIVE,
        ).length;
        const completedCount = siteData.projects.filter(
          (p) => p.status === ProjectStatus.COMPLETED,
        ).length;
        const onHoldCount = siteData.projects.filter(
          (p) => p.status === ProjectStatus.ON_HOLD,
        ).length;

        const siteBudget = siteData.projects.reduce(
          (sum, p) => sum + p.budget,
          0,
        );
        const siteCost = siteData.projects.reduce(
          (sum, p) => sum + p.actualCost,
          0,
        );
        const avgCompletion =
          projectCount > 0
            ? siteData.projects.reduce((sum, p) => sum + p.completion, 0) /
              projectCount
            : 0;
        const completionRate =
          projectCount > 0 ? (completedCount / projectCount) * 100 : 0;

        return {
          siteId,
          siteName: siteData.site.name,
          siteCode: siteData.site.code,
          projectCount,
          activeCount,
          completedCount,
          onHoldCount,
          totalBudget: this.baseReportService.roundNumber(siteBudget),
          totalActualCost: this.baseReportService.roundNumber(siteCost),
          budgetVariance: this.baseReportService.roundNumber(
            siteBudget - siteCost,
          ),
          avgCompletion: this.baseReportService.roundNumber(avgCompletion),
          completionRate: this.baseReportService.roundNumber(completionRate),
          percentageOfTotal: this.baseReportService.calculatePercentage(
            siteBudget,
            totalBudget,
          ),
        };
      },
    );

    // Apply minimum projects filter
    if (filters.minProjects && filters.minProjects > 1) {
      sites = sites.filter((site) => site.projectCount >= filters.minProjects!);
    }

    // Apply sorting
    sites = this.sortSites(sites, filters.sortBy, filters.sortOrder);

    return {
      sites,
      totalProjects,
      totalSites: sites.length,
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
    filters: ProjectsBySiteFiltersDto,
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
   * Sort sites based on sortBy and sortOrder
   */
  private sortSites(
    sites: SiteBreakdownItemDto[],
    sortBy?: 'projectCount' | 'totalBudget' | 'activeCount' | 'completionRate',
    sortOrder?: 'asc' | 'desc',
  ): SiteBreakdownItemDto[] {
    const order = sortOrder || 'desc';
    const field = sortBy || 'projectCount';

    return sites.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (field) {
        case 'projectCount':
          aValue = a.projectCount;
          bValue = b.projectCount;
          break;
        case 'totalBudget':
          aValue = a.totalBudget;
          bValue = b.totalBudget;
          break;
        case 'activeCount':
          aValue = a.activeCount;
          bValue = b.activeCount;
          break;
        case 'completionRate':
          aValue = a.completionRate;
          bValue = b.completionRate;
          break;
        default:
          aValue = a.projectCount;
          bValue = b.projectCount;
      }

      return order === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }
}
