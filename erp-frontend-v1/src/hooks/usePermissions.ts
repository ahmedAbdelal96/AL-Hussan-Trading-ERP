/**
 * usePermissions Hook
 *
 * Provides permission and role checking functionality.
 * Implements the same OR Logic as backend:
 * - User needs ANY role OR ALL permissions
 *
 * Permission Resolution:
 * 1. PRIMARY: Uses permissions from backend (resolved: rolePerms + GRANTs - REVOKEs)
 * 2. FALLBACK: If backend permissions are empty, calculates from ROLE_PERMISSIONS_MAP
 * 3. SUPERADMIN: Always bypasses all permission checks (same as backend)
 *
 * ⭐ BEST PRACTICE: Always use explicit roles + permissions for clarity
 *
 * ✅ RECOMMENDED:
 * can({
 *   roles: [SYSTEM_ROLES.HR_MANAGER, SYSTEM_ROLES.HR_STAFF],
 *   permissions: [PERMISSIONS.EMPLOYEE_READ]
 * })
 *
 * Usage:
 * const { hasRole, hasPermission, isSuperAdmin, can } = usePermissions();
 *
 * if (isSuperAdmin) { ... }
 * if (hasPermission('employee:read')) { ... }
 * if (can({ roles: ['HR_MANAGER'], permissions: ['employee:read'] })) { ... }
 */

import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  SYSTEM_ROLES,
  ROLE_PERMISSIONS_MAP,
  type SystemRole,
  type Permission,
} from "@/config/permissions.constants";

type RoleLike = string | { name?: string };
type PermissionLike = string | { resource?: string; action?: string; name?: string };

const toRoleValue = (role: RoleLike): string => {
  if (typeof role === "string") return role.toUpperCase();
  return role.name?.toUpperCase() || "";
};

const toPermissionValue = (permission: PermissionLike): string => {
  if (typeof permission === "string") return permission;
  if (permission.resource && permission.action) {
    return `${permission.resource}:${permission.action}`;
  }
  return permission.name || "";
};

export interface UsePermissionsReturn {
  // Current user data
  userRoles: string[];
  userPermissions: string[];
  effectivePermissions: string[];

  // Role checks
  hasRole: (role: SystemRole | string) => boolean;
  hasAnyRole: (roles: (SystemRole | string)[]) => boolean;
  hasAllRoles: (roles: (SystemRole | string)[]) => boolean;

  // Permission checks (SUPERADMIN always returns true)
  hasPermission: (permission: Permission | string) => boolean;
  hasAnyPermission: (permissions: (Permission | string)[]) => boolean;
  hasAllPermissions: (permissions: (Permission | string)[]) => boolean;

  // Authorization check (OR Logic like backend)
  can: (options: {
    roles?: (SystemRole | string)[];
    permissions?: (Permission | string)[];
  }) => boolean;

  // Special checks
  isSuperAdmin: boolean;
  isAdmin: boolean;
  canAccessModule: (module: string) => boolean;
}

export const usePermissions = (): UsePermissionsReturn => {
  const { user } = useAuthStore();

  // ========== EXTRACT USER ROLES ==========
  const userRoles = useMemo<string[]>(() => {
    if (!user) return [];

    if (Array.isArray(user.roles)) {
      return user.roles
        .map((r) => toRoleValue(r as RoleLike))
        .filter(Boolean);
    }

    if (user.role) {
      return [user.role.toUpperCase()];
    }

    return [];
  }, [user]);

  // ========== EXTRACT BACKEND PERMISSIONS ==========
  const userPermissions = useMemo<string[]>(() => {
    if (!user) return [];

    if (Array.isArray(user.permissions)) {
      return user.permissions
        .map((p) => toPermissionValue(p as PermissionLike))
        .filter(Boolean);
    }

    return [];
  }, [user]);

  // ========== SPECIAL ROLE FLAGS ==========
  const isSuperAdmin = useMemo(
    () => userRoles.includes(SYSTEM_ROLES.SUPERADMIN),
    [userRoles],
  );
  const isAdmin = useMemo(
    () => userRoles.includes(SYSTEM_ROLES.ADMIN),
    [userRoles],
  );

  // ========== EFFECTIVE PERMISSIONS ==========
  // PRIMARY: Use backend-resolved permissions (includes GRANTs, excludes REVOKEs)
  // FALLBACK: If empty, calculate from ROLE_PERMISSIONS_MAP (backward compat)
  const effectivePermissions = useMemo<string[]>(() => {
    // SUPERADMIN has all permissions — no need to compute
    if (isSuperAdmin) {
      return Object.values(ROLE_PERMISSIONS_MAP.SUPERADMIN);
    }

    // If backend sent permissions, use them as source of truth
    if (userPermissions.length > 0) {
      return userPermissions;
    }

    // Fallback: calculate from role map (for older sessions / backward compat)
    const permissionsSet = new Set<string>();
    userRoles.forEach((role) => {
      const rolePermissions = ROLE_PERMISSIONS_MAP[role as SystemRole] || [];
      rolePermissions.forEach((perm) => permissionsSet.add(perm));
    });
    return Array.from(permissionsSet);
  }, [userRoles, userPermissions, isSuperAdmin]);

  // ========== ROLE CHECKS ==========

  const hasRole = (role: SystemRole | string): boolean => {
    return userRoles.includes(role.toUpperCase());
  };

  const hasAnyRole = (roles: (SystemRole | string)[]): boolean => {
    return roles.some((role) => hasRole(role));
  };

  const hasAllRoles = (roles: (SystemRole | string)[]): boolean => {
    return roles.every((role) => hasRole(role));
  };

  // ========== PERMISSION CHECKS (with SUPERADMIN bypass) ==========

  const hasPermission = (permission: Permission | string): boolean => {
    if (isSuperAdmin) return true;
    return effectivePermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: (Permission | string)[]): boolean => {
    if (isSuperAdmin) return true;
    return permissions.some((perm) => effectivePermissions.includes(perm));
  };

  const hasAllPermissions = (permissions: (Permission | string)[]): boolean => {
    if (isSuperAdmin) return true;
    return permissions.every((perm) => effectivePermissions.includes(perm));
  };

  // ========== AUTHORIZATION CHECK (OR Logic) ==========

  /**
   * Authorization check with OR Logic (same as backend @Auth decorator)
   * User needs: ANY role OR ALL permissions
   * SUPERADMIN always passes.
   */
  const can = (options: {
    roles?: (SystemRole | string)[];
    permissions?: (Permission | string)[];
  }): boolean => {
    const { roles = [], permissions = [] } = options;

    // SUPERADMIN bypasses everything
    if (isSuperAdmin) return true;

    // If no restrictions, allow
    if (roles.length === 0 && permissions.length === 0) {
      return true;
    }

    // Check roles (ANY role is enough)
    if (roles.length > 0 && hasAnyRole(roles)) {
      return true;
    }

    // Check permissions (need ALL permissions)
    if (permissions.length > 0 && hasAllPermissions(permissions)) {
      return true;
    }

    return false;
  };

  // ========== MODULE ACCESS ==========

  /**
   * Check if user can access a module by checking any permission for that resource
   * Example: canAccessModule('employee') => true if user has any employee:* permission
   */
  const canAccessModule = (module: string): boolean => {
    if (isSuperAdmin) return true;
    return effectivePermissions.some((perm) => perm.startsWith(`${module}:`));
  };

  return {
    userRoles,
    userPermissions,
    effectivePermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    isSuperAdmin,
    isAdmin,
    canAccessModule,
  };
};
