#!/usr/bin/env node
'use strict';

/**
 * Write-heavy API benchmark for daily operations.
 *
 * Covered flow per round:
 * 1) Create cost category
 * 2) Update cost category
 * 3) Create project cost (general expense)
 * 4) Update project cost
 * 5) Delete project cost
 * 6) Delete cost category
 *
 * Notes:
 * - Uses unique test data per round to avoid conflicts.
 * - Performs best-effort cleanup in finally blocks.
 * - Emits output payload compatible with assert-benchmark.js.
 */

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_BASE_URL = 'http://localhost:9000/api/v1';
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_WARMUP = 1;
const DEFAULT_ROUNDS = 10;

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

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function savePayload(payload, outputFile) {
  ensureDirForFile(outputFile);
  fs.writeFileSync(outputFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function toBenchmarkPayload(config, operationResults) {
  const results = operationResults.map((row) => ({
    endpoint: row.operation,
    path: row.path,
    successCount: row.successCount,
    errorCount: row.errorCount,
    stats: {
      min: toFixedNumber(row.stats.min),
      avg: toFixedNumber(row.stats.avg),
      max: toFixedNumber(row.stats.max),
      p50: toFixedNumber(row.stats.p50),
      p95: toFixedNumber(row.stats.p95),
      p99: toFixedNumber(row.stats.p99),
    },
  }));

  return {
    generatedAt: new Date().toISOString(),
    config,
    results,
  };
}

function printComparison(currentPayload, baselinePayload) {
  const baselineMap = new Map();
  for (const item of baselinePayload.results || []) {
    baselineMap.set(item.endpoint, item);
  }

  console.log('\n========================= Comparison ========================');
  console.log(`baseline: ${baselinePayload.generatedAt}`);
  console.log(`current : ${currentPayload.generatedAt}`);

  for (const current of currentPayload.results || []) {
    const baseline = baselineMap.get(current.endpoint);
    if (!baseline) {
      console.log(`${current.endpoint}: skipped (missing in baseline)`);
      continue;
    }

    const diffP95 = current.stats.p95 - baseline.stats.p95;
    const diffP99 = current.stats.p99 - baseline.stats.p99;
    const diffAvg = current.stats.avg - baseline.stats.avg;

    console.log(
      `${current.endpoint}: avg ${diffAvg >= 0 ? '+' : ''}${toFixedNumber(diffAvg)}ms, p95 ${diffP95 >= 0 ? '+' : ''}${toFixedNumber(diffP95)}ms, p99 ${diffP99 >= 0 ? '+' : ''}${toFixedNumber(diffP99)}ms`,
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
  } catch (error) {
    const reason = error?.message || String(error);
    throw new Error(`Request failed for ${url}: ${reason}`);
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
      headers: { 'content-type': 'application/json' },
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
    throw new Error('Login response does not include tokens.accessToken.');
  }
  return accessToken;
}

function extractEntityId(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (typeof payload.id === 'string') return payload.id;
  if (payload.data && typeof payload.data.id === 'string') return payload.data.id;
  if (
    payload.result &&
    payload.result.data &&
    typeof payload.result.data.id === 'string'
  ) {
    return payload.result.data.id;
  }
  return null;
}

async function requestJson(baseUrl, pathName, method, accessToken, timeoutMs, body) {
  const url = `${baseUrl}${pathName}`;
  const hasBody = body !== undefined;
  const headers = {
    authorization: `Bearer ${accessToken}`,
  };
  if (hasBody) {
    headers['content-type'] = 'application/json';
  }

  const { response, durationMs } = await fetchWithTimeout(
    url,
    {
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
    },
    timeoutMs,
  );

  const raw = await response.text();
  let json = null;
  if (raw) {
    try {
      json = JSON.parse(raw);
    } catch (_error) {
      // keep null json for non-JSON responses
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    durationMs,
    json,
    raw,
  };
}

function createOpTracker() {
  const operationSpecs = [
    { operation: 'finance_category_create', path: '/finance/categories' },
    { operation: 'finance_category_update', path: '/finance/categories/:id' },
    { operation: 'finance_cost_create', path: '/finance/costs' },
    { operation: 'finance_cost_update', path: '/finance/costs/:id' },
    { operation: 'finance_cost_delete', path: '/finance/costs/:id' },
    { operation: 'finance_category_delete', path: '/finance/categories/:id' },
  ];

  const map = new Map();
  for (const spec of operationSpecs) {
    map.set(spec.operation, {
      operation: spec.operation,
      path: spec.path,
      durations: [],
      successCount: 0,
      errorCount: 0,
      errors: [],
    });
  }
  return map;
}

function trackResult(opMap, operation, result, optionalError) {
  const op = opMap.get(operation);
  if (!op) return;

  if (typeof result?.durationMs === 'number') {
    op.durations.push(result.durationMs);
  }

  if (result?.ok) {
    op.successCount += 1;
    return;
  }

  op.errorCount += 1;
  if (op.errors.length < 3) {
    const status = result?.status ? `status=${result.status}` : 'status=NA';
    const msg =
      optionalError ||
      (result?.raw ? String(result.raw).slice(0, 250) : 'Unknown write benchmark error');
    op.errors.push(`${status} ${msg}`);
  }
}

function printOperationResult(item) {
  console.log('\n------------------------------------------------------------');
  console.log(`${item.operation} (${item.path})`);
  console.log(`success=${item.successCount}  errors=${item.errorCount}`);
  console.log(
    `min=${item.stats.min.toFixed(2)}ms  avg=${item.stats.avg.toFixed(2)}ms  max=${item.stats.max.toFixed(2)}ms`,
  );
  console.log(
    `p50=${item.stats.p50.toFixed(2)}ms  p95=${item.stats.p95.toFixed(2)}ms  p99=${item.stats.p99.toFixed(2)}ms`,
  );
  if (item.errors.length > 0) {
    console.log('sample errors:');
    for (const err of item.errors) {
      console.log(`- ${err}`);
    }
  }
}

async function runScenarioRound({
  baseUrl,
  accessToken,
  timeoutMs,
  roundNumber,
  opMap,
}) {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1_000_000);
  const uniqueKey = `perf-write-${timestamp}-${roundNumber}-${randomSuffix}`;

  let categoryId = null;
  let costId = null;

  try {
    const createCategoryRes = await requestJson(
      baseUrl,
      '/finance/categories',
      'POST',
      accessToken,
      timeoutMs,
      {
        name: `Perf Category ${uniqueKey}`,
        description: `Auto benchmark category ${uniqueKey}`,
      },
    );
    trackResult(opMap, 'finance_category_create', createCategoryRes);
    if (!createCategoryRes.ok) {
      return;
    }

    categoryId = extractEntityId(createCategoryRes.json);
    if (!categoryId) {
      trackResult(
        opMap,
        'finance_category_update',
        { ok: false, status: 0 },
        'Failed to extract category id from create response',
      );
      return;
    }

    const updateCategoryRes = await requestJson(
      baseUrl,
      `/finance/categories/${categoryId}`,
      'PUT',
      accessToken,
      timeoutMs,
      {
        description: `Updated auto benchmark category ${uniqueKey}`,
        isActive: true,
      },
    );
    trackResult(opMap, 'finance_category_update', updateCategoryRes);
    if (!updateCategoryRes.ok) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const createCostRes = await requestJson(
      baseUrl,
      '/finance/costs',
      'POST',
      accessToken,
      timeoutMs,
      {
        costType: 'MATERIAL',
        categoryId,
        amount: 1234.56,
        transactionDate: today,
        description: `Auto benchmark cost ${uniqueKey}`,
        invoiceNumber: `INV-${roundNumber}-${randomSuffix}`,
      },
    );
    trackResult(opMap, 'finance_cost_create', createCostRes);
    if (!createCostRes.ok) {
      return;
    }

    costId = extractEntityId(createCostRes.json);
    if (!costId) {
      trackResult(
        opMap,
        'finance_cost_update',
        { ok: false, status: 0 },
        'Failed to extract cost id from create response',
      );
      return;
    }

    const updateCostRes = await requestJson(
      baseUrl,
      `/finance/costs/${costId}`,
      'PUT',
      accessToken,
      timeoutMs,
      {
        amount: 1300.0,
        description: `Updated auto benchmark cost ${uniqueKey}`,
      },
    );
    trackResult(opMap, 'finance_cost_update', updateCostRes);
    if (!updateCostRes.ok) {
      return;
    }

    const deleteCostRes = await requestJson(
      baseUrl,
      `/finance/costs/${costId}`,
      'DELETE',
      accessToken,
      timeoutMs,
    );
    trackResult(opMap, 'finance_cost_delete', deleteCostRes);
    if (deleteCostRes.ok) {
      costId = null;
    }

    const deleteCategoryRes = await requestJson(
      baseUrl,
      `/finance/categories/${categoryId}`,
      'DELETE',
      accessToken,
      timeoutMs,
    );
    trackResult(opMap, 'finance_category_delete', deleteCategoryRes);
    if (deleteCategoryRes.ok) {
      categoryId = null;
    }
  } finally {
    // Best-effort cleanup for partial failures to avoid test-data leakage.
    if (costId) {
      await requestJson(baseUrl, `/finance/costs/${costId}`, 'DELETE', accessToken, timeoutMs);
    }
    if (categoryId) {
      await requestJson(
        baseUrl,
        `/finance/categories/${categoryId}`,
        'DELETE',
        accessToken,
        timeoutMs,
      );
    }
  }
}

async function main() {
  const baseUrl = process.env.PERF_API_BASE_URL || DEFAULT_BASE_URL;
  const email = process.env.PERF_EMAIL;
  const password = process.env.PERF_PASSWORD;
  const timeoutMs = getEnvInt('PERF_TIMEOUT_MS', DEFAULT_TIMEOUT_MS);
  const warmupRounds = getEnvInt('PERF_WARMUP_ROUNDS', DEFAULT_WARMUP);
  const measuredRounds = getEnvInt('PERF_MEASURED_ROUNDS', DEFAULT_ROUNDS);
  const compareFile = process.env.PERF_COMPARE_FILE || '';
  const outputFile =
    process.env.PERF_OUTPUT_FILE ||
    path.join(
      process.cwd(),
      'scripts',
      'perf',
      'results',
      `write-benchmark-${nowTimestampForFile()}.json`,
    );

  if (!email || !password) {
    throw new Error('Missing PERF_EMAIL or PERF_PASSWORD.');
  }

  console.log('Starting write-heavy API benchmark with config:');
  console.log(
    JSON.stringify(
      {
        baseUrl,
        timeoutMs,
        warmupRounds,
        measuredRounds,
        scenario: 'finance-category+cost CRUD',
      },
      null,
      2,
    ),
  );

  const accessToken = await login(baseUrl, email, password, timeoutMs);
  const opMap = createOpTracker();

  for (let i = 1; i <= warmupRounds; i += 1) {
    await runScenarioRound({
      baseUrl,
      accessToken,
      timeoutMs,
      roundNumber: i,
      opMap: createOpTracker(), // warmup is ignored from final stats
    });
  }

  for (let i = 1; i <= measuredRounds; i += 1) {
    await runScenarioRound({
      baseUrl,
      accessToken,
      timeoutMs,
      roundNumber: i,
      opMap,
    });
  }

  const operationResults = Array.from(opMap.values()).map((op) => ({
    operation: op.operation,
    path: op.path,
    successCount: op.successCount,
    errorCount: op.errorCount,
    errors: op.errors,
    stats: summarizeDurations(op.durations),
  }));

  for (const row of operationResults) {
    printOperationResult(row);
  }

  const payload = toBenchmarkPayload(
    {
      baseUrl,
      timeoutMs,
      warmupRounds,
      measuredRounds,
      scenario: 'finance-category+cost CRUD',
    },
    operationResults,
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

  const healthy = operationResults.every((row) => row.errorCount === 0);
  console.log('\n============================================================');
  console.log(`Write benchmark completed. overall_status=${healthy ? 'PASS' : 'HAS_ERRORS'}`);
  if (!healthy) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('\nWrite benchmark failed:', error?.message || error);
  console.error(
    'Hint: ensure backend is running and PERF_API_BASE_URL / credentials are correct.',
  );
  process.exitCode = 1;
});
