/**
 * Maintenance Module Types
 * Types and interfaces for maintenance management system
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum MaintenanceStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum MaintenanceType {
  PREVENTIVE = "PREVENTIVE",
  CORRECTIVE = "CORRECTIVE",
  EMERGENCY = "EMERGENCY",
  SCHEDULED = "SCHEDULED",
}

export enum MaintenancePriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// ============================================================================
// PROJECT ALLOCATION
// ============================================================================

export interface MaintenanceProjectAllocation {
  id: string;
  projectId: string;
  projectName?: string | null;
  percentage: number;
  allocatedAmount?: number | null;
  note?: string | null;
}

export interface MaintenanceFinanceCost {
  id: string;
  amount: number;
  paymentStatus:
    | "PENDING"
    | "APPROVED"
    | "PAID"
    | "REJECTED"
    | "PARTIALLY_PAID"
    | "OVERDUE";
  approvedAt?: string | null;
  rejectedReason?: string | null;
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

// ============================================================================
// MAIN ENTITY
// ============================================================================

export interface MaintenanceRequestEntity {
  id: string;
  maintenanceNumber: string;
  assetId: string;
  projectId?: string | null;
  maintenanceType: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  title: string;
  description?: string | null;
  scheduledDate?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
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
  approvedAt?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  rowVersion: number;

  // Project cost allocations (auto-derived from asset-project assignments)
  projectAllocations?: MaintenanceProjectAllocation[];
  financeCost?: MaintenanceFinanceCost | null;

  // Relations (populated when included)
  asset?: {
    id: string;
    name: string;
    assetNumber: string;
  };
  project?: {
    id: string;
    name: string;
    projectNumber: string;
  } | null;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateMaintenanceRequestDto {
  assetId: string;
  projectId?: string;
  maintenanceType: MaintenanceType;
  priority?: MaintenancePriority;
  title: string;
  description?: string;
  scheduledDate?: string;
  estimatedCost?: number;
  vendor?: string;
  vendorContact?: string;
  assignedTo?: string;
  odometerReading?: number;
  notes?: string;
}

export interface UpdateMaintenanceRequestDto {
  maintenanceType?: MaintenanceType;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  title?: string;
  description?: string;
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  estimatedCost?: number;
  actualCost?: number;
  vendor?: string;
  vendorContact?: string;
  assignedTo?: string;
  odometerReading?: number;
  workPerformed?: string;
  partsReplaced?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  /** Override allocation percentages before completing. Must sum to 100. */
  projectAllocations?: { projectId: string; percentage: number }[];
  rowVersion?: number;
}

export interface MaintenanceFiltersDto {
  assetId?: string;
  projectId?: string;
  maintenanceType?: MaintenanceType;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  assignedTo?: string;
  scheduledDateFrom?: string; // ISO 8601 date string
  scheduledDateTo?: string; // ISO 8601 date string
  page?: number;
  limit?: number; // Backend uses 'limit' not 'pageSize'
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface MaintenanceListResponse {
  data: MaintenanceRequestEntity[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface MaintenanceFormValues {
  assetId: string;
  projectId?: string;
  maintenanceType: MaintenanceType;
  priority: MaintenancePriority;
  title: string;
  description?: string;
  scheduledDate?: Date | null;
  estimatedCost?: number;
  vendor?: string;
  vendorContact?: string;
  assignedTo?: string;
  odometerReading?: number;
  notes?: string;
}

export interface MaintenanceUpdateFormValues {
  projectId?: string;
  maintenanceType?: MaintenanceType;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  title?: string;
  description?: string;
  scheduledDate?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  estimatedCost?: number;
  actualCost?: number;
  vendor?: string;
  vendorContact?: string;
  assignedTo?: string;
  odometerReading?: number;
  workPerformed?: string;
  partsReplaced?: string;
  notes?: string;
}
