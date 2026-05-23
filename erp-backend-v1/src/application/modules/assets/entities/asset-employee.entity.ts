/**
 * Asset Employee Entity
 * Domain model for Asset-Employee assignment
 */

import { OperatorRole } from '@prisma/client';

export class AssetEmployeeEntity {
  id: string;
  assetId: string;
  employeeId: string;

  assignmentType: OperatorRole;
  isPrimary: boolean;

  assignedDate: Date;
  endDate?: Date | null;
  isActive: boolean;

  assignedBy: string;
  notes?: string | null;

  createdAt: Date;
  updatedAt: Date;
  employee?: {
    id: string;
    name: string;
    fullName?: string;
    employeeNumber?: string | null;
  } | null;

  constructor(partial: Partial<AssetEmployeeEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if assignment is currently active
   */
  isCurrentlyActive(): boolean {
    return this.isActive && !this.endDate;
  }

  /**
   * Check if this is the primary assignment
   */
  isPrimaryAssignment(): boolean {
    return this.isPrimary && this.isActive;
  }
}
