/**
 * Project Form Page
 *
 * Unified page for creating new projects and editing existing ones.
 * Auto-detects mode based on URL parameters.
 *
 * Features:
 * - Dynamic mode detection (create/edit)
 * - Form pre-filling for edit mode
 * - Loading states with spinner
 * - Error handling with user-friendly messages
 * - Help steps section for user guidance
 * - Back navigation
 * - Responsive design
 *
 * @page ProjectFormPage
 */

import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { HelpSteps } from "@/components/common/HelpSteps";
import { PageShell } from "@/components/common/PageShell";
import { ProjectForm } from "@/features/projects/components/ProjectForm";
import {
  useProject,
  useCreateProject,
  useUpdateProject,
} from "@/hooks/useProjects";
import type {
  CreateProjectDto,
  UpdateProjectDto,
} from "@/types/projects.types";

/**
 * ProjectFormPage Component
 * Handles both create and edit modes for projects
 */
export const ProjectFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Fetch project data for edit mode
  const {
    data: project,
    isLoading: isLoadingProject,
    error: projectError,
  } = useProject(id || "", { enabled: isEditMode });

  // Mutations
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  /**
   * Handle form submission
   * Routes to appropriate mutation based on mode
   */
  const handleSubmit = async (data: CreateProjectDto | UpdateProjectDto) => {
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: id!,
          data: {
            ...(data as UpdateProjectDto),
            rowVersion: project?.rowVersion,
          },
        });
      } else {
        await createMutation.mutateAsync(data as CreateProjectDto);
      }
      // Navigate back to list on success
      navigate("/projects");
    } catch (error) {
      // Error handled by mutation hooks with toast
      console.error("Form submission error:", error);
    }
  };

  // Loading state for edit mode
  if (isEditMode && isLoadingProject) {
    return (
      <PageShell
        size="narrow"
        density="compact"
        className="flex items-center justify-center min-h-screen"
      >
        <LoadingSpinner />
      </PageShell>
    );
  }

  // Error state for edit mode
  if (isEditMode && projectError) {
    return (
      <PageShell size="narrow" density="compact">
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-4">
          <p className="font-semibold">{t("projects.list.error")}</p>
          <p className="text-sm mt-1">
            {(projectError as { response?: { data?: { message?: string } } })
              ?.response?.data?.message || t("projects.list.error")}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/projects")}
          >
            {t("projects.actions.back")}
          </Button>
        </div>
      </PageShell>
    );
  }

  // Prepare help steps
  const helpSteps = [
    `1. ${t("projects.helpSteps.step1.title")}: ${t(
      "projects.helpSteps.step1.description",
    )}`,
    `2. ${t("projects.helpSteps.step2.title")}: ${t(
      "projects.helpSteps.step2.description",
    )}`,
    `3. ${t("projects.helpSteps.step3.title")}: ${t(
      "projects.helpSteps.step3.description",
    )}`,
    `4. ${t("projects.helpSteps.step4.title")}: ${t(
      "projects.helpSteps.step4.description",
    )}`,
    `5. ${t("projects.helpSteps.step5.title")}: ${t(
      "projects.helpSteps.step5.description",
    )}`,
    `6. ${t("projects.helpSteps.step6.title")}: ${t(
      "projects.helpSteps.step6.description",
    )}`,
  ];

  return (
    <PageShell size="narrow" density="compact">
      {/* Main Form Card */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">
            {isEditMode
              ? t("projects.form.editTitle")
              : t("projects.form.createTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm
            initialData={isEditMode ? project : undefined}
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
            mode={isEditMode ? "edit" : "create"}
          />
        </CardContent>
      </Card>

      {/* Help Steps Section */}
      <HelpSteps steps={helpSteps} />
    </PageShell>
  );
};
