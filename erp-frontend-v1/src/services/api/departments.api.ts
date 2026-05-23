/**
 * Departments API Service
 * Handles all HTTP requests to the /employees/departments endpoints
 */

import { apiClient } from "./axiosConfig";
import type {
  DepartmentEntity,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentFiltersDto,
  PaginatedDepartmentsResponse,
} from "@/types/departments-positions.types";

const BASE_URL = "/employees/departments";

export const departmentsApi = {
  /**
   * Get all departments with filters (paginated)
   */
  getAll: async (
    filters?: DepartmentFiltersDto,
  ): Promise<PaginatedDepartmentsResponse> => {
    const response = await apiClient.get<PaginatedDepartmentsResponse>(
      BASE_URL,
      { params: filters },
    );
    return response.data;
  },

  /**
   * Get all active departments as a flat list (for dropdowns)
   */
  getActive: async (): Promise<DepartmentEntity[]> => {
    const response = await apiClient.get<DepartmentEntity[]>(
      `${BASE_URL}/active`,
    );
    return response.data;
  },

  /**
   * Get a single department by ID
   */
  getById: async (id: string): Promise<DepartmentEntity> => {
    const response = await apiClient.get<DepartmentEntity>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Create a new department
   */
  create: async (data: CreateDepartmentDto): Promise<DepartmentEntity> => {
    const response = await apiClient.post<DepartmentEntity>(BASE_URL, data);
    return response.data;
  },

  /**
   * Update an existing department
   */
  update: async (
    id: string,
    data: UpdateDepartmentDto,
  ): Promise<DepartmentEntity> => {
    const response = await apiClient.patch<DepartmentEntity>(
      `${BASE_URL}/${id}`,
      data,
    );
    return response.data;
  },

  /**
   * Delete a department
   */
  delete: async (
    id: string,
    options?: { rowVersion?: number },
  ): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}`, {
      data: options?.rowVersion ? { rowVersion: options.rowVersion } : undefined,
    });
  },
};
