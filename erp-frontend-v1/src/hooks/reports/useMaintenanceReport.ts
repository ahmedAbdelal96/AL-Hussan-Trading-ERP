/**
 * ============================================================================
 * MAINTENANCE REPORTS - React Query Hooks
 * ============================================================================
 *
 * TanStack Query wrappers for all maintenance report endpoints.
 *
 * @module useMaintenanceReport
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { maintenanceReportsApi } from "@/services/api/reports/maintenanceReportsApi";
import type {
  MaintenanceOverviewFilters,
  MaintenanceOverviewResponse,
  MaintenanceByTypeFilters,
  MaintenanceByTypeResponse,
  MaintenanceByStatusFilters,
  MaintenanceByStatusResponse,
  MaintenanceByAssetFilters,
  MaintenanceByAssetResponse,
  MaintenanceCostAnalysisFilters,
  MaintenanceCostAnalysisResponse,
  MaintenancePerformanceFilters,
  MaintenancePerformanceResponse,
  PreventiveMaintenanceFilters,
  PreventiveMaintenanceResponse,
  MaintenanceMtbfMttrFilters,
  MaintenanceMtbfMttrResponse,
  MaintenanceCostPerAssetFilters,
  MaintenanceCostPerAssetResponse,
  MaintenanceBudgetActualFilters,
  MaintenanceBudgetActualResponse,
} from "@/types/reports/maintenance.types";

export const maintenanceReportKeys = {
  all: ["maintenance-reports"] as const,
  overview: (f: MaintenanceOverviewFilters) =>
    [...maintenanceReportKeys.all, "overview", f] as const,
  byType: (f: MaintenanceByTypeFilters) =>
    [...maintenanceReportKeys.all, "by-type", f] as const,
  byStatus: (f: MaintenanceByStatusFilters) =>
    [...maintenanceReportKeys.all, "by-status", f] as const,
  byAsset: (f: MaintenanceByAssetFilters) =>
    [...maintenanceReportKeys.all, "by-asset", f] as const,
  costAnalysis: (f: MaintenanceCostAnalysisFilters) =>
    [...maintenanceReportKeys.all, "cost-analysis", f] as const,
  performance: (f: MaintenancePerformanceFilters) =>
    [...maintenanceReportKeys.all, "performance", f] as const,
  preventive: (f: PreventiveMaintenanceFilters) =>
    [...maintenanceReportKeys.all, "preventive", f] as const,
  mtbfMttr: (f: MaintenanceMtbfMttrFilters) =>
    [...maintenanceReportKeys.all, "mtbf-mttr", f] as const,
  costPerAsset: (f: MaintenanceCostPerAssetFilters) =>
    [...maintenanceReportKeys.all, "cost-per-asset", f] as const,
  budgetVsActual: (f: MaintenanceBudgetActualFilters) =>
    [...maintenanceReportKeys.all, "budget-vs-actual", f] as const,
};

const QUERY_CONFIG = { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 };


/** Report 1 — KPI dashboard: counts, costs, distributions, overdue alerts */
export function useMaintenanceOverview(
  filters: MaintenanceOverviewFilters = {},
): UseQueryResult<MaintenanceOverviewResponse, Error> {
  return useQuery({
    queryKey: maintenanceReportKeys.overview(filters),
    queryFn: () => maintenanceReportsApi.getOverview(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 2 — count, cost and duration breakdown per maintenance type */
export function useMaintenanceByType(
  filters: MaintenanceByTypeFilters = {},
): UseQueryResult<MaintenanceByTypeResponse, Error> {
  return useQuery({
    queryKey: maintenanceReportKeys.byType(filters),
    queryFn: () => maintenanceReportsApi.getByType(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 3 — status distribution + transitions + delayed alerts */
export function useMaintenanceByStatus(
  filters: MaintenanceByStatusFilters = {},
): UseQueryResult<MaintenanceByStatusResponse, Error> {
  return useQuery({
    queryKey: maintenanceReportKeys.byStatus(filters),
    queryFn: () => maintenanceReportsApi.getByStatus(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 4 — per-asset maintenance frequency, cost and history */
export function useMaintenanceByAsset(
  filters: MaintenanceByAssetFilters = {},
): UseQueryResult<MaintenanceByAssetResponse, Error> {
  return useQuery({
    queryKey: maintenanceReportKeys.byAsset(filters),
    queryFn: () => maintenanceReportsApi.getByAsset(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 5 — cost breakdown by type, asset type, vendor + monthly trends */
export function useMaintenanceCostAnalysis(
  filters: MaintenanceCostAnalysisFilters = {},
): UseQueryResult<MaintenanceCostAnalysisResponse, Error> {
  return useQuery({
    queryKey: maintenanceReportKeys.costAnalysis(filters),
    queryFn: () => maintenanceReportsApi.getCostAnalysis(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 6 — MTTR, MTBF, on-time rates, employee & vendor metrics */
export function useMaintenancePerformance(
  filters: MaintenancePerformanceFilters = {},
): UseQueryResult<MaintenancePerformanceResponse, Error> {
  return useQuery({
    queryKey: maintenanceReportKeys.performance(filters),
    queryFn: () => maintenanceReportsApi.getPerformance(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 7 — compliance rate, upcoming / overdue / unscheduled + savings */
export function usePreventiveMaintenance(
  filters: PreventiveMaintenanceFilters = {},
): UseQueryResult<PreventiveMaintenanceResponse, Error> {
  return useQuery({
    queryKey: maintenanceReportKeys.preventive(filters),
    queryFn: () => maintenanceReportsApi.getPreventive(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 8 — MTBF/MTTR per individual asset with reliability scores */
export function useMaintenanceMtbfMttr(
  filters: MaintenanceMtbfMttrFilters = {},
): UseQueryResult<MaintenanceMtbfMttrResponse, Error> {
  return useQuery({
    queryKey: maintenanceReportKeys.mtbfMttr(filters),
    queryFn: () => maintenanceReportsApi.getMtbfMttr(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 9 — per-asset cost breakdown with variance and cost-to-value ratio */
export function useMaintenanceCostPerAsset(
  filters: MaintenanceCostPerAssetFilters = {},
): UseQueryResult<MaintenanceCostPerAssetResponse, Error> {
  return useQuery({
    queryKey: maintenanceReportKeys.costPerAsset(filters),
    queryFn: () => maintenanceReportsApi.getCostPerAsset(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 10 — budget vs actual grouped by month / asset type / maintenance type */
export function useMaintenanceBudgetVsActual(
  filters: MaintenanceBudgetActualFilters = {},
): UseQueryResult<MaintenanceBudgetActualResponse, Error> {
  return useQuery({
    queryKey: maintenanceReportKeys.budgetVsActual(filters),
    queryFn: () => maintenanceReportsApi.getBudgetVsActual(filters),
    ...QUERY_CONFIG,
  });
}
