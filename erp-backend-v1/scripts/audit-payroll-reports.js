/* eslint-disable no-console */
require('dotenv/config');

const fs = require('fs');
const path = require('path');
const { PrismaClient, EmployeeStatus, DeductionStatus } = require('@prisma/client');
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

function getBounds(month, year) {
  return {
    startDate: new Date(year, month - 1, 1),
    endDate: new Date(year, month, 0, 23, 59, 59, 999),
  };
}

async function main() {
  const failures = [];
  const endpointStatus = [];
  const token = await getToken();

  const endpoints = [
    '/reports/payroll/overview',
    '/reports/payroll/by-department',
    '/reports/payroll/by-site',
    '/reports/payroll/salary-components',
    '/reports/payroll/allowances',
    '/reports/payroll/deductions-loans',
    '/reports/payroll/trend',
    '/reports/payroll/comparison',
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

  // 1) Overview: DB reconcile on default month/year (active employees)
  if (responses['/reports/payroll/overview']) {
    const data = responses['/reports/payroll/overview'];
    const month = data.month;
    const year = data.year;
    const { startDate, endDate } = getBounds(month, year);

    const employees = await prisma.employee.findMany({
      where: { status: EmployeeStatus.ACTIVE },
      select: { id: true, baseSalary: true },
    });
    const employeeIds = employees.map((e) => e.id);
    const base = employees.reduce((s, e) => s + toNum(e.baseSalary), 0);
    const [allowancesAgg, deductionsAgg] = await Promise.all([
      prisma.employeeAllowance.aggregate({
        where: {
          employeeId: { in: employeeIds },
          status: 'APPROVED',
          effectiveFrom: { lte: endDate },
          AND: [
            { OR: [{ effectiveTo: null }, { effectiveTo: { gte: startDate } }] },
            {
              OR: [
                { frequency: 'MONTHLY' },
                {
                  AND: [
                    { frequency: 'ONE_TIME' },
                    { effectiveFrom: { gte: startDate, lte: endDate } },
                  ],
                },
              ],
            },
          ],
        },
        _sum: { amount: true },
      }),
      prisma.employeeDeduction.aggregate({
        where: {
          employeeId: { in: employeeIds },
          deductionDate: { gte: startDate, lte: endDate },
          status: DeductionStatus.APPROVED,
        },
        _sum: { amount: true },
      }),
    ]);

    const totalAllowances = toNum(allowancesAgg._sum.amount);
    const totalDeductions = toNum(deductionsAgg._sum.amount);
    const expectedNet = base + totalAllowances - totalDeductions;

    assertNear(failures, '/reports/payroll/overview', 'totalBaseSalaries', data.totalBaseSalaries, base);
    assertNear(failures, '/reports/payroll/overview', 'totalAllowances', data.totalAllowances, totalAllowances);
    assertNear(failures, '/reports/payroll/overview', 'totalDeductions', data.totalDeductions, totalDeductions);
    assertNear(failures, '/reports/payroll/overview', 'netPayroll', data.netPayroll, expectedNet);
    assertNear(failures, '/reports/payroll/overview', 'employeeCount', data.employeeCount, employees.length);
  }

  // 2) by-department internal consistency
  if (responses['/reports/payroll/by-department']) {
    const data = responses['/reports/payroll/by-department'];
    const rows = data.departments || [];
    const sumNet = rows.reduce((s, x) => s + toNum(x.netPayroll), 0);
    const sumEmp = rows.reduce((s, x) => s + toNum(x.employeeCount), 0);
    assertNear(failures, '/reports/payroll/by-department', 'sum(departments.netPayroll)', sumNet, data.totalPayroll);
    assertNear(failures, '/reports/payroll/by-department', 'sum(departments.employeeCount)', sumEmp, data.totalEmployees);
  }

  // 3) by-site internal consistency
  if (responses['/reports/payroll/by-site']) {
    const data = responses['/reports/payroll/by-site'];
    const rows = data.sites || [];
    const sumNet = rows.reduce((s, x) => s + toNum(x.netPayroll), 0);
    assertNear(failures, '/reports/payroll/by-site', 'sum(sites.netPayroll)', sumNet, data.totalPayroll);
  }

  // 4) salary-components internal math
  if (responses['/reports/payroll/salary-components']) {
    const data = responses['/reports/payroll/salary-components'];
    assertNear(
      failures,
      '/reports/payroll/salary-components',
      'netPayroll',
      data.netPayroll,
      toNum(data.totalBaseSalaries) + toNum(data.totalAllowances) - toNum(data.totalDeductions),
    );
  }

  // 5) allowances internal consistency
  if (responses['/reports/payroll/allowances']) {
    const data = responses['/reports/payroll/allowances'];
    const sumType = (data.byAllowanceType || []).reduce((s, x) => s + toNum(x.totalMonthlyAmount), 0);
    const sumFreq = (data.byFrequency || []).reduce((s, x) => s + toNum(x.totalAmount), 0);
    assertNear(failures, '/reports/payroll/allowances', 'sum(byAllowanceType.totalMonthlyAmount)', sumType, data.totalAmount);
    assertNear(failures, '/reports/payroll/allowances', 'sum(byFrequency.totalAmount)', sumFreq, data.totalAmount);
  }

  // 6) deductions-loans internal consistency
  if (responses['/reports/payroll/deductions-loans']) {
    const data = responses['/reports/payroll/deductions-loans'];
    const sumDeductionTypes = (data.deductionsByType || []).reduce((s, x) => s + toNum(x.totalAmount), 0);
    const sumLoanRemaining = (data.loansByStatus || []).reduce((s, x) => s + toNum(x.totalRemaining), 0);
    assertNear(failures, '/reports/payroll/deductions-loans', 'sum(deductionsByType.totalAmount)', sumDeductionTypes, data.totalDeductions);
    assertNear(failures, '/reports/payroll/deductions-loans', 'sum(loansByStatus.totalRemaining)', sumLoanRemaining, data.loansSummary?.totalOutstanding || 0);
  }

  // 7) trend internal consistency
  if (responses['/reports/payroll/trend']) {
    const data = responses['/reports/payroll/trend'];
    const rows = data.data || [];
    const sumNet = rows.reduce((s, x) => s + toNum(x.netPayroll), 0);
    const maxNet = rows.length ? Math.max(...rows.map((x) => toNum(x.netPayroll))) : 0;
    const minNet = rows.length ? Math.min(...rows.map((x) => toNum(x.netPayroll))) : 0;
    assertNear(failures, '/reports/payroll/trend', 'sum(data.netPayroll)', sumNet, data.totalPayroll);
    assertNear(failures, '/reports/payroll/trend', 'highestPayroll', maxNet, data.highestPayroll);
    assertNear(failures, '/reports/payroll/trend', 'lowestPayroll', minNet, data.lowestPayroll);
    if ((data.monthsCount || 0) !== rows.length) {
      failures.push({
        endpoint: '/reports/payroll/trend',
        field: 'monthsCount',
        actual: data.monthsCount,
        expected: rows.length,
      });
    }
  }

  // 8) comparison internal consistency
  if (responses['/reports/payroll/comparison']) {
    const data = responses['/reports/payroll/comparison'];
    const p1 = data.period1 || {};
    const p2 = data.period2 || {};
    const v = data.variance || {};
    assertNear(failures, '/reports/payroll/comparison', 'variance.baseSalariesDiff', v.baseSalariesDiff, toNum(p2.totalBaseSalaries) - toNum(p1.totalBaseSalaries));
    assertNear(failures, '/reports/payroll/comparison', 'variance.allowancesDiff', v.allowancesDiff, toNum(p2.totalAllowances) - toNum(p1.totalAllowances));
    assertNear(failures, '/reports/payroll/comparison', 'variance.deductionsDiff', v.deductionsDiff, toNum(p2.totalDeductions) - toNum(p1.totalDeductions));
    assertNear(failures, '/reports/payroll/comparison', 'variance.netPayrollDiff', v.netPayrollDiff, toNum(p2.netPayroll) - toNum(p1.netPayroll));
    assertNear(failures, '/reports/payroll/comparison', 'variance.employeeCountDiff', v.employeeCountDiff, toNum(p2.employeeCount) - toNum(p1.employeeCount));
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
  const outFile = path.join(outDir, 'payroll-reports-validation.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log('========================================');
  console.log(`Payroll Reports Validation: ${report.summary.pass ? 'PASS' : 'FAIL'}`);
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
    console.error('Payroll reports validation failed:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
