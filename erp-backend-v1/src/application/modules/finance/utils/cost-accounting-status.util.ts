import { PaymentStatus, Prisma } from '@prisma/client';

/**
 * Costs in REJECTED status remain available for audit/history, but are excluded
 * from default accounting totals, profitability, and list views unless the
 * caller explicitly requests the rejected status.
 */
export const DEFAULT_ACCOUNTING_COST_STATUSES: PaymentStatus[] = [
  PaymentStatus.PENDING,
  PaymentStatus.APPROVED,
  PaymentStatus.PAID,
  PaymentStatus.PARTIALLY_PAID,
  PaymentStatus.OVERDUE,
];

export const DEFAULT_EXCLUDED_COST_STATUSES: PaymentStatus[] = [
  PaymentStatus.REJECTED,
];

export function isIncludedInDefaultCostTotals(status: PaymentStatus): boolean {
  return DEFAULT_ACCOUNTING_COST_STATUSES.includes(status);
}

export function getDefaultAccountingCostWhere(): Prisma.CostWhereInput {
  return {
    paymentStatus: {
      in: DEFAULT_ACCOUNTING_COST_STATUSES,
    },
  };
}
