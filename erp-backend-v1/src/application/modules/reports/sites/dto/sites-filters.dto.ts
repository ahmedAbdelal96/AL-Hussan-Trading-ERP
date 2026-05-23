import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsNumber,
} from 'class-validator';

/**
 * Site Status Enum
 * Mirrors the Prisma SiteStatus enum from schema
 */
export enum SiteStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  UNDER_PREPARATION = 'UNDER_PREPARATION',
  CLOSED = 'CLOSED',
}

/**
 * Base Sites Report Filters
 * Common filtering parameters for all sites reports
 */
export class BaseSitesFiltersDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(SiteStatusEnum)
  status?: SiteStatusEnum;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsNumber()
  minArea?: number;

  @IsOptional()
  @IsNumber()
  maxArea?: number;

  @IsOptional()
  @IsNumber()
  minCapacity?: number;

  @IsOptional()
  @IsNumber()
  maxCapacity?: number;
}

/**
 * Sites Overview Report Filters
 * Dashboard-level aggregation of all sites
 */
export class SitesOverviewFiltersDto extends BaseSitesFiltersDto {
  @IsOptional()
  includeProjectCount: boolean = true;

  @IsOptional()
  includeCapacityMetrics: boolean = true;
}

/**
 * Sites By Status Report Filters
 * Analyze sites distribution across 4 status categories
 */
export class SitesByStatusFiltersDto extends BaseSitesFiltersDto {
  @IsOptional()
  includeTransitionHistory: boolean = false;

  @IsOptional()
  minDaysInStatus?: number;

  @IsOptional()
  sortBy: 'status' | 'count' | 'area' = 'status';

  @IsOptional()
  sortOrder: 'asc' | 'desc' = 'asc';
}

/**
 * Sites By Location Report Filters
 * Geographic distribution analysis
 */
export class SitesByLocationFiltersDto extends BaseSitesFiltersDto {
  @IsOptional()
  groupByLevel: 'country' | 'state' | 'city' = 'city';

  @IsOptional()
  includeTotalArea: boolean = true;

  @IsOptional()
  includeCoordinates: boolean = false;

  @IsOptional()
  sortBy: 'location' | 'count' | 'area' = 'location';

  @IsOptional()
  sortOrder: 'asc' | 'desc' = 'asc';
}

/**
 * Sites Capacity & Utilization Filters
 * Track capacity usage and efficiency metrics
 */
export class SitesCapacityFiltersDto extends BaseSitesFiltersDto {
  @IsOptional()
  minUtilization?: number; // percentage

  @IsOptional()
  maxUtilization?: number; // percentage

  @IsOptional()
  includeUnderUtilized: boolean = true;

  @IsOptional()
  sortBy: 'capacity' | 'area' | 'utilization' = 'capacity';

  @IsOptional()
  sortOrder: 'asc' | 'desc' = 'desc';
}

/**
 * Sites With Projects Report Filters
 * Link sites with their associated projects
 */
export class SitesWithProjectsFiltersDto extends BaseSitesFiltersDto {
  @IsOptional()
  minProjectCount?: number;

  @IsOptional()
  includeProjectDetails: boolean = true;

  @IsOptional()
  includeProjectFinancials: boolean = false;

  @IsOptional()
  sortBy: 'projectCount' | 'area' | 'name' = 'projectCount';

  @IsOptional()
  sortOrder: 'asc' | 'desc' = 'desc';
}

/**
 * Sites Performance Report Filters
 * Evaluate site efficiency and profitability metrics
 */
export class SitesPerformanceFiltersDto extends BaseSitesFiltersDto {
  @IsOptional()
  includeROIMetrics: boolean = true;

  @IsOptional()
  includeProjectCompletion: boolean = true;

  @IsOptional()
  includeUnderutilizedSites: boolean = true;

  @IsOptional()
  minProjects?: number; // Only sites with N+ projects

  @IsOptional()
  sortBy: 'performance' | 'roi' | 'projectValue' = 'performance';

  @IsOptional()
  sortOrder: 'asc' | 'desc' = 'desc';
}

/**
 * Site Profitability Report Filters
 * Revenue (project budgets) vs total costs per site
 */
export class SiteProfitabilityFiltersDto extends BaseSitesFiltersDto {
  @IsOptional()
  @IsEnum(['profit', 'margin', 'revenue', 'siteName'])
  sortBy?: 'profit' | 'margin' | 'revenue' | 'siteName';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsNumber()
  minMargin?: number;

  @IsOptional()
  @IsNumber()
  maxMargin?: number;

  @IsOptional()
  @IsEnum(['HIGH', 'MEDIUM', 'LOW', 'LOSS'])
  profitabilityRating?: 'HIGH' | 'MEDIUM' | 'LOW' | 'LOSS';

  @IsOptional()
  includeProjectBreakdown?: boolean;
}
