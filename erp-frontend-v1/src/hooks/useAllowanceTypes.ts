/**
 * Allowance Types React Query Hooks
 *
 * Custom hooks for managing allowance type master data with React Query.
 * Allowance types are configuration data used across the payroll module.
 *
 * @module useAllowanceTypes
 */

import { useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { showToast } from "@/lib/toast";
import { useTranslation } from "@/i18n/useTranslation";
import { allowanceTypesApi } from "@/services/api/allowance-types.api";
import { normalizeQueryFilters } from "@/lib/query-filters";
import type {
  AllowanceTypeFiltersDto,
  CreateAllowanceTypeDto,
  UpdateAllowanceTypeDto,
} from "@/types/payroll.types";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const ALLOWANCE_TYPES_KEYS = {
  all: ["allowance-types"] as const,
  lists: () => [...ALLOWANCE_TYPES_KEYS.all, "list"] as const,
  list: (filters: Partial<AllowanceTypeFiltersDto>) =>
    [...ALLOWANCE_TYPES_KEYS.lists(), filters] as const,
  details: () => [...ALLOWANCE_TYPES_KEYS.all, "detail"] as const,
  detail: (id: string) => [...ALLOWANCE_TYPES_KEYS.details(), id] as const,
  statistics: (filters: Partial<AllowanceTypeFiltersDto>) =>
    [...ALLOWANCE_TYPES_KEYS.all, "statistics", filters] as const,
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

  if (
    typeof candidate.message === "string" &&
    candidate.message.trim().length > 0
  ) {
    return candidate.message;
  }

  return undefined;
};

const isConflictError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { response?: { status?: number } };
  return candidate.response?.status === 409;
};

type DeleteAllowanceTypeInput = string | { id: string; rowVersion?: number };

const parseDeleteAllowanceTypeInput = (
  input: DeleteAllowanceTypeInput,
): { id: string; rowVersion?: number } =>
  typeof input === "string" ? { id: input, rowVersion: undefined } : input;

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch all allowance types
 * Commonly used for dropdowns and selection lists
 *
 * @param filters - Query parameters (search, active status, pagination)
 * @returns React Query result with allowance types list
 */
export const useAllowanceTypes = (filters: AllowanceTypeFiltersDto = {}) => {
  const normalizedFilters = useMemo(
    () => normalizeQueryFilters(filters),
    [filters],
  );

  return useQuery({
    queryKey: ALLOWANCE_TYPES_KEYS.list(normalizedFilters),
    queryFn: () => allowanceTypesApi.getAll(normalizedFilters),
    staleTime: 60000, // 1 minute - master data changes less frequently
    gcTime: 300000,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to fetch a single allowance type by ID
 */
export const useAllowanceType = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ALLOWANCE_TYPES_KEYS.detail(id),
    queryFn: () => allowanceTypesApi.getById(id),
    enabled: !!id && enabled,
    staleTime: 60000,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new allowance type
 */
export const useCreateAllowanceType = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: allowanceTypesApi.create,
    onSuccess: () => {
      // Invalidate all allowance types related queries (lists + statistics)
      queryClient.invalidateQueries({
        queryKey: ALLOWANCE_TYPES_KEYS.all,
      });
      showToast.success(t("payroll.allowanceTypes.create.success"));
    },
    onError: (error: unknown) => {
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.allowanceTypes.create.error"));
      showToast.error(message);
    },
  });
};

export const useAllowanceTypesStatistics = (
  filters: Partial<AllowanceTypeFiltersDto> = {},
) => {
  const normalizedFilters = useMemo(
    () => normalizeQueryFilters(filters),
    [filters],
  );

  return useQuery({
    queryKey: ALLOWANCE_TYPES_KEYS.statistics(normalizedFilters),
    queryFn: () => allowanceTypesApi.getStatistics(normalizedFilters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to update an existing allowance type
 */
export const useUpdateAllowanceType = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAllowanceTypeDto }) =>
      allowanceTypesApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate all allowance types related queries (lists + statistics)
      queryClient.invalidateQueries({
        queryKey: ALLOWANCE_TYPES_KEYS.all,
      });
      showToast.success(t("payroll.allowanceTypes.update.success"));
    },
    onError: (error: unknown, variables) => {
      if (isConflictError(error)) {
        queryClient.invalidateQueries({
          queryKey: ALLOWANCE_TYPES_KEYS.detail(variables.id),
        });
      }
      const message =
        (isConflictError(error)
          ? String(t("common.rowVersionConflict"))
          : undefined) ||
        getApiErrorMessage(error) ||
        String(t("payroll.allowanceTypes.update.error"));
      showToast.error(message);
    },
  });
};

/**
 * Hook to delete an allowance type
 * Note: May fail if allowance type is in use
 */
export const useDeleteAllowanceType = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteAllowanceTypeInput) => {
      const { id, rowVersion } = parseDeleteAllowanceTypeInput(input);
      return allowanceTypesApi.delete(id, { rowVersion });
    },
    onSuccess: () => {
      // Invalidate all allowance types related queries (lists + statistics)
      queryClient.invalidateQueries({
        queryKey: ALLOWANCE_TYPES_KEYS.all,
      });
      showToast.success(t("payroll.allowanceTypes.delete.success"));
    },
    onError: (error: unknown) => {
      if (isConflictError(error)) {
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.allowanceTypes.delete.error"));
      showToast.error(message);
    },
  });
};
