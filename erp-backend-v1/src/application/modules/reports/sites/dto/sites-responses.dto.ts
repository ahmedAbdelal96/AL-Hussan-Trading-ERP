import { ApiProperty } from '@nestjs/swagger';

// ============================================================================
// SITES OVERVIEW REPORT - RESPONSE DTOs
// ============================================================================

export class SiteKPIDto {
  @ApiProperty({ example: 45 })
  totalSites: number;

  @ApiProperty({ example: 35 })
  activeSites: number;

  @ApiProperty({ example: 8 })
  inactiveSites: number;

  @ApiProperty({ example: 2 })
  underPreparationSites: number;

  @ApiProperty({ example: 0 })
  closedSites: number;

  @ApiProperty({ example: 77.78 })
  activePercentage: number;
}

export class SiteCapacityMetricsDto {
  @ApiProperty({ example: 5000 })
  totalCapacity: number;

  @ApiProperty({ example: 12500.5 })
  totalArea: number; // in square meters

  @ApiProperty({ example: 122.2 })
  averageCapacityPerSite: number;

  @ApiProperty({ example: 277.78 })
  averageAreaPerSite: number;

  @ApiProperty({ example: 65.5 })
  utilizationRate: number; // percentage
}

export class SiteStatusDistributionDto {
  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: 35 })
  count: number;

  @ApiProperty({ example: 77.78 })
  percentage: number;

  @ApiProperty({ example: 8500.25 })
  totalArea: number;

  @ApiProperty({ example: 3500 })
  totalCapacity: number;
}

export class SitesOverviewResponseDto {
  @ApiProperty({ type: SiteKPIDto })
  kpi: SiteKPIDto;

  @ApiProperty({ type: SiteCapacityMetricsDto })
  capacityMetrics: SiteCapacityMetricsDto;

  @ApiProperty({ type: [SiteStatusDistributionDto] })
  statusDistribution: SiteStatusDistributionDto[];

  @ApiProperty({ example: '2026-01-20T10:30:00Z' })
  reportDate: Date;
}

// ============================================================================
// SITES BY STATUS REPORT - RESPONSE DTOs
// ============================================================================

export class SiteStatusBreakdownDto {
  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: 35 })
  count: number;

  @ApiProperty({ example: 77.78 })
  percentage: number;

  @ApiProperty({ example: 8500.25 })
  totalArea: number;

  @ApiProperty({ example: 3500 })
  totalCapacity: number;

  @ApiProperty({ example: 125.5 })
  averageDaysInStatus: number;

  @ApiProperty({ example: 5 })
  sitesExceedingThreshold: number; // for UNDER_PREPARATION
}

export class SitesPerStatusDetailDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  siteId: string;

  @ApiProperty({ example: 'SITE-001' })
  siteCode: string;

  @ApiProperty({ example: 'Main Construction Site' })
  siteName: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: '2025-06-15T08:00:00Z' })
  lastStatusChange: Date;

  @ApiProperty({ example: 228.5 })
  daysInCurrentStatus: number;
}

export class SitesByStatusResponseDto {
  @ApiProperty({ type: [SiteStatusBreakdownDto] })
  statusBreakdown: SiteStatusBreakdownDto[];

  @ApiProperty({ type: [SitesPerStatusDetailDto] })
  recentStatusTransitions: SitesPerStatusDetailDto[];
}

// ============================================================================
// SITES BY LOCATION REPORT - RESPONSE DTOs
// ============================================================================

export class LocationDistributionDto {
  @ApiProperty({ example: 'Riyadh' })
  location: string;

  @ApiProperty({ example: 'city' })
  level: 'country' | 'state' | 'city';

  @ApiProperty({ example: 12 })
  siteCount: number;

  @ApiProperty({ example: 26.67 })
  percentage: number;

  @ApiProperty({ example: 2500.75 })
  totalArea: number;

  @ApiProperty({ example: 1200 })
  totalCapacity: number;

  @ApiProperty({ example: 24.23 })
  averageArea: number;
}

export class GeoCoordinateDto {
  @ApiProperty({ example: 24.7136 })
  latitude: number;

  @ApiProperty({ example: 46.6753 })
  longitude: number;

  @ApiProperty({ example: 'SITE-001' })
  siteCode: string;

  @ApiProperty({ example: 'Main Site' })
  siteName: string;
}

export class SitesByLocationResponseDto {
  @ApiProperty({ type: [LocationDistributionDto] })
  locationDistribution: LocationDistributionDto[];

  @ApiProperty({ type: [GeoCoordinateDto], required: false })
  coordinates?: GeoCoordinateDto[];

  @ApiProperty({ example: 'city' })
  groupByLevel: string;
}

// ============================================================================
// SITES CAPACITY & UTILIZATION REPORT - RESPONSE DTOs
// ============================================================================

export class SiteCapacityDetailDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  siteId: string;

  @ApiProperty({ example: 'SITE-001' })
  siteCode: string;

  @ApiProperty({ example: 'Main Construction Site' })
  siteName: string;

  @ApiProperty({ example: 500 })
  capacity: number;

  @ApiProperty({ example: 3 })
  activeProjects: number;

  @ApiProperty({ example: 60 })
  utilizationPercentage: number;

  @ApiProperty({ example: 2500.75 })
  area: number;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;
}

export class CapacityAggregateDto {
  @ApiProperty({ example: 5000 })
  totalCapacity: number;

  @ApiProperty({ example: 3250 })
  usedCapacity: number;

  @ApiProperty({ example: 1750 })
  availableCapacity: number;

  @ApiProperty({ example: 65 })
  overallUtilizationPercentage: number;

  @ApiProperty({ example: 12500.5 })
  totalArea: number;

  @ApiProperty({ example: 8125.75 })
  usedArea: number;

  @ApiProperty({ example: 4374.75 })
  availableArea: number;
}

export class SitesCapacityResponseDto {
  @ApiProperty({ type: CapacityAggregateDto })
  aggregate: CapacityAggregateDto;

  @ApiProperty({ type: [SiteCapacityDetailDto] })
  sites: SiteCapacityDetailDto[];

  @ApiProperty({ example: 8 })
  underutilizedSitesCount: number;
}

// ============================================================================
// SITES WITH PROJECTS REPORT - RESPONSE DTOs
// ============================================================================

export class ProjectSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  projectId: string;

  @ApiProperty({ example: 'PRJ-0001' })
  projectCode: string;

  @ApiProperty({ example: 'Road Construction Phase 1' })
  projectName: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: 500000 })
  budget: number;

  @ApiProperty({ example: 75.5 })
  completionPercentage: number;
}

export class SiteWithProjectsDetailDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  siteId: string;

  @ApiProperty({ example: 'SITE-001' })
  siteCode: string;

  @ApiProperty({ example: 'Main Construction Site' })
  siteName: string;

  @ApiProperty({ example: 3 })
  activeProjectCount: number;

  @ApiProperty({ example: 8 })
  totalProjectCount: number;

  @ApiProperty({ example: 2500.75 })
  area: number;

  @ApiProperty({ example: 'Riyadh' })
  city: string;

  @ApiProperty({ type: [ProjectSummaryDto], required: false })
  projects?: ProjectSummaryDto[];

  @ApiProperty({ example: 2500000, required: false })
  totalProjectBudget?: number;
}

export class SitesWithProjectsResponseDto {
  @ApiProperty({ type: [SiteWithProjectsDetailDto] })
  sites: SiteWithProjectsDetailDto[];

  @ApiProperty({ example: 45 })
  totalSites: number;

  @ApiProperty({ example: 32 })
  sitesWithProjects: number;

  @ApiProperty({ example: 13 })
  sitesWithoutProjects: number;

  @ApiProperty({ example: 125 })
  totalProjectCount: number;
}

// ============================================================================
// SITES PERFORMANCE REPORT - RESPONSE DTOs
// ============================================================================

export class ProjectCompletionMetricsDto {
  @ApiProperty({ example: 8 })
  totalProjects: number;

  @ApiProperty({ example: 6 })
  completedProjects: number;

  @ApiProperty({ example: 75 })
  completionRate: number;

  @ApiProperty({ example: 65.5 })
  averageCompletionPercentage: number;
}

export class SiteROIMetricsDto {
  @ApiProperty({ example: 2500000 })
  totalProjectBudget: number;

  @ApiProperty({ example: 2500.75 })
  siteArea: number;

  @ApiProperty({ example: 1000 })
  roiPerSquareMeter: number;

  @ApiProperty({ example: 'HIGH' })
  profitabilityRating: string;
}

export class SitePerformanceDetailDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  siteId: string;

  @ApiProperty({ example: 'SITE-001' })
  siteCode: string;

  @ApiProperty({ example: 'Main Construction Site' })
  siteName: string;

  @ApiProperty({ type: ProjectCompletionMetricsDto })
  projectMetrics: ProjectCompletionMetricsDto;

  @ApiProperty({ type: SiteROIMetricsDto })
  roiMetrics: SiteROIMetricsDto;

  @ApiProperty({ example: 85.5 })
  performanceScore: number;

  @ApiProperty({ example: 'HIGH' })
  performanceRating: string;
}

export class SitesPerformanceResponseDto {
  @ApiProperty({ type: [SitePerformanceDetailDto] })
  sites: SitePerformanceDetailDto[];

  @ApiProperty({ example: 75.5 })
  averagePerformanceScore: number;

  @ApiProperty({ example: 8 })
  highPerformingSites: number;

  @ApiProperty({ example: 12 })
  lowPerformingSites: number;

  @ApiProperty({ example: 15 })
  candidatesForClosure: number;
}
