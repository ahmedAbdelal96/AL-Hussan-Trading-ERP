/**
 * Allowance Types API Service
 *
 * Manages master data for allowance types (catalog of available allowances).
 * This is configuration data that defines what types of allowances can be assigned
 * to employees (e.g., Housing, Transportation, Phone, etc.).
 *
 * @module AllowanceTypesApi
 */

import { apiClient } from "./axiosConfig";
import type {
  AllowanceTypeEntity,
  CreateAllowanceTypeDto,
  UpdateAllowanceTypeDto,
  AllowanceTypeFiltersDto,
  AllowanceTypeListResponse,
  AllowanceTypeStatisticsResponse,
} from "@/types/payroll.types";

const BASE_URL = "/payroll/allowance-types";

/**
 * Allowance Types API Service
 * Provides CRUD operations for allowance type master data
 */
export const allowanceTypesApi = {
  /**
   * Get all allowance types with optional filters
   * Commonly used to populate dropdowns and selection lists
   *
   * @param filters - Query parameters (pagination, search, active status)
   * @returns Paginated list of allowance types
   */
  getAll: async (
    filters: Partial<AllowanceTypeFiltersDto> = {},
  ): Promise<AllowanceTypeListResponse> => {
    const { data } = await apiClient.get<AllowanceTypeListResponse>(BASE_URL, {
      params: filters,
    });
    return data;
  },

  /**
   * Get a single allowance type by ID
   *
   * @param id - Allowance type UUID
   * @returns Allowance type entity
   * @throws {404} If allowance type not found
   */
  getById: async (id: string): Promise<AllowanceTypeEntity> => {
    const { data } = await apiClient.get<AllowanceTypeEntity>(
      `${BASE_URL}/${id}`,
    );
    return data;
  },

  /**
   * Create a new allowance type
   * Requires bilingual names (Arabic and English) for UI display
   *
   * @param payload - Allowance type creation data
   * @returns Created allowance type entity
   * @throws {400} If validation fails or name already exists
   */
  create: async (
    payload: CreateAllowanceTypeDto,
  ): Promise<AllowanceTypeEntity> => {
    const { data } = await apiClient.post<AllowanceTypeEntity>(
      BASE_URL,
      payload,
    );
    return data;
  },

  /**
   * Update an existing allowance type
   * Can modify names, description, and active status
   *
   * @param id - Allowance type UUID
   * @param payload - Fields to update (partial update supported)
   * @returns Updated allowance type entity
   * @throws {404} If allowance type not found
   */
  update: async (
    id: string,
    payload: UpdateAllowanceTypeDto,
  ): Promise<AllowanceTypeEntity> => {
    const { data } = await apiClient.put<AllowanceTypeEntity>(
      `${BASE_URL}/${id}`,
      payload,
    );
    return data;
  },

  /**
   * Delete an allowance type
   * Note: Cannot delete if currently in use by active employee allowances
   *
   * @param id - Allowance type UUID
   * @throws {404} If allowance type not found
   * @throws {400} If allowance type is in use
   */
  delete: async (
    id: string,
    options?: { rowVersion?: number },
  ): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}`, {
      data: options?.rowVersion ? { rowVersion: options.rowVersion } : undefined,
    });
  },

  getStatistics: async (
    filters: Partial<AllowanceTypeFiltersDto> = {},
  ): Promise<AllowanceTypeStatisticsResponse> => {
    const { data } = await apiClient.get<AllowanceTypeStatisticsResponse>(
      `${BASE_URL}/statistics`,
      { params: filters },
    );
    return data;
  },
};
