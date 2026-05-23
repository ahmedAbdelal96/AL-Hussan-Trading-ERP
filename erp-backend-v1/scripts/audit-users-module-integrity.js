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

function toNum(v) {
  if (v == null) return 0;
  return Number(v);
}

async function main() {
  const now = new Date();
  const report = {
    generatedAt: now.toISOString(),
    summary: {
      totalUsers: 0,
      activeUsers: 0,
      totalUserRoles: 0,
      totalCustomPermissions: 0,
      issuesCount: 0,
      warningsCount: 0,
    },
    checks: {},
    issues: [],
    warnings: [],
  };

  const [users, userRoles, customPermissions] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        isActive: true,
        deletedAt: true,
        rowVersion: true,
        lockedUntil: true,
        permanentlyLocked: true,
      },
    }),
    prisma.userRole.findMany({
      select: {
        userId: true,
        roleId: true,
        isActive: true,
        expiresAt: true,
        revokedAt: true,
      },
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
  ]);

  report.summary.totalUsers = users.length;
  report.summary.activeUsers = users.filter((u) => u.isActive).length;
  report.summary.totalUserRoles = userRoles.length;
  report.summary.totalCustomPermissions = customPermissions.length;

  const userIds = new Set(users.map((u) => u.id));

  // Check 1: rowVersion and email sanity.
  let invalidRowVersions = 0;
  let invalidEmails = 0;
  for (const u of users) {
    if (toNum(u.rowVersion) < 1) invalidRowVersions++;
    if (!u.email || !u.email.includes('@')) invalidEmails++;
  }
  report.checks.userCoreShape = {
    pass: invalidRowVersions === 0 && invalidEmails === 0,
    invalidRowVersions,
    invalidEmails,
  };
  if (invalidRowVersions > 0) {
    report.issues.push(`Found ${invalidRowVersions} users with rowVersion < 1.`);
  }
  if (invalidEmails > 0) {
    report.issues.push(`Found ${invalidEmails} users with invalid email format.`);
  }

  // Check 2: active+deleted contradiction and lock consistency.
  let activeButDeleted = 0;
  let invalidLockState = 0;
  for (const u of users) {
    if (u.isActive && u.deletedAt) activeButDeleted++;
    if (u.permanentlyLocked && u.lockedUntil && u.lockedUntil > now) {
      invalidLockState++;
    }
  }
  report.checks.userStateConsistency = {
    pass: activeButDeleted === 0 && invalidLockState === 0,
    activeButDeleted,
    invalidLockState,
  };
  if (activeButDeleted > 0) {
    report.issues.push(
      `Found ${activeButDeleted} users marked active while soft-deleted.`,
    );
  }
  if (invalidLockState > 0) {
    report.issues.push(
      `Found ${invalidLockState} users with conflicting lock state (permanent + temporary lock).`,
    );
  }

  // Check 3: user_roles references and active-duplicate collisions.
  let orphanUserRoleLinks = 0;
  let duplicateActiveUserRoles = 0;
  let expiredStillActiveRoles = 0;
  const activeRoleKeys = new Set();
  for (const r of userRoles) {
    if (!userIds.has(r.userId)) orphanUserRoleLinks++;
    if (r.isActive) {
      const key = `${r.userId}:${r.roleId}`;
      if (activeRoleKeys.has(key)) duplicateActiveUserRoles++;
      activeRoleKeys.add(key);
      if (r.expiresAt && r.expiresAt < now && !r.revokedAt) expiredStillActiveRoles++;
    }
  }
  report.checks.userRoles = {
    pass: orphanUserRoleLinks === 0 && duplicateActiveUserRoles === 0,
    orphanUserRoleLinks,
    duplicateActiveUserRoles,
    expiredStillActiveRoles,
  };
  if (orphanUserRoleLinks > 0) {
    report.issues.push(`Found ${orphanUserRoleLinks} user role records linked to missing users.`);
  }
  if (duplicateActiveUserRoles > 0) {
    report.issues.push(
      `Found ${duplicateActiveUserRoles} duplicate active user-role assignments.`,
    );
  }
  if (expiredStillActiveRoles > 0) {
    report.warnings.push(
      `Found ${expiredStillActiveRoles} active user-role assignments already past expiry date.`,
    );
  }

  // Check 4: custom permissions references and active-duplicate collisions.
  let orphanCustomPermissionLinks = 0;
  let duplicateActiveCustomPermissions = 0;
  let expiredStillActivePermissions = 0;
  const activePermissionKeys = new Set();
  for (const p of customPermissions) {
    if (!userIds.has(p.userId)) orphanCustomPermissionLinks++;
    if (p.isActive) {
      const key = `${p.userId}:${p.permissionId}`;
      if (activePermissionKeys.has(key)) duplicateActiveCustomPermissions++;
      activePermissionKeys.add(key);
      if (p.expiresAt && p.expiresAt < now && !p.revokedAt) {
        expiredStillActivePermissions++;
      }
    }
  }
  report.checks.customPermissions = {
    pass: orphanCustomPermissionLinks === 0 && duplicateActiveCustomPermissions === 0,
    orphanCustomPermissionLinks,
    duplicateActiveCustomPermissions,
    expiredStillActivePermissions,
  };
  if (orphanCustomPermissionLinks > 0) {
    report.issues.push(
      `Found ${orphanCustomPermissionLinks} custom permission records linked to missing users.`,
    );
  }
  if (duplicateActiveCustomPermissions > 0) {
    report.issues.push(
      `Found ${duplicateActiveCustomPermissions} duplicate active custom permissions for the same user/permission pair.`,
    );
  }
  if (expiredStillActivePermissions > 0) {
    report.warnings.push(
      `Found ${expiredStillActivePermissions} active custom permissions already past expiry date.`,
    );
  }

  report.summary.issuesCount = report.issues.length;
  report.summary.warningsCount = report.warnings.length;

  const fs = require('fs');
  const path = require('path');
  const outDir = path.join(process.cwd(), 'scripts', 'audit', 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'users-module-integrity.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  const status = report.issues.length === 0 ? 'PASS' : 'FAIL';
  console.log('========================================');
  console.log(`Users Module Integrity Audit: ${status}`);
  console.log('========================================');
  console.log(`Users: ${report.summary.totalUsers}`);
  console.log(`UserRoles: ${report.summary.totalUserRoles}`);
  console.log(`CustomPermissions: ${report.summary.totalCustomPermissions}`);
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

