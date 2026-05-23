#!/usr/bin/env node
'use strict';

/**
 * Write-heavy benchmark for operations modules:
 * - sites CRUD
 * - projects CRUD
 *
 * Safe behavior:
 * - Uses unique payloads per round.
 * - Best-effort cleanup in finally to prevent data leakage.
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
  return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, index))];
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

function toFixedNumber(value, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function ensureDirForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function savePayload(payload, outputFile) {
  ensureDirForFile(outputFile);
  fs.writeFileSync(outputFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function toPayload(config, operationResults) {
  return {
    generatedAt: new Date().toISOString(),
    config,
    results: operationResults.map((r) => ({
      endpoint: r.operation,
      path: r.path,
      successCount: r.successCount,
      errorCount: r.errorCount,
      stats: {
        min: toFixedNumber(r.stats.min),
        avg: toFixedNumber(r.stats.avg),
        max: toFixedNumber(r.stats.max),
        p50: toFixedNumber(r.stats.p50),
        p95: toFixedNumber(r.stats.p95),
        p99: toFixedNumber(r.stats.p99),
      },
    })),
  };
}

function printComparison(currentPayload, baselinePayload) {
  const baselineMap = new Map(
    (baselinePayload.results || []).map((row) => [row.endpoint, row]),
  );
  console.log('\n========================= Comparison ========================');
  console.log(`baseline: ${baselinePayload.generatedAt}`);
  console.log(`current : ${currentPayload.generatedAt}`);
  for (const row of currentPayload.results || []) {
    const base = baselineMap.get(row.endpoint);
    if (!base) {
      console.log(`${row.endpoint}: skipped (missing in baseline)`);
      continue;
    }
    const diffAvg = row.stats.avg - base.stats.avg;
    const diffP95 = row.stats.p95 - base.stats.p95;
    const diffP99 = row.stats.p99 - base.stats.p99;
    console.log(
      `${row.endpoint}: avg ${diffAvg >= 0 ? '+' : ''}${toFixedNumber(diffAvg)}ms, p95 ${diffP95 >= 0 ? '+' : ''}${toFixedNumber(diffP95)}ms, p99 ${diffP99 >= 0 ? '+' : ''}${toFixedNumber(diffP99)}ms`,
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
    throw new Error(`Request failed for ${url}: ${error?.message || error}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function requestJson(baseUrl, endpoint, method, accessToken, timeoutMs, body) {
  const headers = { authorization: `Bearer ${accessToken}` };
  if (body !== undefined) headers['content-type'] = 'application/json';

  const { response, durationMs } = await fetchWithTimeout(
    `${baseUrl}${endpoint}`,
    {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    },
    timeoutMs,
  );

  const raw = await response.text();
  let json = null;
  if (raw) {
    try {
      json = JSON.parse(raw);
    } catch (_err) {}
  }
  return { ok: response.ok, status: response.status, durationMs, raw, json };
}

function extractEntityId(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (typeof payload.id === 'string') return payload.id;
  if (payload.data && typeof payload.data.id === 'string') return payload.data.id;
  if (
    payload.deletedSite &&
    typeof payload.deletedSite.id === 'string'
  ) {
    return payload.deletedSite.id;
  }
  return null;
}

async function login(baseUrl, email, password, timeoutMs) {
  const res = await requestJson(baseUrl, '/auth/login', 'POST', '', timeoutMs, {
    email,
    password,
    rememberMe: false,
  });
  if (!res.ok) {
    throw new Error(`Login failed (${res.status}): ${res.raw}`);
  }
  const token = res.json?.tokens?.accessToken;
  if (!token) throw new Error('Login response missing tokens.accessToken');
  return token;
}

function createOpMap() {
  const ops = [
    ['site_create', '/sites'],
    ['site_update', '/sites/:id'],
    ['site_delete', '/sites/:id'],
    ['project_create', '/projects'],
    ['project_update', '/projects/:id'],
    ['project_delete', '/projects/:id'],
  ];
  const map = new Map();
  for (const [operation, pathName] of ops) {
    map.set(operation, {
      operation,
      path: pathName,
      durations: [],
      successCount: 0,
      errorCount: 0,
      errors: [],
    });
  }
  return map;
}

function track(opMap, operation, result, customError) {
  const row = opMap.get(operation);
  if (!row) return;
  if (typeof result?.durationMs === 'number') row.durations.push(result.durationMs);
  if (result?.ok) {
    row.successCount += 1;
    return;
  }
  row.errorCount += 1;
  if (row.errors.length < 3) {
    row.errors.push(
      customError || `status=${result?.status ?? 0} ${(result?.raw || '').slice(0, 250)}`,
    );
  }
}

function printRow(row) {
  console.log('\n------------------------------------------------------------');
  console.log(`${row.operation} (${row.path})`);
  console.log(`success=${row.successCount}  errors=${row.errorCount}`);
  console.log(
    `min=${row.stats.min.toFixed(2)}ms  avg=${row.stats.avg.toFixed(2)}ms  max=${row.stats.max.toFixed(2)}ms`,
  );
  console.log(
    `p50=${row.stats.p50.toFixed(2)}ms  p95=${row.stats.p95.toFixed(2)}ms  p99=${row.stats.p99.toFixed(2)}ms`,
  );
  if (row.errors.length) {
    console.log('sample errors:');
    for (const err of row.errors) console.log(`- ${err}`);
  }
}

async function runRound({ baseUrl, accessToken, timeoutMs, round, opMap }) {
  const suffix = `${Date.now()}-${round}-${Math.floor(Math.random() * 100000)}`;
  let siteId = null;
  let projectId = null;

  try {
    const siteCreate = await requestJson(baseUrl, '/sites', 'POST', accessToken, timeoutMs, {
      name: `PERF Site ${suffix}`,
      code: `PERF-${round}-${Math.floor(Math.random() * 9999)}`.toUpperCase(),
      address: `Auto benchmark address ${suffix}`,
      city: 'Riyadh',
      country: 'Saudi Arabia',
      description: 'Auto-generated by benchmark',
    });
    track(opMap, 'site_create', siteCreate);
    if (!siteCreate.ok) return;
    siteId = extractEntityId(siteCreate.json);
    if (!siteId) {
      track(opMap, 'site_update', { ok: false, status: 0 }, 'Cannot extract site id');
      return;
    }

    const siteUpdate = await requestJson(
      baseUrl,
      `/sites/${siteId}`,
      'PUT',
      accessToken,
      timeoutMs,
      {
        notes: `Updated benchmark note ${suffix}`,
        state: 'Riyadh Region',
      },
    );
    track(opMap, 'site_update', siteUpdate);
    if (!siteUpdate.ok) return;

    const projectCreate = await requestJson(
      baseUrl,
      '/projects',
      'POST',
      accessToken,
      timeoutMs,
      {
        name: `PERF Project ${suffix}`,
        description: 'Auto-generated benchmark project',
        clientName: 'Perf Client',
        siteId,
        budget: 100000,
      },
    );
    track(opMap, 'project_create', projectCreate);
    if (!projectCreate.ok) return;
    projectId = extractEntityId(projectCreate.json);
    if (!projectId) {
      track(opMap, 'project_update', { ok: false, status: 0 }, 'Cannot extract project id');
      return;
    }

    const projectUpdate = await requestJson(
      baseUrl,
      `/projects/${projectId}`,
      'PUT',
      accessToken,
      timeoutMs,
      {
        notes: `Updated benchmark project ${suffix}`,
        completionPercentage: 10,
      },
    );
    track(opMap, 'project_update', projectUpdate);
    if (!projectUpdate.ok) return;

    const projectDelete = await requestJson(
      baseUrl,
      `/projects/${projectId}`,
      'DELETE',
      accessToken,
      timeoutMs,
    );
    track(opMap, 'project_delete', projectDelete);
    if (projectDelete.ok) projectId = null;

    const siteDelete = await requestJson(
      baseUrl,
      `/sites/${siteId}`,
      'DELETE',
      accessToken,
      timeoutMs,
    );
    track(opMap, 'site_delete', siteDelete);
    if (siteDelete.ok) siteId = null;
  } finally {
    if (projectId) {
      await requestJson(baseUrl, `/projects/${projectId}`, 'DELETE', accessToken, timeoutMs);
    }
    if (siteId) {
      await requestJson(baseUrl, `/sites/${siteId}`, 'DELETE', accessToken, timeoutMs);
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
    path.join(process.cwd(), 'scripts', 'perf', 'results', 'write-ops-current.json');

  if (!email || !password) throw new Error('Missing PERF_EMAIL or PERF_PASSWORD.');

  console.log('Starting ops write benchmark with config:');
  console.log(
    JSON.stringify(
      { baseUrl, timeoutMs, warmupRounds, measuredRounds, scenario: 'sites+projects CRUD' },
      null,
      2,
    ),
  );

  const accessToken = await login(baseUrl, email, password, timeoutMs);
  for (let i = 0; i < warmupRounds; i += 1) {
    await runRound({
      baseUrl,
      accessToken,
      timeoutMs,
      round: i + 1,
      opMap: createOpMap(),
    });
  }

  const opMap = createOpMap();
  for (let i = 0; i < measuredRounds; i += 1) {
    await runRound({ baseUrl, accessToken, timeoutMs, round: i + 1, opMap });
  }

  const results = Array.from(opMap.values()).map((row) => ({
    ...row,
    stats: summarizeDurations(row.durations),
  }));
  for (const row of results) printRow(row);

  const payload = toPayload(
    { baseUrl, timeoutMs, warmupRounds, measuredRounds, scenario: 'sites+projects CRUD' },
    results,
  );
  savePayload(payload, outputFile);
  console.log(`\nResults saved to: ${outputFile}`);

  if (compareFile) {
    try {
      printComparison(payload, JSON.parse(fs.readFileSync(compareFile, 'utf8')));
    } catch (error) {
      console.log(`Comparison skipped: ${error.message}`);
    }
  }

  const healthy = results.every((r) => r.errorCount === 0);
  console.log('\n============================================================');
  console.log(`Write ops benchmark completed. overall_status=${healthy ? 'PASS' : 'HAS_ERRORS'}`);
  if (!healthy) process.exitCode = 1;
}

main().catch((error) => {
  console.error('\nWrite ops benchmark failed:', error?.message || error);
  console.error(
    'Hint: ensure backend is running and PERF_API_BASE_URL / credentials are correct.',
  );
  process.exitCode = 1;
});
