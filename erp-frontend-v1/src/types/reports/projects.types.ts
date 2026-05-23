/**
 * Projects Reports Type Definitions
 *
 * @description TypeScript interfaces for Projects module reports
 * @module types/reports/projects
 *
 * @remarks
 * - All interfaces are based on backend DTOs (erp-backend-v1/src/application/modules/reports/projects/dto/)
 * - Field names match the actual API responses
 * - Includes all 7 report types: Overview, ByStatus, BySite, BudgetUtilization, Timeline, Delayed, Completed
 */

// ============================================
// ENUMS (Match Backend exactly)
// ============================================

export enum ProjectStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

/** Backend TimelineStatus enum — no AT_RISK value in the enum (it is tracked via isAtRisk boolean) */
export enum TimelineStatus {
  ON_TIME = "ON_TIME",
  BEHIND_SCHEDULE = "BEHIND_SCHEDULE",
  AHEAD_OF_SCHEDULE = "AHEAD_OF_SCHEDULE",
  NOT_STARTED = "NOT_STARTED",
}

/** Backend BudgetStatus enum */
export enum BudgetStatus {
  WITHIN_BUDGET = "WITHIN_BUDGET",
  OVER_BUDGET = "OVER_BUDGET",
  UNDER_BUDGET = "UNDER_BUDGET",
  NO_BUDGET = "NO_BUDGET",
}

/** Delay category — backend returns plain string values */
export type DelayCategory = "Minor" | "Moderate" | "Major" | "Critical";

// ============================================
// FILTERS (Query Parameters)
// ============================================

export interface ProjectsReportFilters {
  month?: number;
  year?: number;
  siteId?: string;
  projectStatus?: ProjectStatus;
  page?: number;
  limit?: number;
}

// ============================================
// REPORT 1: OVERVIEW
// ============================================

export interface ProjectsOverviewResponse {
  // Key Metrics (12 KPIs)
  totalProjects: number;
  activeProjects: number;
  planningProjects: number;
  onHoldProjects: number;
  completedProjects: number;
  cancelledProjects: number;
  totalBudget: number;
  totalActualCost: number;
  budgetVariance: number;
  budgetUtilization: number;
  avgCompletion: number;
  completionRate: number;

  // Optional Cost Breakdown
  costBreakdown?: CostTypeBreakdownDto[];
  previousPeriod?: PeriodComparisonDto;
  growthRate?: number;

  // Metadata
  currency: string;
  month: number;
  year: number;
  generatedAt: string;
}

/** Matches backend CostTypeBreakdownDto */
export interface CostTypeBreakdownDto {
  costType: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

/** Matches backend PeriodComparisonDto */
export interface PeriodComparisonDto {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  totalActualCost: number;
  avgCompletion: number;
}

// ============================================
// REPORT 2: BY STATUS
// ============================================

export interface ProjectsByStatusResponse {
  items: StatusBreakdownItem[];
  totalProjects: number;
  totalBudget: number;
  totalActualCost: number;
  currency: string;
  month: number;
  year: number;
  generatedAt: string;
}

export interface StatusBreakdownItem {
  status: ProjectStatus;
  statusName: string;
  statusNameAr: string;
  projectCount: number;
  percentage: number;
  totalBudget: number;
  totalActualCost: number;
  budgetVariance: number;
  avgCompletion: number;
  avgBudgetUtilization: number;
}

// ============================================
// REPORT 3: BY SITE
// ============================================

export interface ProjectsBySiteResponse {
  sites: SiteBreakdownItem[];
  totalProjects: number;
  totalSites: number;
  totalBudget: number;
  totalActualCost: number;
  currency: string;
  month: number;
  year: number;
  generatedAt: string;
}

export interface SiteBreakdownItem {
  siteId: string;
  siteName: string;
  siteCode: string;
  projectCount: number;
  activeCount: number;
  completedCount: number;
  onHoldCount: number;
  totalBudget: number;
  totalActualCost: number;
  budgetVariance: number;
  avgCompletion: number;
  completionRate: number;
  percentageOfTotal: number;
}

// ============================================
// REPORT 4: BUDGET UTILIZATION
// ============================================

/** Matches backend BudgetUtilizationResponseDto */
export interface BudgetUtilizationResponse {
  /** Per-project budget items */
  projects: ProjectBudgetItem[];
  /** Budget status summary breakdown */
  budgetStatusSummary: BudgetStatusSummary[];
  /** Optional cost breakdown by category */
  costBreakdown?: CostCategoryBreakdown[];
  // Summary Metrics (flat)
  totalProjects: number;
  totalBudget: number;
  totalActualCost: number;
  totalVariance: number;
  avgUtilization: number;
  avgCostEfficiency: number;
  overBudgetCount: number;
  withinBudgetCount: number;
  underBudgetCount: number;
  // Metadata
  currency: string;
  month: number;
  year: number;
  generatedAt: string;
}

/** Matches backend ProjectBudgetItemDto */
export interface ProjectBudgetItem {
  projectId: string;
  projectCode: string;
  projectName: string;
  status: ProjectStatus;
  budgetStatus: BudgetStatus;
  budget: number;
  actualCost: number;
  budgetVariance: number;
  /** Budget utilization percentage */
  utilization: number;
  completionPercentage: number;
  /** Cost efficiency: completion / utilization */
  costEfficiency: number;
}

/** Matches backend BudgetStatusSummaryDto */
export interface BudgetStatusSummary {
  budgetStatus: BudgetStatus;
  projectCount: number;
  percentage: number;
  totalBudget: number;
  totalActualCost: number;
  totalVariance: number;
}

/** Matches backend CostCategoryBreakdownDto */
export interface CostCategoryBreakdown {
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

// ============================================
// REPORT 5: TIMELINE PROGRESS
// ============================================

export interface TimelineProgressResponse {
  projects: ProjectTimelineItem[];
  timelineSummary: TimelineStatusSummary[];
  totalProjects: number;
  onTimeCount: number;
  behindScheduleCount: number;
  aheadOfScheduleCount: number;
  notStartedCount: number;
  /** Projects flagged as at risk (separate from TimelineStatus enum) */
  atRiskCount: number;
  avgDaysVariance: number;
  avgSchedulePerformance: number;
  avgCompletion: number;
  month: number;
  year: number;
  generatedAt: string;
}

export interface ProjectTimelineItem {
  projectId: string;
  projectCode: string;
  projectName: string;
  status: ProjectStatus;
  timelineStatus: TimelineStatus;
  plannedStartDate?: string;
  actualStartDate?: string;
  plannedEndDate?: string;
  expectedCompletionDate?: string;
  completionPercentage: number;
  plannedDuration: number;
  elapsedDays: number;
  daysRemaining: number;
  daysVariance: number;
  schedulePerformance: number;
  isAtRisk: boolean;
}

export interface TimelineStatusSummary {
  timelineStatus: TimelineStatus;
  statusName: string;
  statusNameAr: string;
  projectCount: number;
  percentage: number;
  avgDaysVariance: number;
  avgCompletion: number;
}

// ============================================
// REPORT 6: DELAYED PROJECTS
// ============================================

/** Matches backend DelayedProjectsResponseDto */
export interface DelayedProjectsResponse {
  /** Delayed project items */
  projects: DelayedProjectItem[];
  /** Summary by delay category */
  delaySummary: DelayCategorySummary[];
  // Summary Metrics
  totalDelayedProjects: number;
  criticalProjectsCount: number;
  avgDelayDays: number;
  maxDelayDays: number;
  totalBudgetAtRisk: number;
  avgCompletion: number;
  percentageOfActive: number;
  // Metadata
  currency: string;
  month: number;
  year: number;
  generatedAt: string;
}

/** Matches backend DelayedProjectItemDto */
export interface DelayedProjectItem {
  projectId: string;
  projectCode: string;
  projectName: string;
  status: ProjectStatus;
  siteName?: string;
  managerName?: string;
  plannedStartDate?: string;
  actualStartDate?: string;
  plannedEndDate?: string;
  expectedCompletionDate?: string;
  delayDays: number;
  /** Plain string: 'Minor' | 'Moderate' | 'Major' | 'Critical' */
  delayCategory: DelayCategory;
  completionPercentage: number;
  daysRemaining: number;
  isCritical: boolean;
  budget: number;
  actualCost: number;
  budgetAtRisk: number;
  delayReason?: string;
  lastProgressUpdate?: string;
}

/** Matches backend DelayCategorySummaryDto */
export interface DelayCategorySummary {
  category: string;
  projectCount: number;
  percentage: number;
  avgDelayDays: number;
  totalBudgetAtRisk: number;
}

// ============================================
// REPORT 7: COMPLETED PROJECTS
// ============================================

/** Matches backend CompletedProjectsResponseDto */
export interface CompletedProjectsResponse {
  /** Completed project items */
  projects: CompletedProjectItem[];
  /** Performance category summary */
  performanceSummary: PerformanceCategorySummary[];
  // Summary Metrics
  totalCompleted: number;
  successfulCount: number;
  successRate: number;
  onTimeCount: number;
  withinBudgetCount: number;
  avgDuration: number;
  avgDurationVariance: number;
  avgBudgetPerformance: number;
  avgProjectScore: number;
  totalBudget: number;
  totalActualCost: number;
  totalSaved: number;
  // Metadata
  currency: string;
  month: number;
  year: number;
  generatedAt: string;
}

/** Matches backend CompletedProjectItemDto */
export interface CompletedProjectItem {
  projectId: string;
  projectCode: string;
  projectName: string;
  siteName?: string;
  managerName?: string;
  plannedStartDate?: string;
  actualStartDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  actualDuration: number;
  plannedDuration: number;
  durationVariance: number;
  onTime: boolean;
  budget: number;
  actualCost: number;
  budgetVariance: number;
  budgetPerformance: number;
  withinBudget: boolean;
  isSuccessful: boolean;
  completionPercentage: number;
  projectScore: number;
}

/** Matches backend PerformanceCategorySummaryDto */
export interface PerformanceCategorySummary {
  category: string;
  projectCount: number;
  percentage: number;
  avgScore: number;
}

// ============================================
// SHARED UTILITIES
// ============================================

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Helper function to get status color based on ProjectStatus
 */
export const getProjectStatusColor = (status: ProjectStatus): string => {
  switch (status) {
    case ProjectStatus.PLANNING:
      return "blue";
    case ProjectStatus.ACTIVE:
      return "green";
    case ProjectStatus.ON_HOLD:
      return "amber";
    case ProjectStatus.COMPLETED:
      return "purple";
    case ProjectStatus.CANCELLED:
      return "red";
    default:
      return "gray";
  }
};

/**
 * Helper function to get timeline status color
 */
export const getTimelineStatusColor = (status: TimelineStatus): string => {
  switch (status) {
    case TimelineStatus.ON_TIME:
      return "green";
    case TimelineStatus.BEHIND_SCHEDULE:
      return "red";
    case TimelineStatus.AHEAD_OF_SCHEDULE:
      return "blue";
    case TimelineStatus.NOT_STARTED:
      return "gray";
    default:
      return "gray";
  }
};

/**
 * Helper function to get budget status color
 */
export const getBudgetStatusColor = (status: BudgetStatus): string => {
  switch (status) {
    case BudgetStatus.UNDER_BUDGET:
      return "green";
    case BudgetStatus.WITHIN_BUDGET:
      return "blue";
    case BudgetStatus.OVER_BUDGET:
      return "red";
    case BudgetStatus.NO_BUDGET:
      return "gray";
    default:
      return "gray";
  }
};

/**
 * Helper function to get delay category color (backend uses plain strings)
 */
export const getDelayCategoryColor = (category: DelayCategory): string => {
  switch (category) {
    case "Minor":
      return "amber";
    case "Moderate":
      return "orange";
    case "Major":
      return "red";
    case "Critical":
      return "red";
    default:
      return "gray";
  }
};

// ============================================
// REPORT 8: PROJECT COST BREAKDOWN
// ============================================

export interface ProjectCostBreakdownFilters {
  month?: number;
  year?: number;
  siteId?: string;
  managerId?: string;
  projectStatus?: ProjectStatus;
  costType?: string;
  sortBy?: "totalCost" | "budget" | "utilization" | "projectName";
  sortOrder?: "asc" | "desc";
}

export interface CostTypeBreakdownItem {
  costType: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface ProjectCostBreakdownItem {
  projectId: string;
  projectCode: string;
  projectName: string;
  status: ProjectStatus;
  siteId?: string;
  siteName?: string;
  budget: number;
  totalCost: number;
  budgetVariance: number;
  budgetUtilization: number;
  directCosts: number;
  allocatedCosts: number;
  costByType: CostTypeBreakdownItem[];
}

export interface CostTypeTotal {
  costType: string;
  totalAmount: number;
  percentage: number;
  projectCount: number;
}

export interface ProjectCostBreakdownResponse {
  projects: ProjectCostBreakdownItem[];
  grandTotalCost: number;
  grandTotalBudget: number;
  overallBudgetUtilization: number;
  costTypesSummary: CostTypeTotal[];
  projectCount: number;
  currency: string;
  generatedAt: string;
}

// ============================================
// REPORT 9: PROJECT LABOR COST
// ============================================

export interface ProjectLaborCostFilters {
  month?: number;
  year?: number;
  siteId?: string;
  managerId?: string;
  projectStatus?: ProjectStatus;
  includeEmployeeDetails?: boolean;
  sortBy?: "totalLaborCost" | "employeeCount" | "laborPercentage";
  sortOrder?: "asc" | "desc";
}

export interface ProjectEmployeeCostDetail {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  position: string;
  department: string;
  allocationPercentage: number;
  salaryCost: number;
  allowanceCost: number;
  totalLaborCost: number;
}

export interface ProjectLaborCostItem {
  projectId: string;
  projectCode: string;
  projectName: string;
  status: ProjectStatus;
  siteId?: string;
  siteName?: string;
  budget: number;
  salaryCost: number;
  allowanceCost: number;
  totalLaborCost: number;
  otherCosts: number;
  totalProjectCost: number;
  laborBudgetPercentage: number;
  laborCostShare: number;
  assignedEmployeeCount: number;
  employeeDetails?: ProjectEmployeeCostDetail[];
}

export interface LaborCostSummary {
  totalLaborCost: number;
  totalSalaryCost: number;
  totalAllowanceCost: number;
  totalBudget: number;
  totalProjectCost: number;
  overallLaborShare: number;
  totalAssignedEmployees: number;
  avgLaborCostPerProject: number;
}

export interface ProjectLaborCostResponse {
  projects: ProjectLaborCostItem[];
  summary: LaborCostSummary;
  projectCount: number;
  currency: string;
  generatedAt: string;
}

// ============================================
// REPORT 10: PROJECT ASSET UTILIZATION
// ============================================

export interface ProjectAssetUtilizationFilters {
  month?: number;
  year?: number;
  siteId?: string;
  managerId?: string;
  projectStatus?: ProjectStatus;
  includeAssetDetails?: boolean;
  sortBy?: "totalAssets" | "totalAssetValue" | "maintenanceCost";
  sortOrder?: "asc" | "desc";
}

export interface ProjectAssetDetail {
  assetId: string;
  assetCode: string;
  assetName: string;
  assetType: string;
  assetStatus: string;
  purchasePrice: number;
  allocationPercentage: number;
  allocatedAssetValue: number;
  maintenanceCost: number;
  totalAssetCost: number;
  assignedDate: string;
  returnDate?: string;
}

export interface ProjectAssetUtilizationItem {
  projectId: string;
  projectCode: string;
  projectName: string;
  status: ProjectStatus;
  siteId?: string;
  siteName?: string;
  totalAssets: number;
  totalAllocatedAssetValue: number;
  totalMaintenanceCost: number;
  totalAssetCost: number;
  maintenanceIntensity: number;
  assets?: ProjectAssetDetail[];
}

export interface AssetUtilizationSummary {
  totalAssignedAssets: number;
  totalAllocatedAssetValue: number;
  totalMaintenanceCost: number;
  totalAssetCost: number;
  avgAssetsPerProject: number;
  overallMaintenanceIntensity: number;
}

export interface ProjectAssetUtilizationResponse {
  projects: ProjectAssetUtilizationItem[];
  summary: AssetUtilizationSummary;
  projectCount: number;
  currency: string;
  generatedAt: string;
}
