/**
 * Assets Module Routes
 *
 * All routes for the assets management module
 * Protected with appropriate permissions
 */

import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { SYSTEM_ROLES, PERMISSIONS } from "@/config/permissions.constants";

// Lazy load pages for better performance
const AssetsDashboardPage = lazy(() => import("@/pages/assets/AssetsDashboardPage"));

const AssetsListPage = lazy(() =>
  import("@/pages/assets/AssetsListPage").then((m) => ({
    default: m.AssetsListPage,
  })),
);

const AssetFormPage = lazy(() => import("@/pages/assets/AssetFormPage"));
const AssetDetailsPage = lazy(() => import("@/pages/assets/AssetDetailsPage"));

export const assetsRoutes: RouteObject[] = [
  {
    path: "assets",
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.ADMIN,
              SYSTEM_ROLES.OPS_MANAGER,
              SYSTEM_ROLES.OPS_STAFF,
            ]}
            permissions={[PERMISSIONS.ASSET_READ]}
          >
            <AssetsListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.ADMIN,
              SYSTEM_ROLES.OPS_MANAGER,
              SYSTEM_ROLES.OPS_STAFF,
            ]}
            permissions={[PERMISSIONS.ASSET_READ]}
          >
            <AssetsDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "create",
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.ADMIN,
              SYSTEM_ROLES.OPS_MANAGER,
              SYSTEM_ROLES.OPS_STAFF,
            ]}
            permissions={[PERMISSIONS.ASSET_WRITE]}
          >
            <AssetFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ":id",
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.ADMIN,
              SYSTEM_ROLES.OPS_MANAGER,
              SYSTEM_ROLES.OPS_STAFF,
            ]}
            permissions={[PERMISSIONS.ASSET_READ]}
          >
            <AssetDetailsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ":id/edit",
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.ADMIN,
              SYSTEM_ROLES.OPS_MANAGER,
              SYSTEM_ROLES.OPS_STAFF,
            ]}
            permissions={[PERMISSIONS.ASSET_WRITE]}
          >
            <AssetFormPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
];
