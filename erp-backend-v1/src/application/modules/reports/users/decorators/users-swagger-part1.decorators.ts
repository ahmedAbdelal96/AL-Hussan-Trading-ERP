/**
 * ============================================================================
 * USERS REPORTS - SWAGGER DECORATORS (PART 1: Reports 1-4)
 * ============================================================================
 *
 * Professional API documentation for first 4 user reports.
 * Includes business value, use cases, and detailed parameter descriptions.
 *
 * Reports:
 * 1. Users Overview
 * 2. Login Activity
 * 3. Failed Login Attempts
 * 4. Active Sessions
 *
 * @module UsersSwaggerDecorators (Part 1)
 * @version 1.0.0
 */

import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import {
  UsersOverviewResponseDto,
  LoginActivityResponseDto,
  FailedLoginAttemptsResponseDto,
  ActiveSessionsResponseDto,
} from '../dto';

// ============================================================================
// REPORT 1: USERS OVERVIEW
// ============================================================================

export function UsersOverviewDocs() {
  return applyDecorators(
    ApiTags('Users Reports'),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Users Overview Dashboard',
      description: `
**Business Value:**
Provides executive-level insights into user base health, growth, and security status.
Essential for strategic planning, security monitoring, and user management decisions.

**Key Metrics:**
- Total/Active/Inactive/Deleted users counts
- Active user percentage and growth rate
- New users tracking (7/30 days)
- Lock statistics (temporary/permanent)
- Active sessions overview
- Role distribution across user base

**Use Cases:**
1. **Executive Dashboard**: Quick overview of user base health
2. **Security Monitoring**: Track locked accounts and security trends
3. **Growth Analysis**: Monitor user base expansion and activation rates
4. **Capacity Planning**: Understand user growth for infrastructure scaling
5. **RBAC Planning**: Analyze role distribution for access control optimization

**Performance:**
- Optimized with parallel queries
- Minimal database load
- Cached role distribution
- Response time: <500ms

**Recommended Frequency:**
- Daily for security monitoring
- Weekly for growth tracking
- Monthly for strategic planning
      `.trim(),
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      description: 'Filter start date (ISO 8601)',
      example: '2024-01-01T00:00:00Z',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      description: 'Filter end date (ISO 8601)',
      example: '2024-12-31T23:59:59Z',
    }),
    ApiQuery({
      name: 'includeInactive',
      required: false,
      description: 'Include inactive users in counts',
      type: Boolean,
    }),
    ApiQuery({
      name: 'includeDeleted',
      required: false,
      description: 'Include deleted users in counts',
      type: Boolean,
    }),
    ApiQuery({
      name: 'includeRoleDistribution',
      required: false,
      description: 'Include role distribution breakdown',
      type: Boolean,
    }),
    ApiQuery({
      name: 'includeLockedAccounts',
      required: false,
      description: 'Include locked accounts statistics',
      type: Boolean,
    }),
    ApiResponse({
      status: 200,
      description: 'Users overview report generated successfully',
      type: UsersOverviewResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
    ApiResponse({
      status: 403,
      description:
        'Forbidden - Insufficient permissions (requires reports:users:view)',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );
}

// ============================================================================
// REPORT 2: LOGIN ACTIVITY
// ============================================================================

export function LoginActivityDocs() {
  return applyDecorators(
    ApiTags('Users Reports'),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Login Activity Report',
      description: `
**Business Value:**
Track user engagement, identify inactive users, and monitor login patterns for security and productivity insights.

**Key Metrics:**
- Total login attempts (successful/failed)
- Success/failure rates
- Unique users logged in
- Most active users (top 20)
- Inactive users (configurable threshold)
- Login trends (daily/weekly/monthly)
- Peak login hours analysis

**Use Cases:**
1. **User Engagement**: Identify highly active vs. inactive users
2. **Security Monitoring**: Track failed login patterns
3. **Productivity Insights**: Analyze peak usage hours for support planning
4. **License Management**: Identify inactive users for license reclamation
5. **Onboarding Success**: Monitor new user adoption rates

**Insights Provided:**
- **Trend Analysis**: Login patterns over time (configurable grouping)
- **Peak Hours**: Identify busiest times for infrastructure scaling
- **User Segmentation**: Active vs. inactive user identification
- **Login Success Metrics**: Overall authentication health

**Performance Optimizations:**
- Efficient aggregation queries
- Indexed timestamp searches
- Configurable limits for top users
- Optional features to reduce payload

**Best Practices:**
- Run weekly for engagement tracking
- Monitor inactive users monthly
- Use peak hours for maintenance scheduling
- Track trends for capacity planning
      `.trim(),
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      description: 'Filter start date for login activity',
      example: '2024-01-01T00:00:00Z',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      description: 'Filter end date for login activity',
      example: '2024-01-31T23:59:59Z',
    }),
    ApiQuery({
      name: 'userId',
      required: false,
      description: 'Filter by specific user ID',
    }),
    ApiQuery({
      name: 'email',
      required: false,
      description: 'Filter by user email',
    }),
    ApiQuery({
      name: 'groupBy',
      required: false,
      description: 'Time grouping for trend analysis',
      enum: ['daily', 'weekly', 'monthly'],
    }),
    ApiQuery({
      name: 'includeTrend',
      required: false,
      description: 'Include login trend analysis',
      type: Boolean,
    }),
    ApiQuery({
      name: 'includePeakHours',
      required: false,
      description: 'Include peak hours analysis',
      type: Boolean,
    }),
    ApiQuery({
      name: 'inactiveDays',
      required: false,
      description: 'Threshold for inactive users (days)',
      example: 30,
    }),
    ApiQuery({
      name: 'topUsersLimit',
      required: false,
      description: 'Limit for most active users',
      example: 20,
    }),
    ApiResponse({
      status: 200,
      description: 'Login activity report generated successfully',
      type: LoginActivityResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
    ApiResponse({
      status: 403,
      description:
        'Forbidden - Insufficient permissions (requires reports:users:view)',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );
}

// ============================================================================
// REPORT 3: FAILED LOGIN ATTEMPTS
// ============================================================================

export function FailedLoginAttemptsDocs() {
  return applyDecorators(
    ApiTags('Users Reports'),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Failed Login Attempts & Security Monitoring',
      description: `
**Business Value:**
Critical security report for detecting brute-force attacks, identifying compromised accounts, 
and monitoring authentication security posture.

**Security Metrics:**
- Total failed login attempts
- Unique users/IPs with failures
- At-risk users (3-4 failed attempts)
- Recently locked accounts (last 24h)
- Average failed attempts per user
- Suspicious IP addresses

**Use Cases:**
1. **Security Threat Detection**: Identify brute-force attacks via IP analysis
2. **Account Compromise Prevention**: Alert on at-risk users before lockout
3. **Incident Response**: Track failed attempts during security incidents
4. **User Support**: Identify users needing password reset assistance
5. **Compliance**: Audit trail for failed authentication attempts

**Risk Levels:**
- **At-Risk Users**: 3-4 failed attempts (warning threshold)
- **Locked Accounts**: 5+ attempts (automatic lockout)
- **Suspicious IPs**: Multiple failures across different users

**Security Insights:**
- **IP Analysis**: Detect distributed attacks or single-source threats
- **User Patterns**: Identify users frequently forgetting passwords
- **Lock Trends**: Monitor lockout rates and patterns
- **Geographic Analysis**: Track login attempts by IP location

**Alerting Thresholds:**
- 3-4 attempts: At-risk warning
- 5 attempts: Temporary lock (15 minutes)
- Repeated locks: Permanent lock (admin intervention required)

**Performance:**
- Real-time failed attempt tracking
- Indexed by user, IP, and timestamp
- Efficient aggregation for IP analysis
- Fast retrieval of at-risk users

**Recommended Actions:**
- Monitor hourly during security incidents
- Review daily for ongoing threats
- Set up automated alerts for suspicious IPs
- Coordinate with SOC for threat intelligence
      `.trim(),
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      description: 'Start date for failed attempts analysis',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      description: 'End date for failed attempts analysis',
    }),
    ApiQuery({
      name: 'userId',
      required: false,
      description: 'Filter by specific user ID',
    }),
    ApiQuery({
      name: 'email',
      required: false,
      description: 'Filter by user email',
    }),
    ApiQuery({
      name: 'minFailedAttempts',
      required: false,
      description: 'Minimum failed attempts to include',
      example: 1,
    }),
    ApiQuery({
      name: 'includeAtRiskUsers',
      required: false,
      description: 'Include at-risk users (3-4 attempts)',
      type: Boolean,
    }),
    ApiQuery({
      name: 'includeIpAnalysis',
      required: false,
      description: 'Include suspicious IP analysis',
      type: Boolean,
    }),
    ApiQuery({
      name: 'includeRecentlyLocked',
      required: false,
      description: 'Include recently locked accounts (24h)',
      type: Boolean,
    }),
    ApiQuery({
      name: 'ipAddress',
      required: false,
      description: 'Filter by specific IP address',
      example: '192.168.1.100',
    }),
    ApiResponse({
      status: 200,
      description: 'Failed login attempts report generated successfully',
      type: FailedLoginAttemptsResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
    ApiResponse({
      status: 403,
      description:
        'Forbidden - Insufficient permissions (requires reports:users:view)',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );
}

// ============================================================================
// REPORT 4: ACTIVE SESSIONS
// ============================================================================

export function ActiveSessionsDocs() {
  return applyDecorators(
    ApiTags('Users Reports'),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Active Sessions Tracking & Device Analysis',
      description: `
**Business Value:**
Monitor concurrent sessions, track device usage, and identify potential security risks 
from unauthorized session proliferation.

**Session Metrics:**
- Total active sessions
- Users with/without active sessions
- Average sessions per user
- Maximum sessions (single user)
- Sessions expiring in 24h
- Device type distribution

**Use Cases:**
1. **Concurrent License Monitoring**: Track simultaneous user sessions
2. **Security Auditing**: Identify users with excessive sessions
3. **Device Management**: Understand device/browser distribution
4. **Session Cleanup**: Identify stale or expiring sessions
5. **User Behavior Analysis**: Track multi-device usage patterns

**Device Intelligence:**
- **Browser Distribution**: Chrome, Firefox, Safari, Edge, etc.
- **OS Distribution**: Windows, macOS, Linux, iOS, Android
- **Device Types**: Desktop, Mobile, Tablet
- **Geographic Tracking**: Via IP address analysis

**Security Considerations:**
- **Session Proliferation**: Flag users with 5+ concurrent sessions
- **Device Fingerprinting**: Track unique device identifiers
- **Suspicious Patterns**: Multiple locations, unusual devices
- **Force Logout Capability**: Admin can revoke sessions

**Session Lifecycle:**
- **Creation**: Login generates refresh token + session
- **Refresh**: Token rotation every 15 minutes (access token)
- **Expiration**: 7 days without activity
- **Revocation**: Logout or force logout

**Performance:**
- Efficient refresh token queries
- Indexed by user and expiration
- Optional device details (on-demand parsing)
- Configurable top users limit

**Best Practices:**
- Monitor daily for security
- Review weekly for device trends
- Set alerts for 5+ sessions per user
- Regular cleanup of expired sessions
- Coordinate with security team for anomalies
      `.trim(),
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      description: 'Filter session creation start date',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      description: 'Filter session creation end date',
    }),
    ApiQuery({
      name: 'userId',
      required: false,
      description: 'Filter by specific user ID',
    }),
    ApiQuery({
      name: 'email',
      required: false,
      description: 'Filter by user email',
    }),
    ApiQuery({
      name: 'includeExpired',
      required: false,
      description: 'Include expired sessions',
      type: Boolean,
    }),
    ApiQuery({
      name: 'includeRevoked',
      required: false,
      description: 'Include revoked sessions',
      type: Boolean,
    }),
    ApiQuery({
      name: 'minSessions',
      required: false,
      description: 'Minimum sessions per user to include',
      example: 1,
    }),
    ApiQuery({
      name: 'includeDeviceDetails',
      required: false,
      description: 'Include detailed device info for each session',
      type: Boolean,
    }),
    ApiQuery({
      name: 'includeDeviceAnalysis',
      required: false,
      description: 'Include device type distribution analysis',
      type: Boolean,
    }),
    ApiQuery({
      name: 'topUsersLimit',
      required: false,
      description: 'Limit for top users by sessions',
      example: 20,
    }),
    ApiResponse({
      status: 200,
      description: 'Active sessions report generated successfully',
      type: ActiveSessionsResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
    ApiResponse({
      status: 403,
      description:
        'Forbidden - Insufficient permissions (requires reports:users:view)',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );
}
