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
      totalEmployees: 0,
      activeEmployees: 0,
      deletedEmployees: 0,
      totalContracts: 0,
      totalProjectAssignments: 0,
      issuesCount: 0,
      warningsCount: 0,
    },
    checks: {},
    issues: [],
    warnings: [],
  };

  const [employees, assignments] = await Promise.all([
    prisma.employee.findMany({
      select: {
        id: true,
        employeeNumber: true,
        status: true,
        departmentId: true,
        positionId: true,
        department: { select: { id: true } },
        position: { select: { id: true } },
        baseSalary: true,
        hireDate: true,
        terminationDate: true,
        rehireDate: true,
        deletedAt: true,
        version: true,
        contracts: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            isActive: true,
            baseSalary: true,
          },
        },
      },
    }),
    prisma.projectEmployee.findMany({
      where: {
        isActive: true,
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      select: {
        employeeId: true,
        percentage: true,
      },
    }),
  ]);

  report.summary.totalEmployees = employees.length;
  report.summary.activeEmployees = employees.filter((e) => e.status === 'ACTIVE').length;
  report.summary.deletedEmployees = employees.filter((e) => e.deletedAt !== null).length;
  report.summary.totalContracts = employees.reduce((s, e) => s + e.contracts.length, 0);
  report.summary.totalProjectAssignments = assignments.length;

  // 1) Broken foreign relations (department/position id points to missing row)
  let brokenDepartmentRefs = 0;
  let brokenPositionRefs = 0;
  for (const e of employees) {
    if (e.departmentId && !e.department) brokenDepartmentRefs++;
    if (e.positionId && !e.position) brokenPositionRefs++;
  }
  report.checks.referenceIntegrity = {
    pass: brokenDepartmentRefs === 0 && brokenPositionRefs === 0,
    brokenDepartmentRefs,
    brokenPositionRefs,
  };
  if (!report.checks.referenceIntegrity.pass) {
    report.issues.push(
      `Found broken references (department=${brokenDepartmentRefs}, position=${brokenPositionRefs}).`,
    );
  }

  // 2) Core field sanity
  let invalidVersion = 0;
  let negativeBaseSalary = 0;
  let invalidEmploymentDates = 0;
  for (const e of employees) {
    if (toNum(e.version) < 1) invalidVersion++;
    if (toNum(e.baseSalary) < 0) negativeBaseSalary++;
    if (e.terminationDate && e.hireDate && e.terminationDate < e.hireDate) {
      invalidEmploymentDates++;
    }
    if (e.rehireDate && e.hireDate && e.rehireDate < e.hireDate) {
      invalidEmploymentDates++;
    }
  }
  report.checks.fieldSanity = {
    pass: invalidVersion === 0 && negativeBaseSalary === 0 && invalidEmploymentDates === 0,
    invalidVersion,
    negativeBaseSalary,
    invalidEmploymentDates,
  };
  if (!report.checks.fieldSanity.pass) {
    report.issues.push(
      `Field sanity failed (invalidVersion=${invalidVersion}, negativeBaseSalary=${negativeBaseSalary}, invalidEmploymentDates=${invalidEmploymentDates}).`,
    );
  }

  // 3) Contract dates & salary sanity
  let invalidContractDates = 0;
  let negativeContractSalary = 0;
  let multipleActiveContracts = 0;
  for (const e of employees) {
    const activeContracts = e.contracts.filter((c) => c.isActive);
    if (activeContracts.length > 1) multipleActiveContracts++;
    for (const c of e.contracts) {
      if (c.endDate && c.startDate && c.endDate < c.startDate) invalidContractDates++;
      if (toNum(c.baseSalary) < 0) negativeContractSalary++;
    }
  }
  report.checks.contractIntegrity = {
    pass:
      invalidContractDates === 0 &&
      negativeContractSalary === 0 &&
      multipleActiveContracts === 0,
    invalidContractDates,
    negativeContractSalary,
    multipleActiveContracts,
  };
  if (!report.checks.contractIntegrity.pass) {
    report.issues.push(
      `Contract integrity failed (invalidContractDates=${invalidContractDates}, negativeContractSalary=${negativeContractSalary}, multipleActiveContracts=${multipleActiveContracts}).`,
    );
  }

  // 4) Active assignment percentages should sum to 100 per employee (for non-overhead records)
  const assignmentByEmployee = new Map();
  for (const a of assignments) {
    const arr = assignmentByEmployee.get(a.employeeId) || [];
    arr.push(a.percentage == null ? null : toNum(a.percentage));
    assignmentByEmployee.set(a.employeeId, arr);
  }
  let employeesOff100 = 0;
  for (const values of assignmentByEmployee.values()) {
    const nonNull = values.filter((v) => v !== null);
    if (nonNull.length === 0) continue;
    const sum = round2(nonNull.reduce((s, v) => s + toNum(v), 0));
    if (Math.abs(sum - 100) > 0.05) employeesOff100++;
  }
  report.checks.assignmentPercentages = {
    pass: employeesOff100 === 0,
    employeeGroupsChecked: assignmentByEmployee.size,
    employeesOff100,
  };
  if (employeesOff100 > 0) {
    report.issues.push(
      `Found ${employeesOff100} employee assignment group(s) where active non-null percentages do not sum to 100%.`,
    );
  }

  // Warnings (non-blocking consistency)
  const activeTerminated = employees.filter(
    (e) => e.status === 'ACTIVE' && e.terminationDate !== null,
  ).length;
  if (activeTerminated > 0) {
    report.warnings.push(
      `${activeTerminated} employees are ACTIVE while terminationDate is set.`,
    );
  }
  const deletedActive = employees.filter(
    (e) => e.deletedAt !== null && e.status === 'ACTIVE',
  ).length;
  if (deletedActive > 0) {
    report.warnings.push(
      `${deletedActive} soft-deleted employees still marked ACTIVE.`,
    );
  }

  report.summary.issuesCount = report.issues.length;
  report.summary.warningsCount = report.warnings.length;

  const outDir = path.join(process.cwd(), 'scripts', 'audit', 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'employees-module-integrity.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  const status = report.issues.length === 0 ? 'PASS' : 'FAIL';
  console.log('========================================');
  console.log(`Employees Module Integrity Audit: ${status}`);
  console.log('========================================');
  console.log(`Employees: ${report.summary.totalEmployees}`);
  console.log(`Contracts: ${report.summary.totalContracts}`);
  console.log(`Project Assignments: ${report.summary.totalProjectAssignments}`);
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
