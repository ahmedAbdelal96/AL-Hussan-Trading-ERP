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
      totalAllowances: 0,
      totalLoans: 0,
      totalDeductions: 0,
      totalPayslips: 0,
      issuesCount: 0,
      warningsCount: 0,
    },
    checks: {},
    issues: [],
    warnings: [],
  };

  const [employees, allowances, loans, deductions, payslips, projectAssignments] =
    await Promise.all([
      prisma.employee.findMany({
        select: { id: true, status: true, baseSalary: true },
      }),
      prisma.employeeAllowance.findMany({
        select: {
          id: true,
          employeeId: true,
          amount: true,
          status: true,
          effectiveFrom: true,
          effectiveTo: true,
        },
      }),
      prisma.employeeLoan.findMany({
        select: {
          id: true,
          employeeId: true,
          amount: true,
          remainingAmount: true,
          installmentAmount: true,
          paidInstallments: true,
          status: true,
          startDate: true,
          endDate: true,
        },
      }),
      prisma.employeeDeduction.findMany({
        select: {
          id: true,
          employeeId: true,
          amount: true,
          deductionType: true,
          status: true,
          deductionDate: true,
          loanId: true,
        },
      }),
      prisma.payslip.findMany({
        select: {
          id: true,
          employeeId: true,
          payPeriodMonth: true,
          payPeriodYear: true,
          baseSalary: true,
          totalAllowances: true,
          totalDeductions: true,
          netSalary: true,
        },
      }),
      prisma.projectEmployee.findMany({
        where: {
          isActive: true,
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        select: { employeeId: true, percentage: true },
      }),
    ]);

  report.summary.totalEmployees = employees.length;
  report.summary.totalAllowances = allowances.length;
  report.summary.totalLoans = loans.length;
  report.summary.totalDeductions = deductions.length;
  report.summary.totalPayslips = payslips.length;

  const employeeIds = new Set(employees.map((e) => e.id));
  const loanIds = new Set(loans.map((l) => l.id));
  const loanById = new Map(loans.map((l) => [l.id, l]));

  // Check 1: payroll records reference valid employees
  let orphanAllowances = 0;
  let orphanLoans = 0;
  let orphanDeductions = 0;
  let orphanPayslips = 0;

  for (const row of allowances) if (!employeeIds.has(row.employeeId)) orphanAllowances++;
  for (const row of loans) if (!employeeIds.has(row.employeeId)) orphanLoans++;
  for (const row of deductions) if (!employeeIds.has(row.employeeId)) orphanDeductions++;
  for (const row of payslips) if (!employeeIds.has(row.employeeId)) orphanPayslips++;

  report.checks.referenceIntegrity = {
    pass: orphanAllowances === 0 && orphanLoans === 0 && orphanDeductions === 0 && orphanPayslips === 0,
    orphanAllowances,
    orphanLoans,
    orphanDeductions,
    orphanPayslips,
  };
  if (!report.checks.referenceIntegrity.pass) {
    report.issues.push(
      `Found orphan payroll references (allowances=${orphanAllowances}, loans=${orphanLoans}, deductions=${orphanDeductions}, payslips=${orphanPayslips}).`,
    );
  }

  // Check 2: numeric sanity (no negative money + payslip equation)
  let negativeAllowanceAmounts = 0;
  let negativeLoanAmounts = 0;
  let negativeDeductionAmounts = 0;
  let invalidPayslipEquation = 0;

  for (const row of allowances) {
    if (toNum(row.amount) < 0) negativeAllowanceAmounts++;
    if (row.effectiveTo && row.effectiveFrom && row.effectiveTo < row.effectiveFrom) {
      report.issues.push(`Allowance ${row.id} has effectiveTo earlier than effectiveFrom.`);
    }
  }

  for (const row of loans) {
    if (toNum(row.amount) < 0 || toNum(row.remainingAmount) < 0 || toNum(row.installmentAmount) < 0) {
      negativeLoanAmounts++;
    }
  }

  for (const row of deductions) {
    if (toNum(row.amount) < 0) negativeDeductionAmounts++;
  }

  for (const row of payslips) {
    const expected = round2(toNum(row.baseSalary) + toNum(row.totalAllowances) - toNum(row.totalDeductions));
    const actual = round2(toNum(row.netSalary));
    if (Math.abs(expected - actual) > 0.05) invalidPayslipEquation++;
  }

  report.checks.numericSanity = {
    pass:
      negativeAllowanceAmounts === 0 &&
      negativeLoanAmounts === 0 &&
      negativeDeductionAmounts === 0 &&
      invalidPayslipEquation === 0,
    negativeAllowanceAmounts,
    negativeLoanAmounts,
    negativeDeductionAmounts,
    invalidPayslipEquation,
  };
  if (!report.checks.numericSanity.pass) {
    report.issues.push(
      `Numeric sanity failed (negativeAllowanceAmounts=${negativeAllowanceAmounts}, negativeLoanAmounts=${negativeLoanAmounts}, negativeDeductionAmounts=${negativeDeductionAmounts}, invalidPayslipEquation=${invalidPayslipEquation}).`,
    );
  }

  // Check 3: loan consistency and loan-repayment integrity
  let invalidLoanRemaining = 0;
  let invalidLoanDateRange = 0;
  let orphanLoanRepaymentRefs = 0;
  let mismatchedLoanRepaymentEmployee = 0;

  for (const row of loans) {
    const amount = toNum(row.amount);
    const remaining = toNum(row.remainingAmount);
    if (remaining > amount + 0.05) invalidLoanRemaining++;
    if (row.endDate && row.startDate && row.endDate < row.startDate) invalidLoanDateRange++;
  }

  for (const row of deductions.filter((d) => d.deductionType === 'LOAN_REPAYMENT')) {
    if (!row.loanId || !loanIds.has(row.loanId)) {
      orphanLoanRepaymentRefs++;
      continue;
    }
    const loan = loanById.get(row.loanId);
    if (loan && loan.employeeId !== row.employeeId) mismatchedLoanRepaymentEmployee++;
  }

  report.checks.loanIntegrity = {
    pass:
      invalidLoanRemaining === 0 &&
      invalidLoanDateRange === 0 &&
      orphanLoanRepaymentRefs === 0 &&
      mismatchedLoanRepaymentEmployee === 0,
    invalidLoanRemaining,
    invalidLoanDateRange,
    orphanLoanRepaymentRefs,
    mismatchedLoanRepaymentEmployee,
  };
  if (!report.checks.loanIntegrity.pass) {
    report.issues.push(
      `Loan integrity failed (invalidLoanRemaining=${invalidLoanRemaining}, invalidLoanDateRange=${invalidLoanDateRange}, orphanLoanRepaymentRefs=${orphanLoanRepaymentRefs}, mismatchedLoanRepaymentEmployee=${mismatchedLoanRepaymentEmployee}).`,
    );
  }

  // Check 4: duplicate payslips per employee/month/year
  const payslipKeyCount = new Map();
  for (const row of payslips) {
    const key = `${row.employeeId}|${row.payPeriodYear}|${row.payPeriodMonth}`;
    payslipKeyCount.set(key, (payslipKeyCount.get(key) || 0) + 1);
  }
  const duplicatePayslipKeys = Array.from(payslipKeyCount.values()).filter((x) => x > 1).length;
  report.checks.payslipUniqueness = {
    pass: duplicatePayslipKeys === 0,
    duplicatePayslipKeys,
  };
  if (duplicatePayslipKeys > 0) {
    report.issues.push(`Found ${duplicatePayslipKeys} duplicate payslip key(s) by employee+period.`);
  }

  // Check 5: active project assignment percentages should sum to 100 per employee
  const assignmentByEmployee = new Map();
  for (const row of projectAssignments) {
    const arr = assignmentByEmployee.get(row.employeeId) || [];
    arr.push(row.percentage == null ? null : toNum(row.percentage));
    assignmentByEmployee.set(row.employeeId, arr);
  }
  let employeesOff100 = 0;
  let allNullPercentageGroups = 0;
  for (const values of assignmentByEmployee.values()) {
    const numericValues = values.filter((v) => v != null);
    if (numericValues.length === 0) {
      allNullPercentageGroups++;
      continue;
    }
    const sum = round2(numericValues.reduce((s, v) => s + toNum(v), 0));
    if (Math.abs(sum - 100) > 0.05) employeesOff100++;
  }
  report.checks.projectAllocationPercentages = {
    pass: employeesOff100 === 0,
    employeeGroupsChecked: assignmentByEmployee.size,
    employeesOff100,
    allNullPercentageGroups,
  };
  if (employeesOff100 > 0) {
    report.issues.push(`Found ${employeesOff100} employee assignment group(s) where active project percentages do not sum to 100%.`);
  }
  if (allNullPercentageGroups > 0) {
    report.warnings.push(
      `Found ${allNullPercentageGroups} active assignment group(s) with only null percentages (treated as overhead / non-allocated payroll cost).`,
    );
  }

  // Warnings (non-blocking): active employees without payroll records
  const activeEmployeeIds = employees
    .filter((e) => e.status === 'ACTIVE')
    .map((e) => e.id);
  const activeSet = new Set(activeEmployeeIds);
  const allowanceEmp = new Set(allowances.map((r) => r.employeeId).filter((id) => activeSet.has(id)));
  const deductionEmp = new Set(deductions.map((r) => r.employeeId).filter((id) => activeSet.has(id)));
  const loanEmp = new Set(loans.map((r) => r.employeeId).filter((id) => activeSet.has(id)));

  const noAllowance = activeEmployeeIds.filter((id) => !allowanceEmp.has(id)).length;
  const noDeduction = activeEmployeeIds.filter((id) => !deductionEmp.has(id)).length;
  if (noAllowance > 0) {
    report.warnings.push(`${noAllowance} active employees have no allowance records.`);
  }
  if (noDeduction > 0) {
    report.warnings.push(`${noDeduction} active employees have no deduction records.`);
  }
  if (loanEmp.size === 0) {
    report.warnings.push('No active employees currently have loans.');
  }

  report.summary.issuesCount = report.issues.length;
  report.summary.warningsCount = report.warnings.length;

  const outDir = path.join(process.cwd(), 'scripts', 'audit', 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'payroll-module-integrity.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  const status = report.issues.length === 0 ? 'PASS' : 'FAIL';
  console.log('========================================');
  console.log(`Payroll Module Integrity Audit: ${status}`);
  console.log('========================================');
  console.log(`Employees: ${report.summary.totalEmployees}`);
  console.log(`Allowances: ${report.summary.totalAllowances}`);
  console.log(`Loans: ${report.summary.totalLoans}`);
  console.log(`Deductions: ${report.summary.totalDeductions}`);
  console.log(`Payslips: ${report.summary.totalPayslips}`);
  console.log(`Issues: ${report.summary.issuesCount}`);
  console.log(`Warnings: ${report.summary.warningsCount}`);
  if (report.issues.length > 0) {
    console.log('\nIssues:');
    report.issues.forEach((item, idx) => console.log(`${idx + 1}. ${item}`));
  }
  if (report.warnings.length > 0) {
    console.log('\nWarnings:');
    report.warnings.forEach((item, idx) => console.log(`${idx + 1}. ${item}`));
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
