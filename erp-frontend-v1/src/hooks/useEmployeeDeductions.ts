/**
 * Employee Deductions React Query Hooks
 *
 * Custom hooks for managing employee deductions with type-based approval logic.
 * Some types (TAX, INSURANCE, LOAN_REPAYMENT) are auto-approved,
 * while others require manual approval.
 *
 * @module useEmployeeDeductions
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
import { employeeDeductionsApi } from "@/services/api/employee-deductions.api";
import { normalizeQueryFilters } from "@/lib/query-filters";
import type {
  EmployeeDeductionFiltersDto,
  CreateEmployeeDeductionDto,
  UpdateEmployeeDeductionDto,
  ApproveEmployeeDeductionDto,
  RejectEmployeeDeductionDto,
  UnapproveEmployeeDeductionDto,
} from "@/types/payroll.types";
import { DeductionType } from "@/types/payroll.types";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const EMPLOYEE_DEDUCTIONS_KEYS = {
  all: ["employee-deductions"] as const,
  lists: () => [...EMPLOYEE_DEDUCTIONS_KEYS.all, "list"] as const,
  list: (filters: Partial<EmployeeDeductionFiltersDto>) =>
    [...EMPLOYEE_DEDUCTIONS_KEYS.lists(), filters] as const,
  details: () => [...EMPLOYEE_DEDUCTIONS_KEYS.all, "detail"] as const,
  detail: (id: string) => [...EMPLOYEE_DEDUCTIONS_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) =>
    [...EMPLOYEE_DEDUCTIONS_KEYS.all, "employee", employeeId] as const,
  deleted: (filters?: EmployeeDeductionFiltersDto) =>
    [...EMPLOYEE_DEDUCTIONS_KEYS.all, "deleted", filters] as const,
  statistics: (filters: Partial<EmployeeDeductionFiltersDto>) =>
    [...EMPLOYEE_DEDUCTIONS_KEYS.all, "statistics", filters] as const,
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

type DeleteEmployeeDeductionInput = string | { id: string; rowVersion?: number };

const parseDeleteEmployeeDeductionInput = (
  input: DeleteEmployeeDeductionInput,
): { id: string; rowVersion?: number } =>
  typeof input === "string" ? { id: input, rowVersion: undefined } : input;

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch all employee deductions with filters
 */
export const useEmployeeDeductions = (filters: EmployeeDeductionFiltersDto) => {
  const normalizedFilters = useMemo(
    () => normalizeQueryFilters(filters),
    [filters],
  );

  return useQuery({
    queryKey: EMPLOYEE_DEDUCTIONS_KEYS.list(normalizedFilters),
    queryFn: () => employeeDeductionsApi.getAll(normalizedFilters),
    staleTime: 30000,
    gcTime: 300000,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to fetch deductions for a specific employee
 */
export const useEmployeeDeductionsByEmployee = (
  employeeId: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: EMPLOYEE_DEDUCTIONS_KEYS.byEmployee(employeeId),
    queryFn: () => employeeDeductionsApi.getByEmployee(employeeId),
    enabled: !!employeeId && enabled,
    staleTime: 30000,
  });
};

/**
 * Hook to fetch loan repayment deductions by loan ID
 */
export const useLoanRepayments = (loanId?: string, enabled = true) => {
  return useQuery({
    queryKey: [...EMPLOYEE_DEDUCTIONS_KEYS.all, "loan-repayments", loanId],
    queryFn: () =>
      employeeDeductionsApi.getAll({
        loanId,
        deductionType: DeductionType.LOAN_REPAYMENT,
        page: 1,
        limit: 100,
        sortBy: "deductionDate",
        sortOrder: "asc",
      }),
    enabled: !!loanId && enabled,
    staleTime: 30000,
  });
};

/**
 * Hook to fetch a single employee deduction by ID
 */
export const useEmployeeDeduction = (id: string, enabled = true) => {
  return useQuery({
    queryKey: EMPLOYEE_DEDUCTIONS_KEYS.detail(id),
    queryFn: () => employeeDeductionsApi.getById(id),
    enabled: !!id && enabled,
    staleTime: 30000,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new employee deduction
 *
 * Auto-approval behavior:
 * - TAX, INSURANCE, LOAN_REPAYMENT: Auto-approved
 * - PENALTY, ABSENCE, ADVANCE_DEDUCTION, OTHER: Requires manual approval
 */
export const useCreateEmployeeDeduction = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: employeeDeductionsApi.create,
    onSuccess: () => {
      // Invalidate all deductions queries
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_DEDUCTIONS_KEYS.all,
      });
      showToast.success(t("payroll.employeeDeductions.create.success"));
    },
    onError: (error: unknown) => {
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.employeeDeductions.create.error"));
      showToast.error(message);
    },
  });
};

export const useEmployeeDeductionsStatistics = (
  filters: Partial<EmployeeDeductionFiltersDto> = {},
) => {
  const normalizedFilters = useMemo(
    () => normalizeQueryFilters(filters),
    [filters],
  );

  return useQuery({
    queryKey: EMPLOYEE_DEDUCTIONS_KEYS.statistics(normalizedFilters),
    queryFn: () => employeeDeductionsApi.getStatistics(normalizedFilters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to update an existing employee deduction
 */
export const useUpdateEmployeeDeduction = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateEmployeeDeductionDto;
    }) => employeeDeductionsApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate all deductions queries
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_DEDUCTIONS_KEYS.all,
      });
      showToast.success(t("payroll.employeeDeductions.update.success"));
    },
    onError: (error: unknown, variables) => {
      if (isConflictError(error)) {
        queryClient.invalidateQueries({
          queryKey: EMPLOYEE_DEDUCTIONS_KEYS.detail(variables.id),
        });
      }
      const message =
        (isConflictError(error)
          ? String(t("common.rowVersionConflict"))
          : undefined) ||
        getApiErrorMessage(error) ||
        String(t("payroll.employeeDeductions.update.error"));
      showToast.error(message);
    },
  });
};

/**
 * Hook to delete an employee deduction
 * Note: LOAN_REPAYMENT deductions may not be deletable
 */
export const useDeleteEmployeeDeduction = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteEmployeeDeductionInput) => {
      const { id, rowVersion } = parseDeleteEmployeeDeductionInput(input);
      return employeeDeductionsApi.delete(id, { rowVersion });
    },
    onSuccess: () => {
      // Invalidate all deductions queries
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_DEDUCTIONS_KEYS.all,
      });
      showToast.success(t("payroll.employeeDeductions.delete.success"));
    },
    onError: (error: unknown) => {
      if (isConflictError(error)) {
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.employeeDeductions.delete.error"));
      showToast.error(message);
    },
  });
};

// ============================================================================
// APPROVAL WORKFLOW HOOKS
// ============================================================================

/**
 * Hook to approve an employee deduction
 * Requires payroll:approve permission
 * Only works for deductions that require approval (PENALTY, ABSENCE, etc.)
 */
export const useApproveEmployeeDeduction = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ApproveEmployeeDeductionDto;
    }) => employeeDeductionsApi.approve(id, data),
    onSuccess: (_, variables) => {
      // Invalidate all deductions queries
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_DEDUCTIONS_KEYS.all,
      });
      showToast.success(
        t("payroll.employeeDeductions.approval.successApprove"),
      );
    },
    onError: (error: unknown, variables) => {
      if (isConflictError(error)) {
        queryClient.invalidateQueries({
          queryKey: EMPLOYEE_DEDUCTIONS_KEYS.detail(variables.id),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.employeeDeductions.approval.errorApprove"));
      showToast.error(message);
    },
  });
};

/**
 * Hook to reject an employee deduction
 * Requires payroll:approve permission
 * Rejection reason is required
 */
export const useRejectEmployeeDeduction = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: RejectEmployeeDeductionDto;
    }) => employeeDeductionsApi.reject(id, data),
    onSuccess: (_, variables) => {
      // Invalidate all deductions queries
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_DEDUCTIONS_KEYS.all,
      });
      showToast.success(t("payroll.employeeDeductions.approval.successReject"));
    },
    onError: (error: unknown, variables) => {
      if (isConflictError(error)) {
        queryClient.invalidateQueries({
          queryKey: EMPLOYEE_DEDUCTIONS_KEYS.detail(variables.id),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.employeeDeductions.approval.errorReject"));
      showToast.error(message);
    },
  });
};

/**
 * Hook to unapprove an employee deduction
 * Requires payroll:approve permission
 * Only allowed if salary has not been paid yet
 */
export const useUnapproveEmployeeDeduction = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UnapproveEmployeeDeductionDto;
    }) => employeeDeductionsApi.unapprove(id, data),
    onSuccess: (_, variables) => {
      // Invalidate all deductions queries
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_DEDUCTIONS_KEYS.all,
      });
      showToast.success(
        t("payroll.employeeDeductions.approval.successUnapprove"),
      );
    },
    onError: (error: unknown, variables) => {
      if (isConflictError(error)) {
        queryClient.invalidateQueries({
          queryKey: EMPLOYEE_DEDUCTIONS_KEYS.detail(variables.id),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.employeeDeductions.approval.errorUnapprove"));
      showToast.error(message);
    },
  });
};

/**
 * Hook to restore a soft-deleted employee deduction
 * Only accessible to SUPERADMIN
 */
export const useRestoreEmployeeDeduction = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeeDeductionsApi.restore(id),
    onSuccess: () => {
      // Invalidate all deductions queries (active + deleted)
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_DEDUCTIONS_KEYS.all,
      });
      showToast.success(t("payroll.employeeDeductions.restore.success"));
    },
    onError: (error: unknown) => {
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.employeeDeductions.restore.error"));
      showToast.error(message);
    },
  });
};

/**
 * Hook to fetch deleted employee deductions
 * Only accessible to SUPERADMIN
 */
export const useDeletedEmployeeDeductions = (
  filters?: EmployeeDeductionFiltersDto,
  enabled = true,
) => {
  return useQuery({
    queryKey: EMPLOYEE_DEDUCTIONS_KEYS.deleted(filters),
    queryFn: () => employeeDeductionsApi.listDeleted(filters),
    enabled: enabled && filters !== undefined,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
