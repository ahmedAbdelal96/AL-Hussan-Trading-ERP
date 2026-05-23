/**
 * Projects Reports API Service
 *
 * @description API client for Projects module reports
 * @module services/api/reports/projectsReportsApi
 *
 * @remarks
 * - Base URL: /api/v1/reports/projects
 * - All endpoints require authentication and 'report:projects' permission
 * - Implements type-safe API calls using TypeScript interfaces
 *
 * @author ERP System
 * @date 2026-01-23
 */

import apiRequest from "@/services/api/axiosConfig";
import type {
  ProjectsReportFilters,
  ProjectsOverviewResponse,
  ProjectsByStatusResponse,
  ProjectsBySiteResponse,
  BudgetUtilizationResponse,
  TimelineProgressResponse,
  DelayedProjectsResponse,
  CompletedProjectsResponse,
  ProjectCostBreakdownFilters,
  ProjectCostBreakdownResponse,
  ProjectLaborCostFilters,
  ProjectLaborCostResponse,
  ProjectAssetUtilizationFilters,
  ProjectAssetUtilizationResponse,
} from "@/types/reports/projects.types";
import type { ApiResponse } from "@/types";

// Base URL for all projects reports endpoints
const BASE_URL = "/reports/projects";

/**
 * Normalize API envelope to keep report consumers strongly typed.
 * Some endpoints return ApiResponse<T>; this helper consistently returns T.
 */
const unwrapResponse = <T>(response: ApiResponse<T> | T): T => {
  if (response && typeof response === "object" && "data" in (response as object)) {
    return ((response as ApiResponse<T>).data ?? response) as T;
  }
  return response as T;
};

/**
 * Projects Reports API Client
 *
 * @description Provides type-safe methods to fetch all 7 projects reports
 */
export const projectsReportsApi = {
  /**
   * Fetch Projects Overview Report
   *
   * @description Returns 12 key metrics showing overall project portfolio health
   * @endpoint GET /api/v1/reports/projects/overview
   *
   * @param filters - Query parameters (month, year)
   * @returns Projects overview with 12 KPIs
   *
   * @example
   * ```typescript
   * const overview = await projectsReportsApi.getOverview({ month: 1, year: 2026 });
   * console.log(overview.totalProjects); // 45
   * console.log(overview.activeProjects); // 23
   * ```
   */
  getOverview: async (
    filters?: ProjectsReportFilters,
  ): Promise<ProjectsOverviewResponse> => {
    const response = await apiRequest.get<ProjectsOverviewResponse>(
      `${BASE_URL}/overview`,
      { params: filters },
    );
    return unwrapResponse(response);
  },

  /**
   * Fetch Projects by Status Report
   *
   * @description Breakdown of projects by status (PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED)
   * @endpoint GET /api/v1/reports/projects/by-status
   *
   * @param filters - Query parameters (month, year)
   * @returns Array of status breakdown items with counts and budget metrics
   *
   * @example
   * ```typescript
   * const byStatus = await projectsReportsApi.getByStatus({ month: 1, year: 2026 });
   * byStatus.items.forEach(item => {
   *   console.log(`${item.statusName}: ${item.projectCount} projects`);
   * });
   * ```
   */
  getByStatus: async (
    filters?: ProjectsReportFilters,
  ): Promise<ProjectsByStatusResponse> => {
    const response = await apiRequest.get<ProjectsByStatusResponse>(
      `${BASE_URL}/by-status`,
      { params: filters },
    );
    return unwrapResponse(response);
  },

  /**
   * Fetch Projects by Site Report
   *
   * @description Breakdown of projects distributed across sites
   * @endpoint GET /api/v1/reports/projects/by-site
   *
   * @param filters - Query parameters (month, year, siteId)
   * @returns Array of site breakdown items with project counts and budget data
   *
   * @example
   * ```typescript
   * const bySite = await projectsReportsApi.getBySite({ year: 2026 });
   * console.log(`Total sites: ${bySite.totalSites}`);
   * bySite.sites.forEach(site => {
   *   console.log(`${site.siteName}: ${site.projectCount} projects`);
   * });
   * ```
   */
  getBySite: async (
    filters?: ProjectsReportFilters,
  ): Promise<ProjectsBySiteResponse> => {
    const response = await apiRequest.get<ProjectsBySiteResponse>(`${BASE_URL}/by-site`, {
      params: filters,
    });
    return unwrapResponse(response);
  },

  /**
   * Fetch Budget Utilization Report
   *
   * @description Analysis of budget usage and variance across projects
   * @endpoint GET /api/v1/reports/projects/budget-utilization
   *
   * @param filters - Query parameters (month, year, page, limit)
   * @returns Array of projects with budget status (UNDER_BUDGET, ON_BUDGET, OVER_BUDGET)
   *
   * @example
   * ```typescript
   * const budget = await projectsReportsApi.getBudgetUtilization({ year: 2026 });
   * console.log(`Over budget: ${budget.summary.overBudgetCount} projects`);
   * budget.items.forEach(project => {
   *   console.log(`${project.projectName}: ${project.budgetUtilization}%`);
   * });
   * ```
   */
  getBudgetUtilization: async (
    filters?: ProjectsReportFilters,
  ): Promise<BudgetUtilizationResponse> => {
    const response = await apiRequest.get<BudgetUtilizationResponse>(
      `${BASE_URL}/budget-utilization`,
      { params: filters },
    );
    return unwrapResponse(response);
  },

  /**
   * Fetch Timeline Progress Report
   *
   * @description Project schedule performance and timeline analysis
   * @endpoint GET /api/v1/reports/projects/timeline-progress
   * @alias GET /api/v1/reports/projects/timeline
   *
   * @param filters - Query parameters (month, year, status)
   * @returns Array of projects with timeline status and schedule metrics
   *
   * @example
   * ```typescript
   * const timeline = await projectsReportsApi.getTimelineProgress({ year: 2026 });
   * console.log(`On time: ${timeline.onTimeCount} projects`);
   * console.log(`Behind schedule: ${timeline.behindScheduleCount} projects`);
   * timeline.projects.forEach(project => {
   *   console.log(`${project.projectName}: ${project.daysVariance} days variance`);
   * });
   * ```
   */
  getTimelineProgress: async (
    filters?: ProjectsReportFilters,
  ): Promise<TimelineProgressResponse> => {
    const response = await apiRequest.get<TimelineProgressResponse>(
      `${BASE_URL}/timeline-progress`,
      { params: filters },
    );
    return unwrapResponse(response);
  },

  /**
   * Fetch Delayed Projects Report
   *
   * @description Projects behind schedule requiring attention (paginated)
   * @endpoint GET /api/v1/reports/projects/delayed
   *
   * @param filters - Query parameters (month, year, page, limit)
   * @returns Paginated list of delayed projects with severity classification
   *
   * @example
   * ```typescript
   * const delayed = await projectsReportsApi.getDelayed({ page: 1, limit: 20 });
   * console.log(`Total delayed: ${delayed.summary.totalDelayed}`);
   * console.log(`Severe delays: ${delayed.summary.severeDelayCount}`);
   * delayed.data.forEach(project => {
   *   console.log(`${project.projectName}: ${project.delayDays} days late (${project.delaySeverity})`);
   * });
   * ```
   */
  getDelayed: async (
    filters?: ProjectsReportFilters,
  ): Promise<DelayedProjectsResponse> => {
    const response = await apiRequest.get<DelayedProjectsResponse>(
      `${BASE_URL}/delayed`,
      { params: filters },
    );
    return unwrapResponse(response);
  },

  /**
   * Fetch Completed Projects Report
   *
   * @description Analysis of successfully completed projects (paginated)
   * @endpoint GET /api/v1/reports/projects/completed
   *
   * @param filters - Query parameters (month, year, page, limit)
   * @returns Paginated list of completed projects with completion status
   *
   * @example
   * ```typescript
   * const completed = await projectsReportsApi.getCompleted({ year: 2026, page: 1 });
   * console.log(`Total completed: ${completed.summary.totalCompleted}`);
   * console.log(`Completed on time: ${completed.summary.completedOnTime}`);
   * completed.data.forEach(project => {
   *   console.log(`${project.projectName}: ${project.completionStatus} (${project.durationVariance} days variance)`);
   * });
   * ```
   */
  getCompleted: async (
    filters?: ProjectsReportFilters,
  ): Promise<CompletedProjectsResponse> => {
    const response = await apiRequest.get<CompletedProjectsResponse>(
      `${BASE_URL}/completed`,
      { params: filters },
    );
    return unwrapResponse(response);
  },

  getCostBreakdown: async (
    filters?: ProjectCostBreakdownFilters,
  ): Promise<ProjectCostBreakdownResponse> => {
    const response = await apiRequest.get<ProjectCostBreakdownResponse>(
      `${BASE_URL}/cost-breakdown`,
      { params: filters },
    );
    return unwrapResponse(response);
  },

  getLaborCost: async (
    filters?: ProjectLaborCostFilters,
  ): Promise<ProjectLaborCostResponse> => {
    const response = await apiRequest.get<ProjectLaborCostResponse>(
      `${BASE_URL}/labor-cost`,
      { params: filters },
    );
    return unwrapResponse(response);
  },

  getAssetUtilization: async (
    filters?: ProjectAssetUtilizationFilters,
  ): Promise<ProjectAssetUtilizationResponse> => {
    const response = await apiRequest.get<ProjectAssetUtilizationResponse>(
      `${BASE_URL}/asset-utilization`,
      { params: filters },
    );
    return unwrapResponse(response);
  },
};

/**
 * Export default API client
 */
export default projectsReportsApi;
