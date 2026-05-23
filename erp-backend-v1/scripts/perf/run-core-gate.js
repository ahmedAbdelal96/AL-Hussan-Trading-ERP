#!/usr/bin/env node
'use strict';

/**
 * Core modules performance gate runner.
 *
 * Why this script exists:
 * - Reduces manual env setup mistakes when running core benchmarks repeatedly.
 * - Keeps baseline/current/assert flow consistent in CI and local runs.
 * - Fails fast with clear messages for missing auth credentials.
 */

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RESULTS_DIR = path.join(process.cwd(), 'scripts', 'perf', 'results');
const CORE_BASELINE_FILE = path.join(RESULTS_DIR, 'core-baseline.json');
const CORE_CURRENT_FILE = path.join(RESULTS_DIR, 'core-current.json');

function fail(message) {
  console.error(`\n[perf:core] ${message}`);
  process.exit(1);
}

function runNodeScript(scriptPath, extraEnv = {}) {
  const env = { ...process.env, ...extraEnv };
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: 'inherit',
    env,
  });

  if (result.error) {
    fail(`Failed to execute ${scriptPath}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${scriptPath} exited with code ${result.status}`);
  }
}

function ensureRequiredEnvVars() {
  const required = ['PERF_EMAIL', 'PERF_PASSWORD'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    fail(`Missing required env vars: ${missing.join(', ')}`);
  }
}

function main() {
  const mode = (process.argv[2] || 'check').trim().toLowerCase();
  if (mode !== 'baseline' && mode !== 'check') {
    fail(`Invalid mode "${mode}". Use: baseline | check`);
  }

  ensureRequiredEnvVars();

  const benchmarkScript = path.join(process.cwd(), 'scripts', 'perf', 'benchmark-api.js');
  const assertScript = path.join(process.cwd(), 'scripts', 'perf', 'assert-benchmark.js');
  const sharedBenchEnv = {
    PERF_PROFILE: 'core',
  };

  if (mode === 'baseline') {
    runNodeScript(benchmarkScript, {
      ...sharedBenchEnv,
      PERF_OUTPUT_FILE: CORE_BASELINE_FILE,
    });
    console.log(`\n[perf:core] Baseline generated at: ${CORE_BASELINE_FILE}`);
    return;
  }

  runNodeScript(benchmarkScript, {
    ...sharedBenchEnv,
    PERF_OUTPUT_FILE: CORE_CURRENT_FILE,
    PERF_COMPARE_FILE: CORE_BASELINE_FILE,
  });

  runNodeScript(assertScript, {
    PERF_ASSERT_FILE: CORE_CURRENT_FILE,
    PERF_ASSERT_BASELINE_FILE: CORE_BASELINE_FILE,
    PERF_ASSERT_MAX_P95_MS: process.env.PERF_ASSERT_MAX_P95_MS || '350',
    PERF_ASSERT_MAX_P99_MS: process.env.PERF_ASSERT_MAX_P99_MS || '600',
    PERF_ASSERT_MAX_P95_REGRESSION_MS:
      process.env.PERF_ASSERT_MAX_P95_REGRESSION_MS || '40',
    PERF_ASSERT_MAX_ERROR_RATE_PCT: process.env.PERF_ASSERT_MAX_ERROR_RATE_PCT || '0',
  });

  console.log('\n[perf:core] Core gate finished successfully.');
}

main();
