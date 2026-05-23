/* eslint-disable no-console */
require('dotenv/config');

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.PERF_BASE_URL || 'http://localhost:9000/api/v1';
const EMAIL = process.env.PERF_EMAIL || 'superadmin@erp.sys';
const PASSWORD = process.env.PERF_PASSWORD || 'Admin@123456';
const EPS = 0.05;

function toNum(v) {
  if (v == null) return 0;
  return Number(v);
}
function round2(v) {
  return Math.round((toNum(v) + Number.EPSILON) * 100) / 100;
}
function near(a, b, eps = EPS) {
  return Math.abs(round2(a) - round2(b)) <= eps;
}
function assertNear(failures, endpoint, field, actual, expected) {
  if (!near(actual, expected)) {
    failures.push({
      endpoint,
      field,
      actual: round2(actual),
      expected: round2(expected),
      diff: round2(round2(actual) - round2(expected)),
    });
  }
}

function findKey(obj, candidates) {
  for (const k of candidates) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) return k;
  }
  return null;
}

async function getToken() {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, rememberMe: false }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.tokens?.accessToken) {
    throw new Error(
      `Login failed (${res.status}). Check PERF_EMAIL/PERF_PASSWORD and API availability.`,
    );
  }
  return body.tokens.accessToken;
}

async function apiFetch(token, endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  const failures = [];
  const endpointStatus = [];
  const token = await getToken();

  const endpoints = [
    '/reports/assets/overview',
    '/reports/assets/by-type',
    '/reports/assets/by-status',
    '/reports/assets/by-location',
    '/reports/assets/depreciation',
    '/reports/assets/utilization',
  ];

  const responses = {};
  for (const endpoint of endpoints) {
    const r = await apiFetch(token, endpoint);
    endpointStatus.push({ endpoint, status: r.status });
    if (r.status !== 200) {
      failures.push({ endpoint, field: 'http_status', actual: r.status, expected: 200 });
      continue;
    }
    responses[endpoint] = r.body;
  }

  // by-type
  {
    const ep = '/reports/assets/by-type';
    const d = responses[ep];
    if (d) {
      const rows = d.breakdown || [];
      const countKey = rows[0] ? findKey(rows[0], ['count', 'assetCount', 'totalAssets']) : null;
      const valueKey = rows[0] ? findKey(rows[0], ['totalValue', 'value', 'currentValue']) : null;
      if (countKey) {
        const sumCount = rows.reduce((s, x) => s + toNum(x[countKey]), 0);
        assertNear(failures, ep, `sum(breakdown.${countKey})`, sumCount, d.totalAssets);
      }
      if (valueKey) {
        const sumValue = rows.reduce((s, x) => s + toNum(x[valueKey]), 0);
        assertNear(failures, ep, `sum(breakdown.${valueKey})`, sumValue, d.totalValue);
      }
    }
  }

  // by-status
  {
    const ep = '/reports/assets/by-status';
    const d = responses[ep];
    if (d) {
      const rows = d.breakdown || [];
      const countKey = rows[0] ? findKey(rows[0], ['count', 'assetCount', 'totalAssets']) : null;
      const valueKey = rows[0] ? findKey(rows[0], ['totalValue', 'value', 'currentValue']) : null;
      if (countKey) {
        const sumCount = rows.reduce((s, x) => s + toNum(x[countKey]), 0);
        assertNear(failures, ep, `sum(breakdown.${countKey})`, sumCount, d.totalAssets);
      }
      if (valueKey) {
        const sumValue = rows.reduce((s, x) => s + toNum(x[valueKey]), 0);
        assertNear(failures, ep, `sum(breakdown.${valueKey})`, sumValue, d.totalValue);
      }
    }
  }

  // by-location
  {
    const ep = '/reports/assets/by-location';
    const d = responses[ep];
    if (d) {
      const rows = d.breakdown || [];
      const countKey = rows[0] ? findKey(rows[0], ['count', 'assetCount', 'totalAssets']) : null;
      const valueKey = rows[0] ? findKey(rows[0], ['totalValue', 'value', 'currentValue']) : null;
      if (countKey) {
        const sumCount = rows.reduce((s, x) => s + toNum(x[countKey]), 0);
        assertNear(failures, ep, `sum(breakdown.${countKey})`, sumCount, d.totalAssets);
      }
      if (valueKey) {
        const sumValue = rows.reduce((s, x) => s + toNum(x[valueKey]), 0);
        assertNear(failures, ep, `sum(breakdown.${valueKey})`, sumValue, d.totalValue);
      }
    }
  }

  // depreciation
  {
    const ep = '/reports/assets/depreciation';
    const d = responses[ep];
    if (d) {
      const byType = d.byType || [];
      const byAge = d.byAgeGroup || [];
      const sumTypeCount = byType.reduce((s, x) => s + toNum(x.count ?? x.assetCount), 0);
      const sumAgeCount = byAge.reduce((s, x) => s + toNum(x.count ?? x.assetCount), 0);
      assertNear(failures, ep, 'sum(byType.count)', sumTypeCount, d.totalAssets);
      // Age grouping may intentionally exclude assets with missing purchase date.
      if (sumAgeCount > toNum(d.totalAssets)) {
        failures.push({
          endpoint: ep,
          field: 'sum(byAgeGroup.count)<=totalAssets',
          actual: sumAgeCount,
          expected: d.totalAssets,
        });
      }
      assertNear(
        failures,
        ep,
        'purchase_minus_current',
        toNum(d.totalPurchaseValue) - toNum(d.totalCurrentValue),
        d.totalDepreciation,
      );
    }
  }

  // utilization
  {
    const ep = '/reports/assets/utilization';
    const d = responses[ep];
    if (d) {
      assertNear(
        failures,
        ep,
        'utilization_bucket_sum',
        toNum(d.highUtilizationCount) +
          toNum(d.lowUtilizationCount) +
          toNum(d.idleAssetsCount),
        d.totalAssets,
      );
      const byType = d.byType || [];
      if (byType.length > 0) {
        const sumCount = byType.reduce((s, x) => s + toNum(x.count ?? x.assetCount), 0);
        assertNear(failures, ep, 'sum(byType.count)', sumCount, d.totalAssets);
      }
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    endpointStatus,
    summary: {
      checks: failures.length,
      pass: failures.length === 0,
    },
    failures,
  };

  const outDir = path.join(process.cwd(), 'scripts', 'audit', 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'assets-reports-validation.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log('========================================');
  console.log(`Assets Reports Validation: ${report.summary.pass ? 'PASS' : 'FAIL'}`);
  console.log('========================================');
  console.log(`Endpoints checked: ${endpointStatus.length}`);
  console.log(`Failures: ${failures.length}`);
  console.log(`Report saved to: ${outFile}`);
  if (failures.length > 0) {
    console.log('\nTop failures:');
    failures.slice(0, 15).forEach((f, i) => {
      console.log(`${i + 1}. [${f.endpoint}] ${f.field} | actual=${f.actual} expected=${f.expected}`);
    });
    process.exitCode = 2;
  }
}

main().catch((e) => {
  console.error('Assets reports validation failed:', e.message);
  process.exitCode = 1;
});
