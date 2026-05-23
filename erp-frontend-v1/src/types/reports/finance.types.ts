/**
 * ============================================================================
 * FINANCE REPORTS TYPES
 * ============================================================================
 *
 * TypeScript interfaces for Finance reports module.
 * Matches backend DTOs structure exactly.
 *
 * @module types/reports/finance
 * @version 1.0.0
 */

/**
 * ============================================================================
 * OVERVIEW REPORT
 * ============================================================================
 */
export interface FinanceOverviewResponse {
  totalCosts: number;
  totalCount: number;
  averageCost: number;
  pendingAmount: number;
  pendingCount: number;
  approvedAmount: number;
  approvedCount: number;
  paidAmount: number;
  paidCount: number;
  overdueAmount: number;
  overdueCount: number;
  rejectedAmount: number;
  rejectedCount: number;
  partiallyPaidAmount: number;
  partiallyPaidCount: number;
  monthGrowthRate: number;
  currency: string;
  generatedAt: string;
}

/**
 * ============================================================================
 * COSTS BY TYPE REPORT
 * ============================================================================
 */
export interface CostTypeBreakdownItem {
  costType: string;
  costTypeName: string;
  amount: number;
  count: number;
  percentage: number;
  avgPerTransaction: number;
}

export interface CostsByTypeResponse {
  breakdown: CostTypeBreakdownItem[];
  totalAmount: number;
  totalCount: number;
  currency: string;
  generatedAt: string;
}

/**
 * ============================================================================
 * COSTS BY PAYMENT STATUS REPORT
 * ============================================================================
 */
export interface PaymentStatusBreakdownItem {
  status: string;
  statusName: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface CostsByPaymentStatusResponse {
  breakdown: PaymentStatusBreakdownItem[];
  totalAmount: number;
  totalCount: number;
  currency: string;
  generatedAt: string;
}

/**
 * ============================================================================
 * MONTHLY TREND REPORT
 * ============================================================================
 */
export interface MonthDataPoint {
  month: string; // "2026-01"
  monthName: string; // "Jan 2026"
  totalAmount: number;
  count: number;
  avgCost: number;
}

export interface MonthlyTrendResponse {
  data: MonthDataPoint[];
  totalAmount: number;
  totalCount: number;
  avgPerMonth: number;
  trend: "up" | "down" | "neutral";
  currency: string;
  generatedAt: string;
}

/**
 * ============================================================================
 * COSTS BY CATEGORY REPORT
 * ============================================================================
 */
export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface CostsByCategoryResponse {
  breakdown: CategoryBreakdownItem[];
  totalAmount: number;
  totalCount: number;
  currency: string;
  generatedAt: string;
}

/**
 * ============================================================================
 * COSTS BY PROJECT REPORT
 * ============================================================================
 */
export interface ProjectCostSummary {
  projectId: string;
  projectName: string;
  totalCost: number;
  costCount: number;
  paidAmount: number;
  pendingAmount: number;
  approvedAmount: number;
  percentage: number;
}

export interface CostsByProjectResponse {
  projects: ProjectCostSummary[];
  totalAmount: number;
  totalProjects: number;
  currency: string;
  generatedAt: string;
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * ============================================================================
 * PENDING APPROVALS REPORT
 * ============================================================================
 */
export interface PendingCostDetail {
  id: string;
  projectName: string;
  costType: string;
  costTypeName: string;
  amount: number;
  description: string;
  transactionDate: string;
  invoiceNumber?: string;
  daysWaiting: number;
  createdBy: string;
  createdAt: string;
}

export interface PendingApprovalsSummary {
  totalPending: number;
  count: number;
  oldestDays: number;
  avgDaysWaiting: number;
}

export interface PendingApprovalsResponse {
  summary: PendingApprovalsSummary;
  data: PendingCostDetail[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  currency: string;
  generatedAt: string;
}

/**
 * ============================================================================
 * OVERDUE PAYMENTS REPORT
 * ============================================================================
 */
export interface OverduePaymentDetail {
  id: string;
  projectName: string;
  costType: string;
  costTypeName: string;
  amount: number;
  transactionDate: string;
  invoiceNumber?: string;
  description?: string;
  daysOverdue: number;
  createdAt: string;
}

export interface OverduePaymentsSummary {
  totalOverdue: number;
  count: number;
  avgDaysOverdue: number;
  maxDaysOverdue: number;
}

export interface OverduePaymentsResponse {
  summary: OverduePaymentsSummary;
  data: OverduePaymentDetail[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  currency: string;
  generatedAt: string;
}

/**
 * ============================================================================
 * TAX SUMMARY REPORT
 * ============================================================================
 */
export interface TaxMonthlyBreakdownItem {
  month: string;
  monthName: string;
  amountBeforeTax: number;
  taxAmount: number;
  totalAmount: number;
  taxedCount: number;
}

export interface TaxSummaryResponse {
  totalAmountBeforeTax: number;
  totalTaxAmount: number;
  totalAmountWithTax: number;
  effectiveTaxRate: number;
  taxedEntriesCount: number;
  nonTaxedEntriesCount: number;
  monthlyBreakdown: TaxMonthlyBreakdownItem[];
  currency: string;
  generatedAt: string;
}
