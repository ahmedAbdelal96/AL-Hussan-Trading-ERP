/**
 * ============================================================================
 * USERS REPORTS - FILTER DTOs
 * ============================================================================
 *
 * Comprehensive filter DTOs for 8 user & security reports.
 * Follows Clean Architecture and provides type-safe filtering.
 *
 * Reports Covered:
 * 1. Users Overview
 * 2. Login Activity
 * 3. Failed Login Attempts
 * 4. Active Sessions
 * 5. User Roles & Permissions
 * 6. Audit Logs
 * 7. Locked Accounts
 * 8. Permission Grant History
 *
 * @module UsersFiltersDto
 * @version 1.0.0
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  IsDateString,
  IsArray,
  IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ============================================================================
// BASE FILTERS
// ============================================================================

/**
 * Base filters shared across user reports
 */
export class BaseUsersFiltersDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by user email',
    example: 'john.doe@company.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}

// ============================================================================
// REPORT 1: USERS OVERVIEW FILTERS
// ============================================================================

export class UsersOverviewFiltersDto extends BaseUsersFiltersDto {
  @ApiPropertyOptional({
    description: 'Include inactive users in counts',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeInactive?: boolean;

  @ApiPropertyOptional({
    description: 'Include deleted users in counts',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDeleted?: boolean;

  @ApiPropertyOptional({
    description: 'Include role distribution breakdown',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeRoleDistribution?: boolean;

  @ApiPropertyOptional({
    description: 'Include locked accounts statistics',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeLockedAccounts?: boolean;
}

// ============================================================================
// REPORT 2: LOGIN ACTIVITY FILTERS
// ============================================================================

export enum LoginActivityGroupBy {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class LoginActivityFiltersDto extends BaseUsersFiltersDto {
  @ApiPropertyOptional({
    description: 'Time grouping for trend analysis',
    enum: LoginActivityGroupBy,
    default: LoginActivityGroupBy.DAILY,
  })
  @IsOptional()
  @IsEnum(LoginActivityGroupBy)
  groupBy?: LoginActivityGroupBy;

  @ApiPropertyOptional({
    description: 'Include login trend analysis',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeTrend?: boolean;

  @ApiPropertyOptional({
    description: 'Include peak hours analysis',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includePeakHours?: boolean;

  @ApiPropertyOptional({
    description: 'Include inactive users (not logged in for X days)',
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  inactiveDays?: number;

  @ApiPropertyOptional({
    description: 'Limit for most active users',
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  topUsersLimit?: number;
}

// ============================================================================
// REPORT 3: FAILED LOGIN ATTEMPTS FILTERS
// ============================================================================

export class FailedLoginAttemptsFiltersDto extends BaseUsersFiltersDto {
  @ApiPropertyOptional({
    description: 'Minimum failed attempts count',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minFailedAttempts?: number;

  @ApiPropertyOptional({
    description: 'Include at-risk users (3-4 attempts)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeAtRiskUsers?: boolean;

  @ApiPropertyOptional({
    description: 'Include IP address analysis',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeIpAnalysis?: boolean;

  @ApiPropertyOptional({
    description: 'Include recently locked accounts (last 24h)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeRecentlyLocked?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by specific IP address',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}

// ============================================================================
// REPORT 4: ACTIVE SESSIONS FILTERS
// ============================================================================

export class ActiveSessionsFiltersDto extends BaseUsersFiltersDto {
  @ApiPropertyOptional({
    description: 'Include expired sessions',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeExpired?: boolean;

  @ApiPropertyOptional({
    description: 'Include revoked sessions',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeRevoked?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum sessions per user',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minSessions?: number;

  @ApiPropertyOptional({
    description: 'Include device details for each session',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDeviceDetails?: boolean;

  @ApiPropertyOptional({
    description: 'Include device type analysis',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDeviceAnalysis?: boolean;

  @ApiPropertyOptional({
    description: 'Limit for top users by sessions',
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  topUsersLimit?: number;
}

// ============================================================================
// REPORT 5: USER ROLES & PERMISSIONS FILTERS
// ============================================================================

export class UserRolesPermissionsFiltersDto extends BaseUsersFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by specific role ID',
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiPropertyOptional({
    description: 'Filter by role slug (e.g., SUPERADMIN, ADMIN)',
  })
  @IsOptional()
  @IsString()
  roleSlug?: string;

  @ApiPropertyOptional({
    description: 'Include custom permissions',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeCustomPermissions?: boolean;

  @ApiPropertyOptional({
    description: 'Include temporary roles/permissions',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeTemporary?: boolean;

  @ApiPropertyOptional({
    description: 'Include role distribution statistics',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeRoleDistribution?: boolean;

  @ApiPropertyOptional({
    description: 'Include expiring grants (next X days)',
    default: 7,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  expiringInDays?: number;
}

// ============================================================================
// REPORT 6: AUDIT LOGS FILTERS
// ============================================================================

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  RESTORE = 'RESTORE',
}

export enum AuditStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  PARTIAL = 'PARTIAL',
}

export class AuditLogsFiltersDto extends BaseUsersFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by audit action type',
    enum: AuditAction,
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({
    description: 'Filter by multiple actions',
    enum: AuditAction,
    isArray: true,
  })
  @Transform(({ value }) => {
    // Handle different array formats:
    // 1. Already an array: [value1, value2]
    // 2. Single value as string: "value"
    // 3. Comma-separated: "value1,value2"
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // Check if comma-separated
      if (value.includes(',')) return value.split(',').map((v) => v.trim());
      return [value];
    }
    return undefined;
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AuditAction, { each: true })
  actions?: AuditAction[];

  @ApiPropertyOptional({
    description: 'Filter by audit status',
    enum: AuditStatus,
  })
  @IsOptional()
  @IsEnum(AuditStatus)
  status?: AuditStatus;

  @ApiPropertyOptional({
    description: 'Filter by resource type (e.g., users, roles, projects)',
  })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({
    description: 'Filter by resource ID',
  })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @ApiPropertyOptional({
    description: 'Include only critical actions (force logout, permissions)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  criticalOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Include change details (oldValues/newValues)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeChangeDetails?: boolean;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Page size (alternative to limit)',
    default: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'Include user activity summary',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeUserActivity?: boolean;

  @ApiPropertyOptional({
    description: 'Limit for most active users',
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  topUsersLimit?: number;

  @ApiPropertyOptional({
    description: 'Include action distribution',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeActionDistribution?: boolean;

  @ApiPropertyOptional({
    description: 'Include resource distribution',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeResourceDistribution?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by specific IP address',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'Filter by request correlation ID (X-Request-ID)',
    example: 'c99fd971-ff48-4f01-a8b4-d64bcf3e2457',
  })
  @IsOptional()
  @IsString()
  requestId?: string;
}

// ============================================================================
// REPORT 7: LOCKED ACCOUNTS FILTERS
// ============================================================================

export enum LockType {
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
  ALL = 'all',
}

export class LockedAccountsFiltersDto extends BaseUsersFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by lock type',
    enum: LockType,
    default: LockType.ALL,
  })
  @IsOptional()
  @IsEnum(LockType)
  lockType?: LockType;

  @ApiPropertyOptional({
    description: 'Include unlock history',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeUnlockHistory?: boolean;

  @ApiPropertyOptional({
    description: 'Include currently locked only',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  currentlyLockedOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Include lock trends',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeTrends?: boolean;
}

// ============================================================================
// REPORT 8: PERMISSION GRANT HISTORY FILTERS
// ============================================================================

export enum GrantAction {
  GRANT = 'GRANT',
  REVOKE = 'REVOKE',
  ALL = 'ALL',
}

export enum TargetType {
  ROLE = 'ROLE',
  PERMISSION = 'PERMISSION',
  ALL = 'ALL',
}

export class PermissionGrantHistoryFiltersDto extends BaseUsersFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by grant action',
    enum: GrantAction,
    default: GrantAction.ALL,
  })
  @IsOptional()
  @IsEnum(GrantAction)
  grantAction?: GrantAction;

  @ApiPropertyOptional({
    description: 'Filter by target type',
    enum: TargetType,
    default: TargetType.ALL,
  })
  @IsOptional()
  @IsEnum(TargetType)
  targetType?: TargetType;

  @ApiPropertyOptional({
    description: 'Filter by who granted (admin user ID)',
  })
  @IsOptional()
  @IsUUID()
  grantedBy?: string;

  @ApiPropertyOptional({
    description: 'Include expiring soon grants (next X days)',
    default: 7,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  expiringInDays?: number;

  @ApiPropertyOptional({
    description: 'Include expired grants',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeExpired?: boolean;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Page size (alternative to limit)',
    default: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'Include most granted permissions/roles',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeMostGranted?: boolean;

  @ApiPropertyOptional({
    description: 'Include admin granting activity',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeAdminActivity?: boolean;

  @ApiPropertyOptional({
    description: 'Limit for top granted permissions/roles',
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  topGrantedLimit?: number;

  @ApiPropertyOptional({
    description: 'Limit for top admins',
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  topAdminsLimit?: number;

  @ApiPropertyOptional({
    description: 'Filter by grant action (alternative to grantAction)',
    enum: GrantAction,
  })
  @IsOptional()
  @IsEnum(GrantAction)
  action?: GrantAction;

  @ApiPropertyOptional({
    description: 'Filter by target ID (role or permission ID)',
  })
  @IsOptional()
  @IsUUID()
  targetId?: string;
}
