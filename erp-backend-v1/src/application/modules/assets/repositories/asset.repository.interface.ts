/**
 * Asset Repository Interface
 * Defines the contract for asset data access operations
 *
 * Design Pattern: Repository Pattern
 * - Abstracts data access logic from business logic
 * - Makes the code testable by allowing mock implementations
 * - Provides a clean separation of concerns
 */

import {
  AssetEntity,
  AssetEmployeeEntity,
  ProjectAssetEntity,
  MaintenanceRequestEntity,
} from '../entities';
import { CreateAssetDto, UpdateAssetDto, AssetFiltersDto } from '../dto';
import { AssignEmployeeToAssetDto } from '../dto/assign-employee-to-asset.dto';
import { AssignAssetToProjectDto } from '../dto/assign-asset-to-project.dto';
import {
  CreateMaintenanceRequestDto,
  UpdateMaintenanceRequestDto,
} from '../dto';

export interface AssetListResult {
  data: AssetEntity[];
  total: number;
  page: number;
  limit: number;
}

export abstract class IAssetRepository {
  // ========================================================================
  // ASSET CRUD OPERATIONS
  // ========================================================================

  /**
   * Create a new asset
   * @param data Asset creation data
   * @param userId User creating the asset
   * @returns Created asset entity
   */
  abstract create(data: CreateAssetDto, userId: string): Promise<AssetEntity>;

  /**
   * Find asset by ID
   * @param id Asset ID
   * @returns Asset entity or null if not found
   */
  abstract findById(id: string): Promise<AssetEntity | null>;

  /**
   * Find all assets with filters and pagination
   * @param filters Query filters
   * @returns Paginated list of assets
   */
  abstract findAll(filters: AssetFiltersDto): Promise<AssetListResult>;

  /**
   * Update an asset
   * @param id Asset ID
   * @param data Update data
   * @param userId User updating the asset
   * @returns Updated asset entity
   */
  abstract update(
    id: string,
    data: UpdateAssetDto,
    userId: string,
  ): Promise<AssetEntity>;

  /**
   * Soft delete an asset
   * @param id Asset ID
   * @param userId User deleting the asset
   */
  abstract delete(
    id: string,
    userId: string,
    rowVersion?: number,
  ): Promise<void>;

  /**
   * Check if asset number already exists
   * @param assetNumber Asset number to check
   * @returns Boolean indicating existence
   */
  abstract assetNumberExists(assetNumber: string): Promise<boolean>;

  /**
   * Find asset by serial number (for uniqueness validation)
   */
  abstract findBySerialNumber(
    serialNumber: string,
  ): Promise<AssetEntity | null>;

  /**
   * Find asset by license plate (for uniqueness validation)
   */
  abstract findByLicensePlate(
    licensePlate: string,
  ): Promise<AssetEntity | null>;

  // ========================================================================
  // ASSET-EMPLOYEE OPERATIONS
  // ========================================================================

  /**
   * Assign an employee to an asset
   * @param assetId Asset ID
   * @param data Assignment data
   * @param userId User performing the assignment
   * @returns Assignment entity
   */
  abstract assignEmployee(
    assetId: string,
    data: AssignEmployeeToAssetDto,
    userId: string,
  ): Promise<AssetEmployeeEntity>;

  /**
   * Unassign an employee from an asset
   * @param assetId Asset ID
   * @param employeeId Employee ID
   * @param endDate End date
   * @param notes Notes
   * @returns Updated assignment entity
   */
  abstract unassignEmployee(
    assetId: string,
    employeeId: string,
    endDate?: Date,
    notes?: string,
  ): Promise<AssetEmployeeEntity>;

  /**
   * Get all employees assigned to an asset
   * @param assetId Asset ID
   * @param activeOnly Get only active assignments
   * @returns List of assignments
   */
  abstract getAssetEmployees(
    assetId: string,
    activeOnly?: boolean,
  ): Promise<AssetEmployeeEntity[]>;

  /**
   * Check if employee is already assigned to asset
   * @param assetId Asset ID
   * @param employeeId Employee ID
   * @returns Boolean indicating if assignment exists
   */
  abstract isEmployeeAssigned(
    assetId: string,
    employeeId: string,
  ): Promise<boolean>;

  // ========================================================================
  // ASSET-PROJECT OPERATIONS
  // ========================================================================

  /**
   * Assign an asset to a project
   * @param assetId Asset ID
   * @param data Assignment data
   * @param userId User performing the assignment
   * @returns Assignment entity
   */
  abstract assignToProject(
    assetId: string,
    data: AssignAssetToProjectDto,
    userId: string,
  ): Promise<ProjectAssetEntity>;

  /**
   * Return an asset from a project
   * @param assetId Asset ID
   * @param returnDate Return date
   * @param notes Notes
   * @returns Updated assignment entity
   */
  abstract returnFromProject(
    assetId: string,
    returnDate?: Date,
    notes?: string,
  ): Promise<ProjectAssetEntity>;

  /**
   * Get current project assignment for an asset
   * @param assetId Asset ID
   * @returns Current assignment or null
   */
  abstract getCurrentProjectAssignment(
    assetId: string,
  ): Promise<ProjectAssetEntity | null>;

  /**
   * Get project assignment history for an asset
   * @param assetId Asset ID
   * @returns List of assignments
   */
  abstract getProjectHistory(assetId: string): Promise<ProjectAssetEntity[]>;

  // ========================================================================
  // MAINTENANCE OPERATIONS
  // ========================================================================

  /**
   * Create a maintenance request for an asset
   * @param assetId Asset ID
   * @param data Maintenance request data
   * @param userId User creating the request
   * @returns Maintenance request entity
   */
  abstract createMaintenanceRequest(
    assetId: string,
    data: CreateMaintenanceRequestDto,
    userId: string,
  ): Promise<MaintenanceRequestEntity>;

  /**
   * Update a maintenance request
   * @param id Maintenance request ID
   * @param data Update data
   * @returns Updated maintenance request
   */
  abstract updateMaintenanceRequest(
    id: string,
    data: UpdateMaintenanceRequestDto,
  ): Promise<MaintenanceRequestEntity>;

  /**
   * Get maintenance request by ID
   * @param id Maintenance request ID
   * @returns Maintenance request or null
   */
  abstract getMaintenanceRequest(
    id: string,
  ): Promise<MaintenanceRequestEntity | null>;

  /**
   * Get all maintenance requests for an asset
   * @param assetId Asset ID
   * @returns List of maintenance requests
   */
  abstract getAssetMaintenanceHistory(
    assetId: string,
  ): Promise<MaintenanceRequestEntity[]>;

  /**
   * Get active maintenance request for an asset
   * @param assetId Asset ID
   * @returns Active maintenance request or null
   */
  abstract getActiveMaintenanceRequest(
    assetId: string,
  ): Promise<MaintenanceRequestEntity | null>;
}
