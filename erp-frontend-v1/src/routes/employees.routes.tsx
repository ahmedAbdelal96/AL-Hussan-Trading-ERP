/**
 * Employees Module Routes
 *
 * Security: EXPLICIT roles + permissions (Best Practice)
 * - Roles: SUPERADMIN, HR_MANAGER, HR_STAFF
 * - Permissions: employee:read, employee:write, employee:delete
 *
 * Route structure:
 * - /employees - List page
 * - /employees/create - Create page
 * - /employees/:id - Details page (with tabs: overview, salary, allowances, loans, deductions, documents)
 * - /employees/edit/:id - Edit page
 *
 * Performance:
 * - Lazy loading for code splitting
 * - Routes loaded only when accessed
 */

import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { SYSTEM_ROLES, PERMISSIONS } from "@/config/permissions.constants";

// Lazy load pages for better performance
const EmployeesDashboardPage = lazy(
  () => import("@/pages/employees/EmployeesDashboardPage"),
);

const EmployeesListPage = lazy(() =>
  import("@/pages/employees/EmployeesListPage").then((m) => ({
    default: m.EmployeesListPage,
  })),
);

const EmployeeFormPage = lazy(() =>
  import("@/pages/employees/EmployeeFormPage").then((m) => ({
    default: m.EmployeeFormPage,
  })),
);

const EmployeeDetailsPage = lazy(() =>
  import("@/pages/employees/EmployeeDetailsPage").then((m) => ({
    default: m.EmployeeDetailsPage,
  })),
);

export const employeesRoutes: RouteObject[] = [
  {
    path: "employees",
    element: (
      <ProtectedRoute
        roles={[
          SYSTEM_ROLES.SUPERADMIN,
          SYSTEM_ROLES.ADMIN,
          SYSTEM_ROLES.HR_MANAGER,
          SYSTEM_ROLES.HR_STAFF,
        ]}
        permissions={[PERMISSIONS.EMPLOYEE_READ]}
      />
    ),
    children: [
      {
        path: "dashboard",
        element: <EmployeesDashboardPage />,
      },
      {
        index: true,
        element: <EmployeesListPage />,
      },
      {
        path: "create",
        element: (
          <ProtectedRoute
            roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.HR_MANAGER]}
            permissions={[PERMISSIONS.EMPLOYEE_WRITE]}
          />
        ),
        children: [
          {
            index: true,
            element: <EmployeeFormPage />,
          },
        ],
      },
      {
        path: ":id",
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.ADMIN,
              SYSTEM_ROLES.HR_MANAGER,
              SYSTEM_ROLES.HR_STAFF,
            ]}
            permissions={[PERMISSIONS.EMPLOYEE_READ]}
          />
        ),
        children: [
          {
            index: true,
            element: <EmployeeDetailsPage />,
          },
        ],
      },
      {
        path: "edit/:id",
        element: (
          <ProtectedRoute
            roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.HR_MANAGER]}
            permissions={[PERMISSIONS.EMPLOYEE_WRITE]}
          />
        ),
        children: [
          {
            index: true,
            element: <EmployeeFormPage />,
          },
        ],
      },
    ],
  },
];
