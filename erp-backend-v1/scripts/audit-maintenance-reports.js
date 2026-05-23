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
    '/reports/maintenance/overview',
    '/reports/maintenance/by-type',
    '/reports/maintenance/by-status',
    '/reports/maintenance/by-asset',
    '/reports/maintenance/cost-analysis',
    '/reports/maintenance/performance',
    '/reports/maintenance/preventive',
    '/reports/maintenance/mtbf-mttr',
    '/reports/maintenance/cost-per-asset',
    '/reports/maintenance/budget-vs-actual',
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

  // overview
  {
    const ep = '/reports/maintenance/overview';
    const d = responses[ep];
    if (d) {
      const statusRows = d.statusDistribution || [];
      if (statusRows.length > 0) {
        const statusCountKey = findKey(statusRows[0], ['count', 'requestCount', 'totalRequests']);
        if (statusCountKey) {
          const sum = statusRows.reduce((s, x) => s + toNum(x[statusCountKey]), 0);
          assertNear(failures, ep, `sum(statusDistribution.${statusCountKey})`, sum, d.totalRequests);
        }
      }

      const distTargets = [
        ['statusDistribution', 'status'],
        ['typeDistribution', 'maintenanceType'],
        ['priorityDistribution', 'priority'],
      ];
      for (const [k] of distTargets) {
        const arr = d[k] || [];
        if (arr.length > 0) {
          const countKey = findKey(arr[0], ['count', 'requestCount', 'totalRequests']);
          if (countKey) {
            const sum = arr.reduce((s, x) => s + toNum(x[countKey]), 0);
            assertNear(failures, ep, `sum(${k}.${countKey})`, sum, d.totalRequests);
          }
        }
      }
    }
  }

  // by-type
  {
    const ep = '/reports/maintenance/by-type';
    const d = responses[ep];
    if (d) {
      const rows = d.breakdown || [];
      if (rows.length > 0) {
        const countKey = findKey(rows[0], ['count', 'requestCount', 'totalRequests']);
        if (countKey) {
          const sumCount = rows.reduce((s, x) => s + toNum(x[countKey]), 0);
          assertNear(failures, ep, `sum(breakdown.${countKey})`, sumCount, d.totalRequests);
        }
      }
    }
  }

  // by-status
  {
    const ep = '/reports/maintenance/by-status';
    const d = responses[ep];
    if (d) {
      const rows = d.breakdown || [];
      if (rows.length > 0) {
        const countKey = findKey(rows[0], ['count', 'requestCount', 'totalRequests']);
        if (countKey) {
          const sumCount = rows.reduce((s, x) => s + toNum(x[countKey]), 0);
          assertNear(failures, ep, `sum(breakdown.${countKey})`, sumCount, d.totalRequests);
        }
      }
    }
  }

  // by-asset
  {
    const ep = '/reports/maintenance/by-asset';
    const d = responses[ep];
    if (d) {
      const rows = d.breakdown || [];
      if (rows.length > 0) {
        const countKey = findKey(rows[0], ['requestCount', 'count', 'totalRequests']);
        if (countKey) {
          const sumReq = rows.reduce((s, x) => s + toNum(x[countKey]), 0);
          assertNear(failures, ep, `sum(breakdown.${countKey})`, sumReq, d.totalMaintenanceRequests);
        }
      }
    }
  }

  // cost-analysis
  {
    const ep = '/reports/maintenance/cost-analysis';
    const d = responses[ep];
    if (d) {
      const diff1 = toNum(d.totalActualCost) - toNum(d.totalEstimatedCost);
      const diff2 = toNum(d.totalEstimatedCost) - toNum(d.totalActualCost);
      if (!(near(diff1, d.totalCostVariance) || near(diff2, d.totalCostVariance))) {
        failures.push({
          endpoint: ep,
          field: 'cost_variance_equation',
          actual: d.totalCostVariance,
          expected: `${round2(diff1)} or ${round2(diff2)}`,
        });
      }
      for (const key of ['costByType', 'costByAssetType', 'costByVendor']) {
        const arr = d[key] || [];
        if (arr.length > 0) {
          const costKey = findKey(arr[0], ['totalCost', 'cost', 'actualCost', 'amount']);
          if (costKey) {
            const sumCost = arr.reduce((s, x) => s + toNum(x[costKey]), 0);
            assertNear(failures, ep, `sum(${key}.${costKey})`, sumCost, d.totalActualCost);
          }
        }
      }
    }
  }

  // performance
  {
    const ep = '/reports/maintenance/performance';
    const d = responses[ep];
    if (d) {
      assertNear(failures, ep, 'completed<=total', Math.min(toNum(d.completedRequests), toNum(d.totalRequests)), d.completedRequests);
    }
  }

  // preventive
  {
    const ep = '/reports/maintenance/preventive';
    const d = responses[ep];
    if (d) {
      assertNear(
        failures,
        ep,
        'preventive_counts',
        toNum(d.completedPreventiveCount) + toNum(d.overdueCount) + toNum(d.upcomingCount),
        d.totalPreventiveCount,
      );
    }
  }

  // mtbf-mttr
  {
    const ep = '/reports/maintenance/mtbf-mttr';
    const d = responses[ep];
    if (d) {
      const rows = d.assets || [];
      const s = d.summary || {};
      if (s.totalAssets != null) {
        assertNear(failures, ep, 'summary.totalAssets', rows.length, s.totalAssets);
      }
    }
  }

  // cost-per-asset
  {
    const ep = '/reports/maintenance/cost-per-asset';
    const d = responses[ep];
    if (d) {
      const rows = d.assets || [];
      const s = d.summary || {};
      if (s.totalAssets != null) {
        assertNear(failures, ep, 'summary.totalAssets', rows.length, s.totalAssets);
      }
      if (s.totalCost != null) {
        const sum = rows.reduce((acc, x) => acc + toNum(x.totalCost), 0);
        assertNear(failures, ep, 'sum(assets.totalCost)', sum, s.totalCost);
      }
    }
  }

  // budget-vs-actual
  {
    const ep = '/reports/maintenance/budget-vs-actual';
    const d = responses[ep];
    if (d) {
      const rows = d.items || [];
      const s = d.summary || {};
      if (s.totalEstimatedCost != null) {
        const sumEst = rows.reduce((acc, x) => acc + toNum(x.totalEstimatedCost), 0);
        assertNear(failures, ep, 'sum(items.totalEstimatedCost)', sumEst, s.totalEstimatedCost);
      }
      if (s.totalActualCost != null) {
        const sumAct = rows.reduce((acc, x) => acc + toNum(x.totalActualCost), 0);
        assertNear(failures, ep, 'sum(items.totalActualCost)', sumAct, s.totalActualCost);
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
  const outFile = path.join(outDir, 'maintenance-reports-validation.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log('========================================');
  console.log(`Maintenance Reports Validation: ${report.summary.pass ? 'PASS' : 'FAIL'}`);
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
  console.error('Maintenance reports validation failed:', e.message);
  process.exitCode = 1;
});
