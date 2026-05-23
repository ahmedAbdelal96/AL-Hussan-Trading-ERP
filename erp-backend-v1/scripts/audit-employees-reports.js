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
function assertEqual(failures, endpoint, field, actual, expected) {
  if (actual !== expected) {
    failures.push({ endpoint, field, actual, expected });
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
    '/reports/employees/overview?month=3&year=2026&includeComparison=true&includeDepartmentBreakdown=true',
    '/reports/employees/by-department?month=3&year=2026&includeSalaryCosts=true',
    '/reports/employees/by-employment-type?month=3&year=2026&expiringContractsDays=90',
    '/reports/employees/by-position?month=3&year=2026&page=1&limit=100',
    '/reports/employees/age-experience?month=3&year=2026',
    '/reports/employees/turnover?months=12&includeReasons=true&includeDepartmentBreakdown=true',
    '/reports/employees/status?month=3&year=2026&includeTrend=true',
    '/reports/employees/assignment',
    '/reports/employees/contract-expiry?daysAhead=90&includeExpired=true',
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

  // 1) overview checks
  {
    const ep = endpoints[0];
    const d = responses[ep];
    if (d) {
      assertNear(
        failures,
        ep,
        'status_sum',
        toNum(d.activeEmployees) +
          toNum(d.inactiveEmployees) +
          toNum(d.onLeaveEmployees) +
          toNum(d.suspendedEmployees),
        toNum(d.totalEmployees),
      );
      assertNear(
        failures,
        ep,
        'netChange',
        toNum(d.newHires) - toNum(d.terminations),
        toNum(d.netChange),
      );
      if (Array.isArray(d.departmentBreakdown)) {
        const sumDept = d.departmentBreakdown.reduce((s, x) => s + toNum(x.employeeCount), 0);
        assertNear(failures, ep, 'sum(departmentBreakdown.employeeCount)', sumDept, d.totalEmployees);
      }
    }
  }

  // 2) by-department checks
  {
    const ep = endpoints[1];
    const d = responses[ep];
    if (d) {
      const rows = d.departments || [];
      assertEqual(failures, ep, 'totalDepartments', rows.length, toNum(d.totalDepartments));
      const sumEmp = rows.reduce((s, x) => s + toNum(x.employeeCount), 0);
      assertNear(failures, ep, 'sum(departments.employeeCount)', sumEmp, d.totalEmployees);
      if (d.totalSalaryCosts != null) {
        const sumSalary = rows.reduce((s, x) => s + toNum(x.totalSalaryCosts), 0);
        assertNear(failures, ep, 'sum(departments.totalSalaryCosts)', sumSalary, d.totalSalaryCosts);
      }
    }
  }

  // 3) by-employment-type checks
  {
    const ep = endpoints[2];
    const d = responses[ep];
    if (d) {
      const rows = d.employmentTypes || [];
      const sumEmp = rows.reduce((s, x) => s + toNum(x.employeeCount), 0);
      assertNear(failures, ep, 'sum(employmentTypes.employeeCount)', sumEmp, d.totalEmployees);
      // Legacy aggregate fields (permanent/contract/freelance/partTime)
      // are no longer used as a strict invariant because the employment type
      // enum now supports additional categories.
      if (Array.isArray(d.expiringContracts)) {
        assertEqual(
          failures,
          ep,
          'expiringContractsCount',
          d.expiringContracts.length,
          toNum(d.expiringContractsCount),
        );
      }
    }
  }

  // 4) by-position checks
  {
    const ep = endpoints[3];
    const d = responses[ep];
    if (d) {
      const rows = d.positions || [];
      assertEqual(failures, ep, 'totalPositions', rows.length, toNum(d.totalPositions));
      const sumEmp = rows.reduce((s, x) => s + toNum(x.employeeCount), 0);
      assertNear(failures, ep, 'sum(positions.employeeCount)', sumEmp, d.totalEmployees);
    }
  }

  // 5) age-experience checks
  {
    const ep = endpoints[4];
    const d = responses[ep];
    if (d) {
      const sumAgeGroups = (d.ageGroups || []).reduce((s, x) => s + toNum(x.employeeCount), 0);
      const sumExpGroups = (d.experienceRanges || []).reduce((s, x) => s + toNum(x.employeeCount), 0);
      assertNear(failures, ep, 'sum(ageGroups.employeeCount)', sumAgeGroups, d.totalEmployees);
      assertNear(failures, ep, 'sum(experienceRanges.employeeCount)', sumExpGroups, d.totalEmployees);
      assertNear(
        failures,
        ep,
        'age_bucket_sum',
        toNum(d.under30Count) + toNum(d.age30to45Count) + toNum(d.over45Count),
        d.totalEmployees,
      );
    }
  }

  // 6) turnover checks
  {
    const ep = endpoints[5];
    const d = responses[ep];
    if (d) {
      const trend = d.monthlyTrend || [];
      const sumNew = trend.reduce((s, x) => s + toNum(x.newHires), 0);
      const sumTerm = trend.reduce((s, x) => s + toNum(x.terminations), 0);
      assertNear(failures, ep, 'sum(monthlyTrend.newHires)', sumNew, d.totalNewHires);
      assertNear(failures, ep, 'sum(monthlyTrend.terminations)', sumTerm, d.totalTerminations);
      assertNear(failures, ep, 'netChange', toNum(d.totalNewHires) - toNum(d.totalTerminations), d.netChange);
      if (Array.isArray(d.terminationReasons)) {
        const sumReasons = d.terminationReasons.reduce((s, x) => s + toNum(x.count), 0);
        assertNear(failures, ep, 'sum(terminationReasons.count)', sumReasons, d.totalTerminations);
      }
    }
  }

  // 7) status checks
  {
    const ep = endpoints[6];
    const d = responses[ep];
    if (d) {
      const rows = d.statusBreakdown || [];
      const sumEmp = rows.reduce((s, x) => s + toNum(x.employeeCount), 0);
      assertNear(failures, ep, 'sum(statusBreakdown.employeeCount)', sumEmp, d.totalEmployees);
      assertNear(
        failures,
        ep,
        'percentage_sum',
        toNum(d.activePercentage) + toNum(d.inactivePercentage) + toNum(d.onLeavePercentage),
        100,
      );
      assertNear(failures, ep, 'availabilityRate', d.availabilityRate, d.activePercentage);
    }
  }

  // 8) assignment checks
  {
    const ep = endpoints[7];
    const d = responses[ep];
    if (d) {
      const rows = d.employees || [];
      const s = d.summary || {};
      assertEqual(failures, ep, 'summary.totalEmployees', rows.length, toNum(s.totalEmployees));
      assertNear(
        failures,
        ep,
        'summary_status_counts',
        toNum(s.overheadCount) +
          toNum(s.overAllocatedCount) +
          toNum(s.fullyAllocatedCount) +
          toNum(s.underAllocatedCount),
        toNum(s.totalEmployees),
      );
    }
  }

  // 9) contract-expiry checks
  {
    const ep = endpoints[8];
    const d = responses[ep];
    if (d) {
      const rows = d.contracts || [];
      const s = d.summary || {};
      assertEqual(failures, ep, 'summary.totalContracts', rows.length, toNum(s.totalContracts));
      assertNear(
        failures,
        ep,
        'summary_urgency_counts',
        toNum(s.expiredCount) +
          toNum(s.criticalCount) +
          toNum(s.highCount) +
          toNum(s.mediumCount) +
          toNum(s.lowCount),
        toNum(s.totalContracts),
      );
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
  const outFile = path.join(outDir, 'employees-reports-validation.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log('========================================');
  console.log(`Employees Reports Validation: ${report.summary.pass ? 'PASS' : 'FAIL'}`);
  console.log('========================================');
  console.log(`Endpoints checked: ${endpointStatus.length}`);
  console.log(`Failures: ${failures.length}`);
  console.log(`Report saved to: ${outFile}`);
  if (failures.length > 0) {
    console.log('\nTop failures:');
    failures.slice(0, 15).forEach((f, i) => {
      console.log(
        `${i + 1}. [${f.endpoint}] ${f.field} | actual=${f.actual} expected=${f.expected}`,
      );
    });
    process.exitCode = 2;
  }
}

main().catch((e) => {
  console.error('Employees reports validation failed:', e.message);
  process.exitCode = 1;
});
