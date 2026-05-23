/**
 * Asset Entity
 * Domain model for Asset
 * Maps directly to Prisma Asset schema
 */

import { AssetType, AssetStatus } from '@prisma/client';

export class AssetEntity {
  id: string;
  assetNumber: string;
  name: string;

  // Type & Category
  assetType: AssetType;
  category?: string | null;

  // Manufacturer Info
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  yearOfManufacture?: number | null;

  // Purchase Info
  purchaseDate?: Date | null;
  purchasePrice?: number | null; // Decimal in DB
  vendor?: string | null;
  warrantyExpiry?: Date | null;

  // Vehicle Specific (optional - only for vehicles)
  licensePlate?: string | null;
  chassisNumber?: string | null;
  engineNumber?: string | null;
  color?: string | null;
  fuelType?: string | null;

  // Current Status
  status: AssetStatus;
  previousStatus?: AssetStatus | null;
  lastMaintenanceDate?: Date | null;
  currentLocation?: string | null;
  currentOdometer?: number | null;

  // Specifications (JSON field)
  specifications?: Record<string, unknown> | null;

  description?: string | null;
  notes?: string | null;

  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string | null;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  rowVersion: number;

  constructor(partial: Partial<AssetEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if asset is available for assignment
   */
  isAvailable(): boolean {
    return this.status === 'AVAILABLE' && !this.deletedAt;
  }

  /**
   * Check if asset is a vehicle
   */
  isVehicle(): boolean {
    return this.assetType === 'VEHICLE';
  }

  /**
   * Check if asset is deleted
   */
  isDeleted(): boolean {
    return !!this.deletedAt;
  }

  /**
   * Get asset full name with code
   */
  getFullName(): string {
    return `${this.assetNumber} - ${this.name}`;
  }

  /**
   * Check if asset needs maintenance based on status
   */
  needsMaintenance(): boolean {
    return (
      this.status === 'UNDER_MAINTENANCE' || this.status === 'OUT_OF_SERVICE'
    );
  }
}
