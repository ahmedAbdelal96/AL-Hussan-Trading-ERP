/**
 * Payroll Common Components - Barrel Export
 *
 * Centralized export for all reusable payroll components.
 * Import from this file for cleaner imports.
 *
 * @example
 * import {
 *   AllowanceFrequencyBadge,
 *   LoanProgressBar
 * } from '@/features/payroll/components/common';
 */

export { AllowanceFrequencyBadge } from "./AllowanceFrequencyBadge";
export {
  AllowanceStatusBadge,
  getAllowanceStatus,
} from "./AllowanceStatusBadge";
export { LoanStatusBadge } from "./LoanStatusBadge";
export {
  DeductionTypeBadge,
  isAutoApprovedDeduction,
} from "./DeductionTypeBadge";
export { ApprovalStatusBadge, useApprovalStatus } from "./ApprovalStatusBadge";
export {
  MonthlyEquivalentDisplay,
  MonthlyEquivalentValue,
  calculateMonthlyEquivalent,
  calculateAnnualEquivalent,
} from "./MonthlyEquivalentDisplay";
export {
  LoanProgressBar,
  CompactLoanProgress,
  calculateLoanProgress,
} from "./LoanProgressBar";
export { PayrollCalculator, usePayrollCalculator } from "./PayrollCalculator";
