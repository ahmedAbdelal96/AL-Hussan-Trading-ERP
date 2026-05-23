#!/usr/bin/env node

/**
 * Build a safe cleanup plan from the unused-files audit report.
 *
 * Why this exists:
 * - `unreachableFiles` can be zero while the codebase still contains
 *   duplicate/legacy structures that increase maintenance cost.
 * - We classify duplicate basenames into:
 *   1) expected duplicates (i18n ar/en, report type mirrors)
 *   2) review-needed duplicates (potentially redundant files)
 *
 * Output:
 * - scripts/audit/results/cleanup-plan.md
 * - scripts/audit/results/cleanup-plan.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const resultsDir = path.join(rootDir, "scripts", "audit", "results");
const sourceReportFile = path.join(resultsDir, "unused-files-report.json");
const outputJsonFile = path.join(resultsDir, "cleanup-plan.json");
const outputMdFile = path.join(resultsDir, "cleanup-plan.md");

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function isI18nPair(files) {
  if (!Array.isArray(files) || files.length !== 2) return false;
  const normalized = files.map((p) => p.replaceAll("\\", "/"));
  return (
    normalized.every((p) => p.includes("src/i18n/locales/")) &&
    normalized.some((p) => p.includes("/ar/")) &&
    normalized.some((p) => p.includes("/en/"))
  );
}

function isReportsTypeMirror(files) {
  if (!Array.isArray(files) || files.length !== 2) return false;
  const normalized = files.map((p) => p.replaceAll("\\", "/")).sort();
  const hasBaseTypes = normalized.some(
    (p) => p.startsWith("src/types/") && !p.startsWith("src/types/reports/"),
  );
  const hasReportTypes = normalized.some((p) =>
    p.startsWith("src/types/reports/"),
  );
  return hasBaseTypes && hasReportTypes;
}

function isExpectedByConvention(group) {
  const basename = String(group.basename || "").toLowerCase();
  const files = (group.files ?? []).map((p) => p.replaceAll("\\", "/"));

  if (basename === "index") return "barrel files in multiple feature folders";

  if (basename === "config") return "config files in distinct bounded contexts";

  if (basename === "dashboard") {
    const hasI18nDash =
      files.some((p) => p.includes("src/i18n/locales/ar/dashboard.ts")) &&
      files.some((p) => p.includes("src/i18n/locales/en/dashboard.ts"));
    const hasTypesDash = files.some((p) => p === "src/types/dashboard.ts");
    if (hasI18nDash && hasTypesDash) return "i18n dashboard + dashboard types";
  }

  if (basename === "userprofilepage") {
    const hasAuthProfile = files.some((p) =>
      p.includes("src/pages/AuthPages/UserProfilePage.tsx"),
    );
    const hasUsersProfile = files.some((p) =>
      p.includes("src/pages/users/UserProfilePage.tsx"),
    );
    if (hasAuthProfile && hasUsersProfile) {
      return "different page intent (self-profile vs user-management profile)";
    }
  }

  return null;
}

function classifyDuplicateGroup(group) {
  const files = group.files ?? [];

  const conventionReason = isExpectedByConvention(group);
  if (conventionReason) {
    return {
      category: "expected",
      reason: conventionReason,
      action: "keep",
    };
  }

  if (isI18nPair(files)) {
    return {
      category: "expected",
      reason: "i18n locale pair (ar/en)",
      action: "keep",
    };
  }

  if (isReportsTypeMirror(files)) {
    return {
      category: "expected",
      reason: "report-types mirror structure",
      action: "keep",
    };
  }

  return {
    category: "review_needed",
    reason: "duplicate basename outside known expected patterns",
    action: "manual_review",
  };
}

function buildPlan(report) {
  const duplicateBasenames = Array.isArray(report?.duplicateBasenames)
    ? report.duplicateBasenames
    : [];

  const classifiedDuplicates = duplicateBasenames.map((group) => ({
    ...group,
    ...classifyDuplicateGroup(group),
  }));

  const expected = classifiedDuplicates.filter((g) => g.category === "expected");
  const reviewNeeded = classifiedDuplicates.filter(
    (g) => g.category === "review_needed",
  );

  return {
    generatedAt: new Date().toISOString(),
    sourceReportFile: "scripts/audit/results/unused-files-report.json",
    summary: {
      duplicateGroupsTotal: duplicateBasenames.length,
      expectedGroups: expected.length,
      reviewNeededGroups: reviewNeeded.length,
      unreachableFiles: report?.summary?.unreachableFiles ?? 0,
    },
    unreachableFiles: report?.unreachableFiles ?? [],
    expectedDuplicates: expected,
    reviewNeededDuplicates: reviewNeeded,
  };
}

function toMarkdown(plan) {
  const lines = [];
  lines.push("# Frontend Cleanup Plan");
  lines.push("");
  lines.push(`Generated at: ${plan.generatedAt}`);
  lines.push(`Source report: \`${plan.sourceReportFile}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Duplicate groups: ${plan.summary.duplicateGroupsTotal}`);
  lines.push(`- Expected groups: ${plan.summary.expectedGroups}`);
  lines.push(`- Review-needed groups: ${plan.summary.reviewNeededGroups}`);
  lines.push(`- Unreachable files: ${plan.summary.unreachableFiles}`);
  lines.push("");

  if (plan.summary.unreachableFiles > 0) {
    lines.push("## Unreachable Files");
    lines.push("");
    for (const file of plan.unreachableFiles) {
      lines.push(`- \`${file}\``);
    }
    lines.push("");
  } else {
    lines.push("## Unreachable Files");
    lines.push("");
    lines.push("- None detected.");
    lines.push("");
  }

  lines.push("## Review Needed Duplicates");
  lines.push("");
  if (plan.reviewNeededDuplicates.length === 0) {
    lines.push("- None.");
    lines.push("");
  } else {
    for (const group of plan.reviewNeededDuplicates) {
      lines.push(`### ${group.basename}`);
      lines.push("");
      lines.push(`- Reason: ${group.reason}`);
      lines.push(`- Action: ${group.action}`);
      for (const file of group.files) {
        lines.push(`- \`${file}\``);
      }
      lines.push("");
    }
  }

  lines.push("## Expected Duplicates (Keep)");
  lines.push("");
  for (const group of plan.expectedDuplicates) {
    lines.push(`- \`${group.basename}\` (${group.reason})`);
  }
  lines.push("");

  return lines.join("\n");
}

function main() {
  const report = readJsonSafe(sourceReportFile);
  if (!report) {
    console.error(`Missing or invalid report: ${sourceReportFile}`);
    console.error("Run `npm run audit:unused` first.");
    process.exit(1);
  }

  const plan = buildPlan(report);
  fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(outputJsonFile, JSON.stringify(plan, null, 2), "utf8");
  fs.writeFileSync(outputMdFile, toMarkdown(plan), "utf8");

  console.log("Cleanup plan generated.");
  console.log(`JSON: ${path.relative(rootDir, outputJsonFile).replaceAll("\\", "/")}`);
  console.log(`MD  : ${path.relative(rootDir, outputMdFile).replaceAll("\\", "/")}`);
  console.log(
    `Summary: duplicates=${plan.summary.duplicateGroupsTotal}, review_needed=${plan.summary.reviewNeededGroups}, unreachable=${plan.summary.unreachableFiles}`,
  );
}

main();
