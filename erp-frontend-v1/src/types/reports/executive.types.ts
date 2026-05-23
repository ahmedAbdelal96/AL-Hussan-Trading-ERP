/**
 * ============================================================================
 * EXECUTIVE REPORTS — Frontend Types
 * ============================================================================
 *
 * Mirrors the backend executive-responses.dto.ts and executive-filters.dto.ts
 * one-to-one.  All monetary values are in SAR unless noted otherwise.
 */


export type DashboardPeriod = "MTD" | "QTD" | "YTD" | "CUSTOM";
export type PnlPeriod = "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM";


export interface PeriodBoundary {
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  label: string; // Human-readable, e.g. "Feb 2026" or "YTD 2026"
}

// ============================================================================
// EXECUTIVE DASHBOARD
// ============================================================================

export interface ExecutiveDashboardFilters {
  period?: DashboardPeriod;
  startDate?: string;
  endDate?: string;
}

export interface ExecutiveKpi {
  // Projects
  activeProjects: number;
  atRiskProjects: number;
  totalContractValue: number;
  // Financial
  laborCostPeriod: number;
  totalCostsPeriod: number;
  budgetUtilizationPct: number | null;
  // Workforce
  headcount: number;
  // Assets
  assetUtilizationPct: number;
  idleAssets: number;
  // Maintenance
  maintenanceOverdue: number;
  maintenancePending: number;
}

export interface ProjectStatusSlice {
  status: string;
  count: number;
  percentage: number;
}

export interface MonthlyCostPoint {
  /** "YYYY-MM" e.g. "2026-02" */
  month: string;
  totalCost: number;
  laborCost: number;
  otherCost: number;
}

export interface CostByTypeSlice {
  costType: string;
  amount: number;
  percentage: number;
}

export interface ExecutiveDashboardResponse {
  kpi: ExecutiveKpi;
  projectStatusDistribution: ProjectStatusSlice[];
  monthlyCostTrend: MonthlyCostPoint[];
  costByType: CostByTypeSlice[];
  currency: string;
  period: PeriodBoundary;
  generatedAt: string;
}

// ============================================================================
// COMPANY P&L
// ============================================================================

export interface CompanyPnlFilters {
  period?: PnlPeriod;
  month?: number; // 1–12
  year?: number;
  startDate?: string;
  endDate?: string;
  includeProjectBreakdown?: boolean;
  includeCostBreakdown?: boolean;
  includeMonthlyTrend?: boolean;
}

export interface PnlCostTypeDetail {
  costType: string;
  amount: number;
  /** Percentage of totalCosts */
  percentage: number;
}

export interface PnlMonthlyPoint {
  /** "YYYY-MM" */
  month: string;
  revenue: number;
  totalCosts: number;
  grossProfit: number;
  /** null when revenue = 0 */
  grossMarginPct: number | null;
}

export interface PnlProjectBreakdown {
  projectId: string;
  projectCode: string;
  projectName: string;
  projectStatus: string;
  contractValue: number;
  totalCosts: number;
  grossProfit: number;
  /** null when contractValue = 0 */
  grossMarginPct: number | null;
}

export interface CompanyPnlResponse {
  period: PeriodBoundary;
  // Revenue
  totalRevenue: number;
  revenueSource: string;
  // Cost buckets
  laborCost: number;
  materialsCost: number;
  equipmentCost: number;
  fieldOpsCost: number;
  adminCost: number;
  totalCosts: number;
  // Profitability
  grossProfit: number;
  grossMarginPct: number | null;
  costToRevenueRatio: number | null;
  // Optional breakdowns
  costByType?: PnlCostTypeDetail[];
  monthlyTrend?: PnlMonthlyPoint[];
  topProjectsByCost?: PnlProjectBreakdown[];
  currency: string;
  generatedAt: string;
}
