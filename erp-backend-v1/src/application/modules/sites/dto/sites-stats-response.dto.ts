import { ApiProperty } from '@nestjs/swagger';

/**
 * Geographic Distribution Item DTO
 */
export class GeographicDistributionDto {
  @ApiProperty({ description: 'Location name (city, state, or country)' })
  name: string;

  @ApiProperty({ description: 'Number of sites in this location' })
  count: number;

  @ApiProperty({ description: 'Percentage of total sites', example: 25.5 })
  percentage: number;
}

/**
 * Sites Statistics Response DTO
 * Simplified version with essential statistics only
 */
export class SitesStatsResponseDto {
  // ========== General Statistics ==========
  @ApiProperty({ description: 'Total number of sites' })
  totalSites: number;

  @ApiProperty({ description: 'Number of active sites' })
  activeSites: number;

  @ApiProperty({ description: 'Number of inactive sites' })
  inactiveSites: number;

  @ApiProperty({ description: 'Number of sites under preparation' })
  underPreparation: number;

  @ApiProperty({ description: 'Number of closed sites' })
  closedSites: number;

  // ========== Geographic Distribution ==========
  @ApiProperty({
    description: 'Distribution of sites by city',
    type: [GeographicDistributionDto],
  })
  byCity: GeographicDistributionDto[];

  @ApiProperty({
    description: 'Distribution of sites by state/region',
    type: [GeographicDistributionDto],
  })
  byState: GeographicDistributionDto[];

  constructor(partial: Partial<SitesStatsResponseDto>) {
    Object.assign(this, partial);
  }
}
