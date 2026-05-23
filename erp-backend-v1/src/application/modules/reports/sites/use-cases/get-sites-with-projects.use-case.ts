import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  SitesWithProjectsFiltersDto,
  SitesWithProjectsResponseDto,
  SiteWithProjectsDetailDto,
  ProjectSummaryDto,
} from '../dto';
import { Prisma } from '@prisma/client';

/**
 * Use Case: Sites With Projects Report
 *
 * Analysis of project distribution across sites.
 * Links sites with their associated projects for portfolio management.
 *
 * Business Value:
 * - Understand project concentration and risk distribution
 * - Identify sites without active projects (underutilized)
 * - Support project allocation decisions
 * - Track total project value and budget by site
 */
@Injectable()
export class GetSitesWithProjectsUseCase {
  private readonly logger = new Logger(GetSitesWithProjectsUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: SitesWithProjectsFiltersDto,
  ): Promise<SitesWithProjectsResponseDto> {
    try {
      const whereClause = this.buildWhereClause(filters);

      // Get all sites with their project counts
      const sites = await this.prisma.site.findMany({
        where: whereClause,
        select: {
          id: true,
          code: true,
          name: true,
          area: true,
          city: true,
          projects: {
            where: { deletedAt: null },
            select: {
              id: true,
              projectCode: true,
              name: true,
              status: true,
              budget: true,
              completionPercentage: true,
            },
          },
        },
      });

      const siteDetails = this.getSiteProjectDetails(sites, filters);
      const totalSites = await this.prisma.site.count({
        where: { deletedAt: null },
      });
      const sitesWithProjects = siteDetails.filter(
        (s) => s.activeProjectCount > 0,
      ).length;
      const totalProjectCount = siteDetails.reduce(
        (sum, s) => sum + s.activeProjectCount,
        0,
      );

      this.logger.debug(
        `Sites with projects report generated: ${siteDetails.length} sites, ${totalProjectCount} total projects`,
      );

      return {
        sites: siteDetails,
        totalSites,
        sitesWithProjects,
        sitesWithoutProjects: totalSites - sitesWithProjects,
        totalProjectCount,
      };
    } catch (error) {
      this.logger.error(
        `Error generating sites with projects report: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Build WHERE clause for filtering sites
   */
  private buildWhereClause(
    filters: SitesWithProjectsFiltersDto,
  ): Prisma.SiteWhereInput {
    const where: Prisma.SiteWhereInput = {
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.city) {
      where.city = {
        contains: filters.city,
        mode: 'insensitive' as Prisma.QueryMode,
      };
    }

    return where;
  }

  /**
   * Get detailed project information per site
   */
  private getSiteProjectDetails(
    sites: Array<{
      id: string;
      code: string;
      name: string;
      area: Prisma.Decimal | null;
      city: string;
      projects: Array<{
        id: string;
        projectCode: string;
        name: string;
        status: string;
        budget: Prisma.Decimal | null;
        completionPercentage: Prisma.Decimal;
      }>;
    }>,
    filters: SitesWithProjectsFiltersDto,
  ): SiteWithProjectsDetailDto[] {
    let details = sites.map((site) => {
      const activeProjects = site.projects.filter(
        (p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED',
      ).length;
      const totalProjectBudget = site.projects.reduce(
        (sum, p) => sum + Number(p.budget || 0),
        0,
      );

      return {
        siteId: site.id,
        siteCode: site.code,
        siteName: site.name,
        activeProjectCount: activeProjects,
        totalProjectCount: site.projects.length,
        area: Math.round(Number(site.area || 0) * 100) / 100,
        city: site.city,
        projects: filters.includeProjectDetails
          ? site.projects.map(
              (p) =>
                ({
                  projectId: p.id,
                  projectCode: p.projectCode,
                  projectName: p.name,
                  status: p.status,
                  budget: filters.includeProjectFinancials
                    ? Number(p.budget || 0)
                    : undefined,
                  completionPercentage: Number(p.completionPercentage),
                }) as ProjectSummaryDto,
            )
          : undefined,
        totalProjectBudget: filters.includeProjectFinancials
          ? totalProjectBudget
          : undefined,
      };
    });

    // Filter by minimum project count
    if (filters.minProjectCount !== undefined) {
      details = details.filter(
        (d) => d.totalProjectCount >= filters.minProjectCount!,
      );
    }

    // Sort details
    if (filters.sortBy === 'projectCount') {
      details.sort((a, b) =>
        filters.sortOrder === 'desc'
          ? b.totalProjectCount - a.totalProjectCount
          : a.totalProjectCount - b.totalProjectCount,
      );
    } else if (filters.sortBy === 'area') {
      details.sort((a, b) =>
        filters.sortOrder === 'desc' ? b.area - a.area : a.area - b.area,
      );
    } else {
      // Sort by name
      details.sort((a, b) =>
        filters.sortOrder === 'desc'
          ? b.siteName.localeCompare(a.siteName)
          : a.siteName.localeCompare(b.siteName),
      );
    }

    return details;
  }
}
