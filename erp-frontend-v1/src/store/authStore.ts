import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, AuthState } from "../types";

interface AuthActions {
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: user !== null,
        }),

      setToken: (token) =>
        set({
          token,
        }),

      setRefreshToken: (refreshToken) =>
        set({
          refreshToken,
        }),

      setLoading: (isLoading) =>
        set({
          isLoading,
        }),

      setError: (error) =>
        set({
          error,
        }),

      login: (user, token, refreshToken) => {
        const primaryRole = Array.isArray(user.roles) ? user.roles[0] : user.role;
        const normalizedRole =
          typeof primaryRole === "string"
            ? primaryRole.toUpperCase()
            : primaryRole && typeof primaryRole === "object" && "name" in primaryRole
              ? String(primaryRole.name).toUpperCase()
              : undefined;

        // Normalize user data to support both single role and roles array
        const normalizedUser = {
          ...user,
          // Keep roles array if exists
          roles: user.roles || (user.role ? [user.role] : []),
          // Keep single role for backward compatibility
          role: normalizedRole || user.role,
          // Normalize permissions — backend sends string[], guard against legacy object arrays
          permissions: Array.isArray(user.permissions)
            ? user.permissions
                .map((p) =>
                  typeof p === "string"
                    ? p
                    : p && typeof p === "object"
                      ? `${(p as any).resource}:${(p as any).action}`
                      : "",
                )
                .filter(Boolean)
            : [],
        };

        set({
          user: normalizedUser,
          token,
          refreshToken,
          isAuthenticated: true,
          error: null,
          isLoading: false,
        });
      },

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      clearError: () =>
        set({
          error: null,
        }),
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
