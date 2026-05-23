/**
 * Employees Custom Hooks
 * React Query hooks for managing employees data
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { showToast } from "@/lib/toast";
import { useTranslation } from "@/i18n/useTranslation";
import { employeesApi, salaryApi } from "@/services/api/employees.api";
import { normalizeQueryFilters } from "@/lib/query-filters";
import type {
  EmployeeFiltersDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  BulkCreateEmployeesDto,
  UpdateSalaryDto,
  SalaryHistoryEntity,
  RehireEmployeeDto,
} from "@/types/employees.types";
import type { EmployeesStatisticsParams } from "@/types/employees-statistics";
import { AxiosError } from "axios";

// ============= Query Keys =============

export const EMPLOYEES_KEYS = {
  all: ["employees"] as const,
  lists: () => [...EMPLOYEES_KEYS.all, "list"] as const,
  list: (filters: Partial<EmployeeFiltersDto>) =>
    [...EMPLOYEES_KEYS.lists(), filters] as const,
  details: () => [...EMPLOYEES_KEYS.all, "detail"] as const,
  detail: (id: string) => [...EMPLOYEES_KEYS.details(), id] as const,
  salaryHistory: () => [...EMPLOYEES_KEYS.all, "salary-history"] as const,
  employeeSalaryHistory: (id: string) =>
    [...EMPLOYEES_KEYS.salaryHistory(), id] as const,
  salarySalaryHistory: (id: string, page: number, pageSize: number) =>
    [...EMPLOYEES_KEYS.employeeSalaryHistory(id), page, pageSize] as const,
};

export const EMPLOYEES_STATISTICS_KEYS = {
  all: ["employees", "statistics"] as const,
  overview: (params?: EmployeesStatisticsParams) =>
    params
      ? ([...EMPLOYEES_STATISTICS_KEYS.all, "overview", params] as const)
      : ([...EMPLOYEES_STATISTICS_KEYS.all, "overview"] as const),
};

const invalidateEmployeesListsAndStats = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEYS.lists() });
  queryClient.invalidateQueries({ queryKey: EMPLOYEES_STATISTICS_KEYS.all });
};

const invalidateEmployeeDetail = (
  queryClient: ReturnType<typeof useQueryClient>,
  employeeId: string,
) => {
  queryClient.invalidateQueries({
    queryKey: EMPLOYEES_KEYS.detail(employeeId),
  });
};

const getApiErrorMessage = (
  error: AxiosError<{ message?: string; error?: string }>,
): string | undefined => {
  return error.response?.data?.message || error.response?.data?.error;
};

type DeleteEmployeeInput = string | { id: string; rowVersion?: number };

const parseDeleteEmployeeInput = (input: DeleteEmployeeInput) =>
  typeof input === "string" ? { id: input, rowVersion: undefined } : input;

// ============= Queries =============

/**
 * Get all employees with filters
 * @param filters - Pagination and filter options
 */
export const useEmployees = (
  filters: EmployeeFiltersDto = {},
  options?: { enabled?: boolean },
) => {
  const normalizedFilters = useMemo(
    () => normalizeQueryFilters(filters),
    [filters],
  );

  return useQuery({
    queryKey: EMPLOYEES_KEYS.list(normalizedFilters),
    queryFn: () => employeesApi.getAll(normalizedFilters),
    enabled: options?.enabled ?? true,
    staleTime: 30_000, // 30 seconds
    placeholderData: keepPreviousData, // Keep showing old data while loading new data
  });
};

/**
 * Get single employee by ID
 * @param id - Employee UUID
 */
export const useEmployee = (id?: string) =>
  useQuery({
    queryKey: EMPLOYEES_KEYS.detail(id || ""),
    queryFn: () => employeesApi.getById(id!),
    enabled: !!id,
  });

// ============= Mutations =============

/**
 * Create new employee
 */
export const useCreateEmployee = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEmployeeDto) => employeesApi.create(payload),
    onSuccess: () => {
      invalidateEmployeesListsAndStats(queryClient);
      showToast.success(
        t("employees.create.success", {
          defaultValue: "تم إضافة الموظف بنجاح",
        }),
      );
    },
    // Errors are handled by axios interceptor
  });
};

/**
 * Bulk create employees
 */
export const useBulkCreateEmployees = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkCreateEmployeesDto) =>
      employeesApi.bulkCreate(payload),
    onSuccess: (data) => {
      invalidateEmployeesListsAndStats(queryClient);
      showToast.success(
        t("employees.bulkCreate.success", {
          defaultValue: `تم إضافة ${data.length} موظف بنجاح`,
        }),
      );
    },
  });
};

/**
 * Update employee
 */
export const useUpdateEmployee = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeDto }) =>
      employeesApi.update(id, data),
    onSuccess: (_, variables) => {
      invalidateEmployeesListsAndStats(queryClient);
      invalidateEmployeeDetail(queryClient, variables.id);
      showToast.success(
        t("employees.update.success", {
          defaultValue: "تم تحديث الموظف بنجاح",
        }),
      );
    },
    onError: (
      error: AxiosError<{ message?: string; error?: string }>,
      variables,
    ) => {
      if (error.response?.status === 409) {
        showToast.error(
          t("common.rowVersionConflict", {
            defaultValue:
              "تم تعديل البيانات بواسطة مستخدم آخر. يرجى إعادة تحميل الصفحة ثم المحاولة مرة أخرى.",
          }),
        );
        invalidateEmployeeDetail(queryClient, variables.id);
      }
      // Other errors are handled by axios interceptor
    },
  });
};

/**
 * Delete employee
 */
export const useDeleteEmployee = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteEmployeeInput) => {
      const { id, rowVersion } = parseDeleteEmployeeInput(input);
      return employeesApi.delete(id, { rowVersion });
    },
    onSuccess: (_, input) => {
      const { id } = parseDeleteEmployeeInput(input);
      invalidateEmployeesListsAndStats(queryClient);
      queryClient.removeQueries({
        queryKey: EMPLOYEES_KEYS.detail(id),
      });
      showToast.success(
        t("employees.delete.success", { defaultValue: "تم حذف الموظف بنجاح" }),
      );
    },
    onError: (error: unknown, input) => {
      const { id } = parseDeleteEmployeeInput(input);
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 409) {
        invalidateEmployeeDetail(queryClient, id);
        showToast.error(String(t("common.rowVersionConflict")));
      }
      // Other errors are handled by axios interceptor
    },
  });
};

// ============= Profile Picture Mutations =============

/**
 * Rehire a terminated employee
 */
export const useRehireEmployee = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RehireEmployeeDto }) =>
      employeesApi.rehire(id, data),
    onSuccess: (_, variables) => {
      invalidateEmployeesListsAndStats(queryClient);
      invalidateEmployeeDetail(queryClient, variables.id);
      showToast.success(
        t("employees.rehire.success", {
          defaultValue: "تمت إعادة توظيف الموظف بنجاح",
        }),
      );
    },
  });
};

/**
 * Upload employee profile picture
 */
export const useUploadEmployeeProfilePicture = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      employeesApi.profilePicture.upload(id, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEYS.lists() });
      invalidateEmployeeDetail(queryClient, variables.id);
      showToast.success(
        t("employees.profilePicture.upload.success", {
          defaultValue: "تم رفع صورة الموظف بنجاح",
        }),
      );
    },
  });
};

/**
 * Delete employee profile picture
 */
export const useDeleteEmployeeProfilePicture = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeesApi.profilePicture.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEYS.lists() });
      invalidateEmployeeDetail(queryClient, id);
      showToast.success(
        t("employees.profilePicture.delete.success", {
          defaultValue: "تم حذف صورة الموظف بنجاح",
        }),
      );
    },
  });
};

// ============= Documents Queries & Mutations =============

const EMPLOYEE_DOCUMENTS_KEYS = {
  all: (employeeId: string) => ["employees", employeeId, "documents"] as const,
};

/**
 * Get employee documents
 */
export const useEmployeeDocuments = (employeeId?: string) =>
  useQuery({
    queryKey: EMPLOYEE_DOCUMENTS_KEYS.all(employeeId || ""),
    queryFn: () => employeesApi.documents.getAll(employeeId!),
    enabled: !!employeeId,
  });

/**
 * Upload employee documents
 */
export const useUploadEmployeeDocuments = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      files,
      metadata,
    }: {
      id: string;
      files: File[];
      metadata: {
        documentType: string;
        documentName: string;
        issueDate?: string;
        expiryDate?: string;
        notes?: string;
      };
    }) => employeesApi.documents.upload(id, files, metadata),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_DOCUMENTS_KEYS.all(variables.id),
      });
      showToast.success(
        t("employees.documents.upload.success", {
          defaultValue: "تم رفع المستندات بنجاح",
        }),
      );
    },
    onError: (_error: unknown) => {
      showToast.error(
        t("employees.documents.upload.error", {
          defaultValue: "حدث خطأ أثناء رفع المستندات",
        }),
      );
    },
  });
};

/**
 * Delete employee document
 */
export const useDeleteEmployeeDocument = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      documentId,
    }: {
      employeeId: string;
      documentId: string;
    }) => employeesApi.documents.delete(employeeId, documentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_DOCUMENTS_KEYS.all(variables.employeeId),
      });
      showToast.success(
        t("employees.documents.delete.success", {
          defaultValue: "تم حذف المستند بنجاح",
        }),
      );
    },
  });
};

// ============= Salary Management Queries & Mutations =============

/**
 * Get salary history for an employee
 * @param employeeId - Employee UUID
 * @param page - Page number for pagination
 * @param pageSize - Number of items per page (default: 20)
 */
export const useSalaryHistory = (
  employeeId?: string,
  page: number = 1,
  pageSize: number = 20,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: EMPLOYEES_KEYS.salarySalaryHistory(
      employeeId || "",
      page,
      pageSize,
    ),
    queryFn: () => salaryApi.getSalaryHistory(employeeId!, page, pageSize),
    enabled: !!employeeId && (options?.enabled ?? true),
    staleTime: 30_000, // 30 seconds
  });
};

/**
 * Update employee salary with optimistic locking
 *
 * Features:
 * - Handles 409 Conflict (concurrent update detected) - shows refresh prompt
 * - Updates employee detail query with new version
 * - Invalidates salary history to show new entry
 * - Shows contextual error messages based on response status
 *
 * Error Handling:
 * - 404: Employee not found - very rare error
 * - 409: Version mismatch (concurrent update) - user must refresh
 * - 400: Invalid salary (must be > 0) or unchanged salary
 * - Other: Generic error message
 *
 * Optimistic Locking Flow:
 * 1. User submits salary form with: baseSalary, version, reason
 * 2. Mutation sends request to backend
 * 3. Backend checks: if employee.version !== dto.version -> 409 error
 * 4. On success: Employee version auto-incremented by backend
 * 5. Frontend updates local cache with new employee + version
 * 6. On 409: Frontend prompts user to refresh and retry
 *
 * @example
 * ```typescript
 * const updateSalary = useUpdateSalary();
 *
 * const handleUpdateSalary = async (employeeId: string, newSalary: number) => {
 *   const employee = queryClient.getQueryData(EMPLOYEES_KEYS.detail(employeeId));
 *
 *   try {
 *     await updateSalary.mutateAsync({
 *       employeeId,
 *       payload: {
 *         baseSalary: newSalary,
 *         version: employee.version,
 *         reason: "Annual performance raise"
 *       }
 *     });
 *   } catch (error) {
 *     // Error handling done by hook
 *     // For 409: Hook shows dialog automatically
 *     // User clicks "Refresh" -> page reloads with new version
 *   }
 * };
 * ```
 */
export const useUpdateSalary = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string;
      payload: UpdateSalaryDto;
    }) => salaryApi.updateSalary(employeeId, payload),

    onSuccess: (updated, { employeeId }) => {
      // Update employee detail cache with new salary and version
      queryClient.setQueryData(EMPLOYEES_KEYS.detail(employeeId), updated);

      // Invalidate salary history to fetch updated list
      queryClient.invalidateQueries({
        queryKey: EMPLOYEES_KEYS.employeeSalaryHistory(employeeId),
      });

      showToast.success(
        t("payroll.salary.updateSuccess", {
          defaultValue: "تم تحديث الراتب بنجاح",
        }),
      );
    },

    onError: (
      error: AxiosError<{ message?: string; error?: string }>,
      { employeeId },
    ) => {
      const status = error.response?.status;

      if (status === 409) {
        // Concurrent update detected - version mismatch
        // Show dialog and force refresh
        showToast.error(
          t("payroll.salary.concurrentUpdate", {
            defaultValue:
              "تم تعديل البيانات بواسطة مستخدم آخر. يرجى تحديث الصفحة والمحاولة مرة أخرى",
          }),
        );

        // Refetch employee to get latest version
        queryClient.invalidateQueries({
          queryKey: EMPLOYEES_KEYS.detail(employeeId),
        });
      } else if (status === 400) {
        // Bad request - invalid salary or unchanged value
        const message = getApiErrorMessage(error);
        showToast.error(
          message ||
            t("payroll.salary.invalidSalary", {
              defaultValue: "الراتب المدخل غير صحيح",
            }),
        );
      } else if (status === 404) {
        showToast.error(
          t("employees.notFound", {
            defaultValue: "الموظف غير موجود",
          }),
        );
      } else {
        showToast.error(
          t("common.error", {
            defaultValue: "حدث خطأ ما",
          }),
        );
      }
    },
  });
};

// ============= Statistics Queries =============

/**
 * Get comprehensive employee statistics
 * @param params - Optional filters for statistics
 */
export const useEmployeesStatistics = (params?: EmployeesStatisticsParams) => {
  return useQuery({
    queryKey: EMPLOYEES_STATISTICS_KEYS.overview(params),
    queryFn: () => employeesApi.statistics.getEmployeesStatistics(params),
    staleTime: 60 * 1000, // Keep recent stats for 1 minute to reduce flapping requests
    gcTime: 2 * 60 * 1000, // 2 minutes cache in background
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });
};
