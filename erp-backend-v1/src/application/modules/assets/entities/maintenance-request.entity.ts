/**
 * Maintenance Request Entity
 * Domain model for Asset Maintenance
 */

import {
  MaintenanceType,
  MaintenancePriority,
  MaintenanceStatus,
} from '@prisma/client';

export class MaintenanceRequestEntity {
  id: string;
  assetId: string;

  maintenanceType: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;

  title: string;
  description?: string | null;

  // Scheduling
  scheduledDate?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;

  // Cost
  estimatedCost?: number | null; // Decimal
  actualCost?: number | null; // Decimal

  // Vendor/Workshop
  vendor?: string | null;
  vendorContact?: string | null;

  // Assignment
  assignedTo?: string | null;

  // Odometer reading
  odometerReading?: number | null;

  // Work done
  workPerformed?: string | null;
  partsReplaced?: string | null;

  notes?: string | null;

  // Approval
  approvedBy?: string | null;
  approvedAt?: Date | null;

  // Audit
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<MaintenanceRequestEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if maintenance is completed
   */
  isCompleted(): boolean {
    return this.status === 'COMPLETED';
  }

  /**
   * Check if maintenance is in progress
   */
  isInProgress(): boolean {
    return this.status === 'IN_PROGRESS';
  }

  /**
   * Check if maintenance is pending
   */
  isPending(): boolean {
    return this.status === 'PENDING';
  }

  /**
   * Calculate maintenance duration in hours
   */
  getMaintenanceDuration(): number | null {
    if (!this.startedAt || !this.completedAt) return null;

    const start = new Date(this.startedAt).getTime();
    const end = new Date(this.completedAt).getTime();
    return Math.ceil((end - start) / (1000 * 60 * 60));
  }

  /**
   * Check if cost exceeded estimate
   */
  isCostExceeded(): boolean {
    if (!this.estimatedCost || !this.actualCost) return false;
    return Number(this.actualCost) > Number(this.estimatedCost);
  }
}
