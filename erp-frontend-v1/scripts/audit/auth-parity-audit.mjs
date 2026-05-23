#!/usr/bin/env node

/**
 * Frontend Auth Parity Audit
 * -----------------------------------------------------------------------------
 * Checks parity between:
 * 1) Backend @Auth manifest (source of truth)
 * 2) Frontend route guards
 * 3) Frontend sidebar visibility permissions
 *
 * Output:
 * - scripts/audit/results/auth-parity-report.json
 * - scripts/audit/results/auth-parity-report.md
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const RESULTS_DIR = path.join(ROOT, "scripts", "audit", "results");
const BACKEND_MANIFEST = path.join(RESULTS_DIR, "backend-auth-manifest.json");
const OUTPUT_JSON = path.join(RESULTS_DIR, "auth-parity-report.json");
const OUTPUT_MD = path.join(RESULTS_DIR, "auth-parity-report.md");

const PERMISSIONS_FILE = path.join(
  ROOT,
  "src",
  "config",
  "permissions.constants.ts",
);
const REPORT_ACCESS_FILE = path.join(
  ROOT,
  "src",
  "config",
  "reports-access.constants.ts",
);
const SIDEBAR_FILE = path.join(ROOT, "src", "components", "layout", "AppSidebar.tsx");

const ROUTE_FILES = {
  employees: path.join(ROOT, "src", "routes", "employees.routes.tsx"),
  sites: path.join(ROOT, "src", "routes", "sites.routes.tsx"),
  projects: path.join(ROOT, "src", "routes", "projects.routes.tsx"),
  assets: path.join(ROOT, "src", "routes", "assets.routes.tsx"),
  maintenance: path.join(ROOT, "src", "routes", "maintenance.routes.tsx"),
  finance: path.join(ROOT, "src", "routes", "finance.routes.tsx"),
  payroll: path.join(ROOT, "src", "routes", "payroll.routes.tsx"),
  users: path.join(ROOT, "src", "routes", "users.routes.tsx"),
  rbac: path.join(ROOT, "src", "routes", "rbac.routes.tsx"),
  reports: path.join(ROOT, "src", "routes", "reports.routes.tsx"),
  auth: path.join(ROOT, "src", "routes", "auth.routes.tsx"),
};

/**
 * Curated UI entries that should stay aligned with backend auth.
 * This list intentionally covers security-sensitive navigation entry points.
 */
const ACCESS_MATRIX = [
  {
    key: "employees.list",
    sidebarPath: "/employees",
    routeFileKey: "employees",
    routePathHint: 'path: "employees"',
    expectedToken: "PERMISSIONS.EMPLOYEE_READ",
    backendPrefix: "/employees",
  },
  {
    key: "sites.list",
    sidebarPath: "/sites",
    routeFileKey: "sites",
    routePathHint: 'path: "sites"',
    expectedToken: "PERMISSIONS.SITE_READ",
    backendPrefix: "/sites",
  },
  {
    key: "projects.list",
    sidebarPath: "/projects",
    routeFileKey: "projects",
    routePathHint: 'path: "projects"',
    expectedToken: "PERMISSIONS.PROJECT_READ",
    backendPrefix: "/projects",
  },
  {
    key: "assets.list",
    sidebarPath: "/assets",
    routeFileKey: "assets",
    routePathHint: 'path: "assets"',
    expectedToken: "PERMISSIONS.ASSET_READ",
    backendPrefix: "/assets",
  },
  {
    key: "maintenance.list",
    sidebarPath: "/maintenance",
    routeFileKey: "maintenance",
    routePathHint: 'path: "maintenance"',
    expectedToken: "PERMISSIONS.MAINTENANCE_READ",
    backendPrefix: "/maintenance",
  },
  {
    key: "finance.dashboard",
    sidebarPath: "/finance",
    routeFileKey: "finance",
    routePathHint: 'path: "finance"',
    expectedToken: "PERMISSIONS.FINANCE_READ",
    backendPrefix: "/finance",
  },
  {
    key: "payroll.dashboard",
    sidebarPath: "/payroll",
    routeFileKey: "payroll",
    routePathHint: 'path: "payroll"',
    expectedToken: "PERMISSIONS.PAYROLL_READ",
    backendPrefix: "/payroll",
  },
  {
    key: "users.list",
    sidebarPath: "/users",
    routeFileKey: "users",
    routePathHint: 'path: "users"',
    expectedToken: "PERMISSIONS.USER_READ",
    backendPrefix: "/users",
  },
  {
    key: "rbac",
    sidebarPath: "/rbac",
    routeFileKey: "rbac",
    routePathHint: 'path: "rbac"',
    expectedToken: null, // Critical route is role-gated (SUPERADMIN/IT_ADMIN)
    backendPrefix: "/rbac",
  },
  {
    key: "admin.auditLogs",
    sidebarPath: "/admin/audit-logs",
    routeFileKey: "auth",
    routePathHint: 'path: "/admin/audit-logs"',
    expectedToken: null, // Backend uses role-based access for this endpoint.
    backendPrefix: "/auth",
  },
  {
    key: "reports.category.finance",
    sidebarPath: "/reports/category/finance",
    routeFileKey: "reports",
    routePathHint: 'path: "finance/dashboard"',
    expectedToken: "REPORT_CATEGORY_PERMISSIONS.finance",
    backendPrefix: "/reports/finance",
  },
  {
    key: "reports.category.projects",
    sidebarPath: "/reports/category/projects",
    routeFileKey: "reports",
    routePathHint: 'path: "projects/dashboard"',
    expectedToken: "REPORT_CATEGORY_PERMISSIONS.projects",
    backendPrefix: "/reports/projects",
  },
  {
    key: "reports.category.employees",
    sidebarPath: "/reports/category/employees",
    routeFileKey: "reports",
    routePathHint: 'path: "employees/dashboard"',
    expectedToken: "REPORT_CATEGORY_PERMISSIONS.employees",
    backendPrefix: "/reports/employees",
  },
  {
    key: "reports.category.payroll",
    sidebarPath: "/reports/category/payroll",
    routeFileKey: "reports",
    routePathHint: 'path: "payroll/dashboard"',
    expectedToken: "REPORT_CATEGORY_PERMISSIONS.payroll",
    backendPrefix: "/reports/payroll",
  },
  {
    key: "reports.category.sites",
    sidebarPath: "/reports/category/sites",
    routeFileKey: "reports",
    routePathHint: 'path: "sites/dashboard"',
    expectedToken: "REPORT_CATEGORY_PERMISSIONS.sites",
    backendPrefix: "/reports/sites",
  },
  {
    key: "reports.category.assets",
    sidebarPath: "/reports/category/assets",
    routeFileKey: "reports",
    routePathHint: 'path: "assets/dashboard"',
    expectedToken: "REPORT_CATEGORY_PERMISSIONS.assets",
    backendPrefix: "/reports/assets",
  },
  {
    key: "reports.category.maintenance",
    sidebarPath: "/reports/category/maintenance",
    routeFileKey: "reports",
    routePathHint: 'path: "maintenance/dashboard"',
    expectedToken: "REPORT_CATEGORY_PERMISSIONS.maintenance",
    backendPrefix: "/reports/maintenance",
  },
  {
    key: "reports.category.users",
    sidebarPath: "/reports/category/users",
    routeFileKey: "reports",
    routePathHint: 'path: "users/security"',
    expectedToken: "REPORT_CATEGORY_PERMISSIONS.users",
    backendPrefix: "/reports/users",
  },
  {
    key: "reports.category.executive",
    sidebarPath: "/reports/category/executive",
    routeFileKey: "reports",
    routePathHint: 'path: "executive/dashboard"',
    expectedToken: "REPORT_CATEGORY_PERMISSIONS.executive",
    backendPrefix: "/reports/executive",
  },
];

function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function ensureExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${description}: ${filePath}`);
  }
}

function parsePermissionConstants(source) {
  const permissions = {};
  const bodyMatch = source.match(/export const PERMISSIONS = \{([\s\S]*?)\}\s+as const;/);
  if (!bodyMatch) return permissions;
  for (const m of bodyMatch[1].matchAll(/([A-Z0-9_]+)\s*:\s*['"`]([^'"`]+)['"`]/g)) {
    permissions[m[1]] = m[2];
  }
  return permissions;
}

function parseReportAccessConstants(source) {
  const mapping = {};
  const bodyMatch = source.match(
    /export const REPORT_CATEGORY_PERMISSIONS = \{([\s\S]*?)\}\s+as const;/,
  );
  if (!bodyMatch) return mapping;
  for (const m of bodyMatch[1].matchAll(/([a-z]+)\s*:\s*([A-Za-z0-9_.]+)/g)) {
    mapping[m[1]] = m[2];
  }
  return mapping;
}

function resolveToken(token, permissionsMap, reportCategoryMap) {
  if (!token) return null;
  if (token.startsWith("PERMISSIONS.")) {
    const key = token.split(".")[1];
    return permissionsMap[key] ?? null;
  }
  if (token.startsWith("REPORT_CATEGORY_PERMISSIONS.")) {
    const category = token.split(".")[1];
    const delegated = reportCategoryMap[category];
    if (!delegated) return null;
    return resolveToken(delegated, permissionsMap, reportCategoryMap);
  }
  // Already resolved literal
  return token;
}

function parseSidebarPathPermissions(source) {
  const map = new Map();
  const regex = /path:\s*"([^"]+)"[\s\S]{0,240}?permissions:\s*\[([^\]]*)\]/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const uiPath = match[1];
    const rawPermissions = match[2];
    const tokens = [...rawPermissions.matchAll(/([A-Za-z0-9_.]+)/g)]
      .map((m) => m[1])
      .filter((v) => v.includes("."));
    map.set(uiPath, tokens);
  }
  return map;
}

function buildBackendPermissionIndex(manifest) {
  const index = new Map();
  const roleOnlyPrefixes = new Set();
  for (const endpoint of manifest.endpoints ?? []) {
    const route = endpoint.route || "";
    const auth = endpoint.auth || {};
    const perms = Array.isArray(auth.permissions) ? auth.permissions : [];
    const roles = Array.isArray(auth.roles) ? auth.roles : [];
    if (!route) continue;

    // Prefix buckets: /module or /reports/category
    const parts = route.split("/").filter(Boolean);
    let prefix = "";
    if (parts[0] === "reports" && parts[1]) {
      prefix = `/${parts[0]}/${parts[1]}`;
    } else if (parts[0]) {
      prefix = `/${parts[0]}`;
    }
    if (!prefix) continue;

    const set = index.get(prefix) ?? new Set();
    perms.forEach((p) => set.add(p));
    index.set(prefix, set);

    if (perms.length === 0 && roles.length > 0) {
      roleOnlyPrefixes.add(prefix);
    }
  }
  return { permissionIndex: index, roleOnlyPrefixes };
}

function hasTokenInRouteFile(routeSource, routePathHint, token) {
  if (!routeSource.includes(routePathHint)) return false;
  return routeSource.includes(token);
}

function severityRank(level) {
  if (level === "BLOCKER") return 4;
  if (level === "HIGH") return 3;
  if (level === "MEDIUM") return 2;
  return 1;
}

function generateMarkdown(report) {
  const lines = [];
  lines.push("# Auth Parity Report");
  lines.push("");
  lines.push(`Generated at: ${report.generatedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Checks: ${report.summary.totalChecks}`);
  lines.push(`- Passed: ${report.summary.passedChecks}`);
  lines.push(`- Issues: ${report.summary.issues}`);
  lines.push(`- Blockers: ${report.summary.blockers}`);
  lines.push(`- High: ${report.summary.high}`);
  lines.push(`- Medium: ${report.summary.medium}`);
  lines.push("");

  if (report.issues.length === 0) {
    lines.push("No auth parity issues detected.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("## Issues");
  lines.push("");
  for (const issue of report.issues) {
    lines.push(`### [${issue.severity}] ${issue.key}`);
    lines.push(`- Message: ${issue.message}`);
    if (issue.sidebarPath) lines.push(`- Sidebar path: \`${issue.sidebarPath}\``);
    if (issue.routeFile) lines.push(`- Route file: \`${issue.routeFile}\``);
    if (issue.backendPrefix) lines.push(`- Backend prefix: \`${issue.backendPrefix}\``);
    lines.push("");
  }

  return lines.join("\n");
}

function main() {
  ensureExists(BACKEND_MANIFEST, "backend auth manifest");
  ensureExists(PERMISSIONS_FILE, "frontend permissions constants");
  ensureExists(REPORT_ACCESS_FILE, "frontend report access constants");
  ensureExists(SIDEBAR_FILE, "sidebar file");

  const backendManifest = JSON.parse(readUtf8(BACKEND_MANIFEST));
  const permissionsMap = parsePermissionConstants(readUtf8(PERMISSIONS_FILE));
  const reportCategoryMap = parseReportAccessConstants(readUtf8(REPORT_ACCESS_FILE));
  const sidebarSource = readUtf8(SIDEBAR_FILE);
  const sidebarMap = parseSidebarPathPermissions(sidebarSource);
  const { permissionIndex: backendIndex, roleOnlyPrefixes } =
    buildBackendPermissionIndex(backendManifest);

  const issues = [];
  const checks = [];

  for (const entry of ACCESS_MATRIX) {
    const expectedPermission = resolveToken(
      entry.expectedToken,
      permissionsMap,
      reportCategoryMap,
    );

    const routeFilePath = ROUTE_FILES[entry.routeFileKey];
    const routeFileExists = !!routeFilePath && fs.existsSync(routeFilePath);
    const routeSource = routeFileExists ? readUtf8(routeFilePath) : "";

    const routeHasExpected = !entry.expectedToken
      ? routeFileExists && routeSource.includes(entry.routePathHint)
      : routeFileExists
        ? hasTokenInRouteFile(routeSource, entry.routePathHint, entry.expectedToken)
        : false;

    const sidebarTokens = sidebarMap.get(entry.sidebarPath) ?? [];
    const sidebarResolved = sidebarTokens
      .map((token) => resolveToken(token, permissionsMap, reportCategoryMap))
      .filter(Boolean);
    const sidebarHasExpected = !entry.expectedToken
      ? sidebarSource.includes(`path: "${entry.sidebarPath}"`)
      : expectedPermission
      ? sidebarResolved.includes(expectedPermission)
      : false;

    const backendPermissions = [...(backendIndex.get(entry.backendPrefix) ?? new Set())];
    const backendHasExpected = !entry.expectedToken
      ? backendPermissions.length > 0 || roleOnlyPrefixes.has(entry.backendPrefix)
      : expectedPermission
      ? backendPermissions.includes(expectedPermission)
      : false;

    checks.push({
      key: entry.key,
      expectedPermission,
      routeHasExpected,
      sidebarHasExpected,
      backendHasExpected,
    });

    if (!routeHasExpected) {
      issues.push({
        severity: "HIGH",
        key: entry.key,
        message: `Route guard hint "${entry.routePathHint}" does not expose expected token "${entry.expectedToken}".`,
        routeFile: path.relative(ROOT, routeFilePath).replaceAll("\\", "/"),
        sidebarPath: entry.sidebarPath,
        backendPrefix: entry.backendPrefix,
      });
    }

    if (!sidebarHasExpected) {
      const sidebarMessage = entry.expectedToken
        ? `Sidebar item does not include expected permission "${expectedPermission}".`
        : "Sidebar item not found.";
      issues.push({
        severity: "HIGH",
        key: entry.key,
        message: sidebarMessage,
        routeFile: path.relative(ROOT, routeFilePath).replaceAll("\\", "/"),
        sidebarPath: entry.sidebarPath,
        backendPrefix: entry.backendPrefix,
      });
    }

    if (!backendHasExpected) {
      const backendIsRoleOnly = roleOnlyPrefixes.has(entry.backendPrefix);
      if (backendIsRoleOnly) {
        issues.push({
          severity: "MEDIUM",
          key: entry.key,
          message: `Backend endpoints under "${entry.backendPrefix}" are role-based only (no explicit permissions). Frontend expects "${expectedPermission}" as extra guard.`,
          routeFile: path.relative(ROOT, routeFilePath).replaceAll("\\", "/"),
          sidebarPath: entry.sidebarPath,
          backendPrefix: entry.backendPrefix,
        });
        continue;
      }

      issues.push({
        severity: "BLOCKER",
        key: entry.key,
        message: `Expected permission "${expectedPermission}" not found in backend @Auth endpoints under "${entry.backendPrefix}".`,
        routeFile: path.relative(ROOT, routeFilePath).replaceAll("\\", "/"),
        sidebarPath: entry.sidebarPath,
        backendPrefix: entry.backendPrefix,
      });
    }
  }

  issues.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

  const summary = {
    totalChecks: checks.length,
    passedChecks: checks.filter(
      (c) => c.routeHasExpected && c.sidebarHasExpected && c.backendHasExpected,
    ).length,
    issues: issues.length,
    blockers: issues.filter((i) => i.severity === "BLOCKER").length,
    high: issues.filter((i) => i.severity === "HIGH").length,
    medium: issues.filter((i) => i.severity === "MEDIUM").length,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    inputs: {
      backendManifest: path.relative(ROOT, BACKEND_MANIFEST).replaceAll("\\", "/"),
      sidebarFile: path.relative(ROOT, SIDEBAR_FILE).replaceAll("\\", "/"),
    },
    summary,
    checks,
    issues,
  };

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(OUTPUT_MD, generateMarkdown(report), "utf8");

  console.log("Auth parity audit completed.");
  console.log(`JSON: ${path.relative(ROOT, OUTPUT_JSON).replaceAll("\\", "/")}`);
  console.log(`MD  : ${path.relative(ROOT, OUTPUT_MD).replaceAll("\\", "/")}`);
  console.log(
    `Summary: checks=${summary.totalChecks}, passed=${summary.passedChecks}, issues=${summary.issues}, blockers=${summary.blockers}, high=${summary.high}`,
  );

  if (summary.blockers > 0 || summary.high > 0) {
    process.exit(1);
  }
}

main();
