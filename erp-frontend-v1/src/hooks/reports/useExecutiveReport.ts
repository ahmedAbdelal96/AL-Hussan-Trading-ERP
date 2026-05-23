/**
 * Executive Reports — React Query Hooks
 *
 * @description Thin wrappers around TanStack Query for the 2 executive
 *              report endpoints.  Each hook exposes data, isLoading, error,
 *              and refetch from useQuery.
 *
 * Cache strategy:
 *   staleTime  5 min  — data is fresh; no background refetch within this window
 *   gcTime    10 min  — unused data stays in cache for offline resilience
 */

import { useQuery } from "@tanstack/react-query";
import { executiveReportsApi } from "@/services/api/reports/executiveReportsApi";
import type {
  ExecutiveDashboardFilters,
  ExecutiveDashboardResponse,
  CompanyPnlFilters,
  CompanyPnlResponse,
} from "@/types/reports/executive.types";
import type { UseQueryResult } from "@tanstack/react-query";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const GC_TIME = 10 * 60 * 1000; // 10 minutes

export const executiveReportKeys = {
  all: ["executive-reports"] as const,
  dashboard: (f?: ExecutiveDashboardFilters) =>
    [...executiveReportKeys.all, "dashboard", f] as const,
  pnl: (f?: CompanyPnlFilters) =>
    [...executiveReportKeys.all, "pnl", f] as const,
};


/** Executive Dashboard — cross-module KPI snapshot */
export function useExecutiveDashboard(
  filters?: ExecutiveDashboardFilters,
): UseQueryResult<ExecutiveDashboardResponse, Error> {
  return useQuery({
    queryKey: executiveReportKeys.dashboard(filters),
    queryFn: () => executiveReportsApi.getDashboard(filters),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/** Company P&L — revenue vs costs with cost bucketing and optional breakdowns */
export function useCompanyPnl(
  filters?: CompanyPnlFilters,
): UseQueryResult<CompanyPnlResponse, Error> {
  return useQuery({
    queryKey: executiveReportKeys.pnl(filters),
    queryFn: () => executiveReportsApi.getPnl(filters),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}
