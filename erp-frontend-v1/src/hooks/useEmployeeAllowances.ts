/**
 * Employee Allowances React Query Hooks
 *
 * Custom hooks for managing employee allowances with approval workflow.
 * Includes separate hooks for approval and rejection operations.
 *
 * @module useEmployeeAllowances
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
import { employeeAllowancesApi } from "@/services/api/employee-allowances.api";
import { normalizeQueryFilters } from "@/lib/query-filters";
import type {
  EmployeeAllowanceFiltersDto,
  CreateEmployeeAllowanceDto,
  UpdateEmployeeAllowanceDto,
  ApproveEmployeeAllowanceDto,
  RejectEmployeeAllowanceDto,
} from "@/types/payroll.types";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const EMPLOYEE_ALLOWANCES_KEYS = {
  all: ["employee-allowances"] as const,
  lists: () => [...EMPLOYEE_ALLOWANCES_KEYS.all, "list"] as const,
  list: (filters: Partial<EmployeeAllowanceFiltersDto>) =>
    [...EMPLOYEE_ALLOWANCES_KEYS.lists(), filters] as const,
  details: () => [...EMPLOYEE_ALLOWANCES_KEYS.all, "detail"] as const,
  detail: (id: string) => [...EMPLOYEE_ALLOWANCES_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) =>
    [...EMPLOYEE_ALLOWANCES_KEYS.all, "employee", employeeId] as const,
  deleted: (filters?: EmployeeAllowanceFiltersDto) =>
    [...EMPLOYEE_ALLOWANCES_KEYS.all, "deleted", filters] as const,
  statistics: (filters: Partial<EmployeeAllowanceFiltersDto>) =>
    [...EMPLOYEE_ALLOWANCES_KEYS.all, "statistics", filters] as const,
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

const isConflictError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { response?: { status?: number } };
  return candidate.response?.status === 409;
};

type DeleteEmployeeAllowanceInput = string | { id: string; rowVersion?: number };

const parseDeleteEmployeeAllowanceInput = (
  input: DeleteEmployeeAllowanceInput,
): { id: string; rowVersion?: number } =>
  typeof input === "string" ? { id: input, rowVersion: undefined } : input;

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch all employee allowances with filters
 */
export const useEmployeeAllowances = (filters: EmployeeAllowanceFiltersDto) => {
  const normalizedFilters = useMemo(
    () => normalizeQueryFilters(filters),
    [filters],
  );

  return useQuery({
    queryKey: EMPLOYEE_ALLOWANCES_KEYS.list(normalizedFilters),
    queryFn: () => employeeAllowancesApi.getAll(normalizedFilters),
    staleTime: 30000,
    gcTime: 300000,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to fetch allowances for a specific employee
 * Useful for employee detail pages
 */
export const useEmployeeAllowancesByEmployee = (
  employeeId: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: EMPLOYEE_ALLOWANCES_KEYS.byEmployee(employeeId),
    queryFn: () => employeeAllowancesApi.getByEmployee(employeeId),
    enabled: !!employeeId && enabled,
    staleTime: 30000,
  });
};

/**
 * Hook to fetch a single employee allowance by ID
 */
export const useEmployeeAllowance = (id: string, enabled = true) => {
  return useQuery({
    queryKey: EMPLOYEE_ALLOWANCES_KEYS.detail(id),
    queryFn: () => employeeAllowancesApi.getById(id),
    enabled: !!id && enabled,
    staleTime: 30000,
  });
};

// ============================================================================
// MUTATION HOOKS - CRUD Operations
// ============================================================================

/**
 * Hook to create a new employee allowance
 * Initial status will be PENDING
 */
export const useCreateEmployeeAllowance = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: employeeAllowancesApi.create,
    onSuccess: (_, variables) => {
      // Invalidate all lists
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_ALLOWANCES_KEYS.lists(),
      });
      // Invalidate the specific employee's allowances
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_ALLOWANCES_KEYS.byEmployee(variables.employeeId),
      });
      showToast.success(t("payroll.employeeAllowances.create.success"));
    },
    onError: (error: unknown) => {
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.employeeAllowances.create.error"));
      showToast.error(message);
    },
  });
};

export const useEmployeeAllowancesStatistics = (
  filters: Partial<EmployeeAllowanceFiltersDto> = {},
) => {
  const normalizedFilters = useMemo(
    () => normalizeQueryFilters(filters),
    [filters],
  );

  return useQuery({
    queryKey: EMPLOYEE_ALLOWANCES_KEYS.statistics(normalizedFilters),
    queryFn: () => employeeAllowancesApi.getStatistics(normalizedFilters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to update an existing employee allowance
 */
export const useUpdateEmployeeAllowance = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateEmployeeAllowanceDto;
    }) => employeeAllowancesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_ALLOWANCES_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_ALLOWANCES_KEYS.detail(variables.id),
      });
      // Invalidate all byEmployee queries
      queryClient.invalidateQueries({
        queryKey: [...EMPLOYEE_ALLOWANCES_KEYS.all, "employee"],
      });
      showToast.success(t("payroll.employeeAllowances.update.success"));
    },
    onError: (error: unknown, variables) => {
      if (isConflictError(error)) {
        queryClient.invalidateQueries({
          queryKey: EMPLOYEE_ALLOWANCES_KEYS.detail(variables.id),
        });
        showToast.error(
          t("common.rowVersionConflict", {
            defaultValue:
              "Data was updated by another user. Please refresh and try again.",
          }),
        );
        return;
      }
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.employeeAllowances.update.error"));
      showToast.error(message);
    },
  });
};

/**
 * Hook to delete an employee allowance
 */
export const useDeleteEmployeeAllowance = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteEmployeeAllowanceInput) => {
      const { id, rowVersion } = parseDeleteEmployeeAllowanceInput(input);
      return employeeAllowancesApi.delete(id, { rowVersion });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_ALLOWANCES_KEYS.lists(),
      });
      // Invalidate all byEmployee queries
      queryClient.invalidateQueries({
        queryKey: [...EMPLOYEE_ALLOWANCES_KEYS.all, "employee"],
      });
      showToast.success(t("payroll.employeeAllowances.delete.success"));
    },
    onError: (error: unknown) => {
      if (isConflictError(error)) {
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.employeeAllowances.delete.error"));
      showToast.error(message);
    },
  });
};

// ============================================================================
// MUTATION HOOKS - Approval Workflow
// ============================================================================

/**
 * Hook to approve an employee allowance
 * Requires payroll:allowances:approve permission
 * Changes status from PENDING to APPROVED
 */
export const useApproveEmployeeAllowance = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ApproveEmployeeAllowanceDto;
    }) => employeeAllowancesApi.approve(id, data),
    onSuccess: (_, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_ALLOWANCES_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_ALLOWANCES_KEYS.detail(variables.id),
      });
      // Invalidate all byEmployee queries
      queryClient.invalidateQueries({
        queryKey: [...EMPLOYEE_ALLOWANCES_KEYS.all, "employee"],
      });
      showToast.success(t("payroll.employeeAllowances.approve.success"));
    },
    onError: (error: unknown, variables) => {
      if (isConflictError(error)) {
        queryClient.invalidateQueries({
          queryKey: EMPLOYEE_ALLOWANCES_KEYS.detail(variables.id),
        });
        showToast.error(
          t("common.rowVersionConflict", {
            defaultValue:
              "Data was updated by another user. Please refresh and try again.",
          }),
        );
        return;
      }
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.employeeAllowances.approve.error"));
      showToast.error(message);
    },
  });
};

/**
 * Hook to reject an employee allowance
 * Requires payroll:allowances:approve permission
 * Changes status from PENDING to REJECTED
 * Must provide rejection reason
 */
export const useRejectEmployeeAllowance = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: RejectEmployeeAllowanceDto;
    }) => employeeAllowancesApi.reject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_ALLOWANCES_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_ALLOWANCES_KEYS.detail(variables.id),
      });
      // Invalidate all byEmployee queries
      queryClient.invalidateQueries({
        queryKey: [...EMPLOYEE_ALLOWANCES_KEYS.all, "employee"],
      });
      showToast.success(t("payroll.employeeAllowances.reject.success"));
    },
    onError: (error: unknown, variables) => {
      if (isConflictError(error)) {
        queryClient.invalidateQueries({
          queryKey: EMPLOYEE_ALLOWANCES_KEYS.detail(variables.id),
        });
        showToast.error(
          t("common.rowVersionConflict", {
            defaultValue:
              "Data was updated by another user. Please refresh and try again.",
          }),
        );
        return;
      }
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.employeeAllowances.reject.error"));
      showToast.error(message);
    },
  });
};

/**
 * Hook to restore a soft-deleted employee allowance
 * Only accessible to SUPERADMIN
 */
export const useRestoreEmployeeAllowance = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeeAllowancesApi.restore(id),
    onSuccess: () => {
      // Invalidate all queries for immediate UI update
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_ALLOWANCES_KEYS.all,
      });
      showToast.success(
        t("payroll.employeeAllowances.restore.success", {
          defaultValue: "Allowance restored successfully",
        }),
      );
    },
    onError: (error: unknown) => {
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.employeeAllowances.restore.error", {
          defaultValue: "Error restoring allowance",
        }));
      showToast.error(message);
    },
  });
};

/**
 * Hook to fetch deleted employee allowances
 * Only accessible to SUPERADMIN
 */
export const useDeletedEmployeeAllowances = (
  filters?: EmployeeAllowanceFiltersDto,
  enabled = true,
) => {
  return useQuery({
    queryKey: EMPLOYEE_ALLOWANCES_KEYS.deleted(filters),
    queryFn: () => employeeAllowancesApi.listDeleted(filters),
    enabled: enabled && filters !== undefined,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
