/**
 * Projects Reports Custom Hook
 *
 * @description React Query hook for fetching Projects reports
 * @module hooks/reports/useProjectsReport
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
import { projectsReportsApi } from "@/services/api/reports/projectsReportsApi";
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

// ============================================
// QUERY KEYS (for cache management)
// ============================================

/**
 * Query key factory for Projects reports
 *
 * @description Consistent query keys for TanStack Query cache
 */
export const projectsReportKeys = {
  all: ["projects-reports"] as const,
  overview: (filters?: ProjectsReportFilters) =>
    [...projectsReportKeys.all, "overview", filters] as const,
  byStatus: (filters?: ProjectsReportFilters) =>
    [...projectsReportKeys.all, "by-status", filters] as const,
  bySite: (filters?: ProjectsReportFilters) =>
    [...projectsReportKeys.all, "by-site", filters] as const,
  budgetUtilization: (filters?: ProjectsReportFilters) =>
    [...projectsReportKeys.all, "budget-utilization", filters] as const,
  timelineProgress: (filters?: ProjectsReportFilters) =>
    [...projectsReportKeys.all, "timeline-progress", filters] as const,
  delayed: (filters?: ProjectsReportFilters) =>
    [...projectsReportKeys.all, "delayed", filters] as const,
  completed: (filters?: ProjectsReportFilters) =>
    [...projectsReportKeys.all, "completed", filters] as const,
  costBreakdown: (filters?: ProjectCostBreakdownFilters) =>
    [...projectsReportKeys.all, "cost-breakdown", filters] as const,
  laborCost: (filters?: ProjectLaborCostFilters) =>
    [...projectsReportKeys.all, "labor-cost", filters] as const,
  assetUtilization: (filters?: ProjectAssetUtilizationFilters) =>
    [...projectsReportKeys.all, "asset-utilization", filters] as const,
};

// ============================================
// HOOK: OVERVIEW REPORT
// ============================================

/**
 * Fetch Projects Overview Report
 *
 * @description Returns 12 key metrics showing overall project portfolio health
 *
 * @param filters - Query parameters (month, year)
 * @returns Query result with data, loading, error states
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useProjectsOverview({ year: 2026 });
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return (
 *   <div>
 *     <h1>Total Projects: {data.totalProjects}</h1>
 *     <p>Active: {data.activeProjects}</p>
 *   </div>
 * );
 * ```
 */
export function useProjectsOverview(
  filters?: ProjectsReportFilters,
): UseQueryResult<ProjectsOverviewResponse, Error> {
  return useQuery({
    queryKey: projectsReportKeys.overview(filters),
    queryFn: () => projectsReportsApi.getOverview(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

// ============================================
// HOOK: BY STATUS REPORT
// ============================================

/**
 * Fetch Projects by Status Report
 *
 * @description Breakdown of projects by status (PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED)
 *
 * @param filters - Query parameters (month, year)
 * @returns Query result with status breakdown data
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useProjectsByStatus({ month: 1, year: 2026 });
 *
 * if (isLoading) return <LoadingSpinner />;
 *
 * return (
 *   <DonutChart
 *     series={data.items.map(item => item.projectCount)}
 *     labels={data.items.map(item => item.statusName)}
 *   />
 * );
 * ```
 */
export function useProjectsByStatus(
  filters?: ProjectsReportFilters,
): UseQueryResult<ProjectsByStatusResponse, Error> {
  return useQuery({
    queryKey: projectsReportKeys.byStatus(filters),
    queryFn: () => projectsReportsApi.getByStatus(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: BY SITE REPORT
// ============================================

/**
 * Fetch Projects by Site Report
 *
 * @description Breakdown of projects distributed across sites
 *
 * @param filters - Query parameters (month, year, siteId)
 * @returns Query result with site breakdown data
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useProjectsBySite({ year: 2026 });
 *
 * if (isLoading) return <LoadingSpinner />;
 *
 * return (
 *   <BarChart
 *     categories={data.sites.map(site => site.siteName)}
 *     series={[{
 *       name: 'Projects',
 *       data: data.sites.map(site => site.projectCount)
 *     }]}
 *   />
 * );
 * ```
 */
export function useProjectsBySite(
  filters?: ProjectsReportFilters,
): UseQueryResult<ProjectsBySiteResponse, Error> {
  return useQuery({
    queryKey: projectsReportKeys.bySite(filters),
    queryFn: () => projectsReportsApi.getBySite(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: BUDGET UTILIZATION REPORT
// ============================================

/**
 * Fetch Budget Utilization Report
 *
 * @description Analysis of budget usage and variance across projects
 *
 * @param filters - Query parameters (month, year, page, limit)
 * @returns Query result with budget utilization data
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useBudgetUtilization({ year: 2026, page: 1, limit: 20 });
 *
 * if (isLoading) return <LoadingSpinner />;
 *
 * return (
 *   <>
 *     <div className="grid grid-cols-3 gap-4">
 *       <InfoCard label="Over Budget" value={data.summary.overBudgetCount} variant="red" />
 *       <InfoCard label="On Budget" value={data.summary.onBudgetCount} variant="blue" />
 *       <InfoCard label="Under Budget" value={data.summary.underBudgetCount} variant="green" />
 *     </div>
 *     <DataTable data={data.items} />
 *   </>
 * );
 * ```
 */
export function useBudgetUtilization(
  filters?: ProjectsReportFilters,
): UseQueryResult<BudgetUtilizationResponse, Error> {
  return useQuery({
    queryKey: projectsReportKeys.budgetUtilization(filters),
    queryFn: () => projectsReportsApi.getBudgetUtilization(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: TIMELINE PROGRESS REPORT
// ============================================

/**
 * Fetch Timeline Progress Report
 *
 * @description Project schedule performance and timeline analysis
 *
 * @param filters - Query parameters (month, year, status)
 * @returns Query result with timeline progress data
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useTimelineProgress({ year: 2026 });
 *
 * if (isLoading) return <LoadingSpinner />;
 *
 * return (
 *   <>
 *     <div className="grid grid-cols-4 gap-4">
 *       <InfoCard label="On Time" value={data.onTimeCount} variant="green" />
 *       <InfoCard label="Behind" value={data.behindScheduleCount} variant="red" />
 *       <InfoCard label="Ahead" value={data.aheadOfScheduleCount} variant="blue" />
 *       <InfoCard label="At Risk" value={data.atRiskCount} variant="amber" />
 *     </div>
 *     <DonutChart
 *       series={data.timelineSummary.map(item => item.projectCount)}
 *       labels={data.timelineSummary.map(item => item.statusName)}
 *     />
 *   </>
 * );
 * ```
 */
export function useTimelineProgress(
  filters?: ProjectsReportFilters,
): UseQueryResult<TimelineProgressResponse, Error> {
  return useQuery({
    queryKey: projectsReportKeys.timelineProgress(filters),
    queryFn: () => projectsReportsApi.getTimelineProgress(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: DELAYED PROJECTS REPORT
// ============================================

/**
 * Fetch Delayed Projects Report
 *
 * @description Projects behind schedule requiring attention (paginated)
 *
 * @param filters - Query parameters (month, year, page, limit)
 * @returns Query result with delayed projects data
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useDelayedProjects({ page: 1, limit: 20 });
 *
 * if (isLoading) return <LoadingSpinner />;
 *
 * return (
 *   <>
 *     <div className="grid grid-cols-4 gap-4">
 *       <InfoCard label="Total Delayed" value={data.summary.totalDelayed} variant="red" />
 *       <InfoCard label="Minor" value={data.summary.minorDelayCount} variant="amber" />
 *       <InfoCard label="Moderate" value={data.summary.moderateDelayCount} variant="orange" />
 *       <InfoCard label="Severe" value={data.summary.severeDelayCount} variant="red" />
 *     </div>
 *     <DataTable
 *       data={data.data}
 *       pagination={{
 *         page: data.meta.page,
 *         limit: data.meta.limit,
 *         total: data.meta.total,
 *       }}
 *     />
 *   </>
 * );
 * ```
 */
export function useDelayedProjects(
  filters?: ProjectsReportFilters,
): UseQueryResult<DelayedProjectsResponse, Error> {
  return useQuery({
    queryKey: projectsReportKeys.delayed(filters),
    queryFn: () => projectsReportsApi.getDelayed(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: COMPLETED PROJECTS REPORT
// ============================================

/**
 * Fetch Completed Projects Report
 *
 * @description Analysis of successfully completed projects (paginated)
 *
 * @param filters - Query parameters (month, year, page, limit)
 * @returns Query result with completed projects data
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useCompletedProjects({ year: 2026, page: 1, limit: 20 });
 *
 * if (isLoading) return <LoadingSpinner />;
 *
 * return (
 *   <>
 *     <div className="grid grid-cols-4 gap-4">
 *       <InfoCard label="Total Completed" value={data.summary.totalCompleted} variant="purple" />
 *       <InfoCard label="On Time" value={data.summary.completedOnTime} variant="green" />
 *       <InfoCard label="Early" value={data.summary.completedEarly} variant="blue" />
 *       <InfoCard label="Late" value={data.summary.completedLate} variant="red" />
 *     </div>
 *     <DataTable
 *       data={data.data}
 *       pagination={{
 *         page: data.meta.page,
 *         limit: data.meta.limit,
 *         total: data.meta.total,
 *       }}
 *     />
 *   </>
 * );
 * ```
 */
export function useCompletedProjects(
  filters?: ProjectsReportFilters,
): UseQueryResult<CompletedProjectsResponse, Error> {
  return useQuery({
    queryKey: projectsReportKeys.completed(filters),
    queryFn: () => projectsReportsApi.getCompleted(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: COST BREAKDOWN REPORT
// ============================================

export function useProjectCostBreakdown(
  filters?: ProjectCostBreakdownFilters,
): UseQueryResult<ProjectCostBreakdownResponse, Error> {
  return useQuery({
    queryKey: projectsReportKeys.costBreakdown(filters),
    queryFn: () => projectsReportsApi.getCostBreakdown(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: LABOR COST REPORT
// ============================================

export function useProjectLaborCost(
  filters?: ProjectLaborCostFilters,
): UseQueryResult<ProjectLaborCostResponse, Error> {
  return useQuery({
    queryKey: projectsReportKeys.laborCost(filters),
    queryFn: () => projectsReportsApi.getLaborCost(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOK: ASSET UTILIZATION REPORT
// ============================================

export function useProjectAssetUtilization(
  filters?: ProjectAssetUtilizationFilters,
): UseQueryResult<ProjectAssetUtilizationResponse, Error> {
  return useQuery({
    queryKey: projectsReportKeys.assetUtilization(filters),
    queryFn: () => projectsReportsApi.getAssetUtilization(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// EXPORT ALL HOOKS
// ============================================

export { useProjectsOverview as default };
