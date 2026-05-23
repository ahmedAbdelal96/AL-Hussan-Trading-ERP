#!/usr/bin/env node

/**
 * Frontend performance gate runner (baseline/check).
 *
 * Flow:
 * 1) Run production build
 * 2) Generate dist-based bundle report
 * 3) In check mode, compare with baseline and assert thresholds
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const resultsDir = path.join(rootDir, "scripts", "perf", "results");
const baselineFile = path.join(resultsDir, "frontend-baseline.json");
const currentFile = path.join(resultsDir, "frontend-current.json");

const mode = (process.argv[2] || "").trim(); // baseline | check

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function relFromRoot(filePath) {
  return path.relative(rootDir, filePath).replaceAll("\\", "/");
}

function runCommand(command, args, env = process.env) {
  const isWin = process.platform === "win32";
  const cmd = isWin ? "cmd.exe" : command;
  const cmdArgs = isWin ? ["/d", "/s", "/c", `${command} ${args.join(" ")}`] : args;

  const result = spawnSync(cmd, cmdArgs, {
    cwd: rootDir,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function compareReports(base, curr) {
  const baseS = base.summary;
  const currS = curr.summary;
  return {
    totalJsKBDelta: Number((currS.totalJsKB - baseS.totalJsKB).toFixed(2)),
    entrypointJsKBDelta: Number(
      (currS.entrypointJsKB - baseS.entrypointJsKB).toFixed(2),
    ),
    initialJsKBDelta: Number((currS.initialJsKB - baseS.initialJsKB).toFixed(2)),
    largestJsChunkKBDelta: Number(
      (currS.largestJsChunkKB - baseS.largestJsChunkKB).toFixed(2),
    ),
  };
}

function assertThresholds(base, curr, delta) {
  const maxEntrypointJsKB = Number(
    process.env.FRONTEND_ASSERT_MAX_ENTRYPOINT_JS_KB || "900",
  );
  const maxInitialJsKB = Number(
    process.env.FRONTEND_ASSERT_MAX_INITIAL_JS_KB || "1400",
  );
  const maxTotalJsKB = Number(process.env.FRONTEND_ASSERT_MAX_TOTAL_JS_KB || "6000");
  const maxLargestChunkKB = Number(
    process.env.FRONTEND_ASSERT_MAX_LARGEST_CHUNK_KB || "700",
  );
  const maxEntrypointRegressionKB = Number(
    process.env.FRONTEND_ASSERT_MAX_ENTRYPOINT_JS_REGRESSION_KB || "120",
  );
  const maxInitialRegressionKB = Number(
    process.env.FRONTEND_ASSERT_MAX_INITIAL_JS_REGRESSION_KB || "180",
  );

  const failures = [];
  if (curr.summary.entrypointJsKB > maxEntrypointJsKB) {
    failures.push(
      `entrypointJsKB ${curr.summary.entrypointJsKB} exceeded max ${maxEntrypointJsKB}`,
    );
  }
  if (curr.summary.totalJsKB > maxTotalJsKB) {
    failures.push(`totalJsKB ${curr.summary.totalJsKB} exceeded max ${maxTotalJsKB}`);
  }
  if (curr.summary.initialJsKB > maxInitialJsKB) {
    failures.push(`initialJsKB ${curr.summary.initialJsKB} exceeded max ${maxInitialJsKB}`);
  }
  if (curr.summary.largestJsChunkKB > maxLargestChunkKB) {
    failures.push(
      `largestJsChunkKB ${curr.summary.largestJsChunkKB} exceeded max ${maxLargestChunkKB}`,
    );
  }
  if (delta.entrypointJsKBDelta > maxEntrypointRegressionKB) {
    failures.push(
      `entrypointJs regression +${delta.entrypointJsKBDelta}KB exceeded max +${maxEntrypointRegressionKB}KB`,
    );
  }
  if (delta.initialJsKBDelta > maxInitialRegressionKB) {
    failures.push(
      `initialJs regression +${delta.initialJsKBDelta}KB exceeded max +${maxInitialRegressionKB}KB`,
    );
  }

  console.log("Thresholds:");
  console.log(
    `- entrypointJsKB <= ${maxEntrypointJsKB}, initialJsKB <= ${maxInitialJsKB}, totalJsKB <= ${maxTotalJsKB}, largestJsChunkKB <= ${maxLargestChunkKB}, entrypointJsRegressionKB <= +${maxEntrypointRegressionKB}, initialJsRegressionKB <= +${maxInitialRegressionKB}`,
  );

  if (failures.length > 0) {
    console.error("Frontend perf assertions failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }
}

function main() {
  if (mode !== "baseline" && mode !== "check") {
    console.error("Usage: node scripts/perf/run-frontend-gate.mjs <baseline|check>");
    process.exit(1);
  }

  ensureDir(resultsDir);

  const outputFile = mode === "baseline" ? baselineFile : currentFile;
  const env = { ...process.env, FRONTEND_PERF_OUTPUT: outputFile };

  console.log(`[frontend:perf] Running build for mode=${mode}...`);
  runCommand("npm", ["run", "-s", "build"], env);

  console.log("[frontend:perf] Generating bundle report...");
  runCommand("node", ["scripts/perf/analyze-frontend-bundle.mjs"], env);

  if (mode === "baseline") {
    console.log(`[frontend:perf] Baseline saved: ${relFromRoot(outputFile)}`);
    return;
  }

  if (!fs.existsSync(baselineFile)) {
    console.error(
      `Missing baseline file: ${relFromRoot(baselineFile)}. Run perf:frontend:baseline first.`,
    );
    process.exit(1);
  }

  const baseline = readJson(baselineFile);
  const current = readJson(currentFile);
  const delta = compareReports(baseline, current);

  console.log("Comparison (current - baseline):");
  console.log(`- totalJsKB: ${delta.totalJsKBDelta}`);
  console.log(`- entrypointJsKB: ${delta.entrypointJsKBDelta}`);
  console.log(`- initialJsKB: ${delta.initialJsKBDelta}`);
  console.log(`- largestJsChunkKB: ${delta.largestJsChunkKBDelta}`);

  assertThresholds(baseline, current, delta);
  console.log(`[frontend:perf] Check passed. Report: ${relFromRoot(currentFile)}`);
}

main();
