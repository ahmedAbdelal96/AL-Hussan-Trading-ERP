import { apiClient } from "./axiosConfig";
import type {
  UserEntity,
  CreateUserDto,
  UpdateUserDto,
  UserFiltersDto,
  ResetPasswordDto,
  BulkCreateUsersDto,
  PaginatedUsersResponse,
  UserStatsResponse,
} from "@/types/users.types";

const BASE_URL = "/users";

function getCurrentUserIdFromPersistedAuth(): string {
  const persistedState = localStorage.getItem("auth-store");
  if (!persistedState) {
    throw new Error("User is not authenticated");
  }

  try {
    const parsed = JSON.parse(persistedState) as {
      state?: { user?: { id?: string } };
    };
    const userId = parsed?.state?.user?.id;
    if (!userId) {
      throw new Error("Authenticated user id is missing");
    }
    return userId;
  } catch {
    throw new Error("Unable to read authenticated user from local storage");
  }
}

export const usersApi = {
  // Get all users with filters and pagination
  getAll: async (
    filters: Partial<UserFiltersDto> = {},
  ): Promise<PaginatedUsersResponse> => {
    const { data } = await apiClient.get<PaginatedUsersResponse>(BASE_URL, {
      params: filters,
    });
    return data;
  },

  // Get users KPI statistics (independent from pagination)
  getStatistics: async (): Promise<UserStatsResponse> => {
    const { data } = await apiClient.get<UserStatsResponse>(
      `${BASE_URL}/statistics`,
    );
    return data;
  },

  // Get user by ID
  getById: async (id: string): Promise<UserEntity> => {
    const { data } = await apiClient.get<UserEntity>(`${BASE_URL}/${id}`);
    return data;
  },

  // Get current user's full profile data
  getMyProfile: async (): Promise<UserEntity> => {
    const userId = getCurrentUserIdFromPersistedAuth();
    const { data } = await apiClient.get<UserEntity>(`${BASE_URL}/${userId}`);
    return data;
  },

  // Create new user
  create: async (payload: CreateUserDto): Promise<UserEntity> => {
    const { data } = await apiClient.post<UserEntity>(BASE_URL, payload);
    return data;
  },

  // Bulk create users
  bulkCreate: async (
    payload: BulkCreateUsersDto,
  ): Promise<{ message: string; created: number }> => {
    const { data } = await apiClient.post<{ message: string; created: number }>(
      `${BASE_URL}/bulk`,
      payload,
    );
    return data;
  },

  // Update user
  update: async (id: string, payload: UpdateUserDto): Promise<UserEntity> => {
    const { data } = await apiClient.put<UserEntity>(
      `${BASE_URL}/${id}`,
      payload,
    );
    return data;
  },

  // Delete user (soft delete)
  delete: async (
    id: string,
    options?: { rowVersion?: number },
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(
      `${BASE_URL}/${id}`,
      {
        data: options?.rowVersion
          ? { rowVersion: options.rowVersion }
          : undefined,
      },
    );
    return data;
  },

  // Reset user password
  resetPassword: async (
    id: string,
    payload: ResetPasswordDto,
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>(
      `${BASE_URL}/${id}/reset-password`,
      payload,
    );
    return data;
  },

  // Get deleted users with filters and pagination
  getDeleted: async (
    filters: Partial<UserFiltersDto> = {},
  ): Promise<PaginatedUsersResponse> => {
    const { data } = await apiClient.get<PaginatedUsersResponse>(
      `${BASE_URL}/deleted/list`,
      {
        params: filters,
      },
    );
    return data;
  },

  // Restore deleted user
  restore: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>(
      `${BASE_URL}/${id}/restore`,
    );
    return data;
  },

  // Permanently delete soft-deleted user
  deletePermanently: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(
      `${BASE_URL}/${id}/permanent`,
    );
    return data;
  },

  // Upload profile picture
  uploadProfilePicture: async (
    userId: string,
    file: File,
  ): Promise<{ message: string; profilePicture: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await apiClient.post<{
      message: string;
      profilePicture: string;
    }>(`${BASE_URL}/${userId}/profile-picture`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  // Delete profile picture
  deleteProfilePicture: async (
    userId: string,
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(
      `${BASE_URL}/${userId}/profile-picture`,
    );
    return data;
  },
};
