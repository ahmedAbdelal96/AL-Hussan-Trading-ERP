/**
 * Employee Loans React Query Hooks
 *
 * Custom hooks for managing employee loans with approval workflow and payment tracking.
 * Includes separate hooks for approval, rejection, and installment payments.
 *
 * @module useEmployeeLoans
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
import { employeeLoansApi } from "@/services/api/employee-loans.api";
import { normalizeQueryFilters } from "@/lib/query-filters";
import type {
  EmployeeLoanFiltersDto,
  CreateEmployeeLoanDto,
  UpdateEmployeeLoanDto,
  ApproveEmployeeLoanDto,
  RejectEmployeeLoanDto,
  PayLoanInstallmentDto,
} from "@/types/payroll.types";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const EMPLOYEE_LOANS_KEYS = {
  all: ["employee-loans"] as const,
  lists: () => [...EMPLOYEE_LOANS_KEYS.all, "list"] as const,
  list: (filters: Partial<EmployeeLoanFiltersDto>) =>
    [...EMPLOYEE_LOANS_KEYS.lists(), filters] as const,
  details: () => [...EMPLOYEE_LOANS_KEYS.all, "detail"] as const,
  detail: (id: string) => [...EMPLOYEE_LOANS_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) =>
    [...EMPLOYEE_LOANS_KEYS.all, "employee", employeeId] as const,
  statistics: (filters: Partial<EmployeeLoanFiltersDto>) =>
    [...EMPLOYEE_LOANS_KEYS.all, "statistics", filters] as const,
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

type DeleteEmployeeLoanInput = string | { id: string; rowVersion?: number };

const parseDeleteEmployeeLoanInput = (
  input: DeleteEmployeeLoanInput,
): { id: string; rowVersion?: number } =>
  typeof input === "string" ? { id: input, rowVersion: undefined } : input;

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch all employee loans with filters
 */
export const useEmployeeLoans = (filters: EmployeeLoanFiltersDto) => {
  const normalizedFilters = useMemo(
    () => normalizeQueryFilters(filters),
    [filters],
  );

  return useQuery({
    queryKey: EMPLOYEE_LOANS_KEYS.list(normalizedFilters),
    queryFn: () => employeeLoansApi.getAll(normalizedFilters),
    staleTime: 30000,
    gcTime: 300000,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to fetch loans for a specific employee
 */
export const useEmployeeLoansByEmployee = (
  employeeId: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: EMPLOYEE_LOANS_KEYS.byEmployee(employeeId),
    queryFn: () => employeeLoansApi.getByEmployee(employeeId),
    enabled: !!employeeId && enabled,
    staleTime: 30000,
  });
};

/**
 * Hook to fetch a single employee loan by ID
 */
export const useEmployeeLoan = (id: string, enabled = true) => {
  return useQuery({
    queryKey: EMPLOYEE_LOANS_KEYS.detail(id),
    queryFn: () => employeeLoansApi.getById(id),
    enabled: !!id && enabled,
    staleTime: 30000,
  });
};

// ============================================================================
// MUTATION HOOKS - CRUD Operations
// ============================================================================

/**
 * Hook to create a new employee loan
 * Initial status will be PENDING, awaiting approval
 */
export const useCreateEmployeeLoan = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: employeeLoansApi.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_LOANS_KEYS.all,
      });
      showToast.success(t("payroll.employeeLoans.create.success"));
    },
    onError: (error: unknown) => {
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.employeeLoans.create.error"));
      showToast.error(message);
    },
  });
};

export const useEmployeeLoansStatistics = (
  filters: Partial<EmployeeLoanFiltersDto> = {},
) => {
  const normalizedFilters = useMemo(
    () => normalizeQueryFilters(filters),
    [filters],
  );

  return useQuery({
    queryKey: EMPLOYEE_LOANS_KEYS.statistics(normalizedFilters),
    queryFn: () => employeeLoansApi.getStatistics(normalizedFilters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to update an existing employee loan
 * Note: Some fields may be locked after approval
 */
export const useUpdateEmployeeLoan = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeLoanDto }) =>
      employeeLoansApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_LOANS_KEYS.all,
      });
      showToast.success(t("payroll.employeeLoans.update.success"));
    },
    onError: (error: unknown, variables) => {
      if (isConflictError(error)) {
        queryClient.invalidateQueries({
          queryKey: EMPLOYEE_LOANS_KEYS.detail(variables.id),
        });
      }
      const message =
        (isConflictError(error)
          ? String(t("common.rowVersionConflict"))
          : undefined) ||
        getApiErrorMessage(error) ||
        String(t("payroll.employeeLoans.update.error"));
      showToast.error(message);
    },
  });
};

/**
 * Hook to delete an employee loan
 * Typically only allowed for PENDING loans
 */
export const useDeleteEmployeeLoan = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteEmployeeLoanInput) => {
      const { id, rowVersion } = parseDeleteEmployeeLoanInput(input);
      return employeeLoansApi.delete(id, { rowVersion });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_LOANS_KEYS.all,
      });
      showToast.success(t("payroll.employeeLoans.delete.success"));
    },
    onError: (error: unknown) => {
      if (isConflictError(error)) {
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.employeeLoans.delete.error"));
      showToast.error(message);
    },
  });
};

// ============================================================================
// MUTATION HOOKS - Approval Workflow
// ============================================================================

/**
 * Hook to approve an employee loan
 * Changes status from PENDING to APPROVED
 * Must specify installment amount for confirmation
 */
export const useApproveEmployeeLoan = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveEmployeeLoanDto }) =>
      employeeLoansApi.approve(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_LOANS_KEYS.all,
      });
      showToast.success(t("payroll.employeeLoans.approve.success"));
    },
    onError: (error: unknown, variables) => {
      if (isConflictError(error)) {
        queryClient.invalidateQueries({
          queryKey: EMPLOYEE_LOANS_KEYS.detail(variables.id),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.employeeLoans.approve.error"));
      showToast.error(message);
    },
  });
};

/**
 * Hook to reject an employee loan
 * Changes status from PENDING to REJECTED
 * Must provide rejection reason
 */
export const useRejectEmployeeLoan = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectEmployeeLoanDto }) =>
      employeeLoansApi.reject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_LOANS_KEYS.all,
      });
      showToast.success(t("payroll.employeeLoans.reject.success"));
    },
    onError: (error: unknown, variables) => {
      if (isConflictError(error)) {
        queryClient.invalidateQueries({
          queryKey: EMPLOYEE_LOANS_KEYS.detail(variables.id),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.employeeLoans.reject.error"));
      showToast.error(message);
    },
  });
};

// ============================================================================
// MUTATION HOOKS - Payment Operations
// ============================================================================

/**
 * Hook to pay a loan installment
 *
 * Features:
 * - Records payment against active loan
 * - Automatically creates LOAN_REPAYMENT deduction
 * - Updates remainingAmount and paidInstallments
 * - Auto-changes status to PAID_OFF when fully paid
 *
 * @example
 * const payMutation = usePayLoanInstallment();
 * payMutation.mutate({
 *   id: 'loan-uuid',
 *   data: {
 *     deductionDate: '2026-01-13',
 *     notes: 'January payment'
 *   }
 * });
 */
export const usePayLoanInstallment = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PayLoanInstallmentDto }) =>
      employeeLoansApi.payInstallment(id, data),
    onSuccess: (_, variables) => {
      // Invalidate all loan queries to refresh employee pages
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_LOANS_KEYS.all,
      });

      // Also invalidate deductions since a new deduction was created
      queryClient.invalidateQueries({
        queryKey: ["employee-deductions"],
      });

      showToast.success(t("payroll.employeeLoans.payment.success"));
    },
    onError: (error: unknown, variables) => {
      if (isConflictError(error)) {
        queryClient.invalidateQueries({
          queryKey: EMPLOYEE_LOANS_KEYS.detail(variables.id),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        getApiErrorMessage(error) ||
        String(t("payroll.employeeLoans.payment.error"));
      showToast.error(message);
    },
  });
};
