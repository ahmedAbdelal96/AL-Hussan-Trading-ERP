import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  SitesOverviewFiltersDto,
  SitesOverviewResponseDto,
  SiteKPIDto,
  SiteCapacityMetricsDto,
  SiteStatusDistributionDto,
} from '../dto';
import { Prisma } from '@prisma/client';

/**
 * Use Case: Sites Overview Report
 *
 * Executive dashboard providing comprehensive site KPIs and metrics.
 * Aggregates all site data to provide strategic insights.
 *
 * Business Value:
 * - Real-time performance dashboard for executives
 * - Quick assessment of site portfolio health
 * - Capacity planning insights
 * - Status distribution for lifecycle management
 */
@Injectable()
export class GetSitesOverviewUseCase {
  private readonly logger = new Logger(GetSitesOverviewUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: SitesOverviewFiltersDto,
  ): Promise<SitesOverviewResponseDto> {
    try {
      const whereClause = this.buildWhereClause(filters);

      // Parallel queries for performance optimization
      const [
        totalSites,
        activeSites,
        inactiveSites,
        underPrepSites,
        closedSites,
        capacityMetrics,
        statusDistribution,
      ] = await Promise.all([
        this.prisma.site.count({ where: whereClause }),
        this.prisma.site.count({
          where: {
            ...whereClause,
            status: 'ACTIVE' as any,
          },
        }),
        this.prisma.site.count({
          where: {
            ...whereClause,
            status: 'INACTIVE' as any,
          },
        }),
        this.prisma.site.count({
          where: {
            ...whereClause,
            status: 'UNDER_PREPARATION' as any,
          },
        }),
        this.prisma.site.count({
          where: {
            ...whereClause,
            status: 'CLOSED' as any,
          },
        }),
        this.getCapacityMetrics(whereClause),
        this.getStatusDistribution(whereClause),
      ]);

      // Calculate KPIs
      const kpi: SiteKPIDto = {
        totalSites,
        activeSites,
        inactiveSites,
        underPreparationSites: underPrepSites,
        closedSites,
        activePercentage:
          totalSites > 0
            ? Math.round((activeSites / totalSites) * 1000) / 10
            : 0,
      };

      this.logger.debug(
        `Sites overview report generated: ${totalSites} total sites, ${activeSites} active`,
      );

      return {
        kpi,
        capacityMetrics,
        statusDistribution,
        reportDate: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error generating sites overview report: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Build WHERE clause for filtering sites
   * Supports date range, status, location, and area filters
   */
  private buildWhereClause(
    filters: SitesOverviewFiltersDto,
  ): Prisma.SiteWhereInput {
    const where: Prisma.SiteWhereInput = {
      deletedAt: null, // Exclude soft-deleted sites
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

    if (filters.state) {
      where.state = {
        contains: filters.state,
        mode: 'insensitive' as Prisma.QueryMode,
      };
    }

    if (filters.country) {
      where.country = {
        contains: filters.country,
        mode: 'insensitive' as Prisma.QueryMode,
      };
    }

    if (filters.minArea !== undefined || filters.maxArea !== undefined) {
      where.area = {};
      if (filters.minArea !== undefined) {
        where.area.gte = filters.minArea;
      }
      if (filters.maxArea !== undefined) {
        where.area.lte = filters.maxArea;
      }
    }

    if (
      filters.minCapacity !== undefined ||
      filters.maxCapacity !== undefined
    ) {
      where.capacity = {};
      if (filters.minCapacity !== undefined) {
        where.capacity.gte = filters.minCapacity;
      }
      if (filters.maxCapacity !== undefined) {
        where.capacity.lte = filters.maxCapacity;
      }
    }

    return where;
  }

  /**
   * Get capacity metrics aggregated across all filtered sites
   */
  private async getCapacityMetrics(
    whereClause: Prisma.SiteWhereInput,
  ): Promise<SiteCapacityMetricsDto> {
    const sites = await this.prisma.site.findMany({
      where: whereClause,
      select: {
        capacity: true,
        area: true,
        projects: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    });

    if (sites.length === 0) {
      return {
        totalCapacity: 0,
        totalArea: 0,
        averageCapacityPerSite: 0,
        averageAreaPerSite: 0,
        utilizationRate: 0,
      };
    }

    const totalCapacity = sites.reduce(
      (sum, site) => sum + (site.capacity || 0),
      0,
    );
    const totalArea = sites.reduce(
      (sum, site) => sum + Number(site.area || 0),
      0,
    );
    const usedCapacity = sites.reduce(
      (sum, site) =>
        sum + Math.min(site.projects.length * 50, site.capacity || 0),
      0,
    ); // Assuming ~50 capacity per project

    return {
      totalCapacity,
      totalArea: Math.round(totalArea * 100) / 100,
      averageCapacityPerSite:
        sites.length > 0
          ? Math.round((totalCapacity / sites.length) * 100) / 100
          : 0,
      averageAreaPerSite:
        sites.length > 0
          ? Math.round((totalArea / sites.length) * 100) / 100
          : 0,
      utilizationRate:
        totalCapacity > 0
          ? Math.round((usedCapacity / totalCapacity) * 1000) / 10
          : 0,
    };
  }

  /**
   * Get status distribution with aggregated metrics per status
   */
  private async getStatusDistribution(
    whereClause: Prisma.SiteWhereInput,
  ): Promise<SiteStatusDistributionDto[]> {
    const statusData = await this.prisma.site.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
      _sum: {
        area: true,
        capacity: true,
      },
    });

    const totalCount = statusData.reduce((sum, item) => sum + item._count, 0);

    return statusData.map((item) => ({
      status: item.status,
      count: item._count,
      percentage:
        totalCount > 0 ? Math.round((item._count / totalCount) * 1000) / 10 : 0,
      totalArea: Math.round(Number(item._sum.area || 0) * 100) / 100,
      totalCapacity: item._sum.capacity || 0,
    }));
  }
}
