import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  SitesByLocationFiltersDto,
  SitesByLocationResponseDto,
  LocationDistributionDto,
  GeoCoordinateDto,
} from '../dto';
import { Prisma } from '@prisma/client';

/**
 * Use Case: Sites By Location Report
 *
 * Geographic analysis of sites with regional distribution metrics.
 * Supports multi-level grouping (country, state, city) for strategic planning.
 *
 * Business Value:
 * - Understand geographic footprint and market coverage
 * - Regional capacity planning and expansion decisions
 * - Geographic redundancy assessment
 * - Support logistics and supply chain optimization
 */
@Injectable()
export class GetSitesByLocationUseCase {
  private readonly logger = new Logger(GetSitesByLocationUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: SitesByLocationFiltersDto,
  ): Promise<SitesByLocationResponseDto> {
    try {
      const whereClause = this.buildWhereClause(filters);

      const [locationDistribution, coordinates] = await Promise.all([
        this.getLocationDistribution(whereClause, filters),
        filters.includeCoordinates
          ? this.getCoordinates(whereClause)
          : Promise.resolve(undefined),
      ]);

      this.logger.debug(
        `Sites by location report generated: ${locationDistribution.length} locations`,
      );

      return {
        locationDistribution,
        coordinates,
        groupByLevel: filters.groupByLevel,
      };
    } catch (error) {
      this.logger.error(
        `Error generating sites by location report: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Build WHERE clause for filtering sites
   */
  private buildWhereClause(
    filters: SitesByLocationFiltersDto,
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

    if (filters.country) {
      where.country = {
        contains: filters.country,
        mode: 'insensitive' as Prisma.QueryMode,
      };
    }

    return where;
  }

  /**
   * Get geographic distribution based on grouping level
   * Groups sites by country, state, or city
   */
  private async getLocationDistribution(
    whereClause: Prisma.SiteWhereInput,
    filters: SitesByLocationFiltersDto,
  ): Promise<LocationDistributionDto[]> {
    // Determine grouping field based on groupByLevel
    const groupBy =
      filters.groupByLevel === 'country'
        ? 'country'
        : filters.groupByLevel === 'state'
          ? 'state'
          : 'city';

    const grouped = await this.prisma.site.groupBy({
      by: [groupBy as any],
      where: whereClause,
      _count: true,
      _sum: {
        area: true,
        capacity: true,
      },
    });

    const totalCount = grouped.reduce((sum, item) => sum + item._count, 0);

    const distribution = grouped.map((item) => {
      const location = (item as any)[groupBy] || 'Unknown';
      const count = item._count;
      const totalArea = Number(item._sum.area || 0);
      const totalCapacity = item._sum.capacity || 0;

      return {
        location,
        level: filters.groupByLevel,
        siteCount: count,
        percentage:
          totalCount > 0 ? Math.round((count / totalCount) * 1000) / 10 : 0,
        totalArea: Math.round(totalArea * 100) / 100,
        totalCapacity,
        averageArea:
          count > 0 ? Math.round((totalArea / count) * 100) / 100 : 0,
      };
    });

    // Sort distribution
    if (filters.sortBy === 'count') {
      distribution.sort((a, b) =>
        filters.sortOrder === 'desc'
          ? b.siteCount - a.siteCount
          : a.siteCount - b.siteCount,
      );
    } else if (filters.sortBy === 'area') {
      distribution.sort((a, b) =>
        filters.sortOrder === 'desc'
          ? b.totalArea - a.totalArea
          : a.totalArea - b.totalArea,
      );
    } else {
      // Sort by location name
      distribution.sort((a, b) =>
        filters.sortOrder === 'desc'
          ? b.location.localeCompare(a.location)
          : a.location.localeCompare(b.location),
      );
    }

    return distribution;
  }

  /**
   * Get GPS coordinates for mapping (optional feature)
   */
  private async getCoordinates(
    whereClause: Prisma.SiteWhereInput,
  ): Promise<GeoCoordinateDto[] | undefined> {
    const sites = await this.prisma.site.findMany({
      where: {
        ...whereClause,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        latitude: true,
        longitude: true,
        code: true,
        name: true,
      },
      take: 100, // Limit for performance
    });

    return sites.map((site) => ({
      latitude: Number(site.latitude),
      longitude: Number(site.longitude),
      siteCode: site.code,
      siteName: site.name,
    }));
  }
}
