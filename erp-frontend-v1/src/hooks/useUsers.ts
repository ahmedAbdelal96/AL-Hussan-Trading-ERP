import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { showToast } from "@/lib/toast";
import { useTranslation } from "@/i18n/useTranslation";
import { usersApi } from "@/services/api/users.api";
import { normalizeQueryFilters } from "@/lib/query-filters";
import type {
  UserFiltersDto,
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordDto,
  BulkCreateUsersDto,
} from "@/types/users.types";

// ============= Query Keys =============
export const USERS_KEYS = {
  all: ["users"] as const,
  lists: () => [...USERS_KEYS.all, "list"] as const,
  list: (filters: Partial<UserFiltersDto>) =>
    [...USERS_KEYS.lists(), filters] as const,
  deletedRoot: () => [...USERS_KEYS.all, "deleted"] as const,
  deleted: (filters: Partial<UserFiltersDto>) =>
    [...USERS_KEYS.deletedRoot(), filters] as const,
  details: () => [...USERS_KEYS.all, "detail"] as const,
  detail: (id: string) => [...USERS_KEYS.details(), id] as const,
  myProfile: () => [...USERS_KEYS.all, "my-profile"] as const,
  statistics: () => [...USERS_KEYS.all, "statistics"] as const,
};

const invalidateUsersLists = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() });
  queryClient.invalidateQueries({ queryKey: USERS_KEYS.deletedRoot() });
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

const isOptimisticLockConflict = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const status = (error as { response?: { status?: number } }).response?.status;
  return status === 409;
};

type DeleteUserInput = string | { id: string; rowVersion?: number };

const parseDeleteUserInput = (input: DeleteUserInput) =>
  typeof input === "string" ? { id: input, rowVersion: undefined } : input;

// ============= Queries =============

export const useUsers = (filters: UserFiltersDto = {}) => {
  const normalizedFilters = useMemo(
    () => normalizeQueryFilters(filters),
    [filters],
  );

  return useQuery({
    queryKey: USERS_KEYS.list(normalizedFilters),
    queryFn: () => usersApi.getAll(normalizedFilters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
};

export const useDeletedUsers = (filters: UserFiltersDto = {}) => {
  const normalizedFilters = useMemo(
    () => normalizeQueryFilters(filters),
    [filters],
  );

  return useQuery({
    queryKey: USERS_KEYS.deleted(normalizedFilters),
    queryFn: () => usersApi.getDeleted(normalizedFilters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
};

export const useUser = (id?: string) =>
  useQuery({
    queryKey: USERS_KEYS.detail(id || ""),
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
  });

export const useMyProfile = () =>
  useQuery({
    queryKey: USERS_KEYS.myProfile(),
    queryFn: () => usersApi.getMyProfile(),
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  });

export const useUsersStatistics = () =>
  useQuery({
    queryKey: USERS_KEYS.statistics(),
    queryFn: () => usersApi.getStatistics(),
    staleTime: 30_000,
  });

// ============= Mutations =============

export const useCreateUser = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserDto) => usersApi.create(payload),
    onSuccess: () => {
      invalidateUsersLists(queryClient);
      showToast.success(
        t("users.create.success", {
          defaultValue: "User created successfully",
        }),
      );
    },
    onError: (error: unknown, variables) => {
      const message =
        getApiErrorMessage(error) ||
        t("users.create.error", { defaultValue: "Failed to create user" }) ||
        "Failed to create user";
      showToast.error(message);
    },
  });
};

export const useBulkCreateUsers = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkCreateUsersDto) => usersApi.bulkCreate(payload),
    onSuccess: (data) => {
      invalidateUsersLists(queryClient);
      showToast.success(
        t("users.bulkCreate.success", {
          defaultValue: `Created ${data.created} users successfully`,
        }),
      );
    },
  });
};

export const useUpdateUser = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersApi.update(id, data),
    onSuccess: (_, variables) => {
      invalidateUsersLists(queryClient);
      queryClient.invalidateQueries({
        queryKey: USERS_KEYS.detail(variables.id),
      });
      showToast.success(
        t("users.update.success", {
          defaultValue: "User updated successfully",
        }),
      );
    },
    onError: (error: unknown, variables) => {
      const message = isOptimisticLockConflict(error)
        ? String(
            t("common.rowVersionConflict", {
              defaultValue:
                "تم تعديل بيانات المستخدم بواسطة مستخدم آخر. أعد تحميل الصفحة ثم حاول مرة أخرى.",
            }),
          )
        : getApiErrorMessage(error) ||
          t("users.update.error", { defaultValue: "Failed to update user" }) ||
          "Failed to update user";
      if (isOptimisticLockConflict(error)) {
        queryClient.invalidateQueries({
          queryKey: USERS_KEYS.detail(variables.id),
        });
      }
      showToast.error(message);
    },
  });
};

export const useDeleteUser = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteUserInput) => {
      const { id, rowVersion } = parseDeleteUserInput(input);
      return usersApi.delete(id, { rowVersion });
    },
    onSuccess: (_, input) => {
      const { id } = parseDeleteUserInput(input);
      invalidateUsersLists(queryClient);
      queryClient.removeQueries({ queryKey: USERS_KEYS.detail(id) });
      showToast.success(
        t("users.delete.success", {
          defaultValue: "User deleted successfully",
        }),
      );
    },
    onError: (error: unknown, input) => {
      const { id } = parseDeleteUserInput(input);
      if (isOptimisticLockConflict(error)) {
        queryClient.invalidateQueries({
          queryKey: USERS_KEYS.detail(id),
        });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      showToast.error(
        getApiErrorMessage(error) ||
          t("users.delete.error", { defaultValue: "Failed to delete user" }) ||
          "Failed to delete user",
      );
    },
  });
};

export const useResetUserPassword = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResetPasswordDto }) =>
      usersApi.resetPassword(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: USERS_KEYS.detail(variables.id),
      });
      showToast.success(
        t("users.resetPassword.success", {
          defaultValue: "Password reset successfully",
        }),
      );
    },
  });
};

export const useRestoreUser = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.restore(id),
    onSuccess: () => {
      invalidateUsersLists(queryClient);
      showToast.success(
        t("users.restore.success", {
          defaultValue: "User restored successfully",
        }),
      );
    },
  });
};

export const usePermanentlyDeleteUser = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.deletePermanently(id),
    onSuccess: () => {
      invalidateUsersLists(queryClient);
      showToast.success(
        t("users.delete.permanentSuccess", {
          defaultValue: "User permanently deleted successfully",
        }),
      );
    },
    onError: (error: unknown) => {
      showToast.error(
        getApiErrorMessage(error) ||
          t("users.delete.permanentError", {
            defaultValue: "Failed to permanently delete user",
          }) ||
          "Failed to permanently delete user",
      );
    },
  });
};

export const useUploadProfilePicture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) =>
      usersApi.uploadProfilePicture(userId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: USERS_KEYS.detail(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: USERS_KEYS.myProfile(),
      });
      invalidateUsersLists(queryClient);
    },
  });
};

export const useDeleteProfilePicture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersApi.deleteProfilePicture(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({
        queryKey: USERS_KEYS.detail(userId),
      });
      queryClient.invalidateQueries({
        queryKey: USERS_KEYS.myProfile(),
      });
      invalidateUsersLists(queryClient);
    },
  });
};
