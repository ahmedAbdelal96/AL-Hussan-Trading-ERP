import {
  MaintenanceStatus,
  MaintenanceType,
  MaintenancePriority,
} from '@prisma/client';

/**
 * MaintenanceRequest Entity
 * Domain entity representing a maintenance request for an asset
 */
export class MaintenanceRequestEntity {
  id: string;
  maintenanceNumber: string;
  assetId: string;
  projectId?: string | null;
  maintenanceType: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  title: string;
  description?: string | null;
  scheduledDate?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  vendor?: string | null;
  vendorContact?: string | null;
  assignedTo?: string | null;
  odometerReading?: number | null;
  workPerformed?: string | null;
  partsReplaced?: string | null;
  notes?: string | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  rowVersion: number;
  asset?: {
    id: string;
    name: string;
    assetNumber: string;
  } | null;

  constructor(partial: Partial<MaintenanceRequestEntity>) {
    Object.assign(this, partial);
  }
}
