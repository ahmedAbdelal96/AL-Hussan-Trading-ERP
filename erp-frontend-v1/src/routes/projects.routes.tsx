/**
 * Projects Routes Configuration
 *
 * Security: EXPLICIT roles + permissions (Best Practice)
 * - Roles: SUPERADMIN, OPS_MANAGER, OPS_STAFF
 * - Permissions: project:read, project:write, project:delete
 *
 * Defines all routes for the Projects module with:
 * - Lazy loading for code splitting
 * - Protected routes with permission checks
 * - Proper route hierarchy
 *
 * Routes:
 * - /projects - List page
 * - /projects/create - Create page
 * - /projects/edit/:id - Edit page
 * - /projects/:id - Details page
 * - /projects/:id/progress - Progress tracking page
 *
 * @module projects.routes
 */

import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { SYSTEM_ROLES, PERMISSIONS } from "@/config/permissions.constants";

// Lazy load pages for code splitting and better performance
const ProjectsListPage = lazy(() =>
  import("@/pages/projects/ProjectsListPage").then((m) => ({
    default: m.ProjectsListPage,
  })),
);

const ProjectFormPage = lazy(() =>
  import("@/pages/projects/ProjectFormPage").then((m) => ({
    default: m.ProjectFormPage,
  })),
);

const ProjectDetailsPage = lazy(() =>
  import("@/pages/projects/ProjectDetailsPage").then((m) => ({
    default: m.ProjectDetailsPage,
  })),
);

const ProjectsDashboardPage = lazy(
  () => import("@/pages/projects/ProjectsDashboardPage"),
);

const ProjectProgressPage = lazy(() =>
  import("@/pages/projects/ProjectProgressPage").then((m) => ({
    default: m.ProjectProgressPage,
  })),
);

/**
 * Projects Module Routes
 */
export const projectsRoutes: RouteObject[] = [
  {
    path: "projects",
    element: (
      <ProtectedRoute
        roles={[
          SYSTEM_ROLES.SUPERADMIN,
          SYSTEM_ROLES.ADMIN,
          SYSTEM_ROLES.OPS_MANAGER,
          SYSTEM_ROLES.OPS_STAFF,
        ]}
        permissions={[PERMISSIONS.PROJECT_READ]}
      />
    ),
    children: [
      {
        index: true,
        element: <ProjectsListPage />,
      },
      {
        path: "dashboard",
        element: <ProjectsDashboardPage />,
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
            permissions={[PERMISSIONS.PROJECT_WRITE]}
          />
        ),
        children: [
          {
            index: true,
            element: <ProjectFormPage />,
          },
        ],
      },
      {
        path: "edit/:id",
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.ADMIN,
              SYSTEM_ROLES.OPS_MANAGER,
              SYSTEM_ROLES.OPS_STAFF,
            ]}
            permissions={[PERMISSIONS.PROJECT_WRITE]}
          />
        ),
        children: [
          {
            index: true,
            element: <ProjectFormPage />,
          },
        ],
      },
      {
        path: ":id",
        element: <ProjectDetailsPage />,
      },
      {
        path: ":id/progress",
        element: <ProjectProgressPage />,
      },
    ],
  },
];
