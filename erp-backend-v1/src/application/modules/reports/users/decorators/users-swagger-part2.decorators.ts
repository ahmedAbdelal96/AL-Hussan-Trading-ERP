/**
 * ============================================================================
 * USERS REPORTS - SWAGGER DECORATORS (PART 2: Reports 5-8)
 * ============================================================================
 *
 * Professional API documentation for last 4 user reports.
 * Focuses on RBAC, audit logs, security, and compliance.
 *
 * Reports:
 * 5. User Roles & Permissions
 * 6. Audit Logs
 * 7. Locked Accounts
 * 8. Permission Grant History
 *
 * @module UsersSwaggerDecorators (Part 2)
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
  UserRolesPermissionsResponseDto,
  AuditLogsResponseDto,
  LockedAccountsResponseDto,
  PermissionGrantHistoryResponseDto,
} from '../dto';

// ============================================================================
// REPORT 5: USER ROLES & PERMISSIONS
// ============================================================================

export function UserRolesPermissionsDocs() {
  return applyDecorators(
    ApiTags('Users Reports'),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'User Roles & Permissions Analysis',
      description: `
**Business Value:**
Comprehensive RBAC (Role-Based Access Control) analysis for security compliance, 
access governance, and permission optimization.

**RBAC Metrics:**
- Total roles and permissions in system
- Users with/without roles
- Users with custom permissions
- Active temporary grants
- Expiring grants (configurable threshold)
- Role distribution across user base

**Use Cases:**
1. **Access Governance**: Audit user permissions for compliance
2. **Security Review**: Identify over-privileged users
3. **Role Optimization**: Analyze role effectiveness and usage
4. **Temporary Access Management**: Track time-limited permissions
5. **Onboarding/Offboarding**: Verify access assignments

**Permission Hierarchy:**
1. **Role-Based**: Inherited from assigned roles
2. **Custom Grants**: Additional permissions granted directly
3. **Custom Revokes**: Specific permissions revoked
4. **Temporary**: Time-limited grants with expiration

**Key Insights:**
- **Role Distribution**: Most/least used roles
- **Custom Permissions**: Users with special access
- **Temporary Grants**: Expiring access tracking
- **Permission Count**: Total effective permissions per user
- **System Roles**: Built-in vs. custom roles

**Compliance Features:**
- Track who granted each permission
- Audit trail of permission changes
- Expiration tracking for temporary access
- Separation of duties verification
- Least privilege principle validation

**Performance:**
- Efficient role resolution queries
- Cached permission calculations
- Indexed user-role relationships
- Optional detailed breakdowns

**Recommended Actions:**
- Review quarterly for compliance
- Monitor expiring grants weekly
- Audit custom permissions monthly
- Validate role assignments on user changes
      `.trim(),
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
      name: 'roleId',
      required: false,
      description: 'Filter by specific role ID',
    }),
    ApiQuery({
      name: 'roleSlug',
      required: false,
      description: 'Filter by role slug (e.g., SUPERADMIN, ADMIN)',
      example: 'admin',
    }),
    ApiQuery({
      name: 'includeCustomPermissions',
      required: false,
      description: 'Include custom permission details',
      type: Boolean,
    }),
    ApiQuery({
      name: 'includeTemporary',
      required: false,
      description: 'Include temporary roles/permissions',
      type: Boolean,
    }),
    ApiQuery({
      name: 'includeRoleDistribution',
      required: false,
      description: 'Include role distribution statistics',
      type: Boolean,
    }),
    ApiQuery({
      name: 'expiringInDays',
      required: false,
      description: 'Show grants expiring in X days',
      example: 7,
    }),
    ApiResponse({
      status: 200,
      description: 'User roles & permissions report generated successfully',
      type: UserRolesPermissionsResponseDto,
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
// REPORT 6: AUDIT LOGS
// ============================================================================

export function AuditLogsDocs() {
  return applyDecorators(
    ApiTags('Users Reports'),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Comprehensive Audit Logs & Activity Tracking',
      description: `
**Business Value:**
Complete audit trail for compliance, security investigations, and operational insights.
Critical for regulatory compliance (SOC 2, ISO 27001, GDPR).

**Audit Coverage:**
- All user actions (CREATE, UPDATE, DELETE, VIEW, EXPORT, etc.)
- Authentication events (LOGIN, LOGOUT)
- Permission changes (APPROVE, REJECT, GRANT, REVOKE)
- Resource access tracking
- Change history (before/after values)

**Compliance Requirements:**
- **Who**: User ID, email, full name
- **What**: Action type, resource type/ID
- **When**: Precise timestamp with timezone
- **Where**: IP address, user agent, request URL
- **How**: Request method (GET, POST, PUT, DELETE)
- **Result**: Success/failure status with error details

**Use Cases:**
1. **Security Incidents**: Investigate unauthorized access or suspicious activity
2. **Compliance Audits**: Provide evidence for regulatory reviews
3. **Change Tracking**: Monitor system modifications and data changes
4. **User Activity**: Track individual user actions for accountability
5. **Forensics**: Reconstruct event timelines for investigations

**Action Categories:**
- **Data Modifications**: CREATE, UPDATE, DELETE, RESTORE
- **Data Access**: VIEW, EXPORT, IMPORT
- **Authentication**: LOGIN, LOGOUT
- **Approvals**: APPROVE, REJECT
- **System**: Configuration changes, permission grants

**Advanced Filtering:**
- By action type(s) - single or multiple
- By resource type (users, roles, projects, etc.)
- By status (SUCCESS, FAILED, UNAUTHORIZED)
- By user or date range
- Critical actions only (force logout, permissions)

**Change Details (Optional):**
- **oldValues**: Previous state (JSON)
- **newValues**: New state (JSON)
- **changedFields**: List of modified fields
- Useful for rollback and diff analysis

**Performance:**
- Paginated results (default: 50 per page)
- Indexed by user, action, resource, timestamp
- Efficient filtering with composite indexes
- Optional change details to reduce payload

**Best Practices:**
- Archive logs older than 90 days
- Set up automated compliance reports
- Alert on critical/unauthorized actions
- Integrate with SIEM systems
- Regular review for anomalies
      `.trim(),
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      description: 'Start date for audit logs',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      description: 'End date for audit logs',
    }),
    ApiQuery({
      name: 'userId',
      required: false,
      description: 'Filter by user ID',
    }),
    ApiQuery({
      name: 'email',
      required: false,
      description: 'Filter by user email',
    }),
    ApiQuery({
      name: 'action',
      required: false,
      description: 'Filter by single action type',
      enum: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'VIEW',
        'EXPORT',
        'IMPORT',
        'LOGIN',
        'LOGOUT',
        'APPROVE',
        'REJECT',
        'RESTORE',
      ],
    }),
    ApiQuery({
      name: 'actions',
      required: false,
      description: 'Filter by multiple action types (comma-separated)',
      example: 'CREATE,UPDATE,DELETE',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      description: 'Filter by audit status',
      enum: ['SUCCESS', 'FAILED', 'UNAUTHORIZED', 'PARTIAL'],
    }),
    ApiQuery({
      name: 'resourceType',
      required: false,
      description: 'Filter by resource type',
      example: 'users',
    }),
    ApiQuery({
      name: 'resourceId',
      required: false,
      description: 'Filter by specific resource ID',
    }),
    ApiQuery({
      name: 'ipAddress',
      required: false,
      description: 'Filter by client IP address',
      example: '203.0.113.10',
    }),
    ApiQuery({
      name: 'requestId',
      required: false,
      description: 'Filter by request correlation ID (X-Request-ID)',
      example: 'c99fd971-ff48-4f01-a8b4-d64bcf3e2457',
    }),
    ApiQuery({
      name: 'criticalOnly',
      required: false,
      description: 'Include only critical actions (force logout, permissions)',
      type: Boolean,
    }),
    ApiQuery({
      name: 'includeChangeDetails',
      required: false,
      description: 'Include oldValues/newValues for changes',
      type: Boolean,
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Page number for pagination',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Items per page',
      example: 50,
    }),
    ApiResponse({
      status: 200,
      description: 'Audit logs report generated successfully',
      type: AuditLogsResponseDto,
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
// REPORT 7: LOCKED ACCOUNTS
// ============================================================================

export function LockedAccountsDocs() {
  return applyDecorators(
    ApiTags('Users Reports'),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Locked Accounts Security Tracking',
      description: `
**Business Value:**
Monitor account lockouts for security threats, user support needs, and 
authentication policy effectiveness.

**Lock Metrics:**
- Total locked accounts (current)
- Temporary vs. permanent locks
- Lock rate (% of all users)
- Unlocked accounts in period
- Average lock duration
- Lock trends over time

**Lock Types:**
1. **Temporary Lock** (15 minutes):
   - Triggered after 5 failed login attempts
   - First occurrence only
   - Auto-unlocks after timeout
   - User can retry after expiration

2. **Permanent Lock**:
   - Triggered after second occurrence of 5 failures
   - Requires admin intervention (SUPERADMIN)
   - Security escalation required
   - Manual unlock with audit trail

**Use Cases:**
1. **Security Monitoring**: Track lockout patterns and trends
2. **User Support**: Identify users needing password assistance
3. **Policy Effectiveness**: Evaluate authentication policy impact
4. **Incident Response**: Monitor lock spikes during attacks
5. **Compliance**: Document security controls effectiveness

**Security Insights:**
- **Lock Spikes**: Indicate potential attack or system issues
- **Permanent Locks**: Users requiring intervention
- **Repeated Locks**: Users with password management issues
- **IP Patterns**: Geographic distribution of lockouts

**Unlock History:**
- Who unlocked (admin email)
- When unlocked (timestamp)
- Previous lock type and duration
- Useful for accountability and pattern analysis

**Lock Trends:**
- Daily/weekly/monthly lock rates
- Net change (new locks - unlocks)
- Seasonal patterns
- Correlation with security events

**Performance:**
- Real-time lock status tracking
- Indexed queries on lock fields
- Efficient unlock history retrieval
- Optional trend analysis

**Recommended Actions:**
- Monitor daily for security
- Review unlock requests promptly
- Investigate permanent locks immediately
- Track users with repeated locks
- Coordinate with security team for anomalies
      `.trim(),
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      description: 'Start date for lock analysis',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      description: 'End date for lock analysis',
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
      name: 'lockType',
      required: false,
      description: 'Filter by lock type',
      enum: ['temporary', 'permanent', 'all'],
    }),
    ApiQuery({
      name: 'includeUnlockHistory',
      required: false,
      description: 'Include unlock history details',
      type: Boolean,
    }),
    ApiQuery({
      name: 'currentlyLockedOnly',
      required: false,
      description: 'Show only currently locked accounts',
      type: Boolean,
    }),
    ApiQuery({
      name: 'includeTrends',
      required: false,
      description: 'Include lock trends over time',
      type: Boolean,
    }),
    ApiResponse({
      status: 200,
      description: 'Locked accounts report generated successfully',
      type: LockedAccountsResponseDto,
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
// REPORT 8: PERMISSION GRANT HISTORY
// ============================================================================

export function PermissionGrantHistoryDocs() {
  return applyDecorators(
    ApiTags('Users Reports'),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Permission Grant History & Access Changes',
      description: `
**Business Value:**
Complete audit trail of permission changes for compliance, security reviews, 
and access governance. Critical for SOX, HIPAA, and other regulatory requirements.

**Grant History Tracking:**
- All permission/role grants and revocations
- Who granted/revoked (admin accountability)
- When granted/revoked (timestamp)
- Why granted/revoked (optional reason)
- Expiration tracking for temporary access

**Metrics:**
- Total grants in period (GRANT + REVOKE)
- Grant vs. revoke ratio
- Role grants vs. permission grants
- Temporary grants (active/expired)
- Expiring grants (configurable threshold)
- Unique users/admins affected

**Use Cases:**
1. **Compliance Audits**: Demonstrate access control governance
2. **Security Reviews**: Track privilege escalation and changes
3. **Access Certification**: Periodic review of user permissions
4. **Incident Investigation**: Trace permission changes during incidents
5. **Separation of Duties**: Verify access segregation compliance

**Grant Types:**
1. **Role Grants**: Assign entire role to user
2. **Permission Grants**: Add specific permission
3. **Permission Revokes**: Remove specific permission
4. **Temporary Grants**: Time-limited access with expiration

**Key Insights:**
- **Most Granted**: Popular permissions/roles
- **Most Revoked**: Frequently removed access
- **Admin Activity**: Who grants most permissions
- **Expiring Soon**: Access requiring renewal
- **Grant Patterns**: Seasonal or project-based access

**Compliance Features:**
- Complete audit trail with reasons
- Admin accountability tracking
- Expiration and renewal tracking
- Before/after state for changes
- Integration with PermissionGrantHistory table

**Advanced Filtering:**
- By grant action (GRANT/REVOKE/ALL)
- By target type (ROLE/PERMISSION/ALL)
- By granting admin
- By expiration status
- Date range and user

**Performance:**
- Paginated results (default: 50 per page)
- Indexed grant history queries
- Efficient admin activity aggregation
- Optional expiring grants section

**Best Practices:**
- Review quarterly for compliance
- Monitor expiring grants weekly
- Document all privilege escalations
- Require reasons for critical grants
- Set up automated renewal workflows
      `.trim(),
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      description: 'Start date for grant history',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      description: 'End date for grant history',
    }),
    ApiQuery({
      name: 'userId',
      required: false,
      description: 'Filter by affected user ID',
    }),
    ApiQuery({
      name: 'email',
      required: false,
      description: 'Filter by affected user email',
    }),
    ApiQuery({
      name: 'grantAction',
      required: false,
      description: 'Filter by grant action',
      enum: ['GRANT', 'REVOKE', 'ALL'],
    }),
    ApiQuery({
      name: 'targetType',
      required: false,
      description: 'Filter by target type',
      enum: ['ROLE', 'PERMISSION', 'ALL'],
    }),
    ApiQuery({
      name: 'grantedBy',
      required: false,
      description: 'Filter by granting admin user ID',
    }),
    ApiQuery({
      name: 'expiringInDays',
      required: false,
      description: 'Show grants expiring in X days',
      example: 7,
    }),
    ApiQuery({
      name: 'includeExpired',
      required: false,
      description: 'Include expired grants',
      type: Boolean,
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Page number for pagination',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Items per page',
      example: 50,
    }),
    ApiResponse({
      status: 200,
      description: 'Permission grant history report generated successfully',
      type: PermissionGrantHistoryResponseDto,
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
