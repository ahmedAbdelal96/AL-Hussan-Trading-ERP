#!/usr/bin/env node
/**
 * Phase 4 - UAT + Production hardening rehearsal runner.
 *
 * This script runs the production gates in a fixed order and produces:
 * - JSON machine-readable report
 * - Markdown summary report
 *
 * Usage:
 *   node scripts/release/run-phase4-rehearsal.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = resolve(process.cwd());
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const artifactsDir = join(rootDir, "release-artifacts");

mkdirSync(artifactsDir, { recursive: true });

const checks = [
  { id: "be_build", label: "Backend build", cwd: "erp-backend-v1", cmd: ["npm", "run", "build"] },
  { id: "be_lint", label: "Backend lint", cwd: "erp-backend-v1", cmd: ["npm", "run", "lint"] },
  { id: "be_test", label: "Backend test", cwd: "erp-backend-v1", cmd: ["npm", "test", "--", "--runInBand"] },
  { id: "be_audit_all", label: "Backend audit:all", cwd: "erp-backend-v1", cmd: ["npm", "run", "audit:all"] },
  { id: "fe_typecheck", label: "Frontend typecheck", cwd: "erp-frontend-v1", cmd: ["npm", "run", "typecheck"] },
  { id: "fe_build", label: "Frontend build", cwd: "erp-frontend-v1", cmd: ["npm", "run", "build"] },
  { id: "fe_auth_full", label: "Frontend auth full coverage", cwd: "erp-frontend-v1", cmd: ["npm", "run", "audit:auth:full"] },
  { id: "fe_auth_ui", label: "Frontend auth UI actions", cwd: "erp-frontend-v1", cmd: ["npm", "run", "audit:auth:ui-actions"] },
  {
    id: "compose_config",
    label: "Docker compose configuration validation",
    cwd: ".",
    cmd: ["docker", "compose", "--env-file", ".env.production.example", "config", "-q"],
    optional: true,
  },
];

function runCheck(check) {
  const startedAt = Date.now();
  const result = spawnSync(check.cmd[0], check.cmd.slice(1), {
    cwd: resolve(rootDir, check.cwd),
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  const endedAt = Date.now();
  return {
    id: check.id,
    label: check.label,
    command: check.cmd.join(" "),
    cwd: check.cwd,
    status: result.status === 0 ? "pass" : "fail",
    exitCode: result.status ?? -1,
    durationMs: endedAt - startedAt,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function isDockerAvailable() {
  const probe = spawnSync("docker", ["--version"], {
    cwd: rootDir,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  return probe.status === 0;
}

const started = new Date().toISOString();
const dockerAvailable = isDockerAvailable();
const results = checks.map((check) => {
  if (check.id === "compose_config" && !dockerAvailable) {
    return {
      id: check.id,
      label: check.label,
      command: check.cmd.join(" "),
      cwd: check.cwd,
      status: "skipped",
      exitCode: 0,
      durationMs: 0,
      stdout: "",
      stderr: "Docker CLI is not available on this runner.",
      optional: true,
    };
  }
  return runCheck(check);
});
const failed = results.filter((r) => r.status === "fail" && !r.optional);
const summary = {
  startedAt: started,
  finishedAt: new Date().toISOString(),
  total: results.length,
  passed: results.filter((r) => r.status === "pass").length,
  skipped: results.filter((r) => r.status === "skipped").length,
  failed: failed.length,
  status: failed.length === 0 ? "PASS" : "FAIL",
};

const payload = { summary, results };
const jsonPath = join(artifactsDir, `phase4-rehearsal-${timestamp}.json`);
const jsonLatestPath = join(artifactsDir, "phase4-rehearsal-latest.json");
writeFileSync(jsonPath, JSON.stringify(payload, null, 2), "utf8");
writeFileSync(jsonLatestPath, JSON.stringify(payload, null, 2), "utf8");

const lines = [];
lines.push("# Phase 4 Rehearsal Report");
lines.push("");
lines.push(`- Started: ${summary.startedAt}`);
lines.push(`- Finished: ${summary.finishedAt}`);
lines.push(`- Overall: **${summary.status}**`);
lines.push(`- Passed: ${summary.passed}/${summary.total}`);
lines.push(`- Skipped: ${summary.skipped}`);
lines.push("");
lines.push("## Checks");
lines.push("");
for (const r of results) {
  const icon = r.status === "pass" ? "PASS" : r.status === "skipped" ? "SKIP" : "FAIL";
  lines.push(`- ${icon} \`${r.id}\` (${r.durationMs}ms)`);
}
if (failed.length > 0) {
  lines.push("");
  lines.push("## Failed checks");
  lines.push("");
  for (const f of failed) {
    const stderrPreview = (f.stderr || f.stdout).trim().split("\n").slice(-20).join("\n");
    lines.push(`### ${f.id}`);
    lines.push("");
    lines.push("```text");
    lines.push(stderrPreview || "No output captured.");
    lines.push("```");
  }
}

const mdPath = join(artifactsDir, `phase4-rehearsal-${timestamp}.md`);
const mdLatestPath = join(artifactsDir, "phase4-rehearsal-latest.md");
const md = lines.join("\n");
writeFileSync(mdPath, md, "utf8");
writeFileSync(mdLatestPath, md, "utf8");

if (summary.status === "PASS") {
  console.log(`Phase 4 rehearsal passed. Report: ${mdLatestPath}`);
  process.exit(0);
}

console.error(`Phase 4 rehearsal failed. Report: ${mdLatestPath}`);
process.exit(1);
