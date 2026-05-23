/**
 * ============================================================================
 * USERS REPORTS - React Query Hooks
 * ============================================================================
 *
 * TanStack Query wrappers for all users report endpoints.
 *
 * @module useUsersReport
 */

import { useQuery } from "@tanstack/react-query";
import { usersReportsApi } from "@/services/api/reports/usersReportsApi";
import type {
  UsersOverviewFilters,
  UsersOverviewResponse,
  LoginActivityFilters,
  LoginActivityResponse,
  FailedLoginAttemptsFilters,
  FailedLoginAttemptsResponse,
  ActiveSessionsFilters,
  ActiveSessionsResponse,
  UserRolesPermissionsFilters,
  UserRolesPermissionsResponse,
  AuditLogsFilters,
  AuditLogsResponse,
  LockedAccountsFilters,
  LockedAccountsResponse,
  PermissionGrantHistoryFilters,
  PermissionGrantHistoryResponse,
} from "@/types/reports/users.types";

export const usersReportKeys = {
  all: ["users-reports"] as const,
  overview: (f: UsersOverviewFilters) =>
    [...usersReportKeys.all, "overview", f] as const,
  loginActivity: (f: LoginActivityFilters) =>
    [...usersReportKeys.all, "login-activity", f] as const,
  failedLogins: (f: FailedLoginAttemptsFilters) =>
    [...usersReportKeys.all, "failed-logins", f] as const,
  activeSessions: (f: ActiveSessionsFilters) =>
    [...usersReportKeys.all, "active-sessions", f] as const,
  rolesPermissions: (f: UserRolesPermissionsFilters) =>
    [...usersReportKeys.all, "roles-permissions", f] as const,
  auditLogs: (f: AuditLogsFilters) =>
    [...usersReportKeys.all, "audit-logs", f] as const,
  lockedAccounts: (f: LockedAccountsFilters) =>
    [...usersReportKeys.all, "locked-accounts", f] as const,
  permissionGrantHistory: (f: PermissionGrantHistoryFilters) =>
    [...usersReportKeys.all, "permission-grant-history", f] as const,
};

const QUERY_CONFIG = { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 };


/** Report 1 — user KPIs, lock stats, session stats, role distribution */
export function useUsersOverview(filters: UsersOverviewFilters = {}) {
  return useQuery<UsersOverviewResponse, Error>({
    queryKey: usersReportKeys.overview(filters),
    queryFn: () => usersReportsApi.getOverview(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 2 — login trends, active/inactive users, peak hours */
export function useLoginActivity(filters: LoginActivityFilters = {}) {
  return useQuery<LoginActivityResponse, Error>({
    queryKey: usersReportKeys.loginActivity(filters),
    queryFn: () => usersReportsApi.getLoginActivity(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 3 — failed attempts, at-risk users, suspicious IPs */
export function useFailedLoginAttempts(
  filters: FailedLoginAttemptsFilters = {},
) {
  return useQuery<FailedLoginAttemptsResponse, Error>({
    queryKey: usersReportKeys.failedLogins(filters),
    queryFn: () => usersReportsApi.getFailedLoginAttempts(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 4 — session counts, device breakdown, top users by sessions */
export function useActiveSessions(filters: ActiveSessionsFilters = {}) {
  return useQuery<ActiveSessionsResponse, Error>({
    queryKey: usersReportKeys.activeSessions(filters),
    queryFn: () => usersReportsApi.getActiveSessions(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 5 — RBAC metrics, role distribution, temporary grants */
export function useUserRolesPermissions(
  filters: UserRolesPermissionsFilters = {},
) {
  return useQuery<UserRolesPermissionsResponse, Error>({
    queryKey: usersReportKeys.rolesPermissions(filters),
    queryFn: () => usersReportsApi.getRolesPermissions(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 6 — audit log entries with action/resource distribution */
export function useAuditLogs(filters: AuditLogsFilters = {}) {
  return useQuery<AuditLogsResponse, Error>({
    queryKey: usersReportKeys.auditLogs(filters),
    queryFn: () => usersReportsApi.getAuditLogs(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 7 — locked accounts, unlock history, lock trends */
export function useLockedAccounts(filters: LockedAccountsFilters = {}) {
  return useQuery<LockedAccountsResponse, Error>({
    queryKey: usersReportKeys.lockedAccounts(filters),
    queryFn: () => usersReportsApi.getLockedAccounts(filters),
    ...QUERY_CONFIG,
  });
}

/** Report 8 — grant/revoke history, admin activity, most granted */
export function usePermissionGrantHistory(
  filters: PermissionGrantHistoryFilters = {},
) {
  return useQuery<PermissionGrantHistoryResponse, Error>({
    queryKey: usersReportKeys.permissionGrantHistory(filters),
    queryFn: () => usersReportsApi.getPermissionGrantHistory(filters),
    ...QUERY_CONFIG,
  });
}
