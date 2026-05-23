/**
 * ============================================================================
 * USE FINANCE REPORT - Custom Hook
 * ============================================================================
 *
 * React Query hook for fetching Finance reports data.
 * Provides type-safe, cached data fetching with loading and error states.
 *
 * Features:
 * - Automatic caching (5 minutes stale time)
 * - Type-safe endpoints
 * - Loading and error states
 * - Auto refetch on window focus (disabled)
 * - Retry on failure (3 times with backoff)
 *
 * @hook useFinanceReport
 * @version 1.0.0
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import financeReportsApi, {
  FinanceReportFilters,
  PaginationParams,
} from "@/services/api/reports/financeReportsApi";
import type {
  FinanceOverviewResponse,
  CostsByTypeResponse,
  CostsByPaymentStatusResponse,
  MonthlyTrendResponse,
  CostsByCategoryResponse,
  CostsByProjectResponse,
  PendingApprovalsResponse,
  OverduePaymentsResponse,
  TaxSummaryResponse,
} from "@/types/reports/finance.types";

/**
 * Report endpoint types
 * Maps endpoint names to their response types
 */
type ReportEndpoint =
  | "overview"
  | "by-cost-type"
  | "by-payment-status"
  | "monthly-trend"
  | "by-category"
  | "by-project"
  | "pending-approvals"
  | "overdue-payments"
  | "tax-summary";

/**
 * Response type mapping
 * Provides type safety for different endpoints
 */
type ReportResponseType<T extends ReportEndpoint> = T extends "overview"
  ? FinanceOverviewResponse
  : T extends "by-cost-type"
    ? CostsByTypeResponse
    : T extends "by-payment-status"
      ? CostsByPaymentStatusResponse
      : T extends "monthly-trend"
        ? MonthlyTrendResponse
        : T extends "by-category"
          ? CostsByCategoryResponse
          : T extends "by-project"
            ? CostsByProjectResponse
            : T extends "pending-approvals"
              ? PendingApprovalsResponse
              : T extends "overdue-payments"
                ? OverduePaymentsResponse
                : T extends "tax-summary"
                  ? TaxSummaryResponse
                : never;

/**
 * Custom hook parameters
 */
interface UseFinanceReportParams {
  endpoint: ReportEndpoint;
  filters?: FinanceReportFilters;
  pagination?: PaginationParams & { search?: string };
  enabled?: boolean;
}

/**
 * Use Finance Report Hook
 *
 * Design decisions:
 * - 5 minute cache (balance freshness vs. API load)
 * - No refetch on window focus (prevents unnecessary calls)
 * - 3 retry attempts with exponential backoff
 * - Query keys include filters for proper invalidation
 *
 * @template T - Report endpoint type
 * @param params - Hook parameters
 * @param options - Additional React Query options
 * @returns Query result with data, loading, error states
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useFinanceReport({
 *   endpoint: 'overview',
 *   filters: { year: 2026, month: 1 }
 * });
 * ```
 */
export function useFinanceReport<T extends ReportEndpoint>({
  endpoint,
  filters,
  pagination,
  enabled = true,
}: UseFinanceReportParams) {
  return useQuery<ReportResponseType<T>>({
    // Query key includes endpoint, filters, and pagination for proper caching
    queryKey: ["finance-report", endpoint, filters, pagination],

    // Query function - calls appropriate API method
    queryFn: async () => {
      switch (endpoint) {
        case "overview":
          return financeReportsApi.getOverview(filters);
        case "by-cost-type":
          return financeReportsApi.getCostsByType(filters);
        case "by-payment-status":
          return financeReportsApi.getCostsByPaymentStatus(filters);
        case "monthly-trend":
          return financeReportsApi.getMonthlyTrend(filters);
        case "by-category":
          return financeReportsApi.getCostsByCategory(filters);
        case "by-project":
          return financeReportsApi.getCostsByProject(filters, pagination);
        case "pending-approvals":
          return financeReportsApi.getPendingApprovals(filters, pagination);
        case "overdue-payments":
          return financeReportsApi.getOverduePayments(filters, pagination);
        case "tax-summary":
          return financeReportsApi.getTaxSummary(filters);
        default:
          throw new Error(`Unknown endpoint: ${endpoint}`);
      }
    },

    // Cache configuration
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

    // Refetch configuration
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,

    // Retry configuration
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Enable/disable query
    enabled,
  });
}

export default useFinanceReport;
