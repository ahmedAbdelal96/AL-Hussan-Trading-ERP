/**
 * Project Cost Details Page
 *
 * Detailed view of a single project cost with:
 * - Full cost information (type, category, amount, date)
 * - Project or allocation breakdown
 * - Approval workflow info
 * - Payment tracking
 * - Creator / audit info
 */

import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { CURRENCY } from "@/config/system.constants";
import {
  Edit,
  Trash2,
  ArrowLeft,
  DollarSign,
  CalendarDays,
  FileText,
  Tag,
  FolderOpen,
  User,
  GitBranch,
  Building2,
  BarChart3,
  CheckCircle,
  XCircle,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PageHeader } from "@/components/common/PageHeader";
import { DetailStickyPanel } from "@/components/common/DetailStickyPanel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useProjectCost,
  useDeleteProjectCost,
  useApproveProjectCost,
  useRejectProjectCost,
} from "@/hooks/useFinance";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";
import { ApprovalDialog } from "@/components/common/ApprovalDialog";
import { RejectionDialog } from "@/components/common/RejectionDialog";
import { ManageAllocationsDialog } from "@/features/finance/components/ManageAllocationsDialog";
import { ConvertToAllocatedDialog } from "@/features/finance/components/ConvertToAllocatedDialog";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageShell } from "@/components/common/PageShell";
import { PaymentStatus } from "@/types/finance.types";
import {
  getStatusBadgeClass,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";

export const ProjectCostDetailsPage = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isRTL = language === "ar";
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [manageAllocOpen, setManageAllocOpen] = useState(false);
  const [convertAllocOpen, setConvertAllocOpen] = useState(false);

  const { data: cost, isLoading, error } = useProjectCost(id!);
  const deleteMutation = useDeleteProjectCost();
  const approveMutation = useApproveProjectCost();
  const rejectMutation = useRejectProjectCost();
  const { can } = usePermissions();
  const canApprove = can({
    roles: [
      SYSTEM_ROLES.SUPERADMIN,
      SYSTEM_ROLES.ADMIN,
      SYSTEM_ROLES.FIN_MANAGER,
    ],
    permissions: [PERMISSIONS.FINANCE_APPROVE],
  });

  const handleApprove = async (costItem: typeof cost, notes?: string) => {
    if (!costItem) return;
    try {
      await approveMutation.mutateAsync({
        id: costItem.id,
        data: { ...(notes ? { notes } : {}), rowVersion: costItem.rowVersion },
      });
      setApprovalDialogOpen(false);
    } catch {
      // Error handled by hook
    }
  };

  const handleReject = async (costItem: typeof cost, reason: string) => {
    if (!costItem) return;
    try {
      await rejectMutation.mutateAsync({
        id: costItem.id,
        data: { rejectedReason: reason, rowVersion: costItem.rowVersion },
      });
      setRejectionDialogOpen(false);
    } catch {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!cost || !window.confirm(t("finance.costs.delete.confirm"))) return;

    try {
      await deleteMutation.mutateAsync({
        id: cost.id,
        rowVersion: cost.rowVersion,
      });
      navigate("/finance/costs");
    } catch {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !cost) {
    return (
      <PageShell size="wide" density="compact">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-destructive">
              {t("finance.costs.details.error")}
            </p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const getPaymentStatusBadgeClass = (status: PaymentStatus) =>
    getStatusBadgeClass(getStatusTone(status));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(isRTL ? "ar-SA" : "en-US", {
      style: "currency",
      currency: cost.currency || CURRENCY.DEFAULT,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Determine cost type label
  const getCostTypeLabel = () => {
    if (cost.isAllocated) return t("finance.costs.form.allocatedCost");
    if (cost.projectId) return t("finance.costs.form.singleProject");
    return t("finance.costs.form.generalExpense");
  };

  const getCostTypeBadgeClass = (): string => {
    if (cost.isAllocated) return getStatusBadgeClass(getStatusTone("INFO"));
    if (cost.projectId) return getStatusBadgeClass(getStatusTone("ACTIVE"));
    return getStatusBadgeClass("neutral");
  };

  const isPending = cost.paymentStatus === PaymentStatus.PENDING;

  return (
    <PageShell size="wide" density="compact" className="space-y-5">
      {/* Breadcrumb */}
      <Breadcrumbs />

      {/* Header */}
      <PageHeader
        title={t("finance.costs.details.title")}
        description={cost.description}
        icon={<DollarSign className="h-7 w-7 text-primary" />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/finance/costs")}
            >
              <ArrowLeft className="h-4 w-4 me-2" />
              {t("finance.common.back")}
            </Button>
            {isPending && (
              <>
                {cost.isAllocated && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setManageAllocOpen(true)}
                  >
                    <GitBranch className="h-4 w-4 me-2" />
                    {t("finance.costs.allocations.actions.editAllocation")}
                  </Button>
                )}
                {!cost.isAllocated && cost.projectId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConvertAllocOpen(true)}
                  >
                    <Shuffle className="h-4 w-4 me-2" />
                    {t("finance.costs.allocations.actions.convert")}
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/finance/costs/${cost.id}/edit`}>
                    <Edit className="h-4 w-4 me-2" />
                    {t("finance.common.edit")}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 me-2" />
                  {t("finance.common.delete")}
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-soft)] px-3 py-2">
        <Badge className={getPaymentStatusBadgeClass(cost.paymentStatus)}>
          {t(`finance.costs.paymentStatus.${cost.paymentStatus}`)}
        </Badge>
        <Badge className={getCostTypeBadgeClass()}>{getCostTypeLabel()}</Badge>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Cost Information */}
          <Card className="shadow-[var(--shadow-xs)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t("finance.costs.details.sections.costInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField
                  icon={<DollarSign className="h-4 w-4" />}
                  label={t("finance.costs.details.labels.amount")}
                  value={
                    <span className="text-xl font-bold text-[var(--text-primary)]">
                      {formatCurrency(cost.amount)}
                    </span>
                  }
                />
                <InfoField
                  icon={<Tag className="h-4 w-4" />}
                  label={t("finance.costs.details.labels.costType")}
                  value={t(`finance.costs.costTypes.${cost.costType}`)}
                />
                <InfoField
                  icon={<FolderOpen className="h-4 w-4" />}
                  label={t("finance.costs.details.labels.category")}
                  value={
                    cost.category
                      ? cost.category.name
                      : t("finance.costs.details.labels.noCategory")
                  }
                />
                <InfoField
                  icon={<CalendarDays className="h-4 w-4" />}
                  label={t("finance.costs.details.labels.transactionDate")}
                  value={formatDate(cost.transactionDate)}
                />
                <InfoField
                  icon={<FileText className="h-4 w-4" />}
                  label={t("finance.costs.details.labels.invoiceNumber")}
                  value={
                    cost.invoiceNumber ||
                    t("finance.costs.details.labels.noInvoice")
                  }
                />
                <InfoField
                  icon={<FileText className="h-4 w-4" />}
                  label={t("finance.costs.details.labels.description")}
                  value={cost.description}
                />
              </div>
              {cost.notes && (
                <>
                  <Separator className="my-4" />
                  <InfoField
                    icon={<FileText className="h-4 w-4" />}
                    label={t("finance.costs.details.labels.notes")}
                    value={cost.notes}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Project / Allocations */}
          {cost.isAllocated &&
          cost.allocations &&
          cost.allocations.length > 0 ? (
            <Card className="shadow-[var(--shadow-xs)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  {t("finance.costs.form.allocationTitle")}
                </CardTitle>
                <CardDescription>
                  {t("finance.costs.form.allocatedCostDesc")} -{" "}
                  {cost.allocations.length}{" "}
                  {t("finance.allocations.projectsCount")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cost.allocations.map((alloc) => (
                    <div
                      key={alloc.id}
                      className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-soft)]"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-[var(--text-tertiary)]" />
                        <div>
                          <p className="font-medium">
                            {alloc.project
                              ? alloc.project.name
                              : alloc.projectId}
                          </p>
                          {alloc.project?.projectCode && (
                            <p className="text-xs text-[var(--text-tertiary)]">
                              {alloc.project.projectCode}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-end">
                          <p className="font-bold">
                            {formatCurrency(alloc.allocatedAmount)}
                          </p>
                          <p className="text-sm text-[var(--text-tertiary)]">
                            {alloc.percentage}%
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 w-8 p-0"
                        >
                          <Link
                            to={`/finance/projects/${alloc.projectId}/summary`}
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {/* Total row */}
                  <Separator />
                  <div className="flex items-center justify-between px-3 pt-1">
                    <p className="font-semibold text-[var(--text-tertiary)]">
                      {t("finance.costs.form.totalCost")}
                    </p>
                    <div className="text-end">
                      <p className="font-bold text-lg">
                        {formatCurrency(cost.amount)}
                      </p>
                      <p className="text-sm text-[var(--text-tertiary)]">
                        100%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : cost.project ? (
            <Card className="shadow-[var(--shadow-xs)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t("finance.costs.details.labels.project")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-soft)]">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-[var(--text-tertiary)]" />
                    <div>
                      <p className="font-medium">{cost.project.name}</p>
                      {cost.project.projectCode && (
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {cost.project.projectCode}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/finance/projects/${cost.projectId}/summary`}>
                      <BarChart3 className="h-4 w-4 me-2" />
                      {t("finance.budget.title")}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <DetailStickyPanel
          title={
            isRTL
              ? "ملخص التكلفة"
              : t("finance.costs.details.summary", {
                  defaultValue: "Cost Summary",
                })
          }
          sections={[
            {
              label: t("finance.costs.details.labels.paymentStatus"),
              value: (
                <Badge
                  className={getPaymentStatusBadgeClass(cost.paymentStatus)}
                >
                  {t(`finance.costs.paymentStatus.${cost.paymentStatus}`)}
                </Badge>
              ),
            },
            ...(cost.paidDate
              ? [
                  {
                    label: t("finance.costs.details.labels.paidDate"),
                    value: formatDate(cost.paidDate) ?? "-",
                  },
                ]
              : []),
            ...(cost.paymentMethod
              ? [
                  {
                    label: t("finance.costs.details.labels.paymentMethod"),
                    value: cost.paymentMethod,
                  },
                ]
              : []),
            ...(cost.paymentReference
              ? [
                  {
                    label: t("finance.costs.details.labels.paymentReference"),
                    value: cost.paymentReference,
                  },
                ]
              : []),
            ...(cost.approvedBy || cost.approver
              ? [
                  {
                    label: t("finance.costs.details.labels.approvedBy"),
                    value: cost.approver
                      ? `${cost.approver.firstName} ${cost.approver.lastName}`
                      : (cost.approvedBy ?? "-"),
                  },
                ]
              : []),
            ...(cost.approvedAt
              ? [
                  {
                    label: t("finance.costs.details.labels.approvedAt"),
                    value: formatDateTime(cost.approvedAt) ?? "-",
                  },
                ]
              : []),
            ...(cost.rejectedReason && !cost.approvedBy
              ? [
                  {
                    label: t("finance.costs.details.labels.rejectedReason"),
                    value: (
                      <span className="text-destructive">
                        {cost.rejectedReason}
                      </span>
                    ),
                  },
                ]
              : []),
            {
              label: t("finance.costs.details.labels.createdBy"),
              value: cost.creator
                ? `${cost.creator.firstName} ${cost.creator.lastName}`
                : (cost.createdBy ?? "-"),
            },
            {
              label: t("finance.costs.details.labels.createdAt"),
              value: formatDateTime(cost.createdAt) ?? "-",
            },
            {
              label: t("finance.costs.details.labels.updatedAt"),
              value: formatDateTime(cost.updatedAt) ?? "-",
            },
          ]}
          actions={
            isPending && canApprove ? (
              <>
                <div className="rounded-md border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-3 py-2 text-xs font-medium text-[var(--warning)]">
                  {t("finance.costs.approval.pendingLabel", {
                    defaultValue: isRTL
                      ? "في انتظار الموافقة"
                      : "Pending Approval",
                  })}
                </div>
                <Button
                  className="w-full bg-[var(--success)] text-[var(--text-on-brand)] hover:opacity-90"
                  size="sm"
                  onClick={() => setApprovalDialogOpen(true)}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t("finance.costs.actions.approve")}
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectionDialogOpen(true)}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="h-4 w-4 ltr:mr-2 rtl:ml-2 text-destructive" />
                  {t("finance.costs.actions.reject")}
                </Button>
              </>
            ) : undefined
          }
        />
      </div>

      {/* Approval Dialog */}
      <ApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        title={t("finance.costs.approval.title")}
        description={t("finance.costs.approval.description")}
        item={cost}
        onApprove={handleApprove}
        isLoading={approveMutation.isPending}
        notesLabel={t("finance.costs.approval.notesLabel")}
        notesPlaceholder={t("finance.costs.approval.notesPlaceholder")}
        confirmText={t("finance.costs.approval.confirm")}
        renderContent={(c) => (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[var(--text-tertiary)]">
                {t("finance.costs.fields.amount")}
              </p>
              <p className="font-semibold text-lg">
                {formatCurrency(c.amount)}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">
                {t("finance.costs.table.description")}
              </p>
              <p className="font-medium truncate">{c.description}</p>
            </div>
          </div>
        )}
      />

      {/* Rejection Dialog */}
      <RejectionDialog
        open={rejectionDialogOpen}
        onOpenChange={setRejectionDialogOpen}
        title={t("finance.costs.rejection.title")}
        description={t("finance.costs.rejection.description")}
        item={cost}
        onReject={handleReject}
        isLoading={rejectMutation.isPending}
        renderContent={(c) => (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[var(--text-tertiary)]">
                {t("finance.costs.fields.amount")}
              </p>
              <p className="font-semibold text-lg">
                {formatCurrency(c.amount)}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">
                {t("finance.costs.table.description")}
              </p>
              <p className="font-medium truncate">{c.description}</p>
            </div>
          </div>
        )}
      />

      {/* Manage Allocations Dialog â€” edit existing allocations */}
      {cost.isAllocated && (
        <ManageAllocationsDialog
          open={manageAllocOpen}
          onOpenChange={setManageAllocOpen}
          costId={cost.id}
          costAmount={cost.amount}
          rowVersion={cost.rowVersion}
          currency={cost.currency}
          currentAllocations={cost.allocations}
        />
      )}

      {/* Convert to Allocated Dialog â€” convert single-project cost */}
      {!cost.isAllocated && cost.projectId && (
        <ConvertToAllocatedDialog
          open={convertAllocOpen}
          onOpenChange={setConvertAllocOpen}
          costId={cost.id}
          costAmount={cost.amount}
          rowVersion={cost.rowVersion}
          currency={cost.currency}
        />
      )}
    </PageShell>
  );
};

/** Reusable field display component */
const InfoField = ({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-[var(--text-tertiary)] flex items-center gap-1.5">
      {icon}
      {label}
    </label>
    <div className="text-[var(--text-primary)]">{value || "-"}</div>
  </div>
);

export default ProjectCostDetailsPage;
