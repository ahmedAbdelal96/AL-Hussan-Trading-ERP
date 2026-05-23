/**
 * Payroll Reports API Service
 *
 * @description API client for Payroll module reports
 * @module services/api/reports/payrollReportsApi
 *
 * @remarks
 * - Base URL: /api/v1/reports/payroll
 * - All endpoints require authentication and 'report:payroll' permission
 * - Implements type-safe API calls using TypeScript interfaces
 *
 * @author ERP System
 * @date 2026-01-24
 */

import apiRequest from "@/services/api/axiosConfig";
import type {
  PayrollReportFilters,
  PayrollOverviewResponse,
  PayrollByDepartmentResponse,
  PayrollBySiteResponse,
  SalaryComponentsResponse,
  AllowancesReportResponse,
  DeductionsLoansReportResponse,
  PayrollTrendResponse,
  PayrollComparisonResponse,
} from "@/types/reports/payroll.types";

// Base URL for all payroll reports endpoints
const BASE_URL = "/reports/payroll";

/**
 * Payroll Reports API Client
 *
 * @description Provides type-safe methods to fetch all 8 payroll reports
 */
export const payrollReportsApi = {
  /**
   * Fetch Monthly Payroll Overview Report
   *
   * @description Core KPIs: net payroll, total employees, avg salary, growth rate
   * @endpoint GET /api/v1/reports/payroll/overview
   *
   * @param filters - Optional query params (month, year, departmentId, siteId)
   * @returns Payroll overview metrics
   */
  getOverview: async (
    filters?: PayrollReportFilters,
  ): Promise<PayrollOverviewResponse> => {
    return (await apiRequest.get<PayrollOverviewResponse>(
      `${BASE_URL}/overview`,
      { params: filters },
    )) as unknown as PayrollOverviewResponse;
  },

  /**
   * Fetch Payroll by Department Report
   *
   * @description Net payroll, headcount, and avg salary per department
   * @endpoint GET /api/v1/reports/payroll/by-department
   *
   * @param filters - Optional query params (month, year, departmentId)
   * @returns Department payroll breakdown
   */
  getByDepartment: async (
    filters?: PayrollReportFilters,
  ): Promise<PayrollByDepartmentResponse> => {
    return (await apiRequest.get<PayrollByDepartmentResponse>(
      `${BASE_URL}/by-department`,
      { params: filters },
    )) as unknown as PayrollByDepartmentResponse;
  },

  /**
   * Fetch Payroll by Site Report
   *
   * @description Net payroll, headcount, and avg salary per site
   * @endpoint GET /api/v1/reports/payroll/by-site
   *
   * @param filters - Optional query params (month, year, siteId)
   * @returns Site payroll breakdown
   */
  getBySite: async (
    filters?: PayrollReportFilters,
  ): Promise<PayrollBySiteResponse> => {
    return (await apiRequest.get<PayrollBySiteResponse>(`${BASE_URL}/by-site`, {
      params: filters,
    })) as unknown as PayrollBySiteResponse;
  },

  /**
   * Fetch Salary Components Breakdown Report
   *
   * @description Base salaries, allowances, and deductions breakdown
   * @endpoint GET /api/v1/reports/payroll/salary-components
   *
   * @param filters - Optional query params (month, year, departmentId, siteId)
   * @returns Salary component percentages and type-level detail
   */
  getSalaryComponents: async (
    filters?: PayrollReportFilters,
  ): Promise<SalaryComponentsResponse> => {
    return (await apiRequest.get<SalaryComponentsResponse>(
      `${BASE_URL}/salary-components`,
      { params: filters },
    )) as unknown as SalaryComponentsResponse;
  },

  /**
   * Fetch Allowances Report
   *
   * @description Allowance types with amounts, frequency breakdown, status counts
   * @endpoint GET /api/v1/reports/payroll/allowances
   *
   * @param filters - Optional query params (month, year, departmentId, siteId)
   * @returns Full allowances analysis
   */
  getAllowances: async (
    filters?: PayrollReportFilters,
  ): Promise<AllowancesReportResponse> => {
    return (await apiRequest.get<AllowancesReportResponse>(
      `${BASE_URL}/allowances`,
      { params: filters },
    )) as unknown as AllowancesReportResponse;
  },

  /**
   * Fetch Deductions & Loans Report
   *
   * @description Loan portfolio stats + deduction type breakdown
   * @endpoint GET /api/v1/reports/payroll/deductions-loans
   *
   * @param filters - Optional query params (month, year, departmentId, siteId)
   * @returns Loans summary and deductions by type
   */
  getDeductionsLoans: async (
    filters?: PayrollReportFilters,
  ): Promise<DeductionsLoansReportResponse> => {
    return (await apiRequest.get<DeductionsLoansReportResponse>(
      `${BASE_URL}/deductions-loans`,
      { params: filters },
    )) as unknown as DeductionsLoansReportResponse;
  },

  /**
   * Fetch Payroll Trend Report (12 months)
   *
   * @description Monthly payroll trend data and growth analysis
   * @endpoint GET /api/v1/reports/payroll/trend
   *
   * @param filters - Optional query params (periodMonths → mapped to `months`)
   * @returns Monthly payroll data points and trend summary
   */
  getTrend: async (
    filters?: PayrollReportFilters,
  ): Promise<PayrollTrendResponse> => {
    const { periodMonths, ...rest } = filters ?? {};
    return (await apiRequest.get<PayrollTrendResponse>(`${BASE_URL}/trend`, {
      params: {
        ...rest,
        ...(periodMonths !== undefined && { months: periodMonths }),
      },
    })) as unknown as PayrollTrendResponse;
  },

  /**
   * Fetch Payroll Comparison Report
   *
   * @description Side-by-side comparison of two payroll periods
   * @endpoint GET /api/v1/reports/payroll/comparison
   *
   * @param filters - Query params: period1Month, period1Year, period2Month, period2Year
   * @returns Period data, variance analysis, and employee changes
   */
  getComparison: async (
    filters?: PayrollReportFilters,
  ): Promise<PayrollComparisonResponse> => {
    const { period1Month, period1Year, period2Month, period2Year, ...rest } =
      filters ?? {};
    return (await apiRequest.get<PayrollComparisonResponse>(
      `${BASE_URL}/comparison`,
      {
        params: {
          ...rest,
          month1: period1Month,
          year1: period1Year,
          month2: period2Month,
          year2: period2Year,
        },
      },
    )) as unknown as PayrollComparisonResponse;
  },
};
