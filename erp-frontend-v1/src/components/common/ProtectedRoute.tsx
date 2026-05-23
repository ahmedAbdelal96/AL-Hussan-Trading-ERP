import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { LoadingSpinner } from "./LoadingSpinner";
import type { SystemRole, Permission } from "@/config/permissions.constants";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  // Support both old and new props for backward compatibility
  requiredRole?: string | SystemRole;
  requiredPermission?: string | Permission;
  // New props (OR Logic like backend)
  roles?: (SystemRole | string)[];
  permissions?: (Permission | string)[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  roles = [],
  permissions = [],
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { can } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-app">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" replace />;
  }

  // Backward compatibility: Convert old props to new format
  const effectiveRoles = [...roles, ...(requiredRole ? [requiredRole] : [])];
  const effectivePermissions = [
    ...permissions,
    ...(requiredPermission ? [requiredPermission] : []),
  ];

  // Check authorization (OR Logic: ANY role OR ALL permissions)
  const isAuthorized = can({
    roles: effectiveRoles.length > 0 ? effectiveRoles : undefined,
    permissions:
      effectivePermissions.length > 0 ? effectivePermissions : undefined,
  });

  if (!isAuthorized) {
    // Store context so ForbiddenPage can display it
    sessionStorage.setItem(
      "forbidden_message",
      `Access denied on route: ${location.pathname}`,
    );
    return <Navigate to="/403" replace />;
  }

  return children ?? <Outlet />;
};

export default ProtectedRoute;
