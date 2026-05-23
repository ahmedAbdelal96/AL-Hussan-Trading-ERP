/**
 * ============================================================================
 * USERS REPORTS - API Service
 * ============================================================================
 *
 * HTTP calls to /reports/users/* endpoints.
 *
 * Endpoints:
 * - GET /reports/users/overview
 * - GET /reports/users/login-activity
 * - GET /reports/users/failed-login-attempts
 * - GET /reports/users/active-sessions
 * - GET /reports/users/roles-permissions
 * - GET /reports/users/audit-logs
 * - GET /reports/users/locked-accounts
 * - GET /reports/users/permission-grant-history
 *
 * @module UsersReportsApi
 */

import apiRequest from "@/services/api/axiosConfig";
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

const BASE_URL = "/reports/users";

export const usersReportsApi = {
  /** Report 1 — user KPIs, lock stats, session stats, role distribution */
  getOverview: (
    filters: UsersOverviewFilters = {},
  ): Promise<UsersOverviewResponse> =>
    apiRequest.get(`${BASE_URL}/overview`, {
      params: filters,
    }) as unknown as Promise<UsersOverviewResponse>,

  /** Report 2 — login trends, active/inactive users, peak hours */
  getLoginActivity: (
    filters: LoginActivityFilters = {},
  ): Promise<LoginActivityResponse> =>
    apiRequest.get(`${BASE_URL}/login-activity`, {
      params: filters,
    }) as unknown as Promise<LoginActivityResponse>,

  /** Report 3 — failed attempts, at-risk users, suspicious IPs */
  getFailedLoginAttempts: (
    filters: FailedLoginAttemptsFilters = {},
  ): Promise<FailedLoginAttemptsResponse> =>
    apiRequest.get(`${BASE_URL}/failed-login-attempts`, {
      params: filters,
    }) as unknown as Promise<FailedLoginAttemptsResponse>,

  /** Report 4 — session counts, device breakdown, top users by sessions */
  getActiveSessions: (
    filters: ActiveSessionsFilters = {},
  ): Promise<ActiveSessionsResponse> =>
    apiRequest.get(`${BASE_URL}/active-sessions`, {
      params: filters,
    }) as unknown as Promise<ActiveSessionsResponse>,

  /** Report 5 — RBAC metrics, role distribution, temporary grants */
  getRolesPermissions: (
    filters: UserRolesPermissionsFilters = {},
  ): Promise<UserRolesPermissionsResponse> =>
    apiRequest.get(`${BASE_URL}/roles-permissions`, {
      params: filters,
    }) as unknown as Promise<UserRolesPermissionsResponse>,

  /** Report 6 — audit log entries with action/resource distribution */
  getAuditLogs: (filters: AuditLogsFilters = {}): Promise<AuditLogsResponse> =>
    apiRequest.get(`${BASE_URL}/audit-logs`, {
      params: filters,
    }) as unknown as Promise<AuditLogsResponse>,

  /** Report 7 — locked accounts, unlock history, lock trends */
  getLockedAccounts: (
    filters: LockedAccountsFilters = {},
  ): Promise<LockedAccountsResponse> =>
    apiRequest.get(`${BASE_URL}/locked-accounts`, {
      params: filters,
    }) as unknown as Promise<LockedAccountsResponse>,

  /** Report 8 — grant/revoke history, admin activity, most granted */
  getPermissionGrantHistory: (
    filters: PermissionGrantHistoryFilters = {},
  ): Promise<PermissionGrantHistoryResponse> =>
    apiRequest.get(`${BASE_URL}/permission-grant-history`, {
      params: filters,
    }) as unknown as Promise<PermissionGrantHistoryResponse>,
};
