/**
 * ============================================================================
 * PAYROLL REACT QUERY HOOKS
 * ============================================================================
 *
 * Custom React Query hooks for payroll data management
 * Provides type-safe, optimized data fetching with automatic caching
 *
 * Architecture:
 * - Uses @tanstack/react-query for state management
 * - Implements query key factories for cache invalidation
 * - Configures stale time and garbage collection
 * - Handles loading, error, and success states automatically
 *
 * Performance:
 * - 5-minute stale time for statistics (computed data)
 * - 10-minute garbage collection time
 * - Background refetch on window focus
 * - Automatic retry on failure (3 attempts)
 *
 * @version 1.0.0
 * @author ERP System - Senior Frontend Developer
 */

import { useQuery } from "@tanstack/react-query";
import { payrollApi } from "../services/api/payroll.api";
import type { PayrollStatisticsParams } from "../types/payroll-statistics";

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

/**
 * Query key factory for payroll statistics
 * Ensures consistent cache keys across the application
 *
 * Benefits:
 * - Centralized key management
 * - Type-safe key generation
 * - Easy cache invalidation
 * - Prevents key collisions
 *
 * Usage:
 * ```typescript
 * queryClient.invalidateQueries({
 *   queryKey: PAYROLL_STATISTICS_KEYS.all
 * });
 * ```
 */
export const PAYROLL_STATISTICS_KEYS = {
  /**
   * Base key for all payroll statistics queries
   * Used for invalidating all statistics-related queries
   */
  all: ["payroll", "statistics"] as const,

  /**
   * Generate key for overview statistics query
   * Includes date range parameters if provided
   *
   * @param params - Optional date range filters
   * @returns Cache key array
   */
  overview: (params?: PayrollStatisticsParams) =>
    params
      ? ([...PAYROLL_STATISTICS_KEYS.all, "overview", params] as const)
      : ([...PAYROLL_STATISTICS_KEYS.all, "overview"] as const),
};

// ============================================================================
// STATISTICS HOOKS
// ============================================================================

/**
 * Fetch comprehensive payroll statistics for dashboard
 * Returns aggregated data including salary distribution, trends, and metrics
 *
 * Features:
 * - Automatic background refetch on window focus
 * - Smart caching with 5-minute stale time
 * - Loading and error states handled automatically
 * - Type-safe response data
 *
 * Data Included:
 * - Overview: Total salary, allowances, deductions, net payroll
 * - Employees: Count, average salary, recent hires
 * - Breakdowns: By employment type, department, allowances, deductions
 * - Loans: Active count, total amount, remaining balance, status breakdown
 * - Trends: Monthly payroll evolution (last 6 months)
 * - Top Employees: Highest earning employees with details
 * - Growth Rate: Month-over-month salary growth percentage
 *
 * @param params - Optional filters
 * @param params.startDate - Start date (ISO format: YYYY-MM-DD)
 * @param params.endDate - End date (ISO format: YYYY-MM-DD)
 * @returns React Query result object
 *
 * @example
 * ```typescript
 * // Basic usage - current statistics
 * const { data, isLoading, error } = usePayrollStatistics();
 *
 * // With date range filtering
 * const { data } = usePayrollStatistics({
 *   startDate: '2026-01-01',
 *   endDate: '2026-01-31'
 * });
 *
 * // Access data
 * if (data) {
 *   console.log(`Total Employees: ${data.totalEmployees}`);
 *   console.log(`Net Payroll: ${data.netPayroll} ${data.currency}`);
 *   console.log(`Growth Rate: ${data.growthRate}%`);
 * }
 *
 * // Handling states
 * if (isLoading) return <Loader />;
 * if (error) return <ErrorMessage error={error} />;
 * if (!data) return <EmptyState />;
 * ```
 *
 * React Query Features:
 * - `data`: Payroll statistics object (undefined while loading)
 * - `isLoading`: True during initial fetch
 * - `isFetching`: True during any fetch (including background refetch)
 * - `error`: Error object if request fails
 * - `refetch()`: Manually trigger refetch
 * - `isSuccess`: True when data is available
 * - `isError`: True when request failed
 *
 * Cache Behavior:
 * - Fresh data for 5 minutes (staleTime)
 * - Cached for 10 minutes after last use (gcTime)
 * - Auto-refetch on window focus if stale
 * - Auto-refetch on network reconnect
 *
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery}
 */
export const usePayrollStatistics = (params?: PayrollStatisticsParams) => {
  return useQuery({
    // Unique cache key including params
    queryKey: PAYROLL_STATISTICS_KEYS.overview(params),

    // Async function to fetch data
    queryFn: () => payrollApi.statistics.getPayrollStatistics(params),

    // Data freshness configuration
    staleTime: 5 * 60 * 1000, // 5 minutes - statistics are computed server-side
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache after unmount

    // Refetch configuration
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet reconnects
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

    // Optional: Enable/disable query
    // enabled: true, // Always enabled by default
  });
};

// ============================================================================
// FUTURE HOOKS (Commented out for reference)
// ============================================================================

/**
 * Future: Fetch salary structure for specific employee
 *
 * @example
 * ```typescript
 * export const useEmployeeSalaryStructure = (employeeId: string) => {
 *   return useQuery({
 *     queryKey: ['payroll', 'salary-structure', employeeId],
 *     queryFn: () => payrollApi.salaryStructures.getByEmployeeId(employeeId),
 *     enabled: !!employeeId,
 *     staleTime: 10 * 60 * 1000,
 *   });
 * };
 * ```
 */

/**
 * Future: Fetch employee payroll summary
 *
 * @example
 * ```typescript
 * export const useEmployeePayrollSummary = (employeeId: string) => {
 *   return useQuery({
 *     queryKey: ['payroll', 'summary', employeeId],
 *     queryFn: () => payrollApi.summary.getEmployeeSummary(employeeId),
 *     enabled: !!employeeId,
 *     staleTime: 5 * 60 * 1000,
 *   });
 * };
 * ```
 */

/**
 * Future: Fetch active loans for employee
 *
 * @example
 * ```typescript
 * export const useEmployeeActiveLoans = (employeeId: string) => {
 *   return useQuery({
 *     queryKey: ['payroll', 'loans', 'active', employeeId],
 *     queryFn: () => payrollApi.loans.getActiveByEmployeeId(employeeId),
 *     enabled: !!employeeId,
 *     staleTime: 3 * 60 * 1000,
 *   });
 * };
 * ```
 */

/**
 * Future: Fetch all allowance types
 *
 * @example
 * ```typescript
 * export const useAllowanceTypes = () => {
 *   return useQuery({
 *     queryKey: ['payroll', 'allowance-types'],
 *     queryFn: () => payrollApi.allowanceTypes.getAll(),
 *     staleTime: 30 * 60 * 1000, // 30 minutes - reference data
 *   });
 * };
 * ```
 */

// ============================================================================
// MUTATION HOOKS (Future Implementation)
// ============================================================================

/**
 * Future: Create salary structure mutation
 *
 * @example
 * ```typescript
 * import { useMutation, useQueryClient } from '@tanstack/react-query';
 *
 * export const useCreateSalaryStructure = () => {
 *   const queryClient = useQueryClient();
 *
 *   return useMutation({
 *     mutationFn: payrollApi.salaryStructures.create,
 *     onSuccess: () => {
 *       // Invalidate statistics to refresh dashboard
 *       queryClient.invalidateQueries({
 *         queryKey: PAYROLL_STATISTICS_KEYS.all
 *       });
 *     },
 *   });
 * };
 * ```
 */

/**
 * Future: Approve loan mutation
 *
 * @example
 * ```typescript
 * export const useApproveLoan = () => {
 *   const queryClient = useQueryClient();
 *
 *   return useMutation({
 *     mutationFn: ({ loanId, ...data }) =>
 *       payrollApi.loans.approve(loanId, data),
 *     onSuccess: () => {
 *       queryClient.invalidateQueries({
 *         queryKey: PAYROLL_STATISTICS_KEYS.all
 *       });
 *     },
 *   });
 * };
 * ```
 */

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Future: Prefetch payroll statistics
 * Useful for optimistic navigation - load data before user navigates
 *
 * @example
 * ```typescript
 * import { useQueryClient } from '@tanstack/react-query';
 *
 * export const usePrefetchPayrollStatistics = () => {
 *   const queryClient = useQueryClient();
 *
 *     queryClient.prefetchQuery({
 *       queryKey: PAYROLL_STATISTICS_KEYS.overview(params),
 *       queryFn: () => payrollApi.statistics.getPayrollStatistics(params),
 *       staleTime: 5 * 60 * 1000,
 *     });
 *   };
 * };
 * ```
 */
