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

function round2(v) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

async function main() {
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalAssets: 0,
      totalProjectAssets: 0,
      totalAssetEmployees: 0,
      totalMaintenanceRequests: 0,
      issuesCount: 0,
      warningsCount: 0,
    },
    checks: {},
    issues: [],
    warnings: [],
  };

  const [assets, projectAssets, assetEmployees, maintenanceRequests, projects, employees] =
    await Promise.all([
      prisma.asset.findMany({
        select: {
          id: true,
          purchasePrice: true,
          purchaseDate: true,
          status: true,
          rowVersion: true,
          deletedAt: true,
        },
      }),
      prisma.projectAsset.findMany({
        select: {
          id: true,
          projectId: true,
          assetId: true,
          percentage: true,
          isActive: true,
        },
      }),
      prisma.assetEmployee.findMany({
        select: {
          id: true,
          assetId: true,
          employeeId: true,
          isActive: true,
        },
      }),
      prisma.maintenanceRequest.findMany({
        select: { id: true, assetId: true, actualCost: true, estimatedCost: true },
      }),
      prisma.project.findMany({ select: { id: true } }),
      prisma.employee.findMany({ select: { id: true } }),
    ]);

  report.summary.totalAssets = assets.length;
  report.summary.totalProjectAssets = projectAssets.length;
  report.summary.totalAssetEmployees = assetEmployees.length;
  report.summary.totalMaintenanceRequests = maintenanceRequests.length;

  const assetIds = new Set(assets.map((x) => x.id));
  const projectIds = new Set(projects.map((x) => x.id));
  const employeeIds = new Set(employees.map((x) => x.id));

  // 1) Relation integrity
  let orphanProjectAssetAsset = 0;
  let orphanProjectAssetProject = 0;
  let orphanAssetEmployeeAsset = 0;
  let orphanAssetEmployeeEmployee = 0;
  let orphanMaintenanceAsset = 0;

  for (const pa of projectAssets) {
    if (!assetIds.has(pa.assetId)) orphanProjectAssetAsset++;
    if (!projectIds.has(pa.projectId)) orphanProjectAssetProject++;
  }
  for (const ae of assetEmployees) {
    if (!assetIds.has(ae.assetId)) orphanAssetEmployeeAsset++;
    if (!employeeIds.has(ae.employeeId)) orphanAssetEmployeeEmployee++;
  }
  for (const mr of maintenanceRequests) {
    if (!assetIds.has(mr.assetId)) orphanMaintenanceAsset++;
  }

  report.checks.referenceIntegrity = {
    pass:
      orphanProjectAssetAsset === 0 &&
      orphanProjectAssetProject === 0 &&
      orphanAssetEmployeeAsset === 0 &&
      orphanAssetEmployeeEmployee === 0 &&
      orphanMaintenanceAsset === 0,
    orphanProjectAssetAsset,
    orphanProjectAssetProject,
    orphanAssetEmployeeAsset,
    orphanAssetEmployeeEmployee,
    orphanMaintenanceAsset,
  };
  if (!report.checks.referenceIntegrity.pass) {
    report.issues.push(
      `Found orphan references in assets links (projectAsset.asset=${orphanProjectAssetAsset}, projectAsset.project=${orphanProjectAssetProject}, assetEmployee.asset=${orphanAssetEmployeeAsset}, assetEmployee.employee=${orphanAssetEmployeeEmployee}, maintenance.asset=${orphanMaintenanceAsset}).`,
    );
  }

  // 2) Numeric sanity
  let negativePurchasePrice = 0;
  let invalidRowVersion = 0;
  let invalidDateOrder = 0;
  for (const a of assets) {
    if (toNum(a.purchasePrice) < 0) negativePurchasePrice++;
    if (toNum(a.rowVersion) < 1) invalidRowVersion++;
    if (a.purchaseDate && a.deletedAt && a.deletedAt < a.purchaseDate) invalidDateOrder++;
  }
  report.checks.assetFieldSanity = {
    pass:
      negativePurchasePrice === 0 &&
      invalidRowVersion === 0 &&
      invalidDateOrder === 0,
    negativePurchasePrice,
    invalidRowVersion,
    invalidDateOrder,
  };
  if (!report.checks.assetFieldSanity.pass) {
    report.issues.push(
      `Asset numeric/date sanity failed (negativePurchasePrice=${negativePurchasePrice}, invalidRowVersion=${invalidRowVersion}, invalidDateOrder=${invalidDateOrder}).`,
    );
  }

  // 3) Active ProjectAsset percentages by asset must sum to 100
  const activePaByAsset = new Map();
  for (const pa of projectAssets.filter((x) => x.isActive)) {
    const arr = activePaByAsset.get(pa.assetId) || [];
    arr.push(toNum(pa.percentage));
    activePaByAsset.set(pa.assetId, arr);
  }
  let assetsOff100 = 0;
  for (const values of activePaByAsset.values()) {
    const sum = round2(values.reduce((s, v) => s + toNum(v), 0));
    if (Math.abs(sum - 100) > 0.05) assetsOff100++;
  }
  report.checks.assetAllocationPercentages = {
    pass: true,
    assetGroupsChecked: activePaByAsset.size,
    assetsOff100,
  };
  if (assetsOff100 > 0) {
    report.warnings.push(
      `Found ${assetsOff100} asset assignment group(s) where active project percentages do not sum to 100%.`,
    );
  }

  // 4) Maintenance costs sanity
  let negativeEstimatedCost = 0;
  let negativeActualCost = 0;
  for (const m of maintenanceRequests) {
    if (toNum(m.estimatedCost) < 0) negativeEstimatedCost++;
    if (toNum(m.actualCost) < 0) negativeActualCost++;
  }
  report.checks.maintenanceCostSanity = {
    pass: negativeEstimatedCost === 0 && negativeActualCost === 0,
    negativeEstimatedCost,
    negativeActualCost,
  };
  if (!report.checks.maintenanceCostSanity.pass) {
    report.issues.push(
      `Maintenance cost sanity failed (negativeEstimatedCost=${negativeEstimatedCost}, negativeActualCost=${negativeActualCost}).`,
    );
  }

  // Warnings
  const assetsWithoutProject = assets.filter(
    (a) => !projectAssets.some((pa) => pa.assetId === a.id && pa.isActive),
  ).length;
  if (assetsWithoutProject > 0) {
    report.warnings.push(`${assetsWithoutProject} assets have no active project assignments.`);
  }

  report.summary.issuesCount = report.issues.length;
  report.summary.warningsCount = report.warnings.length;

  const outDir = path.join(process.cwd(), 'scripts', 'audit', 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'assets-module-integrity.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  const status = report.issues.length === 0 ? 'PASS' : 'FAIL';
  console.log('========================================');
  console.log(`Assets Module Integrity Audit: ${status}`);
  console.log('========================================');
  console.log(`Assets: ${report.summary.totalAssets}`);
  console.log(`ProjectAssets: ${report.summary.totalProjectAssets}`);
  console.log(`AssetEmployees: ${report.summary.totalAssetEmployees}`);
  console.log(`MaintenanceRequests: ${report.summary.totalMaintenanceRequests}`);
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
