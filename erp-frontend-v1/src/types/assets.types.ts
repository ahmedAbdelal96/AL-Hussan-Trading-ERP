/**
 * Assets Module - Type Definitions
 *
 * Complete type definitions for the Assets management system
 * Includes Asset entities, DTOs, enums, and response types
 *
 * @module assets.types
 */

// ===================================
// ENUMS - Asset Related Enumerations
// ===================================

/**
 * Asset Type Classification
 * Defines the category of asset for proper management
 */
export enum AssetType {
  VEHICLE = "VEHICLE", // Cars, trucks, motorcycles
  EQUIPMENT = "EQUIPMENT", // General equipment
  MACHINERY = "MACHINERY", // Heavy machinery
  TOOL = "TOOL", // Hand tools, power tools
  COMPUTER = "COMPUTER", // IT equipment
  FURNITURE = "FURNITURE", // Office furniture
  OTHER = "OTHER", // Miscellaneous assets
}

/**
 * Asset Status Lifecycle
 * Tracks the current state of an asset
 */
export enum AssetStatus {
  AVAILABLE = "AVAILABLE", // Ready for assignment
  IN_USE = "IN_USE", // Currently assigned/in use
  UNDER_MAINTENANCE = "UNDER_MAINTENANCE", // Being serviced
  OUT_OF_SERVICE = "OUT_OF_SERVICE", // Not functional
  RETIRED = "RETIRED", // Permanently out of service
}

/**
 * Maintenance Request Status
 * Lifecycle stages of a maintenance request
 */
export enum MaintenanceStatus {
  PENDING = "PENDING", // Awaiting approval/scheduling
  IN_PROGRESS = "IN_PROGRESS", // Currently being worked on
  ON_HOLD = "ON_HOLD", // Paused for some reason
  COMPLETED = "COMPLETED", // Work finished
  CANCELLED = "CANCELLED", // Request cancelled
}

/**
 * Maintenance Type Classification
 * Determines the nature of the maintenance
 */
export enum MaintenanceType {
  PREVENTIVE = "PREVENTIVE", // Scheduled preventive maintenance
  CORRECTIVE = "CORRECTIVE", // Fix existing issues
  EMERGENCY = "EMERGENCY", // Urgent repairs
  SCHEDULED = "SCHEDULED", // Regular scheduled service
}

/**
 * Maintenance Priority Levels
 * Determines urgency of maintenance request
 */
export enum MaintenancePriority {
  LOW = "LOW", // Can wait
  MEDIUM = "MEDIUM", // Normal priority
  HIGH = "HIGH", // Should be done soon
  CRITICAL = "CRITICAL", // Immediate attention required
}

// ===================================
// CORE ENTITIES
// ===================================

/**
 * Asset Entity
 * Complete asset information including all optional fields
 */
export interface AssetEntity {
  // Primary fields
  id: string;
  assetNumber: string; // Unique asset identifier (e.g., AST-2024-001)
  name: string;

  // Classification
  assetType: AssetType;
  category?: string | null; // Custom category (e.g., "Heavy Equipment")

  // Manufacturer Information
  manufacturer?: string | null; // Brand/manufacturer name
  model?: string | null; // Model number/name
  serialNumber?: string | null; // Manufacturer serial number
  yearOfManufacture?: number | null;

  // Purchase Details
  purchaseDate?: Date | string | null;
  purchasePrice?: number | null; // Decimal in backend
  vendor?: string | null; // Vendor/supplier name
  warrantyExpiry?: Date | string | null;

  // Vehicle-Specific Fields (only populated for VEHICLE type)
  vehicleType?: string | null; // Added for frontend
  plateNumber?: string | null; // Maps to licensePlate in backend
  licensePlate?: string | null; // Vehicle registration plate (backend field)
  chassisNumber?: string | null; // VIN/chassis number
  engineNumber?: string | null; // Engine identification
  color?: string | null; // Vehicle color
  fuelType?: string | null; // Diesel, Petrol, Electric, etc.
  transmissionType?: string | null; // Added for frontend
  registrationExpiry?: Date | string | null; // Added for frontend
  insuranceExpiry?: Date | string | null; // Added for frontend
  lastOdometerReading?: number | null; // Maps to currentOdometer
  currentOdometer?: number | null; // For vehicles - current mileage/hours (backend field)

  // Current Status & Location (note: backend uses 'status' not 'currentStatus')
  status: AssetStatus;
  previousStatus?: AssetStatus | null; // Status before maintenance, restored on COMPLETED/CANCELLED
  lastMaintenanceDate?: Date | string | null; // When the last maintenance was completed
  currentStatus?: AssetStatus; // Alias for compatibility
  currentLocation?: string | null; // Physical location

  // Additional fields from backend
  supplier?: string | null; // Maps to vendor
  tags?: string[]; // Added for frontend

  // Technical Specifications (JSON field - flexible structure)
  specifications?: Record<string, any> | null;

  // Additional Information
  description?: string | null; // Detailed description
  notes?: string | null; // Internal notes

  // Audit Trail
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string; // User ID who created
  updatedBy?: string | null; // User ID who last updated
  rowVersion: number;
  deletedAt?: Date | string | null; // Soft delete timestamp
  deletedBy?: string | null; // User ID who deleted

  // Relations (populated when requested)
  assignedEmployees?: AssetEmployeeAssignment[];
  assignedProjects?: ProjectAssetAssignment[];
  maintenanceRequests?: MaintenanceRequestEntity[];
}

/**
 * Asset-Employee Assignment
 * Tracks which employees are assigned to which assets
 */
export interface AssetEmployeeAssignment {
  id: string;
  assetId: string;
  employeeId: string;
  assignedAt: Date | string;
  unassignedAt?: Date | string | null;
  assignedBy: string;
  unassignedBy?: string | null;
  notes?: string | null;

  // Relations (when populated)
  asset?: AssetEntity;
  employee?: {
    id: string;
    name: string;
    nameAr?: string | null;
    employeeNumber: string;
  };
}

/**
 * Project-Asset Assignment
 * Tracks which assets are assigned to which projects
 */
export interface ProjectAssetAssignment {
  id: string;
  projectId: string;
  assetId: string;
  assignedAt: Date | string;
  unassignedAt?: Date | string | null;
  assignedBy: string;
  unassignedBy?: string | null;
  notes?: string | null;

  // Relations (when populated)
  asset?: AssetEntity;
  project?: {
    id: string;
    name: string;
    nameAr?: string | null;
    projectNumber: string;
  };
}

/**
 * Maintenance Request Entity
 * Complete maintenance/service request information
 */
export interface MaintenanceRequestEntity {
  id: string;
  assetId: string;

  // Classification
  maintenanceType: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;

  // Description
  title: string;
  description?: string | null;

  // Scheduling
  scheduledDate?: Date | string | null;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;

  // Cost Management
  estimatedCost?: number | null;
  actualCost?: number | null;

  // Vendor/Workshop
  vendor?: string | null;
  vendorContact?: string | null;

  // Assignment
  assignedTo?: string | null; // User/technician ID

  // Vehicle Maintenance (if applicable)
  odometerReading?: number | null; // Odometer at time of maintenance

  // Work Details
  workPerformed?: string | null;
  partsReplaced?: string | null;
  notes?: string | null;

  // Approval
  approvedBy?: string | null;
  approvedAt?: Date | string | null;

  // Audit
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  rowVersion: number;

  // Relations (when populated)
  asset?: AssetEntity;
  projectAllocations?: MaintenanceProjectAllocationItem[];
}

export interface MaintenanceProjectAllocationItem {
  id: string;
  projectId: string;
  projectName?: string | null;
  percentage: number;
  allocatedAmount?: number | null;
  note?: string | null;
}

// ===================================
// DATA TRANSFER OBJECTS (DTOs)
// ===================================

/**
 * Create Asset DTO
 * Required and optional fields for creating a new asset
 */
export interface CreateAssetDto {
  // Required fields
  name: string;
  assetType: AssetType;

  // Optional fields
  category?: string;

  // Manufacturer info
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  yearOfManufacture?: number;

  // Purchase info
  purchaseDate?: string; // ISO date string
  purchasePrice?: number;
  vendor?: string;
  warrantyExpiry?: string; // ISO date string

  // Vehicle-specific (required only if assetType === VEHICLE)
  vehicleType?: string;
  plateNumber?: string; // Frontend field, maps to licensePlate
  licensePlate?: string; // Backend field
  chassisNumber?: string;
  engineNumber?: string;
  color?: string;
  fuelType?: string;
  transmissionType?: string; // Frontend addition
  registrationExpiry?: string; // Frontend addition - ISO date string
  insuranceExpiry?: string; // Frontend addition - ISO date string
  lastOdometerReading?: number; // Frontend field, maps to currentOdometer

  // Status & location
  status?: AssetStatus; // Defaults to AVAILABLE in backend
  currentLocation?: string;
  currentOdometer?: number;

  // Additional info
  specifications?: Record<string, any>;
  description?: string;
  notes?: string;
}

/**
 * Update Asset DTO
 * All fields optional - partial update supported
 */
export interface UpdateAssetDto {
  name?: string;
  assetType?: AssetType;
  category?: string;

  // Manufacturer info
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  yearOfManufacture?: number;

  // Purchase info
  purchaseDate?: string;
  purchasePrice?: number;
  vendor?: string;
  warrantyExpiry?: string;

  // Vehicle-specific
  vehicleType?: string;
  plateNumber?: string;
  licensePlate?: string;
  chassisNumber?: string;
  engineNumber?: string;
  color?: string;
  fuelType?: string;
  transmissionType?: string;
  registrationExpiry?: string;
  insuranceExpiry?: string;
  lastOdometerReading?: number;

  // Status & location
  status?: AssetStatus;
  currentLocation?: string;
  currentOdometer?: number;

  // Additional info
  specifications?: Record<string, any>;
  description?: string;
  notes?: string;
  rowVersion?: number;
}

/**
 * Asset Filters DTO
 * Query parameters for filtering and pagination
 */
export interface AssetFiltersDto {
  // Search & Filters
  search?: string; // Searches name, assetNumber, licensePlate
  assetType?: AssetType;
  status?: AssetStatus;
  category?: string;
  manufacturer?: string;
  currentLocation?: string;

  // Pagination
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100

  // Sorting
  sortBy?: string; // Default: 'createdAt'
  sortOrder?: "asc" | "desc"; // Default: 'desc'
}

/**
 * Assign Employee to Asset DTO
 */
export interface AssignEmployeeToAssetDto {
  employeeId: string;
  assignmentType:
    | "PRIMARY_DRIVER"
    | "BACKUP_DRIVER"
    | "OPERATOR"
    | "TECHNICIAN"
    | "ASSISTANT";
  isPrimary: boolean;
  assignedDate?: string;
  notes?: string;
}

/**
 * Assign Asset to Project DTO
 */
export interface AssignAssetToProjectDto {
  projectId: string;
  notes?: string;
}

/**
 * Create Maintenance Request DTO
 */
export interface CreateMaintenanceRequestDto {
  // Required
  maintenanceType: MaintenanceType;
  priority: MaintenancePriority;
  title: string;

  // Optional
  description?: string;
  scheduledDate?: string; // ISO date string
  estimatedCost?: number;
  vendor?: string;
  vendorContact?: string;
  assignedTo?: string; // User ID
  odometerReading?: number;
  notes?: string;
}

/**
 * Update Maintenance Request DTO
 */
export interface UpdateMaintenanceRequestDto {
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
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
  rowVersion?: number;
}

// ===================================
// API RESPONSE TYPES
// ===================================

/**
 * Paginated Assets List Response
 */
export interface AssetsListResponse {
  data: AssetEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Single Asset Response (with relations)
 */
export interface AssetDetailsResponse extends AssetEntity {
  assignedEmployees: AssetEmployeeAssignment[];
  assignedProjects: ProjectAssetAssignment[];
  maintenanceRequests: MaintenanceRequestEntity[];
}

/**
 * Maintenance Requests List Response
 */
export interface MaintenanceRequestsListResponse {
  items: MaintenanceRequestEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===================================
// UTILITY TYPES
// ===================================

/**
 * Asset Form Mode
 * Determines if form is for creating or editing
 */
export type AssetFormMode = "create" | "edit";

/**
 * Asset Status Badge Variant
 * Maps status to UI color scheme
 */
export type AssetStatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary";

/**
 * Maintenance Priority Badge Variant
 */
export type MaintenancePriorityVariant =
  | "success"
  | "warning"
  | "danger"
  | "destructive";

/**
 * Asset Statistics
 * For dashboard/overview displays
 */
export interface AssetStatistics {
  total: number;
  available: number;
  inUse: number;
  underMaintenance: number;
  outOfService: number;
  retired: number;
  byType: Record<AssetType, number>;
}

/**
 * Validation Error Response
 * Standard error format from backend
 */
export interface AssetValidationError {
  field: string;
  message: string;
  code?: string;
}

// ===================================
// TYPE GUARDS
// ===================================

/**
 * Check if asset is a vehicle
 */
export const isVehicle = (asset: AssetEntity): boolean => {
  return asset.assetType === AssetType.VEHICLE;
};

/**
 * Check if asset is available for assignment
 */
export const isAssetAvailable = (asset: AssetEntity): boolean => {
  return asset.status === AssetStatus.AVAILABLE && !asset.deletedAt;
};

/**
 * Check if maintenance is completed
 */
export const isMaintenanceCompleted = (
  maintenance: MaintenanceRequestEntity,
): boolean => {
  return maintenance.status === MaintenanceStatus.COMPLETED;
};
