/**
 * ============================================================================
 * MAINTENANCE REPORTS - API Service
 * ============================================================================
 *
 * HTTP calls to /reports/maintenance/* endpoints.
 *
 * Endpoints:
 * - GET /reports/maintenance/overview
 * - GET /reports/maintenance/by-type
 * - GET /reports/maintenance/by-status
 * - GET /reports/maintenance/by-asset
 * - GET /reports/maintenance/cost-analysis
 * - GET /reports/maintenance/performance
 * - GET /reports/maintenance/preventive
 *
 * Permission required: reports:maintenance:view
 *
 * @module MaintenanceReportsApi
 */

import apiRequest from "@/services/api/axiosConfig";
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

const BASE_URL = "/reports/maintenance";

export const maintenanceReportsApi = {
  /** Report 1 — KPI dashboard: counts, costs, distributions, overdue alerts */
  getOverview: (
    filters: MaintenanceOverviewFilters = {},
  ): Promise<MaintenanceOverviewResponse> =>
    apiRequest.get(`${BASE_URL}/overview`, {
      params: filters,
    }) as unknown as Promise<MaintenanceOverviewResponse>,

  /** Report 2 — count, cost and duration breakdown per maintenance type */
  getByType: (
    filters: MaintenanceByTypeFilters = {},
  ): Promise<MaintenanceByTypeResponse> =>
    apiRequest.get(`${BASE_URL}/by-type`, {
      params: filters,
    }) as unknown as Promise<MaintenanceByTypeResponse>,

  /** Report 3 — status distribution + transitions + delayed alerts */
  getByStatus: (
    filters: MaintenanceByStatusFilters = {},
  ): Promise<MaintenanceByStatusResponse> =>
    apiRequest.get(`${BASE_URL}/by-status`, {
      params: filters,
    }) as unknown as Promise<MaintenanceByStatusResponse>,

  /** Report 4 — per-asset maintenance frequency, cost and history */
  getByAsset: (
    filters: MaintenanceByAssetFilters = {},
  ): Promise<MaintenanceByAssetResponse> =>
    apiRequest.get(`${BASE_URL}/by-asset`, {
      params: filters,
    }) as unknown as Promise<MaintenanceByAssetResponse>,

  /** Report 5 — cost breakdown by type, asset type, vendor + monthly trends */
  getCostAnalysis: (
    filters: MaintenanceCostAnalysisFilters = {},
  ): Promise<MaintenanceCostAnalysisResponse> =>
    apiRequest.get(`${BASE_URL}/cost-analysis`, {
      params: filters,
    }) as unknown as Promise<MaintenanceCostAnalysisResponse>,

  /** Report 6 — MTTR, MTBF, on-time rates, employee & vendor metrics */
  getPerformance: (
    filters: MaintenancePerformanceFilters = {},
  ): Promise<MaintenancePerformanceResponse> =>
    apiRequest.get(`${BASE_URL}/performance`, {
      params: filters,
    }) as unknown as Promise<MaintenancePerformanceResponse>,

  /** Report 7 — compliance rate, upcoming / overdue / unscheduled + savings */
  getPreventive: (
    filters: PreventiveMaintenanceFilters = {},
  ): Promise<PreventiveMaintenanceResponse> =>
    apiRequest.get(`${BASE_URL}/preventive`, {
      params: filters,
    }) as unknown as Promise<PreventiveMaintenanceResponse>,

  /** Report 8 — MTBF/MTTR per individual asset with reliability scores */
  getMtbfMttr: (
    filters: MaintenanceMtbfMttrFilters = {},
  ): Promise<MaintenanceMtbfMttrResponse> =>
    apiRequest.get(`${BASE_URL}/mtbf-mttr`, {
      params: filters,
    }) as unknown as Promise<MaintenanceMtbfMttrResponse>,

  /** Report 9 — per-asset cost breakdown with variance and cost-to-value ratio */
  getCostPerAsset: (
    filters: MaintenanceCostPerAssetFilters = {},
  ): Promise<MaintenanceCostPerAssetResponse> =>
    apiRequest.get(`${BASE_URL}/cost-per-asset`, {
      params: filters,
    }) as unknown as Promise<MaintenanceCostPerAssetResponse>,

  /** Report 10 — budget vs actual grouped by month / asset type / maintenance type */
  getBudgetVsActual: (
    filters: MaintenanceBudgetActualFilters = {},
  ): Promise<MaintenanceBudgetActualResponse> =>
    apiRequest.get(`${BASE_URL}/budget-vs-actual`, {
      params: filters,
    }) as unknown as Promise<MaintenanceBudgetActualResponse>,
};
