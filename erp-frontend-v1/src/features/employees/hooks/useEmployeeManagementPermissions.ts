import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";
import { usePermissions } from "@/hooks/usePermissions";

/**
 * Centralized employee-management RBAC rules for frontend visibility/UX guards.
 */
export const useEmployeeManagementPermissions = () => {
  const { hasPermission, hasRole } = usePermissions();

  const canReadEmployees = hasPermission(PERMISSIONS.EMPLOYEE_READ);
  const canWriteEmployees = hasPermission(PERMISSIONS.EMPLOYEE_WRITE);
  const canDeleteEmployees = hasPermission(PERMISSIONS.EMPLOYEE_DELETE);
  const isSuperAdmin = hasRole(SYSTEM_ROLES.SUPERADMIN);
  const isAdmin = hasRole(SYSTEM_ROLES.ADMIN);
  const isHrManager = hasRole(SYSTEM_ROLES.HR_MANAGER);
  const canManageSalary = isSuperAdmin || isAdmin || isHrManager;

  return {
    canReadEmployees,
    canWriteEmployees,
    canDeleteEmployees,
    isSuperAdmin,
    isAdmin,
    canEditEmployee: canWriteEmployees,
    canManageEmployeePhoto: canWriteEmployees,
    canUseQuickEmployeeActions: canWriteEmployees,
    canRehireEmployee: canWriteEmployees,
    canSoftDeleteEmployee: canDeleteEmployees,
    canManageSalary,
  };
};
