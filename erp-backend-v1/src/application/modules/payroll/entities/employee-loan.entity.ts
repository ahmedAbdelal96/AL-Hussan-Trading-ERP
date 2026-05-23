import { LoanStatus } from '@prisma/client';
import { UserInfo } from '../../../common/interfaces/user-info.interface';

/**
 * Employee Loan Entity
 * Represents a loan given to an employee with installment tracking
 */
export class EmployeeLoanEntity {
  id: string;
  employeeId: string;
  amount: number;
  remainingAmount: number;
  installments: number;
  paidInstallments: number;
  installmentAmount: number;
  startDate: Date;
  endDate: Date;
  status: LoanStatus;
  purpose?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  rowVersion: number;

  // Soft Delete tracking
  deletedAt?: Date;
  deletedBy?: string;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;

  // User Info (Enriched from User table)
  createdByUser?: UserInfo;
  approvedByUser?: UserInfo;
  deletedByUser?: UserInfo;

  // Relations
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    employeeNumber: string;
  };

  constructor(partial: Partial<EmployeeLoanEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if loan is pending approval
   */
  isPending(): boolean {
    return this.status === 'PENDING';
  }

  /**
   * Check if loan has been approved
   */
  isApproved(): boolean {
    return this.status === 'APPROVED';
  }

  /**
   * Check if loan has been rejected
   */
  isRejected(): boolean {
    return this.status === 'REJECTED';
  }

  /**
   * Check if loan has been fully paid off.
   * A loan is paid off when status is COMPLETED (set automatically on last installment),
   * or — for legacy records migrated before COMPLETED status existed — when
   * status is APPROVED and remainingAmount === 0.
   */
  isPaidOff(): boolean {
    return (
      this.status === LoanStatus.COMPLETED ||
      (this.status === LoanStatus.APPROVED && this.remainingAmount === 0)
    );
  }

  /**
   * Check if loan is fully completed (all installments paid, status COMPLETED)
   */
  isCompleted(): boolean {
    return this.status === LoanStatus.COMPLETED;
  }

  /**
   * Get loan repayment progress as percentage
   */
  getProgress(): number {
    if (this.installments === 0) return 0;
    return (this.paidInstallments / this.installments) * 100;
  }

  /**
   * Check if an installment can be paid
   */
  canPayInstallment(): boolean {
    return (
      this.isApproved() &&
      this.remainingAmount > 0 &&
      this.paidInstallments < this.installments
    );
  }

  /**
   * Get number of remaining installments
   */
  getRemainingInstallments(): number {
    return Math.max(0, this.installments - this.paidInstallments);
  }

  /**
   * Check if loan is complete (all installments paid)
   */
  isComplete(): boolean {
    return this.paidInstallments >= this.installments;
  }

  /**
   * Get percentage of amount paid
   */
  getAmountPaidPercentage(): number {
    if (this.amount === 0) return 0;
    const paidAmount = this.amount - this.remainingAmount;
    return (paidAmount / this.amount) * 100;
  }

  /**
   * Get total amount paid so far
   */
  getTotalPaid(): number {
    return this.amount - this.remainingAmount;
  }
}
