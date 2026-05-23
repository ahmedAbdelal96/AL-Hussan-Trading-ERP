/**
 * ============================================================================
 * @Auth DECORATOR - UNIFIED AUTHORIZATION (OR LOGIC)
 * ============================================================================
 *
 * Single decorator for all authorization requirements.
 * Applies multiple guards in the correct order:
 * 1. JwtAuthGuard - Authentication
 * 2. RolesOrPermissionsGuard - Role OR Permission based access
 *
 * 🔑 KEY FEATURE: OR LOGIC (Maximum Flexibility)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Access is GRANTED if user has:
 *   - ANY of the required roles OR
 *   - ALL of the required permissions
 *
 * 👑 SUPERADMIN: Always bypasses all checks
 *
 * @example
 * // ✅ Allow: ADMIN role OR HR_MANAGER role OR has 'employee:create' permission
 * @Auth({ roles: ['ADMIN', 'HR_MANAGER'], permissions: ['employee:create'] })
 * // User needs: (ADMIN) OR (HR_MANAGER) OR (employee:create permission)
 *
 * @example
 * // ✅ Flexible: Multiple roles or specific permissions
 * @Auth({
 *   roles: ['ADMIN', 'HR_MANAGER', 'HR_STAFF'],
 *   permissions: ['payroll:process', 'payroll:approve']
 * })
 * // User needs: (ANY role from list) OR (ALL permissions from list)
 *
 * @example
 * // ✅ Role-only check
 * @Auth({ roles: ['ADMIN', 'SUPERADMIN'] })
 * // User needs: ADMIN OR SUPERADMIN
 *
 * @example
 * // ✅ Permission-only check
 * @Auth({ permissions: ['user:delete'] })
 * // User needs: user:delete permission
 *
 * @example
 * // 🔓 Public endpoint (no authentication required)
 * @Public()
 *
 * 💡 USE CASES:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. Department Access: @Auth({ roles: ['HR_MANAGER', 'HR_STAFF'] })
 *    → Any HR team member can access
 *
 * 2. Flexible Permissions: @Auth({ roles: ['HR_MANAGER'], permissions: ['employee:create'] })
 *    → HR Manager by role OR anyone with the permission
 *    → Great for temporary access or special cases
 *
 * 3. Strict Permissions: @Auth({ permissions: ['salary:approve', 'finance:access'] })
 *    → Only users with BOTH permissions (typically higher roles)
 *
 * ============================================================================
 */

import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import {
  JwtAccessGuard,
  RolesOrPermissionsGuard,
} from '../../../common/guards';

/**
 * Auth Decorator Options
 */
export type AuthOptions = {
  /**
   * Required roles (ADMIN, HR_MANAGER, USER, etc.)
   * User must have at least one of these roles.
   *
   * Special roles:
   * - SUPERADMIN: Has all permissions and bypasses all checks
   *
   * 🔄 OR Logic: If both roles and permissions are provided,
   * user needs ANY role OR ALL permissions
   */
  roles?: string[];

  /**
   * Required permissions (employee:create, payroll:read, etc.)
   * User must have ALL of these permissions.
   *
   * Format: "resource:action" (e.g., "employee:create", "payroll:delete")
   *
   * 🔄 OR Logic: If both roles and permissions are provided,
   * user needs ANY role OR ALL permissions
   */
  permissions?: string[];

  /**
   * Allow user to access their own data even without required permissions
   * Checks if request params.id or params.userId matches current user.id
   *
   * Example: GET /users/:id with allowSelf=true
   * ✅ User can access /users/{their-id} without user:read permission
   * ❌ User cannot access /users/{other-id} without user:read permission
   */
  allowSelf?: boolean;
};

/**
 * Unified Auth Decorator with OR Logic
 *
 * Applies authentication and authorization guards based on options.
 * If no options provided, only checks authentication.
 *
 * 🔑 Authorization Logic:
 * - If user is SUPERADMIN → ✅ Always allowed
 * - If allowSelf=true and accessing own data → ✅ Allowed
 * - If only roles provided → User needs ANY role
 * - If only permissions provided → User needs ALL permissions
 * - If both provided → User needs (ANY role) OR (ALL permissions)
 *
 * @param options - Authorization options (roles, permissions, allowSelf)
 */
export function Auth(options: AuthOptions = {}) {
  return applyDecorators(
    SetMetadata('auth:roles', options.roles ?? []),
    SetMetadata('auth:permissions', options.permissions ?? []),
    SetMetadata('auth:allowSelf', options.allowSelf ?? false),
    UseGuards(JwtAccessGuard, RolesOrPermissionsGuard),
  );
}
