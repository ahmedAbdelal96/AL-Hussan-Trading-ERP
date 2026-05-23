import { AllowanceFrequency, AllowanceStatus } from '@prisma/client';
import { AllowanceTypeEntity } from './allowance-type.entity';
import { UserInfo } from '../../../common/interfaces/user-info.interface';

/**
 * Employee Allowance Entity
 * Represents an allowance assigned to a specific employee
 * Each employee can have different amounts for the same allowance type
 */
export class EmployeeAllowanceEntity {
  id: string;
  employeeId: string;
  allowanceTypeId: string;
  amount: number;
  frequency: AllowanceFrequency;
  effectiveFrom: Date;
  effectiveTo?: Date;
  status: AllowanceStatus;
  notes?: string;

  // Approval tracking
  approvedBy?: string;
  approvedAt?: Date;

  // Rejection tracking
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;

  // NOTE: Suspension and cancellation fields removed - simplified to PENDING/APPROVED/REJECTED workflow

  // Soft Delete tracking
  deletedAt?: Date;
  deletedBy?: string;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  rowVersion: number;

  // User Info (Enriched from User table)
  createdByUser?: UserInfo;
  approvedByUser?: UserInfo;
  rejectedByUser?: UserInfo;
  deletedByUser?: UserInfo;

  // Relations
  allowanceType?: AllowanceTypeEntity;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    employeeNumber: string;
  };

  constructor(partial: Partial<EmployeeAllowanceEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if allowance is pending approval
   */
  isPending(): boolean {
    return this.status === AllowanceStatus.PENDING;
  }

  /**
   * Check if allowance has been approved
   */
  isApproved(): boolean {
    return this.status === AllowanceStatus.APPROVED;
  }

  /**
   * Check if allowance has been rejected
   */
  isRejected(): boolean {
    return this.status === AllowanceStatus.REJECTED;
  }

  /**
   * Check if allowance is currently active and effective
   * Must be approved, within date range
   */
  isCurrentlyActive(): boolean {
    if (!this.isApproved()) return false;

    const now = new Date();
    return (
      this.effectiveFrom <= now &&
      (!this.effectiveTo || this.effectiveTo >= now)
    );
  }

  /**
   * Check if allowance has expired based on effectiveTo date
   */
  isExpired(): boolean {
    return !!this.effectiveTo && this.effectiveTo < new Date();
  }

  /**
   * Check if allowance can be edited
   * Only pending allowances can be edited
   */
  canEdit(): boolean {
    return this.isPending();
  }

  /**
   * Check if allowance can be approved
   * Only pending allowances can be approved
   */
  canApprove(): boolean {
    return this.isPending();
  }

  /**
   * Check if allowance can be rejected
   * Only pending allowances can be rejected
   */
  canReject(): boolean {
    return this.isPending();
  }

  /**
   * Calculate monthly equivalent amount based on frequency
   */
  calculateMonthlyEquivalent(): number {
    switch (this.frequency) {
      case AllowanceFrequency.ONE_TIME:
        return 0; // One-time allowances don't contribute to monthly salary
      case AllowanceFrequency.DAILY:
        return this.amount * 30; // Approximate month as 30 days
      case AllowanceFrequency.WEEKLY:
        return this.amount * 4.33; // Approximate month as 4.33 weeks
      case AllowanceFrequency.MONTHLY:
        return this.amount;
      case AllowanceFrequency.QUARTERLY:
        return this.amount / 3;
      case AllowanceFrequency.ANNUALLY:
        return this.amount / 12;
      default:
        return this.amount;
    }
  }

  /**
   * Calculate annual equivalent amount based on frequency
   */
  calculateAnnualEquivalent(): number {
    switch (this.frequency) {
      case AllowanceFrequency.ONE_TIME:
        return this.amount;
      case AllowanceFrequency.DAILY:
        return this.amount * 365;
      case AllowanceFrequency.WEEKLY:
        return this.amount * 52;
      case AllowanceFrequency.MONTHLY:
        return this.amount * 12;
      case AllowanceFrequency.QUARTERLY:
        return this.amount * 4;
      case AllowanceFrequency.ANNUALLY:
        return this.amount;
      default:
        return this.amount;
    }
  }
}
