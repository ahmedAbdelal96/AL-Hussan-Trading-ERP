/**
 * Positions API Service
 * Handles all HTTP requests to the /employees/positions endpoints
 */

import { apiClient } from "./axiosConfig";
import type {
  PositionEntity,
  CreatePositionDto,
  UpdatePositionDto,
  PositionFiltersDto,
  PaginatedPositionsResponse,
} from "@/types/departments-positions.types";

const BASE_URL = "/employees/positions";

export const positionsApi = {
  /**
   * Get all positions with filters (paginated)
   */
  getAll: async (
    filters?: PositionFiltersDto,
  ): Promise<PaginatedPositionsResponse> => {
    const response = await apiClient.get<PaginatedPositionsResponse>(BASE_URL, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get all active positions as a flat list (for dropdowns)
   * @param departmentId - Optional: filter by department
   */
  getActive: async (departmentId?: string): Promise<PositionEntity[]> => {
    const response = await apiClient.get<PositionEntity[]>(
      `${BASE_URL}/active`,
      {
        params: departmentId ? { departmentId } : undefined,
      },
    );
    return response.data;
  },

  /**
   * Get a single position by ID
   */
  getById: async (id: string): Promise<PositionEntity> => {
    const response = await apiClient.get<PositionEntity>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Create a new position
   */
  create: async (data: CreatePositionDto): Promise<PositionEntity> => {
    const response = await apiClient.post<PositionEntity>(BASE_URL, data);
    return response.data;
  },

  /**
   * Update an existing position
   */
  update: async (
    id: string,
    data: UpdatePositionDto,
  ): Promise<PositionEntity> => {
    const response = await apiClient.patch<PositionEntity>(
      `${BASE_URL}/${id}`,
      data,
    );
    return response.data;
  },

  /**
   * Delete a position
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
