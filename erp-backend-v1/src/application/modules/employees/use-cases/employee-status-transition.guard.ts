import { BadRequestException } from '@nestjs/common';
import { EmployeeStatus } from '@prisma/client';

/**
 * State machine for employee status transitions.
 *
 * Design rationale:
 * - TERMINATED is a terminal state (no exits) — dismissal cannot be undone via UI.
 * - SUSPENDED can be resolved back to ACTIVE or escalated to TERMINATED.
 * - ON_LEAVE can return to ACTIVE or escalate to TERMINATED.
 * - INACTIVE is for dormant accounts — can be reactivated but cannot skip to ON_LEAVE.
 *
 * To reverse a TERMINATED status requires a separate "re-hire" workflow
 * (create a new employee record) to preserve the audit trail.
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
  [EmployeeStatus.TERMINATED]: [], // Terminal state — no exits
};

/**
 * Throws BadRequestException if the status transition is not allowed.
 * Pass the current and requested status — if they are the same, the check is skipped.
 */
export function assertEmployeeStatusTransitionIsValid(
  current: EmployeeStatus,
  next: EmployeeStatus,
): void {
  if (current === next) return; // No-op — same status, nothing to validate

  const allowed = VALID_EMPLOYEE_STATUS_TRANSITIONS[current] ?? [];

  if (!allowed.includes(next)) {
    const allowedList = allowed.length > 0 ? allowed.join(', ') : 'none';
    throw new BadRequestException(
      `Invalid employee status transition: ${current} → ${next}. ` +
        `Allowed transitions from ${current}: [${allowedList}].`,
    );
  }
}
