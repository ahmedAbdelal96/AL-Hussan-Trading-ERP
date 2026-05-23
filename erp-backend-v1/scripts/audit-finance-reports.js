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
const EPS = 0.05;

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
    '/reports/finance/overview',
    '/reports/finance/by-cost-type',
    '/reports/finance/by-payment-status',
    '/reports/finance/monthly-trend',
    '/reports/finance/by-category',
    '/reports/finance/by-project',
    '/reports/finance/pending-approvals',
    '/reports/finance/overdue-payments',
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

  // Basic reconciliation (no project filter)
  if (responses['/reports/finance/overview']) {
    const overview = responses['/reports/finance/overview'];
    const [totalAgg, pendingAgg, approvedAgg, paidAgg, overdueAgg, rejectedAgg, partialAgg] =
      await Promise.all([
        prisma.cost.aggregate({
          where: { paymentStatus: { not: 'REJECTED' } },
          _sum: { amount: true },
          _count: { id: true },
          _avg: { amount: true },
        }),
        prisma.cost.aggregate({ where: { paymentStatus: 'PENDING' }, _sum: { amount: true }, _count: { id: true } }),
        prisma.cost.aggregate({ where: { paymentStatus: 'APPROVED' }, _sum: { amount: true }, _count: { id: true } }),
        prisma.cost.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { amount: true }, _count: { id: true } }),
        prisma.cost.aggregate({ where: { paymentStatus: 'OVERDUE' }, _sum: { amount: true }, _count: { id: true } }),
        prisma.cost.aggregate({ where: { paymentStatus: 'REJECTED' }, _sum: { amount: true }, _count: { id: true } }),
        prisma.cost.aggregate({ where: { paymentStatus: 'PARTIALLY_PAID' }, _sum: { amount: true }, _count: { id: true } }),
      ]);

    assertNear(failures, '/reports/finance/overview', 'totalCosts', overview.totalCosts, toNum(totalAgg._sum.amount));
    assertNear(failures, '/reports/finance/overview', 'totalCount', overview.totalCount, toNum(totalAgg._count.id));
    assertNear(failures, '/reports/finance/overview', 'averageCost', overview.averageCost, toNum(totalAgg._avg.amount));
    assertNear(failures, '/reports/finance/overview', 'pendingAmount', overview.pendingAmount, toNum(pendingAgg._sum.amount));
    assertNear(failures, '/reports/finance/overview', 'pendingCount', overview.pendingCount, toNum(pendingAgg._count.id));
    assertNear(failures, '/reports/finance/overview', 'approvedAmount', overview.approvedAmount, toNum(approvedAgg._sum.amount));
    assertNear(failures, '/reports/finance/overview', 'paidAmount', overview.paidAmount, toNum(paidAgg._sum.amount));
    assertNear(failures, '/reports/finance/overview', 'overdueAmount', overview.overdueAmount, toNum(overdueAgg._sum.amount));
    assertNear(failures, '/reports/finance/overview', 'rejectedAmount', overview.rejectedAmount, toNum(rejectedAgg._sum.amount));
    assertNear(failures, '/reports/finance/overview', 'partiallyPaidAmount', overview.partiallyPaidAmount, toNum(partialAgg._sum.amount));
  }

  // Consistency checks
  if (responses['/reports/finance/by-cost-type']) {
    const data = responses['/reports/finance/by-cost-type'];
    const sumAmount = (data.breakdown || []).reduce((s, x) => s + toNum(x.amount), 0);
    const sumCount = (data.breakdown || []).reduce((s, x) => s + toNum(x.count), 0);
    assertNear(failures, '/reports/finance/by-cost-type', 'sum(breakdown.amount)', sumAmount, data.totalAmount);
    assertNear(failures, '/reports/finance/by-cost-type', 'sum(breakdown.count)', sumCount, data.totalCount);
  }
  if (responses['/reports/finance/by-payment-status']) {
    const data = responses['/reports/finance/by-payment-status'];
    const sumAmount = (data.breakdown || []).reduce((s, x) => s + toNum(x.amount), 0);
    const sumCount = (data.breakdown || []).reduce((s, x) => s + toNum(x.count), 0);
    assertNear(failures, '/reports/finance/by-payment-status', 'sum(breakdown.amount)', sumAmount, data.totalAmount);
    assertNear(failures, '/reports/finance/by-payment-status', 'sum(breakdown.count)', sumCount, data.totalCount);
  }
  if (responses['/reports/finance/by-category']) {
    const data = responses['/reports/finance/by-category'];
    const sumAmount = (data.breakdown || []).reduce((s, x) => s + toNum(x.amount), 0);
    const sumCount = (data.breakdown || []).reduce((s, x) => s + toNum(x.count), 0);
    assertNear(failures, '/reports/finance/by-category', 'sum(breakdown.amount)', sumAmount, data.totalAmount);
    assertNear(failures, '/reports/finance/by-category', 'sum(breakdown.count)', sumCount, data.totalCount);
  }

  // Project-filter regression check: direct + allocated share
  const sampleProject = await prisma.project.findFirst({
    where: {
      OR: [
        { costs: { some: {} } },
        { costAllocations: { some: { cost: { projectId: null, isAllocated: true } } } },
      ],
    },
    select: { id: true },
  });

  if (sampleProject) {
    const pid = sampleProject.id;
    const [overviewRes, byTypeRes, byStatusRes] = await Promise.all([
      apiFetch(token, `/reports/finance/overview?projectId=${pid}`),
      apiFetch(token, `/reports/finance/by-cost-type?projectId=${pid}`),
      apiFetch(token, `/reports/finance/by-payment-status?projectId=${pid}`),
    ]);
    endpointStatus.push({ endpoint: `/reports/finance/*?projectId=${pid}`, status: [overviewRes.status, byTypeRes.status, byStatusRes.status].every((x) => x === 200) ? 200 : 500 });

    if (overviewRes.status === 200) {
      const [directAgg, allocAgg] = await Promise.all([
        prisma.cost.aggregate({
          where: {
            projectId: pid,
            paymentStatus: { not: 'REJECTED' },
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
        prisma.costAllocation.aggregate({
          where: { projectId: pid, cost: { projectId: null, isAllocated: true } },
          _sum: { allocatedAmount: true },
          _count: { id: true },
        }),
      ]);
      const expectedAmount = toNum(directAgg._sum.amount) + toNum(allocAgg._sum.allocatedAmount);
      const expectedCount = toNum(directAgg._count.id) + toNum(allocAgg._count.id);
      assertNear(failures, '/reports/finance/overview?projectId', 'totalCosts', overviewRes.body.totalCosts, expectedAmount);
      assertNear(failures, '/reports/finance/overview?projectId', 'totalCount', overviewRes.body.totalCount, expectedCount);
    } else {
      failures.push({ endpoint: '/reports/finance/overview?projectId', field: 'http_status', actual: overviewRes.status, expected: 200 });
    }

    if (byTypeRes.status === 200) {
      const sum = (byTypeRes.body.breakdown || []).reduce((s, x) => s + toNum(x.amount), 0);
      assertNear(failures, '/reports/finance/by-cost-type?projectId', 'sum(breakdown.amount)', sum, byTypeRes.body.totalAmount);
    } else {
      failures.push({ endpoint: '/reports/finance/by-cost-type?projectId', field: 'http_status', actual: byTypeRes.status, expected: 200 });
    }
    if (byStatusRes.status === 200) {
      const sum = (byStatusRes.body.breakdown || []).reduce((s, x) => s + toNum(x.amount), 0);
      assertNear(failures, '/reports/finance/by-payment-status?projectId', 'sum(breakdown.amount)', sum, byStatusRes.body.totalAmount);
    } else {
      failures.push({ endpoint: '/reports/finance/by-payment-status?projectId', field: 'http_status', actual: byStatusRes.status, expected: 200 });
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
  const outFile = path.join(outDir, 'finance-reports-validation.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log('========================================');
  console.log(`Finance Reports Validation: ${report.summary.pass ? 'PASS' : 'FAIL'}`);
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
    console.error('Finance reports validation failed:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
