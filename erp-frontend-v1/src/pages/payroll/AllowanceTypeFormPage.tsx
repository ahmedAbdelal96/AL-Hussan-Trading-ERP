/**
 * Allowance Type Form Page
 *
 * Unified page for creating and editing allowance types (master data).
 * Simple form for basic allowance type information.
 *
 * Features:
 * - Dynamic mode detection (create/edit)
 * - Form pre-filling for edit mode
 * - Loading and error states
 * - Help section
 * - Responsive design
 *
 * @page AllowanceTypeFormPage
 * @module Payroll
 */

import { useNavigate, useParams, Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/i18n/translations";
import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { HelpSteps } from "@/components/common/HelpSteps";
import { PageShell } from "@/components/common/PageShell";
import { AllowanceTypeForm } from "@/features/payroll/components/allowance-types/AllowanceTypeForm";
import {
  useAllowanceType,
  useCreateAllowanceType,
  useUpdateAllowanceType,
} from "@/hooks/useAllowanceTypes";
import type {
  CreateAllowanceTypeDto,
  UpdateAllowanceTypeDto,
} from "@/types/payroll.types";

/**
 * AllowanceTypeFormPage Component
 */
export const AllowanceTypeFormPage = () => {
  const { language } = useLanguage();
  const t = translations[language].payroll.allowanceTypes;
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Fetch data for edit mode
  const {
    data: allowanceType,
    isLoading: isLoadingType,
    error: typeError,
  } = useAllowanceType(id || "", isEditMode);

  // Mutations
  const createMutation = useCreateAllowanceType();
  const updateMutation = useUpdateAllowanceType();

  /**
   * Handle form submission
   */
  const handleSubmit = async (
    data: CreateAllowanceTypeDto | UpdateAllowanceTypeDto,
  ) => {
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: id!,
          data: {
            ...(data as UpdateAllowanceTypeDto),
            rowVersion: allowanceType?.rowVersion,
          },
        });
      } else {
        await createMutation.mutateAsync(data as CreateAllowanceTypeDto);
      }
      navigate("/payroll/allowance-types");
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  /**
   * Loading state
   */
  if (isEditMode && isLoadingType) {
    return (
      <PageShell size="wide" density="compact">
        <LoadingSpinner />
      </PageShell>
    );
  }

  /**
   * Error state
   */
  if (isEditMode && typeError) {
    return (
      <PageShell size="wide" density="compact">
        <Alert className="border-error-600">
          <AlertDescription>{t.errors.notFound}</AlertDescription>
        </Alert>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/payroll/allowance-types">
            {translations[language].common.actions.back}
          </Link>
        </Button>
      </PageShell>
    );
  }

  /**
   * Help steps
   */
  const helpSteps = [t.help.step1, t.help.step2, t.help.step3, t.help.step4];

  return (
    <PageShell size="wide" density="compact">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link to="/payroll/allowance-types"></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEditMode ? t.form.editTitle : t.form.createTitle}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? t.form.editDescription : t.form.createDescription}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {isEditMode ? t.form.editCard : t.form.createCard}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AllowanceTypeForm
                initialData={allowanceType}
                onSubmit={handleSubmit}
                isSubmitting={
                  createMutation.isPending || updateMutation.isPending
                }
                isEditMode={isEditMode}
              />
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InfoIcon className="h-5 w-5 text-primary-main" />
                {t.help.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HelpSteps steps={helpSteps} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
};

export default AllowanceTypeFormPage;
