import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  UseQueryOptions,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { showToast } from "@/lib/toast";
import { useTranslation } from "@/i18n/useTranslation";
import { maintenanceApi } from "@/services/api/maintenance.api";
import { normalizeQueryFilters } from "@/lib/query-filters";
import type {
  CreateMaintenanceRequestDto,
  UpdateMaintenanceRequestDto,
  MaintenanceFiltersDto,
  MaintenanceStatus,
} from "@/types/maintenance.types";
import type {
  MaintenanceStatistics,
  MaintenanceStatisticsParams,
} from "@/types/maintenance-statistics";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const MAINTENANCE_KEYS = {
  all: ["maintenance"] as const,
  lists: () => [...MAINTENANCE_KEYS.all, "list"] as const,
  list: (filters: Partial<MaintenanceFiltersDto>) =>
    [...MAINTENANCE_KEYS.lists(), filters] as const,
  details: () => [...MAINTENANCE_KEYS.all, "detail"] as const,
  detail: (id: string) => [...MAINTENANCE_KEYS.details(), id] as const,
  statistics: () => [...MAINTENANCE_KEYS.all, "statistics"] as const,
  statisticsWithParams: (params?: MaintenanceStatisticsParams) =>
    params
      ? ([...MAINTENANCE_KEYS.statistics(), params] as const)
      : MAINTENANCE_KEYS.statistics(),
  documents: (maintenanceId: string) =>
    [...MAINTENANCE_KEYS.all, "documents", maintenanceId] as const,
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

type DeleteMaintenanceInput = string | { id: string; rowVersion?: number };

const parseDeleteMaintenanceInput = (input: DeleteMaintenanceInput) =>
  typeof input === "string" ? { id: input, rowVersion: undefined } : input;

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch all maintenance requests with filters
 */
export const useMaintenanceList = (filters: MaintenanceFiltersDto = {}) => {
  const normalizedFilters = useMemo(
    () => normalizeQueryFilters(filters),
    [filters],
  );

  return useQuery({
    queryKey: MAINTENANCE_KEYS.list(normalizedFilters),
    queryFn: () => maintenanceApi.getAll(normalizedFilters),
    staleTime: 30000, // 30 seconds
    placeholderData: keepPreviousData, // Keep showing old data while loading new data
  });
};

/**
 * Hook to fetch single maintenance request by ID
 */
export const useMaintenanceDetails = (id: string) => {
  return useQuery({
    queryKey: MAINTENANCE_KEYS.detail(id),
    queryFn: () => maintenanceApi.getById(id),
    enabled: !!id,
    staleTime: 30000,
  });
};

/**
 * Hook to fetch maintenance statistics
 */
export const useMaintenanceStatistics = (
  params?: MaintenanceStatisticsParams,
  options?: Omit<
    UseQueryOptions<MaintenanceStatistics>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: MAINTENANCE_KEYS.statisticsWithParams(params),
    queryFn: () => maintenanceApi.statistics.getMaintenanceStatistics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime)
    refetchOnWindowFocus: true,
    retry: 3,
    ...options,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create new maintenance request
 */
export const useCreateMaintenance = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMaintenanceRequestDto) =>
      maintenanceApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.lists() });
      showToast.success(
        t("maintenance.notifications.createSuccess", {
          number: data.maintenanceNumber,
        }),
      );
    },
    onError: (error: unknown) => {
      showToast.error(
        getApiErrorMessage(error) ||
          String(t("maintenance.notifications.createError")),
      );
    },
  });
};

/**
 * Hook to update maintenance request
 */
export const useUpdateMaintenance = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMaintenanceRequestDto;
    }) => maintenanceApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: MAINTENANCE_KEYS.detail(variables.id),
      });
      showToast.success(
        t("maintenance.notifications.updateSuccess", {
          number: data.maintenanceNumber,
        }),
      );
    },
    onError: (error: unknown, variables) => {
      if (isOptimisticLockConflict(error)) {
        queryClient.invalidateQueries({
          queryKey: MAINTENANCE_KEYS.detail(variables.id),
        });
        showToast.error(
          t("common.rowVersionConflict", {
            defaultValue:
              "تم تعديل طلب الصيانة بواسطة مستخدم آخر. أعد تحميل الصفحة ثم حاول مرة أخرى.",
          }),
        );
        return;
      }
      showToast.error(
        getApiErrorMessage(error) ||
          String(t("maintenance.notifications.updateError")),
      );
    },
  });
};

/**
 * Hook to delete maintenance request
 */
export const useDeleteMaintenance = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteMaintenanceInput) => {
      const { id, rowVersion } = parseDeleteMaintenanceInput(input);
      return maintenanceApi.delete(id, { rowVersion });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.lists() });
      showToast.success(t("maintenance.notifications.deleteSuccess"));
    },
    onError: (error: unknown, input) => {
      const { id } = parseDeleteMaintenanceInput(input);
      if (isOptimisticLockConflict(error)) {
        queryClient.invalidateQueries({
          queryKey: MAINTENANCE_KEYS.detail(id),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      showToast.error(
        getApiErrorMessage(error) ||
          String(t("maintenance.notifications.deleteError")),
      );
    },
  });
};

/**
 * Hook to update maintenance status
 */
export const useUpdateMaintenanceStatus = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      rowVersion,
    }: {
      id: string;
      status: MaintenanceStatus;
      rowVersion?: number;
    }) => maintenanceApi.update(id, { status, rowVersion }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: MAINTENANCE_KEYS.detail(variables.id),
      });
      showToast.success(
        t("maintenance.notifications.updateSuccess", {
          number: data.maintenanceNumber,
        }),
      );
    },
    onError: (error: unknown, variables) => {
      if (isOptimisticLockConflict(error)) {
        queryClient.invalidateQueries({
          queryKey: MAINTENANCE_KEYS.detail(variables.id),
        });
        showToast.error(
          t("common.rowVersionConflict", {
            defaultValue:
              "تم تعديل طلب الصيانة بواسطة مستخدم آخر. أعد تحميل الصفحة ثم حاول مرة أخرى.",
          }),
        );
        return;
      }
      showToast.error(
        getApiErrorMessage(error) ||
          String(t("maintenance.notifications.updateError")),
      );
    },
  });
};

// ============================================================================
// DOCUMENTS HOOKS
// ============================================================================

/**
 * Hook to fetch all documents for a maintenance request
 */
export const useMaintenanceDocuments = (maintenanceId: string) => {
  return useQuery({
    queryKey: MAINTENANCE_KEYS.documents(maintenanceId),
    queryFn: () => maintenanceApi.documents.getAll(maintenanceId),
    enabled: !!maintenanceId,
    staleTime: 30000,
  });
};

/**
 * Hook to upload documents for a maintenance request
 */
export const useUploadMaintenanceDocuments = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      maintenanceId,
      files,
      metadata,
    }: {
      maintenanceId: string;
      files: File[];
      metadata: {
        documentType: string;
        documentName: string;
        issueDate?: string;
        expiryDate?: string;
        notes?: string;
      };
    }) => maintenanceApi.documents.upload(maintenanceId, files, metadata),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: MAINTENANCE_KEYS.documents(variables.maintenanceId),
      });
      showToast.success(
        t("maintenance.documents.upload.success", {
          defaultValue: "Documents uploaded successfully",
        }),
      );
    },
    onError: (error: unknown) => {
      showToast.error(
        getApiErrorMessage(error) ||
          String(t("maintenance.documents.upload.error", {
            defaultValue: "Failed to upload documents",
          })),
      );
    },
  });
};

/**
 * Hook to delete a maintenance document
 */
export const useDeleteMaintenanceDocument = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      maintenanceId,
      documentId,
    }: {
      maintenanceId: string;
      documentId: string;
    }) => maintenanceApi.documents.delete(maintenanceId, documentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: MAINTENANCE_KEYS.documents(variables.maintenanceId),
      });
      showToast.success(
        t("maintenance.documents.delete.success", {
          defaultValue: "Document deleted successfully",
        }),
      );
    },
    onError: (error: unknown) => {
      showToast.error(
        getApiErrorMessage(error) ||
          String(t("maintenance.documents.delete.error", {
            defaultValue: "Failed to delete document",
          })),
      );
    },
  });
};
