# Payroll Loans UAT Report (3 Employees / 3 Loans)

Date: 2026-03-11
Environment: local (http://localhost:9000)

## Scenario Setup
- Employees used:
  - EMP-00003 (base salary 14,000)
  - EMP-00002 (base salary 2,000)
  - EMP-00001 (base salary 0)
- Loans created and approved:
  - Loan A: 12,000 / 12 installments (1,000)
  - Loan B: 6,000 / 6 installments (1,000)
  - Loan C: 24,000 / 12 installments (2,000)

## Step 1: Manual repayment for March 2026
- All 3 loans received one manual repayment on 2026-03-31.
- Result: paidInstallments incremented to 1 for each loan.

## Step 2: Duplicate repayment attempt (same month)
- Attempted second repayment in March for Loan A.
- Expected: reject.
- Actual: rejected with 400 (monthly duplicate rule enforced).

## Step 3: Accelerated repayment for next month
- Attempted repayment dated 2026-04-01 for Loan A.
- Expected: allow (different month).
- Actual after fix: allowed.
- Loan A became paidInstallments=2, remainingAmount=10,000.

## Step 4: Payroll process validation

### April 2026 process
- Processed 3 employees: successful=2, failed=1.
- Failure reason (EMP-00001): base salary not configured.
- Loan deductions in payslips:
  - EMP-00003: 1,000
  - EMP-00002: 1,000
- No duplicate April deduction row for Loan A (already manually paid in April).

### May 2026 process
- Processed 3 employees: successful=2, failed=1.
- Created loan repayment deduction rows with source `PAYROLL_PROCESS`:
  - Loan A: 1,000 on 2026-05-31
  - Loan B: 1,000 on 2026-05-31
- Loan C not auto-repaid because employee payroll failed (base salary = 0).

## Accounting Checks Summary
- Monthly duplicate prevention: PASS
- Accelerated next-month repayment: PASS
- Source of truth tagging (`MANUAL` vs `PAYROLL_PROCESS`): PASS
- Payroll month/date consistency for deductions: PASS after UTC date-range fix
- Validation guard for incomplete employee payroll setup: PASS (expected failure surfaced clearly)

## Code Fixes Applied for this UAT
1) UTC month boundaries in loan installment monthly-duplicate check:
- src/application/modules/payroll/repositories/employee-loan.repository.ts

2) UTC month boundaries in payroll monthly deductions fetch:
- src/application/modules/payroll/use-cases/payroll-calculator.service.ts

## Test Commands Executed
- npm run test -- src/application/modules/payroll/use-cases/pay-loan-installment.use-case.spec.ts --runInBand
- npm run test -- src/application/modules/payroll/use-cases/payroll-calculator.service.spec.ts --runInBand

Both passed.
