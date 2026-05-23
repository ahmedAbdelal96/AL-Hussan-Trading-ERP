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
    '/reports/users/overview',
    '/reports/users/login-activity',
    '/reports/users/failed-login-attempts',
    '/reports/users/active-sessions',
    '/reports/users/roles-permissions',
    '/reports/users/audit-logs',
    '/reports/users/locked-accounts',
    '/reports/users/permission-grant-history',
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
  if (responses['/reports/users/overview']) {
    const body = responses['/reports/users/overview'];
    const [allUsers, activeUsers, deletedUsers, permanentlyLocked, tempLocked] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { deletedAt: { not: null } } }),
      prisma.user.count({ where: { permanentlyLocked: true } }),
      prisma.user.count({
        where: {
          permanentlyLocked: false,
          lockedUntil: { gt: new Date() },
        },
      }),
    ]);

    assertNear(failures, '/reports/users/overview', 'kpis.totalUsers', body?.kpis?.totalUsers, allUsers);
    assertNear(failures, '/reports/users/overview', 'kpis.activeUsers', body?.kpis?.activeUsers, activeUsers);
    assertNear(failures, '/reports/users/overview', 'kpis.deletedUsers', body?.kpis?.deletedUsers, deletedUsers);
    assertNear(
      failures,
      '/reports/users/overview',
      'lockStatistics.permanentlyLocked',
      body?.lockStatistics?.permanentlyLocked,
      permanentlyLocked,
    );
    assertNear(
      failures,
      '/reports/users/overview',
      'lockStatistics.temporarilyLocked',
      body?.lockStatistics?.temporarilyLocked,
      tempLocked,
    );
  }

  // Reconcile locked accounts report with DB.
  if (responses['/reports/users/locked-accounts']) {
    const body = responses['/reports/users/locked-accounts'];
    const [permanentlyLocked, tempLocked] = await Promise.all([
      prisma.user.count({ where: { permanentlyLocked: true } }),
      prisma.user.count({
        where: {
          permanentlyLocked: false,
          lockedUntil: { gt: new Date() },
        },
      }),
    ]);
    assertNear(
      failures,
      '/reports/users/locked-accounts',
      'metrics.permanentlyLocked',
      body?.metrics?.permanentlyLocked,
      permanentlyLocked,
    );
    assertNear(
      failures,
      '/reports/users/locked-accounts',
      'metrics.temporarilyLocked',
      body?.metrics?.temporarilyLocked,
      tempLocked,
    );
    assertNear(
      failures,
      '/reports/users/locked-accounts',
      'metrics.totalLocked',
      body?.metrics?.totalLocked,
      permanentlyLocked + tempLocked,
    );
  }

  // Shape checks on remaining endpoints to avoid silent contract drift.
  const requiredKeys = {
    '/reports/users/login-activity': ['kpis', 'trend', 'generatedAt'],
    '/reports/users/failed-login-attempts': ['metrics', 'usersWithFailures', 'generatedAt'],
    '/reports/users/active-sessions': ['metrics', 'usersWithSessions', 'generatedAt'],
    '/reports/users/roles-permissions': ['metrics', 'roleDistribution', 'generatedAt'],
    '/reports/users/audit-logs': ['metrics', 'logs', 'pagination', 'generatedAt'],
    '/reports/users/permission-grant-history': ['metrics', 'history', 'generatedAt'],
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
  const outFile = path.join(outDir, 'users-reports-validation.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log('========================================');
  console.log(`Users Reports Validation: ${report.summary.pass ? 'PASS' : 'FAIL'}`);
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
    console.error('Users reports validation failed:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

