/* eslint-disable no-console */
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required.');
}

const shouldApply = process.argv.includes('--apply');
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const report = {
    generatedAt: new Date().toISOString(),
    mode: shouldApply ? 'apply' : 'dry-run',
    payroll: {
      orphanAllowances: { found: 0, ids: [], deleted: 0 },
      orphanLoans: { found: 0, ids: [], deleted: 0 },
      orphanDeductions: { found: 0, ids: [], deleted: 0 },
    },
    maintenance: {
      completedWithoutCompletedAt: { found: 0, ids: [], updated: 0 },
    },
  };

  const [employees, allowances, loans, deductions, completedWithoutCompletedAt] =
    await Promise.all([
      prisma.employee.findMany({ select: { id: true } }),
      prisma.employeeAllowance.findMany({
        select: { id: true, employeeId: true },
      }),
      prisma.employeeLoan.findMany({ select: { id: true, employeeId: true } }),
      prisma.employeeDeduction.findMany({
        select: { id: true, employeeId: true },
      }),
      prisma.maintenanceRequest.findMany({
        where: { status: 'COMPLETED', completedAt: null },
        select: { id: true },
      }),
    ]);

  const employeeIds = new Set(employees.map((x) => x.id));

  const orphanAllowanceIds = allowances
    .filter((x) => !employeeIds.has(x.employeeId))
    .map((x) => x.id);
  const orphanLoanIds = loans
    .filter((x) => !employeeIds.has(x.employeeId))
    .map((x) => x.id);
  const orphanDeductionIds = deductions
    .filter((x) => !employeeIds.has(x.employeeId))
    .map((x) => x.id);
  const completedMissingIds = completedWithoutCompletedAt.map((x) => x.id);

  report.payroll.orphanAllowances.found = orphanAllowanceIds.length;
  report.payroll.orphanAllowances.ids = orphanAllowanceIds;
  report.payroll.orphanLoans.found = orphanLoanIds.length;
  report.payroll.orphanLoans.ids = orphanLoanIds;
  report.payroll.orphanDeductions.found = orphanDeductionIds.length;
  report.payroll.orphanDeductions.ids = orphanDeductionIds;
  report.maintenance.completedWithoutCompletedAt.found = completedMissingIds.length;
  report.maintenance.completedWithoutCompletedAt.ids = completedMissingIds;

  if (shouldApply) {
    await prisma.$transaction(async (tx) => {
      if (orphanAllowanceIds.length > 0) {
        const res = await tx.employeeAllowance.deleteMany({
          where: { id: { in: orphanAllowanceIds } },
        });
        report.payroll.orphanAllowances.deleted = res.count;
      }

      if (orphanLoanIds.length > 0) {
        const res = await tx.employeeLoan.deleteMany({
          where: { id: { in: orphanLoanIds } },
        });
        report.payroll.orphanLoans.deleted = res.count;
      }

      if (orphanDeductionIds.length > 0) {
        const res = await tx.employeeDeduction.deleteMany({
          where: { id: { in: orphanDeductionIds } },
        });
        report.payroll.orphanDeductions.deleted = res.count;
      }

      if (completedMissingIds.length > 0) {
        const now = new Date();
        const res = await tx.maintenanceRequest.updateMany({
          where: { id: { in: completedMissingIds }, completedAt: null },
          data: { completedAt: now },
        });
        report.maintenance.completedWithoutCompletedAt.updated = res.count;
      }
    });
  }

  const outDir = path.join(process.cwd(), 'scripts', 'audit', 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'fix-payroll-maintenance-integrity.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log('========================================');
  console.log(`Fix Payroll/Maintenance Integrity (${report.mode})`);
  console.log('========================================');
  console.log(
    `orphanAllowances=${report.payroll.orphanAllowances.found}, deleted=${report.payroll.orphanAllowances.deleted}`,
  );
  console.log(
    `orphanLoans=${report.payroll.orphanLoans.found}, deleted=${report.payroll.orphanLoans.deleted}`,
  );
  console.log(
    `orphanDeductions=${report.payroll.orphanDeductions.found}, deleted=${report.payroll.orphanDeductions.deleted}`,
  );
  console.log(
    `completedWithoutCompletedAt=${report.maintenance.completedWithoutCompletedAt.found}, updated=${report.maintenance.completedWithoutCompletedAt.updated}`,
  );
  console.log(`Report saved to: ${outFile}`);
}

main()
  .catch((error) => {
    console.error('Fix script failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
