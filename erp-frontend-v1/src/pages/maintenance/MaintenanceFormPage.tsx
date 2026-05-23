/**
 * Maintenance Form Page
 *
 * Unified page for creating new maintenance requests and editing existing ones.
 * Auto-detects mode based on URL parameters.
 *
 * Features:
 * - Dynamic mode detection (create/edit)
 * - Form pre-filling for edit mode
 * - Loading states
 * - Error handling
 * - Help steps section
 * - Responsive design
 *
 * @page MaintenanceFormPage
 */

import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { HelpSteps } from "@/components/common/HelpSteps";
import { PageShell } from "@/components/common/PageShell";
import { MaintenanceForm } from "@/features/maintenance/components/MaintenanceForm";
import {
  useMaintenanceDetails,
  useCreateMaintenance,
  useUpdateMaintenance,
} from "@/hooks/useMaintenance";
import type {
  CreateMaintenanceRequestDto,
  UpdateMaintenanceRequestDto,
} from "@/types/maintenance.types";

export const MaintenanceFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Fetch maintenance data for edit mode
  const {
    data: maintenance,
    isLoading: isLoadingMaintenance,
    error: maintenanceError,
  } = useMaintenanceDetails(id || "");

  // Mutations
  const createMutation = useCreateMaintenance();
  const updateMutation = useUpdateMaintenance();

  /**
   * Handle form submission
   */
  const handleSubmit = async (
    data: CreateMaintenanceRequestDto | UpdateMaintenanceRequestDto,
  ) => {
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: id!,
          data: {
            ...(data as UpdateMaintenanceRequestDto),
            rowVersion: maintenance?.rowVersion,
          },
        });
      } else {
        await createMutation.mutateAsync(data as CreateMaintenanceRequestDto);
      }
      // Navigate back to list on success
      navigate("/maintenance");
    } catch {
      // Error handled by mutation hooks with toast
    }
  };

  // Loading state for edit mode
  if (isEditMode && isLoadingMaintenance) {
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
  if (isEditMode && maintenanceError) {
    return (
      <PageShell size="narrow" density="compact">
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-4">
          <p className="font-semibold">{t("maintenance.list.error")}</p>
          <p className="text-sm mt-1">
            {(
              maintenanceError as { response?: { data?: { message?: string } } }
            )?.response?.data?.message || t("maintenance.list.error")}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/maintenance")}
          >
            {t("maintenance.actions.back")}
          </Button>
        </div>
      </PageShell>
    );
  }

  // Prepare help steps
  const helpSteps = [
    t("maintenance.helpSteps.step1"),
    t("maintenance.helpSteps.step2"),
    t("maintenance.helpSteps.step3"),
    t("maintenance.helpSteps.step4"),
    t("maintenance.helpSteps.step5"),
    t("maintenance.helpSteps.step6"),
    t("maintenance.helpSteps.step7"),
    t("maintenance.helpSteps.step8"),
  ];

  return (
    <PageShell size="narrow" density="compact">
      {/* Main Form Card */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">
            {isEditMode
              ? t("maintenance.form.editTitle")
              : t("maintenance.form.createTitle")}
          </CardTitle>
          <p className="text-muted-foreground mt-1">
            {isEditMode
              ? t("maintenance.form.editDescription")
              : t("maintenance.form.createDescription")}
          </p>
        </CardHeader>
        <CardContent>
          <MaintenanceForm
            initialData={isEditMode ? maintenance : undefined}
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
            isEditMode={isEditMode}
          />
        </CardContent>
      </Card>

      {/* Help Steps */}
      <HelpSteps steps={helpSteps} />
    </PageShell>
  );
};

export default MaintenanceFormPage;
