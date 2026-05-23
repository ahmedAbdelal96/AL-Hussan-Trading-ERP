#!/usr/bin/env node
/**
 * Phase 5 monitoring smoke checks.
 *
 * Environment variables (optional):
 *   PHASE5_FRONTEND_URL=http://localhost:5173
 *   PHASE5_BACKEND_URL=http://localhost:9000
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const rootDir = resolve(process.cwd());
const artifactsDir = join(rootDir, "release-artifacts");
mkdirSync(artifactsDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const frontendBase = process.env.PHASE5_FRONTEND_URL || "http://localhost:5173";
const backendBase = process.env.PHASE5_BACKEND_URL || "http://localhost:9000";
const skipFrontend = process.env.PHASE5_SKIP_FRONTEND === "true";

const checks = [
  ...(!skipFrontend
    ? [
        {
          id: "frontend_home",
          label: "Frontend home is reachable",
          url: `${frontendBase}/`,
          expected: [200],
        },
      ]
    : []),
  {
    id: "backend_liveness",
    label: "Backend liveness endpoint",
    url: `${backendBase}/api/v1/health/live`,
    expected: [200],
  },
  {
    id: "backend_readiness",
    label: "Backend readiness endpoint",
    url: `${backendBase}/api/v1/health`,
    expected: [200, 503],
  },
  {
    id: "auth_guard_enforced",
    label: "Protected endpoint rejects anonymous user",
    url: `${backendBase}/api/v1/auth/me`,
    expected: [401],
  },
  {
    id: "reports_guard_enforced",
    label: "Reports endpoint rejects anonymous user",
    url: `${backendBase}/api/v1/reports/executive/dashboard`,
    expected: [401],
  },
];

async function runCheck(check) {
  const startedAt = Date.now();
  try {
    const response = await fetch(check.url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const durationMs = Date.now() - startedAt;
    const passed = check.expected.includes(response.status);
    let payload = "";
    try {
      payload = await response.text();
    } catch {
      payload = "";
    }

    return {
      id: check.id,
      label: check.label,
      url: check.url,
      expected: check.expected,
      statusCode: response.status,
      status: passed ? "pass" : "fail",
      durationMs,
      payloadPreview: payload.slice(0, 300),
    };
  } catch (error) {
    return {
      id: check.id,
      label: check.label,
      url: check.url,
      expected: check.expected,
      statusCode: -1,
      status: "fail",
      durationMs: Date.now() - startedAt,
      payloadPreview:
        error instanceof Error ? error.message : "Unknown network error",
    };
  }
}

const startedAt = new Date().toISOString();
const results = await Promise.all(checks.map(runCheck));
const failed = results.filter((r) => r.status === "fail");
const summary = {
  startedAt,
  finishedAt: new Date().toISOString(),
  status: failed.length === 0 ? "PASS" : "FAIL",
  total: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  frontendBase,
  backendBase,
};

const report = { summary, results };
const jsonPath = join(artifactsDir, `phase5-monitoring-smoke-${timestamp}.json`);
const jsonLatest = join(artifactsDir, "phase5-monitoring-smoke-latest.json");
writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
writeFileSync(jsonLatest, JSON.stringify(report, null, 2), "utf8");

const lines = [];
lines.push("# Phase 5 Monitoring Smoke Report");
lines.push("");
lines.push(`- Frontend base: ${frontendBase}`);
lines.push(`- Backend base: ${backendBase}`);
lines.push(`- Skip frontend check: ${skipFrontend ? "yes" : "no"}`);
lines.push(`- Overall: **${summary.status}**`);
lines.push(`- Passed: ${summary.passed}/${summary.total}`);
lines.push("");
lines.push("## Checks");
lines.push("");
for (const r of results) {
  const icon = r.status === "pass" ? "PASS" : "FAIL";
  lines.push(`- ${icon} \`${r.id}\` => status ${r.statusCode} (${r.durationMs}ms)`);
}

if (failed.length > 0) {
  lines.push("");
  lines.push("## Failures");
  lines.push("");
  for (const f of failed) {
    lines.push(`### ${f.id}`);
    lines.push("");
    lines.push("```text");
    lines.push(`URL: ${f.url}`);
    lines.push(`Expected: ${f.expected.join(", ")}`);
    lines.push(`Actual: ${f.statusCode}`);
    lines.push(`Details: ${f.payloadPreview}`);
    lines.push("```");
  }
}

const mdPath = join(artifactsDir, `phase5-monitoring-smoke-${timestamp}.md`);
const mdLatest = join(artifactsDir, "phase5-monitoring-smoke-latest.md");
const markdown = lines.join("\n");
writeFileSync(mdPath, markdown, "utf8");
writeFileSync(mdLatest, markdown, "utf8");

if (summary.status === "PASS") {
  console.log(`Phase 5 monitoring smoke passed. Report: ${mdLatest}`);
  process.exitCode = 0;
} else {
  console.error(`Phase 5 monitoring smoke failed. Report: ${mdLatest}`);
  process.exitCode = 1;
}
