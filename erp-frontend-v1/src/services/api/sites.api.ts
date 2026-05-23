/**
 * Sites API Service
 * Handles all HTTP requests for the Sites module
 *
 * Provides methods for CRUD operations on sites:
 * - getAll: Fetch paginated sites with filters
 * - getById: Fetch single site details
 * - create: Create new site
 * - bulkCreate: Create multiple sites at once
 * - update: Update existing site
 * - delete: Soft delete site
 */

import { apiClient } from "./axiosConfig";
import type {
  SiteEntity,
  CreateSiteDto,
  UpdateSiteDto,
  SiteFiltersDto,
  BulkCreateSitesDto,
  PaginatedSitesResponse,
} from "@/types/sites.types";

const BASE_URL = "/sites";

/**
 * Sites API endpoints
 */
export const sitesApi = {
  /**
   * Get all sites with filters and pagination
   * @param filters - Filtering and pagination options
   * @returns Paginated list of sites
   */
  getAll: async (
    filters: Partial<SiteFiltersDto> = {},
  ): Promise<PaginatedSitesResponse> => {
    const { data } = await apiClient.get<PaginatedSitesResponse>(BASE_URL, {
      params: filters,
    });
    return data;
  },

  /**
   * Get all deleted sites with filters and pagination
   * @param filters - Filtering and pagination options
   * @returns Paginated list of deleted sites
   */
  getAllDeleted: async (
    filters: Partial<SiteFiltersDto> = {},
  ): Promise<PaginatedSitesResponse> => {
    const { data } = await apiClient.get<PaginatedSitesResponse>(
      `${BASE_URL}/deleted`,
      { params: filters },
    );
    return data;
  },

  /**
   * Get site by ID
   * @param id - Site unique identifier
   * @returns Site entity with full details
   */
  getById: async (id: string): Promise<SiteEntity> => {
    const { data } = await apiClient.get<SiteEntity>(`${BASE_URL}/${id}`);
    return data;
  },

  /**
   * Create new site
   * @param payload - Site creation data
   * @returns Created site entity
   */
  create: async (payload: CreateSiteDto): Promise<SiteEntity> => {
    const { data } = await apiClient.post<SiteEntity>(BASE_URL, payload);
    return data;
  },

  /**
   * Create multiple sites at once
   * @param payload - Bulk creation data with array of sites
   * @returns Array of created site entities
   */
  bulkCreate: async (payload: BulkCreateSitesDto): Promise<SiteEntity[]> => {
    const { data } = await apiClient.post<SiteEntity[]>(
      `${BASE_URL}/bulk`,
      payload,
    );
    return data;
  },

  /**
   * Update existing site
   * @param id - Site unique identifier
   * @param payload - Partial site data to update
   * @returns Updated site entity
   */
  update: async (id: string, payload: UpdateSiteDto): Promise<SiteEntity> => {
    const { data } = await apiClient.put<SiteEntity>(
      `${BASE_URL}/${id}`,
      payload,
    );
    return data;
  },

  /**
   * Delete site (soft delete)
   * @param id - Site unique identifier
   * @returns Success message
   */
  delete: async (
    id: string,
    options?: { rowVersion?: number },
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(
      `${BASE_URL}/${id}`,
      {
        data: options?.rowVersion ? { rowVersion: options.rowVersion } : undefined,
      },
    );
    return data;
  },

  /**
   * Restore deleted site
   * @param id - Site unique identifier
   * @returns Restored site entity
   */
  restore: async (id: string): Promise<SiteEntity> => {
    const { data } = await apiClient.patch<SiteEntity>(
      `${BASE_URL}/${id}/restore`,
    );
    return data;
  },
  /**
   * Get comprehensive statistics about sites
   * @returns Sites statistics
   */
  getStats: async (): Promise<import("@/types/sites.types").SitesStats> => {
    const { data } = await apiClient.get<
      import("@/types/sites.types").SitesStats
    >(`${BASE_URL}/stats`);
    return data;
  },
};
