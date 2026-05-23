// ============================================================================
// MAINTENANCE REPORTS — TYPE DEFINITIONS
// ============================================================================

// ----- Enums -----

export type MaintenanceType =
  | "PREVENTIVE"
  | "CORRECTIVE"
  | "EMERGENCY"
  | "SCHEDULED";

export type MaintenanceStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AssetType =
  | "VEHICLE"
  | "EQUIPMENT"
  | "MACHINERY"
  | "BUILDING"
  | "TOOL"
  | "TECHNOLOGY"
  | "FURNITURE"
  | "OTHER";

// ============================================================================
// FILTER INTERFACES
// ============================================================================

export interface BaseMaintenanceFilters {
  startDate?: string;
  endDate?: string;
  maintenanceType?: MaintenanceType;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  assetType?: AssetType;
  assetId?: string;
  projectId?: string;
  assignedTo?: string;
  vendor?: string;
  page?: number;
  limit?: number;
}

export interface ReportPaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface MaintenanceOverviewFilters extends BaseMaintenanceFilters {
  includeComparison?: boolean;
  includeOverdueAlerts?: boolean;
}

export interface MaintenanceByTypeFilters extends BaseMaintenanceFilters {
  minRequests?: number;
  includeTopAssets?: boolean;
  sortBy?: "count" | "cost" | "duration" | "type";
  sortOrder?: "asc" | "desc";
}

export interface MaintenanceByStatusFilters extends BaseMaintenanceFilters {
  includeTransitions?: boolean;
  includeAlerts?: boolean;
  sortBy?: "count" | "status" | "avgDuration";
}

export interface MaintenanceByAssetFilters extends BaseMaintenanceFilters {
  minFrequency?: number;
  includeHistory?: boolean;
  includeCostRatio?: boolean;
  sortBy?: "frequency" | "cost" | "lastMaintenance" | "assetName";
}

export interface MaintenanceCostAnalysisFilters extends BaseMaintenanceFilters {
  minCost?: number;
  maxCost?: number;
  includeVariance?: boolean;
  includeTrends?: boolean;
  includeTopCostly?: boolean;
}

export interface MaintenancePerformanceFilters extends BaseMaintenanceFilters {
  includeEmployeeMetrics?: boolean;
  includeVendorMetrics?: boolean;
  includeMTTR?: boolean;
  includeOnTimeMetrics?: boolean;
}

export interface PreventiveMaintenanceFilters extends BaseMaintenanceFilters {
  includeUpcoming?: boolean;
  includeOverdue?: boolean;
  includeUnscheduled?: boolean;
  daysAhead?: number;
  includeCostSavings?: boolean;
}

// ============================================================================
// RESPONSE INTERFACES — REPORT 1: OVERVIEW
// ============================================================================

export interface StatusDistribution {
  status: MaintenanceStatus;
  count: number;
  percentage: number;
  totalCost: number;
}

export interface TypeDistribution {
  type: MaintenanceType;
  count: number;
  percentage: number;
  totalCost: number;
}

export interface PriorityDistribution {
  priority: MaintenancePriority;
  count: number;
  percentage: number;
  totalCost: number;
}

export interface PeriodComparison {
  previousPeriodCount: number;
  previousPeriodCompleted: number;
  previousPeriodCost: number;
  countChangePercentage: number;
  costChangePercentage: number;
}

export interface OverdueMaintenance {
  maintenanceNumber: string;
  title: string;
  assetId: string;
  assetNumber: string;
  assetName: string;
  priority: MaintenancePriority;
  scheduledDate: string;
  daysOverdue: number;
  estimatedCost: number;
}

export interface MaintenanceOverviewResponse {
  totalRequests: number;
  completedRequests: number;
  inProgressRequests: number;
  pendingRequests: number;
  completionRate: number;
  averageRepairTime: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  costSavings: number;
  costSavingsPercentage: number;
  statusDistribution: StatusDistribution[];
  typeDistribution: TypeDistribution[];
  priorityDistribution: PriorityDistribution[];
  overdueCount: number;
  overduePercentage: number;
  periodComparison?: PeriodComparison;
  overdueAlerts?: OverdueMaintenance[];
}

// ============================================================================
// RESPONSE INTERFACES — REPORT 2: BY TYPE
// ============================================================================

export interface TopAssetForType {
  assetId: string;
  assetNumber: string;
  assetName: string;
  assetType: AssetType;
  maintenanceCount: number;
  totalCost: number;
}

export interface MaintenanceTypeBreakdown {
  type: MaintenanceType;
  count: number;
  percentage: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  costVariance: number;
  costVariancePercentage: number;
  averageDuration: number;
  completedCount: number;
  completionRate: number;
  topAssets?: TopAssetForType[];
}

export interface MaintenanceByTypeResponse {
  totalRequests: number;
  breakdown: MaintenanceTypeBreakdown[];
  startDate: string;
  endDate: string;
}

// ============================================================================
// RESPONSE INTERFACES — REPORT 3: BY STATUS
// ============================================================================

export interface StatusTransition {
  fromStatus: MaintenanceStatus;
  toStatus: MaintenanceStatus;
  count: number;
  averageTimeInHours: number;
}

export interface DelayedMaintenanceAlert {
  maintenanceNumber: string;
  title: string;
  status: MaintenanceStatus;
  assetId: string;
  assetNumber: string;
  daysInCurrentStatus: number;
  priority: MaintenancePriority;
}

export interface MaintenanceStatusBreakdown {
  status: MaintenanceStatus;
  count: number;
  percentage: number;
  totalCost: number;
  averageDaysInStatus: number;
  averageCompletionTime: number;
  transitions?: StatusTransition[];
}

export interface MaintenanceByStatusResponse {
  totalRequests: number;
  breakdown: MaintenanceStatusBreakdown[];
  overallCompletionRate: number;
  cancelledCount: number;
  cancellationRate: number;
  delayedAlerts?: DelayedMaintenanceAlert[];
  startDate: string;
  endDate: string;
}

// ============================================================================
// RESPONSE INTERFACES — REPORT 4: BY ASSET
// ============================================================================

export interface MaintenanceHistoryEntry {
  maintenanceNumber: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  date: string;
  cost: number;
  description: string;
}

export interface AssetMaintenanceBreakdown {
  assetId: string;
  assetNumber: string;
  assetName: string;
  assetType: AssetType;
  maintenanceCount: number;
  totalCost: number;
  averageCostPerMaintenance: number;
  lastMaintenanceDate: string;
  daysSinceLastMaintenance: number;
  preventiveCount: number;
  correctiveCount: number;
  assetValue?: number;
  costToValueRatio?: number;
  recentHistory?: MaintenanceHistoryEntry[];
}

export interface MaintenanceByAssetResponse {
  totalAssets: number;
  totalMaintenanceRequests: number;
  breakdown: AssetMaintenanceBreakdown[];
  meta?: ReportPaginationMeta;
  averageMaintenanceFrequency: number;
  startDate: string;
  endDate: string;
}

// ============================================================================
// RESPONSE INTERFACES — REPORT 5: COST ANALYSIS
// ============================================================================

export interface MonthlyCostTrend {
  month: string;
  requestCount: number;
  estimatedCost: number;
  actualCost: number;
  costVariance: number;
  variancePercentage: number;
}

export interface CostByType {
  type: MaintenanceType;
  requestCount: number;
  estimatedCost: number;
  actualCost: number;
  costVariance: number;
  variancePercentage: number;
  averageCostPerRequest: number;
}

export interface CostByAssetType {
  assetType: AssetType;
  assetCount: number;
  requestCount: number;
  totalCost: number;
  averageCostPerRequest: number;
  averageCostPerAsset: number;
}

export interface CostByVendor {
  vendor: string;
  requestCount: number;
  totalCost: number;
  averageCostPerRequest: number;
  percentageOfTotalCost: number;
}

export interface TopCostlyMaintenance {
  maintenanceNumber: string;
  title: string;
  assetId: string;
  assetNumber: string;
  assetName: string;
  type: MaintenanceType;
  estimatedCost: number;
  actualCost: number;
  costVariance: number;
  variancePercentage: number;
}

export interface MaintenanceCostAnalysisResponse {
  totalRequests: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  totalCostVariance: number;
  variancePercentage: number;
  averageCostPerRequest: number;
  costByType: CostByType[];
  costByAssetType: CostByAssetType[];
  costByVendor?: CostByVendor[];
  monthlyTrends?: MonthlyCostTrend[];
  topCostlyRequests?: TopCostlyMaintenance[];
  startDate: string;
  endDate: string;
}

// ============================================================================
// RESPONSE INTERFACES — REPORT 6: PERFORMANCE
// ============================================================================

export interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  assignedCount: number;
  completedCount: number;
  completionRate: number;
  averageCompletionTime: number;
  onTimeCompletions: number;
  onTimeRate: number;
}

export interface VendorPerformance {
  vendor: string;
  assignedCount: number;
  completedCount: number;
  completionRate: number;
  averageCompletionTime: number;
  totalCost: number;
  averageCostPerRequest: number;
  costVariancePercentage: number;
}

export interface MTTRByType {
  type: MaintenanceType;
  mttr: number;
  completedCount: number;
}

export interface OnTimeMetrics {
  totalCompleted: number;
  onTimeCompletions: number;
  lateCompletions: number;
  onTimeRate: number;
  averageDelayDays: number;
}

export interface MaintenancePerformanceResponse {
  totalRequests: number;
  completedRequests: number;
  overallCompletionRate: number;
  mttr: number;
  mtbf: number;
  mttrByType: MTTRByType[];
  onTimeMetrics?: OnTimeMetrics;
  employeePerformance?: EmployeePerformance[];
  vendorPerformance?: VendorPerformance[];
  emergencyResponseRate: number;
  averageEmergencyResponseTime: number;
  startDate: string;
  endDate: string;
}

// ============================================================================
// RESPONSE INTERFACES — REPORT 7: PREVENTIVE
// ============================================================================

export interface UpcomingPreventiveMaintenance {
  maintenanceNumber: string;
  title: string;
  assetId: string;
  assetNumber: string;
  assetName: string;
  assetType: AssetType;
  scheduledDate: string;
  daysUntilDue: number;
  estimatedCost: number;
  status: MaintenanceStatus;
}

export interface OverduePreventiveMaintenance {
  assetId: string;
  assetNumber: string;
  assetName: string;
  assetType: AssetType;
  maintenanceNumber: string;
  title: string;
  scheduledDate: string;
  daysOverdue: number;
  priority: MaintenancePriority;
}

export interface UnscheduledAsset {
  assetId: string;
  assetNumber: string;
  assetName: string;
  assetType: AssetType;
  purchaseDate: string;
  daysSincePurchase: number;
  correctiveMaintenanceCount: number;
  totalCorrectiveCost: number;
}

export interface CostSavingsAnalysis {
  preventiveCount: number;
  preventiveCost: number;
  correctiveCount: number;
  correctiveCost: number;
  avgPreventiveCost: number;
  avgCorrectiveCost: number;
  estimatedSavingsPerPreventive: number;
  totalEstimatedSavings: number;
  preventiveToCorrectiveRatio: number;
}

export interface PreventiveMaintenanceResponse {
  totalPreventiveCount: number;
  completedPreventiveCount: number;
  upcomingCount: number;
  overdueCount: number;
  complianceRate: number;
  totalPreventiveCost: number;
  upcomingSchedule?: UpcomingPreventiveMaintenance[];
  overduePreventive?: OverduePreventiveMaintenance[];
  unscheduledAssets?: UnscheduledAsset[];
  costSavings?: CostSavingsAnalysis;
  startDate: string;
  endDate: string;
}

// ============================================================================
// FILTER INTERFACES — PHASE 2 DEEP-DIVE REPORTS
// ============================================================================

export interface MaintenanceMtbfMttrFilters extends BaseMaintenanceFilters {
  sortBy?: "mttr" | "mtbf" | "assetName" | "failureCount";
  sortOrder?: "asc" | "desc";
  minCompletedCount?: number;
}

export interface MaintenanceCostPerAssetFilters extends BaseMaintenanceFilters {
  sortBy?: "totalCost" | "avgCost" | "assetName" | "requestCount" | "costRatio";
  sortOrder?: "asc" | "desc";
  minCost?: number;
  includeTypeBreakdown?: boolean;
}

export interface MaintenanceBudgetActualFilters extends BaseMaintenanceFilters {
  groupBy?: "month" | "assetType" | "maintenanceType";
}

// ============================================================================
// RESPONSE INTERFACES — REPORT 8: MTBF/MTTR PER ASSET
// ============================================================================

export interface AssetMtbfMttrItem {
  assetId: string;
  assetNumber: string;
  assetName: string;
  assetType: string;
  totalMaintenanceCount: number;
  completedCount: number;
  /** Mean Time To Repair in days */
  mttr: number;
  /** Mean Time Between Failures in days (0 if < 2 completed) */
  mtbf: number;
  firstMaintenanceDate?: string;
  lastMaintenanceDate?: string;
  /** 0-100 reliability score: high MTBF + low MTTR = better */
  reliabilityScore: number;
}

export interface MtbfMttrSummary {
  totalAssets: number;
  avgMttr: number;
  avgMtbf: number;
  avgReliabilityScore: number;
}

export interface MaintenanceMtbfMttrResponse {
  assets: AssetMtbfMttrItem[];
  summary: MtbfMttrSummary;
  meta?: ReportPaginationMeta;
  generatedAt: string;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// RESPONSE INTERFACES — REPORT 9: COST PER ASSET
// ============================================================================

export interface AssetCostByType {
  maintenanceType: string;
  requestCount: number;
  estimatedCost: number;
  actualCost: number;
}

export interface AssetCostItem {
  assetId: string;
  assetNumber: string;
  assetName: string;
  assetType: string;
  requestCount: number;
  totalEstimated: number;
  totalActual: number;
  /** estimated - actual (+= under budget) */
  costVariance: number;
  variancePercentage: number | null;
  avgCostPerRequest: number;
  purchasePrice?: number | null;
  /** (totalActual / purchasePrice) * 100; null if no price */
  costToValueRatio?: number | null;
  costByType?: AssetCostByType[];
}

export interface CostPerAssetSummary {
  totalAssets: number;
  grandTotalActual: number;
  grandTotalEstimated: number;
  totalVariance: number;
  avgCostPerAsset: number;
  mostExpensiveAssetName?: string;
}

export interface MaintenanceCostPerAssetResponse {
  assets: AssetCostItem[];
  summary: CostPerAssetSummary;
  meta?: ReportPaginationMeta;
  currency: string;
  generatedAt: string;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// RESPONSE INTERFACES — REPORT 10: BUDGET VS. ACTUAL
// ============================================================================

export interface BudgetPeriodItem {
  /** "2026-01" | "VEHICLE" | "PREVENTIVE" depending on groupBy */
  period: string;
  requestCount: number;
  estimatedCost: number;
  actualCost: number;
  /** estimated - actual (+= under budget) */
  variance: number;
  variancePercentage: number | null;
  budgetStatus: "UNDER_BUDGET" | "ON_BUDGET" | "OVER_BUDGET";
}

export interface BudgetActualSummary {
  totalRequests: number;
  totalEstimated: number;
  totalActual: number;
  totalVariance: number;
  variancePercentage: number | null;
  overBudgetCount: number;
  underBudgetCount: number;
  onBudgetCount: number;
}

export interface MaintenanceBudgetActualResponse {
  items: BudgetPeriodItem[];
  summary: BudgetActualSummary;
  meta?: ReportPaginationMeta;
  groupBy: "month" | "assetType" | "maintenanceType";
  currency: string;
  generatedAt: string;
  startDate?: string;
  endDate?: string;
}
