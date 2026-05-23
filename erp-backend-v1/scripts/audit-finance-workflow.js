/* eslint-disable no-console */
require('dotenv/config');

const BASE_URL = process.env.PERF_BASE_URL || 'http://localhost:9000/api/v1';
const EMAIL = process.env.PERF_EMAIL || 'superadmin@erp.sys';
const PASSWORD = process.env.PERF_PASSWORD || 'Admin@123456';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function toNum(v) {
  if (v == null) return 0;
  return Number(v);
}

function getStatusAmount(stats, status) {
  if (!stats || !Array.isArray(stats.statusBreakdown)) return 0;
  const row = stats.statusBreakdown.find((item) => item?.status === status);
  return toNum(row?.amount);
}

async function login() {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      rememberMe: false,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.tokens?.accessToken) {
    throw new Error(
      `Login failed (${res.status}). Check PERF_EMAIL/PERF_PASSWORD and API availability.`,
    );
  }
  return body.tokens.accessToken;
}

async function api(token, method, endpoint, payload) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  const token = await login();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const created = {
    siteId: null,
    projectId: null,
    overdueCostId: null,
    overdueCostRowVersion: null,
    rejectedCostId: null,
    rejectedCostRowVersion: null,
  };

  try {
    const statsBeforeRes = await api(token, 'GET', '/finance/statistics');
    assert(
      statsBeforeRes.status === 200,
      `Expected 200 for /finance/statistics, got ${statsBeforeRes.status}`,
    );
    const statsBefore = statsBeforeRes.body;

    // Create temporary site + project for realistic project-linked flow.
    const siteRes = await api(token, 'POST', '/sites', {
      name: `FIN-SMOKE-SITE-${Date.now()}`,
      code: `FIN-SMK-${Math.floor(Math.random() * 9000 + 1000)}`,
      address: 'Riyadh',
      city: 'Riyadh',
      country: 'Saudi Arabia',
      status: 'ACTIVE',
    });
    assert(siteRes.status === 201, `Site create failed (${siteRes.status})`);
    created.siteId = siteRes.body.id;

    const projectRes = await api(token, 'POST', '/projects', {
      name: `FIN-SMOKE-PROJECT-${Date.now()}`,
      status: 'PLANNING',
      siteId: created.siteId,
    });
    assert(
      projectRes.status === 201,
      `Project create failed (${projectRes.status})`,
    );
    created.projectId = projectRes.body.id;

    // Cost A: PENDING -> APPROVED -> OVERDUE (deletable)
    const costAAmount = 100.11;
    const costARes = await api(token, 'POST', '/finance/costs', {
      projectId: created.projectId,
      costType: 'MATERIAL',
      amount: costAAmount,
      transactionDate: today,
      description: 'FIN_WORKFLOW_SMOKE_A',
    });
    assert(
      costARes.status === 201,
      `Cost A create failed (${costARes.status})`,
    );
    created.overdueCostId = costARes.body.id;
    created.overdueCostRowVersion = costARes.body.rowVersion;

    // Must NOT allow jumping from PENDING -> PAID via generic update.
    const illegalPaidRes = await api(
      token,
      'PUT',
      `/finance/costs/${created.overdueCostId}`,
      { paymentStatus: 'PAID', paidDate: today, rowVersion: created.overdueCostRowVersion },
    );
    assert(
      illegalPaidRes.status === 400,
      `Expected 400 for illegal PENDING->PAID update, got ${illegalPaidRes.status}`,
    );

    // Approve via approval endpoint
    const approveARes = await api(
      token,
      'POST',
      `/finance/costs/${created.overdueCostId}/approve`,
      { rowVersion: created.overdueCostRowVersion, notes: 'workflow smoke approve' },
    );
    assert(
      approveARes.status === 201,
      `Cost A approve failed (${approveARes.status})`,
    );
    created.overdueCostRowVersion = approveARes.body.rowVersion;

    // Approved -> OVERDUE via payment lifecycle update.
    const overdueARes = await api(
      token,
      'PUT',
      `/finance/costs/${created.overdueCostId}`,
      { paymentStatus: 'OVERDUE', rowVersion: created.overdueCostRowVersion },
    );
    assert(
      overdueARes.status === 200,
      `Cost A status update APPROVED->OVERDUE failed (${overdueARes.status})`,
    );
    created.overdueCostRowVersion = overdueARes.body.rowVersion;

    // Cost B: PENDING -> REJECTED (excluded from active totals) -> deletable
    const costBAmount = 50.22;
    const costBRes = await api(token, 'POST', '/finance/costs', {
      projectId: created.projectId,
      costType: 'MATERIAL',
      amount: costBAmount,
      transactionDate: today,
      description: 'FIN_WORKFLOW_SMOKE_B',
    });
    assert(
      costBRes.status === 201,
      `Cost B create failed (${costBRes.status})`,
    );
    created.rejectedCostId = costBRes.body.id;
    created.rejectedCostRowVersion = costBRes.body.rowVersion;

    const rejectBRes = await api(
      token,
      'POST',
      `/finance/costs/${created.rejectedCostId}/reject`,
      {
        rejectedReason: 'workflow smoke reject',
        rowVersion: created.rejectedCostRowVersion,
      },
    );
    assert(
      rejectBRes.status === 201,
      `Cost B reject failed (${rejectBRes.status})`,
    );
    created.rejectedCostRowVersion = rejectBRes.body.rowVersion;

    const statsAfterRes = await api(token, 'GET', '/finance/statistics');
    assert(
      statsAfterRes.status === 200,
      `Expected 200 for stats-after, got ${statsAfterRes.status}`,
    );
    const statsAfter = statsAfterRes.body;

    const totalDelta = toNum(statsAfter.totalCosts) - toNum(statsBefore.totalCosts);
    const rejectedDelta =
      toNum(statsAfter.rejectedAmount) - toNum(statsBefore.rejectedAmount);
    // `finance/statistics` exposes overdue as part of statusBreakdown
    // (not always as a dedicated top-level overdueAmount field).
    const overdueBefore = toNum(statsBefore.overdueAmount) || getStatusAmount(statsBefore, 'OVERDUE');
    const overdueAfter = toNum(statsAfter.overdueAmount) || getStatusAmount(statsAfter, 'OVERDUE');
    const overdueDelta = overdueAfter - overdueBefore;

    // Active totals should include overdue cost A only, exclude rejected cost B.
    assert(
      Math.abs(totalDelta - costAAmount) < 0.01,
      `Expected totalCosts delta ~= ${costAAmount}, got ${totalDelta}`,
    );
    assert(
      Math.abs(rejectedDelta - costBAmount) < 0.01,
      `Expected rejectedAmount delta ~= ${costBAmount}, got ${rejectedDelta}`,
    );
    assert(
      Math.abs(overdueDelta - costAAmount) < 0.01,
      `Expected overdueAmount delta ~= ${costAAmount}, got ${overdueDelta}`,
    );

    console.log('========================================');
    console.log('Finance Workflow Audit: PASS');
    console.log('========================================');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Total delta (active): ${totalDelta.toFixed(2)}`);
    console.log(`Rejected delta: ${rejectedDelta.toFixed(2)}`);
    console.log(`Overdue delta: ${overdueDelta.toFixed(2)}`);
  } finally {
    // Cleanup in reverse order
    if (created.rejectedCostId) {
      await api(token, 'DELETE', `/finance/costs/${created.rejectedCostId}`, {
        rowVersion: created.rejectedCostRowVersion,
      });
    }
    if (created.overdueCostId) {
      await api(token, 'DELETE', `/finance/costs/${created.overdueCostId}`, {
        rowVersion: created.overdueCostRowVersion,
      });
    }
    if (created.projectId) {
      await api(token, 'DELETE', `/projects/${created.projectId}`);
    }
    if (created.siteId) {
      await api(token, 'DELETE', `/sites/${created.siteId}`);
    }
  }
}

main().catch((e) => {
  console.error('Finance workflow audit failed:', e.message);
  process.exitCode = 1;
});
