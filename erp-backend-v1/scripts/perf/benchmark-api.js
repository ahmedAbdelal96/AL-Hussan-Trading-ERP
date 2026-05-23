#!/usr/bin/env node
'use strict';

/**
 * Lightweight API benchmark for ERP backend.
 *
 * Design goals:
 * - No external dependencies (runs with Node >= 18).
 * - Authenticates once, then benchmarks multiple protected endpoints.
 * - Reports p50/p95/p99 + avg + success/error counts.
 * - Supports warmup and configurable concurrency for realistic sampling.
 */

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_BASE_URL = 'http://localhost:9000/api/v1';
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_WARMUP = 3;
const DEFAULT_ROUNDS = 20;
const DEFAULT_CONCURRENCY = 2;

const REPORT_ENDPOINTS = [
  { name: 'auth_me', path: '/auth/me' },
  { name: 'dashboard', path: '/dashboard' },
  { name: 'exec_dashboard', path: '/reports/executive/dashboard' },
  {
    name: 'exec_pnl_full',
    path: '/reports/executive/pnl?includeProjectBreakdown=true&includeCostBreakdown=true&includeMonthlyTrend=true',
  },
  { name: 'finance_overview', path: '/reports/finance/overview' },
  { name: 'finance_by_cost_type', path: '/reports/finance/by-cost-type' },
  {
    name: 'finance_by_payment_status',
    path: '/reports/finance/by-payment-status',
  },
  { name: 'finance_monthly_trend', path: '/reports/finance/monthly-trend' },
];

const CORE_ENDPOINTS = [
  { name: 'users_list', path: '/users?page=1&pageSize=20' },
  { name: 'employees_list', path: '/employees?page=1&pageSize=20' },
  { name: 'projects_list', path: '/projects?page=1&limit=20' },
  { name: 'assets_list', path: '/assets?page=1&limit=20' },
  { name: 'maintenance_list', path: '/maintenance?page=1&limit=20' },
  { name: 'finance_costs_list', path: '/finance/costs?page=1&limit=20' },
  { name: 'finance_categories_list', path: '/finance/categories?page=1&limit=50' },
];

function resolveEndpoints(profile) {
  const normalized = (profile || 'reports').trim().toLowerCase();
  if (normalized === 'core') {
    return CORE_ENDPOINTS;
  }
  if (normalized === 'all') {
    return [...REPORT_ENDPOINTS, ...CORE_ENDPOINTS];
  }
  return REPORT_ENDPOINTS;
}

function getEnvInt(key, fallback) {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function percentile(sortedValues, p) {
  if (!sortedValues.length) return 0;
  if (sortedValues.length === 1) return sortedValues[0];
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  const safeIndex = Math.min(sortedValues.length - 1, Math.max(0, index));
  return sortedValues[safeIndex];
}

function toFixedNumber(value, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function summarizeDurations(values) {
  if (!values.length) {
    return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const total = values.reduce((sum, n) => sum + n, 0);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: total / values.length,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };
}

function nowTimestampForFile() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function toBenchmarkPayload(config, results) {
  return {
    generatedAt: new Date().toISOString(),
    config,
    results: results.map((result) => ({
      endpoint: result.endpoint,
      path: result.path,
      successCount: result.successCount,
      errorCount: result.errorCount,
      stats: {
        min: toFixedNumber(result.stats.min),
        avg: toFixedNumber(result.stats.avg),
        max: toFixedNumber(result.stats.max),
        p50: toFixedNumber(result.stats.p50),
        p95: toFixedNumber(result.stats.p95),
        p99: toFixedNumber(result.stats.p99),
      },
    })),
  };
}

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function savePayload(payload, outputFile) {
  ensureDirForFile(outputFile);
  fs.writeFileSync(outputFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function findResultByEndpoint(payload, endpointName) {
  return payload.results.find((item) => item.endpoint === endpointName) || null;
}

function printComparison(currentPayload, baselinePayload) {
  console.log('\n========================= Comparison ========================');
  console.log(`baseline: ${baselinePayload.generatedAt}`);
  console.log(`current : ${currentPayload.generatedAt}`);

  for (const currentResult of currentPayload.results) {
    const baselineResult = findResultByEndpoint(
      baselinePayload,
      currentResult.endpoint,
    );
    if (!baselineResult) {
      console.log(`${currentResult.endpoint}: skipped (missing in baseline)`);
      continue;
    }

    const diffP95 = currentResult.stats.p95 - baselineResult.stats.p95;
    const diffP99 = currentResult.stats.p99 - baselineResult.stats.p99;
    const diffAvg = currentResult.stats.avg - baselineResult.stats.avg;

    console.log(
      `${currentResult.endpoint}: avg ${diffAvg >= 0 ? '+' : ''}${toFixedNumber(diffAvg)}ms, p95 ${diffP95 >= 0 ? '+' : ''}${toFixedNumber(diffP95)}ms, p99 ${diffP99 >= 0 ? '+' : ''}${toFixedNumber(diffP99)}ms`,
    );
  }
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = process.hrtime.bigint();

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const endedAt = process.hrtime.bigint();
    const durationMs = Number(endedAt - startedAt) / 1_000_000;
    return { response, durationMs };
  } finally {
    clearTimeout(timeout);
  }
}

async function login(baseUrl, email, password, timeoutMs) {
  const loginUrl = `${baseUrl}/auth/login`;
  const body = JSON.stringify({ email, password, rememberMe: false });

  const { response, durationMs } = await fetchWithTimeout(
    loginUrl,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body,
    },
    timeoutMs,
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Login failed (${response.status}) after ${durationMs.toFixed(2)}ms: ${text}`,
    );
  }

  const json = await response.json();
  const accessToken = json?.tokens?.accessToken;
  if (!accessToken) {
    throw new Error(
      'Login response does not include tokens.accessToken. Check auth response format.',
    );
  }
  return accessToken;
}

async function hitEndpoint(baseUrl, endpointPath, accessToken, timeoutMs) {
  const url = `${baseUrl}${endpointPath}`;
  const { response, durationMs } = await fetchWithTimeout(
    url,
    {
      method: 'GET',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    },
    timeoutMs,
  );

  const status = response.status;
  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false,
      status,
      durationMs,
      error: `${status}: ${text.slice(0, 400)}`,
    };
  }

  // Ensure body is consumed so timing is close to real client behavior.
  await response.text();
  return { ok: true, status, durationMs };
}

async function benchmarkEndpoint({
  baseUrl,
  endpoint,
  accessToken,
  warmupRounds,
  measuredRounds,
  concurrency,
  timeoutMs,
}) {
  for (let i = 0; i < warmupRounds; i += 1) {
    await hitEndpoint(baseUrl, endpoint.path, accessToken, timeoutMs);
  }

  const durations = [];
  const errors = [];
  let successCount = 0;

  let remaining = measuredRounds;
  while (remaining > 0) {
    const batchSize = Math.min(concurrency, remaining);
    const batch = Array.from({ length: batchSize }, () =>
      hitEndpoint(baseUrl, endpoint.path, accessToken, timeoutMs),
    );
    const results = await Promise.all(batch);

    for (const result of results) {
      if (result.ok) {
        successCount += 1;
        durations.push(result.durationMs);
      } else {
        errors.push(result.error);
      }
    }

    remaining -= batchSize;
  }

  return {
    endpoint: endpoint.name,
    path: endpoint.path,
    successCount,
    errorCount: errors.length,
    errors: errors.slice(0, 3), // cap noisy output
    stats: summarizeDurations(durations),
  };
}

function printResult(result) {
  const { endpoint, path, successCount, errorCount, stats } = result;
  console.log('\n------------------------------------------------------------');
  console.log(`${endpoint}  (${path})`);
  console.log(`success=${successCount}  errors=${errorCount}`);
  console.log(
    `min=${stats.min.toFixed(2)}ms  avg=${stats.avg.toFixed(2)}ms  max=${stats.max.toFixed(2)}ms`,
  );
  console.log(
    `p50=${stats.p50.toFixed(2)}ms  p95=${stats.p95.toFixed(2)}ms  p99=${stats.p99.toFixed(2)}ms`,
  );
  if (result.errors.length > 0) {
    console.log('sample errors:');
    for (const err of result.errors) {
      console.log(`- ${err}`);
    }
  }
}

async function main() {
  const baseUrl = process.env.PERF_API_BASE_URL || DEFAULT_BASE_URL;
  const email = process.env.PERF_EMAIL;
  const password = process.env.PERF_PASSWORD;
  const profile = process.env.PERF_PROFILE || 'reports';
  const endpoints = resolveEndpoints(profile);
  const timeoutMs = getEnvInt('PERF_TIMEOUT_MS', DEFAULT_TIMEOUT_MS);
  const warmupRounds = getEnvInt('PERF_WARMUP_ROUNDS', DEFAULT_WARMUP);
  const measuredRounds = getEnvInt('PERF_MEASURED_ROUNDS', DEFAULT_ROUNDS);
  const concurrency = getEnvInt('PERF_CONCURRENCY', DEFAULT_CONCURRENCY);
  const compareFile = process.env.PERF_COMPARE_FILE || '';
  const outputFile =
    process.env.PERF_OUTPUT_FILE ||
    path.join(process.cwd(), 'scripts', 'perf', 'results', `benchmark-${nowTimestampForFile()}.json`);

  if (!email || !password) {
    throw new Error(
      'Missing PERF_EMAIL or PERF_PASSWORD. Set both environment variables first.',
    );
  }

  console.log('Starting API benchmark with config:');
  console.log(
    JSON.stringify(
      {
        baseUrl,
        timeoutMs,
        warmupRounds,
        measuredRounds,
        concurrency,
        profile,
        endpoints: endpoints.length,
      },
      null,
      2,
    ),
  );

  const accessToken = await login(baseUrl, email, password, timeoutMs);

  const results = [];
  for (const endpoint of endpoints) {
    const result = await benchmarkEndpoint({
      baseUrl,
      endpoint,
      accessToken,
      warmupRounds,
      measuredRounds,
      concurrency,
      timeoutMs,
    });
    results.push(result);
    printResult(result);
  }

  const healthy = results.every((r) => r.errorCount === 0);
  const payload = toBenchmarkPayload(
    {
      baseUrl,
      timeoutMs,
        warmupRounds,
        measuredRounds,
        concurrency,
        profile,
        endpoints: endpoints.length,
      },
      results,
    );

  savePayload(payload, outputFile);
  console.log(`\nResults saved to: ${outputFile}`);

  if (compareFile) {
    try {
      const baselineRaw = fs.readFileSync(compareFile, 'utf8');
      const baselinePayload = JSON.parse(baselineRaw);
      printComparison(payload, baselinePayload);
    } catch (error) {
      console.log(
        `Comparison skipped: failed to load PERF_COMPARE_FILE (${error.message})`,
      );
    }
  }

  console.log('\n============================================================');
  console.log(`Benchmark completed. overall_status=${healthy ? 'PASS' : 'HAS_ERRORS'}`);

  if (!healthy) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('\nBenchmark failed:', error?.message || error);
  process.exitCode = 1;
});
