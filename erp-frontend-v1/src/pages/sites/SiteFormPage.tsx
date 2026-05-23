/**
 * Site Form Page
 *
 * Unified page for creating new sites and editing existing ones.
 * Automatically detects mode (create/edit) based on URL parameter.
 *
 * Features:
 * - Auto-detection of create vs edit mode
 * - Pre-fill form data when editing
 * - Help steps for user guidance
 * - Loading states while fetching data
 * - Error handling with user-friendly messages
 *
 * @module SiteFormPage
 */

import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SiteForm } from "@/features/sites/components/SiteForm";
import { HelpSteps } from "@/components/common/HelpSteps";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageShell } from "@/components/common/PageShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Building2 } from "lucide-react";
import { useSite, useCreateSite, useUpdateSite } from "@/hooks/useSites";
import type { CreateSiteDto, UpdateSiteDto } from "@/types/sites.types";

/**
 * Site Form Page Component
 *
 * Handles both create and edit operations:
 * - Create: /sites/create (no ID in URL)
 * - Edit: /sites/edit/:id (ID present in URL)
 */
export const SiteFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Determine if we're in edit mode based on URL parameter
  const isEditMode = !!id;

  // Fetch existing site data if in edit mode
  const {
    data: site,
    isLoading: isLoadingSite,
    error: loadError,
  } = useSite(id || "");
  // Mutation hooks for create/update operations
  const createMutation = useCreateSite();
  const updateMutation = useUpdateSite();

  // Determine loading state based on current operation
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  /**
   * Handle form submission
   * Routes to appropriate mutation based on mode
   * Navigates back to list on success
   */
  const handleSubmit = async (data: CreateSiteDto | UpdateSiteDto) => {
    try {
      if (isEditMode && id) {
        // Update existing site
        await updateMutation.mutateAsync({
          id,
          data: {
            ...(data as UpdateSiteDto),
            rowVersion: site?.rowVersion,
          },
        });
      } else {
        // Create new site
        await createMutation.mutateAsync(data as CreateSiteDto);
      }

      // Navigate back to sites list on success
      navigate("/sites");
    } catch (error) {
      // Re-throw so SiteForm can set field-level errors via form.setError()
      throw error;
    }
  };

  /**
   * Handle cancel action
   * Returns user to sites list without saving
   */
  const handleCancel = () => {
    navigate("/sites");
  };

  // Show loading spinner while fetching site data in edit mode
  if (isEditMode && isLoadingSite) {
    return (
      <PageShell size="narrow" density="compact">
        <LoadingSpinner message={t("sites.loading.details")} />
      </PageShell>
    );
  }

  // Show error message if site not found or load failed
  if (isEditMode && loadError) {
    return (
      <PageShell size="narrow" density="compact">
        <Alert>
          <AlertDescription>{t("sites.error.loadFailed")}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate("/sites")} variant="outline">
            {t("sites.actions.cancel")}
          </Button>
        </div>
      </PageShell>
    );
  }

  // Prepare help steps for user guidance
  const helpSteps = t("sites.help.steps", { returnObjects: true }) as Array<{
    title: string;
    description: string;
  }>;

  return (
    <PageShell size="narrow" density="compact" className="space-y-5">
      <PageHeader
        title={isEditMode ? t("sites.update.title") : t("sites.create.title")}
        description={
          isEditMode
            ? t("sites.form.editDescription")
            : t("sites.form.createDescription")
        }
        icon={<Building2 className="h-5 w-5 text-primary" />}
      />

      <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-sm)]">
        <CardHeader>
          <CardTitle>{isEditMode ? t("sites.update.title") : t("sites.create.title")}</CardTitle>
          <CardDescription>
            {isEditMode
              ? t("sites.form.editDescription")
              : t("sites.form.createDescription")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <SiteForm
            initialData={isEditMode ? site : undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isSubmitting}
            mode={isEditMode ? "edit" : "create"}
          />
        </CardContent>
      </Card>

      <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] shadow-[var(--shadow-xs)]">
        <CardHeader>
          <CardTitle className="text-base">{t("sites.help.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <HelpSteps
            compact
            collapsible
            defaultOpen={false}
            steps={helpSteps.map(
              (step, index) =>
                `${index + 1}. ${step.title}: ${step.description}`,
            )}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
};
