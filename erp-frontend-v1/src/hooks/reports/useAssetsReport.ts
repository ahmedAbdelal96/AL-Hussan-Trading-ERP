/**
 * ============================================================================
 * ASSETS REPORTS - React Query Hooks
 * ============================================================================
 *
 * TanStack Query wrappers for all assets report endpoints.
 *
 * @module useAssetsReport
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { assetsReportsApi } from "@/services/api/reports/assetsReportsApi";
import type {
  AssetsOverviewFilters,
  AssetsOverviewResponse,
  AssetsByTypeFilters,
  AssetsByTypeResponse,
  AssetsByStatusFilters,
  AssetsByStatusResponse,
  AssetsByLocationFilters,
  AssetsByLocationResponse,
  DepreciationAnalysisFilters,
  DepreciationAnalysisResponse,
  UtilizationReportFilters,
  UtilizationReportResponse,
} from "@/types/reports/assets.types";

export const assetsReportKeys = {
  all: ["assets-reports"] as const,
  overview: (f: AssetsOverviewFilters) =>
    [...assetsReportKeys.all, "overview", f] as const,
  byType: (f: AssetsByTypeFilters) =>
    [...assetsReportKeys.all, "by-type", f] as const,
  byStatus: (f: AssetsByStatusFilters) =>
    [...assetsReportKeys.all, "by-status", f] as const,
  byLocation: (f: AssetsByLocationFilters) =>
    [...assetsReportKeys.all, "by-location", f] as const,
  depreciation: (f: DepreciationAnalysisFilters) =>
    [...assetsReportKeys.all, "depreciation", f] as const,
  utilization: (f: UtilizationReportFilters) =>
    [...assetsReportKeys.all, "utilization", f] as const,
};

const QUERY_CONFIG = { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 };


/** Report 1 — high-level KPIs + optional warranty breakdown */
export function useAssetsOverview(
  filters: AssetsOverviewFilters = {},
): UseQueryResult<AssetsOverviewResponse, Error> {
  return useQuery({
    queryKey: assetsReportKeys.overview(filters),
    queryFn: () => assetsReportsApi.getOverview(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 2 — count / value / status per asset type */
export function useAssetsByType(
  filters: AssetsByTypeFilters = {},
): UseQueryResult<AssetsByTypeResponse, Error> {
  return useQuery({
    queryKey: assetsReportKeys.byType(filters),
    queryFn: () => assetsReportsApi.getByType(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 3 — status breakdown + transitions + alerts */
export function useAssetsByStatus(
  filters: AssetsByStatusFilters = {},
): UseQueryResult<AssetsByStatusResponse, Error> {
  return useQuery({
    queryKey: assetsReportKeys.byStatus(filters),
    queryFn: () => assetsReportsApi.getByStatus(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 4 — geographic distribution per location */
export function useAssetsByLocation(
  filters: AssetsByLocationFilters = {},
): UseQueryResult<AssetsByLocationResponse, Error> {
  return useQuery({
    queryKey: assetsReportKeys.byLocation(filters),
    queryFn: () => assetsReportsApi.getByLocation(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 5 — depreciation analysis by type and age group */
export function useDepreciationAnalysis(
  filters: DepreciationAnalysisFilters = {},
): UseQueryResult<DepreciationAnalysisResponse, Error> {
  return useQuery({
    queryKey: assetsReportKeys.depreciation(filters),
    queryFn: () => assetsReportsApi.getDepreciation(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 6 — utilization rates, idle assets, top/bottom performers */
export function useUtilizationReport(
  filters: UtilizationReportFilters = {},
): UseQueryResult<UtilizationReportResponse, Error> {
  return useQuery({
    queryKey: assetsReportKeys.utilization(filters),
    queryFn: () => assetsReportsApi.getUtilization(filters),
    ...QUERY_CONFIG,
  });
}
