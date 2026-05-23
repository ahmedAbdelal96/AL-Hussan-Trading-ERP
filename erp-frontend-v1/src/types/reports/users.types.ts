/**
 * ============================================================================
 * USERS REPORTS - TypeScript Types
 * ============================================================================
 * Mirrors the backend UsersReports DTOs exactly.
 *
 * @module UsersReportTypes
 */

export type LoginActivityGroupBy = "daily" | "weekly" | "monthly";
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "VIEW"
  | "EXPORT"
  | "IMPORT"
  | "LOGIN"
  | "LOGOUT"
  | "APPROVE"
  | "REJECT"
  | "RESTORE";
export type AuditStatus = "SUCCESS" | "FAILED" | "UNAUTHORIZED" | "PARTIAL";
export type LockType = "temporary" | "permanent" | "all";
export type GrantAction = "GRANT" | "REVOKE" | "ALL";
export type TargetType = "ROLE" | "PERMISSION" | "ALL";
export type LockStatus =
  | "none"
  | "at_risk"
  | "temporarily_locked"
  | "permanently_locked";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface BaseUsersFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  email?: string;
  isActive?: boolean;
}

export interface UsersOverviewFilters extends BaseUsersFilters {
  includeInactive?: boolean;
  includeDeleted?: boolean;
  includeRoleDistribution?: boolean;
  includeLockedAccounts?: boolean;
}

export interface LoginActivityFilters extends BaseUsersFilters {
  groupBy?: LoginActivityGroupBy;
  includeTrend?: boolean;
  includePeakHours?: boolean;
  inactiveDays?: number;
  topUsersLimit?: number;
}

export interface FailedLoginAttemptsFilters extends BaseUsersFilters {
  minFailedAttempts?: number;
  includeAtRiskUsers?: boolean;
  includeIpAnalysis?: boolean;
  includeRecentlyLocked?: boolean;
  ipAddress?: string;
}

export interface ActiveSessionsFilters extends BaseUsersFilters {
  includeExpired?: boolean;
  includeRevoked?: boolean;
  minSessions?: number;
  includeDeviceDetails?: boolean;
  includeDeviceAnalysis?: boolean;
  topUsersLimit?: number;
}

export interface UserRolesPermissionsFilters extends BaseUsersFilters {
  roleId?: string;
  roleSlug?: string;
  includeCustomPermissions?: boolean;
  includeTemporary?: boolean;
  includeRoleDistribution?: boolean;
  expiringInDays?: number;
}

export interface AuditLogsFilters extends BaseUsersFilters {
  action?: AuditAction;
  actions?: AuditAction[];
  status?: AuditStatus;
  resourceType?: string;
  resourceId?: string;
  criticalOnly?: boolean;
  includeChangeDetails?: boolean;
  page?: number;
  limit?: number;
  pageSize?: number;
  includeUserActivity?: boolean;
  topUsersLimit?: number;
  includeActionDistribution?: boolean;
  includeResourceDistribution?: boolean;
  ipAddress?: string;
}

export interface LockedAccountsFilters extends BaseUsersFilters {
  lockType?: LockType;
  includeUnlockHistory?: boolean;
  currentlyLockedOnly?: boolean;
  includeTrends?: boolean;
}

export interface PermissionGrantHistoryFilters extends BaseUsersFilters {
  grantAction?: GrantAction;
  targetType?: TargetType;
  grantedBy?: string;
  expiringInDays?: number;
  includeExpired?: boolean;
  page?: number;
  limit?: number;
  pageSize?: number;
  includeMostGranted?: boolean;
  includeAdminActivity?: boolean;
  topGrantedLimit?: number;
  topAdminsLimit?: number;
  action?: GrantAction;
  targetId?: string;
}


// Report 1 — Users Overview
export interface UserKPI {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  deletedUsers: number;
  activePercentage: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  growthRate: number;
}

export interface LockStatistics {
  totalLocked: number;
  temporarilyLocked: number;
  permanentlyLocked: number;
  lockRate: number;
}

export interface SessionStatistics {
  activeSessions: number;
  usersWithSessions: number;
  averageSessionsPerUser: number;
}

export interface RoleDistributionItem {
  roleId: string;
  roleName: string;
  roleSlug: string;
  usersCount: number;
  percentage: number;
}

export interface UsersOverviewResponse {
  kpis: UserKPI;
  lockStatistics: LockStatistics;
  sessionStatistics: SessionStatistics;
  roleDistribution: RoleDistributionItem[];
  generatedAt: string;
}

// Report 2 — Login Activity
export interface LoginActivityKPI {
  totalAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  successRate: number;
  failureRate: number;
  uniqueUsers: number;
}

export interface UserLoginDetail {
  userId: string;
  email: string;
  fullName: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  loginCount: number;
  failedAttempts: number;
  daysSinceLastLogin: number | null;
  isActive: boolean;
}

export interface LoginTrendDataPoint {
  period: string;
  successfulLogins: number;
  failedLogins: number;
  totalAttempts: number;
  uniqueUsers: number;
}

export interface PeakHour {
  hour: number;
  loginCount: number;
  percentage: number;
}

export interface LoginActivityResponse {
  kpis: LoginActivityKPI;
  mostActiveUsers: UserLoginDetail[];
  inactiveUsers: UserLoginDetail[];
  trend?: LoginTrendDataPoint[];
  peakHours?: PeakHour[];
  generatedAt: string;
}

// Report 3 — Failed Login Attempts
export interface FailedLoginSecurityMetrics {
  totalFailedAttempts: number;
  uniqueUsersWithFailures: number;
  uniqueIpsWithFailures: number;
  atRiskUsersCount: number;
  recentlyLockedCount: number;
  averageFailedAttemptsPerUser: number;
}

export interface UserFailedLogin {
  userId: string;
  email: string;
  fullName: string;
  currentFailedAttempts: number;
  lastFailedLoginAt: string | null;
  lastFailedLoginIp: string | null;
  lockStatus: LockStatus;
  lockedUntil: string | null;
  remainingLockMinutes: number | null;
  isActive: boolean;
}

export interface SuspiciousIp {
  ipAddress: string;
  failedAttempts: number;
  uniqueUsersTargeted: number;
  firstAttemptAt: string;
  lastAttemptAt: string;
  riskLevel: RiskLevel;
}

export interface FailedLoginAttemptsResponse {
  metrics: FailedLoginSecurityMetrics;
  usersWithFailures: UserFailedLogin[];
  atRiskUsers: UserFailedLogin[];
  suspiciousIps?: SuspiciousIp[];
  recentlyLocked?: UserFailedLogin[];
  generatedAt: string;
}

// Report 4 — Active Sessions
export interface ActiveSessionsMetrics {
  totalActiveSessions: number;
  usersWithActiveSessions: number;
  usersWithoutSessions: number;
  averageSessionsPerUser: number;
  maxSessionsPerUser: number;
  expiringIn24Hours: number;
}

export interface SessionDevice {
  sessionId: string;
  userAgent: string;
  ipAddress: string;
  deviceType: string;
  browser: string;
  os: string;
  createdAt: string;
  expiresAt: string;
  hoursUntilExpiration: number;
  isActive: boolean;
}

export interface UserActiveSession {
  userId: string;
  email: string;
  fullName: string;
  activeSessionsCount: number;
  lastActivity: string | null;
  isActive: boolean;
  devices?: SessionDevice[];
}

export interface DeviceTypeDistribution {
  deviceType: string;
  count: number;
  percentage: number;
}

export interface ActiveSessionsResponse {
  metrics: ActiveSessionsMetrics;
  usersWithSessions: UserActiveSession[];
  topUsersBySessions: UserActiveSession[];
  deviceDistribution?: DeviceTypeDistribution[];
  generatedAt: string;
}

// Report 5 — User Roles & Permissions
export interface RBACMetrics {
  totalRoles: number;
  totalPermissions: number;
  usersWithRoles: number;
  usersWithoutRoles?: number;
  usersWithCustomPermissions: number;
  activeTemporaryGrants: number;
  expiringGrantsCount: number;
}

export interface UserRoleDetail {
  roleId: string;
  roleName: string;
  roleSlug: string;
  isTemporary: boolean;
  grantedAt: string;
  expiresAt?: string | null;
  grantedByEmail: string;
  isActive: boolean;
  daysUntilExpiration: number | null;
}

export interface UserCustomPermissionDetail {
  permissionId: string;
  permissionName: string;
  permissionType: "GRANT" | "REVOKE";
  resource: string;
  action: string;
  isTemporary: boolean;
  grantedAt: string;
  expiresAt?: string | null;
  grantedByEmail: string;
}

export interface RoleDistribution {
  roleId: string;
  roleName: string;
  roleSlug: string;
  usersCount: number;
  percentage: number;
  isSystemRole: boolean;
}

export interface UserRolesPermissionsResponse {
  metrics: RBACMetrics;
  userRoles?: UserRoleDetail[];
  customPermissions?: UserCustomPermissionDetail[];
  roleDistribution?: RoleDistribution[];
  temporaryGrants?: unknown[];
  generatedAt: string;
}

// Report 6 — Audit Logs
export interface AuditLogsMetrics {
  totalLogs: number;
  successfulActions: number;
  failedActions: number;
  unauthorizedAttempts?: number;
  uniqueUsers: number;
  uniqueResources?: number;
  uniqueIPs?: number;
  successRate: number;
}

export interface ActionDistribution {
  action: string;
  count: number;
  percentage: number;
  successCount?: number;
  failedCount?: number;
}

export interface ResourceDistribution {
  resourceType: string;
  count: number;
  percentage: number;
}

export interface AuditLogDetail {
  id: string;
  action: string;
  resourceType?: string;
  resourceId?: string | null;
  resourceName?: string | null;
  status: string;
  userId?: string | null;
  userEmail?: string | null;
  userFullName?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  changedFields?: string[];
  errorMessage?: string | null;
  createdAt: string;
  requestMethod?: string | null;
  requestUrl?: string | null;
}

export interface UserActivitySummary {
  userId: string;
  userEmail: string;
  userFullName: string;
  totalActions: number;
  mostCommonAction?: string;
}

export interface AuditLogsPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface AuditLogsResponse {
  metrics: AuditLogsMetrics;
  actionDistribution?: ActionDistribution[];
  resourceDistribution?: ResourceDistribution[];
  mostActiveUsers?: UserActivitySummary[];
  logs: AuditLogDetail[];
  pagination: AuditLogsPagination;
  generatedAt: string;
}

// Report 7 — Locked Accounts
export interface LockedAccountsMetrics {
  totalLocked: number;
  temporarilyLocked: number;
  permanentlyLocked: number;
  lockRate: number;
  unlockedInPeriod: number;
  averageLockDuration: number;
}

export interface LockedAccountDetail {
  userId: string;
  email: string;
  fullName: string;
  lockType: "temporary" | "permanent";
  failedAttempts: number;
  lastFailedLoginIp?: string | null;
  lastFailedLoginAt?: string | null;
  lockedUntil?: string | null;
  remainingMinutes?: number;
  unlockAttemptCount?: number;
  lockedReason?: string;
  lockedByAdmin?: boolean;
  lastLoginAt?: string | null;
  hoursLockedFor: number;
}

export interface UnlockHistory {
  userId?: string | null;
  email: string;
  fullName: string;
  unlockedAt: string;
  unlockedByEmail: string;
  lockDurationHours: number;
  previousLockType: "temporary" | "permanent";
}

export interface LockTrendDataPoint {
  date?: string;
  period?: string;
  newLocks: number;
  unlocked: number;
  netChange: number;
}

export interface LockedAccountsResponse {
  metrics: LockedAccountsMetrics;
  lockedAccounts: LockedAccountDetail[];
  unlockHistory?: UnlockHistory[];
  lockTrends?: LockTrendDataPoint[];
  trend?: LockTrendDataPoint[];
  generatedAt: string;
}

// Report 8 — Permission Grant History
export interface GrantHistoryMetrics {
  totalGrants: number;
  grantCount: number;
  revokeCount: number;
  grantActions?: number;
  revokeActions?: number;
  grantRevokeRatio?: number;
  temporaryGrantsActive: number;
  expiringGrantsCount: number;
}

export interface GrantHistoryDetail {
  id: string;
  action: "GRANT" | "REVOKE";
  targetType: "ROLE" | "PERMISSION";
  targetId: string;
  targetName: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  grantedBy: string;
  grantedByEmail?: string;
  grantedByFullName?: string;
  grantReason?: string | null;
  isTemporary: boolean;
  expiresAt?: string | null;
  daysUntilExpiration?: number | null;
  createdAt: string;
}

export interface MostGranted {
  targetType: "ROLE" | "PERMISSION";
  targetId: string;
  targetName: string;
  targetDescription?: string;
  grantCount: number;
  resource?: string;
  action?: string;
}

export interface AdminGrantingActivity {
  adminId: string;
  adminEmail: string;
  adminFullName: string;
  totalGrants: number;
  grantCount: number;
  revokeCount: number;
  lastActivity?: string;
}

export interface PermissionGrantHistoryResponse {
  metrics: GrantHistoryMetrics;
  history: GrantHistoryDetail[];
  mostGranted?: MostGranted[];
  adminActivity?: AdminGrantingActivity[];
  generatedAt: string;
}
