/**
 * Sites Reports API Service
 *
 * @description Type-safe API client for all 6 Sites report endpoints
 * @module services/api/reports/sitesReportsApi
 *
 * @remarks
 * - Base URL: /api/v1/reports/sites
 * - Permission required: report:sites
 * - All filters are optional — the server applies sensible defaults
 *
 * @author ERP System
 * @date 2026-02-20
 */

import apiRequest from "@/services/api/axiosConfig";
import type {
  SitesReportFilters,
  SitesOverviewResponse,
  SitesByStatusResponse,
  SitesByLocationResponse,
  SitesCapacityResponse,
  SitesWithProjectsResponse,
  SitesPerformanceResponse,
  SiteProfitabilityFilters,
  SiteProfitabilityResponse,
} from "@/types/reports/sites.types";

const BASE_URL = "/reports/sites";

/**
 * Sites Reports API Client
 *
 * Each method maps 1-to-1 with a backend controller GET endpoint.
 * Filters are forwarded as query params via axios `params`.
 */
export const sitesReportsApi = {
  /** GET /reports/sites/overview — KPIs + status distribution + capacity metrics */
  getOverview: (filters?: SitesReportFilters): Promise<SitesOverviewResponse> =>
    apiRequest.get(BASE_URL + "/overview", {
      params: filters,
    }) as unknown as Promise<SitesOverviewResponse>,

  /** GET /reports/sites/by-status — Status breakdown + recent transitions table */
  getByStatus: (filters?: SitesReportFilters): Promise<SitesByStatusResponse> =>
    apiRequest.get(BASE_URL + "/by-status", {
      params: filters,
    }) as unknown as Promise<SitesByStatusResponse>,

  /** GET /reports/sites/by-location — Geographic distribution grouped by city/state/country */
  getByLocation: (
    filters?: SitesReportFilters & {
      groupByLevel?: "country" | "state" | "city";
    },
  ): Promise<SitesByLocationResponse> =>
    apiRequest.get(BASE_URL + "/by-location", {
      params: filters,
    }) as unknown as Promise<SitesByLocationResponse>,

  /** GET /reports/sites/capacity — Utilization aggregate + per-site capacity rows */
  getCapacity: (
    filters?: SitesReportFilters & {
      minUtilization?: number;
      maxUtilization?: number;
      sortBy?: "capacity" | "area" | "utilization";
      sortOrder?: "asc" | "desc";
    },
  ): Promise<SitesCapacityResponse> =>
    apiRequest.get(BASE_URL + "/capacity", {
      params: filters,
    }) as unknown as Promise<SitesCapacityResponse>,

  /** GET /reports/sites/with-projects — Sites linked to their project portfolios */
  getWithProjects: (
    filters?: SitesReportFilters & { includeProjectDetails?: boolean },
  ): Promise<SitesWithProjectsResponse> =>
    apiRequest.get(BASE_URL + "/with-projects", {
      params: filters,
    }) as unknown as Promise<SitesWithProjectsResponse>,

  /** GET /reports/sites/performance — Performance scores, ROI metrics, and closure candidates */
  getPerformance: (
    filters?: SitesReportFilters & {
      minProjects?: number;
      sortBy?: "performance" | "roi" | "projectValue";
      sortOrder?: "asc" | "desc";
    },
  ): Promise<SitesPerformanceResponse> =>
    apiRequest.get(BASE_URL + "/performance", {
      params: filters,
    }) as unknown as Promise<SitesPerformanceResponse>,

  /** GET /reports/sites/profitability — Revenue vs costs per site with profit margin + rating */
  getProfitability: (
    filters?: SiteProfitabilityFilters,
  ): Promise<SiteProfitabilityResponse> =>
    apiRequest.get(BASE_URL + "/profitability", {
      params: filters,
    }) as unknown as Promise<SiteProfitabilityResponse>,
};
