import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";
import { usePermissions } from "@/hooks/usePermissions";

/**
 * Centralized user-management RBAC rules for frontend visibility/UX guards.
 * Keep these checks aligned with backend @Auth constraints.
 */
export const useUserManagementPermissions = () => {
  const { hasPermission, hasAnyRole } = usePermissions();

  const canReadUsers = hasPermission(PERMISSIONS.USER_READ);
  const canWriteUsers = hasPermission(PERMISSIONS.USER_WRITE);
  const canResetUserPassword = hasPermission(PERMISSIONS.USER_RESET_PASSWORD);
  const canDeleteUsers = hasPermission(PERMISSIONS.USER_DELETE);
  const hasCriticalSystemRole = hasAnyRole([
    SYSTEM_ROLES.SUPERADMIN,
    SYSTEM_ROLES.IT_ADMIN,
  ]);

  return {
    canReadUsers,
    canWriteUsers,
    canResetUserPassword,
    canDeleteUsers,
    canManageUserPhoto: canWriteUsers,
    canChangeUserStatus: canWriteUsers,
    // Critical operations are role-gated in backend (SUPERADMIN / IT_ADMIN).
    canSoftDeleteUser: hasCriticalSystemRole && canDeleteUsers,
    canRestoreDeletedUser: hasCriticalSystemRole && canWriteUsers,
    canPermanentlyDeleteUser: hasCriticalSystemRole && canDeleteUsers,
    canCreateUsers: hasCriticalSystemRole && canWriteUsers,
    canAccessDeletedUsers: hasCriticalSystemRole && canReadUsers,
    canUseCriticalUserOps: hasCriticalSystemRole,
  };
};
