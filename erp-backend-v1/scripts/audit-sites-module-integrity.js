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
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalSites: 0,
      totalProjectsLinkedToSites: 0,
      issuesCount: 0,
      warningsCount: 0,
    },
    checks: {},
    issues: [],
    warnings: [],
  };

  const [sites, projects, users] = await Promise.all([
    prisma.site.findMany({
      select: {
        id: true,
        code: true,
        status: true,
        capacity: true,
        area: true,
        rowVersion: true,
        deletedAt: true,
        createdBy: true,
        updatedBy: true,
      },
    }),
    prisma.project.findMany({
      select: {
        id: true,
        siteId: true,
        status: true,
        deletedAt: true,
      },
    }),
    prisma.user.findMany({ select: { id: true } }),
  ]);

  report.summary.totalSites = sites.length;
  report.summary.totalProjectsLinkedToSites = projects.filter((p) => !!p.siteId).length;

  const siteIds = new Set(sites.map((s) => s.id));
  const userIds = new Set(users.map((u) => u.id));

  // Check 1: rowVersion and basic numeric constraints.
  let invalidRowVersions = 0;
  let negativeCapacity = 0;
  let negativeArea = 0;
  for (const s of sites) {
    if (toNum(s.rowVersion) < 1) invalidRowVersions++;
    if (s.capacity != null && toNum(s.capacity) < 0) negativeCapacity++;
    if (s.area != null && toNum(s.area) < 0) negativeArea++;
  }
  report.checks.coreConstraints = {
    pass: invalidRowVersions === 0 && negativeCapacity === 0 && negativeArea === 0,
    invalidRowVersions,
    negativeCapacity,
    negativeArea,
  };
  if (invalidRowVersions > 0) {
    report.issues.push(`Found ${invalidRowVersions} sites with rowVersion < 1.`);
  }
  if (negativeCapacity > 0 || negativeArea > 0) {
    report.issues.push(
      `Found invalid site numeric values (negative capacity: ${negativeCapacity}, negative area: ${negativeArea}).`,
    );
  }

  // Check 2: active+deleted contradiction and creator/updater links.
  let activeButDeleted = 0;
  let invalidCreatorLinks = 0;
  let invalidUpdaterLinks = 0;
  for (const s of sites) {
    if (s.status === 'ACTIVE' && s.deletedAt) activeButDeleted++;
    if (!userIds.has(s.createdBy)) invalidCreatorLinks++;
    if (s.updatedBy && !userIds.has(s.updatedBy)) invalidUpdaterLinks++;
  }
  report.checks.stateAndAuditLinks = {
    pass: activeButDeleted === 0 && invalidCreatorLinks === 0 && invalidUpdaterLinks === 0,
    activeButDeleted,
    invalidCreatorLinks,
    invalidUpdaterLinks,
  };
  if (activeButDeleted > 0) {
    report.issues.push(`Found ${activeButDeleted} active sites that are soft-deleted.`);
  }
  if (invalidCreatorLinks > 0 || invalidUpdaterLinks > 0) {
    report.issues.push(
      `Found invalid user links on site audit fields (createdBy: ${invalidCreatorLinks}, updatedBy: ${invalidUpdaterLinks}).`,
    );
  }

  // Check 3: project.siteId link consistency.
  let missingSiteLinksInProjects = 0;
  for (const p of projects) {
    if (p.siteId && !siteIds.has(p.siteId)) missingSiteLinksInProjects++;
  }
  report.checks.projectLinks = {
    pass: missingSiteLinksInProjects === 0,
    missingSiteLinksInProjects,
  };
  if (missingSiteLinksInProjects > 0) {
    report.issues.push(
      `Found ${missingSiteLinksInProjects} projects linked to missing sites.`,
    );
  }

  // Check 4: deleted sites still having operational projects (warning).
  const terminalStatuses = new Set(['COMPLETED', 'CANCELLED', 'ARCHIVED', 'DRAFT']);
  let deletedSitesWithOperationalProjects = 0;
  const deletedSiteIds = new Set(sites.filter((s) => !!s.deletedAt).map((s) => s.id));
  for (const p of projects) {
    if (!p.siteId || !deletedSiteIds.has(p.siteId)) continue;
    if (!terminalStatuses.has(p.status) && !p.deletedAt) {
      deletedSitesWithOperationalProjects++;
    }
  }
  report.checks.deletedSitesOperationalProjects = {
    pass: true,
    deletedSitesWithOperationalProjects,
  };
  if (deletedSitesWithOperationalProjects > 0) {
    report.warnings.push(
      `Found ${deletedSitesWithOperationalProjects} operational projects linked to soft-deleted sites.`,
    );
  }

  report.summary.issuesCount = report.issues.length;
  report.summary.warningsCount = report.warnings.length;

  const fs = require('fs');
  const path = require('path');
  const outDir = path.join(process.cwd(), 'scripts', 'audit', 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'sites-module-integrity.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  const status = report.issues.length === 0 ? 'PASS' : 'FAIL';
  console.log('========================================');
  console.log(`Sites Module Integrity Audit: ${status}`);
  console.log('========================================');
  console.log(`Sites: ${report.summary.totalSites}`);
  console.log(`Projects linked to sites: ${report.summary.totalProjectsLinkedToSites}`);
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

