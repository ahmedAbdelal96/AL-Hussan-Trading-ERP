/* eslint-disable no-console */
require('dotenv/config');

const fs = require('fs');
const path = require('path');
const { PrismaClient, ProjectStatus, CostType } = require('@prisma/client');
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

function calcBudgetStatus(budget, actual) {
  if (budget === 0) return 'NO_BUDGET';
  const utilization = (actual / budget) * 100;
  if (utilization >= 95 && utilization <= 105) return 'WITHIN_BUDGET';
  if (utilization > 105) return 'OVER_BUDGET';
  return 'UNDER_BUDGET';
}

async function apiFetch(token, endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

function buildOverviewFilter(month, year) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  return {
    deletedAt: null,
    OR: [
      { createdAt: { gte: start, lte: end } },
      { updatedAt: { gte: start, lte: end } },
      { status: { in: [ProjectStatus.ACTIVE, ProjectStatus.PLANNING] } },
    ],
  };
}

function buildPhase1ProjectFilter(month, year, includeActualEndForCostBreakdown) {
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const start = new Date(year, month - 1, 1);
  const baseOr = [
    {
      status: {
        in: [ProjectStatus.ACTIVE, ProjectStatus.PLANNING, ProjectStatus.ON_HOLD],
      },
    },
    {
      createdAt: { lte: end },
    },
  ];
  if (includeActualEndForCostBreakdown) {
    baseOr.push({
      actualEndDate: { gte: start, lte: end },
    });
  }

  return {
    deletedAt: null,
    OR: baseOr,
  };
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
      `Login failed (${res.status}). Check API is running and PERF_EMAIL/PERF_PASSWORD are correct.`,
    );
  }
  return body.tokens.accessToken;
}

async function main() {
  const startedAt = new Date();
  const failures = [];
  const endpointStatus = [];

  const token = await getToken();

  // Use month/year from API overview response so DB and API use same period.
  const overviewRes = await apiFetch(token, '/reports/projects/overview');
  endpointStatus.push({ endpoint: '/reports/projects/overview', status: overviewRes.status });
  if (overviewRes.status !== 200) {
    throw new Error('Cannot validate reports because /reports/projects/overview failed.');
  }
  const month = overviewRes.body.month;
  const year = overviewRes.body.year;

  const endpointList = [
    '/reports/projects/by-status',
    '/reports/projects/by-site',
    '/reports/projects/budget-utilization',
    '/reports/projects/timeline-progress',
    '/reports/projects/delayed',
    '/reports/projects/completed',
    '/reports/projects/cost-breakdown?includeCostDetails=true',
    '/reports/projects/labor-cost?includeEmployeeDetails=true',
    '/reports/projects/asset-utilization?includeAssetDetails=true',
  ];

  const responses = {
    '/reports/projects/overview': overviewRes.body,
  };

  for (const endpoint of endpointList) {
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

  // ========================
  // 1) OVERVIEW (DB reconcile)
  // ========================
  {
    const data = responses['/reports/projects/overview'];
    if (data) {
      const where = buildOverviewFilter(month, year);
      const projects = await prisma.project.findMany({
        where,
        select: { id: true, status: true, budget: true, completionPercentage: true },
      });
      const ids = projects.map((p) => p.id);

      const [directAgg, allocAgg] = await Promise.all([
        prisma.cost.aggregate({
          where: { projectId: { in: ids } },
          _sum: { amount: true },
        }),
        prisma.costAllocation.aggregate({
          where: { projectId: { in: ids } },
          _sum: { allocatedAmount: true },
        }),
      ]);

      const expectedTotalProjects = projects.length;
      const expectedTotalBudget = projects.reduce((s, p) => s + toNum(p.budget), 0);
      const expectedTotalActualCost =
        toNum(directAgg._sum.amount) + toNum(allocAgg._sum.allocatedAmount);

      assertNear(failures, '/reports/projects/overview', 'totalProjects', data.totalProjects, expectedTotalProjects);
      assertNear(failures, '/reports/projects/overview', 'totalBudget', data.totalBudget, expectedTotalBudget);
      assertNear(failures, '/reports/projects/overview', 'totalActualCost', data.totalActualCost, expectedTotalActualCost);
      assertNear(failures, '/reports/projects/overview', 'budgetVariance', data.budgetVariance, data.totalBudget - data.totalActualCost);
      assertNear(failures, '/reports/projects/overview', 'budgetUtilization', data.budgetUtilization, data.totalBudget > 0 ? (data.totalActualCost / data.totalBudget) * 100 : 0);
    }
  }

  // ========================
  // 2) BY STATUS (consistency + DB totals)
  // ========================
  {
    const data = responses['/reports/projects/by-status'];
    if (data) {
      const sumItems = (data.items || []).reduce(
        (acc, i) => {
          acc.projects += toNum(i.projectCount);
          acc.budget += toNum(i.totalBudget);
          acc.actual += toNum(i.totalActualCost);
          return acc;
        },
        { projects: 0, budget: 0, actual: 0 },
      );
      assertNear(failures, '/reports/projects/by-status', 'sum(items.projectCount)', sumItems.projects, data.totalProjects);
      assertNear(failures, '/reports/projects/by-status', 'sum(items.totalBudget)', sumItems.budget, data.totalBudget);
      assertNear(failures, '/reports/projects/by-status', 'sum(items.totalActualCost)', sumItems.actual, data.totalActualCost);

      // DB reconcile for totalActualCost in this report (direct costs only by design)
      const where = buildOverviewFilter(month, year);
      const projects = await prisma.project.findMany({ where, select: { id: true } });
      const ids = projects.map((p) => p.id);
      const directAgg = await prisma.cost.aggregate({
        where: { projectId: { in: ids } },
        _sum: { amount: true },
      });
      assertNear(failures, '/reports/projects/by-status', 'db.totalActualCost(directOnly)', data.totalActualCost, toNum(directAgg._sum.amount));
    }
  }

  // ========================
  // 3) BUDGET UTILIZATION (DB reconcile)
  // ========================
  {
    const data = responses['/reports/projects/budget-utilization'];
    if (data) {
      const where = {
        ...buildOverviewFilter(month, year),
        budget: { not: null },
      };
      const projects = await prisma.project.findMany({
        where,
        select: { id: true, budget: true },
      });
      const ids = projects.map((p) => p.id);

      const [directByProject, allocRows] = await Promise.all([
        prisma.cost.groupBy({
          by: ['projectId'],
          where: { projectId: { in: ids } },
          _sum: { amount: true },
        }),
        prisma.costAllocation.findMany({
          where: {
            projectId: { in: ids },
            cost: { projectId: null, isAllocated: true },
          },
          select: { projectId: true, allocatedAmount: true },
        }),
      ]);

      const costMap = new Map();
      directByProject.forEach((r) => {
        if (r.projectId) costMap.set(r.projectId, toNum(r._sum.amount));
      });
      allocRows.forEach((r) => {
        const old = costMap.get(r.projectId) || 0;
        costMap.set(r.projectId, old + toNum(r.allocatedAmount));
      });

      for (const item of data.projects || []) {
        const expectedActual = round2(costMap.get(item.projectId) || 0);
        assertNear(failures, '/reports/projects/budget-utilization', `project(${item.projectCode}).actualCost`, item.actualCost, expectedActual);
        assertNear(failures, '/reports/projects/budget-utilization', `project(${item.projectCode}).budgetVariance`, item.budgetVariance, item.budget - item.actualCost);
        assertNear(
          failures,
          '/reports/projects/budget-utilization',
          `project(${item.projectCode}).utilization`,
          item.utilization,
          item.budget > 0 ? (item.actualCost / item.budget) * 100 : 0,
        );
        const expectedStatus = calcBudgetStatus(toNum(item.budget), toNum(item.actualCost));
        if (item.budgetStatus !== expectedStatus) {
          failures.push({
            endpoint: '/reports/projects/budget-utilization',
            field: `project(${item.projectCode}).budgetStatus`,
            actual: item.budgetStatus,
            expected: expectedStatus,
          });
        }
      }
    }
  }

  // ========================
  // 4) COST BREAKDOWN (DB reconcile + formulas)
  // ========================
  {
    const endpoint = '/reports/projects/cost-breakdown?includeCostDetails=true';
    const data = responses[endpoint];
    if (data) {
      const where = buildPhase1ProjectFilter(month, year, true);
      const projects = await prisma.project.findMany({ where, select: { id: true } });
      const ids = projects.map((p) => p.id);

      const [directAgg, allocAgg] = await Promise.all([
        prisma.cost.groupBy({
          by: ['projectId'],
          where: { projectId: { in: ids }, isAllocated: false },
          _sum: { amount: true },
        }),
        prisma.costAllocation.groupBy({
          by: ['projectId'],
          where: { projectId: { in: ids } },
          _sum: { allocatedAmount: true },
        }),
      ]);

      const directMap = new Map();
      directAgg.forEach((r) => r.projectId && directMap.set(r.projectId, toNum(r._sum.amount)));
      const allocMap = new Map();
      allocAgg.forEach((r) => allocMap.set(r.projectId, toNum(r._sum.allocatedAmount)));

      for (const item of data.projects || []) {
        const expectedDirect = round2(directMap.get(item.projectId) || 0);
        const expectedAllocated = round2(allocMap.get(item.projectId) || 0);
        assertNear(failures, endpoint, `project(${item.projectCode}).directCosts`, item.directCosts, expectedDirect);
        assertNear(failures, endpoint, `project(${item.projectCode}).allocatedCosts`, item.allocatedCosts, expectedAllocated);
        assertNear(failures, endpoint, `project(${item.projectCode}).totalCost`, item.totalCost, item.directCosts + item.allocatedCosts);
        assertNear(failures, endpoint, `project(${item.projectCode}).budgetVariance`, item.budgetVariance, item.budget - item.totalCost);
      }
    }
  }

  // ========================
  // 5) LABOR COST (DB reconcile + formulas)
  // ========================
  {
    const endpoint = '/reports/projects/labor-cost?includeEmployeeDetails=true';
    const data = responses[endpoint];
    if (data) {
      const where = buildPhase1ProjectFilter(month, year, false);
      const projects = await prisma.project.findMany({ where, select: { id: true } });
      const ids = projects.map((p) => p.id);

      const [directLabor, allocLabor, otherDirect, otherAlloc] = await Promise.all([
        prisma.cost.groupBy({
          by: ['projectId', 'costType'],
          where: { projectId: { in: ids }, costType: { in: [CostType.SALARY, CostType.ALLOWANCE] } },
          _sum: { amount: true },
        }),
        prisma.costAllocation.findMany({
          where: {
            projectId: { in: ids },
            cost: { projectId: null, isAllocated: true, costType: { in: [CostType.SALARY, CostType.ALLOWANCE] } },
          },
          select: { projectId: true, allocatedAmount: true, cost: { select: { costType: true } } },
        }),
        prisma.cost.groupBy({
          by: ['projectId'],
          where: { projectId: { in: ids }, costType: { notIn: [CostType.SALARY, CostType.ALLOWANCE] }, isAllocated: false },
          _sum: { amount: true },
        }),
        prisma.costAllocation.findMany({
          where: {
            projectId: { in: ids },
            cost: { projectId: null, isAllocated: true, costType: { notIn: [CostType.SALARY, CostType.ALLOWANCE] } },
          },
          select: { projectId: true, allocatedAmount: true },
        }),
      ]);

      const laborMap = new Map();
      directLabor.forEach((r) => {
        if (!r.projectId) return;
        if (!laborMap.has(r.projectId)) laborMap.set(r.projectId, { salary: 0, allowance: 0 });
        const cur = laborMap.get(r.projectId);
        if (r.costType === CostType.SALARY) cur.salary += toNum(r._sum.amount);
        if (r.costType === CostType.ALLOWANCE) cur.allowance += toNum(r._sum.amount);
      });
      allocLabor.forEach((r) => {
        if (!laborMap.has(r.projectId)) laborMap.set(r.projectId, { salary: 0, allowance: 0 });
        const cur = laborMap.get(r.projectId);
        if (r.cost.costType === CostType.SALARY) cur.salary += toNum(r.allocatedAmount);
        if (r.cost.costType === CostType.ALLOWANCE) cur.allowance += toNum(r.allocatedAmount);
      });

      const otherMap = new Map();
      otherDirect.forEach((r) => r.projectId && otherMap.set(r.projectId, toNum(r._sum.amount)));
      otherAlloc.forEach((r) => otherMap.set(r.projectId, (otherMap.get(r.projectId) || 0) + toNum(r.allocatedAmount)));

      for (const item of data.projects || []) {
        const labor = laborMap.get(item.projectId) || { salary: 0, allowance: 0 };
        assertNear(failures, endpoint, `project(${item.projectCode}).salaryCost`, item.salaryCost, labor.salary);
        assertNear(failures, endpoint, `project(${item.projectCode}).allowanceCost`, item.allowanceCost, labor.allowance);
        assertNear(failures, endpoint, `project(${item.projectCode}).totalLaborCost`, item.totalLaborCost, item.salaryCost + item.allowanceCost);
        assertNear(failures, endpoint, `project(${item.projectCode}).otherCosts`, item.otherCosts, otherMap.get(item.projectId) || 0);
        assertNear(failures, endpoint, `project(${item.projectCode}).totalProjectCost`, item.totalProjectCost, item.totalLaborCost + item.otherCosts);
      }
    }
  }

  // ========================
  // 6) ASSET UTILIZATION (consistency + DB assets count)
  // ========================
  {
    const endpoint = '/reports/projects/asset-utilization?includeAssetDetails=true';
    const data = responses[endpoint];
    if (data) {
      const where = buildPhase1ProjectFilter(month, year, false);
      const projects = await prisma.project.findMany({ where, select: { id: true } });
      const ids = projects.map((p) => p.id);
      const assignmentCounts = await prisma.projectAsset.groupBy({
        by: ['projectId'],
        where: { projectId: { in: ids }, isActive: true },
        _count: { _all: true },
      });
      const countMap = new Map(assignmentCounts.map((r) => [r.projectId, r._count._all]));

      for (const item of data.projects || []) {
        assertNear(failures, endpoint, `project(${item.projectCode}).totalAssets`, item.totalAssets, countMap.get(item.projectId) || 0);
        assertNear(failures, endpoint, `project(${item.projectCode}).totalAssetCost`, item.totalAssetCost, item.totalAllocatedAssetValue + item.totalMaintenanceCost);
      }

      const sum = (data.projects || []).reduce(
        (acc, p) => {
          acc.assets += toNum(p.totalAssets);
          acc.val += toNum(p.totalAllocatedAssetValue);
          acc.m += toNum(p.totalMaintenanceCost);
          acc.t += toNum(p.totalAssetCost);
          return acc;
        },
        { assets: 0, val: 0, m: 0, t: 0 },
      );

      assertNear(failures, endpoint, 'summary.totalAssignedAssets', data.summary?.totalAssignedAssets, sum.assets);
      assertNear(failures, endpoint, 'summary.totalAllocatedAssetValue', data.summary?.totalAllocatedAssetValue, sum.val);
      assertNear(failures, endpoint, 'summary.totalMaintenanceCost', data.summary?.totalMaintenanceCost, sum.m);
      assertNear(failures, endpoint, 'summary.totalAssetCost', data.summary?.totalAssetCost, sum.t);
    }
  }

  // ========================
  // 7) General consistency checks for remaining endpoints
  // ========================
  {
    const delayed = responses['/reports/projects/delayed'];
    if (delayed) {
      assertNear(failures, '/reports/projects/delayed', 'projects.length vs totalDelayedProjects', (delayed.projects || []).length, delayed.totalDelayedProjects);
    }

    const completed = responses['/reports/projects/completed'];
    if (completed) {
      assertNear(failures, '/reports/projects/completed', 'projects.length vs totalCompleted', (completed.projects || []).length, completed.totalCompleted);
    }

    const timeline = responses['/reports/projects/timeline-progress'];
    if (timeline) {
      const t = toNum(timeline.onTimeCount) + toNum(timeline.behindScheduleCount) + toNum(timeline.aheadOfScheduleCount) + toNum(timeline.notStartedCount);
      assertNear(failures, '/reports/projects/timeline-progress', 'status counters sum vs totalProjects', t, timeline.totalProjects);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    startedAt: startedAt.toISOString(),
    baseUrl: BASE_URL,
    month,
    year,
    endpointStatus,
    summary: {
      checks: failures.length,
      pass: failures.length === 0,
    },
    failures,
  };

  const outDir = path.join(process.cwd(), 'scripts', 'audit', 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'project-reports-validation.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log('========================================');
  console.log(`Project Reports Validation: ${report.summary.pass ? 'PASS' : 'FAIL'}`);
  console.log('========================================');
  console.log(`Checked period: ${month}/${year}`);
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
  .catch((error) => {
    console.error('Project reports validation failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

