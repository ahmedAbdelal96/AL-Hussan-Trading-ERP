/**
 * Frontend mirror of backend cost-payment-status.guard.ts
 * Prevents UI from offering operations that the backend will reject.
 */

export const IMMUTABLE_COST_STATUSES = ["PAID"] as const;

export const DELETION_BLOCKED_COST_STATUSES = [
  "APPROVED",
  "PAID",
  "PARTIALLY_PAID",
] as const;

/** Returns true if the cost record can still be edited (not yet paid). */
export function isCostEditable(
  paymentStatus: string | undefined | null,
): boolean {
  if (!paymentStatus) return true;
  return !IMMUTABLE_COST_STATUSES.includes(
    paymentStatus as (typeof IMMUTABLE_COST_STATUSES)[number],
  );
}

/** Returns true if the cost record can be deleted. */
export function isCostDeletable(
  paymentStatus: string | undefined | null,
): boolean {
  if (!paymentStatus) return true;
  return !DELETION_BLOCKED_COST_STATUSES.includes(
    paymentStatus as (typeof DELETION_BLOCKED_COST_STATUSES)[number],
  );
}
