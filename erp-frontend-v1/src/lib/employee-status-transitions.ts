import { EmployeeStatus } from "@/types/employees.types";

/**
 * Mirrors the backend employee-status-transition.guard.ts exactly.
 * Single source of truth for the frontend — any change here must match the backend.
 */
export const VALID_EMPLOYEE_STATUS_TRANSITIONS: Record<
  EmployeeStatus,
  EmployeeStatus[]
> = {
  [EmployeeStatus.ACTIVE]: [
    EmployeeStatus.INACTIVE,
    EmployeeStatus.ON_LEAVE,
    EmployeeStatus.SUSPENDED,
    EmployeeStatus.TERMINATED,
  ],
  [EmployeeStatus.INACTIVE]: [EmployeeStatus.ACTIVE],
  [EmployeeStatus.ON_LEAVE]: [EmployeeStatus.ACTIVE, EmployeeStatus.TERMINATED],
  [EmployeeStatus.SUSPENDED]: [
    EmployeeStatus.ACTIVE,
    EmployeeStatus.TERMINATED,
  ],
  [EmployeeStatus.TERMINATED]: [], // Terminal state — no transitions allowed
};

/**
 * Returns the list of statuses the employee can transition to from their current status.
 * Returns empty array for TERMINATED (no exits).
 */
export function getAllowedTransitions(
  currentStatus: EmployeeStatus,
): EmployeeStatus[] {
  return VALID_EMPLOYEE_STATUS_TRANSITIONS[currentStatus] ?? [];
}

/**
 * Returns true if the employee's status is a terminal state (no further changes allowed).
 */
export function isTerminalStatus(status: EmployeeStatus): boolean {
  return getAllowedTransitions(status).length === 0;
}
