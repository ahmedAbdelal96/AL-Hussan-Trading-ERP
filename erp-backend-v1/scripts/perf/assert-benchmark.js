#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function readJson(filePath) {
  const absolute = path.resolve(filePath);
  return JSON.parse(fs.readFileSync(absolute, 'utf8'));
}

function getEnvNumber(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function toResultMap(payload) {
  const map = new Map();
  for (const row of payload.results || []) {
    map.set(row.endpoint, row);
  }
  return map;
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function main() {
  const currentFile =
    process.env.PERF_ASSERT_FILE || 'scripts/perf/results/current.json';
  const baselineFile = process.env.PERF_ASSERT_BASELINE_FILE || '';
  const maxP95 = getEnvNumber('PERF_ASSERT_MAX_P95_MS', 400);
  const maxP99 = getEnvNumber('PERF_ASSERT_MAX_P99_MS', 700);
  const maxErrorRatePct = getEnvNumber('PERF_ASSERT_MAX_ERROR_RATE_PCT', 0);
  const maxP95Regression = getEnvNumber('PERF_ASSERT_MAX_P95_REGRESSION_MS', 50);

  const current = readJson(currentFile);
  const currentMap = toResultMap(current);
  const baselineMap = baselineFile ? toResultMap(readJson(baselineFile)) : null;

  console.log(`Asserting benchmark file: ${currentFile}`);
  console.log(
    `Thresholds => p95<=${maxP95}ms, p99<=${maxP99}ms, errorRate<=${maxErrorRatePct}%, p95Regression<=${maxP95Regression}ms`,
  );

  for (const result of current.results || []) {
    const total = (result.successCount || 0) + (result.errorCount || 0);
    const errorRatePct = total > 0 ? ((result.errorCount || 0) / total) * 100 : 0;
    const p95 = Number(result.stats?.p95 || 0);
    const p99 = Number(result.stats?.p99 || 0);

    if (p95 > maxP95) {
      fail(`${result.endpoint} p95=${p95}ms exceeds ${maxP95}ms`);
    }
    if (p99 > maxP99) {
      fail(`${result.endpoint} p99=${p99}ms exceeds ${maxP99}ms`);
    }
    if (errorRatePct > maxErrorRatePct) {
      fail(
        `${result.endpoint} errorRate=${errorRatePct.toFixed(2)}% exceeds ${maxErrorRatePct}%`,
      );
    }

    if (baselineMap) {
      const base = baselineMap.get(result.endpoint);
      if (base) {
        const regression = p95 - Number(base.stats?.p95 || 0);
        if (regression > maxP95Regression) {
          fail(
            `${result.endpoint} p95 regression +${regression.toFixed(2)}ms exceeds +${maxP95Regression}ms`,
          );
        }
      }
    }
  }

  if (process.exitCode === 1) {
    console.error('Benchmark assertions failed.');
    return;
  }

  console.log('Benchmark assertions passed.');
}

main();
