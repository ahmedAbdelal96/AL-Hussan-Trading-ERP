import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  SitesByStatusFiltersDto,
  SitesByStatusResponseDto,
  SiteStatusBreakdownDto,
  SitesPerStatusDetailDto,
} from '../dto';
import { Prisma } from '@prisma/client';

/**
 * Use Case: Sites By Status Report
 *
 * Analyzes site distribution across 4 operational statuses.
 * Identifies bottlenecks in site lifecycle and tracks status transitions.
 *
 * Business Value:
 * - Detect sites stuck in UNDER_PREPARATION (process bottleneck)
 * - Track time spent in each status
 * - Monitor site activation pipeline efficiency
 * - Support site lifecycle management decisions
 */
@Injectable()
export class GetSitesByStatusUseCase {
  private readonly logger = new Logger(GetSitesByStatusUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: SitesByStatusFiltersDto,
  ): Promise<SitesByStatusResponseDto> {
    try {
      const whereClause = this.buildWhereClause(filters);

      const [statusBreakdown, recentStatusTransitions] = await Promise.all([
        this.getStatusBreakdown(whereClause, filters),
        this.getRecentStatusTransitions(whereClause),
      ]);

      this.logger.debug(
        `Sites by status report generated with ${statusBreakdown.length} statuses`,
      );

      return {
        statusBreakdown,
        recentStatusTransitions,
      };
    } catch (error) {
      this.logger.error(
        `Error generating sites by status report: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Build WHERE clause for filtering sites
   */
  private buildWhereClause(
    filters: SitesByStatusFiltersDto,
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

    if (filters.state) {
      where.state = {
        contains: filters.state,
        mode: 'insensitive' as Prisma.QueryMode,
      };
    }

    return where;
  }

  /**
   * Get breakdown of sites by status with detailed metrics
   */
  private async getStatusBreakdown(
    whereClause: Prisma.SiteWhereInput,
    filters: SitesByStatusFiltersDto,
  ): Promise<SiteStatusBreakdownDto[]> {
    const statuses = ['ACTIVE', 'INACTIVE', 'UNDER_PREPARATION', 'CLOSED'];

    const breakdownPromises = statuses.map(async (status) => {
      const statusWhere: Prisma.SiteWhereInput = {
        ...whereClause,
        status: status as any,
      };

      const [count, totalArea, totalCapacity, sites] = await Promise.all([
        this.prisma.site.count({ where: statusWhere }),
        this.prisma.site.aggregate({
          where: statusWhere,
          _sum: { area: true },
        }),
        this.prisma.site.aggregate({
          where: statusWhere,
          _sum: { capacity: true },
        }),
        this.prisma.site.findMany({
          where: statusWhere,
          select: { createdAt: true },
        }),
      ]);

      const totalCount = await this.prisma.site.count({
        where: { deletedAt: null },
      });

      // Calculate average days in status (from creation to now)
      const now = new Date();
      let totalDays = 0;
      sites.forEach((site) => {
        const days =
          (now.getTime() - new Date(site.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        totalDays += days;
      });

      const avgDaysInStatus =
        sites.length > 0 ? Math.round((totalDays / sites.length) * 10) / 10 : 0;

      // For UNDER_PREPARATION, identify sites exceeding threshold (e.g., 90 days)
      const threshold = filters.minDaysInStatus || 90;
      const sitesExceeding =
        status === 'UNDER_PREPARATION'
          ? sites.filter(
              (site) =>
                (now.getTime() - new Date(site.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24) >
                threshold,
            ).length
          : 0;

      return {
        status,
        count,
        percentage:
          totalCount > 0 ? Math.round((count / totalCount) * 1000) / 10 : 0,
        totalArea: Math.round(Number(totalArea._sum.area || 0) * 100) / 100,
        totalCapacity: totalCapacity._sum.capacity || 0,
        averageDaysInStatus: avgDaysInStatus,
        sitesExceedingThreshold: sitesExceeding,
      };
    });

    const breakdown = await Promise.all(breakdownPromises);

    // Sort breakdown
    if (filters.sortBy === 'count') {
      breakdown.sort((a, b) =>
        filters.sortOrder === 'desc' ? b.count - a.count : a.count - b.count,
      );
    } else if (filters.sortBy === 'area') {
      breakdown.sort((a, b) =>
        filters.sortOrder === 'desc'
          ? b.totalArea - a.totalArea
          : a.totalArea - b.totalArea,
      );
    }

    return breakdown;
  }

  /**
   * Get recent sites and their status transitions
   */
  private async getRecentStatusTransitions(
    whereClause: Prisma.SiteWhereInput,
  ): Promise<SitesPerStatusDetailDto[]> {
    const sites = await this.prisma.site.findMany({
      where: whereClause,
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 20, // Top 20 recent transitions
    });

    return sites.map((site) => ({
      siteId: site.id,
      siteCode: site.code,
      siteName: site.name,
      status: site.status,
      lastStatusChange: site.updatedAt,
      daysInCurrentStatus: Math.floor(
        (new Date().getTime() - new Date(site.updatedAt).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    }));
  }
}
