/**
 * Finance Custom Hooks
 *
 * React Query hooks for Finance module operations.
 * Handles data fetching, caching, mutations, and optimistic updates.
 *
 * Hook Categories:
 * - Cost Categories: CRUD operations + tree management
 * - Project Costs: CRUD operations + approval workflow
 * - Analytics: Project cost summaries and statistics
 *
 * @module useFinance
 */

import { useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  UseQueryOptions,
} from "@tanstack/react-query";
import { showToast } from "@/lib/toast";
import { useTranslation } from "@/i18n/useTranslation";
import { financeApi } from "@/services/api/finance.api";
import { normalizeQueryFilters } from "@/lib/query-filters";
import type {
  // Cost Category Types
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

  // Allocation Types
  ConvertToAllocatedDto,
} from "@/types/finance.types";

// ============================================================================
// QUERY KEYS - Organized for efficient cache invalidation
// ============================================================================

/**
 * Cost Category Query Keys
 * Hierarchical structure for granular cache control
 */
export const COST_CATEGORY_KEYS = {
  all: ["finance", "categories"] as const,
  lists: () => [...COST_CATEGORY_KEYS.all, "list"] as const,
  list: (filters: Partial<CostCategoryFiltersDto>) =>
    [...COST_CATEGORY_KEYS.lists(), filters] as const,
  tree: () => [...COST_CATEGORY_KEYS.all, "tree"] as const,
  details: () => [...COST_CATEGORY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...COST_CATEGORY_KEYS.details(), id] as const,
};

/**
 * Project Cost Query Keys
 */
export const PROJECT_COST_KEYS = {
  all: ["finance", "costs"] as const,
  lists: () => [...PROJECT_COST_KEYS.all, "list"] as const,
  list: (filters: Partial<ProjectCostFiltersDto>) =>
    [...PROJECT_COST_KEYS.lists(), filters] as const,
  byProject: (projectId: string) =>
    [...PROJECT_COST_KEYS.lists(), { projectId }] as const,
  details: () => [...PROJECT_COST_KEYS.all, "detail"] as const,
  detail: (id: string) => [...PROJECT_COST_KEYS.details(), id] as const,
  summary: (projectId: string) =>
    [...PROJECT_COST_KEYS.all, "summary", projectId] as const,
};

const DASHBOARD_STATISTICS_KEY = ["dashboard-statistics"] as const;

type DeleteByIdInput = string | { id: string; rowVersion?: number };

const parseDeleteByIdInput = (input: DeleteByIdInput) =>
  typeof input === "string" ? { id: input, rowVersion: undefined } : input;

// ============================================================================
// COST CATEGORY HOOKS
// ============================================================================

/**
 * Fetch all cost categories with filters
 *
 * @param filters - Filter and pagination parameters
 * @param options - React Query options for customization
 * @returns Query result with categories list
 *
 * @example
 * const { data, isLoading } = useCostCategories({
 *   page: 1,
 *   limit: 10,
 *   isActive: true,
 * });
 */
export const useCostCategories = (
  filters: CostCategoryFiltersDto = {},
  options?: Partial<UseQueryOptions<CostCategoryListResponse>>,
) => {
  const normalizedFilters = useMemo(
    () => normalizeQueryFilters(filters),
    [filters],
  );

  return useQuery({
    queryKey: COST_CATEGORY_KEYS.list(normalizedFilters),
    queryFn: () => financeApi.categories.getAll(normalizedFilters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
    ...options,
  });
};

/**
 * Fetch cost category by ID
 *
 * @param id - Category UUID
 * @returns Query result with category details
 */
export const useCostCategory = (id: string) => {
  return useQuery({
    queryKey: COST_CATEGORY_KEYS.detail(id),
    queryFn: () => financeApi.categories.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch all categories as a tree structure
 * Useful for hierarchical displays and category selection
 *
 * @returns Query result with full category tree
 */
export const useCostCategoryTree = () => {
  return useQuery({
    queryKey: COST_CATEGORY_KEYS.tree(),
    queryFn: () => financeApi.categories.getTree(),
    staleTime: 10 * 60 * 1000, // 10 minutes - tree structure changes less frequently
  });
};

/**
 * Create a new cost category
 *
 * @returns Mutation for creating categories
 *
 * @example
 * const createMutation = useCreateCostCategory();
 * createMutation.mutate({
 *   name: 'Materials',
 *   parentId: 'parent-uuid',
 * });
 */
export const useCreateCostCategory = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCostCategoryDto) =>
      financeApi.categories.create(payload),

    onSuccess: (newCategory) => {
      // Invalidate all category lists and tree
      queryClient.invalidateQueries({
        queryKey: COST_CATEGORY_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: COST_CATEGORY_KEYS.tree(),
      });

      // If has parent, invalidate parent details to update children
      if (newCategory.parentId) {
        queryClient.invalidateQueries({
          queryKey: COST_CATEGORY_KEYS.detail(newCategory.parentId),
        });
      }

      showToast.success(t("finance.categories.create.success"));
    },

    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || String(t("finance.categories.create.error"));
      showToast.error(message);
    },
  });
};

/**
 * Update an existing cost category
 *
 * @returns Mutation for updating categories
 */
export const useUpdateCostCategory = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCostCategoryDto }) =>
      financeApi.categories.update(id, data),

    onSuccess: (updatedCategory) => {
      // Invalidate lists and tree
      queryClient.invalidateQueries({
        queryKey: COST_CATEGORY_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: COST_CATEGORY_KEYS.tree(),
      });

      // Update specific category cache
      queryClient.setQueryData(
        COST_CATEGORY_KEYS.detail(updatedCategory.id),
        updatedCategory,
      );

      // If parent changed, invalidate old and new parent
      if (updatedCategory.parentId) {
        queryClient.invalidateQueries({
          queryKey: COST_CATEGORY_KEYS.detail(updatedCategory.parentId),
        });
      }

      showToast.success(t("finance.categories.update.success"));
    },

    onError: (error: unknown, variables) => {
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 409) {
        queryClient.invalidateQueries({
          queryKey: COST_CATEGORY_KEYS.detail(variables.id),
        });
      }
      const message =
        status === 409
          ? String(
              t("common.rowVersionConflict", {
                defaultValue:
                  "تم تعديل الفئة بواسطة مستخدم آخر. أعد تحميل الصفحة ثم حاول مرة أخرى.",
              }),
            )
          : (error as { response?: { data?: { message?: string } } }).response
                ?.data?.message || String(t("finance.categories.update.error"));
      showToast.error(message);
    },
  });
};

/**
 * Delete a cost category
 *
 * Note: Cannot delete categories with associated costs
 *
 * @returns Mutation for deleting categories
 */
export const useDeleteCostCategory = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteByIdInput) => {
      const { id, rowVersion } = parseDeleteByIdInput(input);
      return financeApi.categories.delete(id, { rowVersion });
    },

    onSuccess: (_, input) => {
      const { id } = parseDeleteByIdInput(input);
      // Invalidate all lists and tree
      queryClient.invalidateQueries({
        queryKey: COST_CATEGORY_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: COST_CATEGORY_KEYS.tree(),
      });

      // Remove from cache
      queryClient.removeQueries({
        queryKey: COST_CATEGORY_KEYS.detail(id),
      });

      showToast.success(t("finance.categories.delete.success"));
    },

    onError: (error: unknown, input) => {
      const { id } = parseDeleteByIdInput(input);
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 409) {
        queryClient.invalidateQueries({
          queryKey: COST_CATEGORY_KEYS.detail(id),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || String(t("finance.categories.delete.error"));
      showToast.error(message);
    },
  });
};

// ============================================================================
// PROJECT COST HOOKS
// ============================================================================

/**
 * Fetch all project costs with filters
 *
 * @param filters - Filter and pagination parameters
 * @returns Query result with costs list
 *
 * @example
 * const { data, isLoading } = useProjectCosts({
 *   projectId: 'project-uuid',
 *   paymentStatus: PaymentStatus.PENDING,
 *   page: 1,
 *   limit: 20,
 * });
 */
export const useProjectCosts = (
  filters: ProjectCostFiltersDto = {},
  options?: Partial<UseQueryOptions<ProjectCostListResponse>>,
) => {
  const normalizedFilters = useMemo(
    () => normalizeQueryFilters(filters),
    [filters],
  );

  return useQuery({
    queryKey: PROJECT_COST_KEYS.list(normalizedFilters),
    queryFn: () => financeApi.costs.getAll(normalizedFilters),
    staleTime: 2 * 60 * 1000, // 2 minutes - costs change more frequently
    placeholderData: keepPreviousData, // Keep showing old data while loading new data
    ...options,
  });
};

/**
 * Fetch costs for a specific project
 * Convenience hook for project-specific cost queries
 *
 * @param projectId - Project UUID
 * @param additionalFilters - Additional filter parameters
 * @returns Query result with project costs
 */
export const useProjectCostsByProject = (
  projectId: string,
  additionalFilters: Partial<ProjectCostFiltersDto> = {},
) => {
  return useQuery({
    queryKey: PROJECT_COST_KEYS.byProject(projectId),
    queryFn: () => financeApi.costs.getByProject(projectId, additionalFilters),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Fetch project cost by ID
 *
 * @param id - Cost UUID
 * @returns Query result with cost details
 */
export const useProjectCost = (id: string) => {
  return useQuery({
    queryKey: PROJECT_COST_KEYS.detail(id),
    queryFn: () => financeApi.costs.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Create a new project cost
 *
 * @returns Mutation for creating costs
 *
 * @example
 * const createMutation = useCreateProjectCost();
 * createMutation.mutate({
 *   projectId: 'project-uuid',
 *   costType: CostType.MATERIAL,
 *   amount: 15000,
 *   description: 'Construction materials',
 *   transactionDate: '2026-01-15',
 * });
 */
export const useCreateProjectCost = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectCostDto) =>
      financeApi.costs.create(payload),

    onSuccess: (newCost) => {
      // Invalidate all cost lists
      queryClient.invalidateQueries({
        queryKey: PROJECT_COST_KEYS.lists(),
      });

      // Invalidate project-specific data
      if (newCost.projectId) {
        queryClient.invalidateQueries({
          queryKey: PROJECT_COST_KEYS.byProject(newCost.projectId),
        });
        queryClient.invalidateQueries({
          queryKey: PROJECT_COST_KEYS.summary(newCost.projectId),
        });
      }
      invalidateFinanceStatisticsAndDashboard(queryClient);

      showToast.success(t("finance.costs.create.success"));
    },

    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || String(t("finance.costs.create.error"));
      showToast.error(message);
    },
  });
};

/**
 * Update an existing project cost
 *
 * Note: Can only update costs with PENDING status
 *
 * @returns Mutation for updating costs
 */
export const useUpdateProjectCost = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectCostDto }) =>
      financeApi.costs.update(id, data),

    onSuccess: (updatedCost) => {
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: PROJECT_COST_KEYS.lists(),
      });

      // Update specific cost cache
      queryClient.setQueryData(
        PROJECT_COST_KEYS.detail(updatedCost.id),
        updatedCost,
      );

      // Invalidate project summary
      if (updatedCost.projectId) {
        queryClient.invalidateQueries({
          queryKey: PROJECT_COST_KEYS.summary(updatedCost.projectId),
        });
      }
      invalidateFinanceStatisticsAndDashboard(queryClient);

      showToast.success(t("finance.costs.update.success"));
    },

    onError: (error: unknown, variables) => {
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 409) {
        queryClient.invalidateQueries({
          queryKey: PROJECT_COST_KEYS.detail(variables.id),
        });
      }
      const message =
        status === 409
          ? String(
              t("common.rowVersionConflict", {
                defaultValue:
                  "تم تعديل التكلفة بواسطة مستخدم آخر. أعد تحميل الصفحة ثم حاول مرة أخرى.",
              }),
            )
          : (error as { response?: { data?: { message?: string } } }).response
                ?.data?.message || String(t("finance.costs.update.error"));
      showToast.error(message);
    },
  });
};

/**
 * Delete a project cost
 *
 * Note: Cannot delete costs with PAID status
 *
 * @returns Mutation for deleting costs
 */
export const useDeleteProjectCost = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteByIdInput) => {
      const { id, rowVersion } = parseDeleteByIdInput(input);
      return financeApi.costs.delete(id, { rowVersion });
    },

    onSuccess: (_, input) => {
      const { id } = parseDeleteByIdInput(input);
      // Get the cost from cache to access projectId
      const costData = queryClient.getQueryData<ProjectCostEntity>(
        PROJECT_COST_KEYS.detail(id),
      );

      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: PROJECT_COST_KEYS.lists(),
      });

      // Remove from cache
      queryClient.removeQueries({
        queryKey: PROJECT_COST_KEYS.detail(id),
      });

      // Invalidate project summary if we have projectId
      if (costData?.projectId) {
        queryClient.invalidateQueries({
          queryKey: PROJECT_COST_KEYS.summary(costData.projectId),
        });
      }
      invalidateFinanceStatisticsAndDashboard(queryClient);

      showToast.success(t("finance.costs.delete.success"));
    },

    onError: (error: unknown, input) => {
      const { id } = parseDeleteByIdInput(input);
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 409) {
        queryClient.invalidateQueries({
          queryKey: PROJECT_COST_KEYS.detail(id),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || String(t("finance.costs.delete.error"));
      showToast.error(message);
    },
  });
};

// ============================================================================
// APPROVAL WORKFLOW HOOKS
// ============================================================================

/**
 * Approve a project cost
 * Changes status from PENDING to APPROVED or PAID
 *
 * @returns Mutation for approving costs
 *
 * @example
 * const approveMutation = useApproveProjectCost();
 * approveMutation.mutate({
 *   id: 'cost-uuid',
 *   data: {
 *     notes: 'Approved by manager',
 *     paidDate: '2026-01-17',
 *     paymentMethod: 'Bank Transfer',
 *   },
 * });
 */
export const useApproveProjectCost = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ApproveProjectCostDto }) =>
      financeApi.costs.approve(id, data),

    onSuccess: (approvedCost) => {
      // Invalidate all lists (status changed, affects filters)
      queryClient.invalidateQueries({
        queryKey: PROJECT_COST_KEYS.lists(),
      });

      // Update specific cost cache
      queryClient.setQueryData(
        PROJECT_COST_KEYS.detail(approvedCost.id),
        approvedCost,
      );

      // Invalidate project summary (affects statistics)
      if (approvedCost.projectId) {
        queryClient.invalidateQueries({
          queryKey: PROJECT_COST_KEYS.summary(approvedCost.projectId),
        });
      }
      invalidateFinanceStatisticsAndDashboard(queryClient);

      showToast.success(t("finance.costs.approve.success"));
    },

    onError: (error: unknown, variables) => {
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 409) {
        queryClient.invalidateQueries({
          queryKey: PROJECT_COST_KEYS.detail(variables.id),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || String(t("finance.costs.approve.error"));
      showToast.error(message);
    },
  });
};

/**
 * Reject a project cost
 * Changes status from PENDING to REJECTED with reason
 *
 * @returns Mutation for rejecting costs
 */
export const useRejectProjectCost = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectProjectCostDto }) =>
      financeApi.costs.reject(id, data),

    onSuccess: (rejectedCost) => {
      // Invalidate all lists
      queryClient.invalidateQueries({
        queryKey: PROJECT_COST_KEYS.lists(),
      });

      // Update specific cost cache
      queryClient.setQueryData(
        PROJECT_COST_KEYS.detail(rejectedCost.id),
        rejectedCost,
      );

      // Invalidate project summary
      if (rejectedCost.projectId) {
        queryClient.invalidateQueries({
          queryKey: PROJECT_COST_KEYS.summary(rejectedCost.projectId),
        });
      }
      invalidateFinanceStatisticsAndDashboard(queryClient);

      showToast.success(t("finance.costs.reject.success"));
    },

    onError: (error: unknown, variables) => {
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 409) {
        queryClient.invalidateQueries({
          queryKey: PROJECT_COST_KEYS.detail(variables.id),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || String(t("finance.costs.reject.error"));
      showToast.error(message);
    },
  });
};

// ============================================================================
// ANALYTICS & REPORTS HOOKS
// ============================================================================

/**
 * Finance Statistics Query Keys
 */
export const FINANCE_STATISTICS_KEYS = {
  all: ["finance", "statistics"] as const,
  overview: (dateRange?: { startDate?: string; endDate?: string }) =>
    [...FINANCE_STATISTICS_KEYS.all, "overview", dateRange] as const,
};

const invalidateFinanceStatisticsAndDashboard = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: FINANCE_STATISTICS_KEYS.all });
  queryClient.invalidateQueries({ queryKey: DASHBOARD_STATISTICS_KEY });
};

/**
 * Fetch finance statistics for dashboard
 * Returns aggregated financial data including trends, breakdowns, and metrics
 *
 * @param dateRange - Optional date range filter
 * @returns Query result with comprehensive finance statistics
 *
 * @example
 * const { data: stats, isLoading } = useFinanceStatistics();
 * // With date range:
 * const { data: stats } = useFinanceStatistics({
 *   startDate: '2026-01-01',
 *   endDate: '2026-01-31'
 * });
 */
export const useFinanceStatistics = (dateRange?: {
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: FINANCE_STATISTICS_KEYS.overview(dateRange),
    queryFn: () => financeApi.statistics.getFinanceStatistics(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes - statistics are computed
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
};

/**
 * Fetch project cost summary with statistics
 *
 * @param projectId - Project UUID
 * @returns Query result with comprehensive cost summary
 *
 * @example
 * const { data: summary, isLoading } = useProjectCostSummary('project-uuid');
 * // Access: summary.totalAmount, summary.costTypeBreakdown, etc.
 */
export const useProjectCostSummary = (projectId: string) => {
  return useQuery({
    queryKey: PROJECT_COST_KEYS.summary(projectId),
    queryFn: () => financeApi.costs.getProjectSummary(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes - summary data is computed
  });
};

// ============================================================================
// COST ALLOCATION HOOKS
// ============================================================================

/**
 * Cost Allocation Query Keys
 */
export const COST_ALLOCATION_KEYS = {
  all: ["finance", "allocations"] as const,
  byCost: (costId: string) =>
    [...COST_ALLOCATION_KEYS.all, "byCost", costId] as const,
};

/**
 * Fetch allocations for a specific cost
 */
export const useCostAllocations = (costId: string) => {
  return useQuery({
    queryKey: COST_ALLOCATION_KEYS.byCost(costId),
    queryFn: () => financeApi.allocations.getByCostId(costId),
    enabled: !!costId,
    staleTime: 3 * 60 * 1000,
  });
};

/**
 * Replace all allocations for a cost in one atomic operation.
 */
export const useUpdateCostAllocations = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      costId,
      data,
      rowVersion,
    }: {
      costId: string;
      data: ConvertToAllocatedDto["allocations"];
      rowVersion?: number;
    }) => financeApi.allocations.updateBulk(costId, data, { rowVersion }),

    onSuccess: (_, { costId }) => {
      queryClient.invalidateQueries({
        queryKey: COST_ALLOCATION_KEYS.byCost(costId),
      });
      queryClient.invalidateQueries({
        queryKey: PROJECT_COST_KEYS.detail(costId),
      });
      invalidateFinanceStatisticsAndDashboard(queryClient);
      showToast.success(t("finance.allocations.update.success"));
    },

    onError: (error: unknown, variables) => {
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 409) {
        queryClient.invalidateQueries({
          queryKey: PROJECT_COST_KEYS.detail(variables.costId),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const err = error as { response?: { data?: { message?: string } } };
      showToast.error(
        err.response?.data?.message || t("finance.allocations.update.error"),
      );
    },
  });
};

/**
 * Delete all allocations for a cost, optionally converting it back to a
 * single-project cost if `projectId` is provided.
 */
export const useDeleteCostAllocations = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      costId,
      projectId,
      rowVersion,
    }: {
      costId: string;
      projectId?: string;
      rowVersion?: number;
    }) =>
      financeApi.allocations.deleteAllForCost(costId, {
        projectId,
        rowVersion,
      }),

    onSuccess: (_, { costId }) => {
      queryClient.invalidateQueries({
        queryKey: COST_ALLOCATION_KEYS.byCost(costId),
      });
      queryClient.invalidateQueries({
        queryKey: PROJECT_COST_KEYS.detail(costId),
      });
      invalidateFinanceStatisticsAndDashboard(queryClient);
      showToast.success(t("finance.allocations.delete.success"));
    },

    onError: (error: unknown, variables) => {
      const err = error as { response?: { data?: { message?: string } } };
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 409) {
        queryClient.invalidateQueries({
          queryKey: PROJECT_COST_KEYS.detail(variables.costId),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      showToast.error(
        err.response?.data?.message || t("finance.allocations.delete.error"),
      );
    },
  });
};

/**
 * Convert regular cost to allocated cost
 */
export const useConvertToAllocated = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      costId,
      data,
      rowVersion,
    }: {
      costId: string;
      data: ConvertToAllocatedDto;
      rowVersion?: number;
    }) => financeApi.allocations.convertToAllocated(costId, data, { rowVersion }),

    onSuccess: (_, { costId }) => {
      queryClient.invalidateQueries({
        queryKey: PROJECT_COST_KEYS.detail(costId),
      });
      queryClient.invalidateQueries({
        queryKey: PROJECT_COST_KEYS.lists(),
      });
      invalidateFinanceStatisticsAndDashboard(queryClient);
      showToast.success(t("finance.allocations.convert.success"));
    },

    onError: (error: unknown, variables) => {
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 409) {
        queryClient.invalidateQueries({
          queryKey: PROJECT_COST_KEYS.detail(variables.costId),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const err = error as { response?: { data?: { message?: string } } };
      showToast.error(
        err.response?.data?.message || t("finance.allocations.convert.error"),
      );
    },
  });
};

// Backward-compatible aliases for old hook names used in some screens.
export const useUpdateAllocation = useUpdateCostAllocations;
export const useDeleteAllocation = useDeleteCostAllocations;
