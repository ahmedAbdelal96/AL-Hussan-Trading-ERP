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

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required.');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function fail(failures, endpoint, field, actual, expected) {
  failures.push({ endpoint, field, actual, expected });
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

function expectStatus200(failures, endpoint, result) {
  if (result.status !== 200) {
    fail(failures, endpoint, 'http_status', result.status, 200);
    return false;
  }
  return true;
}

function expectKeys(failures, endpoint, payload, keys) {
  for (const key of keys) {
    if (!(key in payload)) {
      fail(failures, endpoint, `missing_key:${key}`, false, true);
    }
  }
}

async function main() {
  const failures = [];
  const endpointStatus = [];
  const token = await getToken();

  // Auth
  const authMe = await apiFetch(token, '/auth/me');
  endpointStatus.push({ endpoint: '/auth/me', status: authMe.status });
  if (expectStatus200(failures, '/auth/me', authMe)) {
    expectKeys(failures, '/auth/me', authMe.body, [
      'id',
      'email',
      'firstName',
      'lastName',
      'roles',
      'permissions',
      'isActive',
    ]);
  }

  const authSessions = await apiFetch(token, '/auth/sessions/active');
  endpointStatus.push({ endpoint: '/auth/sessions/active', status: authSessions.status });
  if (expectStatus200(failures, '/auth/sessions/active', authSessions)) {
    if (!Array.isArray(authSessions.body)) {
      fail(failures, '/auth/sessions/active', 'response_type', typeof authSessions.body, 'array');
    }
  }

  // RBAC
  const permissions = await apiFetch(token, '/rbac/permissions');
  endpointStatus.push({ endpoint: '/rbac/permissions', status: permissions.status });
  let firstPermissionId = null;
  if (expectStatus200(failures, '/rbac/permissions', permissions)) {
    expectKeys(failures, '/rbac/permissions', permissions.body, [
      'data',
      'total',
      'page',
      'limit',
      'totalPages',
    ]);
    if (!Array.isArray(permissions.body.data)) {
      fail(failures, '/rbac/permissions', 'data_type', typeof permissions.body.data, 'array');
    } else if (permissions.body.data.length > 0) {
      firstPermissionId = permissions.body.data[0].id;
    }
  }

  const resources = await apiFetch(token, '/rbac/permissions/resources');
  endpointStatus.push({ endpoint: '/rbac/permissions/resources', status: resources.status });
  let firstResource = null;
  if (expectStatus200(failures, '/rbac/permissions/resources', resources)) {
    expectKeys(failures, '/rbac/permissions/resources', resources.body, ['resources', 'count']);
    if (!Array.isArray(resources.body.resources)) {
      fail(
        failures,
        '/rbac/permissions/resources',
        'resources_type',
        typeof resources.body.resources,
        'array',
      );
    } else if (resources.body.resources.length > 0) {
      firstResource = resources.body.resources[0];
    }
  }

  if (firstResource) {
    const actions = await apiFetch(
      token,
      `/rbac/permissions/resources/${encodeURIComponent(firstResource)}/actions`,
    );
    endpointStatus.push({
      endpoint: '/rbac/permissions/resources/:resource/actions',
      status: actions.status,
    });
    if (expectStatus200(failures, '/rbac/permissions/resources/:resource/actions', actions)) {
      expectKeys(failures, '/rbac/permissions/resources/:resource/actions', actions.body, [
        'resource',
        'actions',
      ]);
    }
  }

  if (firstPermissionId) {
    const permissionById = await apiFetch(token, `/rbac/permissions/${firstPermissionId}`);
    endpointStatus.push({ endpoint: '/rbac/permissions/:id', status: permissionById.status });
    if (expectStatus200(failures, '/rbac/permissions/:id', permissionById)) {
      expectKeys(failures, '/rbac/permissions/:id', permissionById.body, ['id', 'permission', 'resource', 'action']);
    }
  }

  const roles = await apiFetch(token, '/rbac/roles');
  endpointStatus.push({ endpoint: '/rbac/roles', status: roles.status });
  let firstRoleId = null;
  if (expectStatus200(failures, '/rbac/roles', roles)) {
    expectKeys(failures, '/rbac/roles', roles.body, ['data', 'total', 'page', 'limit', 'totalPages']);
    if (!Array.isArray(roles.body.data)) {
      fail(failures, '/rbac/roles', 'data_type', typeof roles.body.data, 'array');
    } else if (roles.body.data.length > 0) {
      firstRoleId = roles.body.data[0].id;
    }
  }

  if (firstRoleId) {
    const roleById = await apiFetch(token, `/rbac/roles/${firstRoleId}`);
    endpointStatus.push({ endpoint: '/rbac/roles/:id', status: roleById.status });
    if (expectStatus200(failures, '/rbac/roles/:id', roleById)) {
      expectKeys(failures, '/rbac/roles/:id', roleById.body, ['id', 'name']);
    }
  }

  // Documents (read-only)
  const firstEmployee = await prisma.employee.findFirst({ select: { id: true } });
  if (firstEmployee) {
    const employeeDocs = await apiFetch(token, `/documents/employee/${firstEmployee.id}`);
    endpointStatus.push({ endpoint: '/documents/employee/:id', status: employeeDocs.status });
    if (expectStatus200(failures, '/documents/employee/:id', employeeDocs)) {
      if (!Array.isArray(employeeDocs.body)) {
        fail(failures, '/documents/employee/:id', 'response_type', typeof employeeDocs.body, 'array');
      }
    }
  } else {
    fail(failures, '/documents/employee/:id', 'precondition_employee_exists', false, true);
  }

  // Dashboard
  const dashboard = await apiFetch(token, '/dashboard');
  endpointStatus.push({ endpoint: '/dashboard', status: dashboard.status });
  if (expectStatus200(failures, '/dashboard', dashboard)) {
    expectKeys(failures, '/dashboard', dashboard.body, [
      'assets',
      'projects',
      'employees',
      'maintenance',
      'finance',
      'payroll',
      'alerts',
      'generatedAt',
    ]);
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
  const outFile = path.join(outDir, 'platform-endpoints-validation.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log('========================================');
  console.log(`Platform Endpoints Validation: ${report.summary.pass ? 'PASS' : 'FAIL'}`);
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
    console.error('Platform endpoints validation failed:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
