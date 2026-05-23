/**
 * ============================================================================
 * SITES REPORTS - RESPONSE DTOs PART 2
 * ============================================================================
 *
 * Response DTOs for:
 * - Report 7: Site Profitability (revenue vs costs per site)
 *
 * @module SitesResponsesPart2
 */

// ============================================================================
// REPORT 7: SITE PROFITABILITY
// ============================================================================

export class SiteProjectCostDto {
  projectId: string;
  projectName: string;
  projectStatus: string;
  budget: number;
  directCost: number;
  allocatedCost: number;
  totalCost: number;
}

export class SiteProfitabilityItemDto {
  siteId: string;
  siteName: string;
  siteStatus: string;
  projectCount: number;
  totalRevenue: number; // sum(project.budget)
  directCosts: number; // sum(Cost.amount)
  allocatedCosts: number; // sum(CostAllocation.allocatedAmount)
  totalCosts: number;
  profit: number;
  profitMargin: number | null; // null if revenue = 0
  profitabilityRating: 'HIGH' | 'MEDIUM' | 'LOW' | 'LOSS';
  projects?: SiteProjectCostDto[]; // populated if includeProjectBreakdown=true
}

export class SiteProfitabilitySummaryDto {
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

export class SiteProfitabilityResponseDto {
  sites: SiteProfitabilityItemDto[];
  summary: SiteProfitabilitySummaryDto;
  currency: string;
  generatedAt: string;
}
