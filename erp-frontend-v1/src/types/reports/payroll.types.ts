/**
 * Payroll Reports - TypeScript Type Definitions
 *
 * @description Type interfaces for all 8 Payroll report endpoints
 * @module types/reports/payroll.types
 *
 * @remarks
 * - Mirrors backend DTOs from payroll-responses-part1.dto.ts & part2.dto.ts
 * - All interfaces are read-only response shapes
 *
 * @author ERP System
 * @date 2026-01-24
 */

// ============================================
// SHARED FILTER TYPE
// ============================================

/**
 * Common query parameters for Payroll reports
 */
export interface PayrollReportFilters {
  /** Month number (1-12) */
  month?: number;
  /** Year (e.g., 2026) */
  year?: number;
  /** Filter by department ID (UUID) */
  departmentId?: string;
  /** Filter by site ID (UUID) */
  siteId?: string;
  /** Filter by employee status (ACTIVE, INACTIVE, etc.) */
  employeeStatus?: string;
  /** Number of months for trend analysis */
  periodMonths?: number;
  /** Period 1 month for comparison */
  period1Month?: number;
  /** Period 1 year for comparison */
  period1Year?: number;
  /** Period 2 month for comparison */
  period2Month?: number;
  /** Period 2 year for comparison */
  period2Year?: number;
}

// ============================================
// REPORT 1 — PAYROLL OVERVIEW
// ============================================

/**
 * Response from GET /reports/payroll/overview
 */
export interface PayrollOverviewResponse {
  /** Total base salaries for all employees */
  totalBaseSalaries: number;
  /** Total allowances for all employees */
  totalAllowances: number;
  /** Total deductions for all employees */
  totalDeductions: number;
  /** Net payroll (base + allowances - deductions) */
  netPayroll: number;
  /** Total number of employees in payroll */
  employeeCount: number;
  /** Average net salary per employee */
  avgSalaryPerEmployee: number;
  /** Average base salary */
  avgBaseSalary: number;
  /** Average allowances per employee */
  avgAllowances: number;
  /** Average deductions per employee */
  avgDeductions: number;
  /** Month-over-month growth rate (optional) */
  monthGrowthRate?: number;
  /** Previous month's net payroll (optional) */
  previousMonthPayroll?: number;
  /** Previous month's employee count (optional) */
  previousMonthEmployeeCount?: number;
  /** Currency code (e.g., "SAR") */
  currency: string;
  /** Report month (1-12) */
  month: number;
  /** Report year */
  year: number;
  /** Report generation timestamp */
  generatedAt: string;
}

// ============================================
// REPORT 2 — PAYROLL BY DEPARTMENT
// ============================================

/**
 * Payroll breakdown for a single department
 */
export interface DepartmentPayrollItem {
  departmentId: string;
  departmentName: string;
  departmentNameAr?: string;
  employeeCount: number;
  totalBaseSalaries: number;
  totalAllowances: number;
  totalDeductions: number;
  netPayroll: number;
  percentageOfTotal: number;
  avgSalaryPerEmployee: number;
  avgBaseSalary: number;
  avgAllowances: number;
  avgDeductions: number;
}

/**
 * Response from GET /reports/payroll/by-department
 */
export interface PayrollByDepartmentResponse {
  departments: DepartmentPayrollItem[];
  totalPayroll: number;
  totalEmployees: number;
  currency: string;
  month: number;
  year: number;
  generatedAt: string;
}

// ============================================
// REPORT 3 — PAYROLL BY SITE
// ============================================

/**
 * Payroll breakdown for a single site
 */
export interface SitePayrollItem {
  siteId: string;
  siteName: string;
  siteNameAr?: string;
  siteCode: string;
  employeeCount: number;
  totalBaseSalaries: number;
  totalAllowances: number;
  totalDeductions: number;
  netPayroll: number;
  percentageOfTotal: number;
  avgSalaryPerEmployee: number;
  avgBaseSalary: number;
  avgAllowances: number;
  avgDeductions: number;
}

/**
 * Response from GET /reports/payroll/by-site
 */
export interface PayrollBySiteResponse {
  sites: SitePayrollItem[];
  totalPayroll: number;
  totalEmployees: number;
  currency: string;
  month: number;
  year: number;
  generatedAt: string;
}

// ============================================
// REPORT 4 — SALARY COMPONENTS BREAKDOWN
// ============================================

/**
 * Allowance type breakdown item
 */
export interface AllowanceTypeBreakdown {
  allowanceTypeId: string;
  allowanceTypeName: string;
  allowanceTypeNameAr?: string;
  totalAmount: number;
  employeeCount: number;
  percentageOfTotal: number;
  avgPerEmployee: number;
}

/**
 * Deduction type breakdown item
 */
export interface DeductionTypeBreakdown {
  deductionType: string;
  deductionTypeName: string;
  totalAmount: number;
  employeeCount: number;
  percentageOfTotal: number;
  avgPerEmployee: number;
}

/**
 * Response from GET /reports/payroll/salary-components
 */
export interface SalaryComponentsResponse {
  totalBaseSalaries: number;
  totalAllowances: number;
  totalDeductions: number;
  netPayroll: number;
  baseSalariesPercentage: number;
  allowancesPercentage: number;
  deductionsPercentage: number;
  allowanceTypes: AllowanceTypeBreakdown[];
  deductionTypes: DeductionTypeBreakdown[];
  currency: string;
  month: number;
  year: number;
  generatedAt: string;
}

// ============================================
// REPORT 5 — ALLOWANCES REPORT
// ============================================

/**
 * Summary for one allowance type
 */
export interface AllowanceSummaryItem {
  allowanceTypeId: string;
  allowanceTypeName: string;
  allowanceTypeNameAr?: string;
  totalMonthlyAmount: number;
  activeCount: number;
  inactiveCount: number;
  pendingCount: number;
  avgAmount: number;
  minAmount: number;
  maxAmount: number;
  percentageOfTotal: number;
}

/**
 * Allowances grouped by frequency
 */
export interface AllowancesByFrequency {
  frequency: string;
  totalAmount: number;
  count: number;
  percentageOfTotal: number;
}

/**
 * Response from GET /reports/payroll/allowances
 */
export interface AllowancesReportResponse {
  totalAmount: number;
  totalActive: number;
  totalInactive: number;
  totalPending: number;
  byAllowanceType: AllowanceSummaryItem[];
  byFrequency: AllowancesByFrequency[];
  currency: string;
  month: number;
  year: number;
  generatedAt: string;
}

// ============================================
// REPORT 6 — DEDUCTIONS & LOANS
// ============================================

/**
 * Loans summary statistics
 */
export interface LoansSummary {
  totalOutstanding: number;
  totalPaidThisMonth: number;
  activeLoanCount: number;
  pendingLoanCount: number;
  paidOffCount: number;
  overdueCount: number;
  avgLoanAmount: number;
  avgRemainingBalance: number;
}

/**
 * Loans grouped by status
 */
export interface LoansByStatus {
  status: string;
  statusName: string;
  count: number;
  totalAmount: number;
  totalRemaining: number;
  percentageOfTotal: number;
}

/**
 * Deduction type summary
 */
export interface DeductionSummaryItem {
  deductionType: string;
  deductionTypeName: string;
  totalAmount: number;
  employeeCount: number;
  percentageOfTotal: number;
  avgAmount: number;
}

/**
 * Response from GET /reports/payroll/deductions-loans
 */
export interface DeductionsLoansReportResponse {
  loansSummary: LoansSummary;
  loansByStatus: LoansByStatus[];
  totalDeductions: number;
  deductionsByType: DeductionSummaryItem[];
  currency: string;
  month: number;
  year: number;
  generatedAt: string;
}

// ============================================
// REPORT 7 — PAYROLL TREND
// ============================================

/**
 * Monthly data point for payroll trend chart
 */
export interface MonthlyPayrollDataPoint {
  /** Month key in YYYY-MM format */
  month: string;
  /** Human-readable month name */
  monthName: string;
  totalBaseSalaries: number;
  totalAllowances: number;
  totalDeductions: number;
  netPayroll: number;
  employeeCount: number;
  avgSalaryPerEmployee: number;
}

/**
 * Response from GET /reports/payroll/trend
 */
export interface PayrollTrendResponse {
  data: MonthlyPayrollDataPoint[];
  totalPayroll: number;
  avgMonthlyPayroll: number;
  highestPayroll: number;
  lowestPayroll: number;
  trend: "up" | "down" | "neutral";
  overallGrowthRate: number;
  currency: string;
  monthsCount: number;
  generatedAt: string;
}

// ============================================
// REPORT 8 — PAYROLL COMPARISON
// ============================================

/**
 * Payroll data for a single comparison period
 */
export interface PeriodPayrollData {
  month: number;
  year: number;
  periodLabel: string;
  totalBaseSalaries: number;
  totalAllowances: number;
  totalDeductions: number;
  netPayroll: number;
  employeeCount: number;
  avgSalaryPerEmployee: number;
}

/**
 * Variance analysis between two periods
 */
export interface PayrollVariance {
  baseSalariesDiff: number;
  baseSalariesChangePercent: number;
  allowancesDiff: number;
  allowancesChangePercent: number;
  deductionsDiff: number;
  deductionsChangePercent: number;
  netPayrollDiff: number;
  netPayrollChangePercent: number;
  employeeCountDiff: number;
  employeeCountChangePercent: number;
}

/**
 * Employee-level changes between periods
 */
export interface EmployeeChanges {
  newHires: number;
  resignations: number;
  netChange: number;
  salaryIncreasesCount: number;
  salaryDecreasesCount: number;
}

/**
 * Response from GET /reports/payroll/comparison
 */
export interface PayrollComparisonResponse {
  period1: PeriodPayrollData;
  period2: PeriodPayrollData;
  variance: PayrollVariance;
  employeeChanges?: EmployeeChanges;
  currency: string;
  generatedAt: string;
}
