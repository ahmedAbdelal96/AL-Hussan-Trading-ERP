/**
 * RBAC Permissions & Roles Constants
 *
 * IMPORTANT: Keep synchronized with backend permissions.constants.ts
 *
 * ⭐ BEST PRACTICE - ALWAYS BE EXPLICIT:
 * When using permissions in Sidebar or ProtectedRoute, ALWAYS specify both roles AND permissions:
 *
 * ✅ RECOMMENDED:
 * roles: [SYSTEM_ROLES.HR_MANAGER, SYSTEM_ROLES.HR_STAFF],
 * permissions: [PERMISSIONS.EMPLOYEE_READ],
 *
 * ❌ AVOID (Implicit):
 *
 * - Self-documenting code (clear who can access)
 * - No need to check ROLE_PERMISSIONS_MAP
 * - Easier maintenance and debugging
 * - Faster execution (no implicit calculation)
 */

// ============================================================================
// SYSTEM ROLES
// ============================================================================
export const SYSTEM_ROLES = {
  SUPERADMIN: "SUPERADMIN",
  IT_ADMIN: "IT_ADMIN",
  ADMIN: "ADMIN",
  HR_MANAGER: "HR_MANAGER",
  HR_STAFF: "HR_STAFF",
  FIN_MANAGER: "FIN_MANAGER",
  FIN_STAFF: "FIN_STAFF",
  OPS_MANAGER: "OPS_MANAGER",
  OPS_STAFF: "OPS_STAFF",
  USER: "USER",
} as const;

export type SystemRole = keyof typeof SYSTEM_ROLES;

// ============================================================================
// SYSTEM PERMISSIONS — synced with backend permissions.constants.ts
// ============================================================================
export const PERMISSIONS = {
  // Employee Module (3)
  EMPLOYEE_READ: "employee:read",
  EMPLOYEE_WRITE: "employee:write",
  EMPLOYEE_DELETE: "employee:delete",

  // Department Module (3)
  DEPARTMENT_READ: "department:read",
  DEPARTMENT_WRITE: "department:write",
  DEPARTMENT_DELETE: "department:delete",

  // Position Module (3)
  POSITION_READ: "position:read",
  POSITION_WRITE: "position:write",
  POSITION_DELETE: "position:delete",

  // Site Module (3)
  SITE_READ: "site:read",
  SITE_WRITE: "site:write",
  SITE_DELETE: "site:delete",

  // Project Module (3)
  PROJECT_READ: "project:read",
  PROJECT_WRITE: "project:write",
  PROJECT_DELETE: "project:delete",

  // Asset Module (3)
  ASSET_READ: "asset:read",
  ASSET_WRITE: "asset:write",
  ASSET_DELETE: "asset:delete",

  // Maintenance Module (3)
  MAINTENANCE_READ: "maintenance:read",
  MAINTENANCE_WRITE: "maintenance:write",
  MAINTENANCE_DELETE: "maintenance:delete",

  // User Module (5)
  USER_READ: "user:read",
  USER_WRITE: "user:write",
  USER_DELETE: "user:delete",
  USER_CHANGE_ROLE: "user:change_role",
  USER_RESET_PASSWORD: "user:reset_password",

  // Finance Module (5)
  FINANCE_READ: "finance:read",
  FINANCE_WRITE: "finance:write",
  FINANCE_DELETE: "finance:delete",
  FINANCE_APPROVE: "finance:approve",
  FINANCE_EXPORT: "finance:export",

  // Payroll Module (4)
  PAYROLL_READ: "payroll:read",
  PAYROLL_WRITE: "payroll:write",
  PAYROLL_PROCESS: "payroll:process",
  PAYROLL_APPROVE: "payroll:approve",

  // RBAC Module (2)
  RBAC_READ: "rbac:read",
  RBAC_WRITE: "rbac:write",

  // Report Module — base (2)
  // NOTE: key kept as REPORT_READ for backward compat, value is "report:view" (matches backend)
  REPORT_READ: "report:view",
  REPORT_EXPORT: "report:export",
  // Module-specific report permissions (must match backend exactly)
  REPORT_FINANCE_VIEW: "report:finance",
  REPORT_FINANCE_EXPORT: "report:finance:export",
  REPORT_PAYROLL_VIEW: "report:payroll",
  REPORT_PAYROLL_EXPORT: "report:payroll:export",
  REPORT_PROJECTS_VIEW: "report:projects",
  REPORT_EMPLOYEES_VIEW: "report:employees",
  REPORT_ASSETS_VIEW: "report:assets",
  REPORT_MAINTENANCE_VIEW: "report:maintenance",
  REPORT_SITES_VIEW: "report:sites",
  REPORT_USERS_VIEW: "report:users",
  REPORT_SYSTEM_VIEW: "report:system", // SUPERADMIN only

  // Settings Module (2)
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",

  // Dashboard Module (1)
  DASHBOARD_READ: "dashboard:read",

  // Audit Module (2)
  AUDIT_READ: "audit:read",
  AUDIT_EXPORT: "audit:export",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ============================================================================
// ROLE-PERMISSION MAPPING — mirrors backend ROLE_PERMISSIONS_MAP (seeder source)
// ⚠️  FOR DISPLAY / REFERENCE ONLY — do NOT use for permission computation.
//     Actual runtime permissions come from GET /auth/me (already resolved by backend).
// ============================================================================
export const ROLE_PERMISSIONS_MAP: Record<SystemRole, Permission[]> = {
  // SUPERADMIN — all permissions (bypasses checks in backend anyway)
  SUPERADMIN: Object.values(PERMISSIONS) as Permission[],
  IT_ADMIN: Object.values(PERMISSIONS) as Permission[],

  // ADMIN — most permissions except rbac:write
  ADMIN: [
    PERMISSIONS.EMPLOYEE_READ,
    PERMISSIONS.EMPLOYEE_WRITE,
    PERMISSIONS.EMPLOYEE_DELETE,
    PERMISSIONS.DEPARTMENT_READ,
    PERMISSIONS.DEPARTMENT_WRITE,
    PERMISSIONS.DEPARTMENT_DELETE,
    PERMISSIONS.POSITION_READ,
    PERMISSIONS.POSITION_WRITE,
    PERMISSIONS.POSITION_DELETE,
    PERMISSIONS.SITE_READ,
    PERMISSIONS.SITE_WRITE,
    PERMISSIONS.SITE_DELETE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_WRITE,
    PERMISSIONS.PROJECT_DELETE,
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.ASSET_WRITE,
    PERMISSIONS.ASSET_DELETE,
    PERMISSIONS.PAYROLL_READ,
    PERMISSIONS.PAYROLL_WRITE,
    PERMISSIONS.PAYROLL_PROCESS,
    PERMISSIONS.PAYROLL_APPROVE,
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.FINANCE_WRITE,
    PERMISSIONS.FINANCE_DELETE,
    PERMISSIONS.FINANCE_APPROVE,
    PERMISSIONS.FINANCE_EXPORT,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_CHANGE_ROLE,
    PERMISSIONS.USER_RESET_PASSWORD,
    PERMISSIONS.RBAC_READ,
    // RBAC_WRITE excluded — SUPERADMIN only
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.REPORT_FINANCE_VIEW,
    PERMISSIONS.REPORT_PROJECTS_VIEW,
    PERMISSIONS.REPORT_EMPLOYEES_VIEW,
    PERMISSIONS.REPORT_PAYROLL_VIEW,
    PERMISSIONS.REPORT_ASSETS_VIEW,
    PERMISSIONS.REPORT_MAINTENANCE_VIEW,
    PERMISSIONS.REPORT_SITES_VIEW,
    PERMISSIONS.REPORT_USERS_VIEW,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.AUDIT_EXPORT,
  ],

  // HR_MANAGER — HR and employee management
  HR_MANAGER: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.EMPLOYEE_READ,
    PERMISSIONS.EMPLOYEE_WRITE,
    PERMISSIONS.EMPLOYEE_DELETE,
    PERMISSIONS.DEPARTMENT_READ,
    PERMISSIONS.DEPARTMENT_WRITE,
    PERMISSIONS.POSITION_READ,
    PERMISSIONS.POSITION_WRITE,
    PERMISSIONS.PAYROLL_READ,
    PERMISSIONS.PAYROLL_WRITE,
    PERMISSIONS.PAYROLL_PROCESS,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EMPLOYEES_VIEW,
    PERMISSIONS.REPORT_PAYROLL_VIEW,
    PERMISSIONS.DASHBOARD_READ,
  ],

  // HR_STAFF — basic HR operations
  HR_STAFF: [
    PERMISSIONS.EMPLOYEE_READ,
    PERMISSIONS.EMPLOYEE_WRITE,
    PERMISSIONS.DEPARTMENT_READ,
    PERMISSIONS.POSITION_READ,
    PERMISSIONS.PAYROLL_READ,
    PERMISSIONS.PAYROLL_WRITE,
  ],

  // FIN_MANAGER — financial management
  FIN_MANAGER: [
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.FINANCE_WRITE,
    PERMISSIONS.FINANCE_APPROVE,
    PERMISSIONS.FINANCE_EXPORT,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PAYROLL_READ,
    PERMISSIONS.PAYROLL_APPROVE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.REPORT_FINANCE_VIEW,
    PERMISSIONS.REPORT_PAYROLL_VIEW,
    PERMISSIONS.DASHBOARD_READ,
  ],

  // FIN_STAFF — basic finance operations
  FIN_STAFF: [
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.FINANCE_WRITE,
    PERMISSIONS.PROJECT_READ,
  ],

  // OPS_MANAGER — operations management
  OPS_MANAGER: [
    PERMISSIONS.SITE_READ,
    PERMISSIONS.SITE_WRITE,
    PERMISSIONS.SITE_DELETE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_WRITE,
    PERMISSIONS.PROJECT_DELETE,
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.ASSET_WRITE,
    PERMISSIONS.ASSET_DELETE,
    PERMISSIONS.MAINTENANCE_READ,
    PERMISSIONS.MAINTENANCE_WRITE,
    PERMISSIONS.MAINTENANCE_DELETE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_PROJECTS_VIEW,
    PERMISSIONS.REPORT_ASSETS_VIEW,
    PERMISSIONS.REPORT_MAINTENANCE_VIEW,
    PERMISSIONS.REPORT_SITES_VIEW,
    PERMISSIONS.DASHBOARD_READ,
  ],

  // OPS_STAFF — basic operations
  OPS_STAFF: [
    PERMISSIONS.SITE_READ,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_WRITE,
    PERMISSIONS.EMPLOYEE_READ,
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.ASSET_WRITE,
    PERMISSIONS.MAINTENANCE_READ,
    PERMISSIONS.MAINTENANCE_WRITE,
    PERMISSIONS.DASHBOARD_READ,
  ],

  // USER — minimal
  USER: [],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get permissions for a specific role
 */
export const getPermissionsForRole = (role: SystemRole): Permission[] => {
  return ROLE_PERMISSIONS_MAP[role] || [];
};

/**
 * Get permissions for multiple roles
 */
export const getPermissionsForRoles = (roles: SystemRole[]): Permission[] => {
  const permissionsSet = new Set<Permission>();

  roles.forEach((role) => {
    const rolePermissions = getPermissionsForRole(role);
    rolePermissions.forEach((permission) => permissionsSet.add(permission));
  });

  return Array.from(permissionsSet);
};

/**
 * Check if role has specific permission
 */
export const roleHasPermission = (
  role: SystemRole,
  permission: Permission,
): boolean => {
  const rolePermissions = getPermissionsForRole(role);
  return rolePermissions.includes(permission);
};

/**
 * Check if any of the roles has specific permission
 */
export const anyRoleHasPermission = (
  roles: SystemRole[],
  permission: Permission,
): boolean => {
  return roles.some((role) => roleHasPermission(role, permission));
};

// ============================================================================
// RESOURCE HELPERS
// ============================================================================

/**
 * Extract resource from permission string
 * Example: "employee:read" => "employee"
 */
export const getResourceFromPermission = (permission: Permission): string => {
  return permission.split(":")[0];
};

/**
 * Extract action from permission string
 * Example: "employee:read" => "read"
 */
export const getActionFromPermission = (permission: Permission): string => {
  return permission.split(":")[1];
};

/**
 * Build permission string from resource and action
 */
export const buildPermission = (resource: string, action: string): string => {
  return `${resource}:${action}`;
};

/**
 * Get all permissions for a resource
 */
export const getResourcePermissions = (resource: string): Permission[] => {
  return Object.values(PERMISSIONS).filter((permission) =>
    permission.startsWith(`${resource}:`),
  );
};
