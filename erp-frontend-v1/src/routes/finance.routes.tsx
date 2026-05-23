/**
 * Finance Routes
 *
 * Route definitions for the Finance module
 * Protected with ProtectedRoute — requires finance roles OR finance:read permission
 */

import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { SYSTEM_ROLES, PERMISSIONS } from "@/config/permissions.constants";

// Lazy load pages for code splitting
const FinanceDashboardPage = lazy(
  () => import("@/pages/finance/FinanceDashboardPage"),
);

const CostCategoriesPage = lazy(
  () => import("@/pages/finance/CostCategoriesPage"),
);

const ProjectCostsListPage = lazy(
  () => import("@/pages/finance/ProjectCostsListPage"),
);

const ProjectCostFormPage = lazy(
  () => import("@/pages/finance/ProjectCostFormPage"),
);

const ProjectCostDetailsPage = lazy(
  () => import("@/pages/finance/ProjectCostDetailsPage"),
);

const ProjectCostSummaryPage = lazy(
  () => import("@/pages/finance/ProjectCostSummaryPage"),
);

const AllocatedCostsPage = lazy(
  () => import("@/pages/finance/AllocatedCostsPage"),
);

const ApprovalQueuePage = lazy(
  () => import("@/pages/finance/ApprovalQueuePage"),
);

/**
 * Finance Module Routes
 *
 * Structure:
 * /finance - Finance dashboard with analytics
 * /finance/categories - Cost categories management
 * /finance/costs - Project costs list
 * /finance/costs/create - Create new cost
 * /finance/costs/:id - Cost details
 * /finance/costs/:id/edit - Edit cost
 * /finance/allocated-costs - Allocated costs management
 * /finance/approvals - Approval queue (PENDING costs)
 * /finance/projects/:projectId/summary - Project cost summary
 */
export const financeRoutes: RouteObject[] = [
  {
    path: "finance",
    element: (
      <ProtectedRoute
        roles={[
          SYSTEM_ROLES.SUPERADMIN,
          SYSTEM_ROLES.ADMIN,
          SYSTEM_ROLES.FIN_MANAGER,
          SYSTEM_ROLES.FIN_STAFF,
        ]}
        permissions={[PERMISSIONS.FINANCE_READ]}
      />
    ),
    children: [
      // Finance Dashboard (Main page)
      {
        index: true,
        element: <FinanceDashboardPage />,
      },
      // Cost Categories
      {
        path: "categories",
        element: <CostCategoriesPage />,
      },
      // Allocated Costs Management
      {
        path: "allocated-costs",
        element: <AllocatedCostsPage />,
      },
      // Approval Queue (PENDING costs)
      {
        path: "approvals",
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.ADMIN,
              SYSTEM_ROLES.FIN_MANAGER,
            ]}
            permissions={[PERMISSIONS.FINANCE_APPROVE]}
          >
            <ApprovalQueuePage />
          </ProtectedRoute>
        ),
      },
      // Project Costs
      {
        path: "costs",
        children: [
          {
            index: true,
            element: <ProjectCostsListPage />,
          },
          {
            path: "create",
            element: (
              <ProtectedRoute
                roles={[
                  SYSTEM_ROLES.SUPERADMIN,
                  SYSTEM_ROLES.ADMIN,
                  SYSTEM_ROLES.FIN_MANAGER,
                  SYSTEM_ROLES.FIN_STAFF,
                ]}
                permissions={[PERMISSIONS.FINANCE_WRITE]}
              >
                <ProjectCostFormPage />
              </ProtectedRoute>
            ),
          },
          {
            path: ":id",
            element: <ProjectCostDetailsPage />,
          },
          {
            path: ":id/edit",
            element: (
              <ProtectedRoute
                roles={[
                  SYSTEM_ROLES.SUPERADMIN,
                  SYSTEM_ROLES.ADMIN,
                  SYSTEM_ROLES.FIN_MANAGER,
                  SYSTEM_ROLES.FIN_STAFF,
                ]}
                permissions={[PERMISSIONS.FINANCE_WRITE]}
              >
                <ProjectCostFormPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      // Project Summary
      {
        path: "projects/:projectId/summary",
        element: <ProjectCostSummaryPage />,
      },
    ],
  },
];
