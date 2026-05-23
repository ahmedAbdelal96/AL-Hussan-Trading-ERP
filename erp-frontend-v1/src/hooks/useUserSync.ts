/**
 * useUserSync — keeps the auth store in sync with the backend
 *
 * Problem: when an admin changes a user's roles while the user is logged in,
 * the sidebar (and ProtectedRoute) still shows stale permissions from the
 * login-time snapshot stored in Zustand.
 *
 * Solution: Re-fetch GET /auth/me:
 *   • Every 5 minutes in the background
 *   • Immediately when the browser tab regains focus (user switches back)
 *   • Immediately when the page becomes visible again
 *
 * When the response differs from the stored user, the store is updated and
 * React re-renders the sidebar / permission checks automatically.
 */

import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/services/api/auth.api";
import { useAuthStore } from "@/store/authStore";

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const QUERY_KEY = ["auth", "me", "sync"];

export function useUserSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  const { data: freshUser } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => authApi.getCurrentUser(),
    enabled: isAuthenticated,
    // Refresh every 5 min in the background
    refetchInterval: SYNC_INTERVAL_MS,
    // Always re-fetch when the tab / window comes into focus
    refetchOnWindowFocus: true,
    // Don't hammer on reconnect beyond the normal cycle
    refetchOnReconnect: true,
    // Keep previous data while re-fetching so nothing flickers
    staleTime: 60 * 1000, // 1 min - re-fetch after 1 min of staleness
    // Silently fail - don't show error toast for background sync
    retry: 1,
  });

  useEffect(() => {
    if (!freshUser) return;

    const stored = useAuthStore.getState().user;
    if (!stored) return;

    // Normalize roles - always uppercase strings
    const freshRoles: string[] = Array.isArray(freshUser.roles)
      ? freshUser.roles.map((r) => r.toUpperCase())
      : [];

    const storedRoles: string[] = Array.isArray(stored.roles)
      ? stored.roles.map((r) => String(r).toUpperCase())
      : [];

    // Normalize fresh permissions to string[]
    const freshPermissions: string[] = Array.isArray(freshUser.permissions)
      ? freshUser.permissions
      : [];

    const storedPermissions: string[] = Array.isArray(stored.permissions)
      ? (stored.permissions as string[])
      : [];

    // Deep compare - only update if something actually changed
    const rolesChanged =
      freshRoles.length !== storedRoles.length ||
      freshRoles.some((r) => !storedRoles.includes(r));

    const activeChanged = freshUser.isActive !== stored.isActive;
    const nameChanged =
      freshUser.firstName !== stored.firstName ||
      freshUser.lastName !== stored.lastName;

    const permissionsChanged =
      freshPermissions.length !== storedPermissions.length ||
      freshPermissions.some((p) => !storedPermissions.includes(p));

    if (rolesChanged || activeChanged || nameChanged || permissionsChanged) {
      useAuthStore.getState().updateUser({
        roles: freshRoles,
        // keep single-role field in sync (for backward compatibility)
        role: freshRoles.length > 0 ? freshRoles[0] : undefined,
        permissions: freshPermissions,
        isActive: freshUser.isActive,
        firstName: freshUser.firstName,
        lastName: freshUser.lastName,
        email: freshUser.email,
      });
    }
  }, [freshUser]);

  const forceSync = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  return { forceSync };
}
