/**
 * Auth Module Routes
 * Authentication and profile related routes
 *
 * Security: EXPLICIT roles + permissions (Best Practice)
 * - Roles: SUPERADMIN, ADMIN (for admin routes)
 * - Permissions: user:write (for admin management routes)
 *
 * Route Categories:
 * - Public Routes: /signin, /login (no protection)
 * - Protected Routes: /profile/change-password (authenticated users)
 * - Admin Routes: /admin/* (SUPERADMIN only)
 */

import { lazy, Suspense } from "react";
import { RouteObject } from "react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { SYSTEM_ROLES, PERMISSIONS } from "@/config/permissions.constants";

// Lazy load auth pages
const SignIn = lazy(() => import("@/pages/AuthPages/SignIn"));
const UserProfilePage = lazy(() => import("@/pages/AuthPages/UserProfilePage"));
const UnlockUserPage = lazy(() => import("@/pages/AuthPages/UnlockUserPage"));
const SystemAdminDashboard = lazy(
  () => import("@/pages/AuthPages/SystemAdminDashboard"),
);
const AdminForceLogoutPage = lazy(
  () => import("@/pages/AuthPages/AdminForceLogoutPage"),
);
const AdminUserSessionsPage = lazy(
  () => import("@/pages/AuthPages/AdminUserSessionsPage"),
);
const AuditLogsPage = lazy(() => import("@/pages/AuthPages/AuditLogsPage"));

const pageLoader = (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

/**
 * Public Auth Routes (Sign In, Sign Up, etc.)
 */
export const publicAuthRoutes: RouteObject[] = [
  {
    path: "/signin",
    element: (
      <Suspense fallback={pageLoader}>
        <SignIn />
      </Suspense>
    ),
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={pageLoader}>
        <SignIn />
      </Suspense>
    ),
  },
];

/**
 * Protected Auth Routes (Profile, Change Password, etc.)
 * These need to be nested inside ProtectedRoute in main routes
 */
export const protectedAuthRoutes: RouteObject[] = [
  {
    path: "/profile",
    element: (
      <Suspense fallback={pageLoader}>
        <UserProfilePage />
      </Suspense>
    ),
  },
];

/**
 * Admin Routes (SUPERADMIN & ADMIN only)
 * Role-based protected routes
 */
export const adminAuthRoutes: RouteObject[] = [
  {
    path: "/admin/dashboard",
    element: (
      <ProtectedRoute
        roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.ADMIN]}
        permissions={[PERMISSIONS.USER_READ]}
      >
        <Suspense fallback={pageLoader}>
          <SystemAdminDashboard />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/audit-logs",
    element: (
      <ProtectedRoute
        roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.ADMIN]}
      >
        <Suspense fallback={pageLoader}>
          <AuditLogsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
];
