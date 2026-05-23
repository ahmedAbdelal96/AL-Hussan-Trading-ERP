/**
 * Employees Reports API Service
 *
 * @description API client for Employees module reports
 * @module services/api/reports/employeesReportsApi
 *
 * @remarks
 * - Base URL: /api/v1/reports/employees
 * - All endpoints require authentication and 'report:employees' permission
 * - Implements type-safe API calls using TypeScript interfaces
 *
 * @author ERP System
 * @date 2026-01-23
 */

import apiRequest from "@/services/api/axiosConfig";
import type {
  EmployeesReportFilters,
  EmployeesOverviewResponse,
  EmployeesByDepartmentResponse,
  EmployeesByEmploymentTypeResponse,
  EmployeesByPositionResponse,
  AgeExperienceResponse,
  TurnoverAnalysisResponse,
  StatusDistributionResponse,
  EmployeeAssignmentFilters,
  EmployeeAssignmentResponse,
  ContractExpiryFilters,
  ContractExpiryResponse,
} from "@/types/reports/employees.types";

// Base URL for all employees reports endpoints
const BASE_URL = "/reports/employees";

/**
 * Employees Reports API Client
 *
 * @description Provides type-safe methods to fetch all 7 employees reports
 */
export const employeesReportsApi = {
  /**
   * Fetch Employees Overview Report
   *
   * @description 14 key metrics: headcount, gender, turnover, tenure, status
   * @endpoint GET /api/v1/reports/employees/overview
   *
   * @param filters - Optional query params (month, year, includeDepartmentBreakdown)
   * @returns Employees overview KPIs
   */
  getOverview: async (
    filters?: EmployeesReportFilters,
  ): Promise<EmployeesOverviewResponse> => {
    return (await apiRequest.get<EmployeesOverviewResponse>(
      `${BASE_URL}/overview`,
      { params: filters },
    )) as unknown as EmployeesOverviewResponse;
  },

  /**
   * Fetch Employees by Department Report
   *
   * @description Breakdown of employees across all departments
   * @endpoint GET /api/v1/reports/employees/by-department
   *
   * @param filters - Optional query params (month, year, includeSalaryCosts)
   * @returns Department breakdown with counts, tenure, and optional salary data
   */
  getByDepartment: async (
    filters?: EmployeesReportFilters,
  ): Promise<EmployeesByDepartmentResponse> => {
    return (await apiRequest.get<EmployeesByDepartmentResponse>(
      `${BASE_URL}/by-department`,
      { params: filters },
    )) as unknown as EmployeesByDepartmentResponse;
  },

  /**
   * Fetch Employees by Employment Type Report
   *
   * @description Breakdown by PERMANENT, CONTRACT, FREELANCE, PART_TIME + expiring contracts
   * @endpoint GET /api/v1/reports/employees/by-employment-type
   *
   * @param filters - Optional query params (month, year)
   * @returns Employment type breakdown and expiring contract list
   */
  getByEmploymentType: async (
    filters?: EmployeesReportFilters,
  ): Promise<EmployeesByEmploymentTypeResponse> => {
    return (await apiRequest.get<EmployeesByEmploymentTypeResponse>(
      `${BASE_URL}/by-employment-type`,
      { params: filters },
    )) as unknown as EmployeesByEmploymentTypeResponse;
  },

  /**
   * Fetch Employees by Position Report
   *
   * @description Breakdown of employees by job position
   * @endpoint GET /api/v1/reports/employees/by-position
   *
   * @param filters - Optional query params (month, year, minEmployees)
   * @returns Position breakdown with counts, age, tenure
   */
  getByPosition: async (
    filters?: EmployeesReportFilters,
  ): Promise<EmployeesByPositionResponse> => {
    return (await apiRequest.get<EmployeesByPositionResponse>(
      `${BASE_URL}/by-position`,
      { params: filters },
    )) as unknown as EmployeesByPositionResponse;
  },

  /**
   * Fetch Age & Experience Analysis Report
   *
   * @description Age group distribution, experience ranges, department demographics
   * @endpoint GET /api/v1/reports/employees/age-experience
   *
   * @param filters - Optional query params (month, year)
   * @returns Age groups, experience ranges, and department summaries
   */
  getAgeExperience: async (
    filters?: EmployeesReportFilters,
  ): Promise<AgeExperienceResponse> => {
    return (await apiRequest.get<AgeExperienceResponse>(
      `${BASE_URL}/age-experience`,
      { params: filters },
    )) as unknown as AgeExperienceResponse;
  },

  /**
   * Fetch Turnover Analysis Report
   *
   * @description Monthly hiring/termination trends, risk assessment, reasons
   * @endpoint GET /api/v1/reports/employees/turnover
   *
   * @param filters - Optional query params (periodMonths → mapped to `months`, department)
   * @returns Monthly trend, termination reasons, department turnover, risk level
   */
  getTurnoverAnalysis: async (
    filters?: EmployeesReportFilters,
  ): Promise<TurnoverAnalysisResponse> => {
    const { periodMonths, ...rest } = filters ?? {};
    return (await apiRequest.get<TurnoverAnalysisResponse>(
      `${BASE_URL}/turnover`,
      {
        params: {
          ...rest,
          ...(periodMonths !== undefined && { months: periodMonths }),
        },
      },
    )) as unknown as TurnoverAnalysisResponse;
  },

  /**
   * Fetch Status Distribution Report
   *
   * @description Current status breakdown (Active, Inactive, On Leave, Suspended)
   * @endpoint GET /api/v1/reports/employees/status
   *
   * @param filters - Optional query params (month, year)
   * @returns Status breakdown with availability rate and optional historical trend
   */
  getStatusDistribution: async (
    filters?: EmployeesReportFilters,
  ): Promise<StatusDistributionResponse> => {
    return (await apiRequest.get<StatusDistributionResponse>(
      `${BASE_URL}/status`,
      { params: filters },
    )) as unknown as StatusDistributionResponse;
  },

  /** GET /reports/employees/assignment — Per-employee project deployment + allocation % */
  getAssignment: (
    filters?: EmployeeAssignmentFilters,
  ): Promise<EmployeeAssignmentResponse> =>
    apiRequest.get(`${BASE_URL}/assignment`, {
      params: filters,
    }) as unknown as Promise<EmployeeAssignmentResponse>,

  /** GET /reports/employees/contract-expiry — Expiring contracts with urgency levels */
  getContractExpiry: (
    filters?: ContractExpiryFilters,
  ): Promise<ContractExpiryResponse> =>
    apiRequest.get(`${BASE_URL}/contract-expiry`, {
      params: filters,
    }) as unknown as Promise<ContractExpiryResponse>,
};
