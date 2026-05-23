/**
 * Positions Custom Hooks
 * React Query hooks for managing positions data
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { showToast } from "@/lib/toast";
import { positionsApi } from "@/services/api/positions.api";
import type {
  PositionFiltersDto,
  CreatePositionDto,
  UpdatePositionDto,
} from "@/types/departments-positions.types";

export const POSITIONS_KEYS = {
  all: ["positions"] as const,
  lists: () => [...POSITIONS_KEYS.all, "list"] as const,
  list: (filters?: PositionFiltersDto) =>
    [...POSITIONS_KEYS.lists(), filters] as const,
  active: (departmentId?: string) =>
    [...POSITIONS_KEYS.all, "active", departmentId] as const,
  details: () => [...POSITIONS_KEYS.all, "detail"] as const,
  detail: (id: string) => [...POSITIONS_KEYS.details(), id] as const,
};

const isConflictError = (error: unknown): boolean => {
  const candidate = error as AxiosError | undefined;
  return candidate?.response?.status === 409;
};

type DeletePositionInput = string | { id: string; rowVersion?: number };

const parseDeletePositionInput = (input: DeletePositionInput) =>
  typeof input === "string" ? { id: input, rowVersion: undefined } : input;

export const useActivePositions = (departmentId?: string) => {
  return useQuery({
    queryKey: POSITIONS_KEYS.active(departmentId),
    queryFn: () => positionsApi.getActive(departmentId),
    staleTime: 5 * 60 * 1000,
  });
};

export const usePositions = (filters?: PositionFiltersDto) => {
  return useQuery({
    queryKey: POSITIONS_KEYS.list(filters),
    queryFn: () => positionsApi.getAll(filters),
  });
};

export const useCreatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePositionDto) => positionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSITIONS_KEYS.all });
      showToast.success("تم إنشاء الوظيفة بنجاح");
    },
    onError: () => {
      showToast.error("فشل إنشاء الوظيفة");
    },
  });
};

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePositionDto }) =>
      positionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSITIONS_KEYS.all });
      showToast.success("تم تحديث الوظيفة بنجاح");
    },
    onError: (error: unknown) => {
      if (isConflictError(error)) {
        showToast.error(
          "تم تعديل البيانات بواسطة مستخدم آخر. يرجى إعادة تحميل الصفحة ثم المحاولة مرة أخرى.",
        );
        return;
      }
      showToast.error("فشل تحديث الوظيفة");
    },
  });
};

export const useDeletePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeletePositionInput) => {
      const { id, rowVersion } = parseDeletePositionInput(input);
      return positionsApi.delete(id, { rowVersion });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSITIONS_KEYS.all });
      showToast.success("تم حذف الوظيفة بنجاح");
    },
    onError: (error: unknown, input) => {
      const { id } = parseDeletePositionInput(input);
      if (isConflictError(error)) {
        queryClient.invalidateQueries({
          queryKey: POSITIONS_KEYS.detail(id),
        });
        showToast.error(
          "تم تعديل البيانات بواسطة مستخدم آخر. يرجى إعادة تحميل الصفحة ثم المحاولة مرة أخرى.",
        );
        return;
      }
      showToast.error("فشل حذف الوظيفة");
    },
  });
};
