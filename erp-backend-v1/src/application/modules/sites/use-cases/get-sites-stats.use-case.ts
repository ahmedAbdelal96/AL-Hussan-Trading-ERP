import { Injectable, Inject } from '@nestjs/common';
import type { ISiteRepository } from '../repositories/site.repository.interface';
import { SITE_REPOSITORY } from '../repositories/site.repository.interface';
import {
  SitesStatsResponseDto,
  GeographicDistributionDto,
} from '../dto/sites-stats-response.dto';

/**
 * Get Sites Statistics Use Case
 * Retrieves essential statistics about sites including:
 * - General counts (total, active, inactive, etc.)
 * - Geographic distribution by city and state
 */
@Injectable()
export class GetSitesStatsUseCase {
  constructor(
    @Inject(SITE_REPOSITORY)
    private readonly siteRepository: ISiteRepository,
  ) {}

  async execute(): Promise<SitesStatsResponseDto> {
    const stats = await this.siteRepository.getStats();

    // Calculate percentages for geographic distribution
    const calculatePercentage = (count: number): number => {
      return stats.totalSites > 0
        ? Math.round((count / stats.totalSites) * 100 * 10) / 10
        : 0;
    };

    const byCity: GeographicDistributionDto[] = stats.byCity.map((item) => ({
      name: item.name,
      count: item.count,
      percentage: calculatePercentage(item.count),
    }));

    const byState: GeographicDistributionDto[] = stats.byState.map((item) => ({
      name: item.name,
      count: item.count,
      percentage: calculatePercentage(item.count),
    }));

    return new SitesStatsResponseDto({
      totalSites: stats.totalSites,
      activeSites: stats.activeSites,
      inactiveSites: stats.inactiveSites,
      underPreparation: stats.underPreparation,
      closedSites: stats.closedSites,
      byCity,
      byState,
    });
  }
}
