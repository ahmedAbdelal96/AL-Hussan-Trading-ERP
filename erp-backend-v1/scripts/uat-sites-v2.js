/* eslint-disable no-console */
require('dotenv/config');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const API_BASE = process.env.UAT_API_BASE_URL || 'http://localhost:9000/api/v1';
const UAT_PASSWORD = process.env.UAT_SITES_PASSWORD || 'Uat@123456';
const ROLE_EMAIL_PREFIX = 'uat.sites';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for Sites UAT script.');
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const roleMatrix = {
  SUPERADMIN: { read: true, write: true, delete: true, restore: true },
  ADMIN: { read: true, write: true, delete: true, restore: true },
  OPS_MANAGER: { read: true, write: true, delete: true, restore: true },
  OPS_STAFF: { read: true, write: false, delete: false, restore: false },
  HR_MANAGER: { read: false, write: false, delete: false, restore: false },
  FIN_MANAGER: { read: false, write: false, delete: false, restore: false },
  USER: { read: false, write: false, delete: false, restore: false },
};

const usersByRole = Object.keys(roleMatrix).map((role) => ({
  role,
  email: `${ROLE_EMAIL_PREFIX}.${role.toLowerCase()}@erp.sys`,
}));

function nowIso() {
  return new Date().toISOString();
}

function makeSitePayload(prefix) {
  const stamp = Date.now().toString().slice(-6);
  const compactPrefix = String(prefix).replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase() || 'SITE';
  const code = `UAT-${compactPrefix}-${stamp}`;
  return {
    name: `موقع اختبار ${prefix} ${stamp}`,
    code,
    status: 'ACTIVE',
    address: `عنوان ${prefix} ${stamp}`,
    city: 'الرياض',
    state: 'منطقة الرياض',
    country: 'المملكة العربية السعودية',
    postalCode: '11564',
  };
}

async function api(pathname, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data };
}

async function ensureRoleUsers() {
  const hashed = await bcrypt.hash(UAT_PASSWORD, 10);
  for (const { role, email } of usersByRole) {
    const roleRow = await prisma.role.findUnique({ where: { slug: role } });
    if (!roleRow) throw new Error(`Role not found in DB: ${role}`);

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          password: hashed,
          firstName: 'UAT',
          lastName: role,
          isActive: true,
          tokenVersion: 1,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isActive: true, password: hashed },
      });
    }

    const hasRole = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: roleRow.id, isActive: true },
      select: { id: true },
    });

    if (!hasRole) {
      const superadmin = await prisma.user.findFirst({
        where: { email: 'superadmin@erp.sys' },
        select: { id: true },
      });
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: roleRow.id,
          isActive: true,
          isTemporary: false,
          grantedBy: superadmin?.id || user.id,
        },
      });
    }
  }
}

async function loginAll() {
  const sessions = {};
  for (const user of usersByRole) {
    const res = await api('/auth/login', {
      method: 'POST',
      body: { email: user.email, password: UAT_PASSWORD },
    });
    const accessToken = res.data?.accessToken || res.data?.tokens?.accessToken;
    if (res.status !== 200 || !accessToken) {
      throw new Error(`Failed login for ${user.role} (${user.email})`);
    }
    sessions[user.role] = {
      email: user.email,
      token: accessToken,
      userId: res.data.user?.id || null,
    };
  }
  return sessions;
}

function addCase(report, payload) {
  report.cases.push(payload);
}

function isPass(expectedAllowed, status) {
  return expectedAllowed ? status >= 200 && status < 300 : status === 403;
}

async function runReadCases(report, sessions) {
  const endpoints = [
    '/sites?page=1&pageSize=5',
    '/sites/stats',
    '/sites/deleted?page=1&pageSize=5',
  ];

  for (const [role, session] of Object.entries(sessions)) {
    for (const endpoint of endpoints) {
      const expectedAllowed = roleMatrix[role].read;
      const res = await api(endpoint, { token: session.token });
      addCase(report, {
        module: 'Sites',
        screen: 'Read',
        role,
        action: `GET ${endpoint}`,
        expected: expectedAllowed ? 'ALLOW' : 'DENY(403)',
        actualStatus: res.status,
        pass: isPass(expectedAllowed, res.status),
      });
    }
  }
}

async function runCrudCases(report, sessions) {
  for (const [role, session] of Object.entries(sessions)) {
    const expectedWrite = roleMatrix[role].write;
    const createPayload = makeSitePayload(role);
    const createRes = await api('/sites', {
      method: 'POST',
      token: session.token,
      body: createPayload,
    });

    addCase(report, {
      module: 'Sites',
      screen: 'Create',
      role,
      action: 'POST /sites',
      expected: expectedWrite ? 'ALLOW' : 'DENY(403)',
      actualStatus: createRes.status,
      pass: isPass(expectedWrite, createRes.status),
    });

    if (!(expectedWrite && createRes.status >= 200 && createRes.status < 300)) {
      continue;
    }

    const site = createRes.data;
    const siteId = site.id;
    const updateRes = await api(`/sites/${siteId}`, {
      method: 'PUT',
      token: session.token,
      body: {
        name: `${site.name} - Updated`,
        rowVersion: site.rowVersion,
      },
    });

    addCase(report, {
      module: 'Sites',
      screen: 'Edit',
      role,
      action: 'PUT /sites/:id',
      expected: 'ALLOW',
      actualStatus: updateRes.status,
      pass: updateRes.status >= 200 && updateRes.status < 300,
    });

    const deleteExpected = roleMatrix[role].delete;
    const rowVersionForDelete = updateRes.data?.rowVersion || site.rowVersion + 1;
    const deleteRes = await api(`/sites/${siteId}`, {
      method: 'DELETE',
      token: session.token,
      body: { rowVersion: rowVersionForDelete },
    });

    addCase(report, {
      module: 'Sites',
      screen: 'Delete',
      role,
      action: 'DELETE /sites/:id',
      expected: deleteExpected ? 'ALLOW' : 'DENY(403)',
      actualStatus: deleteRes.status,
      pass: isPass(deleteExpected, deleteRes.status),
    });

    // If role cannot delete but can write, cleanup by SUPERADMIN.
    if (!deleteExpected) {
      const superToken = sessions.SUPERADMIN.token;
      const latest = await api(`/sites/${siteId}`, { token: superToken });
      if (latest.status === 200) {
        await api(`/sites/${siteId}`, {
          method: 'DELETE',
          token: superToken,
          body: { rowVersion: latest.data.rowVersion },
        });
      }
    }
  }
}

async function runRestoreCases(report, sessions) {
  // Prepare deleted site by superadmin.
  const superToken = sessions.SUPERADMIN.token;
  const createRes = await api('/sites', {
    method: 'POST',
    token: superToken,
    body: makeSitePayload('RESTORE'),
  });
  if (!(createRes.status >= 200 && createRes.status < 300)) {
    throw new Error('Failed to prepare deleted site for restore tests.');
  }
  const site = createRes.data;
  const delRes = await api(`/sites/${site.id}`, {
    method: 'DELETE',
    token: superToken,
    body: { rowVersion: site.rowVersion },
  });
  if (!(delRes.status >= 200 && delRes.status < 300)) {
    throw new Error('Failed to soft-delete site for restore tests.');
  }

  for (const [role, session] of Object.entries(sessions)) {
    const expected = roleMatrix[role].restore;
    const restoreRes = await api(`/sites/${site.id}/restore`, {
      method: 'PATCH',
      token: session.token,
    });
    addCase(report, {
      module: 'Sites',
      screen: 'Deleted Sites',
      role,
      action: 'PATCH /sites/:id/restore',
      expected: expected ? 'ALLOW' : 'DENY(403)',
      actualStatus: restoreRes.status,
      pass: isPass(expected, restoreRes.status),
    });

    if (expected && restoreRes.status >= 200 && restoreRes.status < 300) {
      // keep deleted for remaining roles
      const fresh = await api(`/sites/${site.id}`, { token: superToken });
      if (fresh.status === 200) {
        await api(`/sites/${site.id}`, {
          method: 'DELETE',
          token: superToken,
          body: { rowVersion: fresh.data.rowVersion },
        });
      }
    }
  }

  // Cleanup: ensure site is active at end
  const current = await api(`/sites/${site.id}`, { token: superToken });
  if (current.status === 404) return;
  if (current.status === 200 && current.data?.deletedAt) {
    await api(`/sites/${site.id}/restore`, { method: 'PATCH', token: superToken });
  }
}

function summarize(report) {
  const total = report.cases.length;
  const passed = report.cases.filter((x) => x.pass).length;
  report.summary.totalCases = total;
  report.summary.passed = passed;
  report.summary.failed = total - passed;
  report.summary.status = report.summary.failed === 0 ? 'PASS' : 'FAIL';
}

function writeReports(report) {
  const outDir = path.join(__dirname, 'uat', 'results');
  fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, 'sites-uat-v2.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  const mdPath = path.join(outDir, 'sites-uat-v2.md');
  const lines = [];
  lines.push(`# Sites UAT v2`);
  lines.push(``);
  lines.push(`- GeneratedAt: ${report.generatedAt}`);
  lines.push(`- Status: **${report.summary.status}**`);
  lines.push(`- Total Cases: ${report.summary.totalCases}`);
  lines.push(`- Passed: ${report.summary.passed}`);
  lines.push(`- Failed: ${report.summary.failed}`);
  lines.push(``);
  lines.push(`## Permission Matrix (Expected)`);
  lines.push(`| Role | Read | Write | Delete | Restore |`);
  lines.push(`|---|---:|---:|---:|---:|`);
  for (const [role, m] of Object.entries(roleMatrix)) {
    lines.push(
      `| ${role} | ${m.read ? 'Y' : 'N'} | ${m.write ? 'Y' : 'N'} | ${m.delete ? 'Y' : 'N'} | ${m.restore ? 'Y' : 'N'} |`,
    );
  }
  lines.push(``);
  lines.push(`## Cases`);
  lines.push(`| Screen | Role | Action | Expected | Status | Pass |`);
  lines.push(`|---|---|---|---|---:|---:|`);
  for (const c of report.cases) {
    lines.push(
      `| ${c.screen} | ${c.role} | ${c.action} | ${c.expected} | ${c.actualStatus} | ${c.pass ? 'PASS' : 'FAIL'} |`,
    );
  }
  fs.writeFileSync(mdPath, lines.join('\n'), 'utf8');

  return { jsonPath, mdPath };
}

async function main() {
  const report = {
    generatedAt: nowIso(),
    apiBase: API_BASE,
    summary: { status: 'UNKNOWN', totalCases: 0, passed: 0, failed: 0 },
    users: usersByRole,
    cases: [],
  };

  await ensureRoleUsers();
  const sessions = await loginAll();

  await runReadCases(report, sessions);
  await runCrudCases(report, sessions);
  await runRestoreCases(report, sessions);

  summarize(report);
  const out = writeReports(report);

  console.log('========================================');
  console.log(`Sites UAT v2: ${report.summary.status}`);
  console.log('========================================');
  console.log(`Cases: ${report.summary.totalCases}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`JSON report: ${out.jsonPath}`);
  console.log(`MD report: ${out.mdPath}`);

  if (report.summary.failed > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error('Sites UAT v2 failed:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
