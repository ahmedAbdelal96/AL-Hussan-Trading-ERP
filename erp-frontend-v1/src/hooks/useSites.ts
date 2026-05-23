/**
 * Sites Custom Hooks
 * React Query hooks for managing sites data and mutations
 *
 * Provides optimized data fetching with:
 * - Automatic caching and revalidation
 * - Optimistic updates
 * - Error handling with user-friendly messages
 * - Loading states
 * - Cache invalidation on mutations
 *
 * @module useSites
 */

import { useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { sitesApi } from "@/services/api/sites.api";
import { showToast } from "@/lib/toast";
import { useTranslation } from "@/i18n/useTranslation";
import { normalizeQueryFilters } from "@/lib/query-filters";
import type { SiteFiltersDto, UpdateSiteDto } from "@/types/sites.types";

// ============= Query Keys =============

/**
 * Query keys for React Query caching
 * Organized hierarchically for efficient cache invalidation
 */
export const SITES_KEYS = {
  all: ["sites"] as const,
  lists: () => [...SITES_KEYS.all, "list"] as const,
  list: (filters: Partial<SiteFiltersDto>) =>
    [...SITES_KEYS.lists(), filters] as const,
  deleted: () => [...SITES_KEYS.all, "deleted"] as const,
  stats: () => [...SITES_KEYS.all, "stats"] as const,
  details: () => [...SITES_KEYS.all, "detail"] as const,
  detail: (id: string) => [...SITES_KEYS.details(), id] as const,
};

type DeleteSiteInput = string | { id: string; rowVersion?: number };

const parseDeleteSiteInput = (input: DeleteSiteInput) =>
  typeof input === "string" ? { id: input, rowVersion: undefined } : input;

// ============= Query Hooks =============

/**
 * Fetch paginated sites with filters
 *
 * @param filters - Filtering, sorting, and pagination options
 * @returns Query result with data, loading, and error states
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useSites({
 *   page: 1,
 *   pageSize: 10,
 *   status: SiteStatus.ACTIVE,
 *   city: 'Riyadh'
 * });
 * ```
 */
export const useSites = (filters: SiteFiltersDto = {}) => {
  const normalizedFilters = useMemo(
    () => normalizeQueryFilters(filters),
    [filters],
  );

  return useQuery({
    queryKey: SITES_KEYS.list(normalizedFilters),
    queryFn: () => sitesApi.getAll(normalizedFilters),
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in garbage collection for 5 minutes
    placeholderData: keepPreviousData, // Keep showing old data while loading new data
  });
};

/**
 * Fetch single site by ID
 *
 * @param id - Site unique identifier
 * @returns Query result with site data
 *
 * @example
 * ```tsx
 * const { data: site, isLoading } = useSite('site-id-123');
 * ```
 */
export const useSite = (id: string) => {
  return useQuery({
    queryKey: SITES_KEYS.detail(id),
    queryFn: () => sitesApi.getById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 60000, // Cache for 1 minute
  });
};

// ============= Mutation Hooks =============

/**
 * Create new site mutation
 *
 * Features:
 * - Invalidates sites list cache on success
 * - Shows success/error toast notifications
 * - Handles validation errors from backend
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * const createMutation = useCreateSite();
 *
 * const handleSubmit = async (data: CreateSiteDto) => {
 *   await createMutation.mutateAsync(data);
 *   navigate('/sites');
 * };
 * ```
 */
export const useCreateSite = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sitesApi.create,
    onSuccess: () => {
      // Invalidate and refetch sites list and statistics
      queryClient.invalidateQueries({ queryKey: SITES_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SITES_KEYS.stats() });
      showToast.success(
        t("sites.create.success", { defaultValue: "تم إضافة الموقع بنجاح" }),
      );
    },
    onError: (error: unknown) => {
      // 400 validation errors: axiosConfig already shows a toast + form sets inline errors
      if (error instanceof AxiosError && error.response?.status === 400) return;
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        String(
          t("sites.create.error", { defaultValue: "حدث خطأ أثناء إضافة الموقع" }),
        );
      showToast.error(message);
    },
  });
};

/**
 * Bulk create sites mutation
 *
 * @returns Mutation object for creating multiple sites
 *
 * @example
 * ```tsx
 * const bulkCreateMutation = useBulkCreateSites();
 *
 * const handleBulkImport = async (sites: CreateSiteDto[]) => {
 *   await bulkCreateMutation.mutateAsync({ sites });
 * };
 * ```
 */
export const useBulkCreateSites = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sitesApi.bulkCreate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SITES_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SITES_KEYS.stats() });
      showToast.success(
        t("sites.bulkCreate.success", {
          defaultValue: `تم إضافة ${data.length} موقع بنجاح`,
        }),
      );
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        String(
          t("sites.bulkCreate.error", {
            defaultValue: "حدث خطأ أثناء الإضافة الجماعية",
          }),
        );
      showToast.error(message);
    },
  });
};

/**
 * Update site mutation
 *
 * Features:
 * - Optimistic updates for better UX
 * - Invalidates both list and detail caches
 * - Rolls back on error
 *
 * @returns Mutation object with update function
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateSite();
 *
 * const handleUpdate = async (id: string, data: UpdateSiteDto) => {
 *   await updateMutation.mutateAsync({ id, data });
 * };
 * ```
 */
export const useUpdateSite = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSiteDto }) =>
      sitesApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate list, detail, and statistics caches
      queryClient.invalidateQueries({ queryKey: SITES_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: SITES_KEYS.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: SITES_KEYS.stats() });
      showToast.success(
        t("sites.update.success", { defaultValue: "تم تحديث الموقع بنجاح" }),
      );
    },
    onError: (error: unknown, variables) => {
      // 400 validation errors: axiosConfig already shows a toast + form sets inline errors
      if (error instanceof AxiosError && error.response?.status === 400) return;
      if (error instanceof AxiosError && error.response?.status === 409) {
        queryClient.invalidateQueries({
          queryKey: SITES_KEYS.detail(variables.id),
        });
        showToast.error(
          t("common.rowVersionConflict", {
            defaultValue:
              "This site was updated by another user. Please reload and try again.",
          }),
        );
        return;
      }
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        String(
          t("sites.update.error", { defaultValue: "حدث خطأ أثناء تحديث الموقع" }),
        );
      showToast.error(message);
    },
  });
};

/**
 * Delete site mutation
 *
 * Features:
 * - Confirmation dialog (handled in component)
 * - Optimistic update removes from UI immediately
 * - Rolls back on error
 *
 * @returns Mutation object with delete function
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteSite();
 *
 * const handleDelete = async (id: string) => {
 *     await deleteMutation.mutateAsync(id);
 *   }
 * };
 * ```
 */
export const useDeleteSite = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteSiteInput) => {
      const { id, rowVersion } = parseDeleteSiteInput(input);
      return sitesApi.delete(id, { rowVersion });
    },
    onSuccess: () => {
      // Invalidate all sites queries and statistics
      queryClient.invalidateQueries({ queryKey: SITES_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SITES_KEYS.stats() });
      showToast.success(
        t("sites.delete.success", { defaultValue: "تم حذف الموقع بنجاح" }),
      );
    },
    onError: (error: unknown, input) => {
      const { id } = parseDeleteSiteInput(input);
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 409) {
        queryClient.invalidateQueries({ queryKey: SITES_KEYS.detail(id) });
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        String(
          t("sites.delete.error", { defaultValue: "حدث خطأ أثناء حذف الموقع" }),
        );
      showToast.error(message);
    },
  });
};

/**
 * Restore deleted site mutation
 *
 * Features:
 * - Restores soft-deleted site
 * - Invalidates queries to refresh UI
 * - Toast notifications
 *
 * @returns Mutation object with restore function
 *
 * @example
 * ```tsx
 * const restoreMutation = useRestoreSite();
 *
 * const handleRestore = async (id: string) => {
 *   await restoreMutation.mutateAsync(id);
 * };
 * ```
 */
export const useRestoreSite = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sitesApi.restore,
    onSuccess: () => {
      // Invalidate active sites, deleted sites, and statistics queries
      queryClient.invalidateQueries({ queryKey: SITES_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SITES_KEYS.deleted() });
      queryClient.invalidateQueries({ queryKey: SITES_KEYS.stats() });
      showToast.success(
        t("sites.restore.success", { defaultValue: "تم استعادة الموقع بنجاح" }),
      );
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        String(
          t("sites.restore.error", {
            defaultValue: "حدث خطأ أثناء استعادة الموقع",
          }),
        );
      showToast.error(message);
    },
  });
};

/**
 * Hook to fetch sites statistics
 * Retrieves comprehensive statistics about sites
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading, error } = useGetSitesStats();
 * ```
 */
export const useGetSitesStats = () => {
  return useQuery({
    queryKey: SITES_KEYS.stats(),
    queryFn: sitesApi.getStats,
    staleTime: 0, // Always fetch fresh data for instant updates
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
  });
};
