#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const RESULTS_DIR = path.join(ROOT, "scripts", "audit", "results");
const OUTPUT_JSON = path.join(RESULTS_DIR, "ui-action-permission-report.json");
const OUTPUT_MD = path.join(RESULTS_DIR, "ui-action-permission-report.md");

const CHECKS = [
  {
    file: "src/pages/projects/ProjectsListPage.tsx",
    tokens: ["PERMISSIONS.PROJECT_WRITE"],
  },
  {
    file: "src/features/projects/components/ProjectActions.tsx",
    tokens: ["PERMISSIONS.PROJECT_WRITE", "PERMISSIONS.PROJECT_DELETE"],
  },
  {
    file: "src/pages/sites/SitesListPage.tsx",
    tokens: ["PERMISSIONS.SITE_WRITE", "PERMISSIONS.SITE_DELETE"],
  },
  {
    file: "src/features/sites/components/SiteActions.tsx",
    tokens: ["PERMISSIONS.SITE_WRITE", "PERMISSIONS.SITE_DELETE"],
  },
  {
    file: "src/pages/users/UsersListPage.tsx",
    tokens: ["PERMISSIONS.USER_WRITE", "PERMISSIONS.USER_DELETE"],
  },
  {
    file: "src/features/users/components/UserActions.tsx",
    tokens: [
      "PERMISSIONS.USER_WRITE",
      "PERMISSIONS.USER_DELETE",
      "PERMISSIONS.USER_RESET_PASSWORD",
    ],
  },
  {
    file: "src/pages/employees/EmployeesListPage.tsx",
    tokens: ["PERMISSIONS.EMPLOYEE_WRITE"],
  },
  {
    file: "src/features/employees/components/EmployeeActions.tsx",
    tokens: ["PERMISSIONS.EMPLOYEE_WRITE", "PERMISSIONS.EMPLOYEE_DELETE"],
  },
  {
    file: "src/pages/assets/AssetsListPage.tsx",
    tokens: ["PERMISSIONS.ASSET_WRITE"],
  },
  {
    file: "src/pages/maintenance/MaintenanceListPage.tsx",
    tokens: ["PERMISSIONS.MAINTENANCE_WRITE"],
  },
  {
    file: "src/features/maintenance/components/MaintenanceActions.tsx",
    tokens: [
      "PERMISSIONS.MAINTENANCE_WRITE",
      "PERMISSIONS.MAINTENANCE_DELETE",
    ],
  },
  {
    file: "src/pages/finance/ProjectCostsListPage.tsx",
    tokens: [
      "PERMISSIONS.FINANCE_WRITE",
      "PERMISSIONS.FINANCE_DELETE",
      "PERMISSIONS.FINANCE_APPROVE",
      "PERMISSIONS.FINANCE_EXPORT",
    ],
  },
  {
    file: "src/pages/finance/AllocatedCostsPage.tsx",
    tokens: ["PERMISSIONS.FINANCE_WRITE", "PERMISSIONS.FINANCE_DELETE"],
  },
  {
    file: "src/pages/finance/ApprovalQueuePage.tsx",
    tokens: ["PERMISSIONS.FINANCE_APPROVE"],
  },
  {
    file: "src/pages/payroll/AllowanceTypesListPage.tsx",
    tokens: ["PERMISSIONS.PAYROLL_WRITE"],
  },
];

function readFile(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return { exists: false, content: "" };
  }
  return { exists: true, content: fs.readFileSync(absolutePath, "utf8") };
}

function toMarkdown(report) {
  const lines = [];
  lines.push("# UI Action Permission Report");
  lines.push("");
  lines.push(`Generated at: ${report.generatedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Checked files: ${report.summary.checked}`);
  lines.push(`- Passed files: ${report.summary.passed}`);
  lines.push(`- Issues: ${report.summary.issues}`);
  lines.push("");

  if (report.issues.length === 0) {
    lines.push("No issues found.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("## Issues");
  lines.push("");
  for (const issue of report.issues) {
    lines.push(`- **${issue.file}**: ${issue.message}`);
  }
  lines.push("");

  return lines.join("\n");
}

function main() {
  const checks = [];
  const issues = [];

  for (const item of CHECKS) {
    const { exists, content } = readFile(item.file);

    if (!exists) {
      issues.push({
        severity: "HIGH",
        file: item.file,
        message: "File is missing.",
      });
      checks.push({
        file: item.file,
        exists: false,
        missingTokens: item.tokens,
      });
      continue;
    }

    const missingTokens = item.tokens.filter((token) => !content.includes(token));
    checks.push({
      file: item.file,
      exists: true,
      missingTokens,
    });

    if (missingTokens.length > 0) {
      issues.push({
        severity: "BLOCKER",
        file: item.file,
        message: `Missing permission token(s): ${missingTokens.join(", ")}`,
      });
    }
  }

  const summary = {
    checked: checks.length,
    passed: checks.filter((c) => c.exists && c.missingTokens.length === 0).length,
    issues: issues.length,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    checks,
    issues,
  };

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(OUTPUT_MD, toMarkdown(report), "utf8");

  console.log("UI action permission audit completed.");
  console.log(`JSON: ${path.relative(ROOT, OUTPUT_JSON).replaceAll("\\", "/")}`);
  console.log(`MD  : ${path.relative(ROOT, OUTPUT_MD).replaceAll("\\", "/")}`);
  console.log(
    `Summary: checked=${summary.checked}, passed=${summary.passed}, issues=${summary.issues}`,
  );

  if (summary.issues > 0) {
    process.exit(1);
  }
}

main();

