/**
 * Assets Custom Hooks
 * React Query hooks for managing assets data
 */

import { useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import { showToast } from "@/lib/toast";
import { useNavigate } from "react-router-dom";
import { assetsApi } from "@/services/api/assets.api";
import { normalizeQueryFilters } from "@/lib/query-filters";
import { useTranslation } from "@/i18n/useTranslation";
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

// ===================================
// QUERY KEYS
// ===================================

/**
 * Centralized query keys for React Query cache management
 * Follows hierarchical structure for granular invalidation
 */
export const ASSETS_KEYS = {
  all: ["assets"] as const,
  lists: () => [...ASSETS_KEYS.all, "list"] as const,
  list: (filters: Partial<AssetFiltersDto>) =>
    [...ASSETS_KEYS.lists(), filters] as const,
  details: () => [...ASSETS_KEYS.all, "detail"] as const,
  detail: (id: string) => [...ASSETS_KEYS.details(), id] as const,

  // Statistics keys
  statistics: () => [...ASSETS_KEYS.all, "statistics"] as const,
  statisticsWithParams: (params?: AssetsStatisticsParams) =>
    params
      ? ([...ASSETS_KEYS.statistics(), params] as const)
      : ASSETS_KEYS.statistics(),

  // Assignment keys
  employeeAssignments: (assetId: string) =>
    [...ASSETS_KEYS.detail(assetId), "employees"] as const,
  projectAssignments: (assetId: string) =>
    [...ASSETS_KEYS.detail(assetId), "projects"] as const,

  // Maintenance keys
  maintenance: () => [...ASSETS_KEYS.all, "maintenance"] as const,
  maintenanceList: (assetId: string) =>
    [...ASSETS_KEYS.maintenance(), assetId] as const,
  maintenanceDetail: (assetId: string, maintenanceId: string) =>
    [...ASSETS_KEYS.maintenanceList(assetId), maintenanceId] as const,

  // Documents keys
  documents: (assetId: string) =>
    [...ASSETS_KEYS.detail(assetId), "documents"] as const,
};

const getApiErrorMessage = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object") return undefined;

  const candidate = error as {
    response?: { data?: { message?: unknown } };
    message?: unknown;
  };

  const backendMessage = candidate.response?.data?.message;
  if (typeof backendMessage === "string" && backendMessage.trim().length > 0) {
    return backendMessage;
  }

  if (typeof candidate.message === "string" && candidate.message.trim().length > 0) {
    return candidate.message;
  }

  return undefined;
};

const isOptimisticLockConflict = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const status = (error as { response?: { status?: number } }).response?.status;
  return status === 409;
};

type DeleteAssetInput = string | { id: string; rowVersion?: number };

const parseDeleteAssetInput = (input: DeleteAssetInput) =>
  typeof input === "string" ? { id: input, rowVersion: undefined } : input;

// ===================================
// ASSET QUERY HOOKS
// ===================================

/**
 * Fetch paginated assets list with filters
 *
 * @param filters - Search, filter, and pagination parameters
 * @param options - Additional React Query options
 * @returns Query result with assets list
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useAssets({
 *   search: 'Toyota',
 *   status: AssetStatus.AVAILABLE,
 *   page: 1,
 *   limit: 20
 * });
 * ```
 */
export const useAssets = (
  filters: AssetFiltersDto = {},
  options?: Omit<UseQueryOptions<AssetsListResponse>, "queryKey" | "queryFn">,
) => {
  const normalizedFilters = useMemo(
    () => normalizeQueryFilters(filters),
    [filters],
  );

  return useQuery({
    queryKey: ASSETS_KEYS.list(normalizedFilters),
    queryFn: () => assetsApi.getAll(normalizedFilters),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    placeholderData: keepPreviousData,
    ...options,
  });
};

/**
 * Fetch single asset by ID with all relations
 *
 * @param id - Asset UUID
 * @param options - Additional React Query options
 * @returns Query result with complete asset details
 *
 * @example
 * ```tsx
 * const { data: asset, isLoading } = useAsset(assetId);
 * if (asset) {
 *   console.log(asset.assignedEmployees);
 *   console.log(asset.maintenanceRequests);
 * }
 * ```
 */
export const useAsset = (
  id: string,
  options?: Omit<UseQueryOptions<AssetDetailsResponse>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: ASSETS_KEYS.detail(id),
    queryFn: () => assetsApi.getById(id),
    enabled: !!id,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    ...options,
  });
};

/**
 * Fetch comprehensive asset statistics for dashboard
 *
 * Features:
 * - Real-time asset inventory and valuation
 * - Status and type distribution
 * - Location and age analytics
 * - Manufacturer breakdown
 * - Monthly acquisition trends
 *
 * Performance:
 * - 5-minute cache to reduce API calls
 * - Automatic background refetch
 * - Retry logic for network failures
 *
 * @param params - Optional filters (date range, type, status, location)
 * @param options - Additional React Query options
 * @returns Query result with complete statistics
 *
 * @example
 * ```tsx
 * // Get all-time statistics
 * const { data, isLoading } = useAssetsStatistics();
 *
 * // Get statistics for current year
 * const { data } = useAssetsStatistics({
 *   startDate: '2026-01-01',
 *   endDate: '2026-12-31'
 * });
 *
 * // Filter by vehicle assets only
 * const { data } = useAssetsStatistics({
 *   assetType: 'VEHICLE'
 * });
 * ```
 */
export const useAssetsStatistics = (
  params?: AssetsStatisticsParams,
  options?: Omit<UseQueryOptions<AssetsStatistics>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: ASSETS_KEYS.statisticsWithParams(params),
    queryFn: () => assetsApi.statistics.getAssetsStatistics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes - statistics don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    retry: 3, // Retry failed requests
    ...options,
  });
};

// ===================================
// ASSET MUTATION HOOKS
// ===================================

/**
 * Create new asset
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * ```tsx
 * const createAsset = useCreateAsset();
 *
 * const handleSubmit = (data: CreateAssetDto) => {
 *   createAsset.mutate(data, {
 *     onSuccess: (asset) => {
 *       console.log('Created asset:', asset.assetNumber);
 *     }
 *   });
 * };
 * ```
 */
export const useCreateAsset = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: assetsApi.create,
    onSuccess: (newAsset) => {
      // Invalidate lists to show new asset
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.statistics() });

      // Show success message
      showToast.success(
        t("assets.create.success", {
          defaultValue: "Asset created successfully",
        }),
      );

      // Navigate to asset details
      navigate(`/assets/${newAsset.id}`);
    },
    onError: (error: unknown, variables) => {
      const message =
        getApiErrorMessage(error) ||
        String(t("assets.create.error", {
          defaultValue: "Failed to create asset",
        }));
      showToast.error(message);
    },
  });
};

/**
 * Update existing asset
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * ```tsx
 * const updateAsset = useUpdateAsset();
 *
 * const handleUpdate = () => {
 *   updateAsset.mutate(
 *     { id: assetId, data: updateData },
 *     {
 *       onSuccess: () => {
 *         console.log('Asset updated');
 *       }
 *     }
 *   );
 * };
 * ```
 */
export const useUpdateAsset = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetDto }) =>
      assetsApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.statistics() });

      showToast.success(
        t("assets.update.success", {
          defaultValue: "Asset updated successfully",
        }),
      );
    },
    onError: (error: unknown, variables) => {
      const message = isOptimisticLockConflict(error)
        ? String(
            t("common.rowVersionConflict"),
          )
        : getApiErrorMessage(error) ||
          String(t("assets.update.error", {
            defaultValue: "Failed to update asset",
          }));
      if (isOptimisticLockConflict(error)) {
        queryClient.invalidateQueries({
          queryKey: ASSETS_KEYS.detail(variables.id),
        });
      }
      showToast.error(message);
    },
  });
};

/**
 * Delete asset (soft delete)
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * ```tsx
 * const deleteAsset = useDeleteAsset();
 *
 * const handleDelete = () => {
 *     deleteAsset.mutate(assetId);
 *   }
 * };
 * ```
 */
export const useDeleteAsset = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (input: DeleteAssetInput) => {
      const { id, rowVersion } = parseDeleteAssetInput(input);
      return assetsApi.delete(id, { rowVersion });
    },
    onSuccess: () => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.statistics() });

      showToast.success(
        t("assets.delete.success", {
          defaultValue: "Asset deleted successfully",
        }),
      );

      // Navigate back to list
      navigate("/assets");
    },
    onError: (error: unknown, variables) => {
      const { id } = parseDeleteAssetInput(variables);
      if (isOptimisticLockConflict(error)) {
        queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.detail(id) });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        getApiErrorMessage(error) ||
        String(t("assets.delete.error", {
          defaultValue: "Failed to delete asset",
        }));
      showToast.error(message);
    },
  });
};

// ===================================
// EMPLOYEE ASSIGNMENT HOOKS
// ===================================

/**
 * Fetch employee assignments for an asset
 */
export const useEmployeeAssignments = (assetId: string) => {
  return useQuery({
    queryKey: ASSETS_KEYS.employeeAssignments(assetId),
    queryFn: () => assetsApi.getEmployeeAssignments(assetId),
    enabled: !!assetId,
    staleTime: 30000,
  });
};

/**
 * Assign employee to asset
 */
export const useAssignEmployee = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assetId,
      data,
    }: {
      assetId: string;
      data: AssignEmployeeToAssetDto;
    }) => assetsApi.assignEmployee(assetId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.employeeAssignments(variables.assetId),
      });
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.detail(variables.assetId),
      });

      showToast.success(
        t("assets.assign.employee.success", {
          defaultValue: "Employee assigned successfully",
        }),
      );
    },
    onError: (error: unknown, variables) => {
      if (isOptimisticLockConflict(error)) {
        queryClient.invalidateQueries({
          queryKey: ASSETS_KEYS.employeeAssignments(variables.assetId),
        });
        queryClient.invalidateQueries({
          queryKey: ASSETS_KEYS.detail(variables.assetId),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        getApiErrorMessage(error) ||
        String(t("assets.assign.employee.error", {
          defaultValue: "Failed to assign employee",
        }));
      showToast.error(message);
    },
  });
};

/**
 * Unassign employee from asset
 */
export const useUnassignEmployee = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assetId,
      employeeId,
    }: {
      assetId: string;
      employeeId: string;
    }) => assetsApi.unassignEmployee(assetId, employeeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.employeeAssignments(variables.assetId),
      });
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.detail(variables.assetId),
      });

      showToast.success(
        t("assets.unassign.employee.success", {
          defaultValue: "Employee unassigned successfully",
        }),
      );
    },
    onError: (error: unknown, variables) => {
      if (isOptimisticLockConflict(error)) {
        queryClient.invalidateQueries({
          queryKey: ASSETS_KEYS.detail(variables.assetId),
        });
        showToast.error(
          t("common.rowVersionConflict"),
        );
        return;
      }
      showToast.error(getApiErrorMessage(error) || String(t("common.error")));
    },
  });
};

// ===================================
// PROJECT ASSIGNMENT HOOKS
// ===================================

/**
 * Fetch project assignments for an asset
 */
export const useProjectAssignments = (assetId: string) => {
  return useQuery({
    queryKey: ASSETS_KEYS.projectAssignments(assetId),
    queryFn: () => assetsApi.getProjectAssignments(assetId),
    enabled: !!assetId,
    staleTime: 30000,
  });
};

/**
 * Assign asset to project
 */
export const useAssignToProject = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assetId,
      data,
    }: {
      assetId: string;
      data: AssignAssetToProjectDto;
    }) => assetsApi.assignToProject(assetId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.projectAssignments(variables.assetId),
      });
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.detail(variables.assetId),
      });

      showToast.success(
        t("assets.assign.project.success", {
          defaultValue: "Asset assigned to project successfully",
        }),
      );
    },
    onError: (error: unknown, variables) => {
      if (isOptimisticLockConflict(error)) {
        queryClient.invalidateQueries({
          queryKey: ASSETS_KEYS.projectAssignments(variables.assetId),
        });
        queryClient.invalidateQueries({
          queryKey: ASSETS_KEYS.detail(variables.assetId),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        getApiErrorMessage(error) ||
        String(t("assets.assign.project.error", {
          defaultValue: "Failed to assign to project",
        }));
      showToast.error(message);
    },
  });
};

/**
 * Unassign asset from project
 */
export const useUnassignFromProject = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assetId,
      projectId,
    }: {
      assetId: string;
      projectId: string;
    }) => assetsApi.unassignFromProject(assetId, projectId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.projectAssignments(variables.assetId),
      });
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.detail(variables.assetId),
      });

      showToast.success(
        t("assets.unassign.project.success", {
          defaultValue: "Asset unassigned from project successfully",
        }),
      );
    },
    onError: (error: unknown, variables) => {
      if (isOptimisticLockConflict(error)) {
        queryClient.invalidateQueries({
          queryKey: ASSETS_KEYS.projectAssignments(variables.assetId),
        });
        queryClient.invalidateQueries({
          queryKey: ASSETS_KEYS.detail(variables.assetId),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      showToast.error(getApiErrorMessage(error) || String(t("common.error")));
    },
  });
};

// ===================================
// MAINTENANCE HOOKS
// ===================================

/**
 * Fetch maintenance requests for an asset
 */
export const useMaintenanceRequests = (assetId: string) => {
  return useQuery({
    queryKey: ASSETS_KEYS.maintenanceList(assetId),
    queryFn: () => assetsApi.getMaintenanceRequests(assetId),
    enabled: !!assetId,
    staleTime: 30000,
  });
};

/**
 * Fetch single maintenance request
 */
export const useMaintenanceRequest = (
  assetId: string,
  maintenanceId: string,
) => {
  return useQuery({
    queryKey: ASSETS_KEYS.maintenanceDetail(assetId, maintenanceId),
    queryFn: () => assetsApi.getMaintenanceRequest(assetId, maintenanceId),
    enabled: !!assetId && !!maintenanceId,
    staleTime: 60000,
  });
};

/**
 * Create maintenance request
 */
export const useCreateMaintenanceRequest = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assetId,
      data,
    }: {
      assetId: string;
      data: CreateMaintenanceRequestDto;
    }) => assetsApi.createMaintenanceRequest(assetId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.maintenanceList(variables.assetId),
      });
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.detail(variables.assetId),
      });

      showToast.success(
        t("assets.maintenance.create.success", {
          defaultValue: "Maintenance request created successfully",
        }),
      );
    },
    onError: (error: unknown) => {
      const message =
        getApiErrorMessage(error) ||
        String(t("assets.maintenance.create.error", {
          defaultValue: "Failed to create maintenance request",
        }));
      showToast.error(message);
    },
  });
};

/**
 * Update maintenance request
 */
export const useUpdateMaintenanceRequest = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assetId,
      maintenanceId,
      data,
    }: {
      assetId: string;
      maintenanceId: string;
      data: UpdateMaintenanceRequestDto;
    }) => assetsApi.updateMaintenanceRequest(assetId, maintenanceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.maintenanceList(variables.assetId),
      });
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.maintenanceDetail(
          variables.assetId,
          variables.maintenanceId,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.detail(variables.assetId),
      });

      showToast.success(
        t("assets.maintenance.update.success", {
          defaultValue: "Maintenance request updated successfully",
        }),
      );
    },
    onError: (error: unknown) => {
      showToast.error(getApiErrorMessage(error) || String(t("common.error")));
    },
  });
};

/**
 * Delete maintenance request
 */
export const useDeleteMaintenanceRequest = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assetId,
      maintenanceId,
    }: {
      assetId: string;
      maintenanceId: string;
    }) => assetsApi.deleteMaintenanceRequest(assetId, maintenanceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.maintenanceList(variables.assetId),
      });
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.detail(variables.assetId),
      });

      showToast.success(
        t("assets.maintenance.delete.success", {
          defaultValue: "Maintenance request deleted successfully",
        }),
      );
    },
    onError: (error: unknown) => {
      showToast.error(getApiErrorMessage(error) || String(t("common.error")));
    },
  });
};

// ===================================
// DOCUMENTS HOOKS
// ===================================

/**
 * Fetch asset documents
 */
export const useAssetDocuments = (assetId: string) => {
  return useQuery({
    queryKey: ASSETS_KEYS.documents(assetId),
    queryFn: () => assetsApi.documents.getAll(assetId),
    enabled: !!assetId,
  });
};

/**
 * Upload asset documents
 */
export const useUploadAssetDocuments = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      assetId,
      files,
      metadata,
    }: {
      assetId: string;
      files: File[];
      metadata: {
        documentType: string;
        documentName: string;
        issueDate?: string;
        expiryDate?: string;
        notes?: string;
      };
    }) => assetsApi.documents.upload(assetId, files, metadata),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.documents(variables.assetId),
      });
      showToast.success(
        t("assets.documents.upload.success", {
          defaultValue: "Documents uploaded successfully",
        }),
      );
    },
    onError: (error: unknown) => {
      showToast.error(
        getApiErrorMessage(error) ||
          String(t("assets.documents.upload.error", {
            defaultValue: "Failed to upload documents",
          })),
      );
    },
  });
};

/**
 * Delete asset document
 */
export const useDeleteAssetDocument = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      assetId,
      documentId,
    }: {
      assetId: string;
      documentId: string;
    }) => assetsApi.documents.delete(assetId, documentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ASSETS_KEYS.documents(variables.assetId),
      });
      showToast.success(
        t("assets.documents.delete.success", {
          defaultValue: "Document deleted successfully",
        }),
      );
    },
    onError: (error: unknown) => {
      showToast.error(
        getApiErrorMessage(error) ||
          String(t("assets.documents.delete.error", {
            defaultValue: "Failed to delete document",
          })),
      );
    },
  });
};

