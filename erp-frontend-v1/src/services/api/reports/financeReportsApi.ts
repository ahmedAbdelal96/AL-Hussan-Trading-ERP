/**
 * ============================================================================
 * FINANCE REPORTS API SERVICE
 * ============================================================================
 *
 * API client for Finance reports module.
 * Handles all HTTP requests to finance reports endpoints.
 *
 * Base URL: /api/v1/reports/finance
 * Authentication: Required (JWT token)
 * Permission: report:finance
 *
 * Available Endpoints:
 * - GET /overview
 * - GET /by-cost-type
 * - GET /by-payment-status
 * - GET /monthly-trend
 * - GET /by-category
 * - GET /by-project
 * - GET /pending-approvals
 * - GET /overdue-payments
 *
 * @module services/api/reports/financeReportsApi
 * @version 1.0.0
 */

import { apiClient } from "../axiosConfig";

/**
 * Base URL for finance reports
 */
const BASE_URL = "/reports/finance";

/**
 * Common filter interface
 * Used across multiple endpoints
 */
export interface FinanceReportFilters {
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
  projectId?: string;
  categoryId?: string;
  siteId?: string;
  /** Filter by payment status (PENDING, PAID, OVERDUE, etc.) */
  paymentStatus?: string;
  /** Filter by cost type (SALARY, FUEL, etc.) */
  costType?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Finance Reports API Client
 *
 * Design pattern: Service Layer
 * - Encapsulates all API calls
 * - Provides type-safe interfaces
 * - Handles request/response transformations
 */
export const financeReportsApi = {
  /**
   * GET /overview
   * High-level financial KPIs and summary metrics
   */
  getOverview: async (filters?: FinanceReportFilters) => {
    const response = await apiClient.get(`${BASE_URL}/overview`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * GET /by-cost-type
   * Breakdown of costs by type (SALARY, FUEL, etc.)
   */
  getCostsByType: async (filters?: FinanceReportFilters) => {
    const response = await apiClient.get(`${BASE_URL}/by-cost-type`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * GET /by-payment-status
   * Breakdown by payment status (PENDING, PAID, OVERDUE)
   */
  getCostsByPaymentStatus: async (filters?: FinanceReportFilters) => {
    const response = await apiClient.get(`${BASE_URL}/by-payment-status`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * GET /monthly-trend
   * Time-series data showing costs over 12 months
   */
  getMonthlyTrend: async (filters?: FinanceReportFilters) => {
    const response = await apiClient.get(`${BASE_URL}/monthly-trend`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * GET /by-category
   * Costs grouped by category
   */
  getCostsByCategory: async (filters?: FinanceReportFilters) => {
    const response = await apiClient.get(`${BASE_URL}/by-category`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * GET /by-project
   * Paginated full list of all projects sorted by total cost
   */
  getCostsByProject: async (
    filters?: FinanceReportFilters,
    pagination?: PaginationParams & { search?: string },
  ) => {
    const response = await apiClient.get(`${BASE_URL}/by-project`, {
      params: { ...filters, ...pagination },
    });
    return response.data;
  },

  /**
   * GET /pending-approvals
   * Paginated list of costs awaiting approval
   */
  getPendingApprovals: async (
    filters?: FinanceReportFilters,
    pagination?: PaginationParams,
  ) => {
    const response = await apiClient.get(`${BASE_URL}/pending-approvals`, {
      params: { ...filters, ...pagination },
    });
    return response.data;
  },

  /**
   * GET /overdue-payments
   * Paginated list of overdue payments
   */
  getOverduePayments: async (
    filters?: FinanceReportFilters,
    pagination?: PaginationParams,
  ) => {
    const response = await apiClient.get(`${BASE_URL}/overdue-payments`, {
      params: { ...filters, ...pagination },
    });
    return response.data;
  },

  /**
   * GET /tax-summary
   * Aggregated tax metrics and monthly breakdown
   */
  getTaxSummary: async (filters?: FinanceReportFilters) => {
    const response = await apiClient.get(`${BASE_URL}/tax-summary`, {
      params: filters,
    });
    return response.data;
  },
};

export default financeReportsApi;
