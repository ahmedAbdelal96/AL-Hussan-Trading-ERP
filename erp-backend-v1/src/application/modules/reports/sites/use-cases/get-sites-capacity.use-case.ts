import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  SitesCapacityFiltersDto,
  SitesCapacityResponseDto,
  SiteCapacityDetailDto,
  CapacityAggregateDto,
} from '../dto';
import { Prisma } from '@prisma/client';

/**
 * Use Case: Sites Capacity & Utilization Report
 *
 * Detailed analysis of site capacity utilization and resource efficiency.
 * Identifies underutilized and over-capacity sites for optimization decisions.
 *
 * Business Value:
 * - Identify optimization opportunities through utilization analysis
 * - Support capacity expansion or consolidation decisions
 * - Detect underutilized sites (candidates for closure or repurposing)
 * - Optimize resource allocation based on available capacity
 */
@Injectable()
export class GetSitesCapacityUseCase {
  private readonly logger = new Logger(GetSitesCapacityUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: SitesCapacityFiltersDto,
  ): Promise<SitesCapacityResponseDto> {
    try {
      const whereClause = this.buildWhereClause(filters);

      // Get all sites with project counts for utilization calculation
      const sites = await this.prisma.site.findMany({
        where: whereClause,
        select: {
          id: true,
          code: true,
          name: true,
          capacity: true,
          area: true,
          status: true,
          projects: {
            where: { deletedAt: null },
            select: { id: true },
          },
        },
      });

      const aggregate = this.getCapacityAggregate(sites);
      const siteDetails = this.getSiteCapacityDetails(sites, filters);
      const underutilizedCount = filters.includeUnderUtilized
        ? this.countUnderutilizedSites(sites)
        : 0;

      this.logger.debug(
        `Sites capacity report generated: ${siteDetails.length} sites, ${underutilizedCount} underutilized`,
      );

      return {
        aggregate,
        sites: siteDetails,
        underutilizedSitesCount: underutilizedCount,
      };
    } catch (error) {
      this.logger.error(
        `Error generating sites capacity report: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Build WHERE clause for filtering sites
   */
  private buildWhereClause(
    filters: SitesCapacityFiltersDto,
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

    if (filters.minCapacity !== undefined) {
      where.capacity = { gte: filters.minCapacity };
    }

    if (filters.maxCapacity !== undefined) {
      if (where.capacity && typeof where.capacity === 'object') {
        (where.capacity as any).lte = filters.maxCapacity;
      } else {
        where.capacity = { lte: filters.maxCapacity };
      }
    }

    return where;
  }

  /**
   * Calculate aggregate capacity metrics across all filtered sites
   */
  private getCapacityAggregate(
    sites: Array<{
      capacity: number | null;
      area: Prisma.Decimal | null;
      projects: Array<{ id: string }>;
    }>,
  ): CapacityAggregateDto {
    const totalCapacity = sites.reduce(
      (sum, site) => sum + (site.capacity || 0),
      0,
    );
    const totalArea = sites.reduce(
      (sum, site) => sum + Number(site.area || 0),
      0,
    );

    // Calculate used capacity (assume each project uses ~50 capacity)
    const usedCapacity = sites.reduce(
      (sum, site) =>
        sum + Math.min(site.projects.length * 50, site.capacity || 0),
      0,
    );

    const usedArea = sites.reduce(
      (sum, site) =>
        sum + (site.projects.length > 0 ? Number(site.area || 0) * 0.5 : 0),
      0,
    ); // Assume 50% utilization per project

    return {
      totalCapacity,
      usedCapacity,
      availableCapacity: Math.max(0, totalCapacity - usedCapacity),
      overallUtilizationPercentage:
        totalCapacity > 0
          ? Math.round((usedCapacity / totalCapacity) * 1000) / 10
          : 0,
      totalArea: Math.round(totalArea * 100) / 100,
      usedArea: Math.round(usedArea * 100) / 100,
      availableArea: Math.round((totalArea - usedArea) * 100) / 100,
    };
  }

  /**
   * Get detailed capacity information for each site
   */
  private getSiteCapacityDetails(
    sites: Array<{
      id: string;
      code: string;
      name: string;
      capacity: number | null;
      area: Prisma.Decimal | null;
      status: string;
      projects: Array<{ id: string }>;
    }>,
    filters: SitesCapacityFiltersDto,
  ): SiteCapacityDetailDto[] {
    let details = sites.map((site) => {
      const capacity = site.capacity || 0;
      const activeProjects = site.projects.length;
      const usedCapacity = Math.min(activeProjects * 50, capacity);
      const utilizationPercentage =
        capacity > 0 ? Math.round((usedCapacity / capacity) * 1000) / 10 : 0;

      return {
        siteId: site.id,
        siteCode: site.code,
        siteName: site.name,
        capacity,
        activeProjects,
        utilizationPercentage,
        area: Math.round(Number(site.area || 0) * 100) / 100,
        status: site.status,
      };
    });

    // Filter by utilization range if specified
    if (filters.minUtilization !== undefined) {
      details = details.filter(
        (d) => d.utilizationPercentage >= filters.minUtilization!,
      );
    }

    if (filters.maxUtilization !== undefined) {
      details = details.filter(
        (d) => d.utilizationPercentage <= filters.maxUtilization!,
      );
    }

    // Sort by capacity or utilization
    if (filters.sortBy === 'utilization') {
      details.sort((a, b) =>
        filters.sortOrder === 'desc'
          ? b.utilizationPercentage - a.utilizationPercentage
          : a.utilizationPercentage - b.utilizationPercentage,
      );
    } else if (filters.sortBy === 'area') {
      details.sort((a, b) =>
        filters.sortOrder === 'desc' ? b.area - a.area : a.area - b.area,
      );
    } else {
      // Sort by capacity
      details.sort((a, b) =>
        filters.sortOrder === 'desc'
          ? b.capacity - a.capacity
          : a.capacity - b.capacity,
      );
    }

    return details;
  }

  /**
   * Count sites with low utilization (underutilized sites)
   * Threshold: less than 25% utilization
   */
  private countUnderutilizedSites(
    sites: Array<{
      capacity: number | null;
      projects: Array<{ id: string }>;
    }>,
  ): number {
    const threshold = 0.25; // 25% utilization threshold

    return sites.filter((site) => {
      const capacity = site.capacity || 0;
      if (capacity === 0) return false;

      const usedCapacity = Math.min(site.projects.length * 50, capacity);
      const utilizationRate = usedCapacity / capacity;

      return utilizationRate < threshold;
    }).length;
  }
}
