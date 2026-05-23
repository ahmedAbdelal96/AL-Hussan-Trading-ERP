import { CostType, PaymentStatus } from '@prisma/client';
import { CostAllocationEntity } from './cost-allocation.entity';

/**
 * Project Cost Entity
 * Domain model representing a financial cost entry
 *
 * Now supports 3 cost types:
 * 1. Single Project Cost: projectId is set, isAllocated = false
 * 2. General Expense: projectId is null, isAllocated = false
 * 3. Allocated Cost: projectId is null, isAllocated = true, has allocations
 *
 * Features:
 * - Polymorphic reference support (can link to any entity type)
 * - Cost allocation across multiple projects
 * - Approval workflow (pending -> approved/rejected)
 * - Payment tracking (pending -> partially paid -> paid)
 * - Precise decimal handling for amounts
 * - Comprehensive audit trail
 */

export class ProjectCostEntity {
  id: string;
  projectId?: string; // Optional now - null for allocated costs and general expenses
  isAllocated: boolean; // True if cost is allocated across multiple projects

  // Polymorphic reference - allows linking to employees, assets, etc.
  costType: CostType;
  referenceType?: string; // e.g., 'Employee', 'Asset', 'Vendor'
  referenceId?: string; // UUID of the referenced entity

  // Cost details
  categoryId?: string;
  amount: number; // Final amount (total payable)
  amountBeforeTax: number; // Net amount before tax
  taxRate: number; // Tax rate percentage
  taxAmount: number; // Calculated tax amount
  currency: string;

  // Transaction details
  transactionDate: Date;
  description: string;
  invoiceNumber?: string;

  // Payment tracking
  paymentStatus: PaymentStatus;
  paidDate?: Date;
  paymentMethod?: string; // e.g., 'Cash', 'Bank Transfer', 'Check'
  paymentReference?: string; // Transaction ID or check number

  // Approval workflow
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;

  notes?: string;

  // Audit fields
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  rowVersion: number;

  // Relations (will be populated when needed)
  category?: any;
  project?: any;
  creator?: any;
  approver?: any;
  allocations?: CostAllocationEntity[]; // Populated for allocated costs

  constructor(partial: Partial<ProjectCostEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if this is a single project cost
   */
  isSingleProjectCost(): boolean {
    return !!this.projectId && !this.isAllocated;
  }

  /**
   * Check if this is a general expense (not tied to any project)
   */
  isGeneralExpense(): boolean {
    return !this.projectId && !this.isAllocated;
  }

  /**
   * Check if this is an allocated cost (distributed across multiple projects)
   */
  isAllocatedCost(): boolean {
    return this.isAllocated && !this.projectId;
  }

  /**
   * Get number of projects this cost is allocated to
   */
  getAllocationCount(): number {
    return this.allocations?.length || 0;
  }

  /**
   * Check if cost is pending approval
   */
  isPendingApproval(): boolean {
    return this.paymentStatus === PaymentStatus.PENDING;
  }

  /**
   * Check if cost is approved
   */
  isApproved(): boolean {
    return (
      this.paymentStatus === PaymentStatus.APPROVED ||
      this.paymentStatus === PaymentStatus.PAID
    );
  }

  /**
   * Check if cost is rejected
   */
  isRejected(): boolean {
    return this.paymentStatus === PaymentStatus.REJECTED;
  }

  /**
   * Check if cost is fully paid
   */
  isPaid(): boolean {
    return this.paymentStatus === PaymentStatus.PAID;
  }

  /**
   * Check if cost is partially paid
   */
  isPartiallyPaid(): boolean {
    return this.paymentStatus === PaymentStatus.PARTIALLY_PAID;
  }

  /**
   * Check if payment is overdue
   */
  isOverdue(): boolean {
    return this.paymentStatus === PaymentStatus.OVERDUE;
  }

  /**
   * Check if cost can be approved
   */
  canBeApproved(): boolean {
    return this.paymentStatus === PaymentStatus.PENDING;
  }

  /**
   * Check if cost can be modified
   */
  canBeModified(): boolean {
    // Can't modify if already approved, paid, or rejected
    return this.paymentStatus === PaymentStatus.PENDING;
  }

  /**
   * Check if cost can be deleted
   */
  canBeDeleted(): boolean {
    // Can't delete if already paid
    return this.paymentStatus !== PaymentStatus.PAID;
  }

  /**
   * Get display amount with currency
   */
  getFormattedAmount(): string {
    return `${this.amount.toFixed(2)} ${this.currency}`;
  }

  /**
   * Check if cost has a linked reference
   */
  hasReference(): boolean {
    return !!this.referenceType && !!this.referenceId;
  }

  /**
   * Get days since transaction
   */
  getDaysSinceTransaction(): number {
    const now = new Date();
    const diff = now.getTime() - this.transactionDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if invoice is available
   */
  hasInvoice(): boolean {
    return !!this.invoiceNumber;
  }

  /**
   * Get cost type display name
   */
  getCostTypeDisplay(): string {
    const costTypeMap: Record<CostType, string> = {
      MAINTENANCE: 'Maintenance',
      PURCHASE: 'Purchase',
      SALARY: 'Salary',
      ALLOWANCE: 'Allowance',
      FUEL: 'Fuel',
      MATERIAL: 'Material',
      EQUIPMENT_RENTAL: 'Equipment Rental',
      SUBCONTRACTOR: 'Subcontractor',
      UTILITY: 'Utility',
      TRANSPORTATION: 'Transportation',
      INSURANCE: 'Insurance',
      TAX: 'Tax',
      OTHER: 'Other',
    };
    return costTypeMap[this.costType] || this.costType;
  }

  /**
   * Get payment status display name
   */
  getPaymentStatusDisplay(): string {
    const statusMap: Record<PaymentStatus, string> = {
      PENDING: 'Pending',
      APPROVED: 'Approved',
      PAID: 'Paid',
      REJECTED: 'Rejected',
      PARTIALLY_PAID: 'Partially Paid',
      OVERDUE: 'Overdue',
    };
    return statusMap[this.paymentStatus] || this.paymentStatus;
  }
}
