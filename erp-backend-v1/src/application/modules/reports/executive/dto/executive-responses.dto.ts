/**
 * ============================================================================
 * EXECUTIVE REPORTS — Response DTOs
 * ============================================================================
 *
 * Two response shapes:
 *
 *  ExecutiveDashboardResponseDto — cross-module KPI snapshot
 *  CompanyPnlResponseDto         — Company-level P&L statement
 *
 * All monetary values are in SAR (Saudi Riyal) unless the `currency` field
 * says otherwise.  Decimal precision is rounded to 2 decimal places server-side.
 */

// ============================================================================
// EXECUTIVE DASHBOARD
// ============================================================================

/**
 * Core KPI figures shown in the top card row of the Executive Dashboard.
 */
export class ExecutiveKpiDto {
  // ── Projects ──────────────────────────────────────────────────────────────
  /** Projects with status = ACTIVE */
  activeProjects: number;
  /** Projects past their plannedEndDate and not yet finished */
  atRiskProjects: number;
  /** Total sum of budgets for all ACTIVE projects (contract value proxy) */
  totalContractValue: number;

  // ── Financial ─────────────────────────────────────────────────────────────
  /** Sum of SALARY + ALLOWANCE costs in the selected period */
  laborCostPeriod: number;
  /** Sum of ALL costs in the selected period (excluding REJECTED) */
  totalCostsPeriod: number;
  /**
   * totalCostsPeriod / totalContractValue × 100
   * Null when totalContractValue = 0 (no active projects with budgets).
   */
  budgetUtilizationPct: number | null;

  // ── Workforce ─────────────────────────────────────────────────────────────
  /** Active employees (status = ACTIVE, not soft-deleted) */
  headcount: number;

  // ── Assets ────────────────────────────────────────────────────────────────
  /** Percentage of non-retired assets currently IN_USE */
  assetUtilizationPct: number;
  /** Assets with status = AVAILABLE (not assigned to any active project) */
  idleAssets: number;

  // ── Maintenance ───────────────────────────────────────────────────────────
  /** PENDING or IN_PROGRESS maintenance requests past their scheduledDate */
  maintenanceOverdue: number;
  /** Total open maintenance requests (PENDING + IN_PROGRESS + ON_HOLD) */
  maintenancePending: number;
}

/** One slice of the project-status pie */
export class ProjectStatusSliceDto {
  status: string;
  count: number;
  percentage: number;
}

/** One data point in the 6-month cost trend sparkline */
export class MonthlyCostPointDto {
  /** "YYYY-MM" e.g. "2026-02" */
  month: string;
  totalCost: number;
  laborCost: number;
  otherCost: number;
}

/** One slice of the cost-by-type breakdown */
export class CostByTypeSliceDto {
  costType: string;
  amount: number;
  percentage: number;
}

/** Period boundaries included in every response for client display */
export class PeriodBoundaryDto {
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  label: string; // Human-readable, e.g. "Feb 2026" or "YTD 2026"
}

export class ExecutiveDashboardResponseDto {
  kpi: ExecutiveKpiDto;
  projectStatusDistribution: ProjectStatusSliceDto[];
  /** Last 6 complete calendar months + the current partial month */
  monthlyCostTrend: MonthlyCostPointDto[];
  /** Cost breakdown for the selected period */
  costByType: CostByTypeSliceDto[];
  currency: string;
  period: PeriodBoundaryDto;
  generatedAt: string;
}

// ============================================================================
// COMPANY P&L
// ============================================================================

/**
 * Detailed cost breakdown for a single CostType (or group of types).
 * Included only when `includeCostBreakdown = true`.
 */
export class PnlCostTypeDetailDto {
  costType: string;
  amount: number;
  /** Percentage of totalCosts */
  percentage: number;
}

/**
 * A single month's financial snapshot for the 12-month trend.
 * Included only when `includeMonthlyTrend = true`.
 */
export class PnlMonthlyPointDto {
  /** "YYYY-MM" */
  month: string;
  revenue: number;
  totalCosts: number;
  grossProfit: number;
  /** null when revenue = 0 */
  grossMarginPct: number | null;
}

/**
 * Per-project cost + profitability row.
 * Included only when `includeProjectBreakdown = true` (top 10 by cost).
 */
export class PnlProjectBreakdownDto {
  projectId: string;
  projectCode: string;
  projectName: string;
  projectStatus: string;
  /** project.budget (contract value proxy) */
  contractValue: number;
  /** Sum of costs for this project in the period */
  totalCosts: number;
  grossProfit: number;
  /** null when contractValue = 0 */
  grossMarginPct: number | null;
}

export class CompanyPnlResponseDto {
  period: PeriodBoundaryDto;

  // ── Revenue ───────────────────────────────────────────────────────────────
  /**
   * Sum of project.budget for ACTIVE / ON_HOLD / COMPLETED projects.
   * This is a contracted-value proxy — NOT collected cash.
   */
  totalRevenue: number;
  /**
   * Clarifies to the client what revenue represents.
   * Value: "contracted_project_values"
   */
  revenueSource: string;

  // ── Cost buckets ──────────────────────────────────────────────────────────
  /** SALARY + ALLOWANCE */
  laborCost: number;
  /** MATERIAL + PURCHASE */
  materialsCost: number;
  /** EQUIPMENT_RENTAL */
  equipmentCost: number;
  /** FUEL + TRANSPORTATION + MAINTENANCE */
  fieldOpsCost: number;
  /** UTILITY + INSURANCE + TAX + SUBCONTRACTOR + OTHER */
  adminCost: number;
  totalCosts: number;

  // ── Profitability ─────────────────────────────────────────────────────────
  grossProfit: number;
  /** null when totalRevenue = 0 */
  grossMarginPct: number | null;
  /** totalCosts / totalRevenue — null when totalRevenue = 0 */
  costToRevenueRatio: number | null;

  // ── Optional breakdowns ───────────────────────────────────────────────────
  /** Populated when includeCostBreakdown = true */
  costByType?: PnlCostTypeDetailDto[];
  /** Populated when includeMonthlyTrend = true — last 12 months */
  monthlyTrend?: PnlMonthlyPointDto[];
  /** Populated when includeProjectBreakdown = true — top 10 projects by cost */
  topProjectsByCost?: PnlProjectBreakdownDto[];

  currency: string;
  generatedAt: string;
}
