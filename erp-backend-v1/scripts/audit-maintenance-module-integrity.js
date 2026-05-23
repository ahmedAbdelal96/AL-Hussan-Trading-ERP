/* eslint-disable no-console */
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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
      totalMaintenanceRequests: 0,
      totalAllocations: 0,
      issuesCount: 0,
      warningsCount: 0,
    },
    checks: {},
    issues: [],
    warnings: [],
  };

  const [requests, allocations, assets, projects, users] = await Promise.all([
    prisma.maintenanceRequest.findMany({
      select: {
        id: true,
        assetId: true,
        projectId: true,
        status: true,
        maintenanceType: true,
        priority: true,
        scheduledDate: true,
        startedAt: true,
        completedAt: true,
        estimatedCost: true,
        actualCost: true,
        createdBy: true,
        rowVersion: true,
      },
    }),
    prisma.maintenanceProjectAllocation.findMany({
      select: { id: true, maintenanceId: true, projectId: true, allocatedAmount: true, percentage: true },
    }),
    prisma.asset.findMany({ select: { id: true } }),
    prisma.project.findMany({ select: { id: true } }),
    prisma.user.findMany({ select: { id: true } }),
  ]);

  report.summary.totalMaintenanceRequests = requests.length;
  report.summary.totalAllocations = allocations.length;

  const assetIds = new Set(assets.map((x) => x.id));
  const projectIds = new Set(projects.map((x) => x.id));
  const userIds = new Set(users.map((x) => x.id));
  const maintenanceIds = new Set(requests.map((x) => x.id));

  // 1) Relation integrity
  let orphanAssetRefs = 0;
  let orphanProjectRefs = 0;
  let orphanCreatorRefs = 0;
  let orphanAllocMaintenance = 0;
  let orphanAllocProject = 0;
  for (const r of requests) {
    if (!assetIds.has(r.assetId)) orphanAssetRefs++;
    if (r.projectId && !projectIds.has(r.projectId)) orphanProjectRefs++;
    if (!userIds.has(r.createdBy)) orphanCreatorRefs++;
  }
  for (const a of allocations) {
    if (!maintenanceIds.has(a.maintenanceId)) orphanAllocMaintenance++;
    if (!projectIds.has(a.projectId)) orphanAllocProject++;
  }
  report.checks.referenceIntegrity = {
    pass:
      orphanAssetRefs === 0 &&
      orphanProjectRefs === 0 &&
      orphanCreatorRefs === 0 &&
      orphanAllocMaintenance === 0 &&
      orphanAllocProject === 0,
    orphanAssetRefs,
    orphanProjectRefs,
    orphanCreatorRefs,
    orphanAllocMaintenance,
    orphanAllocProject,
  };
  if (!report.checks.referenceIntegrity.pass) {
    report.issues.push(
      `Found orphan maintenance references (asset=${orphanAssetRefs}, project=${orphanProjectRefs}, creator=${orphanCreatorRefs}, alloc.maintenance=${orphanAllocMaintenance}, alloc.project=${orphanAllocProject}).`,
    );
  }

  // 2) Chronology sanity
  let invalidStartBeforeSchedule = 0;
  let invalidCompletionBeforeStart = 0;
  let completedWithoutCompletedAt = 0;
  for (const r of requests) {
    if (r.scheduledDate && r.startedAt && r.startedAt < r.scheduledDate) invalidStartBeforeSchedule++;
    if (r.startedAt && r.completedAt && r.completedAt < r.startedAt) invalidCompletionBeforeStart++;
    if (r.status === 'COMPLETED' && !r.completedAt) completedWithoutCompletedAt++;
  }
  report.checks.chronology = {
    pass:
      invalidStartBeforeSchedule === 0 &&
      invalidCompletionBeforeStart === 0 &&
      completedWithoutCompletedAt === 0,
    invalidStartBeforeSchedule,
    invalidCompletionBeforeStart,
    completedWithoutCompletedAt,
  };
  if (!report.checks.chronology.pass) {
    report.issues.push(
      `Maintenance chronology failed (invalidStartBeforeSchedule=${invalidStartBeforeSchedule}, invalidCompletionBeforeStart=${invalidCompletionBeforeStart}, completedWithoutCompletedAt=${completedWithoutCompletedAt}).`,
    );
  }

  // 3) Numeric sanity
  let negativeEstimated = 0;
  let negativeActual = 0;
  let invalidVersion = 0;
  for (const r of requests) {
    if (toNum(r.estimatedCost) < 0) negativeEstimated++;
    if (toNum(r.actualCost) < 0) negativeActual++;
    if (toNum(r.rowVersion) < 1) invalidVersion++;
  }
  report.checks.numericSanity = {
    pass: negativeEstimated === 0 && negativeActual === 0 && invalidVersion === 0,
    negativeEstimated,
    negativeActual,
    invalidVersion,
  };
  if (!report.checks.numericSanity.pass) {
    report.issues.push(
      `Maintenance numeric sanity failed (negativeEstimated=${negativeEstimated}, negativeActual=${negativeActual}, invalidVersion=${invalidVersion}).`,
    );
  }

  // 4) Allocation consistency by maintenance request
  const allocByMaintenance = new Map();
  for (const a of allocations) {
    const arr = allocByMaintenance.get(a.maintenanceId) || [];
    arr.push(a);
    allocByMaintenance.set(a.maintenanceId, arr);
  }
  let badAllocatedCostSum = 0;
  let badPercentageSum = 0;
  for (const [maintenanceId, rows] of allocByMaintenance.entries()) {
    const req = requests.find((x) => x.id === maintenanceId);
    if (!req) continue;
    const sumCost = rows.reduce((s, x) => s + toNum(x.allocatedAmount), 0);
    const sumPct = rows.reduce((s, x) => s + toNum(x.percentage), 0);
    const actual = toNum(req.actualCost);
    if (actual > 0 && Math.abs(sumCost - actual) > 0.05) badAllocatedCostSum++;
    if (Math.abs(sumPct - 100) > 0.05) badPercentageSum++;
  }
  report.checks.allocationConsistency = {
    pass: badAllocatedCostSum === 0 && badPercentageSum === 0,
    badAllocatedCostSum,
    badPercentageSum,
  };
  if (!report.checks.allocationConsistency.pass) {
    report.issues.push(
      `Maintenance allocation consistency failed (badAllocatedCostSum=${badAllocatedCostSum}, badPercentageSum=${badPercentageSum}).`,
    );
  }

  // Warnings
  const inProgressNoStart = requests.filter(
    (r) => r.status === 'IN_PROGRESS' && !r.startedAt,
  ).length;
  if (inProgressNoStart > 0) {
    report.warnings.push(`${inProgressNoStart} IN_PROGRESS requests have no startedAt timestamp.`);
  }

  report.summary.issuesCount = report.issues.length;
  report.summary.warningsCount = report.warnings.length;

  const outDir = path.join(process.cwd(), 'scripts', 'audit', 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'maintenance-module-integrity.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  const status = report.issues.length === 0 ? 'PASS' : 'FAIL';
  console.log('========================================');
  console.log(`Maintenance Module Integrity Audit: ${status}`);
  console.log('========================================');
  console.log(`Requests: ${report.summary.totalMaintenanceRequests}`);
  console.log(`Allocations: ${report.summary.totalAllocations}`);
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
