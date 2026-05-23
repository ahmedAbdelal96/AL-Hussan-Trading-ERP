/**
 * ============================================================================
 * USERS REPORTS - RESPONSE DTOs (PART 1: Reports 1-4)
 * ============================================================================
 *
 * Comprehensive response structures for first 4 user reports.
 * All DTOs are fully typed with Swagger documentation.
 *
 * Reports:
 * 1. Users Overview
 * 2. Login Activity
 * 3. Failed Login Attempts
 * 4. Active Sessions
 *
 * @module UsersResponsesDto (Part 1)
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================================================
// REPORT 1: USERS OVERVIEW - Response DTOs
// ============================================================================

/**
 * User KPIs for overview dashboard
 */
export class UserKPIDto {
  @ApiProperty({ description: 'Total users count', example: 150 })
  totalUsers: number;

  @ApiProperty({ description: 'Active users count', example: 135 })
  activeUsers: number;

  @ApiProperty({ description: 'Inactive users count', example: 10 })
  inactiveUsers: number;

  @ApiProperty({ description: 'Deleted users count', example: 5 })
  deletedUsers: number;

  @ApiProperty({
    description: 'Active users percentage',
    example: 90.0,
  })
  activePercentage: number;

  @ApiProperty({
    description: 'New users in last 7 days',
    example: 5,
  })
  newUsersLast7Days: number;

  @ApiProperty({
    description: 'New users in last 30 days',
    example: 18,
  })
  newUsersLast30Days: number;

  @ApiProperty({
    description: 'Growth rate percentage (last 30 days)',
    example: 13.6,
  })
  growthRate: number;
}

/**
 * Lock statistics for security monitoring
 */
export class LockStatisticsDto {
  @ApiProperty({ description: 'Total locked accounts', example: 3 })
  totalLocked: number;

  @ApiProperty({ description: 'Temporarily locked', example: 2 })
  temporarilyLocked: number;

  @ApiProperty({ description: 'Permanently locked', example: 1 })
  permanentlyLocked: number;

  @ApiProperty({ description: 'Lock rate percentage', example: 2.0 })
  lockRate: number;
}

/**
 * Session statistics
 */
export class SessionStatisticsDto {
  @ApiProperty({ description: 'Active sessions count', example: 215 })
  activeSessions: number;

  @ApiProperty({
    description: 'Users with active sessions',
    example: 120,
  })
  usersWithSessions: number;

  @ApiProperty({
    description: 'Average sessions per user',
    example: 1.79,
  })
  averageSessionsPerUser: number;
}

/**
 * Role distribution item
 */
export class RoleDistributionItemDto {
  @ApiProperty({ description: 'Role ID' })
  roleId: string;

  @ApiProperty({ description: 'Role name', example: 'ADMIN' })
  roleName: string;

  @ApiProperty({ description: 'Role slug', example: 'admin' })
  roleSlug: string;

  @ApiProperty({ description: 'Users count', example: 15 })
  usersCount: number;

  @ApiProperty({ description: 'Percentage', example: 10.0 })
  percentage: number;
}

/**
 * Complete Users Overview Response
 */
export class UsersOverviewResponseDto {
  @ApiProperty({ description: 'User KPIs' })
  kpis: UserKPIDto;

  @ApiProperty({ description: 'Lock statistics' })
  lockStatistics: LockStatisticsDto;

  @ApiProperty({ description: 'Session statistics' })
  sessionStatistics: SessionStatisticsDto;

  @ApiProperty({
    description: 'Role distribution',
    type: [RoleDistributionItemDto],
  })
  roleDistribution: RoleDistributionItemDto[];

  @ApiProperty({ description: 'Report generated timestamp' })
  generatedAt: Date;
}

// ============================================================================
// REPORT 2: LOGIN ACTIVITY - Response DTOs
// ============================================================================

/**
 * Login activity KPIs
 */
export class LoginActivityKPIDto {
  @ApiProperty({ description: 'Total login attempts', example: 1250 })
  totalAttempts: number;

  @ApiProperty({ description: 'Successful logins', example: 1180 })
  successfulLogins: number;

  @ApiProperty({ description: 'Failed logins', example: 70 })
  failedLogins: number;

  @ApiProperty({ description: 'Success rate percentage', example: 94.4 })
  successRate: number;

  @ApiProperty({ description: 'Failure rate percentage', example: 5.6 })
  failureRate: number;

  @ApiProperty({ description: 'Unique users logged in', example: 120 })
  uniqueUsers: number;
}

/**
 * User login detail
 */
export class UserLoginDetailDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'Full name' })
  fullName: string;

  @ApiProperty({ description: 'Last login timestamp' })
  lastLoginAt: Date | null;

  @ApiProperty({ description: 'Last login IP' })
  lastLoginIp: string | null;

  @ApiProperty({ description: 'Total login count in period', example: 45 })
  loginCount: number;

  @ApiProperty({ description: 'Failed attempts count', example: 2 })
  failedAttempts: number;

  @ApiProperty({ description: 'Days since last login', example: 0 })
  daysSinceLastLogin: number | null;

  @ApiProperty({ description: 'Is currently active' })
  isActive: boolean;
}

/**
 * Login trend data point
 */
export class LoginTrendDataPointDto {
  @ApiProperty({ description: 'Date/period label', example: '2024-01-15' })
  period: string;

  @ApiProperty({ description: 'Successful logins', example: 85 })
  successfulLogins: number;

  @ApiProperty({ description: 'Failed logins', example: 5 })
  failedLogins: number;

  @ApiProperty({ description: 'Total attempts', example: 90 })
  totalAttempts: number;

  @ApiProperty({ description: 'Unique users', example: 42 })
  uniqueUsers: number;
}

/**
 * Peak hour data
 */
export class PeakHourDto {
  @ApiProperty({ description: 'Hour of day (0-23)', example: 9 })
  hour: number;

  @ApiProperty({ description: 'Login count', example: 125 })
  loginCount: number;

  @ApiProperty({ description: 'Percentage of total', example: 10.0 })
  percentage: number;
}

/**
 * Complete Login Activity Response
 */
export class LoginActivityResponseDto {
  @ApiProperty({ description: 'Login activity KPIs' })
  kpis: LoginActivityKPIDto;

  @ApiProperty({
    description: 'Most active users (top 20)',
    type: [UserLoginDetailDto],
  })
  mostActiveUsers: UserLoginDetailDto[];

  @ApiProperty({
    description: 'Inactive users (not logged in for X days)',
    type: [UserLoginDetailDto],
  })
  inactiveUsers: UserLoginDetailDto[];

  @ApiPropertyOptional({
    description: 'Login trend over time',
    type: [LoginTrendDataPointDto],
  })
  trend?: LoginTrendDataPointDto[];

  @ApiPropertyOptional({
    description: 'Peak login hours',
    type: [PeakHourDto],
  })
  peakHours?: PeakHourDto[];

  @ApiProperty({ description: 'Report generated timestamp' })
  generatedAt: Date;
}

// ============================================================================
// REPORT 3: FAILED LOGIN ATTEMPTS - Response DTOs
// ============================================================================

/**
 * Failed login security metrics
 */
export class FailedLoginSecurityMetricsDto {
  @ApiProperty({ description: 'Total failed attempts', example: 70 })
  totalFailedAttempts: number;

  @ApiProperty({ description: 'Unique users with failures', example: 25 })
  uniqueUsersWithFailures: number;

  @ApiProperty({ description: 'Unique IPs with failures', example: 30 })
  uniqueIpsWithFailures: number;

  @ApiProperty({
    description: 'At-risk users count (3-4 attempts)',
    example: 8,
  })
  atRiskUsersCount: number;

  @ApiProperty({
    description: 'Recently locked accounts (24h)',
    example: 2,
  })
  recentlyLockedCount: number;

  @ApiProperty({
    description: 'Average failed attempts per user',
    example: 2.8,
  })
  averageFailedAttemptsPerUser: number;
}

/**
 * User with failed login attempts
 */
export class UserFailedLoginDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'Full name' })
  fullName: string;

  @ApiProperty({ description: 'Current failed attempts count', example: 3 })
  currentFailedAttempts: number;

  @ApiProperty({ description: 'Last failed login timestamp' })
  lastFailedLoginAt: Date | null;

  @ApiProperty({ description: 'Last failed login IP' })
  lastFailedLoginIp: string | null;

  @ApiProperty({ description: 'Lock status', example: 'at_risk' })
  lockStatus: 'none' | 'at_risk' | 'temporarily_locked' | 'permanently_locked';

  @ApiProperty({ description: 'Locked until (if temp locked)' })
  lockedUntil: Date | null;

  @ApiProperty({ description: 'Remaining lock time in minutes', example: 10 })
  remainingLockMinutes: number | null;

  @ApiProperty({ description: 'Is currently active' })
  isActive: boolean;
}

/**
 * IP address with failed attempts
 */
export class SuspiciousIpDto {
  @ApiProperty({ description: 'IP address', example: '192.168.1.100' })
  ipAddress: string;

  @ApiProperty({ description: 'Failed attempts count', example: 15 })
  failedAttempts: number;

  @ApiProperty({ description: 'Unique users targeted', example: 5 })
  uniqueUsersTargeted: number;

  @ApiProperty({ description: 'First attempt timestamp' })
  firstAttemptAt: Date;

  @ApiProperty({ description: 'Last attempt timestamp' })
  lastAttemptAt: Date;

  @ApiProperty({
    description: 'Risk level',
    example: 'high',
    enum: ['low', 'medium', 'high', 'critical'],
  })
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Complete Failed Login Attempts Response
 */
export class FailedLoginAttemptsResponseDto {
  @ApiProperty({ description: 'Security metrics' })
  metrics: FailedLoginSecurityMetricsDto;

  @ApiProperty({
    description: 'Users with failed attempts (sorted by count)',
    type: [UserFailedLoginDto],
  })
  usersWithFailures: UserFailedLoginDto[];

  @ApiProperty({
    description: 'At-risk users (3-4 attempts)',
    type: [UserFailedLoginDto],
  })
  atRiskUsers: UserFailedLoginDto[];

  @ApiPropertyOptional({
    description: 'Suspicious IP addresses',
    type: [SuspiciousIpDto],
  })
  suspiciousIps?: SuspiciousIpDto[];

  @ApiPropertyOptional({
    description: 'Recently locked accounts (last 24h)',
    type: [UserFailedLoginDto],
  })
  recentlyLocked?: UserFailedLoginDto[];

  @ApiProperty({ description: 'Report generated timestamp' })
  generatedAt: Date;
}

// ============================================================================
// REPORT 4: ACTIVE SESSIONS - Response DTOs
// ============================================================================

/**
 * Active sessions overview metrics
 */
export class ActiveSessionsMetricsDto {
  @ApiProperty({ description: 'Total active sessions', example: 215 })
  totalActiveSessions: number;

  @ApiProperty({
    description: 'Users with active sessions',
    example: 120,
  })
  usersWithActiveSessions: number;

  @ApiProperty({
    description: 'Users without sessions',
    example: 30,
  })
  usersWithoutSessions: number;

  @ApiProperty({
    description: 'Average sessions per user',
    example: 1.79,
  })
  averageSessionsPerUser: number;

  @ApiProperty({
    description: 'Maximum sessions (single user)',
    example: 5,
  })
  maxSessionsPerUser: number;

  @ApiProperty({
    description: 'Sessions expiring in next 24h',
    example: 15,
  })
  expiringIn24Hours: number;
}

/**
 * Session device details
 */
export class SessionDeviceDto {
  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'User agent string' })
  userAgent: string;

  @ApiProperty({ description: 'IP address' })
  ipAddress: string;

  @ApiProperty({ description: 'Device type', example: 'desktop' })
  deviceType: string;

  @ApiProperty({ description: 'Browser', example: 'Chrome' })
  browser: string;

  @ApiProperty({ description: 'Operating system', example: 'Windows' })
  os: string;

  @ApiProperty({ description: 'Session created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Session expires at' })
  expiresAt: Date;

  @ApiProperty({ description: 'Hours until expiration', example: 167.5 })
  hoursUntilExpiration: number;

  @ApiProperty({ description: 'Is currently active (not expired)' })
  isActive: boolean;
}

/**
 * User with active sessions
 */
export class UserActiveSessionDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'Full name' })
  fullName: string;

  @ApiProperty({ description: 'Active sessions count', example: 3 })
  activeSessionsCount: number;

  @ApiProperty({ description: 'Last activity timestamp' })
  lastActivity: Date | null;

  @ApiProperty({ description: 'Is currently active user' })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Device details for each session',
    type: [SessionDeviceDto],
  })
  devices?: SessionDeviceDto[];
}

/**
 * Device type distribution
 */
export class DeviceTypeDistributionDto {
  @ApiProperty({ description: 'Device type', example: 'desktop' })
  deviceType: string;

  @ApiProperty({ description: 'Sessions count', example: 150 })
  count: number;

  @ApiProperty({ description: 'Percentage of total', example: 69.8 })
  percentage: number;
}

/**
 * Complete Active Sessions Response
 */
export class ActiveSessionsResponseDto {
  @ApiProperty({ description: 'Active sessions metrics' })
  metrics: ActiveSessionsMetricsDto;

  @ApiProperty({
    description: 'Users with active sessions',
    type: [UserActiveSessionDto],
  })
  usersWithSessions: UserActiveSessionDto[];

  @ApiProperty({
    description: 'Top users by session count (top 20)',
    type: [UserActiveSessionDto],
  })
  topUsersBySessions: UserActiveSessionDto[];

  @ApiPropertyOptional({
    description: 'Device type distribution',
    type: [DeviceTypeDistributionDto],
  })
  deviceDistribution?: DeviceTypeDistributionDto[];

  @ApiProperty({ description: 'Report generated timestamp' })
  generatedAt: Date;
}
