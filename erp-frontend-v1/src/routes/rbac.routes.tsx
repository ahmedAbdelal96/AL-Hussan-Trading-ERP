/**
 * RBAC Module Routes
 *
 * Security: EXPLICIT roles + permissions (Best Practice)
 * - Roles: SUPERADMIN, IT_ADMIN (critical system operations)
 * - Permissions: rbac:read, rbac:write
 */

import { lazy, Suspense } from "react";
import { RouteObject } from "react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { SYSTEM_ROLES } from "@/config/permissions.constants";

const UserAccessPage = lazy(() => import("@/pages/rbac/UserAccessPage"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

export const rbacRoutes: RouteObject[] = [
  {
    path: "rbac",
    element: (
      <ProtectedRoute roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.IT_ADMIN]}>
        <Suspense fallback={<PageLoader />}>
          <UserAccessPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
];
