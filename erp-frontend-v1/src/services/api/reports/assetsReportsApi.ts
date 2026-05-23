/**
 * ============================================================================
 * ASSETS REPORTS - API Service
 * ============================================================================
 *
 * HTTP calls to /reports/assets/* endpoints.
 *
 * Endpoints:
 * - GET /reports/assets/overview
 * - GET /reports/assets/by-type
 * - GET /reports/assets/by-status
 * - GET /reports/assets/by-location
 * - GET /reports/assets/depreciation
 * - GET /reports/assets/utilization
 *
 * Permission required: reports:assets:view
 *
 * @module AssetsReportsApi
 */

import apiRequest from "@/services/api/axiosConfig";
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

const BASE_URL = "/reports/assets";

export const assetsReportsApi = {
  /** Report 1 — high-level KPIs + warranty breakdown */
  getOverview: (
    filters: AssetsOverviewFilters = {},
  ): Promise<AssetsOverviewResponse> =>
    apiRequest.get(`${BASE_URL}/overview`, {
      params: filters,
    }) as unknown as Promise<AssetsOverviewResponse>,

  /** Report 2 — count, value and status breakdown per asset type */
  getByType: (
    filters: AssetsByTypeFilters = {},
  ): Promise<AssetsByTypeResponse> =>
    apiRequest.get(`${BASE_URL}/by-type`, {
      params: filters,
    }) as unknown as Promise<AssetsByTypeResponse>,

  /** Report 3 — status breakdown + transitions + alerts */
  getByStatus: (
    filters: AssetsByStatusFilters = {},
  ): Promise<AssetsByStatusResponse> =>
    apiRequest.get(`${BASE_URL}/by-status`, {
      params: filters,
    }) as unknown as Promise<AssetsByStatusResponse>,

  /** Report 4 — geographic distribution with per-location breakdown */
  getByLocation: (
    filters: AssetsByLocationFilters = {},
  ): Promise<AssetsByLocationResponse> =>
    apiRequest.get(`${BASE_URL}/by-location`, {
      params: filters,
    }) as unknown as Promise<AssetsByLocationResponse>,

  /** Report 5 — purchase vs current value, depreciation by type and age */
  getDepreciation: (
    filters: DepreciationAnalysisFilters = {},
  ): Promise<DepreciationAnalysisResponse> =>
    apiRequest.get(`${BASE_URL}/depreciation`, {
      params: filters,
    }) as unknown as Promise<DepreciationAnalysisResponse>,

  /** Report 6 — utilization rates, idle assets, most/least utilized */
  getUtilization: (
    filters: UtilizationReportFilters = {},
  ): Promise<UtilizationReportResponse> =>
    apiRequest.get(`${BASE_URL}/utilization`, {
      params: filters,
    }) as unknown as Promise<UtilizationReportResponse>,
};
