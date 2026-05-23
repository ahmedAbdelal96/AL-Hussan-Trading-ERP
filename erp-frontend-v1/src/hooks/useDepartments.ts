/**
 * Departments Custom Hooks
 * React Query hooks for managing departments data
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { showToast } from "@/lib/toast";
import { departmentsApi } from "@/services/api/departments.api";
import type {
  DepartmentFiltersDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from "@/types/departments-positions.types";

export const DEPARTMENTS_KEYS = {
  all: ["departments"] as const,
  lists: () => [...DEPARTMENTS_KEYS.all, "list"] as const,
  list: (filters?: DepartmentFiltersDto) =>
    [...DEPARTMENTS_KEYS.lists(), filters] as const,
  active: () => [...DEPARTMENTS_KEYS.all, "active"] as const,
  details: () => [...DEPARTMENTS_KEYS.all, "detail"] as const,
  detail: (id: string) => [...DEPARTMENTS_KEYS.details(), id] as const,
};

const isConflictError = (error: unknown): boolean => {
  const candidate = error as AxiosError | undefined;
  return candidate?.response?.status === 409;
};

type DeleteDepartmentInput = string | { id: string; rowVersion?: number };

const parseDeleteDepartmentInput = (input: DeleteDepartmentInput) =>
  typeof input === "string" ? { id: input, rowVersion: undefined } : input;

export const useActiveDepartments = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: DEPARTMENTS_KEYS.active(),
    queryFn: departmentsApi.getActive,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
};

export const useDepartments = (
  filters?: DepartmentFiltersDto,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: DEPARTMENTS_KEYS.list(filters),
    queryFn: () => departmentsApi.getAll(filters),
    enabled: options?.enabled ?? true,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDepartmentDto) => departmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEYS.all });
      showToast.success("تم إنشاء القسم بنجاح");
    },
    onError: () => {
      showToast.error("فشل إنشاء القسم");
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentDto }) =>
      departmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEYS.all });
      showToast.success("تم تحديث القسم بنجاح");
    },
    onError: (error: unknown) => {
      if (isConflictError(error)) {
        showToast.error(
          "تم تعديل البيانات بواسطة مستخدم آخر. يرجى إعادة تحميل الصفحة ثم المحاولة مرة أخرى.",
        );
        return;
      }
      showToast.error("فشل تحديث القسم");
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteDepartmentInput) => {
      const { id, rowVersion } = parseDeleteDepartmentInput(input);
      return departmentsApi.delete(id, { rowVersion });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEYS.all });
      showToast.success("تم حذف القسم بنجاح");
    },
    onError: (error: unknown, input) => {
      const { id } = parseDeleteDepartmentInput(input);
      if (isConflictError(error)) {
        queryClient.invalidateQueries({
          queryKey: DEPARTMENTS_KEYS.detail(id),
        });
        showToast.error(
          "تم تعديل البيانات بواسطة مستخدم آخر. يرجى إعادة تحميل الصفحة ثم المحاولة مرة أخرى.",
        );
        return;
      }
      showToast.error("فشل حذف القسم");
    },
  });
};
