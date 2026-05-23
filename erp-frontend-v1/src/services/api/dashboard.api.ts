/**
 * Dashboard API Service
 * Handles HTTP requests for the main dashboard statistics
 *
 * Provides aggregated statistics from operational modules:
 * - Assets, Projects, Employees, Maintenance, Finance
 * - Critical alerts requiring attention
 */

import { apiClient } from "./axiosConfig";
import type { DashboardStatistics } from "@/types/dashboard";

const BASE_URL = "/dashboard";

/**
 * Dashboard API endpoints
 */
export const dashboardApi = {
  /**
   * Get comprehensive dashboard statistics from all modules
   * @param forceRefresh - Bypass backend dashboard cache for this request
   * @returns Dashboard statistics with all module summaries
   */
  getStatistics: async (forceRefresh = false): Promise<DashboardStatistics> => {
    const { data } = await apiClient.get<DashboardStatistics>(BASE_URL, {
      params: forceRefresh ? { forceRefresh: "true" } : undefined,
    });
    return data;
  },
};
