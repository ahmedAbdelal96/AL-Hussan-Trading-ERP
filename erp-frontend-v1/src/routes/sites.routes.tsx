/**
 * Sites Module Routes
 *
 * Security: EXPLICIT roles + permissions (Best Practice)
 * - Roles: SUPERADMIN, OPS_MANAGER, OPS_STAFF
 * - Permissions: site:read, site:write, site:delete
 *
 * Defines all routes for the Sites module with:
 * - Protected routes with permission checks
 * - Lazy loading for code splitting
 * - List, Create, Edit, and Details pages
 *
 * @module sitesRoutes
 */

import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { SYSTEM_ROLES, PERMISSIONS } from "@/config/permissions.constants";

// Lazy load pages for better performance
const SitesListPage = lazy(() =>
  import("@/pages/sites/SitesListPage").then((m) => ({
    default: m.SitesListPage,
  })),
);

const SitesDashboardPage = lazy(() =>
  import("@/pages/sites/SitesDashboardPage").then((m) => ({
    default: m.SitesDashboardPage,
  })),
);

const SiteFormPage = lazy(() =>
  import("@/pages/sites/SiteFormPage").then((m) => ({
    default: m.SiteFormPage,
  })),
);

const SiteDetailsPage = lazy(() =>
  import("@/pages/sites/SiteDetailsPage").then((m) => ({
    default: m.SiteDetailsPage,
  })),
);

const DeletedSitesPage = lazy(() =>
  import("@/pages/sites/DeletedSitesPage").then((m) => ({
    default: m.DeletedSitesPage,
  })),
);

export const sitesRoutes: RouteObject[] = [
  {
    path: "sites",
    element: (
      <ProtectedRoute
        roles={[
          SYSTEM_ROLES.SUPERADMIN,
          SYSTEM_ROLES.ADMIN,
          SYSTEM_ROLES.OPS_MANAGER,
          SYSTEM_ROLES.OPS_STAFF,
        ]}
        permissions={[PERMISSIONS.SITE_READ]}
      />
    ),
    children: [
      {
        // List page: /sites
        index: true,
        element: <SitesListPage />,
      },
      {
        // Dashboard page: /sites/dashboard
        path: "dashboard",
        element: <SitesDashboardPage />,
      },
      {
        // Details page: /sites/:id
        path: ":id",
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.ADMIN,
              SYSTEM_ROLES.OPS_MANAGER,
              SYSTEM_ROLES.OPS_STAFF,
            ]}
            permissions={[PERMISSIONS.SITE_READ]}
          />
        ),
        children: [
          {
            index: true,
            element: <SiteDetailsPage />,
          },
        ],
      },
      {
        // Create page: /sites/create
        path: "create",
        element: (
          <ProtectedRoute
            roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.OPS_MANAGER]}
            permissions={[PERMISSIONS.SITE_WRITE]}
          />
        ),
        children: [
          {
            index: true,
            element: <SiteFormPage />,
          },
        ],
      },
      {
        // Edit page: /sites/edit/:id
        path: "edit/:id",
        element: (
          <ProtectedRoute
            roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.OPS_MANAGER]}
            permissions={[PERMISSIONS.SITE_WRITE]}
          />
        ),
        children: [
          {
            index: true,
            element: <SiteFormPage />,
          },
        ],
      },
      {
        // Deleted sites page: /sites/deleted
        path: "deleted",
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.ADMIN,
              SYSTEM_ROLES.OPS_MANAGER,
            ]}
            permissions={[PERMISSIONS.SITE_DELETE]}
          />
        ),
        children: [
          {
            index: true,
            element: <DeletedSitesPage />,
          },
        ],
      },
    ],
  },
];
