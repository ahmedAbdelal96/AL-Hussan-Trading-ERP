/**
 * Payroll Module Routes
 * Global payroll operations: structures, types, processing, reporting
 *
 * Employee-specific data (allowances, loans, deductions) is managed
 *
 * Aggregate views (all employees) are available at:
 * /payroll/allowances, /payroll/loans, /payroll/deductions
 *
 * Route Hierarchy:
 * /payroll
 * ├── / - Dashboard (Index)
 * ├── /allowances - All Employee Allowances
 * ├── /loans - All Employee Loans
 * ├── /deductions - All Employee Deductions
 * ├── /allowance-types - Allowance Types List
 * ├── /allowance-types/create - Create Allowance Type
 * ├── /allowance-types/edit/:id - Edit Allowance Type
 * ├── /process - Payroll Processing (Preview + Process)
 * └── /payslips - Payslips
 */

import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { SYSTEM_ROLES, PERMISSIONS } from "@/config/permissions.constants";

// ========== PAYROLL DASHBOARD ==========
const PayrollDashboardPage = lazy(
  () => import("@/pages/payroll/PayrollDashboardPage"),
);

// ========== AGGREGATE VIEWS ==========
const EmployeeAllowancesListPage = lazy(
  () => import("@/pages/payroll/EmployeeAllowancesListPage"),
);

const EmployeeLoansListPage = lazy(
  () => import("@/pages/payroll/EmployeeLoansListPage"),
);

const EmployeeDeductionsListPage = lazy(
  () => import("@/pages/payroll/EmployeeDeductionsListPage"),
);

// ========== ALLOWANCE TYPES ==========
const AllowanceTypesListPage = lazy(
  () => import("@/pages/payroll/AllowanceTypesListPage"),
);

const AllowanceTypeFormPage = lazy(
  () => import("@/pages/payroll/AllowanceTypeFormPage"),
);

// ========== PAYROLL PROCESSING ==========
const PayrollProcessingPage = lazy(
  () => import("@/pages/payroll/PayrollProcessingPage"),
);

// ========== PAYSLIPS ==========
const PayslipListPage = lazy(() => import("@/pages/payroll/PayslipListPage"));
const PayslipDetailPage = lazy(
  () => import("@/pages/payroll/PayslipDetailPage"),
);

/**
 * Payroll Routes Configuration
 */
export const payrollRoutes: RouteObject[] = [
  {
    path: "payroll",
    element: (
      <ProtectedRoute
        roles={[
          SYSTEM_ROLES.SUPERADMIN,
          SYSTEM_ROLES.ADMIN,
          SYSTEM_ROLES.HR_MANAGER,
          SYSTEM_ROLES.HR_STAFF,
        ]}
        permissions={[PERMISSIONS.PAYROLL_READ]}
      />
    ),
    children: [
      // ========== PAYROLL DASHBOARD (Index Route) ==========
      {
        index: true,
        element: <PayrollDashboardPage />,
      },

      // ========== AGGREGATE VIEWS ==========
      {
        path: "allowances",
        element: <EmployeeAllowancesListPage />,
      },
      {
        path: "loans",
        element: <EmployeeLoansListPage />,
      },
      {
        path: "deductions",
        element: <EmployeeDeductionsListPage />,
      },

      // ========== ALLOWANCE TYPES ==========
      {
        path: "allowance-types",
        children: [
          {
            index: true,
            element: <AllowanceTypesListPage />,
          },
          {
            path: "create",
            element: (
              <ProtectedRoute
                roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.HR_MANAGER]}
                permissions={[PERMISSIONS.PAYROLL_WRITE]}
              />
            ),
            children: [
              {
                index: true,
                element: <AllowanceTypeFormPage />,
              },
            ],
          },
          {
            path: "edit/:id",
            element: (
              <ProtectedRoute
                roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.HR_MANAGER]}
                permissions={[PERMISSIONS.PAYROLL_WRITE]}
              />
            ),
            children: [
              {
                index: true,
                element: <AllowanceTypeFormPage />,
              },
            ],
          },
        ],
      },

      // ========== PAYROLL PROCESSING ==========
      {
        path: "process",
        element: (
          <ProtectedRoute
            permissions={[PERMISSIONS.PAYROLL_PROCESS]}
          />
        ),
        children: [
          {
            index: true,
            element: <PayrollProcessingPage />,
          },
        ],
      },

      // ========== PAYSLIPS ==========
      {
        path: "payslips",
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.HR_MANAGER,
              SYSTEM_ROLES.FIN_MANAGER,
              SYSTEM_ROLES.HR_STAFF,
            ]}
            permissions={[PERMISSIONS.PAYROLL_READ]}
          />
        ),
        children: [
          {
            index: true,
            element: <PayslipListPage />,
          },
          {
            path: ":id",
            element: <PayslipDetailPage />,
          },
        ],
      },
    ],
  },
];
