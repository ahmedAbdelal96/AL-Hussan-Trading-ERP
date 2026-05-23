/**
 * Employees Reports Custom Hook
 *
 * @description React Query hooks for fetching Employees reports
 * @module hooks/reports/useEmployeesReport
 *
 * @remarks
 * - Uses TanStack Query (React Query) for data fetching and caching
 * - Automatic caching (5 minutes default)
 * - Automatic refetch on window focus
 * - Built-in loading and error states
 * - Type-safe with TypeScript
 *
 * @author ERP System
 * @date 2026-01-23
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { employeesReportsApi } from "@/services/api/reports/employeesReportsApi";
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

// ============================================
// QUERY KEYS (for cache management)
// ============================================

/**
 * Query key factory for Employees reports
 *
 * @description Consistent query keys for TanStack Query cache
 */
export const employeesReportKeys = {
  all: ["employees-reports"] as const,
  overview: (filters?: EmployeesReportFilters) =>
    [...employeesReportKeys.all, "overview", filters] as const,
  byDepartment: (filters?: EmployeesReportFilters) =>
    [...employeesReportKeys.all, "by-department", filters] as const,
  byEmploymentType: (filters?: EmployeesReportFilters) =>
    [...employeesReportKeys.all, "by-employment-type", filters] as const,
  byPosition: (filters?: EmployeesReportFilters) =>
    [...employeesReportKeys.all, "by-position", filters] as const,
  ageExperience: (filters?: EmployeesReportFilters) =>
    [...employeesReportKeys.all, "age-experience", filters] as const,
  turnover: (filters?: EmployeesReportFilters) =>
    [...employeesReportKeys.all, "turnover", filters] as const,
  statusDistribution: (filters?: EmployeesReportFilters) =>
    [...employeesReportKeys.all, "status-distribution", filters] as const,
  assignment: (f?: EmployeeAssignmentFilters) =>
    [...employeesReportKeys.all, "assignment", f] as const,
  contractExpiry: (f?: ContractExpiryFilters) =>
    [...employeesReportKeys.all, "contract-expiry", f] as const,
};

// ============================================
// HOOK: OVERVIEW REPORT
// ============================================

/**
 * Fetch Employees Overview Report
 *
 * @description Returns 14 key metrics: headcount, gender, turnover, tenure, status
 *
 * @param filters - Optional query params (month, year, includeDepartmentBreakdown)
 * @returns Query result with data, loading, error states
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useEmployeesOverview({ year: 2026 });
 *
 * if (isLoading) return <LoadingSpinner />;
 * return <div>Total Employees: {data.totalEmployees}</div>;
 * ```
 */
export function useEmployeesOverview(
  filters?: EmployeesReportFilters,
): UseQueryResult<EmployeesOverviewResponse, Error> {
  return useQuery({
    queryKey: employeesReportKeys.overview(filters),
    queryFn: () => employeesReportsApi.getOverview(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: BY DEPARTMENT REPORT
// ============================================

/**
 * Fetch Employees by Department Report
 *
 * @description Department breakdown with counts, tenure, and optional salary data
 *
 * @param filters - Optional query params (month, year, includeSalaryCosts)
 * @returns Query result with department breakdown
 */
export function useEmployeesByDepartment(
  filters?: EmployeesReportFilters,
): UseQueryResult<EmployeesByDepartmentResponse, Error> {
  return useQuery({
    queryKey: employeesReportKeys.byDepartment(filters),
    queryFn: () => employeesReportsApi.getByDepartment(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: BY EMPLOYMENT TYPE REPORT
// ============================================

/**
 * Fetch Employees by Employment Type Report
 *
 * @description Breakdown by PERMANENT, CONTRACT, FREELANCE, PART_TIME + expiring contracts
 *
 * @param filters - Optional query params (month, year)
 * @returns Query result with employment type breakdown and expiring contracts
 */
export function useEmployeesByEmploymentType(
  filters?: EmployeesReportFilters,
): UseQueryResult<EmployeesByEmploymentTypeResponse, Error> {
  return useQuery({
    queryKey: employeesReportKeys.byEmploymentType(filters),
    queryFn: () => employeesReportsApi.getByEmploymentType(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: BY POSITION REPORT
// ============================================

/**
 * Fetch Employees by Position Report
 *
 * @description Position breakdown with employee counts, average age, and tenure
 *
 * @param filters - Optional query params (month, year, minEmployees)
 * @returns Query result with position breakdown data
 */
export function useEmployeesByPosition(
  filters?: EmployeesReportFilters,
): UseQueryResult<EmployeesByPositionResponse, Error> {
  return useQuery({
    queryKey: employeesReportKeys.byPosition(filters),
    queryFn: () => employeesReportsApi.getByPosition(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: AGE & EXPERIENCE REPORT
// ============================================

/**
 * Fetch Age & Experience Analysis Report
 *
 * @description Age group distribution, experience ranges, department demographics
 *
 * @param filters - Optional query params (month, year)
 * @returns Query result with age groups, experience ranges, department summaries
 */
export function useAgeExperience(
  filters?: EmployeesReportFilters,
): UseQueryResult<AgeExperienceResponse, Error> {
  return useQuery({
    queryKey: employeesReportKeys.ageExperience(filters),
    queryFn: () => employeesReportsApi.getAgeExperience(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: TURNOVER ANALYSIS REPORT
// ============================================

/**
 * Fetch Turnover Analysis Report
 *
 * @description Monthly hiring/termination trends, risk assessment, termination reasons
 *
 * @param filters - Optional query params (periodMonths, department)
 * @returns Query result with monthly trend and risk analysis
 */
export function useTurnoverAnalysis(
  filters?: EmployeesReportFilters,
): UseQueryResult<TurnoverAnalysisResponse, Error> {
  return useQuery({
    queryKey: employeesReportKeys.turnover(filters),
    queryFn: () => employeesReportsApi.getTurnoverAnalysis(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: STATUS DISTRIBUTION REPORT
// ============================================

/**
 * Fetch Status Distribution Report
 *
 * @description Status breakdown (Active, Inactive, On Leave, Suspended) with availability rate
 *
 * @param filters - Optional query params (month, year)
 * @returns Query result with status breakdown and optional historical trend
 */
export function useStatusDistribution(
  filters?: EmployeesReportFilters,
): UseQueryResult<StatusDistributionResponse, Error> {
  return useQuery({
    queryKey: employeesReportKeys.statusDistribution(filters),
    queryFn: () => employeesReportsApi.getStatusDistribution(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/** Report 8 — per-employee project deployment + allocation % */
export function useEmployeeAssignment(
  filters?: EmployeeAssignmentFilters,
): UseQueryResult<EmployeeAssignmentResponse, Error> {
  return useQuery({
    queryKey: employeesReportKeys.assignment(filters),
    queryFn: () => employeesReportsApi.getAssignment(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/** Report 9 — expiring contracts with urgency classification */
export function useContractExpiry(
  filters?: ContractExpiryFilters,
): UseQueryResult<ContractExpiryResponse, Error> {
  return useQuery({
    queryKey: employeesReportKeys.contractExpiry(filters),
    queryFn: () => employeesReportsApi.getContractExpiry(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
