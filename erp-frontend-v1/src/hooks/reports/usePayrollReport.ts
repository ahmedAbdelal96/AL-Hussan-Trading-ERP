/**
 * Payroll Reports Custom Hooks
 *
 * @description React Query hooks for fetching Payroll reports
 * @module hooks/reports/usePayrollReport
 *
 * @remarks
 * - Uses TanStack Query (React Query) for data fetching and caching
 * - Automatic caching (5 minutes default, stale after 5 min)
 * - Automatic refetch on window focus
 * - Built-in loading and error states
 * - Type-safe with TypeScript
 *
 * @author ERP System
 * @date 2026-01-24
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { payrollReportsApi } from "@/services/api/reports/payrollReportsApi";
import type {
  PayrollReportFilters,
  PayrollOverviewResponse,
  PayrollByDepartmentResponse,
  PayrollBySiteResponse,
  SalaryComponentsResponse,
  AllowancesReportResponse,
  DeductionsLoansReportResponse,
  PayrollTrendResponse,
  PayrollComparisonResponse,
} from "@/types/reports/payroll.types";

// ============================================
// QUERY KEYS (for cache management)
// ============================================

/**
 * Query key factory for Payroll reports
 *
 * @description Consistent query keys for TanStack Query cache invalidation
 */
export const payrollReportKeys = {
  all: ["payroll-reports"] as const,
  overview: (filters?: PayrollReportFilters) =>
    [...payrollReportKeys.all, "overview", filters] as const,
  byDepartment: (filters?: PayrollReportFilters) =>
    [...payrollReportKeys.all, "by-department", filters] as const,
  bySite: (filters?: PayrollReportFilters) =>
    [...payrollReportKeys.all, "by-site", filters] as const,
  salaryComponents: (filters?: PayrollReportFilters) =>
    [...payrollReportKeys.all, "salary-components", filters] as const,
  allowances: (filters?: PayrollReportFilters) =>
    [...payrollReportKeys.all, "allowances", filters] as const,
  deductionsLoans: (filters?: PayrollReportFilters) =>
    [...payrollReportKeys.all, "deductions-loans", filters] as const,
  trend: (filters?: PayrollReportFilters) =>
    [...payrollReportKeys.all, "trend", filters] as const,
  comparison: (filters?: PayrollReportFilters) =>
    [...payrollReportKeys.all, "comparison", filters] as const,
};

// ============================================
// HOOK: OVERVIEW REPORT
// ============================================

/**
 * Fetch Monthly Payroll Overview Report
 *
 * @description Returns core KPIs: net payroll, employee count, avg salary, MoM growth
 *
 * @param filters - Optional query params (month, year, departmentId, siteId)
 * @returns Query result with data, loading, error states
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = usePayrollOverview({ year: 2026, month: 1 });
 * if (isLoading) return <LoadingSpinner />;
 * return <div>Net Payroll: {data.netPayroll}</div>;
 * ```
 */
export function usePayrollOverview(
  filters?: PayrollReportFilters,
): UseQueryResult<PayrollOverviewResponse, Error> {
  return useQuery({
    queryKey: payrollReportKeys.overview(filters),
    queryFn: () => payrollReportsApi.getOverview(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: BY DEPARTMENT REPORT
// ============================================

/**
 * Fetch Payroll by Department Report
 *
 * @description Net payroll, headcount, and avg salary per department
 *
 * @param filters - Optional query params (month, year, departmentId)
 * @returns Query result with department payroll breakdown
 */
export function usePayrollByDepartment(
  filters?: PayrollReportFilters,
): UseQueryResult<PayrollByDepartmentResponse, Error> {
  return useQuery({
    queryKey: payrollReportKeys.byDepartment(filters),
    queryFn: () => payrollReportsApi.getByDepartment(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: BY SITE REPORT
// ============================================

/**
 * Fetch Payroll by Site Report
 *
 * @description Net payroll, headcount, and avg salary per site
 *
 * @param filters - Optional query params (month, year, siteId)
 * @returns Query result with site payroll breakdown
 */
export function usePayrollBySite(
  filters?: PayrollReportFilters,
): UseQueryResult<PayrollBySiteResponse, Error> {
  return useQuery({
    queryKey: payrollReportKeys.bySite(filters),
    queryFn: () => payrollReportsApi.getBySite(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: SALARY COMPONENTS
// ============================================

/**
 * Fetch Salary Components Breakdown Report
 *
 * @description Base salaries %, allowances %, deductions % + type-level detail
 *
 * @param filters - Optional query params (month, year, departmentId, siteId)
 * @returns Query result with salary component breakdown
 */
export function usePayrollSalaryComponents(
  filters?: PayrollReportFilters,
): UseQueryResult<SalaryComponentsResponse, Error> {
  return useQuery({
    queryKey: payrollReportKeys.salaryComponents(filters),
    queryFn: () => payrollReportsApi.getSalaryComponents(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: ALLOWANCES REPORT
// ============================================

/**
 * Fetch Allowances Report
 *
 * @description Allowance types with amounts, frequency breakdown, status counts
 *
 * @param filters - Optional query params (month, year, departmentId, siteId)
 * @returns Query result with full allowances analysis
 */
export function usePayrollAllowances(
  filters?: PayrollReportFilters,
): UseQueryResult<AllowancesReportResponse, Error> {
  return useQuery({
    queryKey: payrollReportKeys.allowances(filters),
    queryFn: () => payrollReportsApi.getAllowances(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: DEDUCTIONS & LOANS REPORT
// ============================================

/**
 * Fetch Deductions & Loans Report
 *
 * @description Loan portfolio stats (active, overdue, paid-off) + deduction type breakdown
 *
 * @param filters - Optional query params (month, year, departmentId, siteId)
 * @returns Query result with loans summary and deductions by type
 */
export function usePayrollDeductionsLoans(
  filters?: PayrollReportFilters,
): UseQueryResult<DeductionsLoansReportResponse, Error> {
  return useQuery({
    queryKey: payrollReportKeys.deductionsLoans(filters),
    queryFn: () => payrollReportsApi.getDeductionsLoans(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: PAYROLL TREND
// ============================================

/**
 * Fetch Payroll Trend Report
 *
 * @description 12-month payroll trend with growth analysis
 *
 * @param filters - Optional query params (periodMonths)
 * @returns Query result with monthly data points and trend direction
 */
export function usePayrollTrend(
  filters?: PayrollReportFilters,
): UseQueryResult<PayrollTrendResponse, Error> {
  return useQuery({
    queryKey: payrollReportKeys.trend(filters),
    queryFn: () => payrollReportsApi.getTrend(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: PAYROLL COMPARISON
// ============================================

/**
 * Fetch Payroll Comparison Report
 *
 * @description Side-by-side comparison of two payroll periods with variance analysis
 *
 * @param filters - Query params: period1Month, period1Year, period2Month, period2Year
 * @returns Query result with period data, variance, and employee changes
 */
export function usePayrollComparison(
  filters?: PayrollReportFilters,
): UseQueryResult<PayrollComparisonResponse, Error> {
  return useQuery({
    queryKey: payrollReportKeys.comparison(filters),
    queryFn: () => payrollReportsApi.getComparison(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
