import { BadRequestException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';

/**
 * Statuses that make a cost record fully immutable.
 * Once a cost is PAID it becomes a financial record of truth — no changes allowed.
 */
export const IMMUTABLE_COST_STATUSES: PaymentStatus[] = [PaymentStatus.PAID];

/**
 * Statuses that block hard-deletion.
 * APPROVED / PAID / PARTIALLY_PAID costs must go through the rejection workflow
 * (which creates an audit trail) before they can be removed.
 */
export const DELETION_BLOCKED_COST_STATUSES: PaymentStatus[] = [
  PaymentStatus.APPROVED,
  PaymentStatus.PAID,
  PaymentStatus.PARTIALLY_PAID,
];

/**
 * Throws BadRequestException if the cost cannot be edited.
 * Call at the start of any update use case, after fetching the current record.
 */
export function assertCostIsEditable(cost: {
  id: string;
  paymentStatus: PaymentStatus;
}): void {
  if (IMMUTABLE_COST_STATUSES.includes(cost.paymentStatus)) {
    throw new BadRequestException(
      `Cost ${cost.id} cannot be modified — it has already been paid ` +
        `(status: ${cost.paymentStatus}). ` +
        `Paid records are financial facts and must not be altered.`,
    );
  }
}

/**
 * Throws BadRequestException if the cost cannot be hard-deleted.
 * Call at the start of any delete use case, after fetching the current record.
 */
export function assertCostIsDeletable(cost: {
  id: string;
  paymentStatus: PaymentStatus;
}): void {
  if (DELETION_BLOCKED_COST_STATUSES.includes(cost.paymentStatus)) {
    throw new BadRequestException(
      `Cost ${cost.id} cannot be deleted — payment status is ${cost.paymentStatus}. ` +
        `Reject or reverse the cost record through the approval workflow before deleting.`,
    );
  }
}
