import { BadRequestException } from '@nestjs/common';
import { EmployeeStatus } from '@prisma/client';

/**
 * Employee statuses that block ALL new payroll transactions.
 * TERMINATED employees have left the company — no new financial records.
 */
export const PAYROLL_BLOCKED_STATUSES: EmployeeStatus[] = [
  EmployeeStatus.TERMINATED,
];

/**
 * Employee statuses that additionally block new loan creation.
 * SUSPENDED employees are under investigation — loans are frozen until resolved.
 */
export const LOAN_BLOCKED_STATUSES: EmployeeStatus[] = [
  EmployeeStatus.TERMINATED,
  EmployeeStatus.SUSPENDED,
];

/**
 * Throws if the employee cannot receive any new payroll transaction
 * (allowance, deduction, salary change).
 * Call at the start of any payroll write use case.
 */
export function assertEmployeeCanReceivePayroll(employee: {
  id: string;
  employeeNumber?: string | null;
  status: EmployeeStatus;
}): void {
  if (PAYROLL_BLOCKED_STATUSES.includes(employee.status)) {
    const label = employee.employeeNumber ?? employee.id;
    throw new BadRequestException(
      `Employee "${label}" is terminated. ` +
        `No new payroll transactions can be created for a terminated employee.`,
    );
  }
}

/**
 * Throws if the employee cannot receive a new loan.
 * More restrictive than assertEmployeeCanReceivePayroll — also blocks SUSPENDED employees.
 */
export function assertEmployeeCanReceiveLoan(employee: {
  id: string;
  employeeNumber?: string | null;
  status: EmployeeStatus;
}): void {
  if (LOAN_BLOCKED_STATUSES.includes(employee.status)) {
    const label = employee.employeeNumber ?? employee.id;
    throw new BadRequestException(
      `Employee "${label}" cannot receive a new loan — status is ${employee.status}. ` +
        `Loans are only available to ACTIVE employees.`,
    );
  }
}
