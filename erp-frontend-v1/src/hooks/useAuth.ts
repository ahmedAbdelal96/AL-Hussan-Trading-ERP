import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { showToast } from "@/lib/toast";
import { useTranslation } from "@/i18n/useTranslation";
import { authApi } from "@/services/api/auth.api";
import { useAuthStore } from "@/store/authStore";
import type {
  LoginDto,
  ChangePasswordDto,
  ResetUserPasswordDto,
  LoginResponseDto,
} from "@/types/auth.types";
import type { User as StoreUser } from "@/types";

export const AUTH_KEYS = {
  all: ["auth"] as const,
  user: () => [...AUTH_KEYS.all, "user"] as const,
  currentUser: () => [...AUTH_KEYS.user(), "current"] as const,
};

const extractUserRoles = (user: unknown): string[] => {
  if (!user || typeof user !== "object") return [];

  const candidate = user as { roles?: unknown; role?: unknown };
  if (!Array.isArray(candidate.roles)) return [];

  const roles = candidate.roles
    .map((role): string => {
      if (typeof role === "string") return role;
      if (role && typeof role === "object" && "name" in role) {
        const name = (role as { name?: unknown }).name;
        return typeof name === "string" ? name : "";
      }
      return "";
    })
    .filter((role): role is string => role.length > 0);

  if (roles.length > 0) return roles;
  return typeof candidate.role === "string" ? [candidate.role] : [];
};

const mapLoginUserToStoreUser = (user: LoginResponseDto["user"]): StoreUser => {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const roles = Array.isArray(user.roles) ? user.roles : [];
  const primaryRole = roles[0];

  return {
    id: user.id,
    email: user.email,
    fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    role: primaryRole,
    roles,
    status: user.isActive ? "ACTIVE" : "INACTIVE",
    isActive: user.isActive,
    permissions: user.permissions,
  };
};

const toMessage = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim().length > 0) return value;
  return fallback;
};

export const useCurrentUser = () => {
  const { isAuthenticated, token } = useAuthStore();

  return useQuery({
    queryKey: AUTH_KEYS.currentUser(),
    queryFn: authApi.getCurrentUser,
    enabled: isAuthenticated && !!token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginDto) => authApi.login(credentials),
    onSuccess: (response: LoginResponseDto) => {
      login(
        mapLoginUserToStoreUser(response.user),
        response.tokens.accessToken,
        response.tokens.refreshToken,
      );

      queryClient.setQueryData(AUTH_KEYS.currentUser(), response.user);
      showToast.success(
        String(t("auth.login.success", { name: response.user.firstName })),
      );
      navigate("/dashboard");
    },
    onError: (error: unknown) => {
      const apiError = error as {
        response?: {
          status?: number;
          data?: { message?: string; error?: string } | string;
        };
      };

      const responseData = apiError.response?.data;
      let errorMessage = String(t("auth.login.error"));

      if (typeof responseData === "string") {
        errorMessage = responseData;
      } else if (responseData && typeof responseData === "object") {
        errorMessage =
          toMessage(responseData.message, "") ||
          toMessage(responseData.error, "") ||
          errorMessage;
      }

      showToast.error(errorMessage);
    },
  });
};

export const useLogout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout, refreshToken } = useAuthStore();

  return useMutation({
    mutationFn: () => authApi.logout(refreshToken || undefined),
    onSuccess: () => {
      logout();
      queryClient.clear();
      showToast.success(String(t("auth.logout.success")));
      navigate("/login");
    },
    onError: (error: unknown) => {
      logout();
      queryClient.clear();
      navigate("/login");

      const apiError = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        apiError.response?.data?.message || String(t("auth.logout.error"));
      showToast.error(String(errorMessage));
    },
  });
};

export const useRefreshToken = () => {
  const { setToken, setRefreshToken, logout, refreshToken } = useAuthStore();

  return useMutation({
    mutationFn: () => {
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }
      return authApi.refreshToken(refreshToken);
    },
    onSuccess: (tokens) => {
      setToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
    },
    onError: (error: unknown) => {
      console.error("Failed to refresh token:", error);
      logout();
    },
  });
};

export const useChangePassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: (passwordData: ChangePasswordDto) =>
      authApi.changePassword(passwordData),
    onSuccess: () => {
      showToast.success(String(t("auth.changePassword.success")));

      setTimeout(() => {
        showToast.info(String(t("auth.changePassword.pleaseLoginAgain")));

        logout();
        queryClient.clear();
        navigate("/signin", { replace: true });
      }, 1500);
    },
    onError: (error: unknown) => {
      const apiError = error as {
        response?: { status?: number; data?: { message?: string } };
      };

      const errorMessage =
        apiError.response?.data?.message ||
        String(t("auth.changePassword.error"));

      if (apiError.response?.status === 400) {
        showToast.error(
          String(t("auth.changePassword.invalidCurrentPassword")),
        );
      } else if (apiError.response?.status === 422) {
        showToast.error(String(t("auth.changePassword.weakPassword")));
      } else {
        showToast.error(String(errorMessage));
      }
    },
  });
};

export const useResetUserPassword = () => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      userId,
      passwordData,
    }: {
      userId: string;
      passwordData: ResetUserPasswordDto;
    }) => authApi.resetUserPassword(userId, passwordData),
    onSuccess: () => {
      showToast.success(String(t("auth.resetUserPassword.success")));
    },
    onError: (error: unknown) => {
      const apiError = error as {
        response?: {
          status?: number;
          data?: { message?: string; errors?: string[] } | string;
        };
      };

      const responseData = apiError.response?.data;
      const backendMessage =
        typeof responseData === "string"
          ? responseData
          : responseData?.message || "";

      const errorMessage =
        backendMessage || String(t("auth.resetUserPassword.error"));

      if (apiError.response?.status === 403) {
        showToast.error(String(t("auth.resetUserPassword.forbidden")));
      } else if (apiError.response?.status === 404) {
        showToast.error(String(t("auth.resetUserPassword.userNotFound")));
      } else if (apiError.response?.status === 400) {
        if (
          backendMessage
            .toLowerCase()
            .includes("different from current password")
        ) {
          showToast.error(
            String(
              t("auth.resetUserPassword.sameAsCurrent", {
                defaultValue:
                  "New password must be different from current password",
              }),
            ),
          );
        } else if (
          backendMessage.toLowerCase().includes("security requirements")
        ) {
          showToast.error(String(t("auth.resetUserPassword.weakPassword")));
        } else {
          showToast.error(String(errorMessage));
        }
      } else {
        showToast.error(String(errorMessage));
      }
    },
  });
};

export const useUnlockAccount = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => authApi.unlockAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showToast.success(String(t("auth.unlockAccount.success")));
    },
    onError: (error: unknown) => {
      const apiError = error as {
        response?: { status?: number; data?: { message?: string } };
      };

      const errorMessage =
        apiError.response?.data?.message ||
        String(t("auth.unlockAccount.error"));

      if (apiError.response?.status === 403) {
        showToast.error(String(t("auth.unlockAccount.unauthorized")));
      } else if (apiError.response?.status === 404) {
        showToast.error(String(t("auth.unlockAccount.userNotFound")));
      } else {
        showToast.error(String(errorMessage));
      }
    },
  });
};

export const useActiveUsers = () => {
  return useQuery({
    queryKey: ["active-sessions"],
    queryFn: () => authApi.getActiveSessions(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchInterval: 60 * 1000,
  });
};

export const useForceLogoutUser = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId: string) => authApi.forceLogoutUser(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-sessions"] });
      showToast.success(String(t("auth.sessions.forceLogoutUserSuccess")));
    },
    onError: (error: unknown) => {
      const apiError = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      const errorMessage =
        apiError.response?.data?.message ||
        String(t("auth.sessions.forceLogoutUserError"));

      if (apiError.response?.status === 400) {
        showToast.error(String(t("auth.sessions.forceLogoutUserInvalid")));
      } else if (apiError.response?.status === 403) {
        showToast.error(String(t("auth.sessions.forceLogoutUserForbidden")));
      } else if (apiError.response?.status === 404) {
        showToast.error(String(t("auth.sessions.userNotFound")));
      } else {
        showToast.error(errorMessage);
      }

      console.error("Force logout user failed:", error);
    },
  });
};

export const useForceLogoutAllUsers = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.forceLogoutAllUsers(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["active-sessions"] });
      showToast.success(
        String(
          t("auth.sessions.forceLogoutAllSuccess", {
            users: data.affectedUsers,
            sessions: data.affectedSessions,
          }),
        ),
      );
    },
    onError: (error: unknown) => {
      const apiError = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      const errorMessage =
        apiError.response?.data?.message ||
        String(t("auth.sessions.forceLogoutAllError"));

      if (apiError.response?.status === 403) {
        showToast.error(String(t("auth.sessions.forceLogoutAllForbidden")));
      } else {
        showToast.error(errorMessage);
      }

      console.error("Force logout all failed:", error);
    },
  });
};

export const useAuthState = () => {
  const auth = useAuthStore();

  return {
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    isLoading: auth.isLoading,
  };
};

export const useUserPermissions = () => {
  const { user } = useAuthStore();
  const userRoles = extractUserRoles(user);

  return {
    hasRole: (role: string) => userRoles.includes(role),
    hasAnyRole: (roles: string[]) =>
      roles.some((role) => userRoles.includes(role)),
    isSuperAdmin: () => userRoles.includes("SUPERADMIN"),
    isAdmin: () =>
      userRoles.includes("ADMIN") || userRoles.includes("SUPERADMIN"),
    hasPermission: (_resource: string, _action: string) => {
      if (userRoles.includes("SUPERADMIN")) return true;
      return false;
    },
  };
};

export const useAuth = () => {
  const auth = useAuthStore();
  const logoutMutation = useLogout();
  const userRoles = extractUserRoles(auth.user);

  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    logout: () => logoutMutation.mutate(),
    hasRole: (role: string) => userRoles.includes(role),
    clearError: auth.clearError,
  };
};

export { usePermissions } from "./usePermissions";
