/**
 * Central Route Configuration
 */

import { lazy, Suspense } from "react";
import { RouteObject } from "react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import {
  publicAuthRoutes,
  protectedAuthRoutes,
  adminAuthRoutes,
} from "./auth.routes";
import { rbacRoutes } from "./rbac.routes";
import { usersRoutes } from "./users.routes";
import { employeesRoutes } from "./employees.routes";
import { sitesRoutes } from "./sites.routes";
import { projectsRoutes } from "./projects.routes";
import { payrollRoutes } from "./payroll.routes";
import { assetsRoutes } from "./assets.routes";
import { maintenanceRoutes } from "./maintenance.routes";
import { financeRoutes } from "./finance.routes";
import { reportsRoutes } from "./reports.routes";

// Lazy load main pages
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const ForbiddenPage = lazy(() => import("@/pages/errors/ForbiddenPage"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

/**
 * All Application Routes
 */
export const appRoutes: RouteObject[] = [
  // Protected routes with Hierarchical structure
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        path: "/",
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: "/dashboard",
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      // Profile & Settings Routes
      ...protectedAuthRoutes,
      // Admin Routes (SUPERADMIN only)
      ...adminAuthRoutes,
      // RBAC module routes
      ...rbacRoutes,
      // Users module routes
      ...usersRoutes,
      // Employees module routes
      ...employeesRoutes,
      // Sites module routes
      ...sitesRoutes,
      // Projects module routes
      ...projectsRoutes,
      // Payroll module routes
      ...payrollRoutes,
      // Assets module routes
      ...assetsRoutes,
      // Maintenance module routes
      ...maintenanceRoutes,
      // Finance module routes
      ...financeRoutes,
      // Reports module routes
      ...reportsRoutes,
      // Add your new module routes here

      // 403 Forbidden page (inside layout so sidebar stays visible)
      {
        path: "/403",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ForbiddenPage />
          </Suspense>
        ),
      },
    ],
  },
  // Public routes
  ...publicAuthRoutes,
  // 404 Fallback
  {
    path: "*",
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFound />
      </Suspense>
    ),
  },
];
