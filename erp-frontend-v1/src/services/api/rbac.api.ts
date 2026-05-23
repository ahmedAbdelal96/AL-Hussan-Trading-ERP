/**
 * RBAC API Service - Aligned with Backend Architecture
 *
 * 🔒 READ-ONLY System:
 * - Roles and permissions are defined in code (permissions.constants.ts)
 * - Seeded via database migrations at system initialization
 * - Cannot be created/updated/deleted at runtime
 *
 * ✅ ACTIVE Endpoints:
 * - GET /permissions, GET /permissions/:id (read-only)
 * - GET /permissions/resources, GET /permissions/resources/:resource/actions
 * - GET /roles, GET /roles/:id (read-only)
 * - POST /users/roles, DELETE /users/roles (user role assignments)
 * - POST /users/custom-permissions/grant, POST /users/custom-permissions/revoke
 * - DELETE /users/custom-permissions/:id (remove custom permission entry)
 * - GET /users/:userId/roles, GET /users/:userId/custom-permissions
 * - GET /users/:userId/effective-permissions
 *
 * ❌ REMOVED Endpoints (disabled in backend):
 * - POST/PATCH/DELETE /permissions (permission CRUD)
 * - POST/PATCH/DELETE /roles (role CRUD)
 * - POST/DELETE/PUT /roles/:id/permissions (role permission assignments)
 *
 * Roles and permissions must be defined in code to be usable in @Auth() decorators.
 * Runtime changes won't affect authorization logic, causing security inconsistencies.
 */

import { apiClient } from "./axiosConfig";
import type {
  PermissionEntity,
  PaginatedPermissionsResponse,
  PermissionFilters,
  ResourcesResponseDto,
  ResourceActionsResponseDto,
  RoleEntity,
  PaginatedRolesResponse,
  RoleFilters,
  AssignRoleDto,
  RevokeRoleDto,
  UserRolesResponse,
  GrantPermissionDto,
  RevokePermissionDto,
  RemoveCustomPermissionDto,
  UserCustomPermissionsResponse,
  ResolvedPermissionsResponse,
  MessageResponseDto,
} from "@/types/rbac.types";

const BASE_URL = "/rbac";

export const rbacApi = {
  // ========================================
  // PERMISSIONS (READ-ONLY)
  // ========================================

  /**
   * ✅ ACTIVE - Get all permissions with filters
   */
  getPermissions: async (
    filters: PermissionFilters = {},
  ): Promise<PaginatedPermissionsResponse> => {
    const { data } = await apiClient.get<PaginatedPermissionsResponse>(
      `${BASE_URL}/permissions`,
      {
        params: filters,
      },
    );
    return data;
  },

  /**
   * ✅ ACTIVE - Get single permission by ID
   */
  getPermission: async (id: string): Promise<PermissionEntity> => {
    const { data } = await apiClient.get<PermissionEntity>(
      `${BASE_URL}/permissions/${id}`,
    );
    return data;
  },

  /**
   * ✅ ACTIVE - Get all available resources
   */
  getResources: async (): Promise<ResourcesResponseDto> => {
    const { data } = await apiClient.get<ResourcesResponseDto>(
      `${BASE_URL}/permissions/resources`,
    );
    return data;
  },

  /**
   * ✅ ACTIVE - Get actions for a specific resource
   */
  getResourceActions: async (
    resource: string,
  ): Promise<ResourceActionsResponseDto> => {
    const { data } = await apiClient.get<ResourceActionsResponseDto>(
      `${BASE_URL}/permissions/resources/${resource}/actions`,
    );
    return data;
  },

  // ========================================
  // ROLES (READ-ONLY)
  // ========================================

  /**
   * ✅ ACTIVE - Get all roles with filters
   */
  getRoles: async (
    filters: RoleFilters = {},
  ): Promise<PaginatedRolesResponse> => {
    const { data } = await apiClient.get<PaginatedRolesResponse>(
      `${BASE_URL}/roles`,
      {
        params: filters,
      },
    );
    return data;
  },

  /**
   * ✅ ACTIVE - Get single role by ID
   */
  getRole: async (id: string): Promise<RoleEntity> => {
    const { data } = await apiClient.get<RoleEntity>(`${BASE_URL}/roles/${id}`);
    return data;
  },

  // ========================================
  // USER ACCESS MANAGEMENT (ACTIVE)
  // ========================================

  /**
   * ✅ ACTIVE - Assign a role to a user
   */
  assignRoleToUser: async (
    payload: AssignRoleDto,
  ): Promise<MessageResponseDto> => {
    const { data } = await apiClient.post<MessageResponseDto>(
      `${BASE_URL}/users/roles`,
      payload,
    );
    return data;
  },

  /**
   * ✅ ACTIVE - Revoke a role from a user
   */
  revokeRoleFromUser: async (
    payload: RevokeRoleDto,
  ): Promise<MessageResponseDto> => {
    const { data } = await apiClient.delete<MessageResponseDto>(
      `${BASE_URL}/users/roles`,
      {
        data: payload,
      },
    );
    return data;
  },

  /**
   * ✅ ACTIVE - Get all roles assigned to a user
   */
  getUserRoles: async (
    userId: string,
    includeExpired?: boolean,
  ): Promise<UserRolesResponse> => {
    const { data } = await apiClient.get<UserRolesResponse>(
      `${BASE_URL}/users/${userId}/roles`,
      {
        params: { includeExpired },
      },
    );
    return data;
  },

  /**
   * ✅ ACTIVE - Grant a custom permission to a user
   */
  grantPermissionToUser: async (
    payload: GrantPermissionDto,
  ): Promise<MessageResponseDto> => {
    const { data } = await apiClient.post<MessageResponseDto>(
      `${BASE_URL}/users/custom-permissions/grant`,
      payload,
    );
    return data;
  },

  /**
   * ✅ ACTIVE - Revoke a custom permission from a user
   */
  revokePermissionFromUser: async (
    payload: RevokePermissionDto,
  ): Promise<MessageResponseDto> => {
    const { data } = await apiClient.post<MessageResponseDto>(
      `${BASE_URL}/users/custom-permissions/revoke`,
      payload,
    );
    return data;
  },

  /**
   * ✅ ACTIVE - Remove a custom permission entry
   */
  removeCustomPermission: async (
    payload: RemoveCustomPermissionDto,
  ): Promise<MessageResponseDto> => {
    const { data } = await apiClient.delete<MessageResponseDto>(
      `${BASE_URL}/users/custom-permissions/${payload.customPermissionId}`,
    );
    return data;
  },

  /**
   * ✅ ACTIVE - Get all custom permissions for a user
   */
  getUserCustomPermissions: async (
    userId: string,
    includeExpired?: boolean,
  ): Promise<UserCustomPermissionsResponse> => {
    const { data } = await apiClient.get<UserCustomPermissionsResponse>(
      `${BASE_URL}/users/${userId}/custom-permissions`,
      { params: { includeExpired } },
    );
    return data;
  },

  /**
   * ✅ ACTIVE - Get effective permissions for a user (roles + custom)
   */
  getUserEffectivePermissions: async (
    userId: string,
  ): Promise<ResolvedPermissionsResponse> => {
    const { data } = await apiClient.get<ResolvedPermissionsResponse>(
      `${BASE_URL}/users/${userId}/effective-permissions`,
    );
    return data;
  },
};
