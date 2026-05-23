/**
 * Executive Reports API Service
 *
 * @description Type-safe API client for the 2 Executive report endpoints.
 * @module services/api/reports/executiveReportsApi
 *
 * @remarks
 * - Base URL: /api/v1/reports/executive
 * - Permission required: report:system  (SUPERADMIN + ADMIN)
 * - All filters are optional — the server applies sensible defaults
 */

import apiRequest from "@/services/api/axiosConfig";
import type {
  ExecutiveDashboardFilters,
  ExecutiveDashboardResponse,
  CompanyPnlFilters,
  CompanyPnlResponse,
} from "@/types/reports/executive.types";

const BASE_URL = "/reports/executive";

export const executiveReportsApi = {
  /** GET /reports/executive/dashboard — Cross-module KPI snapshot */
  getDashboard: (
    filters?: ExecutiveDashboardFilters,
  ): Promise<ExecutiveDashboardResponse> =>
    apiRequest.get(BASE_URL + "/dashboard", {
      params: filters,
    }) as unknown as Promise<ExecutiveDashboardResponse>,

  /** GET /reports/executive/pnl — Company P&L statement */
  getPnl: (filters?: CompanyPnlFilters): Promise<CompanyPnlResponse> =>
    apiRequest.get(BASE_URL + "/pnl", {
      params: filters,
    }) as unknown as Promise<CompanyPnlResponse>,
};
