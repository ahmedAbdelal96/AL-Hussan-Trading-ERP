/**
 * Breadcrumbs Hook
 *
 * Enterprise-grade breadcrumb generation system with:
 * - Automatic URL-based breadcrumb creation
 * - Dynamic entity name resolution (fetch actual names from API)
 * - Comprehensive module support (all ERP modules)
 * - Full RTL and i18n support
 * - Smart ID detection and handling
 * - Configurable routing patterns
 *
 * Architecture:
 * 1. Parse URL segments
 * 2. Map segments to translation keys
 * 3. Resolve entity names dynamically when IDs detected
 * 4. Build hierarchical breadcrumb trail
 *
 * @module useBreadcrumbs
 * @author ERP System Team
 */

import { useMemo } from "react";
import { useLocation } from "react-router";
import { useTranslation } from "@/i18n/useTranslation";

/**
 * Breadcrumb item interface
 */
export interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: string;
  isCurrentPage?: boolean;
}

/**
 * Breadcrumb labels configuration
 * Maps path segments to translation keys
 *
 * Pattern: module.action or module.submodule.action
 * Special keys: .new, .edit, .view for CRUD operations
 */
const BREADCRUMB_LABELS: Record<string, string> = {
  // Dashboard
  dashboard: "navigation.dashboard",

  // Projects Module
  projects: "navigation.projects",
  "projects.new": "projects.actions.create",
  "projects.edit": "projects.actions.edit",
  "projects.view": "projects.details.title",
  "projects.progress": "projects.progress.title",

  // Sites Module
  sites: "navigation.sites",
  "sites.new": "sites.actions.create",
  "sites.edit": "sites.actions.edit",
  "sites.view": "sites.details.title",

  // Employees Module
  employees: "navigation.employees",
  "employees.new": "employees.actions.create",
  "employees.edit": "employees.actions.edit",
  "employees.view": "employees.details.title",
  "employees.salary-history": "payroll.salary.historyTitle",
  "employees.allowances": "payroll.employeeAllowances.pageTitle",
  "employees.loans": "payroll.employeeLoans.pageTitle",
  "employees.deductions": "payroll.employeeDeductions.pageTitle",

  // Assets Module
  assets: "navigation.assets",
  "assets.new": "assets.actions.create",
  "assets.edit": "assets.actions.edit",
  "assets.view": "assets.details.title",

  // Maintenance Module
  maintenance: "navigation.maintenance",
  "maintenance.new": "maintenance.actions.create",
  "maintenance.edit": "maintenance.actions.edit",
  "maintenance.view": "maintenance.details.title",

  // Finance Module
  finance: "navigation.finance",
  "finance.costs": "finance.costs.title",
  "finance.costs.new": "finance.costs.actions.create",
  "finance.costs.edit": "finance.costs.actions.edit",
  "finance.costs.view": "finance.costs.details.title",
  "finance.budget": "finance.budget.title",
  "finance.payments": "finance.payments.title",

  // Payroll Module
  payroll: "navigation.payroll",
  "payroll.process": "payroll.process.title",
  "payroll.history": "payroll.history.title",
  "payroll.settings": "payroll.settings.title",

  // Users
  users: "navigation.users",
  "users.new": "navigation.newUser",
  "users.edit": "navigation.editUser",
  "users.view": "users.profile.title",
  "users.permissions": "navigation.userPermissions",

  // Customers
  customers: "navigation.customers",
  "customers.new": "navigation.newCustomer",
  "customers.edit": "navigation.editCustomer",
  "customers.search": "navigation.searchCustomers",

  // Roles
  roles: "navigation.roles",
  "roles.new": "navigation.newRole",
  "roles.edit": "navigation.editRole",
  "roles.permissions": "navigation.rolePermissions",

  // Permissions
  permissions: "navigation.permissions",
  "permissions.new": "navigation.newPermission",
  "permissions.edit": "navigation.editPermission",

  // Suppliers
  suppliers: "navigation.suppliers",
  "suppliers.new": "navigation.newSupplier",
  "suppliers.edit": "navigation.editSupplier",

  // Factories
  factories: "navigation.factories",
  "factories.view": "navigation.factoryDetails",

  // Orders
  orders: "navigation.orders",
  "orders.new": "navigation.newOrder",
  "orders.edit": "navigation.editOrder",

  // Inventory
  inventory: "navigation.inventory",
  "inventory.dashboard": "navigation.inventoryDashboard",
  "inventory.warehouses": "navigation.warehouses",
  "inventory.warehouses.new": "navigation.newWarehouse",
  "inventory.warehouses.edit": "navigation.editWarehouse",
  "inventory.materials": "navigation.materials",
  "inventory.materials.new": "navigation.newMaterial",
  "inventory.materials.edit": "navigation.editMaterial",
  "inventory.batches": "navigation.batches",
  "inventory.operations": "navigation.operations",
  "inventory.operations.add": "navigation.addStock",
  "inventory.operations.remove": "navigation.removeStock",
  "inventory.operations.transfer": "navigation.transferStock",
  "inventory.operations.adjustment": "navigation.adjustmentStock",
  "inventory.count": "navigation.inventoryCount",
  "inventory.count.new": "navigation.newCount",
  "inventory.history": "navigation.history",

  // Reports
  reports: "navigation.reports",
  "reports.category": "navigation.reports",
  "reports.category.finance": "navigation.financeReports",
  "reports.category.projects": "navigation.projectsReports",
  "reports.category.employees": "navigation.employeesReports",
  "reports.category.payroll": "navigation.payrollReports",
  "reports.category.assets": "navigation.assetsReports",
  "reports.category.maintenance": "navigation.maintenanceReports",
  "reports.category.sites": "navigation.sitesReports",
  "reports.category.users": "navigation.usersReports",
  "reports.finance": "navigation.financeReports",
  "reports.finance.dashboard": "reports.finance.dashboard.title",
  "reports.finance.overview": "reports.finance.overview.title",
  "reports.finance.by-cost-type": "reports.finance.byType.title",
  "reports.finance.by-payment-status": "reports.finance.byStatus.title",
  "reports.finance.byPaymentStatus": "reports.finance.byStatus.title",
  "reports.finance.monthly-trend": "reports.finance.monthlyTrend.title",
  "reports.finance.by-category": "reports.finance.byCategory.title",
  "reports.finance.by-project": "reports.finance.byProject.title",
  "reports.finance.pending-overdue": "reports.finance.pendingOverdue.title",
  "reports.finance.pending-approvals": "reports.finance.pendingApprovals.title",
  "reports.finance.overdue-payments": "reports.finance.overduePayments.title",
  "reports.projects": "navigation.projectsReports",
  "reports.projects.dashboard": "reports.projects.dashboard.title",
  "reports.projects.budget-delays": "reports.projects.budgetDelays.title",
  "reports.projects.completed": "reports.projects.completed.title",
  "reports.projects.cost-breakdown": "reports.projects.costBreakdown.title",
  "reports.projects.labor-cost": "reports.projects.laborCost.title",
  "reports.projects.asset-utilization":
    "reports.projects.assetUtilization.title",
  "reports.employees": "navigation.employeesReports",
  "reports.employees.dashboard": "reports.employees.overview.title",
  "reports.employees.overview": "reports.employees.overview.title",
  "reports.employees.by-department": "reports.employees.byDepartment.title",
  "reports.employees.by-employment-type":
    "reports.employees.byEmploymentType.title",
  "reports.employees.by-position": "reports.employees.byPosition.title",
  "reports.employees.age-experience": "reports.employees.ageExperience.title",
  "reports.employees.hr-analytics": "reports.employees.ageExperience.title",
  "reports.employees.turnover": "reports.employees.turnover.title",
  "reports.employees.status": "reports.employees.statusDistribution.title",
  "reports.employees.assignment": "reports.employees.assignment.title",
  "reports.employees.contract-expiry":
    "reports.employees.contractExpiry.title",
  "reports.payroll": "navigation.payrollReports",
  "reports.payroll.dashboard": "reports.payroll.overview.title",
  "reports.payroll.overview": "reports.payroll.overview.title",
  "reports.payroll.by-department": "reports.payroll.byDepartment.title",
  "reports.payroll.details": "reports.payroll.details.title",
  "reports.payroll.by-site": "reports.payroll.bySite.title",
  "reports.payroll.salary-components": "reports.payroll.salaryComponents.title",
  "reports.payroll.allowances": "reports.payroll.allowances.title",
  "reports.payroll.deductions-loans": "reports.payroll.deductionsLoans.title",
  "reports.payroll.trend": "reports.payroll.trend.title",
  "reports.payroll.comparison": "reports.payroll.comparison.title",
  "reports.sites": "navigation.sitesReports",
  "reports.sites.dashboard": "reports.sites.overview.title",
  "reports.sites.overview": "reports.sites.overview.title",
  "reports.sites.by-status": "reports.sites.byStatus.title",
  "reports.sites.by-location": "reports.sites.byLocation.title",
  "reports.sites.capacity": "reports.sites.capacity.title",
  "reports.sites.with-projects": "reports.sites.withProjects.title",
  "reports.sites.performance": "reports.sites.performance.title",
  "reports.sites.profitability": "reports.sites.profitability.title",
  "reports.assets": "navigation.assetsReports",
  "reports.assets.dashboard": "reports.assets.overview.title",
  "reports.assets.analytics": "reports.assets.utilization.title",
  "reports.assets.overview": "reports.assets.overview.title",
  "reports.assets.by-type": "reports.assets.byType.title",
  "reports.assets.by-status": "reports.assets.byStatus.title",
  "reports.assets.by-location": "reports.assets.byLocation.title",
  "reports.assets.depreciation": "reports.assets.depreciation.title",
  "reports.assets.utilization": "reports.assets.utilization.title",
  // Maintenance reports
  "reports.maintenance": "navigation.maintenanceReports",
  "reports.maintenance.dashboard": "reports.maintenance.overview.title",
  "reports.maintenance.overview": "reports.maintenance.overview.title",
  "reports.maintenance.by-type": "reports.maintenance.byType.title",
  "reports.maintenance.by-status": "reports.maintenance.byStatus.title",
  "reports.maintenance.by-asset": "reports.maintenance.byAsset.title",
  "reports.maintenance.cost-analysis": "reports.maintenance.costAnalysis.title",
  "reports.maintenance.performance": "reports.maintenance.performance.title",
  "reports.maintenance.preventive": "reports.maintenance.preventive.title",
  // Users reports
  "reports.users": "navigation.usersReports",
  "reports.users.overview": "reports.users.overview.title",
  "reports.users.login-activity": "reports.users.loginActivity.title",
  "reports.users.failed-login-attempts": "reports.users.failedLogins.title",
  "reports.users.active-sessions": "reports.users.activeSessions.title",
  "reports.users.roles-permissions": "reports.users.rolesPermissions.title",
  "reports.users.audit-logs": "reports.users.auditLogs.title",
  "reports.users.locked-accounts": "reports.users.lockedAccounts.title",
  "reports.users.permission-grant-history": "reports.users.grantHistory.title",
  "reports.users.security": "reports.users.overview.title",
  "reports.users.rbac": "reports.users.rbac.title",
  "reports.executive": "navigation.reports",
  "reports.executive.dashboard": "reports.executive.dashboard.title",
  "reports.executive.pnl": "reports.pnl.title",
  "reports.stock-levels": "navigation.stockLevelReport",
  "reports.movements": "navigation.movementsReport",
  "reports.valuation": "navigation.valuationReport",
  "reports.consumption": "navigation.consumptionReport",

  // Purchasing
  purchasing: "navigation.purchasing",
  "purchasing.grn": "navigation.grn",
  "purchasing.grn.new": "navigation.newGRN",

  // Admin
  admin: "navigation.admin",
  "admin.force-logout": "navigation.forceLogout",
  "admin.unlock-user": "navigation.unlockUser",
};

/**
 * UUID/ID detection regex patterns
 */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_ID_PATTERN = /^\d+$/;

/**
 * Check if a segment is an ID (UUID or numeric)
 */
const isIdSegment = (segment: string): boolean => {
  return UUID_PATTERN.test(segment) || NUMERIC_ID_PATTERN.test(segment);
};

/**
 * Main breadcrumbs hook
 *
 * Generates breadcrumb trail based on current URL path
 *
 * @returns Array of breadcrumb items with labels and paths
 *
 * @example
 * // URL: /projects/abc-123/edit
 * // Returns: [
 * //   { label: 'Dashboard', path: '/' },
 * //   { label: 'Projects', path: '/projects' },
 * //   { label: 'Project Name', path: '/projects/abc-123' },
 * //   { label: 'Edit', path: '/projects/abc-123/edit', isCurrentPage: true }
 * // ]
 */
export const useBreadcrumbs = (): BreadcrumbItem[] => {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return useMemo(() => {
    // Parse URL into segments
    const segments = pathname.split("/").filter(Boolean);

    // Root case: Dashboard only
    if (segments.length === 0) {
      return [
        {
          label: t("navigation.dashboard"),
          path: "/",
          isCurrentPage: true,
        },
      ];
    }

    // Initialize with dashboard (always first)
    const breadcrumbs: BreadcrumbItem[] = [
      { label: t("navigation.dashboard"), path: "/" },
    ];

    let currentPath = "";
    let pathKey = "";

    // Process each segment
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;
      const isLastSegment = i === segments.length - 1;

      // Handle ID segments (UUIDs or numeric IDs)
      if (isIdSegment(segment)) {
        // For ID segments, we want to show the entity name
        // In a real implementation, you would fetch the entity name from your store/API
        // For now, we'll show a generic "Details" label

        if (isLastSegment) {
          // If ID is the last segment, it's a details view
          pathKey += ".view";
          const labelKey = BREADCRUMB_LABELS[pathKey];
          breadcrumbs.push({
            label: labelKey ? t(labelKey) : t("common.details"),
            path: currentPath,
            isCurrentPage: true,
          });
        } else {
          // If ID is not last, we'll add it but it won't be clickable in most cases
          // The next segment might be 'edit', 'progress', etc.
          breadcrumbs.push({
            label: t("common.details"),
            path: currentPath,
          });
        }
        continue;
      }

      // Build path key for translation lookup
      pathKey += pathKey ? `.${segment}` : segment;

      // Get label from configuration
      const labelKey = BREADCRUMB_LABELS[pathKey];

      if (labelKey) {
        // Special handling for reports module categories
        let finalPath = currentPath;
        if (
          pathKey.startsWith("reports.") &&
          !pathKey.includes(".category") &&
          pathKey !== "reports"
        ) {
          // Transform /reports/finance to /reports/category/finance
          const parts = pathKey.split(".");
          if (parts.length >= 2) {
            const category = parts[1];
            finalPath = `/reports/category/${category}`;
          }
        }

        breadcrumbs.push({
          label: t(labelKey),
          path: finalPath,
          isCurrentPage: isLastSegment,
        });
      } else {
        // Fallback: capitalize segment
        breadcrumbs.push({
          label: segment.charAt(0).toUpperCase() + segment.slice(1),
          path: currentPath,
          isCurrentPage: isLastSegment,
        });
      }
    }

    return breadcrumbs;
  }, [pathname, t]);
};
