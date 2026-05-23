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
      totalProjects: 0,
      totalCosts: 0,
      totalCostAllocations: 0,
      totalPayslipCosts: 0,
      totalMaintenanceCosts: 0,
      issuesCount: 0,
      warningsCount: 0,
    },
    checks: {},
    issues: [],
    warnings: [],
  };

  const [
    projectsCount,
    costs,
    costAllocations,
    payslipCosts,
    maintenanceCosts,
    payslips,
    maintenanceRequests,
  ] = await Promise.all([
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.cost.findMany({
      select: {
        id: true,
        projectId: true,
        isAllocated: true,
        costType: true,
        referenceType: true,
        referenceId: true,
        amount: true,
      },
    }),
    prisma.costAllocation.findMany({
      select: {
        id: true,
        costId: true,
        projectId: true,
        allocatedAmount: true,
      },
    }),
    prisma.cost.findMany({
      where: { referenceType: 'Payslip' },
      select: {
        id: true,
        projectId: true,
        isAllocated: true,
        referenceId: true,
        amount: true,
      },
    }),
    prisma.cost.findMany({
      where: { referenceType: 'maintenance_request' },
      select: {
        id: true,
        projectId: true,
        isAllocated: true,
        referenceId: true,
        amount: true,
      },
    }),
    prisma.payslip.findMany({
      select: { id: true, employeeId: true, grossSalary: true },
    }),
    prisma.maintenanceRequest.findMany({
      select: { id: true, actualCost: true, status: true },
    }),
  ]);

  report.summary.totalProjects = projectsCount;
  report.summary.totalCosts = costs.length;
  report.summary.totalCostAllocations = costAllocations.length;
  report.summary.totalPayslipCosts = payslipCosts.length;
  report.summary.totalMaintenanceCosts = maintenanceCosts.length;

  const allocByCost = new Map();
  for (const row of costAllocations) {
    const arr = allocByCost.get(row.costId) || [];
    arr.push(row);
    allocByCost.set(row.costId, arr);
  }

  // Check 1: structure consistency for allocated vs direct costs
  let badAllocatedShape = 0;
  let badDirectShape = 0;
  for (const c of costs) {
    const allocs = allocByCost.get(c.id) || [];
    if (c.isAllocated) {
      if (c.projectId !== null || allocs.length === 0) badAllocatedShape++;
    } else {
      if (allocs.length > 0) badDirectShape++;
    }
  }

  report.checks.costShape = {
    pass: badAllocatedShape === 0 && badDirectShape === 0,
    badAllocatedShape,
    badDirectShape,
  };
  if (badAllocatedShape > 0) {
    report.issues.push(
      `Found ${badAllocatedShape} allocated cost rows with invalid shape (projectId must be null and allocations must exist).`,
    );
  }
  if (badDirectShape > 0) {
    report.issues.push(
      `Found ${badDirectShape} direct cost rows still carrying allocations (legacy double-count risk).`,
    );
  }

  // Check 2: payslip linkage and split consistency
  const payslipIds = new Set(payslips.map((p) => p.id));
  let orphanPayslipRefs = 0;
  let invalidPayslipAllocationPattern = 0;
  for (const c of payslipCosts) {
    if (!c.referenceId || !payslipIds.has(c.referenceId)) orphanPayslipRefs++;
    const allocs = allocByCost.get(c.id) || [];
    if (!c.isAllocated && allocs.length > 0) invalidPayslipAllocationPattern++;
    if (c.isAllocated && allocs.length === 0) invalidPayslipAllocationPattern++;
  }

  report.checks.payslipCostLinkage = {
    pass: orphanPayslipRefs === 0 && invalidPayslipAllocationPattern === 0,
    orphanPayslipRefs,
    invalidPayslipAllocationPattern,
  };
  if (orphanPayslipRefs > 0) {
    report.issues.push(
      `Found ${orphanPayslipRefs} payslip-linked costs with missing/invalid payslip reference.`,
    );
  }
  if (invalidPayslipAllocationPattern > 0) {
    report.issues.push(
      `Found ${invalidPayslipAllocationPattern} payslip costs with wrong allocation pattern (single vs multi project mismatch).`,
    );
  }

  // Check 3: maintenance linkage and split consistency
  const maintenanceIds = new Set(maintenanceRequests.map((m) => m.id));
  let orphanMaintenanceRefs = 0;
  let invalidMaintenanceAllocationPattern = 0;
  for (const c of maintenanceCosts) {
    if (!c.referenceId || !maintenanceIds.has(c.referenceId)) orphanMaintenanceRefs++;
    const allocs = allocByCost.get(c.id) || [];
    if (!c.isAllocated && allocs.length > 0) invalidMaintenanceAllocationPattern++;
    if (c.isAllocated && allocs.length === 0) invalidMaintenanceAllocationPattern++;
  }

  report.checks.maintenanceCostLinkage = {
    pass:
      orphanMaintenanceRefs === 0 &&
      invalidMaintenanceAllocationPattern === 0,
    orphanMaintenanceRefs,
    invalidMaintenanceAllocationPattern,
  };
  if (orphanMaintenanceRefs > 0) {
    report.issues.push(
      `Found ${orphanMaintenanceRefs} maintenance-linked costs with missing/invalid maintenance reference.`,
    );
  }
  if (invalidMaintenanceAllocationPattern > 0) {
    report.issues.push(
      `Found ${invalidMaintenanceAllocationPattern} maintenance costs with wrong allocation pattern (single vs multi project mismatch).`,
    );
  }

  // Check 4: allocation sum sanity per allocated cost
  let badAllocationSum = 0;
  for (const c of costs.filter((x) => x.isAllocated)) {
    const allocs = allocByCost.get(c.id) || [];
    const sum = round2(allocs.reduce((s, a) => s + toNum(a.allocatedAmount), 0));
    const amt = round2(toNum(c.amount));
    if (Math.abs(sum - amt) > 0.05) badAllocationSum++;
  }
  report.checks.allocationSum = {
    pass: badAllocationSum === 0,
    badAllocationSum,
  };
  if (badAllocationSum > 0) {
    report.issues.push(
      `Found ${badAllocationSum} allocated costs where sum(allocations) != cost.amount.`,
    );
  }

  // Check 5: sample project totals using new rule (direct + true allocated only)
  const sampleProjectIds = (
    await prisma.project.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
    })
  ).map((p) => p.id);

  const projectTotals = [];
  for (const pid of sampleProjectIds) {
    const [directAgg, allocRows] = await Promise.all([
      prisma.cost.aggregate({
        where: { projectId: pid },
        _sum: { amount: true },
      }),
      prisma.costAllocation.findMany({
        where: {
          projectId: pid,
          cost: { projectId: null, isAllocated: true },
        },
        select: { allocatedAmount: true },
      }),
    ]);

    const direct = toNum(directAgg._sum.amount);
    const allocated = round2(
      allocRows.reduce((s, r) => s + toNum(r.allocatedAmount), 0),
    );
    projectTotals.push({
      projectId: pid,
      direct: round2(direct),
      allocated: round2(allocated),
      total: round2(direct + allocated),
    });
  }

  report.checks.sampleProjectTotals = {
    pass: true,
    sample: projectTotals,
  };

  // Warning checks for business data quality (not structural errors)
  const activeProjects = await prisma.project.findMany({
    where: { deletedAt: null, status: { in: ['ACTIVE', 'PLANNING', 'ON_HOLD'] } },
    select: {
      id: true,
      name: true,
      _count: { select: { employees: { where: { isActive: true } }, assets: { where: { isActive: true } } } },
    },
    take: 20,
  });

  const potentiallyUnlinked = activeProjects.filter(
    (p) => p._count.employees === 0 || p._count.assets === 0,
  );

  if (potentiallyUnlinked.length > 0) {
    report.warnings.push(
      `${potentiallyUnlinked.length} active/planning/on-hold projects have weak operational links (0 active employees or 0 active assets).`,
    );
  }

  report.summary.issuesCount = report.issues.length;
  report.summary.warningsCount = report.warnings.length;

  const fs = require('fs');
  const path = require('path');
  const outDir = path.join(process.cwd(), 'scripts', 'audit', 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'project-module-integrity.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  const status = report.issues.length === 0 ? 'PASS' : 'FAIL';
  console.log('========================================');
  console.log(`Project Module Integrity Audit: ${status}`);
  console.log('========================================');
  console.log(`Projects: ${report.summary.totalProjects}`);
  console.log(`Costs: ${report.summary.totalCosts}`);
  console.log(`CostAllocations: ${report.summary.totalCostAllocations}`);
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
