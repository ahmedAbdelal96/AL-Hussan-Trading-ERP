/* eslint-disable no-console */
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for audit script.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const now = new Date();
  const report = {
    generatedAt: now.toISOString(),
    summary: {
      refreshTokens: 0,
      roles: 0,
      permissions: 0,
      rolePermissions: 0,
      userRoles: 0,
      userCustomPermissions: 0,
      auditLogs: 0,
      documents: {
        employees: 0,
        projects: 0,
        assets: 0,
        maintenance: 0,
      },
      issuesCount: 0,
      warningsCount: 0,
    },
    checks: {},
    issues: [],
    warnings: [],
  };

  const [
    users,
    refreshTokens,
    roles,
    permissions,
    rolePermissions,
    userRoles,
    userCustomPermissions,
    auditLogs,
    employees,
    projects,
    assets,
    maintenanceRequests,
    employeeDocuments,
    projectDocuments,
    assetDocuments,
    maintenanceDocuments,
  ] = await Promise.all([
    prisma.user.findMany({ select: { id: true } }),
    prisma.refreshToken.findMany({
      select: { userId: true, isRevoked: true, expiresAt: true },
    }),
    prisma.role.findMany({ select: { id: true, isActive: true } }),
    prisma.permission.findMany({ select: { id: true } }),
    prisma.rolePermission.findMany({ select: { roleId: true, permissionId: true } }),
    prisma.userRole.findMany({
      select: { userId: true, roleId: true, isActive: true, expiresAt: true, revokedAt: true },
    }),
    prisma.userCustomPermission.findMany({
      select: {
        userId: true,
        permissionId: true,
        isActive: true,
        expiresAt: true,
        revokedAt: true,
      },
    }),
    prisma.auditLog.findMany({ select: { userId: true } }),
    prisma.employee.findMany({ select: { id: true } }),
    prisma.project.findMany({ select: { id: true } }),
    prisma.asset.findMany({ select: { id: true } }),
    prisma.maintenanceRequest.findMany({ select: { id: true } }),
    prisma.employeeDocument.findMany({
      select: { id: true, employeeId: true, uploadedBy: true, fileSize: true, filePath: true },
    }),
    prisma.projectDocument.findMany({
      select: { id: true, projectId: true, uploadedBy: true, fileSize: true, filePath: true },
    }),
    prisma.assetDocument.findMany({
      select: { id: true, assetId: true, uploadedBy: true, fileSize: true, filePath: true },
    }),
    prisma.maintenanceDocument.findMany({
      select: {
        id: true,
        maintenanceId: true,
        uploadedBy: true,
        fileSize: true,
        filePath: true,
      },
    }),
  ]);

  report.summary.refreshTokens = refreshTokens.length;
  report.summary.roles = roles.length;
  report.summary.permissions = permissions.length;
  report.summary.rolePermissions = rolePermissions.length;
  report.summary.userRoles = userRoles.length;
  report.summary.userCustomPermissions = userCustomPermissions.length;
  report.summary.auditLogs = auditLogs.length;
  report.summary.documents.employees = employeeDocuments.length;
  report.summary.documents.projects = projectDocuments.length;
  report.summary.documents.assets = assetDocuments.length;
  report.summary.documents.maintenance = maintenanceDocuments.length;

  const userIds = new Set(users.map((x) => x.id));
  const roleIds = new Set(roles.map((x) => x.id));
  const permissionIds = new Set(permissions.map((x) => x.id));
  const employeeIds = new Set(employees.map((x) => x.id));
  const projectIds = new Set(projects.map((x) => x.id));
  const assetIds = new Set(assets.map((x) => x.id));
  const maintenanceIds = new Set(maintenanceRequests.map((x) => x.id));

  // Check 1: RBAC model consistency.
  let orphanRolePermissions = 0;
  let orphanUserRoles = 0;
  let orphanUserCustomPermissions = 0;
  let expiredStillActiveUserRoles = 0;
  let expiredStillActiveCustomPermissions = 0;
  for (const rp of rolePermissions) {
    if (!roleIds.has(rp.roleId) || !permissionIds.has(rp.permissionId)) {
      orphanRolePermissions++;
    }
  }
  for (const ur of userRoles) {
    if (!userIds.has(ur.userId) || !roleIds.has(ur.roleId)) orphanUserRoles++;
    if (ur.isActive && ur.expiresAt && ur.expiresAt < now && !ur.revokedAt) {
      expiredStillActiveUserRoles++;
    }
  }
  for (const up of userCustomPermissions) {
    if (!userIds.has(up.userId) || !permissionIds.has(up.permissionId)) {
      orphanUserCustomPermissions++;
    }
    if (up.isActive && up.expiresAt && up.expiresAt < now && !up.revokedAt) {
      expiredStillActiveCustomPermissions++;
    }
  }
  report.checks.rbacIntegrity = {
    pass:
      orphanRolePermissions === 0 &&
      orphanUserRoles === 0 &&
      orphanUserCustomPermissions === 0,
    orphanRolePermissions,
    orphanUserRoles,
    orphanUserCustomPermissions,
    expiredStillActiveUserRoles,
    expiredStillActiveCustomPermissions,
  };
  if (orphanRolePermissions > 0 || orphanUserRoles > 0 || orphanUserCustomPermissions > 0) {
    report.issues.push(
      `RBAC orphan links found (rolePermissions: ${orphanRolePermissions}, userRoles: ${orphanUserRoles}, userCustomPermissions: ${orphanUserCustomPermissions}).`,
    );
  }
  if (expiredStillActiveUserRoles > 0 || expiredStillActiveCustomPermissions > 0) {
    report.warnings.push(
      `Found expired records still active (userRoles: ${expiredStillActiveUserRoles}, userCustomPermissions: ${expiredStillActiveCustomPermissions}).`,
    );
  }

  // Check 2: Auth token sanity.
  let orphanRefreshTokens = 0;
  let expiredUnrevokedRefreshTokens = 0;
  for (const t of refreshTokens) {
    if (!userIds.has(t.userId)) orphanRefreshTokens++;
    if (!t.isRevoked && t.expiresAt < now) expiredUnrevokedRefreshTokens++;
  }
  report.checks.authTokens = {
    pass: orphanRefreshTokens === 0,
    orphanRefreshTokens,
    expiredUnrevokedRefreshTokens,
  };
  if (orphanRefreshTokens > 0) {
    report.issues.push(`Found ${orphanRefreshTokens} refresh tokens linked to missing users.`);
  }
  if (expiredUnrevokedRefreshTokens > 0) {
    report.warnings.push(
      `Found ${expiredUnrevokedRefreshTokens} expired refresh tokens not explicitly revoked (cleanup candidate).`,
    );
  }

  // Check 3: Audit logs integrity.
  let orphanAuditLogs = 0;
  for (const log of auditLogs) {
    if (log.userId && !userIds.has(log.userId)) orphanAuditLogs++;
  }
  report.checks.auditLogs = {
    pass: orphanAuditLogs === 0,
    orphanAuditLogs,
  };
  if (orphanAuditLogs > 0) {
    report.issues.push(`Found ${orphanAuditLogs} audit logs linked to missing users.`);
  }

  // Check 4: Documents consistency across entities.
  let orphanEmployeeDocs = 0;
  let orphanProjectDocs = 0;
  let orphanAssetDocs = 0;
  let orphanMaintenanceDocs = 0;
  let badFileMetadata = 0;
  let orphanDocumentUploaders = 0;

  for (const d of employeeDocuments) {
    if (!employeeIds.has(d.employeeId)) orphanEmployeeDocs++;
    if (!userIds.has(d.uploadedBy)) orphanDocumentUploaders++;
    if (!d.filePath || d.fileSize <= 0) badFileMetadata++;
  }
  for (const d of projectDocuments) {
    if (!projectIds.has(d.projectId)) orphanProjectDocs++;
    if (!userIds.has(d.uploadedBy)) orphanDocumentUploaders++;
    if (!d.filePath || d.fileSize <= 0) badFileMetadata++;
  }
  for (const d of assetDocuments) {
    if (!assetIds.has(d.assetId)) orphanAssetDocs++;
    if (!userIds.has(d.uploadedBy)) orphanDocumentUploaders++;
    if (!d.filePath || d.fileSize <= 0) badFileMetadata++;
  }
  for (const d of maintenanceDocuments) {
    if (!maintenanceIds.has(d.maintenanceId)) orphanMaintenanceDocs++;
    if (!userIds.has(d.uploadedBy)) orphanDocumentUploaders++;
    if (!d.filePath || d.fileSize <= 0) badFileMetadata++;
  }

  report.checks.documents = {
    pass:
      orphanEmployeeDocs === 0 &&
      orphanProjectDocs === 0 &&
      orphanAssetDocs === 0 &&
      orphanMaintenanceDocs === 0 &&
      badFileMetadata === 0 &&
      orphanDocumentUploaders === 0,
    orphanEmployeeDocs,
    orphanProjectDocs,
    orphanAssetDocs,
    orphanMaintenanceDocs,
    orphanDocumentUploaders,
    badFileMetadata,
  };
  if (orphanEmployeeDocs + orphanProjectDocs + orphanAssetDocs + orphanMaintenanceDocs > 0) {
    report.issues.push(
      `Found orphan document links (employee: ${orphanEmployeeDocs}, project: ${orphanProjectDocs}, asset: ${orphanAssetDocs}, maintenance: ${orphanMaintenanceDocs}).`,
    );
  }
  if (orphanDocumentUploaders > 0) {
    report.issues.push(`Found ${orphanDocumentUploaders} documents with invalid uploadedBy user.`);
  }
  if (badFileMetadata > 0) {
    report.issues.push(`Found ${badFileMetadata} documents with invalid file metadata.`);
  }

  report.summary.issuesCount = report.issues.length;
  report.summary.warningsCount = report.warnings.length;

  const fs = require('fs');
  const path = require('path');
  const outDir = path.join(process.cwd(), 'scripts', 'audit', 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'platform-module-integrity.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  const status = report.issues.length === 0 ? 'PASS' : 'FAIL';
  console.log('========================================');
  console.log(`Platform Module Integrity Audit: ${status}`);
  console.log('========================================');
  console.log(
    `Tokens: ${report.summary.refreshTokens}, Roles: ${report.summary.roles}, Permissions: ${report.summary.permissions}`,
  );
  console.log(`Issues: ${report.summary.issuesCount}`);
  console.log(`Warnings: ${report.summary.warningsCount}`);
  if (report.issues.length > 0) {
    console.log('\nIssues:');
    report.issues.forEach((i, idx) => console.log(`${idx + 1}. ${i}`));
  }
  if (report.warnings.length > 0) {
    console.log('\nWarnings:');
    report.warnings.forEach((w, idx) => console.log(`${idx + 1}. ${w}`));
  }
  console.log(`\nReport saved to: ${outFile}`);

  process.exitCode = report.issues.length === 0 ? 0 : 2;
}

main()
  .catch((e) => {
    console.error('Audit failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
