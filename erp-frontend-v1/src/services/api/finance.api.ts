/**
 * Finance API Service
 *
 * Handles all API communication for the Finance module.
 * Includes: Cost Categories and Project Costs operations.
 *
 * Backend Endpoints:
 * - Cost Categories: /api/v1/finance/categories/*
 * - Project Costs: /api/v1/finance/costs/*
 *
 * @module finance.api
 */

import { apiClient } from "./axiosConfig";
import type {
  // Cost Category Types
  CostCategoryEntity,
  CreateCostCategoryDto,
  UpdateCostCategoryDto,
  CostCategoryFiltersDto,
  CostCategoryListResponse,

  // Project Cost Types
  ProjectCostEntity,
  CreateProjectCostDto,
  UpdateProjectCostDto,
  ProjectCostFiltersDto,
  ProjectCostListResponse,
  ApproveProjectCostDto,
  RejectProjectCostDto,
  ProjectCostSummary,

  // Statistics Types
  FinanceStatisticsDto,

  // Cost Allocation Types
  CostAllocationEntity,
  ConvertToAllocatedDto,
} from "@/types/finance.types";

const BASE_URL = "/finance";

// ============================================================================
// COST CATEGORY API
// ============================================================================

/**
 * Cost Category API operations
 * Backend: FinanceController - /api/v1/finance/categories/*
 */
export const costCategoryApi = {
  /**
   * Get all cost categories with optional filters
   * GET /api/v1/finance/categories
   *
   * @param filters - Query parameters for filtering and pagination
   * @returns Paginated list of cost categories
   */
  getAll: async (
    filters: Partial<CostCategoryFiltersDto> = {},
  ): Promise<CostCategoryListResponse> => {
    const { data } = await apiClient.get(`${BASE_URL}/categories`, {
      params: filters,
    });
    return data;
  },

  /**
   * Get a single cost category by ID
   * GET /api/v1/finance/categories/:id
   *
   * @param id - Category UUID
   * @returns Cost category entity with relations
   */
  getById: async (id: string): Promise<CostCategoryEntity> => {
    const { data } = await apiClient.get(`${BASE_URL}/categories/${id}`);
    return data;
  },

  /**
   * Create a new cost category
   * POST /api/v1/finance/categories
   *
   * @param payload - Category creation data
   * @returns Created category entity
   */
  create: async (
    payload: CreateCostCategoryDto,
  ): Promise<CostCategoryEntity> => {
    const { data } = await apiClient.post(`${BASE_URL}/categories`, payload);
    return data;
  },

  /**
   * Update an existing cost category
   * PUT /api/v1/finance/categories/:id
   *
   * @param id - Category UUID
   * @param payload - Category update data
   * @returns Updated category entity
   */
  update: async (
    id: string,
    payload: UpdateCostCategoryDto,
  ): Promise<CostCategoryEntity> => {
    const { data } = await apiClient.put(
      `${BASE_URL}/categories/${id}`,
      payload,
    );
    return data;
  },

  /**
   * Delete a cost category
   * DELETE /api/v1/finance/categories/:id
   *
   * Note: Can only delete if category has no associated costs
   * Requires: ADMIN/SUPERADMIN role + finance:delete permission
   *
   * @param id - Category UUID
   */
  delete: async (
    id: string,
    options?: { rowVersion?: number },
  ): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/categories/${id}`, {
      data: options?.rowVersion ? { rowVersion: options.rowVersion } : undefined,
    });
  },

  /**
   * Get all categories as a tree structure
   * Helper method to fetch all categories and build hierarchy client-side
   *
   * @returns Hierarchical tree of categories
   */
  getTree: async (): Promise<CostCategoryEntity[]> => {
    const response = await costCategoryApi.getAll({
      limit: 100, // Get maximum allowed per page
      page: 1,
    });
    return response.data;
  },
};

// ============================================================================
// PROJECT COST API
// ============================================================================

/**
 * Project Cost API operations
 * Backend: FinanceController - /api/v1/finance/costs/*
 */
export const projectCostApi = {
  /**
   * Get all project costs with optional filters
   * GET /api/v1/finance/costs
   *
   * @param filters - Query parameters for filtering and pagination
   * @returns Paginated list of project costs
   */
  getAll: async (
    filters: Partial<ProjectCostFiltersDto> = {},
  ): Promise<ProjectCostListResponse> => {
    const { data } = await apiClient.get(`${BASE_URL}/costs`, {
      params: filters,
    });
    return data;
  },

  /**
   * Get a single project cost by ID
   * GET /api/v1/finance/costs/:id
   *
   * @param id - Cost UUID
   * @returns Project cost entity with relations
   */
  getById: async (id: string): Promise<ProjectCostEntity> => {
    const { data } = await apiClient.get(`${BASE_URL}/costs/${id}`);
    return data;
  },

  /**
   * Create a new project cost
   * POST /api/v1/finance/costs
   *
   * Note: Cost will be created with PENDING status by default
   *
   * @param payload - Cost creation data
   * @returns Created cost entity
   */
  create: async (payload: CreateProjectCostDto): Promise<ProjectCostEntity> => {
    const { data } = await apiClient.post(`${BASE_URL}/costs`, payload);
    return data;
  },

  /**
   * Update an existing project cost
   * PUT /api/v1/finance/costs/:id
   *
   * Note: Can only update costs with PENDING status
   * Payment status and approval fields are updated via separate endpoints
   *
   * @param id - Cost UUID
   * @param payload - Cost update data
   * @returns Updated cost entity
   */
  update: async (
    id: string,
    payload: UpdateProjectCostDto,
  ): Promise<ProjectCostEntity> => {
    const { data } = await apiClient.put(`${BASE_URL}/costs/${id}`, payload);
    return data;
  },

  /**
   * Delete a project cost
   * DELETE /api/v1/finance/costs/:id
   *
   * Note: Can't delete costs with PAID status
   * Requires: ADMIN/SUPERADMIN role + finance:delete permission
   *
   * @param id - Cost UUID
   */
  delete: async (
    id: string,
    options?: { rowVersion?: number },
  ): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/costs/${id}`, {
      data: options?.rowVersion ? { rowVersion: options.rowVersion } : undefined,
    });
  },

  // ==========================================================================
  // APPROVAL WORKFLOW ENDPOINTS
  // ==========================================================================

  /**
   * Approve a project cost
   * POST /api/v1/finance/costs/:id/approve
   *
   * Changes status from PENDING to APPROVED (or PAID if payment details provided)
   * Requires: finance:approve permission
   *
   * @param id - Cost UUID
   * @param payload - Approval data (optional payment details)
   * @returns Updated cost entity
   */
  approve: async (
    id: string,
    payload: ApproveProjectCostDto = {},
  ): Promise<ProjectCostEntity> => {
    const { data } = await apiClient.post(
      `${BASE_URL}/costs/${id}/approve`,
      payload,
    );
    return data;
  },

  /**
   * Reject a project cost
   * POST /api/v1/finance/costs/:id/reject
   *
   * Changes status from PENDING to REJECTED with reason
   * Requires: finance:approve permission
   *
   * @param id - Cost UUID
   * @param payload - Rejection data with reason
   * @returns Updated cost entity
   */
  reject: async (
    id: string,
    payload: RejectProjectCostDto,
  ): Promise<ProjectCostEntity> => {
    const { data } = await apiClient.post(
      `${BASE_URL}/costs/${id}/reject`,
      payload,
    );
    return data;
  },

  // ==========================================================================
  // ANALYTICS & REPORTS ENDPOINTS
  // ==========================================================================

  /**
   * Get cost summary for a specific project
   * GET /api/v1/finance/costs/project/:projectId/summary
   *
   * Returns aggregated statistics, breakdowns, and trends
   *
   * @param projectId - Project UUID
   * @returns Comprehensive project cost summary
   */
  getProjectSummary: async (projectId: string): Promise<ProjectCostSummary> => {
    const { data } = await apiClient.get(
      `${BASE_URL}/costs/project/${projectId}/summary`,
    );
    return data;
  },

  /**
   * Get costs by project
   * Helper method to fetch all costs for a specific project
   *
   * @param projectId - Project UUID
   * @param additionalFilters - Additional filter parameters
   * @returns Project costs list
   */
  getByProject: async (
    projectId: string,
    additionalFilters: Partial<ProjectCostFiltersDto> = {},
  ): Promise<ProjectCostListResponse> => {
    return projectCostApi.getAll({
      projectId,
      ...additionalFilters,
    });
  },
};

// ============================================================================
// FINANCE STATISTICS API
// ============================================================================

/**
 * Finance Statistics API operations
 * Backend: FinanceController - /api/v1/finance/statistics
 */
export const financeStatisticsApi = {
  /**
   * Get finance statistics for dashboard
   * GET /api/v1/finance/statistics
   *
   * Returns aggregated financial data including:
   * - Total costs, pending, approved, paid amounts
   * - Breakdown by status, type, category
   * - Monthly trends
   * - Top projects by cost
   * - Recent activity metrics
   *
   * @param dateRange - Optional date range filter
   * @returns Comprehensive finance statistics
   */
  getFinanceStatistics: async (dateRange?: {
    startDate?: string;
    endDate?: string;
  }): Promise<FinanceStatisticsDto> => {
    const params = new URLSearchParams();
    if (dateRange?.startDate) params.append("startDate", dateRange.startDate);
    if (dateRange?.endDate) params.append("endDate", dateRange.endDate);

    const queryString = params.toString();
    const url = `${BASE_URL}/statistics${queryString ? `?${queryString}` : ""}`;

    const { data } = await apiClient.get(url);

    return data;
  },
};

// ============================================================================
// COMBINED FINANCE API EXPORT
// ============================================================================

/**
 * Cost Allocation API operations
 */
export const costAllocationApi = {
  /**
   * Get allocations for a specific cost
   * GET /api/v1/finance/costs/:costId/allocations
   */
  getByCostId: async (costId: string): Promise<CostAllocationEntity[]> => {
    const { data } = await apiClient.get(
      `${BASE_URL}/costs/${costId}/allocations`,
    );
    return data;
  },

  /**
   * Update allocations for a cost (bulk update)
   * PUT /api/v1/finance/costs/:costId/allocations
   *
   * Updates all allocations for a cost in one operation.
   * Use this when editing the allocation distribution.
   *
   * @param costId - Cost UUID
   * @param payload - Array of allocation updates
   * @returns Updated cost entity with allocations
   */
  updateBulk: async (
    costId: string,
    payload: ConvertToAllocatedDto["allocations"],
    options?: { rowVersion?: number },
  ): Promise<ProjectCostEntity> => {
    const { data } = await apiClient.put(
      `${BASE_URL}/costs/${costId}/allocations`,
      {
        allocations: payload,
        ...(typeof options?.rowVersion === "number"
          ? { rowVersion: options.rowVersion }
          : {}),
      },
    );
    return data;
  },

  /**
   * Delete all allocations for a cost
   * DELETE /api/v1/finance/costs/:costId/allocations
   *
   * Removes all allocations from a cost, converting it back to a single-project cost.
   *
   * @param costId - Cost UUID
   * @returns Updated cost entity without allocations
   */
  deleteAllForCost: async (
    costId: string,
    options?: { projectId?: string; rowVersion?: number },
  ): Promise<ProjectCostEntity> => {
    const { data } = await apiClient.delete(
      `${BASE_URL}/costs/${costId}/allocations`,
      {
        params: {
          ...(options?.projectId ? { projectId: options.projectId } : {}),
          ...(typeof options?.rowVersion === "number"
            ? { rowVersion: options.rowVersion }
            : {}),
        },
      },
    );
    return data;
  },

  /**
   * Convert regular cost to allocated cost
   * POST /api/v1/finance/costs/:costId/convert-to-allocated
   *
   * Transforms a single-project cost into a multi-project allocated cost.
   *
   * @param costId - Cost UUID
   * @param payload - Conversion data with initial allocations
   * @returns Updated cost entity with allocations
   */
  convertToAllocated: async (
    costId: string,
    payload: ConvertToAllocatedDto,
    options?: { rowVersion?: number },
  ): Promise<ProjectCostEntity> => {
    const { data } = await apiClient.post(
      `${BASE_URL}/costs/${costId}/convert-to-allocated`,
      {
        ...payload,
        ...(typeof options?.rowVersion === "number"
          ? { rowVersion: options.rowVersion }
          : {}),
      },
    );
    return data;
  },
};

/**
 * Combined Finance API
 * Provides access to all finance-related endpoints
 */
export const financeApi = {
  categories: costCategoryApi,
  costs: projectCostApi,
  statistics: financeStatisticsApi,
  allocations: costAllocationApi,
};

// Default export
export default financeApi;
