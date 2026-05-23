/**
 * RBAC React Hooks - Aligned with Backend Architecture
 *
 * 🔒 READ-ONLY System:
 * - Roles and permissions are defined in code (permissions.constants.ts)
 * - Seeded via database migrations at system initialization
 * - Cannot be created/updated/deleted at runtime
 *
 * ✅ ACTIVE Operations:
 * - GET operations for roles and permissions (read-only)
 * - User role assignments (assign/revoke roles to users)
 * - User custom permissions (grant/revoke permissions to users)
 *
 * ❌ REMOVED Operations:
 * - Role CRUD (create/update/delete roles)
 * - Permission CRUD (create/update/delete permissions)
 * - Assign/Remove permissions to/from roles (managed in code via ROLE_PERMISSIONS_MAP)
 *
 * Roles and permissions must be defined in code to be usable in @Auth() decorators.
 * Runtime changes won't affect authorization logic, causing security inconsistencies.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/lib/toast";
import { useTranslation } from "@/i18n/useTranslation";
import { rbacApi } from "@/services/api/rbac.api";
import type {
  PermissionFilters,
  RoleFilters,
  AssignRoleDto,
  RevokeRoleDto,
  GrantPermissionDto,
  RevokePermissionDto,
  RemoveCustomPermissionDto,
} from "@/types/rbac.types";

const getApiErrorMessage = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object") return undefined;

  const candidate = error as {
    response?: { data?: { message?: unknown } };
    message?: unknown;
  };

  const backendMessage = candidate.response?.data?.message;
  if (typeof backendMessage === "string" && backendMessage.trim().length > 0) {
    return backendMessage;
  }

  if (typeof candidate.message === "string" && candidate.message.trim().length > 0) {
    return candidate.message;
  }

  return undefined;
};

// Query Keys
export const RBAC_KEYS = {
  all: ["rbac"] as const,
  permissions: () => [...RBAC_KEYS.all, "permissions"] as const,
  permission: (id: string) => [...RBAC_KEYS.permissions(), id] as const,
  resources: () => [...RBAC_KEYS.all, "resources"] as const,
  resourceActions: (resource: string) =>
    [...RBAC_KEYS.all, "resource-actions", resource] as const,
  roles: () => [...RBAC_KEYS.all, "roles"] as const,
  role: (id: string) => [...RBAC_KEYS.roles(), id] as const,
  userRoles: (userId: string) =>
    [...RBAC_KEYS.all, "user-roles", userId] as const,
  userCustomPermissions: (userId: string) =>
    [...RBAC_KEYS.all, "user-custom-permissions", userId] as const,
  userEffectivePermissions: (userId: string) =>
    [...RBAC_KEYS.all, "user-effective-permissions", userId] as const,
};

// Permissions - READ ONLY
export const usePermissions = (filters: PermissionFilters = {}) =>
  useQuery({
    queryKey: [...RBAC_KEYS.permissions(), filters],
    queryFn: () => rbacApi.getPermissions(filters),
    staleTime: 30_000,
  });

export const usePermission = (id?: string) =>
  useQuery({
    queryKey: RBAC_KEYS.permission(id || ""),
    queryFn: () => rbacApi.getPermission(id!),
    enabled: !!id,
  });

export const useResources = () =>
  useQuery({
    queryKey: RBAC_KEYS.resources(),
    queryFn: () => rbacApi.getResources(),
  });

export const useResourceActions = (resource?: string) =>
  useQuery({
    queryKey: resource
      ? RBAC_KEYS.resourceActions(resource)
      : RBAC_KEYS.resourceActions(""),
    queryFn: () => rbacApi.getResourceActions(resource!),
    enabled: !!resource,
  });

// Roles - READ ONLY
export const useRoles = (filters: RoleFilters = {}) =>
  useQuery({
    queryKey: [...RBAC_KEYS.roles(), filters],
    queryFn: () => rbacApi.getRoles(filters),
    staleTime: 30_000,
  });

export const useRole = (id?: string) =>
  useQuery({
    queryKey: RBAC_KEYS.role(id || ""),
    queryFn: () => rbacApi.getRole(id!),
    enabled: !!id,
  });

// User Roles
export const useUserRoles = (userId?: string, includeExpired?: boolean) =>
  useQuery({
    queryKey: userId
      ? [...RBAC_KEYS.userRoles(userId), includeExpired]
      : RBAC_KEYS.userRoles(""),
    queryFn: () => rbacApi.getUserRoles(userId!, includeExpired),
    enabled: !!userId,
  });

export const useAssignRoleToUser = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: AssignRoleDto) => rbacApi.assignRoleToUser(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: RBAC_KEYS.userRoles(variables.userId),
      });
      showToast.success(
        t("rbac.userRoles.assign.success", {
          defaultValue: "Role assigned to user",
        }),
      );
    },
    onError: (error: unknown) => {
      showToast.error(
        getApiErrorMessage(error) ||
          String(t("rbac.userRoles.assign.error", {
            defaultValue: "Failed to assign role",
          })),
      );
    },
  });
};

export const useRevokeRoleFromUser = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: RevokeRoleDto) => rbacApi.revokeRoleFromUser(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: RBAC_KEYS.userRoles(variables.userId),
      });
      showToast.success(
        t("rbac.userRoles.revoke.success", {
          defaultValue: "Role revoked from user",
        }),
      );
    },
    onError: (error: unknown) => {
      showToast.error(
        getApiErrorMessage(error) ||
          String(t("rbac.userRoles.revoke.error", {
            defaultValue: "Failed to revoke role",
          })),
      );
    },
  });
};

// User Custom Permissions
export const useGrantPermissionToUser = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: GrantPermissionDto) =>
      rbacApi.grantPermissionToUser(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: RBAC_KEYS.userCustomPermissions(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: RBAC_KEYS.userEffectivePermissions(variables.userId),
      });
      showToast.success(
        t("rbac.customPermissions.grant.success", {
          defaultValue: "Permission granted",
        }),
      );
    },
    onError: (error: unknown) => {
      showToast.error(
        getApiErrorMessage(error) ||
          String(t("rbac.customPermissions.grant.error", {
            defaultValue: "Failed to grant permission",
          })),
      );
    },
  });
};

export const useRevokePermissionFromUser = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: RevokePermissionDto) =>
      rbacApi.revokePermissionFromUser(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: RBAC_KEYS.userCustomPermissions(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: RBAC_KEYS.userEffectivePermissions(variables.userId),
      });
      showToast.success(
        t("rbac.customPermissions.revoke.success", {
          defaultValue: "Permission revoked",
        }),
      );
    },
    onError: (error: unknown) => {
      showToast.error(
        getApiErrorMessage(error) ||
          String(t("rbac.customPermissions.revoke.error", {
            defaultValue: "Failed to revoke permission",
          })),
      );
    },
  });
};

export const useRemoveCustomPermission = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: RemoveCustomPermissionDto) =>
      rbacApi.removeCustomPermission(payload),
    onSuccess: (_data, variables) => {
      if (variables.userId) {
        queryClient.invalidateQueries({
          queryKey: RBAC_KEYS.userCustomPermissions(variables.userId),
        });
        queryClient.invalidateQueries({
          queryKey: RBAC_KEYS.userEffectivePermissions(variables.userId),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: RBAC_KEYS.userCustomPermissions(""),
        });
      }
      showToast.success(
        t("rbac.customPermissions.remove.success", {
          defaultValue: "Custom permission removed",
        }),
      );
    },
    onError: (error: unknown) => {
      showToast.error(
        getApiErrorMessage(error) ||
          String(t("rbac.customPermissions.remove.error", {
            defaultValue: "Failed to remove permission",
          })),
      );
    },
  });
};

export const useUserCustomPermissions = (
  userId?: string,
  includeExpired?: boolean,
) =>
  useQuery({
    queryKey: userId
      ? [...RBAC_KEYS.userCustomPermissions(userId), includeExpired]
      : RBAC_KEYS.userCustomPermissions(""),
    queryFn: () => rbacApi.getUserCustomPermissions(userId!, includeExpired),
    enabled: !!userId,
  });

export const useUserEffectivePermissions = (userId?: string) =>
  useQuery({
    queryKey: userId
      ? RBAC_KEYS.userEffectivePermissions(userId)
      : RBAC_KEYS.userEffectivePermissions(""),
    queryFn: () => rbacApi.getUserEffectivePermissions(userId!),
    enabled: !!userId,
  });
