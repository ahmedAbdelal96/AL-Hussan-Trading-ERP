/**
 * Sites Reports — TypeScript Type Definitions
 *
 * @description Mirrors all backend DTOs from sites-responses.dto.ts & sites-filters.dto.ts
 * @module types/reports/sites.types
 *
 * Color theme: Sky (border-sky-200 / text-sky-700 / bg-sky-50)
 * Endpoints base: GET /api/v1/reports/sites/{endpoint}
 *
 * @author ERP System
 * @date 2026-02-20
 */

// ============================================================================
// SHARED
// ============================================================================

/** Site operational statuses (mirrors Prisma SiteStatus enum) */
export type SiteStatus = "ACTIVE" | "INACTIVE" | "UNDER_PREPARATION" | "CLOSED";

/** Performance rating tiers returned by the backend */
export type PerformanceRating = "HIGH" | "MEDIUM" | "LOW";

/** Common filter parameters for all sites reports */
export interface SitesReportFilters {
  startDate?: string;
  endDate?: string;
  status?: SiteStatus;
  city?: string;
  state?: string;
  country?: string;
  code?: string;
  minArea?: number;
  maxArea?: number;
  minCapacity?: number;
  maxCapacity?: number;
}

// ============================================================================
// REPORT 1 — SITES OVERVIEW
// ============================================================================

/** Aggregate KPI counts for all sites */
export interface SiteKPI {
  totalSites: number;
  activeSites: number;
  inactiveSites: number;
  underPreparationSites: number;
  closedSites: number;
  activePercentage: number;
}

/** Capacity and area aggregate metrics */
export interface SiteCapacityMetrics {
  totalCapacity: number;
  totalArea: number;
  averageCapacityPerSite: number;
  averageAreaPerSite: number;
  utilizationRate: number;
}

/** Distribution of sites by status with area/capacity totals */
export interface SiteStatusDistribution {
  status: SiteStatus;
  count: number;
  percentage: number;
  totalArea: number;
  totalCapacity: number;
}

/** Response from GET /reports/sites/overview */
export interface SitesOverviewResponse {
  kpi: SiteKPI;
  capacityMetrics: SiteCapacityMetrics;
  statusDistribution: SiteStatusDistribution[];
  reportDate: string;
}

// ============================================================================
// REPORT 2 — SITES BY STATUS
// ============================================================================

/**
 * One row in the status-breakdown table.
 * For UNDER_PREPARATION sites, sitesExceedingThreshold highlights
 * those that have been in preparation longer than expected.
 */
export interface SiteStatusBreakdown {
  status: SiteStatus;
  count: number;
  percentage: number;
  totalArea: number;
  totalCapacity: number;
  averageDaysInStatus: number;
  sitesExceedingThreshold: number;
}

/** Individual site with its most recent status-change info */
export interface SitesPerStatusDetail {
  siteId: string;
  siteCode: string;
  siteName: string;
  status: SiteStatus;
  lastStatusChange: string;
  daysInCurrentStatus: number;
}

/** Response from GET /reports/sites/by-status */
export interface SitesByStatusResponse {
  statusBreakdown: SiteStatusBreakdown[];
  recentStatusTransitions: SitesPerStatusDetail[];
}

// ============================================================================
// REPORT 3 — SITES BY LOCATION
// ============================================================================

/** One geographic group (country / state / city) */
export interface LocationDistribution {
  location: string;
  level: "country" | "state" | "city";
  siteCount: number;
  percentage: number;
  totalArea: number;
  totalCapacity: number;
  averageArea: number;
}

/** Optional geo-coordinates for map rendering */
export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  siteCode: string;
  siteName: string;
}

/** Response from GET /reports/sites/by-location */
export interface SitesByLocationResponse {
  locationDistribution: LocationDistribution[];
  coordinates?: GeoCoordinate[];
  groupByLevel: "country" | "state" | "city";
}

// ============================================================================
// REPORT 4 — SITES CAPACITY & UTILIZATION
// ============================================================================

/** Aggregate totals across all sites */
export interface CapacityAggregate {
  totalCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
  overallUtilizationPercentage: number;
  totalArea: number;
  usedArea: number;
  availableArea: number;
}

/** Per-site capacity detail row */
export interface SiteCapacityDetail {
  siteId: string;
  siteCode: string;
  siteName: string;
  capacity: number;
  activeProjects: number;
  utilizationPercentage: number;
  area: number;
  status: SiteStatus;
}

/** Response from GET /reports/sites/capacity */
export interface SitesCapacityResponse {
  aggregate: CapacityAggregate;
  sites: SiteCapacityDetail[];
  underutilizedSitesCount: number;
}

// ============================================================================
// REPORT 5 — SITES WITH PROJECTS
// ============================================================================

/** Brief summary of a project linked to a site */
export interface ProjectSummary {
  projectId: string;
  projectCode: string;
  projectName: string;
  status: string;
  budget: number;
  completionPercentage: number;
}

/** Site row with its associated projects */
export interface SiteWithProjectsDetail {
  siteId: string;
  siteCode: string;
  siteName: string;
  activeProjectCount: number;
  totalProjectCount: number;
  area: number;
  city: string;
  projects?: ProjectSummary[];
  totalProjectBudget?: number;
}

/** Response from GET /reports/sites/with-projects */
export interface SitesWithProjectsResponse {
  sites: SiteWithProjectsDetail[];
  totalSites: number;
  sitesWithProjects: number;
  sitesWithoutProjects: number;
  totalProjectCount: number;
}

// ============================================================================
// REPORT 6 — SITES PERFORMANCE
// ============================================================================

/** Project completion KPIs for a site */
export interface ProjectCompletionMetrics {
  totalProjects: number;
  completedProjects: number;
  completionRate: number;
  averageCompletionPercentage: number;
}

/** ROI and financial metrics per site */
export interface SiteROIMetrics {
  totalProjectBudget: number;
  siteArea: number;
  roiPerSquareMeter: number;
  profitabilityRating: PerformanceRating;
}

/** Full performance profile for one site */
export interface SitePerformanceDetail {
  siteId: string;
  siteCode: string;
  siteName: string;
  projectMetrics: ProjectCompletionMetrics;
  roiMetrics: SiteROIMetrics;
  performanceScore: number;
  performanceRating: PerformanceRating;
}

/** Response from GET /reports/sites/performance */
export interface SitesPerformanceResponse {
  sites: SitePerformanceDetail[];
  averagePerformanceScore: number;
  highPerformingSites: number;
  lowPerformingSites: number;
  candidatesForClosure: number;
}

// ============================================================================
// REPORT 7 — SITE PROFITABILITY
// ============================================================================

export type ProfitabilityRating = "HIGH" | "MEDIUM" | "LOW" | "LOSS";

export interface SiteProfitabilityFilters {
  sortBy?: "profit" | "margin" | "revenue" | "siteName";
  sortOrder?: "asc" | "desc";
  minMargin?: number;
  maxMargin?: number;
  profitabilityRating?: ProfitabilityRating;
  includeProjectBreakdown?: boolean;
  status?: SiteStatus;
  city?: string;
  country?: string;
}

export interface SiteProjectCost {
  projectId: string;
  projectName: string;
  projectStatus: string;
  budget: number;
  directCost: number;
  allocatedCost: number;
  totalCost: number;
}

export interface SiteProfitabilityItem {
  siteId: string;
  siteName: string;
  siteStatus: string;
  projectCount: number;
  totalRevenue: number;
  directCosts: number;
  allocatedCosts: number;
  totalCosts: number;
  profit: number;
  profitMargin: number | null;
  profitabilityRating: ProfitabilityRating;
  projects?: SiteProjectCost[];
}

export interface SiteProfitabilitySummary {
  totalSites: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  lossCount: number;
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  avgProfitMargin: number | null;
}

export interface SiteProfitabilityResponse {
  sites: SiteProfitabilityItem[];
  summary: SiteProfitabilitySummary;
  currency: string;
  generatedAt: string;
}
