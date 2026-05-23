/**
 * ============================================================================
 * PAYROLL STATISTICS API SERVICE
 * ============================================================================
 *
 * API service for payroll analytics and reporting
 * Handles all HTTP requests to the payroll statistics backend endpoints
 *
 * Architecture:
 * - Uses centralized apiClient for consistent error handling
 * - Type-safe with TypeScript interfaces
 * - Supports optional date range filtering
 * - Follows RESTful conventions
 *
 * Backend Integration:
 * - Endpoint: GET /api/v1/payroll/statistics
 * - Controller: PayrollController
 * - Use Case: GetPayrollStatisticsUseCase
 *
 * @version 1.0.0
 * @author ERP System - Senior Frontend Developer
 */

import { apiClient } from "./axiosConfig";
import type {
  PayrollStatistics,
  PayrollStatisticsParams,
} from "@/types/payroll-statistics";

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Base URL for payroll API endpoints
 * Follows API versioning pattern: /api/v1/payroll
 */
const BASE_URL = "/payroll";

// ============================================================================
// PAYROLL STATISTICS API
// ============================================================================

/**
 * Payroll Statistics API operations
 * Backend: PayrollController - /api/v1/payroll/statistics
 *
 * Performance Considerations:
 * - Statistics calculation is optimized on backend with single query
 * - Response includes all necessary data for dashboard in one call
 * - Frontend caches response using React Query (5-minute stale time)
 * - Background refetch ensures data freshness
 */
export const payrollStatisticsApi = {
  /**
   * Get comprehensive payroll statistics for dashboard
   * GET /api/v1/payroll/statistics
   *
   * Returns aggregated payroll data including:
   * - Total base salary, allowances, deductions, net payroll
   * - Employee count and average salary
   * - Breakdown by employment type (Permanent, Contract, etc.)
   * - Breakdown by department
   * - Allowances breakdown by type
   * - Deductions breakdown by type
   * - Loans breakdown by status
   * - Monthly payroll trend (last 6 months)
   * - Top 10 earning employees
   * - Recent activity (hires, loan approvals)
   * - Growth rate (month-over-month)
   *
   * @param params - Optional filters
   * @param params.startDate - Start date for filtering (ISO format: YYYY-MM-DD)
   * @param params.endDate - End date for filtering (ISO format: YYYY-MM-DD)
   * @returns Complete payroll statistics object
   *
   * @example
   * ```typescript
   * // Get current payroll statistics
   * const stats = await payrollStatisticsApi.getPayrollStatistics();
   *
   * // Get statistics for specific date range
   * const monthStats = await payrollStatisticsApi.getPayrollStatistics({
   *   startDate: '2026-01-01',
   *   endDate: '2026-01-31'
   * });
   * ```
   *
   * @throws {ApiError} When request fails or server returns error
   * @throws {ValidationError} When date parameters are invalid
   */
  getPayrollStatistics: async (
    params?: PayrollStatisticsParams,
  ): Promise<PayrollStatistics> => {
    // Build query parameters if provided
    const queryParams = new URLSearchParams();

    if (params?.startDate) {
      queryParams.append("startDate", params.startDate);
    }

    if (params?.endDate) {
      queryParams.append("endDate", params.endDate);
    }

    // Construct full URL with query string
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/statistics${queryString ? `?${queryString}` : ""}`;

    // Make GET request through centralized client
    // apiClient handles:
    // - Authentication headers (Bearer token)
    // - Request/response interceptors
    // - Error handling and transformation
    // - Loading states
    const { data } = await apiClient.get<PayrollStatistics>(url);

    return data;
  },
};

// ============================================================================
// COMBINED PAYROLL API EXPORT
// ============================================================================

/**
 * Combined Payroll API
 * Provides access to all payroll-related endpoints
 *
 * Future Extensions:
 * - salaryStructures: CRUD operations for salary structures
 * - allowances: Allowance management
 * - deductions: Deduction management
 * - loans: Loan management
 * - payrollSummary: Individual employee payroll summaries
 *
 * Usage:
 * ```typescript
 * import { payrollApi } from '@/services/api/payroll.api';
 *
 * // Access statistics
 * const stats = await payrollApi.statistics.getPayrollStatistics();
 * ```
 */
// ============================================================================
// PAYROLL PROCESSING API
// ============================================================================

export interface ProcessPayrollRequest {
  payPeriodMonth: number;
  payPeriodYear: number;
  payDate?: string;
  employeeIds?: string[];
  notes?: string;
}

export interface ProcessPayrollResponse {
  totalProcessed: number;
  successful: number;
  failed: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetSalary: number;
  payslips: Record<string, unknown>[];
  errors?: { employeeId: string; employeeName: string; error: string }[];
}

export interface PreviewPayrollRequest {
  payPeriodMonth: number;
  payPeriodYear: number;
  employeeIds?: string[];
}

export interface PreviewEmployeePayroll {
  employeeId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  foodAllowance: number;
  otherAllowances: number;
  totalAllowances: number;
  grossSalary: number;
  insuranceDeduction: number;
  taxDeduction: number;
  loanDeduction: number;
  absenceDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  error?: string;
}

export interface PreviewPayrollResponse {
  alreadyProcessed: boolean;
  totalEmployees: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetSalary: number;
  employees: PreviewEmployeePayroll[];
  errors?: { employeeId: string; employeeName: string; error: string }[];
}

export const payrollProcessingApi = {
  previewPayroll: async (
    data: PreviewPayrollRequest,
  ): Promise<PreviewPayrollResponse> => {
    const response = await apiClient.post<PreviewPayrollResponse>(
      `${BASE_URL}/preview`,
      data,
    );
    return response.data;
  },

  processPayroll: async (
    data: ProcessPayrollRequest,
  ): Promise<ProcessPayrollResponse> => {
    const response = await apiClient.post<ProcessPayrollResponse>(
      `${BASE_URL}/process`,
      data,
    );
    return response.data;
  },
};

export const payrollApi = {
  statistics: payrollStatisticsApi,
  processing: payrollProcessingApi,
};

// Default export for convenience
export default payrollApi;
