/**
 * Projects Custom Hooks
 *
 * React Query hooks for managing project data and server state.
 * Provides optimized caching, automatic refetching, and mutation handling.
 *
 * Features:
 * - Hierarchical query keys for efficient cache invalidation
 * - Proper error handling with user-friendly toast messages
 * - Optimistic updates for better UX
 * - Automatic cache invalidation on mutations
 *
 * @module useProjects
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  UseQueryOptions,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { projectsApi } from "@/services/api/projects.api";
import { showToast } from "@/lib/toast";
import { useTranslation } from "@/i18n/useTranslation";
import { normalizeQueryFilters } from "@/lib/query-filters";
import type {
  ProjectEntity,
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProgressDto,
  ProjectFiltersDto,
  PaginatedProjectsResponse,
  MediaFiltersDto,
  ProjectEmployeeEntity,
  AssignEmployeeToProjectDto,
  UpdateProjectEmployeeDto,
  ProjectAssetEntity,
  AssignAssetFromProjectDto,
} from "@/types/projects.types";
import type {
  ProjectsStatistics,
  ProjectsStatisticsParams,
} from "@/types/projects-statistics";

/**
 * Query Keys for Projects
 * Hierarchical structure for efficient cache management
 */
export const PROJECTS_KEYS = {
  all: ["projects"] as const,
  lists: () => [...PROJECTS_KEYS.all, "list"] as const,
  list: (filters: Partial<ProjectFiltersDto>) =>
    [...PROJECTS_KEYS.lists(), filters] as const,
  details: () => [...PROJECTS_KEYS.all, "detail"] as const,
  detail: (id: string) => [...PROJECTS_KEYS.details(), id] as const,
  media: (id: string) => [...PROJECTS_KEYS.detail(id), "media"] as const,
  mediaList: (id: string, filters: MediaFiltersDto) =>
    [...PROJECTS_KEYS.media(id), filters] as const,
  statistics: () => [...PROJECTS_KEYS.all, "statistics"] as const,
  statisticsWithParams: (params?: ProjectsStatisticsParams) =>
    params
      ? ([...PROJECTS_KEYS.statistics(), params] as const)
      : PROJECTS_KEYS.statistics(),
  documents: (id: string) =>
    [...PROJECTS_KEYS.detail(id), "documents"] as const,
  employees: (id: string) =>
    [...PROJECTS_KEYS.detail(id), "employees"] as const,
  assets: (id: string) => [...PROJECTS_KEYS.detail(id), "assets"] as const,
};

const invalidateProjectLists = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: PROJECTS_KEYS.lists() });
};

const invalidateProjectDetail = (
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
) => {
  queryClient.invalidateQueries({ queryKey: PROJECTS_KEYS.detail(projectId) });
};

const invalidateProjectDocuments = (
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
) => {
  queryClient.invalidateQueries({ queryKey: PROJECTS_KEYS.documents(projectId) });
};

const invalidateProjectEmployees = (
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
) => {
  queryClient.invalidateQueries({ queryKey: PROJECTS_KEYS.employees(projectId) });
};

const invalidateProjectAssets = (
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
) => {
  queryClient.invalidateQueries({ queryKey: PROJECTS_KEYS.assets(projectId) });
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

const isOptimisticLockConflict = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const status = (error as { response?: { status?: number } }).response?.status;
  return status === 409;
};

type DeleteProjectInput = string | { id: string; rowVersion?: number };

const parseDeleteProjectInput = (input: DeleteProjectInput) =>
  typeof input === "string" ? { id: input, rowVersion: undefined } : input;

/**
 * Hook: Get all projects with filters
 *
 * Fetches paginated list of projects with optional filtering and sorting.
 * Implements 30-second stale time for optimal performance.
 *
 * @param filters - Query parameters for filtering and pagination
 * @returns Query result with projects data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useProjects({
 *   page: 1,
 *   pageSize: 10,
 *   status: ProjectStatus.ACTIVE
 * });
 * ```
 */
export const useProjects = (
  filters: ProjectFiltersDto = {},
  options?: Omit<
    UseQueryOptions<PaginatedProjectsResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  const normalizedFilters = useMemo(
    () => normalizeQueryFilters(filters),
    [filters],
  );

  return useQuery({
    queryKey: PROJECTS_KEYS.list(normalizedFilters),
    queryFn: () => projectsApi.getAll(normalizedFilters),
    placeholderData: keepPreviousData, // Keep showing old data while loading new data
    staleTime: 30000, // 30 seconds
    ...options,
  });
};

/**
 * Hook: Get single project by ID
 *
 * Fetches detailed information for a specific project.
 * Only executes when ID is provided (enabled: !!id).
 *
 * @param id - Project UUID
 * @param options - Additional query options
 * @returns Query result with project data
 *
 * @example
 * ```tsx
 * const { data: project, isLoading } = useProject('project-id-123');
 * ```
 */
export const useProject = (
  id: string,
  options?: Omit<UseQueryOptions<ProjectEntity>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: PROJECTS_KEYS.detail(id),
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
    staleTime: 60000, // 1 minute for detail view
    ...options,
  });
};

/**
 * Hook: Create new project
 *
 * Mutation hook for creating a new project.
 * Automatically invalidates project lists cache on success.
 *
 * @returns Mutation object with mutate/mutateAsync functions
 *
 * @example
 * ```tsx
 * const createMutation = useCreateProject();
 *
 * const handleCreate = async (data: CreateProjectDto) => {
 *   await createMutation.mutateAsync(data);
 *   navigate('/projects');
 * };
 * ```
 */
export const useCreateProject = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectDto) => projectsApi.create(payload),
    onSuccess: () => {
      // Invalidate all project lists to refetch with new data
      invalidateProjectLists(queryClient);
      showToast.success(t("projects.create.success"));
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error) || String(t("projects.create.error"));
      showToast.error(message);
    },
  });
};

/**
 * Hook: Update existing project
 *
 * Mutation hook for updating project information.
 * Invalidates both list and detail caches for consistency.
 *
 * @returns Mutation object with mutate/mutateAsync functions
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateProject();
 *
 * const handleUpdate = async (id: string, data: UpdateProjectDto) => {
 *   await updateMutation.mutateAsync({ id, data });
 * };
 * ```
 */
export const useUpdateProject = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectDto }) =>
      projectsApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate lists to show updated data in tables
      invalidateProjectLists(queryClient);
      // Invalidate specific project detail
      invalidateProjectDetail(queryClient, variables.id);
      showToast.success(t("projects.update.success"));
    },
    onError: (error: unknown, variables) => {
      const message = isOptimisticLockConflict(error)
        ? String(
            t("common.rowVersionConflict", {
              defaultValue:
                "تم تعديل بيانات المشروع بواسطة مستخدم آخر. أعد تحميل الصفحة ثم حاول مرة أخرى.",
            }),
          )
        : getApiErrorMessage(error) || String(t("projects.update.error"));
      if (isOptimisticLockConflict(error)) {
        invalidateProjectDetail(queryClient, variables.id);
      }
      showToast.error(message);
    },
  });
};

/**
 * Hook: Delete project
 *
 * Mutation hook for soft-deleting a project.
 * Removes project from cache and refetches lists.
 *
 * @returns Mutation object with mutate/mutateAsync functions
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteProject();
 *
 * const handleDelete = async (id: string) => {
 *     await deleteMutation.mutateAsync(id);
 *   }
 * };
 * ```
 */
export const useDeleteProject = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteProjectInput) => {
      const { id, rowVersion } = parseDeleteProjectInput(input);
      return projectsApi.delete(id, { rowVersion });
    },
    onSuccess: (_, input) => {
      const { id } = parseDeleteProjectInput(input);
      // Invalidate all lists to remove deleted project
      invalidateProjectLists(queryClient);
      queryClient.removeQueries({ queryKey: PROJECTS_KEYS.detail(id) });
      showToast.success(t("projects.delete.success"));
    },
    onError: (error: unknown, input) => {
      const { id } = parseDeleteProjectInput(input);
      if (isOptimisticLockConflict(error)) {
        invalidateProjectDetail(queryClient, id);
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message = getApiErrorMessage(error) || String(t("projects.delete.error"));
      showToast.error(message);
    },
  });
};

/**
 * Hook: Update project progress
 *
 * Specialized mutation for updating completion percentage and progress notes.
 * Useful for quick progress updates without full project edit.
 *
 * @returns Mutation object with mutate/mutateAsync functions
 *
 * @example
 * ```tsx
 * const progressMutation = useUpdateProjectProgress();
 *
 * const handleProgressUpdate = async (id: string, percentage: number) => {
 *   await progressMutation.mutateAsync({
 *     id,
 *     data: { completionPercentage: percentage }
 *   });
 * };
 * ```
 */
export const useUpdateProjectProgress = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProgressDto }) =>
      projectsApi.updateProgress(id, data),
    onSuccess: (_, variables) => {
      // Invalidate lists to show updated progress
      invalidateProjectLists(queryClient);
      // Invalidate specific project detail
      invalidateProjectDetail(queryClient, variables.id);
      showToast.success(t("projects.progress.updateSuccess"));
    },
    onError: (error: unknown, variables) => {
      const message = isOptimisticLockConflict(error)
        ? String(
            t("common.rowVersionConflict", {
              defaultValue:
                "تم تعديل البيانات بواسطة مستخدم آخر. يرجى إعادة تحميل الصفحة ثم المحاولة مرة أخرى.",
            }),
          )
        : getApiErrorMessage(error) || String(t("projects.progress.updateError"));
      if (isOptimisticLockConflict(error)) {
        invalidateProjectDetail(queryClient, variables.id);
      }
      showToast.error(message);
    },
  });
};

/**
 * Hook: Get project media
 *
 * Fetches all media files (photos, documents) associated with a project.
 * Supports filtering by category and pagination.
 *
 * @param projectId - Project UUID
 * @param filters - Query parameters for filtering and pagination
 * @returns Query result with media data
 *
 * @example
 * ```tsx
 * const { data: media, isLoading } = useProjectMedia('project-id', {
 *   category: MediaCategory.PROGRESS_PHOTO,
 *   page: 1,
 *   pageSize: 20
 * });
 * ```
 */
export const useProjectMedia = (
  projectId: string,
  filters: MediaFiltersDto,
) => {
  return useQuery({
    queryKey: PROJECTS_KEYS.mediaList(projectId, filters),
    queryFn: () => projectsApi.getMedia(projectId, filters),
    enabled: !!projectId,
    staleTime: 60000, // 1 minute
  });
};

/**
 * Hook: Get projects statistics
 *
 * Fetches comprehensive statistics including KPIs, breakdowns, and trends.
 * Implements 5-minute stale time for optimal performance.
 * Refetches automatically on window focus.
 *
 * @param params - Optional filter parameters (date range, status, site, manager)
 * @param options - Additional query options
 * @returns Query result with statistics data
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useProjectsStatistics({
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31',
 *   status: ProjectStatus.ACTIVE
 * });
 * ```
 */
export const useProjectsStatistics = (
  params?: ProjectsStatisticsParams,
  options?: Omit<UseQueryOptions<ProjectsStatistics>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: PROJECTS_KEYS.statisticsWithParams(params),
    queryFn: () => projectsApi.statistics.getProjectsStatistics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 3,
    ...options,
  });
};

/**
 * Hook: Get all documents for a project
 *
 * Fetches all documents associated with a specific project.
 * Only executes when project ID is provided.
 *
 * @param projectId - Project UUID
 * @returns Query result with documents array
 *
 * @example
 * ```tsx
 * const { data: documents, isLoading } = useProjectDocuments('project-id-123');
 * ```
 */
export const useProjectDocuments = (projectId: string) => {
  return useQuery({
    queryKey: PROJECTS_KEYS.documents(projectId),
    queryFn: () => projectsApi.documents.getAll(projectId),
    enabled: !!projectId,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook: Upload project documents
 *
 * Mutation for uploading one or multiple documents to a project.
 * Automatically invalidates documents cache and shows success toast.
 *
 * @returns Mutation object with uploadDocuments function
 *
 * @example
 * ```tsx
 * const uploadDocuments = useUploadProjectDocuments();
 *
 * const handleUpload = async (files: File[]) => {
 *   await uploadDocuments.mutateAsync({
 *     projectId: 'project-id-123',
 *     files,
 *     metadata: {
 *       documentType: 'contract',
 *       documentName: 'Project Contract',
 *       issueDate: '2024-01-01',
 *       expiryDate: '2025-01-01'
 *     }
 *   });
 * };
 * ```
 */
export const useUploadProjectDocuments = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async ({
      projectId,
      files,
      metadata,
    }: {
      projectId: string;
      files: File[];
      metadata: {
        documentType: string;
        documentName: string;
        issueDate?: string;
        expiryDate?: string;
        notes?: string;
      };
    }) => {
      return projectsApi.documents.upload(projectId, files, metadata);
    },
    onSuccess: (_, variables) => {
      invalidateProjectDocuments(queryClient, variables.projectId);
      showToast.success(
        t("projects.documents.upload.success", {
          defaultValue: "Documents uploaded successfully",
        }),
      );
    },
    onError: (error: unknown) => {
      const message =
        getApiErrorMessage(error) ||
        String(
          t("projects.documents.upload.error", {
            defaultValue: "Failed to upload documents",
          }),
        );
      showToast.error(message);
    },
  });
};
/**
 * Hook: Delete project document
 *
 * Mutation for deleting a specific document from a project.
 * Automatically invalidates documents cache and shows success toast.
 *
 * @returns Mutation object with deleteDocument function
 *
 * @example
 * ```tsx
 * const deleteDocument = useDeleteProjectDocument();
 *
 * const handleDelete = async (documentId: string) => {
 *   await deleteDocument.mutateAsync({
 *     projectId: 'project-id-123',
 *     documentId
 *   });
 * };
 * ```
 */
export const useDeleteProjectDocument = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async ({
      projectId,
      documentId,
    }: {
      projectId: string;
      documentId: string;
    }) => {
      return projectsApi.documents.delete(projectId, documentId);
    },
    onSuccess: (_, variables) => {
      invalidateProjectDocuments(queryClient, variables.projectId);
      showToast.success(
        t("projects.documents.delete.success", {
          defaultValue: "Document deleted successfully",
        }),
      );
    },
    onError: (error: unknown) => {
      const message =
        getApiErrorMessage(error) ||
        String(
          t("projects.documents.delete.error", {
            defaultValue: "Failed to delete document",
          }),
        );
      showToast.error(message);
    },
  });
};

/** Fetch employees assigned to a project */
export const useProjectEmployees = (projectId: string, activeOnly = true) => {
  return useQuery<ProjectEmployeeEntity[]>({
    queryKey: PROJECTS_KEYS.employees(projectId),
    queryFn: () => projectsApi.employees.getAll(projectId, activeOnly),
    enabled: !!projectId,
    staleTime: 30000,
  });
};

/** Assign an employee to a project */
export const useAssignEmployeeToProject = (projectId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: AssignEmployeeToProjectDto) =>
      projectsApi.employees.assign(projectId, payload),
    onSuccess: () => {
      invalidateProjectEmployees(queryClient, projectId);
      showToast.success(t("projects.employees.assign.success"));
    },
    onError: (error: unknown) => {
      if (isOptimisticLockConflict(error)) {
        invalidateProjectEmployees(queryClient, projectId);
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const serverMessage = getApiErrorMessage(error) || "";
      const isAlreadyAssigned =
        serverMessage.toLowerCase().includes("already assigned") ||
        serverMessage.toLowerCase().includes("already actively");
      const message = isAlreadyAssigned
        ? t("projects.employees.assign.alreadyAssigned")
        : t("projects.employees.assign.error");
      showToast.error(message);
    },
  });
};

/** Update a project employee assignment */
export const useUpdateProjectEmployee = (projectId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      assignmentId,
      data,
    }: {
      assignmentId: string;
      data: UpdateProjectEmployeeDto;
    }) => projectsApi.employees.update(projectId, assignmentId, data),
    onSuccess: () => {
      invalidateProjectEmployees(queryClient, projectId);
      showToast.success(t("projects.employees.update.success"));
    },
    onError: (error: unknown) => {
      if (isOptimisticLockConflict(error)) {
        invalidateProjectEmployees(queryClient, projectId);
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        getApiErrorMessage(error) || String(t("projects.employees.update.error"));
      showToast.error(message);
    },
  });
};

/** Remove (deactivate) an employee assignment from a project */
export const useRemoveProjectEmployee = (projectId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (assignmentId: string) =>
      projectsApi.employees.remove(projectId, assignmentId),
    onSuccess: () => {
      invalidateProjectEmployees(queryClient, projectId);
      showToast.success(t("projects.employees.remove.success"));
    },
    onError: (error: unknown) => {
      if (isOptimisticLockConflict(error)) {
        invalidateProjectEmployees(queryClient, projectId);
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        getApiErrorMessage(error) || String(t("projects.employees.remove.error"));
      showToast.error(message);
    },
  });
};


/** Fetch assets assigned to a project */
export const useProjectAssets = (projectId: string, activeOnly = true) => {
  return useQuery<ProjectAssetEntity[]>({
    queryKey: PROJECTS_KEYS.assets(projectId),
    queryFn: () => projectsApi.assets.getAll(projectId, activeOnly),
    enabled: !!projectId,
    staleTime: 30000,
  });
};

/** Assign an asset to a project */
export const useAssignAssetToProject = (projectId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: AssignAssetFromProjectDto) =>
      projectsApi.assets.assign(projectId, payload),
    onSuccess: () => {
      invalidateProjectAssets(queryClient, projectId);
      showToast.success(t("projects.assets.assign.success"));
    },
    onError: (error: unknown) => {
      if (isOptimisticLockConflict(error)) {
        invalidateProjectAssets(queryClient, projectId);
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const serverMessage = getApiErrorMessage(error) || "";
      const isAlreadyAssigned =
        serverMessage.toLowerCase().includes("already assigned") ||
        serverMessage.toLowerCase().includes("already active");
      const message = isAlreadyAssigned
        ? t("projects.assets.assign.alreadyAssigned")
        : t("projects.assets.assign.error");
      showToast.error(message);
    },
  });
};

/** Remove (deactivate) an asset assignment from a project */
export const useRemoveProjectAsset = (projectId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (assignmentId: string) =>
      projectsApi.assets.remove(projectId, assignmentId),
    onSuccess: () => {
      invalidateProjectAssets(queryClient, projectId);
      showToast.success(t("projects.assets.remove.success"));
    },
    onError: (error: unknown) => {
      if (isOptimisticLockConflict(error)) {
        invalidateProjectAssets(queryClient, projectId);
        showToast.error(String(t("common.rowVersionConflict")));
        return;
      }
      const message =
        getApiErrorMessage(error) || String(t("projects.assets.remove.error"));
      showToast.error(message);
    },
  });
};
