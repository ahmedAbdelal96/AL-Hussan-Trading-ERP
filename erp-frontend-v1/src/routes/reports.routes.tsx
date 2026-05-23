/**
 * ============================================================================
 * REPORTS MODULE ROUTES — v8.0.0 (Consolidated)
 * ============================================================================
 *
 * 42 old pages → 16 consolidated professional reports + 2 navigation pages
 *
 * Finance     (3): Dashboard, Pending/Overdue, Costs by Project
 * Projects    (3): Dashboard, Budget & Delays, Completed
 * Employees   (2): Dashboard, HR Analytics
 * Maintenance (2): Dashboard, Analytics
 * Sites       (2): Dashboard, Performance
 * Assets      (2): Dashboard, Analytics
 * Users       (2): Security Dashboard, RBAC
 * Payroll     (4): Dashboard, By Department, Details, Comparison
 *
 * @module ReportsRoutes
 * @version 8.0.0
 */
/* eslint-disable react-refresh/only-export-components */

import { lazy, Suspense } from "react";
import { RouteObject } from "react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { SYSTEM_ROLES, PERMISSIONS } from "@/config/permissions.constants";
import { REPORT_CATEGORY_PERMISSIONS } from "@/config/reports-access.constants";

const ReportsHubPage = lazy(() => import("@/pages/reports/ReportsHubPage"));
const CategoryReportsPage = lazy(
  () => import("@/pages/reports/CategoryReportsPage"),
);

/**
 * Loading fallback component
 */
const ReportPageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="text-sm text-muted-foreground">Loading report...</p>
    </div>
  </div>
);

const FinanceDashboardReport = lazy(
  () => import("@/pages/reports/finance/FinanceDashboardReport"),
);
const FinancePendingOverdueReport = lazy(
  () => import("@/pages/reports/finance/FinancePendingOverdueReport"),
);
const CostsByProjectReport = lazy(
  () => import("@/pages/reports/finance/CostsByProjectReport"),
);
const FinanceTaxReport = lazy(
  () => import("@/pages/reports/finance/FinanceTaxReport"),
);

const ProjectsDashboardReport = lazy(
  () => import("@/pages/reports/projects/ProjectsDashboardReport"),
);
const ProjectsBudgetDelaysReport = lazy(
  () => import("@/pages/reports/projects/ProjectsBudgetDelaysReport"),
);
const ProjectsCompletedReport = lazy(
  () => import("@/pages/reports/projects/ProjectsCompletedReport"),
);
const ProjectCostBreakdownReport = lazy(
  () => import("@/pages/reports/projects/ProjectCostBreakdownReport"),
);
const ProjectLaborCostReport = lazy(
  () => import("@/pages/reports/projects/ProjectLaborCostReport"),
);
const ProjectAssetUtilizationReport = lazy(
  () => import("@/pages/reports/projects/ProjectAssetUtilizationReport"),
);

const EmployeesDashboardReport = lazy(
  () => import("@/pages/reports/employees/EmployeesDashboardReport"),
);
const HRAnalyticsReport = lazy(
  () => import("@/pages/reports/employees/HRAnalyticsReport"),
);
const EmployeeAssignmentReport = lazy(
  () => import("@/pages/reports/employees/EmployeeAssignmentReport"),
);
const ContractExpiryReport = lazy(
  () => import("@/pages/reports/employees/ContractExpiryReport"),
);

const MaintenanceDashboardReport = lazy(
  () => import("@/pages/reports/maintenance/MaintenanceDashboardReport"),
);
const MaintenanceAnalyticsReport = lazy(
  () => import("@/pages/reports/maintenance/MaintenanceAnalyticsReport"),
);
const MTBFMTTRPerAssetReport = lazy(
  () => import("@/pages/reports/maintenance/MTBFMTTRPerAssetReport"),
);
const MaintenanceCostPerAssetReport = lazy(
  () => import("@/pages/reports/maintenance/MaintenanceCostPerAssetReport"),
);
const MaintenanceBudgetVsActualReport = lazy(
  () => import("@/pages/reports/maintenance/MaintenanceBudgetVsActualReport"),
);

const SitesDashboardReport = lazy(
  () => import("@/pages/reports/sites/SitesDashboardReport"),
);
const SitesPerformanceDashboardReport = lazy(
  () => import("@/pages/reports/sites/SitesPerformanceDashboardReport"),
);
const SiteProfitabilityReport = lazy(
  () => import("@/pages/reports/sites/SiteProfitabilityReport"),
);

const AssetsDashboardReport = lazy(
  () => import("@/pages/reports/assets/AssetsDashboardReport"),
);
const AssetsAnalyticsReport = lazy(
  () => import("@/pages/reports/assets/AssetsAnalyticsReport"),
);

const UsersSecurityDashboardReport = lazy(
  () => import("@/pages/reports/users/UsersSecurityDashboardReport"),
);
const UsersRBACReport = lazy(
  () => import("@/pages/reports/users/UsersRBACReport"),
);

const ExecutiveDashboardReport = lazy(
  () => import("@/pages/reports/executive/ExecutiveDashboardReport"),
);
const CompanyPnlReport = lazy(
  () => import("@/pages/reports/executive/CompanyPnlReport"),
);

const PayrollDashboardReport = lazy(
  () => import("@/pages/reports/payroll/PayrollDashboardReport"),
);
const PayrollByDepartmentReport = lazy(
  () => import("@/pages/reports/payroll/PayrollByDepartmentReport"),
);
const PayrollDetailsReport = lazy(
  () => import("@/pages/reports/payroll/PayrollDetailsReport"),
);
const PayrollComparisonReport = lazy(
  () => import("@/pages/reports/payroll/PayrollComparisonReport"),
);

/**
 * Reports module routes
 */
export const reportsRoutes: RouteObject[] = [
  {
    path: "/reports",
    element: (
      <ProtectedRoute
        roles={[
          SYSTEM_ROLES.SUPERADMIN,
          SYSTEM_ROLES.ADMIN,
          SYSTEM_ROLES.FIN_MANAGER,
          SYSTEM_ROLES.HR_MANAGER,
          SYSTEM_ROLES.OPS_MANAGER,
        ]}
        permissions={[PERMISSIONS.REPORT_READ]}
      />
    ),
    children: [
      // Reports Hub - Main page with 8 module cards
      {
        index: true,
        element: (
          <Suspense fallback={<ReportPageLoader />}>
            <ReportsHubPage />
          </Suspense>
        ),
      },
      // Category Reports - Shows all reports for a specific module
      {
        path: "category/:category",
        element: (
          <Suspense fallback={<ReportPageLoader />}>
            <CategoryReportsPage />
          </Suspense>
        ),
      },
      // Finance Module - requires report:finance
      {
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.ADMIN,
              SYSTEM_ROLES.FIN_MANAGER,
            ]}
            permissions={[REPORT_CATEGORY_PERMISSIONS.finance]}
          />
        ),
        children: [
          // ---- New consolidated finance pages ----
          {
            path: "finance/dashboard",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <FinanceDashboardReport />
              </Suspense>
            ),
          },
          {
            path: "finance/pending-overdue",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <FinancePendingOverdueReport />
              </Suspense>
            ),
          },
          {
            path: "finance/by-project",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <CostsByProjectReport />
              </Suspense>
            ),
          },
          {
            path: "finance/tax",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <FinanceTaxReport />
              </Suspense>
            ),
          },
        ],
      },
      // Projects Module - requires report:projects
      {
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.ADMIN,
              SYSTEM_ROLES.OPS_MANAGER,
            ]}
            permissions={[REPORT_CATEGORY_PERMISSIONS.projects]}
          />
        ),
        children: [
          {
            path: "projects/dashboard",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <ProjectsDashboardReport />
              </Suspense>
            ),
          },
          {
            path: "projects/budget-delays",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <ProjectsBudgetDelaysReport />
              </Suspense>
            ),
          },
          {
            path: "projects/completed",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <ProjectsCompletedReport />
              </Suspense>
            ),
          },
          {
            path: "projects/cost-breakdown",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <ProjectCostBreakdownReport />
              </Suspense>
            ),
          },
          {
            path: "projects/labor-cost",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <ProjectLaborCostReport />
              </Suspense>
            ),
          },
          {
            path: "projects/asset-utilization",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <ProjectAssetUtilizationReport />
              </Suspense>
            ),
          },
        ],
      },
      {
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.ADMIN,
              SYSTEM_ROLES.HR_MANAGER,
            ]}
            permissions={[REPORT_CATEGORY_PERMISSIONS.employees]}
          />
        ),
        children: [
          {
            path: "employees/dashboard",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <EmployeesDashboardReport />
              </Suspense>
            ),
          },
          {
            path: "employees/hr-analytics",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <HRAnalyticsReport />
              </Suspense>
            ),
          },
          {
            path: "employees/assignment",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <EmployeeAssignmentReport />
              </Suspense>
            ),
          },
          {
            path: "employees/contract-expiry",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <ContractExpiryReport />
              </Suspense>
            ),
          },
        ],
      },
      {
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.ADMIN,
              SYSTEM_ROLES.OPS_MANAGER,
            ]}
            permissions={[REPORT_CATEGORY_PERMISSIONS.maintenance]}
          />
        ),
        children: [
          {
            path: "maintenance/dashboard",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <MaintenanceDashboardReport />
              </Suspense>
            ),
          },
          {
            path: "maintenance/analytics",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <MaintenanceAnalyticsReport />
              </Suspense>
            ),
          },
          {
            path: "maintenance/mtbf-mttr",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <MTBFMTTRPerAssetReport />
              </Suspense>
            ),
          },
          {
            path: "maintenance/cost-per-asset",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <MaintenanceCostPerAssetReport />
              </Suspense>
            ),
          },
          {
            path: "maintenance/budget-vs-actual",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <MaintenanceBudgetVsActualReport />
              </Suspense>
            ),
          },
        ],
      },
      {
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.ADMIN,
              SYSTEM_ROLES.OPS_MANAGER,
            ]}
            permissions={[REPORT_CATEGORY_PERMISSIONS.sites]}
          />
        ),
        children: [
          {
            path: "sites/dashboard",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <SitesDashboardReport />
              </Suspense>
            ),
          },
          {
            path: "sites/performance",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <SitesPerformanceDashboardReport />
              </Suspense>
            ),
          },
          {
            path: "sites/profitability",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <SiteProfitabilityReport />
              </Suspense>
            ),
          },
        ],
      },
      {
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.ADMIN,
              SYSTEM_ROLES.OPS_MANAGER,
            ]}
            permissions={[REPORT_CATEGORY_PERMISSIONS.assets]}
          />
        ),
        children: [
          {
            path: "assets/dashboard",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <AssetsDashboardReport />
              </Suspense>
            ),
          },
          {
            path: "assets/analytics",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <AssetsAnalyticsReport />
              </Suspense>
            ),
          },
        ],
      },
      {
        element: (
          <ProtectedRoute
            roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.ADMIN]}
            permissions={[REPORT_CATEGORY_PERMISSIONS.users]}
          />
        ),
        children: [
          {
            path: "users/security",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <UsersSecurityDashboardReport />
              </Suspense>
            ),
          },
          {
            path: "users/rbac",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <UsersRBACReport />
              </Suspense>
            ),
          },
        ],
      },
      {
        element: (
          <ProtectedRoute
            roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.ADMIN]}
            permissions={[REPORT_CATEGORY_PERMISSIONS.executive]}
          />
        ),
        children: [
          {
            path: "executive/dashboard",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <ExecutiveDashboardReport />
              </Suspense>
            ),
          },
          {
            path: "executive/pnl",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <CompanyPnlReport />
              </Suspense>
            ),
          },
        ],
      },
      {
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.ADMIN,
              SYSTEM_ROLES.HR_MANAGER,
              SYSTEM_ROLES.FIN_MANAGER,
            ]}
            permissions={[REPORT_CATEGORY_PERMISSIONS.payroll]}
          />
        ),
        children: [
          {
            path: "payroll/dashboard",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <PayrollDashboardReport />
              </Suspense>
            ),
          },
          {
            path: "payroll/by-department",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <PayrollByDepartmentReport />
              </Suspense>
            ),
          },
          {
            path: "payroll/details",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <PayrollDetailsReport />
              </Suspense>
            ),
          },
          {
            path: "payroll/comparison",
            element: (
              <Suspense fallback={<ReportPageLoader />}>
                <PayrollComparisonReport />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
];

/**
 * Consolidated Routes (v8.0.0):
 *
 * Navigation:
 * - /reports                          → ReportsHubPage (module cards)
 * - /reports/category/:category       → CategoryReportsPage
 *
 * Finance (3):
 * - /reports/finance/dashboard        → FinanceDashboardReport
 * - /reports/finance/pending-overdue  → FinancePendingOverdueReport
 * - /reports/finance/by-project       → CostsByProjectReport
 *
 * Projects (3):
 * - /reports/projects/dashboard       → ProjectsDashboardReport
 * - /reports/projects/budget-delays   → ProjectsBudgetDelaysReport
 * - /reports/projects/completed       → ProjectsCompletedReport
 *
 * Employees (4):
 * - /reports/employees/dashboard      → EmployeesDashboardReport
 * - /reports/employees/hr-analytics   → HRAnalyticsReport
 * - /reports/employees/assignment     → EmployeeAssignmentReport
 * - /reports/employees/contract-expiry → ContractExpiryReport
 *
 * Maintenance (2):
 * - /reports/maintenance/dashboard    → MaintenanceDashboardReport
 * - /reports/maintenance/analytics    → MaintenanceAnalyticsReport
 *
 * Sites (3):
 * - /reports/sites/dashboard          → SitesDashboardReport
 * - /reports/sites/performance        → SitesPerformanceDashboardReport
 * - /reports/sites/profitability      → SiteProfitabilityReport
 *
 * Assets (2):
 * - /reports/assets/dashboard         → AssetsDashboardReport
 * - /reports/assets/analytics         → AssetsAnalyticsReport
 *
 * Users (2):
 * - /reports/users/security           → UsersSecurityDashboardReport
 * - /reports/users/rbac               → UsersRBACReport
 *
 * Payroll (4):
 * - /reports/payroll/dashboard        → PayrollDashboardReport
 * - /reports/payroll/by-department    → PayrollByDepartmentReport
 * - /reports/payroll/details          → PayrollDetailsReport
 * - /reports/payroll/comparison       → PayrollComparisonReport
 *
 * Executive (2):
 * - /reports/executive/dashboard     → ExecutiveDashboardReport
 * - /reports/executive/pnl           → CompanyPnlReport
 *
 * Total: 27 report pages + 2 navigation pages = 29 routes
 */
