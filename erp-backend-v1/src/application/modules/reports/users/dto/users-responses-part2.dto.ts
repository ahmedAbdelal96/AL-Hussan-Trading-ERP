/**
 * ============================================================================
 * USERS REPORTS - RESPONSE DTOs (PART 2: Reports 5-8)
 * ============================================================================
 *
 * Comprehensive response structures for last 4 user reports.
 * Covers RBAC, audit logs, security, and compliance tracking.
 *
 * Reports:
 * 5. User Roles & Permissions
 * 6. Audit Logs
 * 7. Locked Accounts
 * 8. Permission Grant History
 *
 * @module UsersResponsesDto (Part 2)
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================================================
// REPORT 5: USER ROLES & PERMISSIONS - Response DTOs
// ============================================================================

/**
 * RBAC overview metrics
 */
export class RBACMetricsDto {
  @ApiProperty({ description: 'Total roles in system', example: 8 })
  totalRoles: number;

  @ApiProperty({ description: 'Total permissions in system', example: 120 })
  totalPermissions: number;

  @ApiProperty({ description: 'Users with roles', example: 145 })
  usersWithRoles: number;

  @ApiPropertyOptional({ description: 'Users without roles', example: 5 })
  usersWithoutRoles?: number;

  @ApiProperty({
    description: 'Users with custom permissions',
    example: 25,
  })
  usersWithCustomPermissions: number;

  @ApiProperty({
    description: 'Active temporary grants',
    example: 12,
  })
  activeTemporaryGrants: number;

  @ApiProperty({
    description: 'Grants expiring soon (next 7 days)',
    example: 3,
  })
  expiringGrantsCount: number;
}

/**
 * Role assignment detail
 */
export class UserRoleDetailDto {
  @ApiProperty({ description: 'Role ID' })
  roleId: string;

  @ApiProperty({ description: 'Role name', example: 'ADMIN' })
  roleName: string;

  @ApiProperty({ description: 'Role slug', example: 'admin' })
  roleSlug: string;

  @ApiProperty({ description: 'Is temporary assignment' })
  isTemporary: boolean;

  @ApiProperty({ description: 'Granted at timestamp' })
  grantedAt: Date;

  @ApiPropertyOptional({ description: 'Expires at timestamp' })
  expiresAt?: Date | null;

  @ApiProperty({
    description: 'Granted by user email',
    example: 'admin@company.com',
  })
  grantedByEmail: string;

  @ApiProperty({ description: 'Is currently active' })
  isActive: boolean;

  @ApiProperty({ description: 'Days until expiration', example: 5 })
  daysUntilExpiration: number | null;
}

/**
 * Custom permission detail
 */
export class UserCustomPermissionDetailDto {
  @ApiProperty({ description: 'Permission ID' })
  permissionId: string;

  @ApiProperty({ description: 'Permission name', example: 'projects:delete' })
  permissionName: string;

  @ApiProperty({ description: 'Permission type', enum: ['GRANT', 'REVOKE'] })
  permissionType: 'GRANT' | 'REVOKE';

  @ApiProperty({ description: 'Resource', example: 'projects' })
  resource: string;

  @ApiProperty({ description: 'Action', example: 'delete' })
  action: string;

  @ApiProperty({ description: 'Is temporary' })
  isTemporary: boolean;

  @ApiProperty({ description: 'Granted at timestamp' })
  grantedAt: Date;

  @ApiPropertyOptional({ description: 'Expires at timestamp' })
  expiresAt?: Date | null;

  @ApiProperty({ description: 'Granted by user email' })
  grantedByEmail: string;
}

/**
 * User with roles and permissions
 */
export class UserRolesPermissionsDetailDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'Full name' })
  fullName: string;

  @ApiProperty({ description: 'Is currently active' })
  isActive: boolean;

  @ApiProperty({
    description: 'Assigned roles',
    type: [UserRoleDetailDto],
  })
  roles: UserRoleDetailDto[];

  @ApiProperty({
    description: 'Custom permissions',
    type: [UserCustomPermissionDetailDto],
  })
  customPermissions: UserCustomPermissionDetailDto[];

  @ApiProperty({
    description: 'Total permissions count (inherited + custom)',
    example: 45,
  })
  totalPermissionsCount: number;

  @ApiProperty({
    description: 'Has expiring grants (next 7 days)',
  })
  hasExpiringGrants: boolean;
}

/**
 * Role distribution item
 */
export class RoleDistributionDto {
  @ApiProperty({ description: 'Role ID' })
  roleId: string;

  @ApiProperty({ description: 'Role name', example: 'ADMIN' })
  roleName: string;

  @ApiProperty({ description: 'Role slug', example: 'admin' })
  roleSlug: string;

  @ApiProperty({ description: 'Users count', example: 15 })
  usersCount: number;

  @ApiProperty({ description: 'Percentage of all users', example: 10.0 })
  percentage: number;

  @ApiProperty({ description: 'Is system role' })
  isSystemRole: boolean;
}

/**
 * Complete User Roles & Permissions Response
 */
export class UserRolesPermissionsResponseDto {
  @ApiProperty({ description: 'RBAC metrics' })
  metrics: RBACMetricsDto;

  @ApiPropertyOptional({
    description: 'User roles details',
    type: [UserRoleDetailDto],
  })
  userRoles?: UserRoleDetailDto[];

  @ApiPropertyOptional({
    description: 'User custom permissions',
    type: [UserCustomPermissionDetailDto],
  })
  customPermissions?: UserCustomPermissionDetailDto[];

  @ApiPropertyOptional({
    description: 'Role distribution across users',
    type: [RoleDistributionDto],
  })
  roleDistribution?: RoleDistributionDto[];

  @ApiPropertyOptional({
    description: 'Temporary grants (roles and permissions)',
  })
  temporaryGrants?: any[];

  @ApiProperty({ description: 'Report generated timestamp' })
  generatedAt: Date;
}

// ============================================================================
// REPORT 6: AUDIT LOGS - Response DTOs
// ============================================================================

/**
 * Audit logs overview metrics
 */
export class AuditLogsMetricsDto {
  @ApiProperty({ description: 'Total audit logs in period', example: 5420 })
  totalLogs: number;

  @ApiProperty({ description: 'Successful actions', example: 5150 })
  successfulActions: number;

  @ApiProperty({ description: 'Failed actions', example: 220 })
  failedActions: number;

  @ApiPropertyOptional({ description: 'Unauthorized attempts', example: 50 })
  unauthorizedAttempts?: number;

  @ApiProperty({ description: 'Unique users tracked', example: 98 })
  uniqueUsers: number;

  @ApiPropertyOptional({
    description: 'Unique resources affected',
    example: 1250,
  })
  uniqueResources?: number;

  @ApiPropertyOptional({ description: 'Unique IPs', example: 45 })
  uniqueIPs?: number;

  @ApiProperty({ description: 'Success rate percentage', example: 95.0 })
  successRate: number;
}

/**
 * Action distribution item
 */
export class ActionDistributionDto {
  @ApiProperty({ description: 'Action type', example: 'UPDATE' })
  action: string;

  @ApiProperty({ description: 'Count', example: 1250 })
  count: number;

  @ApiProperty({ description: 'Percentage', example: 23.0 })
  percentage: number;

  @ApiPropertyOptional({ description: 'Success count', example: 1200 })
  successCount?: number;

  @ApiPropertyOptional({ description: 'Failed count', example: 50 })
  failedCount?: number;
}

/**
 * Resource type distribution
 */
export class ResourceDistributionDto {
  @ApiProperty({ description: 'Resource type', example: 'projects' })
  resourceType: string;

  @ApiProperty({ description: 'Actions count', example: 850 })
  count: number;

  @ApiProperty({ description: 'Percentage', example: 15.7 })
  percentage: number;
}

/**
 * Audit log detail entry
 */
export class AuditLogDetailDto {
  @ApiProperty({ description: 'Log ID' })
  id: string;

  @ApiProperty({ description: 'Action performed', example: 'UPDATE' })
  action: string;

  @ApiPropertyOptional({ description: 'Resource type', example: 'projects' })
  resourceType?: string;

  @ApiPropertyOptional({ description: 'Resource ID' })
  resourceId?: string | null;

  @ApiPropertyOptional({ description: 'Resource name' })
  resourceName?: string | null;

  @ApiProperty({ description: 'Status', example: 'SUCCESS' })
  status: string;

  @ApiPropertyOptional({ description: 'User ID' })
  userId?: string | null;

  @ApiPropertyOptional({ description: 'User email' })
  userEmail?: string | null;

  @ApiPropertyOptional({ description: 'User full name' })
  userFullName?: string | null;

  @ApiPropertyOptional({ description: 'IP address' })
  ipAddress?: string | null;

  @ApiPropertyOptional({ description: 'User agent' })
  userAgent?: string | null;

  @ApiPropertyOptional({ description: 'Old values (JSON)' })
  oldValues?: any;

  @ApiPropertyOptional({ description: 'New values (JSON)' })
  newValues?: any;

  @ApiPropertyOptional({ description: 'Changed fields', type: [String] })
  changedFields?: string[];

  @ApiPropertyOptional({ description: 'Error message' })
  errorMessage?: string | null;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Request method', example: 'PUT' })
  requestMethod?: string | null;

  @ApiPropertyOptional({ description: 'Request URL' })
  requestUrl?: string | null;

  @ApiPropertyOptional({ description: 'Request correlation ID' })
  requestId?: string | null;

  @ApiPropertyOptional({ description: 'Request duration in milliseconds' })
  durationMs?: number | null;
}

/**
 * User activity summary
 */
export class UserActivitySummaryDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User email' })
  userEmail: string;

  @ApiProperty({ description: 'User full name' })
  userFullName: string;

  @ApiProperty({ description: 'Total actions', example: 145 })
  totalActions: number;

  @ApiPropertyOptional({ description: 'Most common action', example: 'UPDATE' })
  mostCommonAction?: string;

  @ApiPropertyOptional({ description: 'Action breakdown', type: 'array' })
  actionBreakdown?: Array<{ action: string; count: number }>;
}

/**
 * Complete Audit Logs Response
 */
export class AuditLogsResponseDto {
  @ApiProperty({ description: 'Audit logs metrics' })
  metrics: AuditLogsMetricsDto;

  @ApiPropertyOptional({
    description: 'Action distribution',
    type: [ActionDistributionDto],
  })
  actionDistribution?: ActionDistributionDto[];

  @ApiPropertyOptional({
    description: 'Resource type distribution',
    type: [ResourceDistributionDto],
  })
  resourceDistribution?: ResourceDistributionDto[];

  @ApiPropertyOptional({
    description: 'Most active users (top 20)',
    type: [UserActivitySummaryDto],
  })
  mostActiveUsers?: UserActivitySummaryDto[];

  @ApiProperty({
    description: 'Detailed audit logs (paginated)',
    type: [AuditLogDetailDto],
  })
  logs: AuditLogDetailDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };

  @ApiProperty({ description: 'Report generated timestamp' })
  generatedAt: Date;
}

// ============================================================================
// REPORT 7: LOCKED ACCOUNTS - Response DTOs
// ============================================================================

/**
 * Locked accounts metrics
 */
export class LockedAccountsMetricsDto {
  @ApiProperty({ description: 'Total locked accounts', example: 8 })
  totalLocked: number;

  @ApiProperty({ description: 'Temporarily locked', example: 5 })
  temporarilyLocked: number;

  @ApiProperty({ description: 'Permanently locked', example: 3 })
  permanentlyLocked: number;

  @ApiProperty({ description: 'Lock rate (% of all users)', example: 5.3 })
  lockRate: number;

  @ApiProperty({
    description: 'Accounts unlocked in period',
    example: 12,
  })
  unlockedInPeriod: number;

  @ApiProperty({
    description: 'Average lock duration (hours)',
    example: 2.5,
  })
  averageLockDuration: number;
}

/**
 * Locked account detail
 */
export class LockedAccountDetailDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'Full name' })
  fullName: string;

  @ApiProperty({
    description: 'Lock type',
    enum: ['temporary', 'permanent'],
  })
  lockType: 'temporary' | 'permanent';

  @ApiProperty({ description: 'Failed attempts count', example: 5 })
  failedAttempts: number;

  @ApiPropertyOptional({ description: 'Last failed login IP' })
  lastFailedLoginIp?: string | null;

  @ApiPropertyOptional({ description: 'Last failed login timestamp' })
  lastFailedLoginAt?: Date | null;

  @ApiPropertyOptional({ description: 'Locked until (temp locks)' })
  lockedUntil?: Date | null;

  @ApiPropertyOptional({
    description: 'Remaining lock time (minutes)',
    example: 8,
  })
  remainingMinutes?: number;

  @ApiPropertyOptional({ description: 'Unlock attempt count', example: 0 })
  unlockAttemptCount?: number;

  @ApiPropertyOptional({ description: 'Locked reason' })
  lockedReason?: string;

  @ApiPropertyOptional({ description: 'Locked by admin' })
  lockedByAdmin?: boolean;

  @ApiPropertyOptional({ description: 'Last login timestamp' })
  lastLoginAt?: Date | null;

  @ApiProperty({
    description: 'Hours since locked',
    example: 2.5,
  })
  hoursLockedFor: number;
}

/**
 * Unlock history entry
 */
export class UnlockHistoryDto {
  @ApiPropertyOptional({ description: 'User ID' })
  userId?: string | null;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'Full name' })
  fullName: string;

  @ApiProperty({ description: 'Was unlocked at timestamp' })
  unlockedAt: Date;

  @ApiProperty({ description: 'Unlocked by admin email' })
  unlockedByEmail: string;

  @ApiProperty({ description: 'Lock duration (hours)', example: 15.5 })
  lockDurationHours: number;

  @ApiProperty({
    description: 'Previous lock type',
    enum: ['temporary', 'permanent'],
  })
  previousLockType: 'temporary' | 'permanent';
}

/**
 * Lock trend data point
 */
export class LockTrendDataPointDto {
  @ApiProperty({ description: 'Date', example: '2024-01-15' })
  date?: string;

  @ApiProperty({
    description: 'Date/period (deprecated, use date)',
    example: '2024-01-15',
  })
  period?: string;

  @ApiProperty({ description: 'New locks', example: 3 })
  newLocks: number;

  @ApiProperty({ description: 'Unlocked', example: 2 })
  unlocked: number;

  @ApiProperty({ description: 'Net change', example: 1 })
  netChange: number;
}

/**
 * Complete Locked Accounts Response
 */
export class LockedAccountsResponseDto {
  @ApiProperty({ description: 'Locked accounts metrics' })
  metrics: LockedAccountsMetricsDto;

  @ApiProperty({
    description: 'Currently locked accounts',
    type: [LockedAccountDetailDto],
  })
  lockedAccounts: LockedAccountDetailDto[];

  @ApiPropertyOptional({
    description: 'Unlock history',
    type: [UnlockHistoryDto],
  })
  unlockHistory?: UnlockHistoryDto[];

  @ApiPropertyOptional({
    description: 'Lock trend over time',
    type: [LockTrendDataPointDto],
  })
  lockTrends?: LockTrendDataPointDto[];

  @ApiPropertyOptional({
    description: 'Lock trend over time (deprecated, use lockTrends)',
    type: [LockTrendDataPointDto],
  })
  trend?: LockTrendDataPointDto[];

  @ApiProperty({ description: 'Report generated timestamp' })
  generatedAt: Date;
}

// ============================================================================
// REPORT 8: PERMISSION GRANT HISTORY - Response DTOs
// ============================================================================

/**
 * Grant history metrics
 */
export class GrantHistoryMetricsDto {
  @ApiProperty({ description: 'Total grants in period', example: 145 })
  totalGrants: number;

  @ApiProperty({ description: 'Grant count', example: 120 })
  grantCount: number;

  @ApiProperty({ description: 'Revoke count', example: 25 })
  revokeCount: number;

  @ApiPropertyOptional({
    description: 'GRANT actions (deprecated, use grantCount)',
    example: 120,
  })
  grantActions?: number;

  @ApiPropertyOptional({
    description: 'REVOKE actions (deprecated, use revokeCount)',
    example: 25,
  })
  revokeActions?: number;

  @ApiPropertyOptional({ description: 'Grant/revoke ratio', example: 4.8 })
  grantRevokeRatio?: number;

  @ApiProperty({ description: 'Temporary grants active', example: 12 })
  temporaryGrantsActive: number;

  @ApiProperty({
    description: 'Grants expiring soon (next 7 days)',
    example: 5,
  })
  expiringGrantsCount: number;
}

/**
 * Grant history entry detail
 */
export class GrantHistoryDetailDto {
  @ApiProperty({ description: 'History entry ID' })
  id: string;

  @ApiProperty({ description: 'Action', enum: ['GRANT', 'REVOKE'] })
  action: 'GRANT' | 'REVOKE';

  @ApiProperty({ description: 'Target type', enum: ['ROLE', 'PERMISSION'] })
  targetType: 'ROLE' | 'PERMISSION';

  @ApiProperty({ description: 'Target ID (role/permission ID)' })
  targetId: string;

  @ApiProperty({ description: 'Target name', example: 'ADMIN' })
  targetName: string;

  @ApiProperty({ description: 'Affected user ID' })
  userId: string;

  @ApiProperty({ description: 'Affected user email' })
  userEmail: string;

  @ApiProperty({ description: 'Affected user full name' })
  userFullName: string;

  @ApiProperty({ description: 'Granted by admin ID' })
  grantedBy: string;

  @ApiPropertyOptional({ description: 'Granted by admin email' })
  grantedByEmail?: string;

  @ApiPropertyOptional({ description: 'Granted by admin full name' })
  grantedByFullName?: string;

  @ApiPropertyOptional({ description: 'Reason for grant/revoke' })
  grantReason?: string | null;

  @ApiProperty({ description: 'Is temporary grant' })
  isTemporary: boolean;

  @ApiPropertyOptional({ description: 'Expires at timestamp' })
  expiresAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Days until expiration',
    example: 5,
  })
  daysUntilExpiration?: number | null;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Metadata' })
  metadata?: Record<string, any>;
}

/**
 * Most granted permissions/roles
 */
export class MostGrantedDto {
  @ApiProperty({ description: 'Target type', enum: ['ROLE', 'PERMISSION'] })
  targetType: 'ROLE' | 'PERMISSION';

  @ApiProperty({ description: 'Target ID' })
  targetId: string;

  @ApiProperty({ description: 'Target name', example: 'projects:write' })
  targetName: string;

  @ApiPropertyOptional({ description: 'Target description' })
  targetDescription?: string;

  @ApiProperty({ description: 'Grant count', example: 25 })
  grantCount: number;

  @ApiPropertyOptional({ description: 'Resource (for permissions)' })
  resource?: string;

  @ApiPropertyOptional({ description: 'Action (for permissions)' })
  action?: string;
}

/**
 * Admin granting activity
 */
export class AdminGrantingActivityDto {
  @ApiProperty({ description: 'Admin user ID' })
  adminId: string;

  @ApiProperty({ description: 'Admin email' })
  adminEmail: string;

  @ApiProperty({ description: 'Admin full name' })
  adminFullName: string;

  @ApiProperty({ description: 'Total grants made', example: 45 })
  totalGrants: number;

  @ApiProperty({ description: 'Grant count', example: 38 })
  grantCount: number;

  @ApiProperty({ description: 'Revoke count', example: 7 })
  revokeCount: number;

  @ApiPropertyOptional({ description: 'Last activity timestamp' })
  lastActivity?: Date;
}

/**
 * Complete Permission Grant History Response
 */
export class PermissionGrantHistoryResponseDto {
  @ApiProperty({ description: 'Grant history metrics' })
  metrics: GrantHistoryMetricsDto;

  @ApiProperty({
    description: 'Grant history entries (paginated)',
    type: [GrantHistoryDetailDto],
  })
  history: GrantHistoryDetailDto[];

  @ApiPropertyOptional({
    description: 'Most granted permissions/roles (top 20)',
    type: [MostGrantedDto],
  })
  mostGranted?: MostGrantedDto[];

  @ApiPropertyOptional({
    description: 'Admin granting activity (top admins)',
    type: [AdminGrantingActivityDto],
  })
  adminActivity?: AdminGrantingActivityDto[];

  @ApiProperty({ description: 'Report generated timestamp' })
  generatedAt: Date;
}
