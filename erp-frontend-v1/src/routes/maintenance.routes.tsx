/**
 * Maintenance Routes
 * Defines all routes for the maintenance module
 * Protected with ProtectedRoute — requires OPS roles OR maintenance:read permission
 */

import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { PERMISSIONS } from "@/config/permissions.constants";

const MaintenanceListPage = lazy(
  () => import("@/pages/maintenance/MaintenanceListPage"),
);
const MaintenanceFormPage = lazy(
  () => import("@/pages/maintenance/MaintenanceFormPage"),
);
const MaintenanceDetailsPage = lazy(
  () => import("@/pages/maintenance/MaintenanceDetailsPage"),
);
const MaintenanceDashboardPage = lazy(
  () => import("@/pages/maintenance/MaintenanceDashboardPage"),
);

export const maintenanceRoutes: RouteObject[] = [
  {
    path: "maintenance",
    element: (
      <ProtectedRoute
        permissions={[PERMISSIONS.MAINTENANCE_READ]}
      />
    ),
    children: [
      {
        index: true,
        element: <MaintenanceListPage />,
      },
      {
        path: "dashboard",
        element: <MaintenanceDashboardPage />,
      },
      {
        path: "create",
        element: (
          <ProtectedRoute
            permissions={[PERMISSIONS.MAINTENANCE_WRITE]}
          >
            <MaintenanceFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "edit/:id",
        element: (
          <ProtectedRoute
            permissions={[PERMISSIONS.MAINTENANCE_WRITE]}
          >
            <MaintenanceFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ":id",
        element: <MaintenanceDetailsPage />,
      },
    ],
  },
];
