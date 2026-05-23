#!/usr/bin/env node

/**
 * Full coverage frontend auth audit
 * -----------------------------------------------------------------------------
 * Scope:
 * - All sidebar paths (except dividers/auth-only UI pages)
 * - Route module guards in src/routes/*.tsx
 * - Backend permission existence via backend-auth-manifest.json
 *
 * Goal:
 * Ensure route guards + sidebar visibility follow the same permission policy.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const RESULTS_DIR = path.join(ROOT, "scripts", "audit", "results");

const SIDEBAR_FILE = path.join(ROOT, "src", "components", "layout", "AppSidebar.tsx");
const ROUTES_DIR = path.join(ROOT, "src", "routes");
const PERMISSIONS_FILE = path.join(ROOT, "src", "config", "permissions.constants.ts");
const REPORT_ACCESS_FILE = path.join(ROOT, "src", "config", "reports-access.constants.ts");
const BACKEND_MANIFEST_FILE = path.join(RESULTS_DIR, "backend-auth-manifest.json");

const OUTPUT_JSON = path.join(RESULTS_DIR, "auth-full-coverage-report.json");
const OUTPUT_MD = path.join(RESULTS_DIR, "auth-full-coverage-report.md");

const ROUTE_FILE_BY_PREFIX = {
  "/employees": "employees.routes.tsx",
  "/sites": "sites.routes.tsx",
  "/projects": "projects.routes.tsx",
  "/assets": "assets.routes.tsx",
  "/maintenance": "maintenance.routes.tsx",
  "/finance": "finance.routes.tsx",
  "/payroll": "payroll.routes.tsx",
  "/reports": "reports.routes.tsx",
  "/users": "users.routes.tsx",
  "/rbac": "rbac.routes.tsx",
  "/admin": "auth.routes.tsx",
  "/profile": "auth.routes.tsx",
};

function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function ensureExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${label}: ${filePath}`);
  }
}

function parsePermissionConstants(source) {
  const map = {};
  const bodyMatch = source.match(/export const PERMISSIONS = \{([\s\S]*?)\}\s+as const;/);
  if (!bodyMatch) return map;
  for (const m of bodyMatch[1].matchAll(/([A-Z0-9_]+)\s*:\s*['"`]([^'"`]+)['"`]/g)) {
    map[m[1]] = m[2];
  }
  return map;
}

function parseReportCategoryPermissions(source) {
  const map = {};
  const bodyMatch = source.match(
    /export const REPORT_CATEGORY_PERMISSIONS = \{([\s\S]*?)\}\s+as const;/,
  );
  if (!bodyMatch) return map;
  for (const m of bodyMatch[1].matchAll(/([a-z]+)\s*:\s*([A-Za-z0-9_.]+)/g)) {
    map[m[1]] = m[2];
  }
  return map;
}

function resolvePermissionToken(token, permissionsMap, reportMap) {
  if (!token) return null;
  if (token.startsWith("PERMISSIONS.")) {
    const k = token.split(".")[1];
    return permissionsMap[k] ?? null;
  }
  if (token.startsWith("REPORT_CATEGORY_PERMISSIONS.")) {
    const category = token.split(".")[1];
    const delegated = reportMap[category];
    if (!delegated) return null;
    return resolvePermissionToken(delegated, permissionsMap, reportMap);
  }
  return token;
}

function getObjectSlice(source, pathIndex) {
  const startHint = source.lastIndexOf("{", pathIndex);
  if (startHint < 0) return source.slice(Math.max(0, pathIndex - 240), pathIndex + 240);

  let depth = 0;
  for (let i = startHint; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startHint, i + 1);
      }
    }
    if (i - startHint > 1600) break;
  }
  return source.slice(Math.max(0, pathIndex - 240), pathIndex + 240);
}

function parseSidebarEntries(source) {
  const entries = [];
  const pathRegex = /path:\s*"([^"]+)"/g;
  let m;
  while ((m = pathRegex.exec(source)) !== null) {
    const uiPath = m[1];
    if (!uiPath || uiPath === "") continue;
    const slice = getObjectSlice(source, m.index);

    const permissionTokens = [...slice.matchAll(/(PERMISSIONS\.[A-Z0-9_]+|REPORT_CATEGORY_PERMISSIONS\.[a-z]+)/g)]
      .map((x) => x[1]);
    const roleTokens = [...slice.matchAll(/SYSTEM_ROLES\.[A-Z0-9_]+/g)].map((x) => x[0]);

    entries.push({
      path: uiPath,
      permissionTokens: [...new Set(permissionTokens)],
      roleTokens: [...new Set(roleTokens)],
    });
  }
  return entries;
}

function backendPermissionIndex(manifest) {
  const index = new Map();
  for (const ep of manifest.endpoints ?? []) {
    const route = ep.route || "";
    if (!route.startsWith("/")) continue;
    const parts = route.split("/").filter(Boolean);
    if (parts.length === 0) continue;
    const prefix =
      parts[0] === "reports" && parts[1]
        ? `/reports/${parts[1]}`
        : `/${parts[0]}`;
    const set = index.get(prefix) ?? new Set();
    const perms = Array.isArray(ep.auth?.permissions) ? ep.auth.permissions : [];
    perms.forEach((p) => set.add(p));
    index.set(prefix, set);
  }
  return index;
}

function findPrefix(pathname) {
  const candidates = Object.keys(ROUTE_FILE_BY_PREFIX).sort(
    (a, b) => b.length - a.length,
  );
  return candidates.find((p) => pathname === p || pathname.startsWith(`${p}/`)) ?? null;
}

function routeSourceHasPath(routeSource, pathname, prefix) {
  if (!routeSource) return false;
  if (routeSource.includes(`path: "${pathname}"`)) return true;
  const withoutSlash = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  if (routeSource.includes(`path: "${withoutSlash}"`)) return true;
  if (!prefix || !pathname.startsWith(`${prefix}/`)) return false;

  const nestedPath = pathname.slice(prefix.length + 1);
  return routeSource.includes(`path: "${nestedPath}"`);
}

function inferExpectedToken(pathname) {
  // Auth-only pages
  if (pathname === "/profile") return { kind: "auth-only", token: null };

  // Admin pages currently role-based in backend
  if (pathname.startsWith("/admin/")) return { kind: "roles-only", token: null };
  if (pathname === "/rbac") return { kind: "roles-only", token: null };
  if (pathname === "/users/deleted") return { kind: "roles-only", token: null };

  if (pathname === "/reports") return { kind: "permission", token: "PERMISSIONS.REPORT_READ" };

  const categoryMatch = pathname.match(/^\/reports\/category\/([a-z]+)$/);
  if (categoryMatch) {
    return {
      kind: "permission",
      token: `REPORT_CATEGORY_PERMISSIONS.${categoryMatch[1]}`,
    };
  }

  if (pathname === "/finance/approvals") {
    return { kind: "permission", token: "PERMISSIONS.FINANCE_APPROVE" };
  }
  if (pathname === "/payroll/process") {
    return { kind: "permission", token: "PERMISSIONS.PAYROLL_PROCESS" };
  }

  const prefix = findPrefix(pathname);
  if (!prefix) return { kind: "unknown", token: null };

  const byPrefix = {
    "/employees": "PERMISSIONS.EMPLOYEE_READ",
    "/sites": "PERMISSIONS.SITE_READ",
    "/projects": "PERMISSIONS.PROJECT_READ",
    "/assets": "PERMISSIONS.ASSET_READ",
    "/maintenance": "PERMISSIONS.MAINTENANCE_READ",
    "/finance": "PERMISSIONS.FINANCE_READ",
    "/payroll": "PERMISSIONS.PAYROLL_READ",
    "/users": "PERMISSIONS.USER_READ",
    "/rbac": "PERMISSIONS.RBAC_READ",
  };

  if (prefix in byPrefix) {
    return { kind: "permission", token: byPrefix[prefix] };
  }

  return { kind: "unknown", token: null };
}

function routeFileContainsToken(routeFileSource, token) {
  if (!token) return true;
  return routeFileSource.includes(token);
}

function toMd(report) {
  const lines = [];
  lines.push("# Auth Full Coverage Report");
  lines.push("");
  lines.push(`Generated at: ${report.generatedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Sidebar entries checked: ${report.summary.checked}`);
  lines.push(`- Passed: ${report.summary.passed}`);
  lines.push(`- Issues: ${report.summary.issues}`);
  lines.push(`- Blockers: ${report.summary.blockers}`);
  lines.push(`- High: ${report.summary.high}`);
  lines.push(`- Medium: ${report.summary.medium}`);
  lines.push("");

  if (report.issues.length === 0) {
    lines.push("No issues found.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("## Issues");
  lines.push("");
  for (const issue of report.issues) {
    lines.push(`### [${issue.severity}] ${issue.path}`);
    lines.push(`- ${issue.message}`);
    if (issue.routeFile) lines.push(`- Route file: \`${issue.routeFile}\``);
    if (issue.expectedPermission) {
      lines.push(`- Expected permission: \`${issue.expectedPermission}\``);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function severityWeight(s) {
  if (s === "BLOCKER") return 3;
  if (s === "HIGH") return 2;
  return 1;
}

function main() {
  ensureExists(SIDEBAR_FILE, "sidebar file");
  ensureExists(PERMISSIONS_FILE, "permissions constants");
  ensureExists(REPORT_ACCESS_FILE, "report access constants");
  ensureExists(BACKEND_MANIFEST_FILE, "backend auth manifest");

  const sidebarSource = readUtf8(SIDEBAR_FILE);
  const permissionsMap = parsePermissionConstants(readUtf8(PERMISSIONS_FILE));
  const reportMap = parseReportCategoryPermissions(readUtf8(REPORT_ACCESS_FILE));
  const backendManifest = JSON.parse(readUtf8(BACKEND_MANIFEST_FILE));
  const backendIndex = backendPermissionIndex(backendManifest);

  const sidebarEntries = parseSidebarEntries(sidebarSource)
    .filter((e) => !["", "/", "/signin", "/login"].includes(e.path))
    .filter((e) => !e.path.startsWith("http"));

  const routeSources = {};
  for (const fileName of new Set(Object.values(ROUTE_FILE_BY_PREFIX))) {
    const filePath = path.join(ROUTES_DIR, fileName);
    routeSources[fileName] = fs.existsSync(filePath) ? readUtf8(filePath) : "";
  }

  const issues = [];
  const checks = [];

  for (const entry of sidebarEntries) {
    const expectation = inferExpectedToken(entry.path);
    const prefix = findPrefix(entry.path);
    const routeFile = prefix ? ROUTE_FILE_BY_PREFIX[prefix] : null;
    const routeSource = routeFile ? routeSources[routeFile] : "";

    const resolvedSidebarPermissions = entry.permissionTokens
      .map((t) => resolvePermissionToken(t, permissionsMap, reportMap))
      .filter(Boolean);

    const resolvedExpected = resolvePermissionToken(
      expectation.token,
      permissionsMap,
      reportMap,
    );

    let routeOk = true;
    let sidebarOk = true;
    let backendOk = true;

    if (expectation.kind === "permission") {
      routeOk = routeFile ? routeFileContainsToken(routeSource, expectation.token) : false;
      sidebarOk = resolvedExpected
        ? resolvedSidebarPermissions.includes(resolvedExpected)
        : false;

      // Backend check for module prefixes with API backing
      if (entry.path !== "/reports" && !entry.path.startsWith("/reports/category/")) {
        if (prefix) {
          const backendPrefix = prefix;
          const backendPerms = [...(backendIndex.get(backendPrefix) ?? new Set())];
          backendOk = resolvedExpected ? backendPerms.includes(resolvedExpected) : true;
        }
      } else if (entry.path.startsWith("/reports/category/")) {
        const cat = entry.path.split("/").pop();
        const backendPrefix = `/reports/${cat}`;
        const backendPerms = [...(backendIndex.get(backendPrefix) ?? new Set())];
        backendOk = resolvedExpected ? backendPerms.includes(resolvedExpected) : true;
      } else {
        // /reports hub is frontend-only aggregation
        backendOk = true;
      }
    } else if (expectation.kind === "roles-only") {
      // must have roles present on sidebar entry and route file should include path
      sidebarOk = entry.roleTokens.length > 0;
      routeOk = routeFile ? routeSourceHasPath(routeSource, entry.path, prefix) : false;
      backendOk = true;
    } else if (expectation.kind === "auth-only") {
      sidebarOk = true;
      routeOk = routeFile ? routeSourceHasPath(routeSource, entry.path, prefix) : false;
      backendOk = true;
    } else {
      // Unknown mapping -> medium issue
      routeOk = !!routeFile;
      sidebarOk = true;
      backendOk = true;
      issues.push({
        severity: "MEDIUM",
        path: entry.path,
        routeFile,
        message: "No expected permission rule for this path. Add explicit mapping.",
      });
    }

    checks.push({
      path: entry.path,
      expectedKind: expectation.kind,
      expectedToken: expectation.token,
      routeFile,
      routeOk,
      sidebarOk,
      backendOk,
    });

    if (!routeOk) {
      issues.push({
        severity: "HIGH",
        path: entry.path,
        routeFile,
        expectedPermission: resolvedExpected,
        message: "Route file does not expose expected guard/path policy.",
      });
    }
    if (!sidebarOk) {
      issues.push({
        severity: "HIGH",
        path: entry.path,
        routeFile,
        expectedPermission: resolvedExpected,
        message: "Sidebar item does not expose expected roles/permissions.",
      });
    }
    if (!backendOk) {
      issues.push({
        severity: "BLOCKER",
        path: entry.path,
        routeFile,
        expectedPermission: resolvedExpected,
        message: "Expected permission is not present in backend @Auth endpoints.",
      });
    }
  }

  issues.sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity));

  const summary = {
    checked: checks.length,
    passed: checks.filter((c) => c.routeOk && c.sidebarOk && c.backendOk).length,
    issues: issues.length,
    blockers: issues.filter((i) => i.severity === "BLOCKER").length,
    high: issues.filter((i) => i.severity === "HIGH").length,
    medium: issues.filter((i) => i.severity === "MEDIUM").length,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    checks,
    issues,
  };

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(OUTPUT_MD, toMd(report), "utf8");

  console.log("Auth full coverage audit completed.");
  console.log(`JSON: ${path.relative(ROOT, OUTPUT_JSON).replaceAll("\\", "/")}`);
  console.log(`MD  : ${path.relative(ROOT, OUTPUT_MD).replaceAll("\\", "/")}`);
  console.log(
    `Summary: checked=${summary.checked}, passed=${summary.passed}, issues=${summary.issues}, blockers=${summary.blockers}, high=${summary.high}`,
  );

  if (summary.blockers > 0 || summary.high > 0) {
    process.exit(1);
  }
}

main();
