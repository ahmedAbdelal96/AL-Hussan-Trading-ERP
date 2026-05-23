/* eslint-disable no-console */
require('dotenv/config');

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const BASE_URL = process.env.PERF_BASE_URL || 'http://localhost:9000/api/v1';
const EMAIL = process.env.PERF_EMAIL || 'superadmin@erp.sys';
const PASSWORD = process.env.PERF_PASSWORD || 'Admin@123456';
const EPS = 0.1;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required.');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
    '/reports/sites/overview',
    '/reports/sites/by-status',
    '/reports/sites/by-location',
    '/reports/sites/capacity',
    '/reports/sites/with-projects',
    '/reports/sites/performance',
    '/reports/sites/profitability',
  ];

  const responses = {};
  for (const endpoint of endpoints) {
    const r = await apiFetch(token, endpoint);
    endpointStatus.push({ endpoint, status: r.status });
    if (r.status !== 200) {
      failures.push({
        endpoint,
        field: 'http_status',
        actual: r.status,
        expected: 200,
      });
      continue;
    }
    responses[endpoint] = r.body;
  }

  // Reconcile overview with DB.
  if (responses['/reports/sites/overview']) {
    const body = responses['/reports/sites/overview'];
    const totalSites = await prisma.site.count({
      where: { deletedAt: null },
    });
    const statusGroups = await prisma.site.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const activeSites = statusGroups.find((g) => g.status === 'ACTIVE')?._count._all || 0;

    assertNear(failures, '/reports/sites/overview', 'kpi.totalSites', body?.kpi?.totalSites, totalSites);
    assertNear(failures, '/reports/sites/overview', 'kpi.activeSites', body?.kpi?.activeSites, activeSites);

    const statusSum = (body?.statusDistribution || []).reduce((s, x) => s + toNum(x.count), 0);
    assertNear(
      failures,
      '/reports/sites/overview',
      'sum(statusDistribution.count)',
      statusSum,
      body?.kpi?.totalSites,
    );
  }

  // Reconcile with-projects response.
  if (responses['/reports/sites/with-projects']) {
    const body = responses['/reports/sites/with-projects'];
    const totalSites = await prisma.site.count({
      where: { deletedAt: null },
    });
    const expectedWithProjects = await prisma.site.count({
      where: {
        deletedAt: null,
        projects: {
          some: {
            deletedAt: null,
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          },
        },
      },
    });
    const expectedWithoutProjects = totalSites - expectedWithProjects;
    assertNear(
      failures,
      '/reports/sites/with-projects',
      'totalSites',
      body?.totalSites,
      totalSites,
    );
    assertNear(
      failures,
      '/reports/sites/with-projects',
      'sitesWithProjects',
      body?.sitesWithProjects,
      expectedWithProjects,
    );
    assertNear(
      failures,
      '/reports/sites/with-projects',
      'sitesWithoutProjects',
      body?.sitesWithoutProjects,
      expectedWithoutProjects,
    );
  }

  // Shape checks on remaining endpoints.
  const requiredKeys = {
    '/reports/sites/by-status': ['statusBreakdown'],
    '/reports/sites/by-location': ['locationDistribution'],
    '/reports/sites/capacity': ['aggregate', 'sites'],
    '/reports/sites/performance': ['sites', 'averagePerformanceScore'],
    '/reports/sites/profitability': ['sites', 'summary', 'generatedAt'],
  };
  for (const [endpoint, keys] of Object.entries(requiredKeys)) {
    const payload = responses[endpoint];
    if (!payload) continue;
    for (const key of keys) {
      if (!(key in payload)) {
        failures.push({
          endpoint,
          field: `missing_key:${key}`,
          actual: false,
          expected: true,
        });
      }
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    endpointStatus,
    summary: {
      checks: endpointStatus.length,
      pass: failures.length === 0,
      failures: failures.length,
    },
    failures,
  };

  const outDir = path.join(process.cwd(), 'scripts', 'audit', 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'sites-reports-validation.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log('========================================');
  console.log(`Sites Reports Validation: ${report.summary.pass ? 'PASS' : 'FAIL'}`);
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

main()
  .catch((e) => {
    console.error('Sites reports validation failed:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
