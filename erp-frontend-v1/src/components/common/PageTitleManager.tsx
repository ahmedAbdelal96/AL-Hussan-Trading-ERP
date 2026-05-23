/**
 * PageTitleManager
 */

import { useEffect } from "react";
import { useLocation } from "react-router";
import { useTranslation } from "@/i18n/useTranslation";

const BASE_URL = "https://alhussan.tech";

// ---------------------------------------------------------------
// Static routes - checked first (exact match, fastest path)
// All values are translation keys resolved at runtime via t()
// ---------------------------------------------------------------
const ROUTE_TITLE_KEYS: Record<string, string> = {
  // Dashboard
  "/": "navigation.pageTitles.dashboard",
  "/dashboard": "navigation.pageTitles.dashboard",

  // Employees
  "/employees": "navigation.pageTitles.employees",
  "/employees/dashboard": "navigation.pageTitles.employeesDashboard",
  "/employees/create": "navigation.pageTitles.createEmployee",

  // Assets
  "/assets": "navigation.pageTitles.assets",
  "/assets/dashboard": "navigation.pageTitles.assetsDashboard",
  "/assets/create": "navigation.pageTitles.createAsset",

  // Finance
  "/finance": "navigation.pageTitles.finance",
  "/finance/dashboard": "navigation.pageTitles.financeDashboard",
  "/finance/costs": "navigation.pageTitles.financeCosts",
  "/finance/costs/create": "navigation.pageTitles.createCost",
  "/finance/allocated-costs": "navigation.pageTitles.allocatedCosts",
  "/finance/approvals": "navigation.pageTitles.costApprovals",
  "/finance/categories": "navigation.pageTitles.costCategories",

  // Projects
  "/projects": "navigation.pageTitles.projects",
  "/projects/dashboard": "navigation.pageTitles.projectsDashboard",
  "/projects/create": "navigation.pageTitles.createProject",

  // Sites
  "/sites": "navigation.pageTitles.sites",
  "/sites/dashboard": "navigation.pageTitles.sitesDashboard",
  "/sites/create": "navigation.pageTitles.createSite",
  "/sites/deleted": "navigation.pageTitles.deletedSites",

  // Maintenance
  "/maintenance": "navigation.pageTitles.maintenance",
  "/maintenance/dashboard": "navigation.pageTitles.maintenanceDashboard",
  "/maintenance/create": "navigation.pageTitles.createMaintenance",

  // Payroll
  "/payroll": "navigation.pageTitles.payroll",
  "/payroll/dashboard": "navigation.pageTitles.payrollDashboard",
  "/payroll/process": "navigation.pageTitles.processPayroll",
  "/payroll/payslips": "navigation.pageTitles.payslips",
  "/payroll/allowance-types": "navigation.pageTitles.allowanceTypes",
  "/payroll/allowance-types/create": "navigation.pageTitles.createAllowanceType",
  "/payroll/allowances": "navigation.pageTitles.employeeAllowances",
  "/payroll/deductions": "navigation.pageTitles.employeeDeductions",
  "/payroll/loans": "navigation.pageTitles.employeeLoans",

  // Users
  "/users": "navigation.pageTitles.users",
  "/users/create": "navigation.pageTitles.createUser",
  "/users/deleted": "navigation.pageTitles.deletedUsers",

  // RBAC
  "/rbac": "navigation.pageTitles.rbac",

  // Auth pages
  "/profile": "navigation.pageTitles.profile",
  "/admin/dashboard": "navigation.pageTitles.adminDashboard",
  "/admin/sessions": "navigation.pageTitles.adminSessions",
  "/admin/audit-logs": "navigation.pageTitles.auditLogs",

  // Reports hub
  "/reports": "navigation.pageTitles.reports",

  // Reports - Employees
  "/reports/employees/overview": "navigation.pageTitles.reportEmployeesOverview",
  "/reports/employees/by-department": "navigation.pageTitles.reportEmployeesByDepartment",
  "/reports/employees/by-position": "navigation.pageTitles.reportEmployeesByPosition",
  "/reports/employees/by-employment-type": "navigation.pageTitles.reportEmployeesByType",
  "/reports/employees/status": "navigation.pageTitles.reportEmployeesStatus",
  "/reports/employees/turnover": "navigation.pageTitles.reportEmployeesTurnover",
  "/reports/employees/age-experience": "navigation.pageTitles.reportEmployeesAgeExp",

  // Reports - Assets
  "/reports/assets/overview": "navigation.pageTitles.reportAssetsOverview",
  "/reports/assets/by-status": "navigation.pageTitles.reportAssetsByStatus",
  "/reports/assets/by-type": "navigation.pageTitles.reportAssetsByType",
  "/reports/assets/by-location": "navigation.pageTitles.reportAssetsByLocation",
  "/reports/assets/depreciation": "navigation.pageTitles.reportAssetsDepreciation",
  "/reports/assets/utilization": "navigation.pageTitles.reportAssetsUtilization",

  // Reports - Finance
  "/reports/finance/overview": "navigation.pageTitles.reportFinanceOverview",
  "/reports/finance/by-category": "navigation.pageTitles.reportFinanceByCategory",
  "/reports/finance/by-project": "navigation.pageTitles.reportFinanceByProject",
  "/reports/finance/by-cost-type": "navigation.pageTitles.reportFinanceByCostType",
  "/reports/finance/by-payment-status": "navigation.pageTitles.reportFinanceByPaymentStatus",
  "/reports/finance/monthly-trend": "navigation.pageTitles.reportFinanceMonthlyTrend",
  "/reports/finance/overdue-payments": "navigation.pageTitles.reportFinanceOverdue",
  "/reports/finance/pending-approvals": "navigation.pageTitles.reportFinancePendingApprovals",

  // Reports - Projects
  "/reports/projects/overview": "navigation.pageTitles.reportProjectsOverview",
  "/reports/projects/by-status": "navigation.pageTitles.reportProjectsByStatus",
  "/reports/projects/by-site": "navigation.pageTitles.reportProjectsBySite",
  "/reports/projects/budget-utilization": "navigation.pageTitles.reportProjectsBudget",
  "/reports/projects/delayed": "navigation.pageTitles.reportProjectsDelayed",
  "/reports/projects/timeline-progress": "navigation.pageTitles.reportProjectsTimeline",

  // Reports - Maintenance
  "/reports/maintenance/overview": "navigation.pageTitles.reportMaintenanceOverview",
  "/reports/maintenance/by-status": "navigation.pageTitles.reportMaintenanceByStatus",
  "/reports/maintenance/by-type": "navigation.pageTitles.reportMaintenanceByType",
  "/reports/maintenance/by-asset": "navigation.pageTitles.reportMaintenanceByAsset",
  "/reports/maintenance/cost-analysis": "navigation.pageTitles.reportMaintenanceCost",
  "/reports/maintenance/performance": "navigation.pageTitles.reportMaintenancePerformance",
  "/reports/maintenance/preventive": "navigation.pageTitles.reportMaintenancePreventive",

  // Reports - Payroll
  "/reports/payroll/overview": "navigation.pageTitles.reportPayrollOverview",
  "/reports/payroll/by-department": "navigation.pageTitles.reportPayrollByDepartment",
  "/reports/payroll/by-site": "navigation.pageTitles.reportPayrollBySite",
  "/reports/payroll/comparison": "navigation.pageTitles.reportPayrollComparison",
  "/reports/payroll/trend": "navigation.pageTitles.reportPayrollTrend",
  "/reports/payroll/allowances": "navigation.pageTitles.reportPayrollAllowances",
  "/reports/payroll/deductions-loans": "navigation.pageTitles.reportPayrollDeductionsLoans",
  "/reports/payroll/salary-components": "navigation.pageTitles.reportPayrollComponents",

  // Reports - Sites
  "/reports/sites/by-status": "navigation.pageTitles.reportSitesByStatus",
  "/reports/sites/by-location": "navigation.pageTitles.reportSitesByLocation",
  "/reports/sites/capacity": "navigation.pageTitles.reportSitesCapacity",
  "/reports/sites/overview": "navigation.pageTitles.reportSitesOverview",
  "/reports/sites/performance": "navigation.pageTitles.reportSitesPerformance",
  "/reports/sites/with-projects": "navigation.pageTitles.reportSitesWithProjects",

  // Reports - Users
  "/reports/users/overview": "navigation.pageTitles.reportUsersOverview",
  "/reports/users/active-sessions": "navigation.pageTitles.reportUsersActiveSessions",
  "/reports/users/audit-logs": "navigation.pageTitles.reportUsersAuditLogs",
  "/reports/users/failed-login-attempts": "navigation.pageTitles.reportUsersFailedLogins",
  "/reports/users/locked-accounts": "navigation.pageTitles.reportUsersLockedAccounts",
  "/reports/users/login-activity": "navigation.pageTitles.reportUsersLoginActivity",
  "/reports/users/permission-grant-history": "navigation.pageTitles.reportUsersPermissions",
  "/reports/users/roles-permissions": "navigation.pageTitles.reportUsersRoles",

  // Reports - consolidated pages
  "/reports/finance/dashboard": "reports.finance.dashboard.title",
  "/reports/finance/pending-overdue": "reports.finance.pendingOverdue.title",
  "/reports/finance/tax": "reports.finance.tax.title",
  "/reports/assets/dashboard": "reports.assets.overview.title",
  "/reports/assets/analytics": "reports.assets.utilization.title",
  "/reports/sites/dashboard": "reports.sites.overview.title",
  "/reports/sites/profitability": "reports.sites.profitability.title",
  "/reports/employees/dashboard": "reports.employees.overview.title",
  "/reports/employees/hr-analytics": "reports.employees.ageExperience.title",
  "/reports/employees/assignment": "reports.employees.assignment.title",
  "/reports/employees/contract-expiry": "reports.employees.contractExpiry.title",
  "/reports/projects/dashboard": "reports.projects.dashboard.title",
  "/reports/projects/budget-delays": "reports.projects.budgetDelays.title",
  "/reports/projects/completed": "reports.projects.completed.title",
  "/reports/projects/cost-breakdown": "reports.projects.costBreakdown.title",
  "/reports/projects/labor-cost": "reports.projects.laborCost.title",
  "/reports/projects/asset-utilization": "reports.projects.assetUtilization.title",
  "/reports/executive/dashboard": "reports.executive.dashboard.title",
  "/reports/executive/pnl": "reports.pnl.title",
  "/reports/users/security": "reports.users.overview.title",
  "/reports/users/rbac": "reports.users.rbac.title",
};

// ---------------------------------------------------------------
// Known non-ID path segments - excluded from dynamic :id matching
// ---------------------------------------------------------------
const NON_ID_SEGMENTS =
  /^(dashboard|create|edit|deleted|progress|summary|allocated-costs|approvals|categories|process|payslips|allowance-types|allowances|deductions|loans)$/;

type Translator = (key: string, options?: Record<string, unknown>) => string;

type RobotsValue = "index, follow" | "noindex, nofollow";

interface SeoState {
  title: string;
  description: string;
  canonicalPath: string;
  robots: RobotsValue;
}

function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function upsertMetaTag(
  selector: string,
  attrName: "name" | "property",
  attrValue: string,
  content: string,
) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function upsertCanonical(canonicalUrl: string) {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", "canonical");
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", canonicalUrl);
}

function applySeoState(seo: SeoState) {
  const canonicalUrl = `${BASE_URL}${seo.canonicalPath}`;

  document.title = seo.title;
  upsertMetaTag('meta[name="description"]', "name", "description", seo.description);
  upsertMetaTag('meta[name="robots"]', "name", "robots", seo.robots);
  upsertCanonical(canonicalUrl);

  // Keep social tags aligned with the current page metadata.
  upsertMetaTag('meta[property="og:title"]', "property", "og:title", seo.title);
  upsertMetaTag('meta[property="og:description"]', "property", "og:description", seo.description);
  upsertMetaTag('meta[property="og:url"]', "property", "og:url", canonicalUrl);
  upsertMetaTag('meta[name="twitter:title"]', "name", "twitter:title", seo.title);
  upsertMetaTag('meta[name="twitter:description"]', "name", "twitter:description", seo.description);
}

/**
 * Matches a pathname to a title.
 * Returns the translated title string, or null if no match (caller uses appName).
 */
function resolveTitle(pathname: string, t: Translator): string | null {
  // 1. Exact static match via translation key
  if (ROUTE_TITLE_KEYS[pathname]) {
    return t(ROUTE_TITLE_KEYS[pathname]);
  }

  const seg = (n: number) => pathname.split("/")[n] ?? "";

  // 2. Dynamic patterns - most specific first
  // /finance/costs/projects/:projectId/summary
  if (/^\/finance\/costs\/projects\/[^/]+\/summary$/.test(pathname))
    return t("navigation.pageTitles.projectCostSummary");

  // /finance/costs/edit/:id  or  /finance/costs/:id/edit
  if (/^\/finance\/costs\/edit\/[^/]+$/.test(pathname))
    return t("navigation.pageTitles.editCost");
  if (/^\/finance\/costs\/[^/]+\/edit$/.test(pathname))
    return t("navigation.pageTitles.editCost");
  if (/^\/finance\/costs\/[^/]+$/.test(pathname) && !NON_ID_SEGMENTS.test(seg(3)))
    return t("navigation.pageTitles.costDetails");

  // /employees/edit/:id  or  /employees/:id
  if (/^\/employees\/edit\/[^/]+$/.test(pathname))
    return t("navigation.pageTitles.editEmployee");
  if (/^\/employees\/[^/]+$/.test(pathname) && !NON_ID_SEGMENTS.test(seg(2)))
    return t("navigation.pageTitles.employeeDetails");

  // /assets/edit/:id  or  /assets/:id
  if (/^\/assets\/edit\/[^/]+$/.test(pathname))
    return t("navigation.pageTitles.editAsset");
  if (/^\/assets\/[^/]+$/.test(pathname) && !NON_ID_SEGMENTS.test(seg(2)))
    return t("navigation.pageTitles.assetDetails");

  // /projects/edit/:id  or  /projects/:id/progress  or  /projects/:id
  if (/^\/projects\/edit\/[^/]+$/.test(pathname))
    return t("navigation.pageTitles.editProject");
  if (/^\/projects\/[^/]+\/progress$/.test(pathname))
    return t("navigation.pageTitles.projectProgress");
  if (/^\/projects\/[^/]+$/.test(pathname) && !NON_ID_SEGMENTS.test(seg(2)))
    return t("navigation.pageTitles.projectDetails");

  // /sites/edit/:id  or  /sites/:id
  if (/^\/sites\/edit\/[^/]+$/.test(pathname))
    return t("navigation.pageTitles.editSite");
  if (/^\/sites\/[^/]+$/.test(pathname) && !NON_ID_SEGMENTS.test(seg(2)))
    return t("navigation.pageTitles.siteDetails");

  // /maintenance/edit/:id  or  /maintenance/:id
  if (/^\/maintenance\/edit\/[^/]+$/.test(pathname))
    return t("navigation.pageTitles.editMaintenance");
  if (/^\/maintenance\/[^/]+$/.test(pathname) && !NON_ID_SEGMENTS.test(seg(2)))
    return t("navigation.pageTitles.maintenanceDetails");

  // /payroll/payslips/:id
  if (/^\/payroll\/payslips\/[^/]+$/.test(pathname))
    return t("navigation.pageTitles.payslipDetails");

  // /payroll/allowance-types/edit/:id
  if (/^\/payroll\/allowance-types\/edit\/[^/]+$/.test(pathname))
    return t("navigation.pageTitles.editAllowanceType");

  // /users/edit/:id  or  /users/:id
  if (/^\/users\/edit\/[^/]+$/.test(pathname))
    return t("navigation.pageTitles.editUser");
  if (/^\/users\/[^/]+$/.test(pathname) && !NON_ID_SEGMENTS.test(seg(2)))
    return t("navigation.pageTitles.userDetails");

  return null;
}

function resolveSeoState(pathname: string, title: string, t: Translator): SeoState {
  const normalizedPath = normalizePath(pathname);

  // Sign-in is public and can be indexed as an entry page.
  if (normalizedPath === "/signin" || normalizedPath === "/login") {
    return {
      title,
      description: "سجل الدخول إلى منصة الحصان لإدارة الموارد والتشغيل ومتابعة العمليات المالية والإدارية.",
      canonicalPath: "/signin",
      robots: "index, follow",
    };
  }

  if (normalizedPath === "/") {
    return {
      title,
      description: "نظام الحصان ERP لإدارة الموارد والتشغيل داخل المؤسسة مع متابعة دقيقة للمهام والبيانات.",
      canonicalPath: "/",
      robots: "noindex, nofollow",
    };
  }

  // Most app routes are private business pages and should not be indexed.
  return {
    title,
    description: t("navigation.pageTitles.appName"),
    canonicalPath: normalizedPath,
    robots: "noindex, nofollow",
  };
}

export function PageTitleManager() {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const appName = t("navigation.pageTitles.appName");
    const pageTitle = resolveTitle(pathname, t);
    const fullTitle = pageTitle ? `${pageTitle} | ${appName}` : appName;

    const seoState = resolveSeoState(pathname, fullTitle, t);
    applySeoState(seoState);
  }, [pathname, t]);

  return null;
}
