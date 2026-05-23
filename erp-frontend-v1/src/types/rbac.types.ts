// RBAC Types - aligned with backend DTOs
// Permissions, Roles, Role Permissions, User Roles, Custom Permissions

export interface PermissionEntity {
  id: string;
  resource: string;
  action: string;
  permission: string;
  description: string;
  descriptionAr: string;
  createdAt: string;
  roles?: RoleSummary[]; // Roles that have this permission (optional, populated when needed)
}

export interface PermissionFilters {
  page?: number;
  limit?: number;
  resource?: string;
  search?: string;
  includeInactive?: boolean;
  includeRoles?: boolean; // Include roles that have this permission
}

export interface PaginatedPermissionsResponse {
  data: PermissionEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePermissionDto {
  resource: string;
  action: string;
  description: string;
}

export interface CreateBulkPermissionsDto {
  permissions: CreatePermissionDto[];
}

export interface UpdatePermissionDto {
  description?: string;
}

export interface ResourcesResponseDto {
  resources: string[];
  count: number;
}

export interface ResourceActionsResponseDto {
  resource: string;
  actions: string[];
  count: number;
}

// Roles
export interface RoleSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  isSystemRole: boolean;
  isActive: boolean;
  permissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoleEntity extends RoleSummary {
  permissions: PermissionEntity[];
}

export interface RoleFilters {
  page?: number;
  limit?: number;
  includeInactive?: boolean;
  includePermissions?: boolean;
  systemOnly?: boolean;
  customOnly?: boolean;
  search?: string;
}

export interface PaginatedRolesResponse {
  data: RoleSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateRoleDto {
  name: string;
  slug: string;
  description: string;
  isActive?: boolean;
  permissionIds?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

export interface AssignPermissionsDto {
  permissionIds: string[];
}

export interface RemovePermissionsDto {
  permissionIds: string[];
}

export interface ReplacePermissionsDto {
  permissionIds: string[];
}

// User Roles
export interface AssignRoleDto {
  userId: string;
  roleId: string;
  expiresAt?: string;
}

export interface RevokeRoleDto {
  userId: string;
  roleId: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role: {
    id: string;
    name: string;
    slug: string;
    description: string;
    isSystemRole: boolean;
    isActive: boolean;
    permissionCount: number;
  };
  grantedBy: string;
  grantedAt: string;
  expiresAt: string | null;
  isPermanent: boolean;
  isExpired: boolean;
  isActive: boolean;
  remainingDays: number | null;
}

export interface UserRolesResponse {
  userId: string;
  roles: UserRole[];
  totalRoles: number;
  activeRoles: number;
  expiredRoles: number;
}

// Custom Permissions
export type PermissionType = "GRANT" | "REVOKE";

export interface GrantPermissionDto {
  userId: string;
  permissionId: string;
  reason?: string;
  expiresAt?: string;
}

export interface RevokePermissionDto {
  userId: string;
  permissionId: string;
  reason?: string;
  expiresAt?: string;
}

export interface RemoveCustomPermissionDto {
  customPermissionId: string;
  // Optional helper for frontend cache invalidation (not sent to backend)
  userId?: string;
}

export interface UserCustomPermission {
  id: string;
  userId: string;
  permissionId: string;
  permission: {
    id: string;
    resource: string;
    action: string;
    permission: string;
    description: string;
    descriptionAr: string;
  };
  permissionType: PermissionType;
  grantedBy: string;
  grantedAt: string;
  expiresAt: string | null;
  isPermanent: boolean;
  isExpired: boolean;
  isActive: boolean;
  remainingDays: number | null;
}

export interface UserCustomPermissionsResponse {
  userId: string;
  customPermissions: UserCustomPermission[];
  totalCustomPermissions: number;
  grantedCount: number;
  revokedCount: number;
}

export interface ResolvedPermissionsResponse {
  userId: string;
  permissions: string[];
  rolePermissions: string[];
  grantedPermissions: string[];
  revokedPermissions: string[];
  roles: string[];
  totalPermissions: number;
  rolePermissionsCount: number;
  grantedPermissionsCount: number;
  revokedPermissionsCount: number;
  isSuperAdmin: boolean;
}

export interface MessageResponseDto {
  message: string;
}
