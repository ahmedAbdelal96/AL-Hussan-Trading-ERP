/* eslint-disable no-console */
require('dotenv/config');

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required.');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BASE_URL = process.env.PERF_BASE_URL || 'http://localhost:9000/api/v1';
const UAT_PASSWORD = process.env.UAT_RBAC_PASSWORD || 'Admin@123456';
const PASSWORD_HASH_ROUNDS = 10;

const ROLE_ACCOUNTS = [
  { role: 'SUPERADMIN', email: 'uat.superadmin@erp.sys', firstName: 'UAT', lastName: 'SuperAdmin' },
  { role: 'IT_ADMIN', email: 'uat.it@erp.sys', firstName: 'UAT', lastName: 'IT' },
  { role: 'ADMIN', email: 'uat.admin@erp.sys', firstName: 'UAT', lastName: 'Admin' },
  { role: 'HR_MANAGER', email: 'uat.hr@erp.sys', firstName: 'UAT', lastName: 'HR' },
  { role: 'FIN_MANAGER', email: 'uat.finance@erp.sys', firstName: 'UAT', lastName: 'Finance' },
  { role: 'OPS_MANAGER', email: 'uat.ops@erp.sys', firstName: 'UAT', lastName: 'Ops' },
  { role: 'USER', email: 'uat.user@erp.sys', firstName: 'UAT', lastName: 'User' },
];

const TESTS = [
  {
    id: 'users_list',
    method: 'GET',
    endpoint: () => '/users?page=1&pageSize=10',
    expectedAllowed: ['SUPERADMIN', 'IT_ADMIN', 'ADMIN', 'HR_MANAGER'],
    allowedStatuses: [200],
  },
  {
    id: 'users_deleted_list',
    method: 'GET',
    endpoint: () => '/users/deleted/list?page=1&pageSize=10',
    expectedAllowed: ['SUPERADMIN', 'IT_ADMIN'],
    policyExpectedAllowed: ['SUPERADMIN', 'IT_ADMIN'],
    allowedStatuses: [200],
  },
  {
    id: 'user_create',
    method: 'POST',
    endpoint: () => '/users',
    body: () => ({ email: 'invalid', firstName: 'x' }),
    expectedAllowed: ['SUPERADMIN', 'IT_ADMIN'],
    allowedStatuses: [400, 409, 422],
    policyExpectedAllowed: ['SUPERADMIN', 'IT_ADMIN'],
  },
  {
    id: 'user_delete',
    method: 'DELETE',
    endpoint: ({ targetUserId }) => `/users/${targetUserId}`,
    body: () => ({ rowVersion: 0 }),
    expectedAllowed: ['SUPERADMIN', 'IT_ADMIN'],
    allowedStatuses: [400, 404, 409, 422],
    policyExpectedAllowed: ['SUPERADMIN', 'IT_ADMIN'],
  },
  {
    id: 'user_reset_password',
    method: 'POST',
    endpoint: ({ targetUserId }) => `/users/${targetUserId}/reset-password`,
    body: () => ({ password: 'short' }),
    expectedAllowed: ['SUPERADMIN', 'IT_ADMIN'],
    allowedStatuses: [400, 404, 422],
    policyExpectedAllowed: ['SUPERADMIN', 'IT_ADMIN'],
  },
  {
    id: 'rbac_roles_read',
    method: 'GET',
    endpoint: () => '/rbac/roles?page=1&limit=10',
    expectedAllowed: ['SUPERADMIN', 'IT_ADMIN', 'ADMIN'],
    allowedStatuses: [200],
  },
  {
    id: 'rbac_permissions_read',
    method: 'GET',
    endpoint: () => '/rbac/permissions?page=1&limit=10',
    expectedAllowed: ['SUPERADMIN', 'IT_ADMIN', 'ADMIN'],
    allowedStatuses: [200],
  },
  {
    id: 'rbac_assign_role',
    method: 'POST',
    endpoint: () => '/rbac/users/roles',
    body: ({ targetUserId, roleIds }) => ({ userId: targetUserId, roleId: roleIds.USER }),
    expectedAllowed: ['SUPERADMIN', 'IT_ADMIN'],
    allowedStatuses: [201, 400, 409, 422],
  },
  {
    id: 'rbac_grant_custom_permission',
    method: 'POST',
    endpoint: () => '/rbac/users/custom-permissions/grant',
    body: ({ targetUserId }) => ({ userId: targetUserId, permissionId: '00000000-0000-0000-0000-000000000000' }),
    expectedAllowed: ['SUPERADMIN', 'IT_ADMIN'],
    allowedStatuses: [201, 400, 404, 409, 422],
  },
];

async function ensureRoleAccounts() {
  const passwordHash = await bcrypt.hash(UAT_PASSWORD, PASSWORD_HASH_ROUNDS);

  const roles = await prisma.role.findMany({
    where: { slug: { in: ROLE_ACCOUNTS.map((a) => a.role) } },
    select: { id: true, slug: true },
  });

  const roleMap = Object.fromEntries(roles.map((r) => [r.slug, r.id]));
  const missingRoles = ROLE_ACCOUNTS.filter((a) => !roleMap[a.role]).map((a) => a.role);
  if (missingRoles.length > 0) {
    throw new Error(`Missing required roles in DB: ${missingRoles.join(', ')}`);
  }

  const users = [];
  for (const account of ROLE_ACCOUNTS) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        password: passwordHash,
        isActive: true,
        deletedAt: null,
      },
      create: {
        email: account.email,
        password: passwordHash,
        firstName: account.firstName,
        lastName: account.lastName,
        isActive: true,
        tokenVersion: 1,
      },
      select: { id: true, email: true },
    });

    users.push({ ...account, id: user.id });

    const userRoles = await prisma.userRole.findMany({
      where: { userId: user.id, isActive: true },
      select: { id: true, roleId: true },
    });

    const wantedRoleId = roleMap[account.role];
    const hasWantedRole = userRoles.some((ur) => ur.roleId === wantedRoleId);

    if (!hasWantedRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: wantedRoleId,
          grantedBy: user.id,
          isActive: true,
          isTemporary: false,
        },
      });
    }

    const otherRoleIds = userRoles.filter((ur) => ur.roleId !== wantedRoleId).map((ur) => ur.id);
    if (otherRoleIds.length > 0) {
      await prisma.userRole.updateMany({
        where: { id: { in: otherRoleIds } },
        data: { isActive: false, revokedAt: new Date(), revokedBy: user.id },
      });
    }
  }

  return {
    users,
    roleIds: roleMap,
  };
}

async function login(email) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: UAT_PASSWORD, rememberMe: false }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.tokens?.accessToken) {
    return null;
  }

  return { token: body.tokens.accessToken };
}

async function apiRequest(token, endpoint, method = 'GET', body) {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body != null && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const payload = await res.json().catch(() => ({}));
  return { status: res.status, payload };
}

async function getCurrentUser(token) {
  const response = await apiRequest(token, '/auth/me', 'GET');
  if (response.status !== 200 || !response.payload?.id) {
    throw new Error(`Failed to resolve /auth/me. status=${response.status}`);
  }
  return response.payload;
}

function evaluateResult(test, accountRole, status) {
  const shouldAllow = test.expectedAllowed.includes(accountRole);
  const allowedStatuses = test.allowedStatuses || [200];

  if (shouldAllow) {
    const pass = allowedStatuses.includes(status);
    return {
      pass,
      shouldAllow,
      expectedStatuses: allowedStatuses,
      reason: pass ? 'Allowed as expected' : `Expected one of [${allowedStatuses.join(', ')}], got ${status}`,
    };
  }

  const pass = status === 403;
  return {
    pass,
    shouldAllow,
    expectedStatuses: [403],
    reason: pass ? 'Denied as expected' : `Expected 403 for deny path, got ${status}`,
  };
}

async function main() {
  const started = Date.now();
  const setup = await ensureRoleAccounts();

  const userByRole = Object.fromEntries(setup.users.map((u) => [u.role, u]));
  const targetUserId = userByRole.USER.id;

  const sessions = [];
  for (const account of setup.users) {
    const auth = await login(account.email);
    if (!auth) {
      sessions.push({
        role: account.role,
        email: account.email,
        login: 'FAILED',
      });
      continue;
    }

    const me = await getCurrentUser(auth.token);
    sessions.push({
      role: account.role,
      email: account.email,
      login: 'OK',
      token: auth.token,
      me,
    });
  }

  const executable = sessions.filter((s) => s.login === 'OK');
  const matrix = [];
  const policyRisks = [];

  for (const account of executable) {
    for (const test of TESTS) {
      const endpoint = test.endpoint({
        me: account.me,
        targetUserId,
        roleIds: setup.roleIds,
      });

      const requestBody = typeof test.body === 'function'
        ? test.body({
            me: account.me,
            targetUserId,
            roleIds: setup.roleIds,
          })
        : test.body;

      const response = await apiRequest(
        account.token,
        endpoint,
        test.method,
        requestBody,
      );

      const evaluation = evaluateResult(test, account.role, response.status);

      const row = {
        role: account.role,
        email: account.email,
        testId: test.id,
        method: test.method,
        endpoint,
        status: response.status,
        pass: evaluation.pass,
        shouldAllow: evaluation.shouldAllow,
        expectedStatuses: evaluation.expectedStatuses,
        reason: evaluation.reason,
      };

      if (
        test.policyExpectedAllowed &&
        !test.policyExpectedAllowed.includes(account.role) &&
        response.status !== 403
      ) {
        row.policyRisk = `Policy-intent mismatch (expected deny by policy, got status ${response.status})`;
        policyRisks.push(row);
      }

      matrix.push(row);
    }
  }

  const failures = matrix.filter((m) => !m.pass);

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    setup: {
      createdOrUpdatedUsers: setup.users.map((u) => ({ role: u.role, email: u.email, id: u.id })),
    },
    sessions: sessions.map((s) => ({
      role: s.role,
      email: s.email,
      login: s.login,
      me: s.me ? { id: s.me.id, roles: s.me.roles } : null,
    })),
    summary: {
      executableAccounts: executable.length,
      testsPerAccount: TESTS.length,
      totalChecks: matrix.length,
      passed: matrix.length - failures.length,
      failed: failures.length,
      policyRisks: policyRisks.length,
      durationMs: Date.now() - started,
    },
    failures,
    policyRisks,
    matrix,
  };

  const outDir = path.join(process.cwd(), 'scripts', 'audit', 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'users-rbac-uat.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log('========================================');
  console.log(`Users + RBAC UAT: ${failures.length === 0 ? 'PASS' : 'FAIL'}`);
  console.log('========================================');
  console.log(`Executable accounts: ${report.summary.executableAccounts}`);
  console.log(`Total checks: ${report.summary.totalChecks}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Policy risks: ${report.summary.policyRisks}`);
  console.log(`Report saved to: ${outFile}`);

  if (failures.length > 0) {
    console.log('\nTop failures:');
    failures.slice(0, 20).forEach((f, idx) => {
      console.log(
        `${idx + 1}. [${f.role}] ${f.testId} ${f.method} ${f.endpoint} => status ${f.status} (${f.reason})`,
      );
    });
  }

  if (policyRisks.length > 0) {
    console.log('\nTop policy-intent mismatches:');
    policyRisks.slice(0, 20).forEach((f, idx) => {
      console.log(
        `${idx + 1}. [${f.role}] ${f.testId} ${f.method} ${f.endpoint} => status ${f.status}`,
      );
    });
  }

  process.exitCode = failures.length === 0 ? 0 : 2;
}

main()
  .catch((error) => {
    console.error('Users/RBAC UAT failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
