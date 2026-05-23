/**
 * Frontend mirror of backend employee-payroll-status.guard.ts
 * Prevents UI from offering payroll operations that the backend will reject.
 */

export const PAYROLL_BLOCKED_STATUSES = ["TERMINATED"] as const;

export const LOAN_BLOCKED_STATUSES = ["TERMINATED", "SUSPENDED"] as const;

/** Returns true if the employee can receive allowances, deductions, salary updates. */
export function canReceivePayroll(status: string | undefined | null): boolean {
  if (!status) return true;
  return !PAYROLL_BLOCKED_STATUSES.includes(
    status as (typeof PAYROLL_BLOCKED_STATUSES)[number],
  );
}

/** Returns true if the employee can receive a new loan. */
export function canReceiveLoan(status: string | undefined | null): boolean {
  if (!status) return true;
  return !LOAN_BLOCKED_STATUSES.includes(
    status as (typeof LOAN_BLOCKED_STATUSES)[number],
  );
}
