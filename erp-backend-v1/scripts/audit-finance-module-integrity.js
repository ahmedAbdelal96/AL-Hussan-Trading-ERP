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

function round2(v) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

async function main() {
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalCosts: 0,
      totalAllocations: 0,
      totalCategories: 0,
      issuesCount: 0,
      warningsCount: 0,
    },
    checks: {},
    issues: [],
    warnings: [],
  };

  const [costs, allocations, categories, projects, payslips, maintenanceRequests] =
    await Promise.all([
      prisma.cost.findMany({
        select: {
          id: true,
          projectId: true,
          isAllocated: true,
          amount: true,
          paymentStatus: true,
          referenceType: true,
          referenceId: true,
          rowVersion: true,
        },
      }),
      prisma.costAllocation.findMany({
        select: {
          id: true,
          costId: true,
          projectId: true,
          allocatedAmount: true,
          percentage: true,
        },
      }),
      prisma.costCategory.findMany({
        select: { id: true, parentId: true, rowVersion: true },
      }),
      prisma.project.findMany({ select: { id: true } }),
      prisma.payslip.findMany({ select: { id: true } }),
      prisma.maintenanceRequest.findMany({ select: { id: true } }),
    ]);

  report.summary.totalCosts = costs.length;
  report.summary.totalAllocations = allocations.length;
  report.summary.totalCategories = categories.length;

  const allocByCost = new Map();
  for (const a of allocations) {
    const arr = allocByCost.get(a.costId) || [];
    arr.push(a);
    allocByCost.set(a.costId, arr);
  }

  // Check 1: cost shape consistency
  let badAllocatedShape = 0;
  let badDirectShape = 0;
  for (const c of costs) {
    const rows = allocByCost.get(c.id) || [];
    if (c.isAllocated) {
      if (c.projectId !== null || rows.length === 0) badAllocatedShape++;
    } else {
      if (rows.length > 0) badDirectShape++;
    }
  }
  report.checks.costShape = {
    pass: badAllocatedShape === 0 && badDirectShape === 0,
    badAllocatedShape,
    badDirectShape,
  };
  if (badAllocatedShape > 0) {
    report.issues.push(
      `Found ${badAllocatedShape} allocated costs with invalid shape (projectId must be null and allocations must exist).`,
    );
  }
  if (badDirectShape > 0) {
    report.issues.push(
      `Found ${badDirectShape} direct costs that still have allocations (double-count risk).`,
    );
  }

  // Check 2: allocation sum and percentage sanity
  let badAmountSums = 0;
  let badPercentageSums = 0;
  let badAllocationValues = 0;
  for (const c of costs.filter((x) => x.isAllocated)) {
    const rows = allocByCost.get(c.id) || [];
    const amountSum = round2(rows.reduce((s, r) => s + toNum(r.allocatedAmount), 0));
    const percentageSum = round2(rows.reduce((s, r) => s + toNum(r.percentage), 0));
    const amount = round2(toNum(c.amount));
    if (Math.abs(amountSum - amount) > 0.05) badAmountSums++;
    if (Math.abs(percentageSum - 100) > 0.05) badPercentageSums++;
    if (rows.some((r) => toNum(r.allocatedAmount) <= 0 || toNum(r.percentage) <= 0))
      badAllocationValues++;
  }
  report.checks.allocationConsistency = {
    pass:
      badAmountSums === 0 && badPercentageSums === 0 && badAllocationValues === 0,
    badAmountSums,
    badPercentageSums,
    badAllocationValues,
  };
  if (badAmountSums > 0) {
    report.issues.push(
      `Found ${badAmountSums} allocated costs where sum(allocatedAmount) != cost.amount.`,
    );
  }
  if (badPercentageSums > 0) {
    report.issues.push(
      `Found ${badPercentageSums} allocated costs where sum(percentage) != 100.`,
    );
  }
  if (badAllocationValues > 0) {
    report.issues.push(
      `Found ${badAllocationValues} allocated costs with non-positive allocation amounts/percentages.`,
    );
  }

  // Check 3: references consistency for payroll/maintenance links
  const payslipIds = new Set(payslips.map((x) => x.id));
  const maintenanceIds = new Set(maintenanceRequests.map((x) => x.id));
  let orphanPayslipRefs = 0;
  let orphanMaintenanceRefs = 0;
  for (const c of costs) {
    if (c.referenceType === 'Payslip') {
      if (!c.referenceId || !payslipIds.has(c.referenceId)) orphanPayslipRefs++;
    }
    if (c.referenceType === 'maintenance_request') {
      if (!c.referenceId || !maintenanceIds.has(c.referenceId))
        orphanMaintenanceRefs++;
    }
  }
  report.checks.references = {
    pass: orphanPayslipRefs === 0 && orphanMaintenanceRefs === 0,
    orphanPayslipRefs,
    orphanMaintenanceRefs,
  };
  if (orphanPayslipRefs > 0) {
    report.issues.push(
      `Found ${orphanPayslipRefs} costs referencing missing payslips.`,
    );
  }
  if (orphanMaintenanceRefs > 0) {
    report.issues.push(
      `Found ${orphanMaintenanceRefs} costs referencing missing maintenance requests.`,
    );
  }

  // Check 4: relational existence and rowVersion sanity
  const projectIds = new Set(projects.map((p) => p.id));
  let missingProjectsInCosts = 0;
  let missingProjectsInAllocations = 0;
  let invalidRowVersions = 0;
  for (const c of costs) {
    if (c.projectId && !projectIds.has(c.projectId)) missingProjectsInCosts++;
    if (toNum(c.rowVersion) < 1) invalidRowVersions++;
  }
  for (const a of allocations) {
    if (!projectIds.has(a.projectId)) missingProjectsInAllocations++;
  }
  for (const cat of categories) {
    if (toNum(cat.rowVersion) < 1) invalidRowVersions++;
  }
  report.checks.relationsAndVersion = {
    pass:
      missingProjectsInCosts === 0 &&
      missingProjectsInAllocations === 0 &&
      invalidRowVersions === 0,
    missingProjectsInCosts,
    missingProjectsInAllocations,
    invalidRowVersions,
  };
  if (missingProjectsInCosts > 0 || missingProjectsInAllocations > 0) {
    report.issues.push(
      `Found invalid project links (cost.projectId: ${missingProjectsInCosts}, costAllocation.projectId: ${missingProjectsInAllocations}).`,
    );
  }
  if (invalidRowVersions > 0) {
    report.issues.push(`Found ${invalidRowVersions} records with rowVersion < 1.`);
  }

  report.summary.issuesCount = report.issues.length;
  report.summary.warningsCount = report.warnings.length;

  const fs = require('fs');
  const path = require('path');
  const outDir = path.join(process.cwd(), 'scripts', 'audit', 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'finance-module-integrity.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  const status = report.issues.length === 0 ? 'PASS' : 'FAIL';
  console.log('========================================');
  console.log(`Finance Module Integrity Audit: ${status}`);
  console.log('========================================');
  console.log(`Costs: ${report.summary.totalCosts}`);
  console.log(`Allocations: ${report.summary.totalAllocations}`);
  console.log(`Categories: ${report.summary.totalCategories}`);
  console.log(`Issues: ${report.summary.issuesCount}`);
  console.log(`Warnings: ${report.summary.warningsCount}`);
  if (report.issues.length > 0) {
    console.log('\nIssues:');
    report.issues.forEach((i, idx) => console.log(`${idx + 1}. ${i}`));
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

