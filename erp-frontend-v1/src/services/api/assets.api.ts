/**
 * Assets API Service
 *
 * Handles all HTTP requests to the Assets backend module
 * Includes CRUD operations, assignments, and maintenance management
 *
 * @module assets.api
 */

import { apiClient } from "./axiosConfig";
import type {
  AssetEntity,
  CreateAssetDto,
  UpdateAssetDto,
  AssetFiltersDto,
  AssetsListResponse,
  AssetDetailsResponse,
  AssignEmployeeToAssetDto,
  AssignAssetToProjectDto,
  CreateMaintenanceRequestDto,
  UpdateMaintenanceRequestDto,
  MaintenanceRequestEntity,
  AssetEmployeeAssignment,
  ProjectAssetAssignment,
} from "@/types/assets.types";
import type {
  AssetsStatistics,
  AssetsStatisticsParams,
} from "@/types/assets-statistics";

// Base URL for assets endpoints
const BASE_URL = "/assets";
export type AssetDocumentRecord = {
  id: string;
  documentType: string;
  documentName: string;
  issueDate: string | null;
  expiryDate: string | null;
  notes?: string;
} & Record<string, unknown>;

/**
 * Assets API Methods
 * All methods return properly typed responses
 */
export const assetsApi = {
  // ===================================
  // ASSET CRUD OPERATIONS
  // ===================================

  /**
   * Get all assets with optional filters and pagination
   * @param filters - Search, filter, and pagination parameters
   * @returns Paginated list of assets
   */
  getAll: async (
    filters: Partial<AssetFiltersDto> = {},
  ): Promise<AssetsListResponse> => {
    const { data } = await apiClient.get<AssetsListResponse>(BASE_URL, {
      params: filters,
    });
    return data;
  },

  /**
   * Get single asset by ID with all relations
   * @param id - Asset UUID
   * @returns Complete asset details including assignments and maintenance
   */
  getById: async (id: string): Promise<AssetDetailsResponse> => {
    const { data } = await apiClient.get<AssetDetailsResponse>(
      `${BASE_URL}/${id}`,
    );
    return data;
  },

  /**
   * Create new asset
   * @param payload - Asset creation data
   * @returns Created asset entity
   */
  create: async (payload: CreateAssetDto): Promise<AssetEntity> => {
    const { data } = await apiClient.post<AssetEntity>(BASE_URL, payload);
    return data;
  },

  /**
   * Update existing asset
   * @param id - Asset UUID
   * @param payload - Updated asset data (partial)
   * @returns Updated asset entity
   */
  update: async (id: string, payload: UpdateAssetDto): Promise<AssetEntity> => {
    const { data } = await apiClient.put<AssetEntity>(
      `${BASE_URL}/${id}`,
      payload,
    );
    return data;
  },

  /**
   * Delete asset (soft delete)
   * @param id - Asset UUID
   * @returns Success message
   */
  delete: async (
    id: string,
    options?: { rowVersion?: number },
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(
      `${BASE_URL}/${id}`,
      {
        data: options?.rowVersion
          ? { rowVersion: options.rowVersion }
          : undefined,
      },
    );
    return data;
  },

  // ===================================
  // EMPLOYEE ASSIGNMENT OPERATIONS
  // ===================================

  /**
   * Assign employee to asset
   * Creates a new employee-asset assignment
   *
   * @param assetId - Asset UUID
   * @param payload - Assignment data including employee ID
   * @returns Created assignment record
   */
  assignEmployee: async (
    assetId: string,
    payload: AssignEmployeeToAssetDto,
  ): Promise<AssetEmployeeAssignment> => {
    const { data } = await apiClient.post<AssetEmployeeAssignment>(
      `${BASE_URL}/${assetId}/assign-employee`,
      payload,
    );
    return data;
  },

  /**
   * Unassign employee from asset
   * Marks the assignment as ended
   *
   * @param assetId - Asset UUID
   * @param employeeId - Employee UUID to unassign
   * @returns Updated assignment record
   */
  unassignEmployee: async (
    assetId: string,
    employeeId: string,
  ): Promise<AssetEmployeeAssignment> => {
    const { data } = await apiClient.delete<AssetEmployeeAssignment>(
      `${BASE_URL}/${assetId}/assign-employee/${employeeId}`,
    );
    return data;
  },

  /**
   * Get all employee assignments for an asset
   * @param assetId - Asset UUID
   * @returns List of employee assignments
   */
  getEmployeeAssignments: async (
    assetId: string,
  ): Promise<AssetEmployeeAssignment[]> => {
    const { data } = await apiClient.get<AssetEmployeeAssignment[]>(
      `${BASE_URL}/${assetId}/employees`,
    );
    return data;
  },

  // ===================================
  // PROJECT ASSIGNMENT OPERATIONS
  // ===================================

  /**
   * Assign asset to project
   * Creates a new project-asset assignment
   *
   * @param assetId - Asset UUID
   * @param payload - Assignment data including project ID
   * @returns Created assignment record
   */
  assignToProject: async (
    assetId: string,
    payload: AssignAssetToProjectDto,
  ): Promise<ProjectAssetAssignment> => {
    const { data } = await apiClient.post<ProjectAssetAssignment>(
      `${BASE_URL}/${assetId}/assign-project`,
      payload,
    );
    return data;
  },

  /**
   * Unassign asset from project
   * Marks the assignment as ended
   *
   * @param assetId - Asset UUID
   * @param projectId - Project UUID to unassign
   * @returns Updated assignment record
   */
  unassignFromProject: async (
    assetId: string,
    projectId: string,
  ): Promise<ProjectAssetAssignment> => {
    const { data } = await apiClient.delete<ProjectAssetAssignment>(
      `${BASE_URL}/${assetId}/assign-project/${projectId}`,
    );
    return data;
  },

  /**
   * Get all project assignments for an asset
   * @param assetId - Asset UUID
   * @returns List of project assignments
   */
  getProjectAssignments: async (
    assetId: string,
  ): Promise<ProjectAssetAssignment[]> => {
    const { data } = await apiClient.get<ProjectAssetAssignment[]>(
      `${BASE_URL}/${assetId}/projects`,
    );
    return data;
  },

  // ===================================
  // MAINTENANCE OPERATIONS
  // ===================================

  /**
   * Create maintenance request for asset
   * @param assetId - Asset UUID
   * @param payload - Maintenance request data
   * @returns Created maintenance request
   */
  createMaintenanceRequest: async (
    assetId: string,
    payload: CreateMaintenanceRequestDto,
  ): Promise<MaintenanceRequestEntity> => {
    const { data } = await apiClient.post<MaintenanceRequestEntity>(
      `${BASE_URL}/${assetId}/maintenance`,
      payload,
    );
    return data;
  },

  /**
   * Update maintenance request
   * @param assetId - Asset UUID
   * @param maintenanceId - Maintenance request UUID
   * @param payload - Updated maintenance data
   * @returns Updated maintenance request
   */
  updateMaintenanceRequest: async (
    assetId: string,
    maintenanceId: string,
    payload: UpdateMaintenanceRequestDto,
  ): Promise<MaintenanceRequestEntity> => {
    const { data } = await apiClient.put<MaintenanceRequestEntity>(
      `${BASE_URL}/${assetId}/maintenance/${maintenanceId}`,
      payload,
    );
    return data;
  },

  /**
   * Get all maintenance requests for an asset
   * @param assetId - Asset UUID
   * @returns List of maintenance requests
   */
  getMaintenanceRequests: async (
    assetId: string,
  ): Promise<MaintenanceRequestEntity[]> => {
    const { data } = await apiClient.get<MaintenanceRequestEntity[]>(
      `${BASE_URL}/${assetId}/maintenance`,
    );
    return data;
  },

  /**
   * Get single maintenance request
   * @param assetId - Asset UUID
   * @param maintenanceId - Maintenance request UUID
   * @returns Maintenance request details
   */
  getMaintenanceRequest: async (
    assetId: string,
    maintenanceId: string,
  ): Promise<MaintenanceRequestEntity> => {
    const { data } = await apiClient.get<MaintenanceRequestEntity>(
      `${BASE_URL}/${assetId}/maintenance/${maintenanceId}`,
    );
    return data;
  },

  /**
   * Delete maintenance request
   * @param assetId - Asset UUID
   * @param maintenanceId - Maintenance request UUID
   * @returns Success message
   */
  deleteMaintenanceRequest: async (
    assetId: string,
    maintenanceId: string,
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(
      `${BASE_URL}/${assetId}/maintenance/${maintenanceId}`,
    );
    return data;
  },

  // ===================================
  // UTILITY/STATS OPERATIONS
  // ===================================

  /**
   * Get asset statistics
   * Returns counts and summaries for dashboard
   * @returns Asset statistics
   */
  getStatistics: async (): Promise<{
    total: number;
    available: number;
    inUse: number;
    underMaintenance: number;
    byType: Record<string, number>;
  }> => {
    const { data } = await apiClient.get(`${BASE_URL}/statistics`);
    return data;
  },

  /**
   * Export assets to CSV/Excel
   * @param filters - Optional filters to apply
   * @returns Blob for download
   */
  exportAssets: async (filters?: Partial<AssetFiltersDto>): Promise<Blob> => {
    const { data } = await apiClient.get(`${BASE_URL}/export`, {
      params: filters,
      responseType: "blob",
    });
    return data;
  },

  /**
   * Get asset number suggestions
   * For auto-complete in forms
   * @param prefix - Optional prefix filter
   * @returns List of asset numbers
   */
  getAssetNumbers: async (prefix?: string): Promise<string[]> => {
    const { data } = await apiClient.get<string[]>(
      `${BASE_URL}/asset-numbers`,
      {
        params: { prefix },
      },
    );
    return data;
  },

  /**
   * Check if asset number is available
   * @param assetNumber - Asset number to check
   * @returns True if available
   */
  checkAssetNumberAvailability: async (
    assetNumber: string,
  ): Promise<boolean> => {
    const { data } = await apiClient.get<{ available: boolean }>(
      `${BASE_URL}/check-availability`,
      {
        params: { assetNumber },
      },
    );
    return data.available;
  },

  // ===================================
  // STATISTICS & ANALYTICS
  // ===================================

  /**
   * Get comprehensive asset statistics
   * Returns detailed analytics including:
   * - Total assets and valuation
   * - Status distribution
   * - Type and category breakdowns
   * - Location tracking
   * - Age demographics
   * - Manufacturer distribution
   * - Monthly acquisition trends
   *
   * @param params - Optional filters (date range, type, status, location)
   * @returns Complete statistics with all breakdowns
   *
   * @example
   * ```typescript
   * // Get all-time statistics
   * const stats = await assetsApi.statistics.getAssetsStatistics();
   *
   * // Get statistics for specific period
   * const yearStats = await assetsApi.statistics.getAssetsStatistics({
   *   startDate: '2025-01-01',
   *   endDate: '2025-12-31'
   * });
   *
   * // Filter by asset type
   * const vehicleStats = await assetsApi.statistics.getAssetsStatistics({
   *   assetType: 'VEHICLE'
   * });
   * ```
   */
  statistics: {
    getAssetsStatistics: async (
      params?: AssetsStatisticsParams,
    ): Promise<AssetsStatistics> => {
      const { data } = await apiClient.get<AssetsStatistics>(
        `${BASE_URL}/statistics`,
        { params },
      );
      return data;
    },
  },

  // ===================================
  // DOCUMENTS OPERATIONS
  // ===================================

  /**
   * Documents Operations
   */
  documents: {
    /**
     * Upload documents for an asset
     * @param id - Asset UUID
     * @param files - Array of files to upload
     * @param metadata - Document metadata
     * @returns Array of uploaded documents
     */
    upload: async (
      id: string,
      files: File[],
      metadata: {
        documentType: string;
        documentName: string;
        issueDate?: string;
        expiryDate?: string;
        notes?: string;
      },
    ): Promise<AssetDocumentRecord[]> => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("documentType", metadata.documentType);
      formData.append("documentName", metadata.documentName);
      if (metadata.issueDate) formData.append("issueDate", metadata.issueDate);
      if (metadata.expiryDate)
        formData.append("expiryDate", metadata.expiryDate);
      if (metadata.notes) formData.append("notes", metadata.notes);

      const response = await apiClient.post<AssetDocumentRecord[]>(
        `${BASE_URL}/${id}/documents`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    },

    /**
     * Get all documents for an asset
     * @param id - Asset UUID
     * @returns Array of documents
     */
    getAll: async (id: string): Promise<AssetDocumentRecord[]> => {
      const response = await apiClient.get<AssetDocumentRecord[]>(
        `${BASE_URL}/${id}/documents`,
      );
      return response.data;
    },

    /**
     * Delete a document
     * @param assetId - Asset UUID
     * @param documentId - Document ID
     */
    delete: async (
      assetId: string,
      documentId: string,
    ): Promise<{ message: string }> => {
      const response = await apiClient.delete<{ message: string }>(
        `${BASE_URL}/${assetId}/documents/${documentId}`,
      );
      return response.data;
    },

    /**
     * Download a document
     * @param assetId - Asset UUID
     * @param documentId - Document ID
     * @returns File blob
     */
    download: async (assetId: string, documentId: string): Promise<Blob> => {
      const response = await apiClient.get(
        `${BASE_URL}/${assetId}/documents/${documentId}/download`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    },
  },
};

// Export type for use in hooks
export type AssetsApiType = typeof assetsApi;
