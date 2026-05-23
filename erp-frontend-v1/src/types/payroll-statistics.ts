/**
 * ============================================================================
 * PAYROLL STATISTICS TYPES
 * ============================================================================
 *
 * TypeScript types for payroll analytics and reporting
 * Mirrors backend DTOs for type safety and IntelliSense support
 *
 * Design Decisions:
 * - All amounts are numbers (JSON-serialized from backend Decimal)
 * - Enums use string literals for better type safety
 * - Date fields are strings (ISO format from API)
 *
 * @version 1.0.0
 * @author ERP System - Senior Frontend Developer
 */

// ============================================================================
// ENUMS - Match backend Prisma enums
// ============================================================================

export type EmploymentType =
  | "PERMANENT"
  | "CONTRACT"
  | "FREELANCE"
  | "PART_TIME";

export type DeductionType =
  | "LOAN_REPAYMENT"
  | "INSURANCE"
  | "TAX"
  | "PENALTY"
  | "ADVANCE_DEDUCTION"
  | "ABSENCE"
  | "OTHER";

export type LoanStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

// ============================================================================
// BREAKDOWN TYPES - Used for chart data
// ============================================================================

/**
 * Employment Type Distribution
 * Shows salary distribution across employment types
 */
export interface EmploymentTypeBreakdown {
  employmentType: EmploymentType;
  employeeCount: number;
  totalSalary: number;
  averageSalary: number;
  percentage: number;
}

/**
 * Department-wise Salary Distribution
 * Shows how payroll is distributed across departments
 */
export interface DepartmentBreakdown {
  department: string;
  employeeCount: number;
  totalSalary: number;
  averageSalary: number;
  percentage: number;
}

/**
 * Allowance Type Distribution
 * Shows breakdown of allowances by type
 */
export interface AllowanceStatBreakdown {
  allowanceTypeId: string;
  allowanceTypeName: string;
  employeeCount: number;
  totalAmount: number;
  averageAmount: number;
  percentage: number;
}

/**
 * Deduction Type Distribution
 * Shows breakdown of deductions by type
 */
export interface DeductionStatBreakdown {
  deductionType: DeductionType;
  employeeCount: number;
  totalAmount: number;
  averageAmount: number;
  percentage: number;
}

/**
 * Loan Status Distribution
 * Shows breakdown of loans by status
 */
export interface LoanStatusBreakdown {
  status: LoanStatus;
  loanCount: number;
  totalAmount: number;
  remainingAmount: number;
  percentage: number;
}

// ============================================================================
// TREND TYPES - Used for time-series data
// ============================================================================

/**
 * Monthly Payroll Trend
 * Shows payroll evolution over time (last N months)
 */
export interface MonthlyPayrollTrend {
  month: string; // "Jan 2026"
  totalPayroll: number;
  baseSalaries: number;
  totalAllowances: number;
  totalDeductions: number;
  netPayroll: number;
  employeeCount: number;
}

// ============================================================================
// TOP EMPLOYEE TYPE
// ============================================================================

/**
 * Top Earning Employees
 * Shows employees with highest total compensation
 */
export interface TopEmployee {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  employmentType: EmploymentType;
  baseSalary: number;
  totalAllowances: number;
  totalCompensation: number;
}

// ============================================================================
// MAIN STATISTICS TYPE
// ============================================================================

/**
 * Complete Payroll Statistics
 * Aggregates all payroll metrics and analytics
 *
 * Performance Notes:
 * - All data fetched in a single API call
 * - Memoize computed values in components
 * - Use React Query for caching and background updates
 */
export interface PayrollStatistics {
  // ========== OVERVIEW METRICS ==========
  totalBaseSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  netPayroll: number;
  totalEmployees: number;
  averageSalary: number;
  activeLoanCount: number;
  totalLoanAmount: number;
  remainingLoanBalance: number;

  // ========== BREAKDOWNS ==========
  employmentTypeBreakdown: EmploymentTypeBreakdown[];
  departmentBreakdown: DepartmentBreakdown[];
  allowanceBreakdown: AllowanceStatBreakdown[];
  deductionBreakdown: DeductionStatBreakdown[];
  loanStatusBreakdown: LoanStatusBreakdown[];

  // ========== TRENDS ==========
  monthlyTrend: MonthlyPayrollTrend[];
  topEmployees: TopEmployee[];

  // ========== RECENT ACTIVITY ==========
  recentHires: number;
  recentLoanApprovals: number;
  growthRate: number;

  // ========== METADATA ==========
  currency: string;
  calculatedAt: string; // ISO date string
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Query parameters for statistics API
 */
export interface PayrollStatisticsParams {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

/**
 * API Response wrapper (if using standard response format)
 */
export interface PayrollStatisticsResponse {
  data: PayrollStatistics;
  success: boolean;
  message?: string;
}

// ============================================================================
// CHART DATA TRANSFORMATION TYPES
// ============================================================================

/**
 * Transformed data for PieChart component
 * Generic structure that works with our reusable PieChart
 */
export interface PieChartData {
  name: string;
  value: number;
  count?: number;
}

/**
 * Transformed data for BarChart component
 * Generic structure that works with our reusable BarChart
 */
export interface BarChartData {
  [key: string]: string | number;
}

/**
 * Transformed data for LineChart component
 * Generic structure that works with our reusable LineChart
 */
export interface LineChartData {
  [key: string]: string | number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Employment type labels for UI display
 */
export const EMPLOYMENT_TYPE_LABELS: Record<
  EmploymentType,
  { en: string; ar: string }
> = {
  PERMANENT: { en: "Permanent", ar: "دائم" },
  CONTRACT: { en: "Contract", ar: "عقد" },
  FREELANCE: { en: "Freelance", ar: "مستقل" },
  PART_TIME: { en: "Part Time", ar: "دوام جزئي" },
};

/**
 * Deduction type labels for UI display
 */
export const DEDUCTION_TYPE_LABELS: Record<
  DeductionType,
  { en: string; ar: string }
> = {
  LOAN_REPAYMENT: { en: "Loan Repayment", ar: "سداد قرض" },
  INSURANCE: { en: "Insurance", ar: "تأمين" },
  TAX: { en: "Tax", ar: "ضريبة" },
  PENALTY: { en: "Penalty", ar: "غرامة" },
  ADVANCE_DEDUCTION: { en: "Advance Deduction", ar: "خصم مقدم" },
  ABSENCE: { en: "Absence", ar: "غياب" },
  OTHER: { en: "Other", ar: "أخرى" },
};

/**
 * Loan status labels for UI display
 */
export const LOAN_STATUS_LABELS: Record<
  LoanStatus,
  { en: string; ar: string }
> = {
  PENDING: { en: "Pending", ar: "قيد الانتظار" },
  APPROVED: { en: "Approved", ar: "موافق عليه" },
  REJECTED: { en: "Rejected", ar: "مرفوض" },
  COMPLETED: { en: "Completed", ar: "مكتمل" },
};
