#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RESULTS_DIR = path.join(process.cwd(), 'scripts', 'perf', 'results');
const BASELINE_FILE = path.join(RESULTS_DIR, 'write-ops-baseline.json');
const CURRENT_FILE = path.join(RESULTS_DIR, 'write-ops-current.json');

function fail(message) {
  console.error(`\n[perf:write:ops] ${message}`);
  process.exit(1);
}

function runNodeScript(scriptPath, envPatch = {}) {
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: 'inherit',
    env: { ...process.env, ...envPatch },
  });
  if (result.error) fail(`Failed to execute ${scriptPath}: ${result.error.message}`);
  if (result.status !== 0) fail(`${scriptPath} exited with code ${result.status}`);
}

function ensureAuthEnv() {
  const missing = ['PERF_EMAIL', 'PERF_PASSWORD'].filter((k) => !process.env[k]);
  if (missing.length > 0) fail(`Missing required env vars: ${missing.join(', ')}`);
}

function main() {
  const mode = (process.argv[2] || 'check').trim().toLowerCase();
  if (mode !== 'baseline' && mode !== 'check') {
    fail(`Invalid mode "${mode}". Use: baseline | check`);
  }

  ensureAuthEnv();

  const benchmarkScript = path.join(
    process.cwd(),
    'scripts',
    'perf',
    'benchmark-write-ops-api.js',
  );
  const assertScript = path.join(process.cwd(), 'scripts', 'perf', 'assert-benchmark.js');

  if (mode === 'baseline') {
    runNodeScript(benchmarkScript, { PERF_OUTPUT_FILE: BASELINE_FILE });
    console.log(`\n[perf:write:ops] Baseline generated at: ${BASELINE_FILE}`);
    return;
  }

  runNodeScript(benchmarkScript, {
    PERF_OUTPUT_FILE: CURRENT_FILE,
    PERF_COMPARE_FILE: BASELINE_FILE,
  });

  runNodeScript(assertScript, {
    PERF_ASSERT_FILE: CURRENT_FILE,
    PERF_ASSERT_BASELINE_FILE: BASELINE_FILE,
    PERF_ASSERT_MAX_P95_MS: process.env.PERF_ASSERT_MAX_P95_MS || '1000',
    PERF_ASSERT_MAX_P99_MS: process.env.PERF_ASSERT_MAX_P99_MS || '1500',
    PERF_ASSERT_MAX_P95_REGRESSION_MS:
      process.env.PERF_ASSERT_MAX_P95_REGRESSION_MS || '150',
    PERF_ASSERT_MAX_ERROR_RATE_PCT: process.env.PERF_ASSERT_MAX_ERROR_RATE_PCT || '0',
  });

  console.log('\n[perf:write:ops] Ops write gate finished successfully.');
}

main();
