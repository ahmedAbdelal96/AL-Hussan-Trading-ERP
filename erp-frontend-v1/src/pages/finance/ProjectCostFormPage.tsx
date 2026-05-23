/**
 * Cost Form Page
 *
 * Wrapper page for the comprehensive cost form
 * Supports creating and editing all 3 cost types:
 * - Single Project Cost
 * - Allocated Cost (Multi-Project)
 * - General Expense
 */

import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import { DollarSign, Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import { ProjectCostForm } from "@/features/finance/components/ProjectCostForm";
import {
  useProjectCost,
  useCreateProjectCost,
  useUpdateProjectCost,
} from "@/hooks/useFinance";
import { isCostEditable } from "@/lib/cost-payment-status";
import type { CreateProjectCostDto } from "@/types/finance.types";

export const ProjectCostFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  // Fetch cost data in edit mode
  // Note: useProjectCost handles enabled internally, only call when id exists
  const { data: cost, isLoading: costLoading } = useProjectCost(id || "");

  const createMutation = useCreateProjectCost();
  const updateMutation = useUpdateProjectCost();

  const handleSubmit = async (data: CreateProjectCostDto) => {
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({
          id,
          data: {
            ...data,
            rowVersion: cost?.rowVersion,
          },
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate("/finance/costs");
    } catch (_error) {
      // Error handled by hooks with toast notifications
    }
  };

  if (isEdit && costLoading) {
    return <LoadingSpinner />;
  }

  // Block edit form when cost is in an immutable payment status (e.g. PAID)
  if (isEdit && cost && !isCostEditable(cost.paymentStatus)) {
    return (
      <PageShell size="wide" density="compact">
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>
            {t("finance.costs.errors.immutable", {
              defaultValue: "لا يمكن تعديل هذه التكلفة",
            })}
          </AlertTitle>
          <AlertDescription>
            {t("finance.costs.errors.immutableDescription", {
              defaultValue:
                "هذه التكلفة مكتملة الدفع ولا يمكن تعديلها. يمكنك العودة للاطلاع على تفاصيلها.",
            })}
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate(-1)}>
          {t("common.actions.back", { defaultValue: "العودة" })}
        </Button>
      </PageShell>
    );
  }

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={
          isEdit
            ? t("finance.costs.form.editTitle") || "Edit Cost"
            : t("finance.costs.form.createTitle") || "Record New Cost"
        }
        description={
          isEdit
            ? t("finance.costs.form.editDescription") ||
              "Update cost information"
            : t("finance.costs.form.createDescription") ||
              "Create a new cost entry (single project, allocated, or general expense)"
        }
        icon={<DollarSign className="h-7 w-7 text-primary" />}
      />

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isEdit
              ? t("finance.costs.form.editTitle") || "Edit Cost"
              : t("finance.costs.form.createTitle") || "New Cost"}
          </CardTitle>
          <CardDescription>
            {isEdit
              ? t("finance.costs.form.editDescription") || "Update cost details"
              : t("finance.costs.form.createDescription") ||
                "Fill in the cost details below"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectCostForm
            initialData={cost}
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
            mode={isEdit ? "edit" : "create"}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
};

export default ProjectCostFormPage;
