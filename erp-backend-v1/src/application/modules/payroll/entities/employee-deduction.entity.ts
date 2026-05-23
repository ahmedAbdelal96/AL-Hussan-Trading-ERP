import {
  DeductionType,
  DeductionStatus,
  LoanRepaymentSource,
} from '@prisma/client';
import { EmployeeLoanEntity } from './employee-loan.entity';
import { UserInfo } from '../../../common/interfaces/user-info.interface';

/**
 * Employee Deduction Entity
 * Represents a deduction from employee salary
 * Can be for various reasons: loan repayment, tax, penalty, etc.
 */
export class EmployeeDeductionEntity {
  id: string;
  employeeId: string;
  deductionType: DeductionType;
  amount: number;
  deductionDate: Date;
  loanId?: string;
  repaymentSource?: LoanRepaymentSource;
  reason?: string;
  notes?: string;

  status: DeductionStatus;
  rowVersion: number;

  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectedReason?: string;

  // Soft Delete tracking
  deletedAt?: Date;
  deletedBy?: string;

  createdAt: Date;
  createdBy: string;

  // User Info (Enriched from User table)
  createdByUser?: UserInfo;
  approvedByUser?: UserInfo;
  rejectedByUser?: UserInfo;
  deletedByUser?: UserInfo;

  // Relations
  loan?: EmployeeLoanEntity;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    employeeNumber: string;
  };

  constructor(partial: Partial<EmployeeDeductionEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if deduction is a loan repayment
   */
  isLoanRepayment(): boolean {
    return this.deductionType === 'LOAN_REPAYMENT';
  }

  /**
   * Check if deduction requires approval
   */
  requiresApproval(): boolean {
    // Loan repayments don't require separate approval (loan approval is enough)
    // Tax and insurance are automatic
    // Penalties, advances, and other deductions require approval
    return (
      this.deductionType === 'PENALTY' ||
      this.deductionType === 'ADVANCE_DEDUCTION' ||
      this.deductionType === 'ABSENCE' ||
      this.deductionType === 'OTHER'
    );
  }

  /**
   * Check if deduction has been approved
   */
  isApproved(): boolean {
    return this.status === 'APPROVED';
  }

  /**
   * Check if deduction is pending approval
   */
  isPendingApproval(): boolean {
    return this.status === 'PENDING';
  }

  /**
   * Check if deduction has been rejected
   */
  isRejected(): boolean {
    return this.status === 'REJECTED';
  }

  /**
   * Check if deduction is for tax
   */
  isTaxDeduction(): boolean {
    return this.deductionType === 'TAX';
  }

  /**
   * Check if deduction is for insurance
   */
  isInsuranceDeduction(): boolean {
    return this.deductionType === 'INSURANCE';
  }

  /**
   * Check if deduction is a penalty
   */
  isPenalty(): boolean {
    return this.deductionType === 'PENALTY';
  }

  /**
   * Check if deduction is for absence
   */
  isAbsenceDeduction(): boolean {
    return this.deductionType === 'ABSENCE';
  }
}
