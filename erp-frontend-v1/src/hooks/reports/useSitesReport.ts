/**
 * Sites Reports — React Query Hooks
 *
 * @description Thin wrappers around TanStack Query for each of the 6 sites report endpoints.
 *              Each hook exposes data, isLoading, error, and refetch from useQuery.
 *
 * Cache strategy:
 *   staleTime  5 min  — data is fresh; no background refetch within this window
 *   gcTime    10 min  — unused data stays in cache for offline resilience
 *
 * Query-key factory `sitesReportKeys` makes granular invalidation straightforward:
 *   queryClient.invalidateQueries({ queryKey: sitesReportKeys.all })
 *
 * @author ERP System
 * @date 2026-02-20
 */

import { useQuery } from "@tanstack/react-query";
import { sitesReportsApi } from "@/services/api/reports/sitesReportsApi";
import type {
  SitesReportFilters,
  SiteProfitabilityFilters,
  SiteProfitabilityResponse,
} from "@/types/reports/sites.types";
import type { UseQueryResult } from "@tanstack/react-query";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const GC_TIME = 10 * 60 * 1000; // 10 minutes

export const sitesReportKeys = {
  all: ["sites-reports"] as const,
  overview: (f?: SitesReportFilters) =>
    [...sitesReportKeys.all, "overview", f] as const,
  byStatus: (f?: SitesReportFilters) =>
    [...sitesReportKeys.all, "by-status", f] as const,
  byLocation: (f?: SitesReportFilters) =>
    [...sitesReportKeys.all, "by-location", f] as const,
  capacity: (f?: SitesReportFilters) =>
    [...sitesReportKeys.all, "capacity", f] as const,
  withProjects: (f?: SitesReportFilters) =>
    [...sitesReportKeys.all, "with-projects", f] as const,
  performance: (f?: SitesReportFilters) =>
    [...sitesReportKeys.all, "performance", f] as const,
  profitability: (f?: SiteProfitabilityFilters) =>
    [...sitesReportKeys.all, "profitability", f] as const,
};


/** Sites executive dashboard — KPIs, capacity metrics, status distribution */
export function useSitesOverview(filters?: SitesReportFilters) {
  return useQuery({
    queryKey: sitesReportKeys.overview(filters),
    queryFn: () => sitesReportsApi.getOverview(filters),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/** Sites by operational status — breakdown table + recent transitions */
export function useSitesByStatus(filters?: SitesReportFilters) {
  return useQuery({
    queryKey: sitesReportKeys.byStatus(filters),
    queryFn: () => sitesReportsApi.getByStatus(filters),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/** Geographic distribution — grouped by city / state / country */
export function useSitesByLocation(
  filters?: SitesReportFilters & {
    groupByLevel?: "country" | "state" | "city";
  },
) {
  return useQuery({
    queryKey: sitesReportKeys.byLocation(filters),
    queryFn: () => sitesReportsApi.getByLocation(filters),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/** Capacity utilization — aggregate totals + per-site detail rows */
export function useSitesCapacity(
  filters?: SitesReportFilters & {
    minUtilization?: number;
    maxUtilization?: number;
    sortBy?: "capacity" | "area" | "utilization";
    sortOrder?: "asc" | "desc";
  },
) {
  return useQuery({
    queryKey: sitesReportKeys.capacity(filters),
    queryFn: () => sitesReportsApi.getCapacity(filters),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/** Sites with project portfolio — project counts, budgets, active projects */
export function useSitesWithProjects(
  filters?: SitesReportFilters & { includeProjectDetails?: boolean },
) {
  return useQuery({
    queryKey: sitesReportKeys.withProjects(filters),
    queryFn: () => sitesReportsApi.getWithProjects(filters),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/** Site performance — scores, ROI metrics, closure candidates */
export function useSitesPerformance(
  filters?: SitesReportFilters & {
    minProjects?: number;
    sortBy?: "performance" | "roi" | "projectValue";
    sortOrder?: "asc" | "desc";
  },
) {
  return useQuery({
    queryKey: sitesReportKeys.performance(filters),
    queryFn: () => sitesReportsApi.getPerformance(filters),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/** Site profitability — revenue vs costs per site with profit margin + rating */
export function useSiteProfitability(
  filters?: SiteProfitabilityFilters,
): UseQueryResult<SiteProfitabilityResponse, Error> {
  return useQuery({
    queryKey: sitesReportKeys.profitability(filters),
    queryFn: () => sitesReportsApi.getProfitability(filters),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}
