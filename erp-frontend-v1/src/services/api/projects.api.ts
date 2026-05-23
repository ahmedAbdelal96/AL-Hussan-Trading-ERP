/**
 * Projects API Service
 *
 * Handles all HTTP requests for the Projects module.
 * Provides methods for CRUD operations, progress updates, and media management.
 *
 * @module projects.api
 */

import { apiClient } from "./axiosConfig";
import type {
  ProjectEntity,
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProgressDto,
  ProjectFiltersDto,
  MediaFiltersDto,
  PaginatedProjectsResponse,
  PaginatedMediaResponse,
  ProjectEmployeeEntity,
  AssignEmployeeToProjectDto,
  UpdateProjectEmployeeDto,
  ProjectAssetEntity,
  AssignAssetFromProjectDto,
} from "@/types/projects.types";
import type {
  ProjectsStatistics,
  ProjectsStatisticsParams,
} from "@/types/projects-statistics";

const BASE_URL = "/projects";
type ProjectDocumentRecord = {
  id: string;
  documentType: string;
  documentName: string;
  issueDate: string | null;
  expiryDate: string | null;
  notes?: string;
} & Record<string, unknown>;

/**
 * Projects API Service
 * Centralized service for all project-related API calls
 */
export const projectsApi = {
  /**
   * Get all projects with filters and pagination
   * @param filters - Query parameters for filtering, sorting, and pagination
   * @returns Paginated list of projects
   * @throws {Error} If the request fails
   */
  getAll: async (
    filters: Partial<ProjectFiltersDto> = {},
  ): Promise<PaginatedProjectsResponse> => {
    const { data } = await apiClient.get<PaginatedProjectsResponse>(BASE_URL, {
      params: filters,
    });
    return data;
  },

  /**
   * Get a single project by ID
   * @param id - Project UUID
   * @returns Project entity
   * @throws {Error} If project not found or request fails
   */
  getById: async (id: string): Promise<ProjectEntity> => {
    const { data } = await apiClient.get<ProjectEntity>(`${BASE_URL}/${id}`);
    return data;
  },

  /**
   * Create a new project
   * @param payload - Project creation data
   * @returns Created project entity
   * @throws {Error} If validation fails or request fails
   */
  create: async (payload: CreateProjectDto): Promise<ProjectEntity> => {
    const { data } = await apiClient.post<ProjectEntity>(BASE_URL, payload);
    return data;
  },

  /**
   * Update an existing project
   * Note: Uses PUT method as per backend implementation
   * @param id - Project UUID
   * @param payload - Project update data (partial)
   * @returns Updated project entity
   * @throws {Error} If project not found, validation fails, or request fails
   */
  update: async (
    id: string,
    payload: UpdateProjectDto,
  ): Promise<ProjectEntity> => {
    const { data } = await apiClient.put<ProjectEntity>(
      `${BASE_URL}/${id}`,
      payload,
    );
    return data;
  },

  /**
   * Delete a project (soft delete)
   * @param id - Project UUID
   * @returns void
   * @throws {Error} If project not found or request fails
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
   * Update project progress
   * Specialized endpoint for updating completion percentage and progress notes
   * @param id - Project UUID
   * @param payload - Progress update data
   * @returns Updated project entity
   * @throws {Error} If project not found, validation fails, or request fails
   */
  updateProgress: async (
    id: string,
    payload: UpdateProgressDto,
  ): Promise<ProjectEntity> => {
    const { data } = await apiClient.put<ProjectEntity>(
      `${BASE_URL}/${id}/progress`,
      payload,
    );
    return data;
  },

  /**
   * Get project media files
   * Retrieve all media files associated with a project (photos, documents, etc.)
   * @param id - Project UUID
   * @param filters - Query parameters for filtering and pagination
   * @returns Paginated list of media files
   * @throws {Error} If project not found or request fails
   */
  getMedia: async (
    id: string,
    filters: MediaFiltersDto,
  ): Promise<PaginatedMediaResponse> => {
    const { data } = await apiClient.get<PaginatedMediaResponse>(
      `${BASE_URL}/${id}/media`,
      { params: filters },
    );
    return data;
  },

  /**
   * Statistics Operations
   */
  statistics: {
    /**
     * Get projects statistics
     * Retrieve comprehensive statistics including KPIs, breakdowns, and trends
     * @param params - Optional filter parameters
     * @returns Projects statistics data
     * @throws {Error} If request fails
     */
    getProjectsStatistics: async (
      params?: ProjectsStatisticsParams,
    ): Promise<ProjectsStatistics> => {
      const { data } = await apiClient.get<ProjectsStatistics>(
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
     * Upload documents for a project
     * @param id - Project UUID
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
    ): Promise<ProjectDocumentRecord[]> => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("documentType", metadata.documentType);
      formData.append("documentName", metadata.documentName);
      if (metadata.issueDate) formData.append("issueDate", metadata.issueDate);
      if (metadata.expiryDate)
        formData.append("expiryDate", metadata.expiryDate);
      if (metadata.notes) formData.append("notes", metadata.notes);

      const response = await apiClient.post<ProjectDocumentRecord[]>(
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
     * Get all documents for a project
     * @param id - Project UUID
     * @returns Array of documents
     */
    getAll: async (id: string): Promise<ProjectDocumentRecord[]> => {
      const response = await apiClient.get<ProjectDocumentRecord[]>(
        `${BASE_URL}/${id}/documents`,
      );
      return response.data;
    },

    /**
     * Delete a document
     * @param projectId - Project UUID
     * @param documentId - Document ID
     */
    delete: async (
      projectId: string,
      documentId: string,
    ): Promise<{ message: string }> => {
      const response = await apiClient.delete<{ message: string }>(
        `${BASE_URL}/${projectId}/documents/${documentId}`,
      );
      return response.data;
    },

    /**
     * Download a document
     * @param projectId - Project UUID
     * @param documentId - Document ID
     * @returns File blob
     */
    download: async (projectId: string, documentId: string): Promise<Blob> => {
      const response = await apiClient.get(
        `${BASE_URL}/${projectId}/documents/${documentId}/download`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    },
  },

  /**
   * Employee Assignment Operations
   */
  employees: {
    /** List employees assigned to a project */
    getAll: async (
      projectId: string,
      activeOnly = true,
    ): Promise<ProjectEmployeeEntity[]> => {
      const { data } = await apiClient.get<ProjectEmployeeEntity[]>(
        `${BASE_URL}/${projectId}/employees`,
        { params: { activeOnly } },
      );
      return data;
    },

    /** Assign an employee to a project */
    assign: async (
      projectId: string,
      payload: AssignEmployeeToProjectDto,
    ): Promise<ProjectEmployeeEntity> => {
      const { data } = await apiClient.post<ProjectEmployeeEntity>(
        `${BASE_URL}/${projectId}/employees`,
        payload,
      );
      return data;
    },

    /** Update an assignment (percentage, role, etc.) */
    update: async (
      projectId: string,
      assignmentId: string,
      payload: UpdateProjectEmployeeDto,
    ): Promise<ProjectEmployeeEntity> => {
      const { data } = await apiClient.patch<ProjectEmployeeEntity>(
        `${BASE_URL}/${projectId}/employees/${assignmentId}`,
        payload,
      );
      return data;
    },

    /** Remove (deactivate) an employee assignment */
    remove: async (
      projectId: string,
      assignmentId: string,
    ): Promise<{ message: string }> => {
      const { data } = await apiClient.delete<{ message: string }>(
        `${BASE_URL}/${projectId}/employees/${assignmentId}`,
      );
      return data;
    },
  },

  /**
   * Asset Assignment Operations
   */
  assets: {
    /** List assets assigned to a project */
    getAll: async (
      projectId: string,
      activeOnly = true,
    ): Promise<ProjectAssetEntity[]> => {
      const { data } = await apiClient.get<ProjectAssetEntity[]>(
        `${BASE_URL}/${projectId}/assets`,
        { params: { activeOnly } },
      );
      return data;
    },

    /** Assign an asset to a project */
    assign: async (
      projectId: string,
      payload: AssignAssetFromProjectDto,
    ): Promise<ProjectAssetEntity> => {
      const { data } = await apiClient.post<ProjectAssetEntity>(
        `${BASE_URL}/${projectId}/assets`,
        payload,
      );
      return data;
    },

    /** Remove (deactivate) an asset assignment */
    remove: async (
      projectId: string,
      assignmentId: string,
    ): Promise<{ message: string }> => {
      const { data } = await apiClient.delete<{ message: string }>(
        `${BASE_URL}/${projectId}/assets/${assignmentId}`,
      );
      return data;
    },
  },
};
