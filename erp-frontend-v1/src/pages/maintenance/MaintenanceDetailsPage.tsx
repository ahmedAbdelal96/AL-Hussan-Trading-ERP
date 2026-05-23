/**
 * Maintenance Details Page
 *
 * Professional maintenance request details view with comprehensive information display.
 *
 * Features:
 * - Full maintenance request information
 * - Status and priority badges
 * - Asset information card
 * - Cost breakdown
 * - Timeline and history
 * - Action buttons (Edit, Delete, Status change)
 * - Responsive design with beautiful UI
 * - Print-friendly layout
 *
 * @page MaintenanceDetailsPage
 */

import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { CURRENCY } from "@/config/system.constants";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Edit,
  Trash2,
  DollarSign,
  User,
  Package,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Pause,
  PlayCircle,
  FileText,
  Building2,
  MapPin,
  Phone,
  Mail,
  Upload,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PageHeader } from "@/components/common/PageHeader";
import { DetailStickyPanel } from "@/components/common/DetailStickyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageShell } from "@/components/common/PageShell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type ColumnConfig } from "@/components/common/DataTable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useMaintenanceDetails,
  useDeleteMaintenance,
  useUpdateMaintenanceStatus,
  useMaintenanceDocuments,
  useUploadMaintenanceDocuments,
  useDeleteMaintenanceDocument,
} from "@/hooks/useMaintenance";
import { useApproveProjectCost } from "@/hooks/useFinance";
import { CompleteMaintenanceDialog } from "@/features/maintenance/components";
import { maintenanceApi } from "@/services/api/maintenance.api";
import { useAsset } from "@/hooks/useAssets";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions.constants";
import {
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceType,
} from "@/types/maintenance.types";
import { PaymentStatus } from "@/types/finance.types";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  getStatusBadgeClass,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";

export const MaintenanceDetailsPage = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isRTL = language === "ar";
  const locale = isRTL ? ar : enUS;
  const { hasPermission } = usePermissions();
  const canWriteMaintenance = hasPermission(PERMISSIONS.MAINTENANCE_WRITE);
  const canDeleteMaintenance = hasPermission(PERMISSIONS.MAINTENANCE_DELETE);
  const canApproveFinance = hasPermission(PERMISSIONS.FINANCE_APPROVE);

  // Fetch maintenance details
  const {
    data: maintenance,
    isLoading,
    error,
  } = useMaintenanceDetails(id || "");

  // Fetch asset details if maintenance has asset
  const { data: asset, isLoading: isLoadingAsset } = useAsset(
    maintenance?.assetId || "",
    {
      enabled: !!maintenance?.assetId,
    },
  );

  // Documents state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Documents hooks
  const { data: documents = [] } = useMaintenanceDocuments(id || "");
  const uploadDocuments = useUploadMaintenanceDocuments();
  const deleteDocument = useDeleteMaintenanceDocument();

  // Mutations
  const deleteMutation = useDeleteMaintenance();
  const updateStatusMutation = useUpdateMaintenanceStatus();
  const approveFinanceCostMutation = useApproveProjectCost();

  /**
   * Handle delete maintenance
   */
  const handleDelete = async () => {
    if (!id || !maintenance || !canDeleteMaintenance) return;
    try {
      await deleteMutation.mutateAsync({
        id,
        rowVersion: maintenance.rowVersion,
      });
      navigate("/maintenance");
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  /**
   * Handle status change
   */
  const handleStatusChange = async (newStatus: MaintenanceStatus) => {
    if (!id || !maintenance || !canWriteMaintenance) return;
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: newStatus,
        rowVersion: maintenance.rowVersion,
      });
    } catch (error) {
      console.error("Status change error:", error);
    }
  };

  /**
   * Get status color and icon
   */
  const getStatusConfig = (status: MaintenanceStatus) => {
    const configs = {
      PENDING: {
        color: getStatusBadgeClass(getStatusTone(MaintenanceStatus.PENDING)),
        icon: Clock,
        label: t("maintenance.status.PENDING"),
      },
      IN_PROGRESS: {
        color: getStatusBadgeClass(
          getStatusTone(MaintenanceStatus.IN_PROGRESS),
        ),
        icon: PlayCircle,
        label: t("maintenance.status.IN_PROGRESS"),
      },
      COMPLETED: {
        color: getStatusBadgeClass(getStatusTone(MaintenanceStatus.COMPLETED)),
        icon: CheckCircle2,
        label: t("maintenance.status.COMPLETED"),
      },
      ON_HOLD: {
        color: getStatusBadgeClass(getStatusTone(MaintenanceStatus.ON_HOLD)),
        icon: Pause,
        label: t("maintenance.status.ON_HOLD"),
      },
      CANCELLED: {
        color: getStatusBadgeClass(getStatusTone(MaintenanceStatus.CANCELLED)),
        icon: XCircle,
        label: t("maintenance.status.CANCELLED"),
      },
    };
    return configs[status] || configs.PENDING;
  };

  /**
   * Get priority color and label
   */
  const getPriorityConfig = (priority: MaintenancePriority) => {
    const configs = {
      LOW: {
        color: getStatusBadgeClass(getStatusTone(MaintenancePriority.LOW)),
        label: t("maintenance.priority.LOW"),
      },
      MEDIUM: {
        color: getStatusBadgeClass(getStatusTone(MaintenancePriority.MEDIUM)),
        label: t("maintenance.priority.MEDIUM"),
      },
      HIGH: {
        color: getStatusBadgeClass(getStatusTone(MaintenancePriority.HIGH)),
        label: t("maintenance.priority.HIGH"),
      },
      CRITICAL: {
        color: getStatusBadgeClass(getStatusTone(MaintenancePriority.CRITICAL)),
        label: t("maintenance.priority.CRITICAL"),
      },
    };
    return configs[priority] || configs.MEDIUM;
  };

  /**
   * Get maintenance type label
   */
  const getTypeLabel = (type: MaintenanceType) => {
    const labels = {
      PREVENTIVE: t("maintenance.type.PREVENTIVE"),
      CORRECTIVE: t("maintenance.type.CORRECTIVE"),
      EMERGENCY: t("maintenance.type.EMERGENCY"),
      SCHEDULED: t("maintenance.type.SCHEDULED"),
    };
    return labels[type] || type;
  };

  /**
   * Format date
   */
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "PPP", { locale });
    } catch {
      return "-";
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return "-";
    return new Intl.NumberFormat(isRTL ? "ar-SA" : "en-US", {
      style: "currency",
      currency: CURRENCY.DEFAULT,
    }).format(amount);
  };

  const getFinanceStatusTone = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.APPROVED:
        return "info";
      case PaymentStatus.PAID:
        return "success";
      case PaymentStatus.REJECTED:
        return "danger";
      case PaymentStatus.PARTIALLY_PAID:
        return "warning";
      case PaymentStatus.OVERDUE:
        return "danger";
      case PaymentStatus.PENDING:
      default:
        return "neutral";
    }
  };

  const handleApproveFinanceCost = async () => {
    const financeCostId = maintenance?.financeCost?.id;
    if (!financeCostId || !canApproveFinance) return;

    try {
      await approveFinanceCostMutation.mutateAsync({
        id: financeCostId,
        data: {
          notes: `${maintenance?.maintenanceNumber ?? ""} finance approval from maintenance`,
        },
      });

      if (id) {
        await queryClient.invalidateQueries({
          queryKey: ["maintenance", "detail", id],
        });
      }
    } catch (error) {
      console.error("Finance approval error:", error);
    }
  };

  // Document helper functions
  const getDocumentStatus = (doc: any) => {
    if (!doc.expiryDate) return "no-expiry";
    const expiry = new Date(doc.expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilExpiry < 0) return "expired";
    if (daysUntilExpiry <= 30) return "expiring";
    return "valid";
  };

  const getDocumentStatusTone = (
    status: "expired" | "expiring" | "valid" | "no-expiry",
  ) => {
    if (status === "expired") return "danger";
    if (status === "expiring") return "warning";
    if (status === "valid") return "success";
    return "neutral";
  };

  const getDocumentTypeLabel = (type: string) => {
    return t(`maintenance.documents.types.${type}`);
  };

  const validateDocumentForm = () => {
    const errors: Record<string, string> = {};
    if (selectedFiles.length === 0) {
      errors.files = t("maintenance.documents.validation.filesRequired");
    }
    if (!documentName.trim()) {
      errors.name = t("maintenance.documents.validation.nameRequired");
    }
    if (issueDate && new Date(issueDate) > new Date()) {
      errors.issueDate = t("maintenance.documents.validation.issueDateFuture");
    }
    if (
      issueDate &&
      expiryDate &&
      new Date(expiryDate) <= new Date(issueDate)
    ) {
      errors.expiryDate = t(
        "maintenance.documents.validation.expiryBeforeIssue",
      );
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetDocumentForm = () => {
    setSelectedFiles([]);
    setDocumentType("");
    setDocumentName("");
    setIssueDate("");
    setExpiryDate("");
    setNotes("");
    setValidationErrors({});
  };

  const handleUploadDocuments = async () => {
    if (!canWriteMaintenance) return;
    if (!validateDocumentForm() || !id) return;
    try {
      await uploadDocuments.mutateAsync({
        maintenanceId: id,
        files: selectedFiles,
        metadata: {
          documentType: documentType || "OTHER",
          documentName,
          issueDate: issueDate || undefined,
          expiryDate: expiryDate || undefined,
          notes: notes || undefined,
        },
      });
      setIsUploadDialogOpen(false);
      resetDocumentForm();
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!canWriteMaintenance) return;
    if (!id) return;
    try {
      await deleteDocument.mutateAsync({ maintenanceId: id, documentId });
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    if (!id) return;
    try {
      const blob = await maintenanceApi.documents.download(id, doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.documentName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const projectAllocationColumns: ColumnConfig<any>[] = [
    {
      key: "project",
      label: t("maintenance.details.project"),
      render: (alloc) => (
        <span className="font-medium">
          {alloc.projectName ?? alloc.projectId}
        </span>
      ),
      exportValue: (alloc) => alloc.projectName ?? alloc.projectId,
    },
    {
      key: "percentage",
      label: t("maintenance.details.allocationPct"),
      align: "center",
      render: (alloc) => (
        <div className="flex items-center justify-center gap-2">
          <div className="w-16 rounded-full h-1.5 overflow-hidden bg-[var(--bg-surface-secondary)]">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.min(alloc.percentage, 100)}%` }}
            />
          </div>
          <span className="text-sm">
            {Number(alloc.percentage).toFixed(1)}%
          </span>
        </div>
      ),
      exportValue: (alloc) => Number(alloc.percentage).toFixed(1),
    },
    {
      key: "allocatedAmount",
      label: t("maintenance.details.allocatedAmount"),
      align: "end",
      render: (alloc) =>
        alloc.allocatedAmount != null
          ? `${Number(alloc.allocatedAmount).toLocaleString()} ${t("common.currency")}`
          : "-",
      exportValue: (alloc) => alloc.allocatedAmount ?? "",
    },
  ];

  const documentColumns: ColumnConfig<any>[] = [
    {
      key: "type",
      label: t("maintenance.documents.table.type"),
      render: (doc) => getDocumentTypeLabel(doc.documentType),
      exportValue: (doc) => getDocumentTypeLabel(doc.documentType),
    },
    {
      key: "name",
      label: t("maintenance.documents.table.name"),
      className: "font-medium",
      render: (doc) => doc.documentName,
      exportValue: (doc) => doc.documentName,
    },
    {
      key: "issueDate",
      label: t("maintenance.documents.table.issueDate"),
      render: (doc) => (doc.issueDate ? formatDate(doc.issueDate) : "-"),
      exportValue: (doc) => (doc.issueDate ? formatDate(doc.issueDate) : ""),
    },
    {
      key: "expiryDate",
      label: t("maintenance.documents.table.expiryDate"),
      render: (doc) => (doc.expiryDate ? formatDate(doc.expiryDate) : "-"),
      exportValue: (doc) => (doc.expiryDate ? formatDate(doc.expiryDate) : ""),
    },
    {
      key: "status",
      label: t("maintenance.documents.table.status"),
      render: (doc) => {
        const status = getDocumentStatus(doc);
        return (
          <Badge className={getStatusBadgeClass(getDocumentStatusTone(status))}>
            {t(`maintenance.documents.status.${status}`)}
          </Badge>
        );
      },
      exportValue: (doc) => getDocumentStatus(doc),
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <PageShell
        size="wide"
        density="compact"
        className="flex items-center justify-center min-h-screen"
      >
        <LoadingSpinner />
      </PageShell>
    );
  }

  // Error state
  if (error || !maintenance) {
    return (
      <PageShell size="narrow" density="compact">
        <Breadcrumbs />
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold">{t("maintenance.details.error")}</p>
          </div>
          <p className="text-sm">
            {(error as any)?.response?.data?.message ||
              t("maintenance.details.notFound")}
          </p>
        </div>
      </PageShell>
    );
  }

  const statusConfig = getStatusConfig(maintenance.status);
  const priorityConfig = getPriorityConfig(maintenance.priority);
  const StatusIcon = statusConfig.icon;

  return (
    <PageShell size="wide" density="compact" className="space-y-5">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs />

      <PageHeader
        title={maintenance.maintenanceNumber}
        subtitle={maintenance.title}
        actions={
          <>
            {canWriteMaintenance &&
              maintenance.status === MaintenanceStatus.PENDING && (
                <Button
                  variant="default"
                  onClick={() =>
                    handleStatusChange(MaintenanceStatus.IN_PROGRESS)
                  }
                  disabled={updateStatusMutation.isPending}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {t("maintenance.actions.startWork")}
                </Button>
              )}
            {canWriteMaintenance &&
              maintenance.status === MaintenanceStatus.IN_PROGRESS && (
                <Button
                  variant="default"
                  onClick={() => setShowCompleteDialog(true)}
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {t("maintenance.actions.complete")}
                </Button>
              )}
            {canWriteMaintenance && (
              <Button variant="outline" asChild>
                <Link to={`/maintenance/edit/${id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t("maintenance.actions.edit")}
                </Link>
              </Button>
            )}
            {canDeleteMaintenance && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("maintenance.actions.delete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("maintenance.actions.confirmDelete")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("maintenance.actions.deleteWarning")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {t("common.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        }
      />

      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={statusConfig.color}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusConfig.label}
        </Badge>
        <Badge className={priorityConfig.color}>{priorityConfig.label}</Badge>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Description Card */}
          <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("maintenance.details.description")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">
                {maintenance.description || "-"}
              </p>
            </CardContent>
          </Card>

          {/* Asset Information Card */}
          {maintenance.assetId && (
            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t("maintenance.details.assetInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAsset ? (
                  <LoadingSpinner />
                ) : asset ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          {asset.name}
                        </p>
                        <p className="text-sm text-[var(--text-tertiary)]">
                          {asset.assetNumber}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/assets/${asset.id}`}>
                          {t("maintenance.actions.viewAsset")}
                        </Link>
                      </Button>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[var(--text-tertiary)] mb-1">
                          {t("maintenance.details.category")}
                        </p>
                        <p className="font-medium">{asset.category || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-tertiary)] mb-1">
                          {t("maintenance.details.assetStatus")}
                        </p>
                        <p className="font-medium">{asset.status || "-"}</p>
                      </div>
                      {asset.currentLocation && (
                        <div className="col-span-2">
                          <p className="text-[var(--text-tertiary)] mb-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {t("maintenance.details.location")}
                          </p>
                          <p className="font-medium">{asset.currentLocation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[var(--text-tertiary)]">
                    {t("maintenance.details.assetNotFound")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cost Breakdown Card */}
          {(maintenance.estimatedCost || maintenance.actualCost) && (
            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t("maintenance.details.costBreakdown")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {maintenance.estimatedCost && (
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-tertiary)]">
                        {t("maintenance.details.estimatedCost")}
                      </span>
                      <span className="font-semibold text-lg">
                        {formatCurrency(maintenance.estimatedCost)}
                      </span>
                    </div>
                  )}
                  {maintenance.actualCost && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--text-tertiary)]">
                          {t("maintenance.details.actualCost")}
                        </span>
                        <span className="font-bold text-xl text-primary">
                          {formatCurrency(maintenance.actualCost)}
                        </span>
                      </div>
                    </>
                  )}
                  {maintenance.estimatedCost &&
                    maintenance.actualCost &&
                    maintenance.actualCost !== maintenance.estimatedCost && (
                      <div className="mt-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-soft)] p-3">
                        <div className="flex justify-between items-center text-sm">
                          <span>{t("maintenance.details.difference")}</span>
                          <span
                            className={
                              maintenance.actualCost > maintenance.estimatedCost
                                ? "text-red-600 font-medium"
                                : "text-green-600 font-medium"
                            }
                          >
                            {maintenance.actualCost > maintenance.estimatedCost
                              ? "+"
                              : ""}
                            {formatCurrency(
                              maintenance.actualCost -
                                maintenance.estimatedCost,
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Finance Approval Card */}
          {(maintenance.financeCost || maintenance.actualCost) && (
            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t("maintenance.details.financeApproval")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {maintenance.financeCost ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm text-[var(--text-tertiary)]">
                          {t("maintenance.details.financeStatus")}
                        </p>
                        <Badge
                          className={getStatusBadgeClass(
                            getFinanceStatusTone(
                              maintenance.financeCost.paymentStatus as PaymentStatus,
                            ),
                          )}
                        >
                          {t(
                            `finance.costs.paymentStatus.${maintenance.financeCost.paymentStatus}`,
                          )}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[var(--text-tertiary)]">
                          {t("maintenance.details.actualCost")}
                        </p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(maintenance.financeCost.amount)}
                        </p>
                      </div>
                    </div>

                    {maintenance.financeCost.approver && (
                      <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-soft)] p-3 text-sm">
                        <p className="text-[var(--text-tertiary)]">
                          {t("maintenance.details.approvedByFinance")}
                        </p>
                        <p className="font-medium">
                          {maintenance.financeCost.approver.firstName}{" "}
                          {maintenance.financeCost.approver.lastName}
                        </p>
                        {maintenance.financeCost.approvedAt && (
                          <p className="text-[var(--text-tertiary)] mt-1">
                            {formatDate(maintenance.financeCost.approvedAt)}
                          </p>
                        )}
                      </div>
                    )}

                    {maintenance.financeCost.paymentStatus ===
                      PaymentStatus.REJECTED &&
                      maintenance.financeCost.rejectedReason && (
                        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          <p className="font-medium">
                            {t("maintenance.details.financeRejectedReason")}
                          </p>
                          <p className="mt-1">
                            {maintenance.financeCost.rejectedReason}
                          </p>
                        </div>
                      )}

                    {canApproveFinance &&
                      maintenance.financeCost.paymentStatus ===
                        PaymentStatus.PENDING && (
                        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-soft)] p-3">
                          <p className="text-sm text-[var(--text-secondary)]">
                            {t("maintenance.details.financePendingHelp")}
                          </p>
                          <Button
                            onClick={handleApproveFinanceCost}
                            disabled={approveFinanceCostMutation.isPending}
                          >
                            {t("maintenance.actions.approveFinanceCost")}
                          </Button>
                        </div>
                      )}
                  </>
                ) : (
                  <p className="text-sm text-[var(--text-tertiary)]">
                    {t("maintenance.details.financeCostNotCreated")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Project Cost Distribution Card */}
          {maintenance.projectAllocations &&
            maintenance.projectAllocations.length > 0 && (
              <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {t("maintenance.details.projectAllocation")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable
                    data={maintenance.projectAllocations}
                    columns={projectAllocationColumns}
                    keyExtractor={(alloc) => alloc.id}
                    enableClientSorting={true}
                    emptyMessage={t("common.noData")}
                    className="border-0 shadow-none"
                  />
                </CardContent>
              </Card>
            )}

          {/* Documents Card */}
          <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t("maintenance.documents.title")}
                  <Badge className={getStatusBadgeClass("neutral")}>
                    {documents.length}
                  </Badge>
                </div>
                <Dialog
                  open={isUploadDialogOpen}
                  onOpenChange={setIsUploadDialogOpen}
                >
                  {canWriteMaintenance && (
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        {t("maintenance.documents.upload.button")}
                      </Button>
                    </DialogTrigger>
                  )}
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>
                        {t("maintenance.documents.upload.title")}
                      </DialogTitle>
                      <DialogDescription>
                        {t("maintenance.documents.upload.description")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* File Input */}
                      <div className="space-y-2">
                        <Label htmlFor="files">
                          {t("maintenance.documents.upload.files")}*
                        </Label>
                        <Input
                          id="files"
                          type="file"
                          multiple
                          onChange={(e) =>
                            setSelectedFiles(Array.from(e.target.files || []))
                          }
                          className={
                            validationErrors.files ? "border-red-500" : ""
                          }
                        />
                        {validationErrors.files && (
                          <p className="text-sm text-red-500">
                            {validationErrors.files}
                          </p>
                        )}
                        {selectedFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedFiles.map((file, index) => (
                              <Badge
                                key={index}
                                className={getStatusBadgeClass("neutral")}
                              >
                                {file.name}
                                <button
                                  onClick={() =>
                                    setSelectedFiles(
                                      selectedFiles.filter(
                                        (_, i) => i !== index,
                                      ),
                                    )
                                  }
                                  className="mr-1 hover:text-red-500"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Document Type */}
                      <div className="space-y-2">
                        <Label htmlFor="documentType">
                          {t("maintenance.documents.upload.type")}
                        </Label>
                        <Select
                          value={documentType}
                          onValueChange={setDocumentType}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                "maintenance.documents.upload.selectType",
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INVOICE">
                              {t("maintenance.documents.types.INVOICE")}
                            </SelectItem>
                            <SelectItem value="PHOTO">
                              {t("maintenance.documents.types.PHOTO")}
                            </SelectItem>
                            <SelectItem value="WORK_ORDER">
                              {t("maintenance.documents.types.WORK_ORDER")}
                            </SelectItem>
                            <SelectItem value="REPORT">
                              {t("maintenance.documents.types.REPORT")}
                            </SelectItem>
                            <SelectItem value="CERTIFICATE">
                              {t("maintenance.documents.types.CERTIFICATE")}
                            </SelectItem>
                            <SelectItem value="CONTRACT">
                              {t("maintenance.documents.types.CONTRACT")}
                            </SelectItem>
                            <SelectItem value="WARRANTY">
                              {t("maintenance.documents.types.WARRANTY")}
                            </SelectItem>
                            <SelectItem value="OTHER">
                              {t("maintenance.documents.types.OTHER")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Document Name */}
                      <div className="space-y-2">
                        <Label htmlFor="documentName">
                          {t("maintenance.documents.upload.name")}*
                        </Label>
                        <Input
                          id="documentName"
                          value={documentName}
                          onChange={(e) => setDocumentName(e.target.value)}
                          placeholder={t(
                            "maintenance.documents.upload.namePlaceholder",
                          )}
                          className={
                            validationErrors.name ? "border-red-500" : ""
                          }
                        />
                        {validationErrors.name && (
                          <p className="text-sm text-red-500">
                            {validationErrors.name}
                          </p>
                        )}
                      </div>

                      {/* Issue Date */}
                      <div className="space-y-2">
                        <Label htmlFor="issueDate">
                          {t("maintenance.documents.upload.issueDate")}
                        </Label>
                        <Input
                          id="issueDate"
                          type="date"
                          value={issueDate}
                          onChange={(e) => setIssueDate(e.target.value)}
                          className={
                            validationErrors.issueDate ? "border-red-500" : ""
                          }
                        />
                        {validationErrors.issueDate && (
                          <p className="text-sm text-red-500">
                            {validationErrors.issueDate}
                          </p>
                        )}
                      </div>

                      {/* Expiry Date */}
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">
                          {t("maintenance.documents.upload.expiryDate")}
                        </Label>
                        <Input
                          id="expiryDate"
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className={
                            validationErrors.expiryDate ? "border-red-500" : ""
                          }
                        />
                        {validationErrors.expiryDate && (
                          <p className="text-sm text-red-500">
                            {validationErrors.expiryDate}
                          </p>
                        )}
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label htmlFor="notes">
                          {t("maintenance.documents.upload.notes")}
                        </Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder={t(
                            "maintenance.documents.upload.notesPlaceholder",
                          )}
                          rows={3}
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsUploadDialogOpen(false);
                            resetDocumentForm();
                          }}
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button
                          onClick={handleUploadDocuments}
                          disabled={uploadDocuments.isPending}
                        >
                          {uploadDocuments.isPending
                            ? t("common.uploading")
                            : t("common.upload")}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-tertiary)]">
                  {t("maintenance.documents.noDocuments")}
                </div>
              ) : (
                <DataTable
                  data={documents}
                  columns={documentColumns}
                  keyExtractor={(doc) => doc.id}
                  enableClientSorting={true}
                  actions={[
                    {
                      label: t("maintenance.documents.actions.download"),
                      icon: <Download className="h-4 w-4" />,
                      onClick: (doc) => handleDownloadDocument(doc),
                      variant: "ghost",
                    },
                    ...(canWriteMaintenance
                      ? [
                          {
                            label: t("common.delete"),
                            icon: <X className="h-4 w-4 text-red-500" />,
                            onClick: (doc: { id: string }) => {
                              if (
                                window.confirm(
                                  t("maintenance.documents.delete.description"),
                                )
                              ) {
                                handleDeleteDocument(doc.id);
                              }
                            },
                            variant: "destructive" as const,
                          },
                        ]
                      : []),
                  ]}
                  emptyMessage={t("maintenance.documents.noDocuments")}
                  className="border-0 shadow-none"
                />
              )}
            </CardContent>
          </Card>

          {/* Notes Card */}
          {maintenance.notes && (
            <Card className="shadow-[var(--shadow-xs)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t("maintenance.details.notes")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">
                  {maintenance.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DetailStickyPanel
          title={
            isRTL
              ? "ملخص الطلب"
              : t("maintenance.details.summary", {
                  defaultValue: "Request Summary",
                })
          }
          sections={[
            {
              label: t("maintenance.details.type"),
              value: getTypeLabel(maintenance.maintenanceType),
            },
            ...(maintenance.scheduledDate
              ? [
                  {
                    label: t("maintenance.details.scheduledDate"),
                    value: formatDate(maintenance.scheduledDate),
                  },
                ]
              : []),
            ...(maintenance.completedAt
              ? [
                  {
                    label: t("maintenance.details.completionDate"),
                    value: formatDate(maintenance.completedAt),
                  },
                ]
              : []),
            ...(maintenance.assignedTo
              ? [
                  {
                    label: t("maintenance.details.assignedTo"),
                    value: maintenance.assignedTo,
                  },
                ]
              : []),
            ...(maintenance.vendor
              ? [
                  {
                    label: t("maintenance.details.vendor"),
                    value: maintenance.vendor,
                  },
                ]
              : []),
            {
              label: t("maintenance.details.createdAt"),
              value: formatDate(maintenance.createdAt),
            },
            ...(maintenance.updatedAt &&
            maintenance.updatedAt !== maintenance.createdAt
              ? [
                  {
                    label: t("maintenance.details.updatedAt"),
                    value: formatDate(maintenance.updatedAt),
                  },
                ]
              : []),
          ]}
          actions={
            canWriteMaintenance &&
            maintenance.status !== MaintenanceStatus.COMPLETED &&
            maintenance.status !== MaintenanceStatus.CANCELLED ? (
              <div className="flex flex-col gap-2">
                {maintenance.status !== MaintenanceStatus.IN_PROGRESS && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() =>
                      handleStatusChange(MaintenanceStatus.IN_PROGRESS)
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    {t("maintenance.status.IN_PROGRESS")}
                  </Button>
                )}
                {maintenance.status !== MaintenanceStatus.ON_HOLD && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() =>
                      handleStatusChange(MaintenanceStatus.ON_HOLD)
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    {t("maintenance.status.ON_HOLD")}
                  </Button>
                )}
                {maintenance.status === MaintenanceStatus.IN_PROGRESS && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowCompleteDialog(true)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t("maintenance.status.COMPLETED")}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() =>
                    handleStatusChange(MaintenanceStatus.CANCELLED)
                  }
                  disabled={updateStatusMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t("maintenance.status.CANCELLED")}
                </Button>
              </div>
            ) : undefined
          }
        />
      </div>

      {maintenance && canWriteMaintenance && (
        <CompleteMaintenanceDialog
          maintenanceId={maintenance.id}
          maintenanceNumber={maintenance.maintenanceNumber}
          rowVersion={maintenance.rowVersion}
          projectAllocations={maintenance.projectAllocations ?? []}
          defaultActualCost={
            maintenance.actualCost ?? maintenance.estimatedCost
          }
          open={showCompleteDialog}
          onOpenChange={setShowCompleteDialog}
        />
      )}
    </PageShell>
  );
};

export default MaintenanceDetailsPage;
