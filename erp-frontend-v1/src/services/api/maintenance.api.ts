import { apiClient } from "./axiosConfig";
import type {
  MaintenanceRequestEntity,
  CreateMaintenanceRequestDto,
  UpdateMaintenanceRequestDto,
  MaintenanceFiltersDto,
  MaintenanceListResponse,
} from "@/types/maintenance.types";
import type {
  MaintenanceStatistics,
  MaintenanceStatisticsParams,
} from "@/types/maintenance-statistics";

const BASE_URL = "/maintenance";
type MaintenanceDocumentRecord = {
  id: string;
  documentType: string;
  documentName: string;
  issueDate: string | null;
  expiryDate: string | null;
  notes?: string;
} & Record<string, unknown>;

/**
 * Maintenance API Service
 * Handles all API calls related to maintenance management
 */
export const maintenanceApi = {
  /**
   * Get all maintenance requests with filters and pagination
   */
  getAll: async (
    filters: Partial<MaintenanceFiltersDto> = {},
  ): Promise<MaintenanceListResponse> => {
    const { data } = await apiClient.get<MaintenanceListResponse>(BASE_URL, {
      params: filters,
    });
    return data;
  },

  /**
   * Get maintenance request by ID
   */
  getById: async (id: string): Promise<MaintenanceRequestEntity> => {
    const { data } = await apiClient.get<MaintenanceRequestEntity>(
      `${BASE_URL}/${id}`,
    );
    return data;
  },

  /**
   * Create new maintenance request
   */
  create: async (
    payload: CreateMaintenanceRequestDto,
  ): Promise<MaintenanceRequestEntity> => {
    const { data } = await apiClient.post<MaintenanceRequestEntity>(
      BASE_URL,
      payload,
    );
    return data;
  },

  /**
   * Update existing maintenance request
   */
  update: async (
    id: string,
    payload: UpdateMaintenanceRequestDto,
  ): Promise<MaintenanceRequestEntity> => {
    const { data } = await apiClient.put<MaintenanceRequestEntity>(
      `${BASE_URL}/${id}`,
      payload,
    );
    return data;
  },

  /**
   * Delete maintenance request
   */
  delete: async (
    id: string,
    options?: { rowVersion?: number },
  ): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}`, {
      data: options?.rowVersion ? { rowVersion: options.rowVersion } : undefined,
    });
  },

  /**
   * Statistics API
   */
  statistics: {
    /**
     * Get comprehensive maintenance statistics
     */
    getMaintenanceStatistics: async (
      params?: MaintenanceStatisticsParams,
    ): Promise<MaintenanceStatistics> => {
      const { data } = await apiClient.get<MaintenanceStatistics>(
        `${BASE_URL}/statistics`,
        { params },
      );
      return data;
    },
  },

  /**
   * Documents Operations
   */
  documents: {
    /**
     * Upload documents for a maintenance request
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
    ): Promise<MaintenanceDocumentRecord[]> => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("documentType", metadata.documentType);
      formData.append("documentName", metadata.documentName);
      if (metadata.issueDate) formData.append("issueDate", metadata.issueDate);
      if (metadata.expiryDate)
        formData.append("expiryDate", metadata.expiryDate);
      if (metadata.notes) formData.append("notes", metadata.notes);

      const { data } = await apiClient.post<MaintenanceDocumentRecord[]>(
        `${BASE_URL}/${id}/documents`,
        formData,
      );
      return data;
    },

    /**
     * Get all documents for a maintenance request
     */
    getAll: async (id: string): Promise<MaintenanceDocumentRecord[]> => {
      const response = await apiClient.get<MaintenanceDocumentRecord[]>(
        `${BASE_URL}/${id}/documents`,
      );
      return response.data;
    },

    /**
     * Delete a document
     */
    delete: async (
      maintenanceId: string,
      documentId: string,
    ): Promise<{ message: string }> => {
      const response = await apiClient.delete<{ message: string }>(
        `${BASE_URL}/${maintenanceId}/documents/${documentId}`,
      );
      return response.data;
    },

    /**
     * Download a document
     */
    download: async (
      maintenanceId: string,
      documentId: string,
    ): Promise<Blob> => {
      const response = await apiClient.get(
        `${BASE_URL}/${maintenanceId}/documents/${documentId}/download`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    },
  },
};
