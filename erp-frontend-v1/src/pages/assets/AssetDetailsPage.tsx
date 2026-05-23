import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Edit,
  Trash2,
  Users,
  FolderKanban,
  Wrench,
  Info,
  DollarSign,
  Package,
  MapPin,
  Tag,
  Building2,
  Car,
  Loader2,
  FileText,
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
} from "lucide-react";

import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { assetsApi } from "@/services/api/assets.api";
import type { AssetDocumentRecord } from "@/services/api/assets.api";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions.constants";
import {
  useAsset,
  useDeleteAsset,
  useEmployeeAssignments,
  useProjectAssignments,
  useAssignEmployee,
  useAssignToProject,
  useMaintenanceRequests,
  useAssetDocuments,
  useUploadAssetDocuments,
  useDeleteAssetDocument,
} from "@/hooks/useAssets";
import { isVehicle, MaintenanceRequestEntity } from "@/types/assets.types";
import { isAssetEditable } from "@/lib/asset-status";
import { useEmployees } from "@/hooks/useEmployees";
import { useProjects } from "@/hooks/useProjects";
import { EmployeeStatus } from "@/types/employees.types";
import { ProjectStatus } from "@/types/projects.types";

import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { DataTable, ColumnConfig } from "@/components/common/DataTable";
import { PageShell } from "@/components/common/PageShell";
import {
  getStatusBadgeClass,
  type StatusTone,
} from "@/components/common/statusBadgeStyles";

import { AssetStatusBadge } from "@/components/assets/AssetStatusBadge";
import { AssetTypeBadge } from "@/components/assets/AssetTypeBadge";
import { MaintenanceStatusBadge } from "@/features/maintenance/components/MaintenanceStatusBadge";
import { MaintenancePriorityBadge } from "@/features/maintenance/components/MaintenancePriorityBadge";

/**
 * AssetDetailsPage Component
 *
 * Comprehensive asset details view with tabbed navigation
 * Tabs:
 * 1. Overview - Basic asset information
 * 2. Employees - Employee assignments
 * 3. Projects - Project assignments
 * 4. Maintenance - Maintenance history
 *
 * Features:
 * - Real-time data fetching
 * - Delete confirmation dialog
 * - Quick actions (Edit, Delete)
 * - Conditional vehicle information display
 * - Assignment tracking
 * - Maintenance history
 *
 * @example
 * <Route path="/assets/:id" element={<AssetDetailsPage />} />
 */
export default function AssetDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState("overview");
  const isRTL = language === "ar";

  // Fetch asset data
  const { data: asset, isLoading: isLoadingAsset, error } = useAsset(id || "");
  console.log("Asset data:", asset);
  // Status-based guards (mirrors backend asset-status.guard.ts)
  const retired = !isAssetEditable(asset?.status);
  const canWrite = hasPermission(PERMISSIONS.ASSET_WRITE);
  const canDeleteAsset = hasPermission(PERMISSIONS.ASSET_DELETE);
  const canReadEmployees = hasPermission(PERMISSIONS.EMPLOYEE_READ);
  const canReadProjects = hasPermission(PERMISSIONS.PROJECT_READ);
  const [isAssignEmployeeOpen, setIsAssignEmployeeOpen] = useState(false);
  const [isAssignProjectOpen, setIsAssignProjectOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const { data: employeeAssignments, isLoading: isLoadingEmployees } =
    useEmployeeAssignments(id || "");
  const { data: projectAssignments, isLoading: isLoadingProjects } =
    useProjectAssignments(id || "");
  const { data: maintenanceRequests, isLoading: isLoadingMaintenance } =
    useMaintenanceRequests(id || "");

  // Delete mutation
  const deleteAssetMutation = useDeleteAsset();

  // Documents
  const { data: documents = [] } = useAssetDocuments(id || "");
  const uploadDocumentsMutation = useUploadAssetDocuments();
  const deleteDocumentMutation = useDeleteAssetDocument();
  const assignEmployeeMutation = useAssignEmployee();
  const assignProjectMutation = useAssignToProject();

  const { data: employeesData } = useEmployees(
    {
      status: EmployeeStatus.ACTIVE,
      pageSize: 100,
    },
    {
      enabled: isAssignEmployeeOpen && canReadEmployees,
    },
  );
  const { data: projectsData } = useProjects(
    {
      status: ProjectStatus.ACTIVE,
      limit: 100,
    },
    {
      enabled: isAssignProjectOpen && canReadProjects,
    },
  );

  // Document upload state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  /**
   * Handle asset deletion
   */
  const handleDelete = async () => {
    if (!id || !asset || !canDeleteAsset) return;

    try {
      await deleteAssetMutation.mutateAsync({
        id,
        rowVersion: asset.rowVersion,
      });
      navigate("/assets");
    } catch (error) {
      console.error("Failed to delete asset:", error);
    }
  };

  const resetAssignmentForm = () => {
    setSelectedEmployeeId("");
    setSelectedProjectId("");
    setAssignmentNotes("");
  };

  const handleAssignEmployee = async () => {
    if (!id || !canWrite || retired || !selectedEmployeeId) return;

    try {
      await assignEmployeeMutation.mutateAsync({
        assetId: id,
        data: {
          employeeId: selectedEmployeeId,
          assignmentType: "OPERATOR",
          isPrimary: true,
          notes: assignmentNotes.trim() ? assignmentNotes.trim() : undefined,
        },
      });
      setIsAssignEmployeeOpen(false);
      resetAssignmentForm();
    } catch (error) {
      console.error("Failed to assign employee:", error);
    }
  };

  const handleAssignProject = async () => {
    if (!id || !canWrite || retired || !selectedProjectId) return;

    try {
      await assignProjectMutation.mutateAsync({
        assetId: id,
        data: {
          projectId: selectedProjectId,
          notes: assignmentNotes.trim() ? assignmentNotes.trim() : undefined,
        },
      });
      setIsAssignProjectOpen(false);
      resetAssignmentForm();
    } catch (error) {
      console.error("Failed to assign project:", error);
    }
  };

  // Document helper functions
  const getDocumentStatus = (doc: any) => {
    if (!doc.expiryDate) {
      return {
        status: "no-expiry",
        tone: "neutral" as StatusTone,
        icon: <Clock className="h-3 w-3" />,
        label: t("assets.documents.statusLabels.no-expiry", {
          defaultValue: "No Expiry",
        }),
      };
    }

    const expiry = new Date(doc.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiry < 0) {
      return {
        status: "expired",
        tone: "danger" as StatusTone,
        icon: <XCircle className="h-3 w-3" />,
        label: t("assets.documents.statusLabels.expired", {
          defaultValue: "Expired",
        }),
      };
    }

    if (daysUntilExpiry <= 30) {
      return {
        status: "expiring",
        tone: "warning" as StatusTone,
        icon: <AlertTriangle className="h-3 w-3" />,
        label: t("assets.documents.statusLabels.expiring", {
          defaultValue: "Expiring Soon",
        }),
      };
    }

    return {
      status: "valid",
      tone: "success" as StatusTone,
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: t("assets.documents.statusLabels.valid", {
        defaultValue: "Valid",
      }),
    };
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CONTRACT: t("assets.documents.types.CONTRACT", {
        defaultValue: "Contract",
      }),
      INVOICE: t("assets.documents.types.INVOICE", { defaultValue: "Invoice" }),
      WARRANTY: t("assets.documents.types.WARRANTY", {
        defaultValue: "Warranty",
      }),
      INSURANCE: t("assets.documents.types.INSURANCE", {
        defaultValue: "Insurance",
      }),
      CERTIFICATE: t("assets.documents.types.CERTIFICATE", {
        defaultValue: "Certificate",
      }),
      OTHER: t("assets.documents.types.OTHER", { defaultValue: "Other" }),
    };
    return labels[type] || type;
  };

  const validateDocumentForm = () => {
    const errors: Record<string, string> = {};

    if (selectedFiles.length === 0) {
      errors.files = t("assets.documents.validation.filesRequired", {
        defaultValue: "Please select at least one file",
      });
    }

    if (!documentType) {
      errors.documentType = t("assets.documents.validation.typeRequired", {
        defaultValue: "Document type is required",
      });
    }

    if (!documentName.trim()) {
      errors.documentName = t("assets.documents.validation.nameRequired", {
        defaultValue: "Document name is required",
      });
    }

    if (issueDate) {
      const issue = new Date(issueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (issue > today) {
        errors.issueDate = t("assets.documents.validation.issueDateFuture", {
          defaultValue: "Issue date cannot be in the future",
        });
      }
    }

    if (expiryDate && issueDate) {
      const issue = new Date(issueDate);
      const expiry = new Date(expiryDate);

      if (expiry <= issue) {
        errors.expiryDate = t("assets.documents.validation.expiryBeforeIssue", {
          defaultValue: "Expiry date must be after issue date",
        });
      }
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
    if (!canWrite || !validateDocumentForm() || !id) return;

    try {
      await uploadDocumentsMutation.mutateAsync({
        assetId: id,
        files: selectedFiles,
        metadata: {
          documentType,
          documentName,
          issueDate: issueDate || undefined,
          expiryDate: expiryDate || undefined,
          notes: notes || undefined,
        },
      });

      setIsUploadDialogOpen(false);
      resetDocumentForm();
    } catch (error) {
      console.error("Failed to upload documents:", error);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!id || !canWrite) return;

    try {
      await deleteDocumentMutation.mutateAsync({
        assetId: id,
        documentId,
      });
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    if (!id) return;
    try {
      const blob = await assetsApi.documents.download(id, doc.id);
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

  if (isLoadingAsset) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <PageShell size="wide" density="compact" className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("common.error", { defaultValue: "Error" })}
            </CardTitle>
            <CardDescription>
              {t("assets.messages.notFound", {
                defaultValue: "Asset not found",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/assets")}>
              {t("assets.actions.backToList", {
                defaultValue: "Back to Assets",
              })}
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const vehicleAsset = isVehicle(asset);

  // Table columns configurations
  const employeeAssignmentsColumns: ColumnConfig<any>[] = [
    {
      key: "employee",
      label: t("assets.table.employee", { defaultValue: "Employee" }),
      align: "start",
      render: (assignment) =>
        assignment.employee?.name ||
        assignment.employee?.fullName ||
        assignment.employeeName ||
        assignment.employeeId ||
        "-",
      exportValue: (assignment) =>
        assignment.employee?.name ||
        assignment.employee?.fullName ||
        assignment.employeeName ||
        assignment.employeeId ||
        "-",
    },
    {
      key: "assignedAt",
      label: t("assets.table.assignedDate", { defaultValue: "Assigned Date" }),
      align: "center",
      sortable: true,
      render: (assignment) => {
        const assignedDate = assignment.assignedAt ?? assignment.assignedDate;
        return assignedDate ? new Date(assignedDate).toLocaleDateString() : "-";
      },
      exportValue: (assignment) => {
        const assignedDate = assignment.assignedAt ?? assignment.assignedDate;
        return assignedDate ? new Date(assignedDate).toLocaleDateString() : "-";
      },
    },
    {
      key: "notes",
      label: t("assets.table.notes", { defaultValue: "Notes" }),
      align: "start",
      render: (assignment) => assignment.notes || "-",
      exportValue: (assignment) => assignment.notes || "-",
    },
  ];

  const projectAssignmentsColumns: ColumnConfig<any>[] = [
    {
      key: "project",
      label: t("assets.table.project", { defaultValue: "Project" }),
      align: "start",
      render: (assignment) =>
        assignment.project?.name ||
        assignment.projectName ||
        assignment.projectNumber ||
        assignment.projectCode ||
        "-",
      exportValue: (assignment) =>
        assignment.project?.name ||
        assignment.projectName ||
        assignment.projectNumber ||
        assignment.projectCode ||
        "-",
    },
    {
      key: "assignedAt",
      label: t("assets.table.assignedDate", { defaultValue: "Assigned Date" }),
      align: "center",
      sortable: true,
      render: (assignment) => {
        const assignedDate = assignment.assignedAt ?? assignment.assignedDate;
        return assignedDate ? new Date(assignedDate).toLocaleDateString() : "-";
      },
      exportValue: (assignment) => {
        const assignedDate = assignment.assignedAt ?? assignment.assignedDate;
        return assignedDate ? new Date(assignedDate).toLocaleDateString() : "-";
      },
    },
    {
      key: "notes",
      label: t("assets.table.notes", { defaultValue: "Notes" }),
      align: "start",
      render: (assignment) => assignment.notes || "-",
      exportValue: (assignment) => assignment.notes || "-",
    },
  ];

  const maintenanceColumns: ColumnConfig<MaintenanceRequestEntity>[] = [
    {
      key: "title",
      label: t("assets.table.title", { defaultValue: "Title" }),
      align: "start",
      render: (maintenance) => maintenance.title,
      exportValue: (maintenance) => maintenance.title,
    },
    {
      key: "maintenanceType",
      label: t("assets.table.type", { defaultValue: "Type" }),
      align: "center",
      render: (maintenance) =>
        t(`assets.maintenanceTypes.${maintenance.maintenanceType}`, {
          defaultValue: maintenance.maintenanceType,
        }),
      exportValue: (maintenance) => maintenance.maintenanceType,
    },
    {
      key: "priority",
      label: t("assets.table.priority", { defaultValue: "Priority" }),
      align: "center",
      render: (maintenance) => (
        <MaintenancePriorityBadge priority={maintenance.priority} />
      ),
      exportValue: (maintenance) => maintenance.priority,
    },
    {
      key: "status",
      label: t("assets.table.status", { defaultValue: "Status" }),
      align: "center",
      render: (maintenance) => (
        <MaintenanceStatusBadge status={maintenance.status} />
      ),
      exportValue: (maintenance) => maintenance.status,
    },
    {
      key: "scheduledDate",
      label: t("assets.table.scheduledDate", { defaultValue: "Scheduled" }),
      align: "center",
      sortable: true,
      render: (maintenance) =>
        maintenance.scheduledDate
          ? new Date(maintenance.scheduledDate).toLocaleDateString()
          : "-",
      exportValue: (maintenance) =>
        maintenance.scheduledDate
          ? new Date(maintenance.scheduledDate).toLocaleDateString()
          : "-",
    },
    {
      key: "estimatedCost",
      label: t("assets.table.estimatedCost", { defaultValue: "Est. Cost" }),
      align: "end",
      render: (maintenance) =>
        maintenance.estimatedCost
          ? `${Number(maintenance.estimatedCost).toLocaleString()} ${t("common.currency", { defaultValue: "SAR" })}`
          : "-",
      exportValue: (maintenance) => maintenance.estimatedCost || 0,
    },
    {
      key: "actualCost",
      label: t("assets.table.actualCost", { defaultValue: "Actual Cost" }),
      align: "end",
      render: (maintenance) =>
        maintenance.status === "COMPLETED" && maintenance.actualCost != null
          ? `${Number(maintenance.actualCost).toLocaleString()} ${t("common.currency", { defaultValue: "SAR" })}`
          : "-",
      exportValue: (maintenance) => maintenance.actualCost ?? 0,
    },
  ];

  const documentsColumns: ColumnConfig<any>[] = [
    {
      key: "documentType",
      label: t("assets.documents.type", { defaultValue: "Type" }),
      align: "start",
      render: (doc) => getDocumentTypeLabel(doc.documentType),
      exportValue: (doc) => getDocumentTypeLabel(doc.documentType),
    },
    {
      key: "documentName",
      label: t("assets.documents.name", { defaultValue: "Name" }),
      align: "start",
      render: (doc) => doc.documentName,
      exportValue: (doc) => doc.documentName,
    },
    {
      key: "issueDate",
      label: t("assets.documents.issueDate", { defaultValue: "Issue Date" }),
      align: "center",
      sortable: true,
      render: (doc) =>
        doc.issueDate
          ? new Date(doc.issueDate).toLocaleDateString(
              isRTL ? "ar-EG" : "en-US",
            )
          : "-",
      exportValue: (doc) =>
        doc.issueDate ? new Date(doc.issueDate).toLocaleDateString() : "-",
    },
    {
      key: "expiryDate",
      label: t("assets.documents.expiryDate", { defaultValue: "Expiry Date" }),
      align: "center",
      sortable: true,
      render: (doc) =>
        doc.expiryDate
          ? new Date(doc.expiryDate).toLocaleDateString(
              isRTL ? "ar-EG" : "en-US",
            )
          : "-",
      exportValue: (doc) =>
        doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : "-",
    },
    {
      key: "status",
      label: t("assets.documents.status", { defaultValue: "Status" }),
      align: "center",
      render: (doc) => {
        const status = getDocumentStatus(doc);
        return (
          <Badge
            className={getStatusBadgeClass(
              status.tone,
              "flex items-center gap-1 w-fit mx-auto",
            )}
          >
            {status.icon}
            <span>{status.label}</span>
          </Badge>
        );
      },
      exportValue: (doc) => getDocumentStatus(doc).label,
    },
  ];

  return (
    <PageShell size="wide" density="compact">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs />

      {/* Header */}
      <PageHeader
        title={asset.name}
        description={asset.assetNumber}
        icon={<Package className="h-7 w-7 text-primary" />}
        actions={
          <>
            {canWrite && (
              <Button
                variant="outline"
                disabled={retired}
                onClick={() => navigate(`/assets/${id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t("assets.actions.edit", { defaultValue: "Edit" })}
              </Button>
            )}

            {canDeleteAsset && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("assets.actions.delete", { defaultValue: "Delete" })}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("assets.messages.deleteConfirmTitle", {
                        defaultValue: "Delete Asset",
                      })}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("assets.messages.deleteConfirmMessage", {
                        defaultValue:
                          "Are you sure you want to delete this asset? This action cannot be undone.",
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t("assets.actions.cancel", { defaultValue: "Cancel" })}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {t("assets.actions.confirmDelete", {
                        defaultValue: "Delete",
                      })}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        }
      />

      {/* Asset Header Info */}
      <Card className="shadow-[var(--shadow-xs)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  className={getStatusBadgeClass(
                    "neutral",
                    "text-sm font-mono",
                  )}
                >
                  {asset.assetNumber}
                </Badge>
                <AssetTypeBadge type={asset.assetType} />
                <AssetStatusBadge status={asset.status} />
              </div>
              {asset.category && (
                <p className="text-sm text-[var(--text-tertiary)]">
                  {t("assets.fields.category", { defaultValue: "Category" })}:{" "}
                  {asset.category}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabbed Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-1 shadow-[var(--shadow-xs)] md:grid-cols-5">
          <TabsTrigger
            value="overview"
            className="gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-xs font-medium sm:text-sm data-[state=active]:border data-[state=active]:border-[var(--border-subtle)] data-[state=active]:bg-[var(--bg-surface-primary)]"
          >
            <Info className="mr-2 h-4 w-4" />
            {t("assets.details.tabs.overview", { defaultValue: "Overview" })}
          </TabsTrigger>
          <TabsTrigger
            value="employees"
            className="gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-xs font-medium sm:text-sm data-[state=active]:border data-[state=active]:border-[var(--border-subtle)] data-[state=active]:bg-[var(--bg-surface-primary)]"
          >
            <Users className="mr-2 h-4 w-4" />
            {t("assets.details.tabs.employees", { defaultValue: "Employees" })}
          </TabsTrigger>
          <TabsTrigger
            value="projects"
            className="gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-xs font-medium sm:text-sm data-[state=active]:border data-[state=active]:border-[var(--border-subtle)] data-[state=active]:bg-[var(--bg-surface-primary)]"
          >
            <FolderKanban className="mr-2 h-4 w-4" />
            {t("assets.details.tabs.projects", { defaultValue: "Projects" })}
          </TabsTrigger>
          <TabsTrigger
            value="maintenance"
            className="gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-xs font-medium sm:text-sm data-[state=active]:border data-[state=active]:border-[var(--border-subtle)] data-[state=active]:bg-[var(--bg-surface-primary)]"
          >
            <Wrench className="mr-2 h-4 w-4" />
            {t("assets.details.tabs.maintenance", {
              defaultValue: "Maintenance",
            })}
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-xs font-medium sm:text-sm data-[state=active]:border data-[state=active]:border-[var(--border-subtle)] data-[state=active]:bg-[var(--bg-surface-primary)]"
          >
            <FileText className="mr-2 h-4 w-4" />
            {t("assets.details.tabs.documents", {
              defaultValue: "Documents",
            })}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t("assets.details.sections.basicInfo", {
                    defaultValue: "Basic Information",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoItem
                  label={t("assets.fields.name", { defaultValue: "Name" })}
                  value={asset.name}
                />
                <InfoItem
                  label={t("assets.fields.assetType", {
                    defaultValue: "Asset Type",
                  })}
                  value={t(`assets.types.${asset.assetType}`, {
                    defaultValue: asset.assetType,
                  })}
                />
                <InfoItem
                  label={t("assets.fields.status")}
                  value={<AssetStatusBadge status={asset.status} />}
                />
                {asset.description && (
                  <InfoItem
                    label={t("assets.fields.description", {
                      defaultValue: "Description",
                    })}
                    value={asset.description}
                  />
                )}
              </CardContent>
            </Card>

            {/* Location & Tags Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t("assets.details.sections.location", {
                    defaultValue: "Location & Tags",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {asset.currentLocation && (
                  <InfoItem
                    label={t("assets.fields.currentLocation", {
                      defaultValue: "Current Location",
                    })}
                    value={asset.currentLocation}
                  />
                )}
                {asset.tags &&
                  Array.isArray(asset.tags) &&
                  asset.tags.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[var(--text-tertiary)]">
                        {t("assets.fields.tags")}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {asset.tags.map((tag: string, index: number) => (
                          <Badge
                            key={index}
                            className={getStatusBadgeClass(
                              "neutral",
                              "text-xs",
                            )}
                          >
                            <Tag className="mr-1 h-3 w-3" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                {asset.notes && (
                  <InfoItem
                    label={t("assets.fields.notes", { defaultValue: "Notes" })}
                    value={asset.notes}
                  />
                )}
              </CardContent>
            </Card>

            {/* Manufacturer Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {t("assets.details.sections.manufacturer", {
                    defaultValue: "Manufacturer Information",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {asset.manufacturer && (
                  <InfoItem
                    label={t("assets.fields.manufacturer", {
                      defaultValue: "Manufacturer",
                    })}
                    value={asset.manufacturer}
                  />
                )}
                {asset.model && (
                  <InfoItem
                    label={t("assets.fields.model", { defaultValue: "Model" })}
                    value={asset.model}
                  />
                )}
                {asset.serialNumber && (
                  <InfoItem
                    label={t("assets.fields.serialNumber", {
                      defaultValue: "Serial Number",
                    })}
                    value={asset.serialNumber}
                  />
                )}
                {asset.specifications &&
                  typeof asset.specifications === "object" &&
                  Object.keys(asset.specifications).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[var(--text-tertiary)]">
                        {t("assets.fields.specifications", {
                          defaultValue: "Technical Specifications",
                        })}
                      </p>
                      <div className="space-y-1 text-sm bg-[var(--bg-surface-secondary)] rounded-md p-3">
                        {Object.entries(asset.specifications).map(
                          ([key, value]) => (
                            <div key={key} className="flex">
                              <span className="font-medium min-w-[120px]">
                                {key}:
                              </span>
                              <span className="text-[var(--text-tertiary)]">
                                {String(value)}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Purchase Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {t("assets.details.sections.purchase", {
                    defaultValue: "Purchase Information",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {asset.supplier && (
                  <InfoItem
                    label={t("assets.fields.supplier", {
                      defaultValue: "Supplier",
                    })}
                    value={asset.supplier}
                  />
                )}
                {asset.purchaseDate && (
                  <InfoItem
                    label={t("assets.fields.purchaseDate", {
                      defaultValue: "Purchase Date",
                    })}
                    value={new Date(asset.purchaseDate).toLocaleDateString()}
                  />
                )}
                {asset.purchasePrice && (
                  <InfoItem
                    label={t("assets.fields.purchasePrice", {
                      defaultValue: "Purchase Price",
                    })}
                    value={`${asset.purchasePrice.toLocaleString()} ${t(
                      "common.currency",
                      { defaultValue: "SAR" },
                    )}`}
                  />
                )}
                {asset.warrantyExpiry && (
                  <InfoItem
                    label={t("assets.fields.warrantyExpiry", {
                      defaultValue: "Warranty Expiry",
                    })}
                    value={new Date(asset.warrantyExpiry).toLocaleDateString()}
                  />
                )}
              </CardContent>
            </Card>

            {/* Vehicle-Specific Information (Conditional) */}
            {vehicleAsset && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    {t("assets.details.sections.vehicle", {
                      defaultValue: "Vehicle Information",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  {asset.vehicleType && (
                    <InfoItem
                      label={t("assets.fields.vehicleType", {
                        defaultValue: "Vehicle Type",
                      })}
                      value={asset.vehicleType}
                    />
                  )}
                  {asset.plateNumber && (
                    <InfoItem
                      label={t("assets.fields.plateNumber", {
                        defaultValue: "Plate Number",
                      })}
                      value={asset.plateNumber}
                    />
                  )}
                  {asset.chassisNumber && (
                    <InfoItem
                      label={t("assets.fields.chassisNumber", {
                        defaultValue: "Chassis Number",
                      })}
                      value={asset.chassisNumber}
                    />
                  )}
                  {asset.engineNumber && (
                    <InfoItem
                      label={t("assets.fields.engineNumber", {
                        defaultValue: "Engine Number",
                      })}
                      value={asset.engineNumber}
                    />
                  )}
                  {asset.color && (
                    <InfoItem
                      label={t("assets.fields.color", {
                        defaultValue: "Color",
                      })}
                      value={asset.color}
                    />
                  )}
                  {asset.fuelType && (
                    <InfoItem
                      label={t("assets.fields.fuelType", {
                        defaultValue: "Fuel Type",
                      })}
                      value={asset.fuelType}
                    />
                  )}
                  {asset.transmissionType && (
                    <InfoItem
                      label={t("assets.fields.transmissionType", {
                        defaultValue: "Transmission",
                      })}
                      value={asset.transmissionType}
                    />
                  )}
                  {asset.lastOdometerReading && (
                    <InfoItem
                      label={t("assets.fields.odometerReading", {
                        defaultValue: "Odometer Reading",
                      })}
                      value={`${asset.lastOdometerReading.toLocaleString()} km`}
                    />
                  )}
                  {asset.registrationExpiry && (
                    <InfoItem
                      label={t("assets.fields.registrationExpiry", {
                        defaultValue: "Registration Expiry",
                      })}
                      value={new Date(
                        asset.registrationExpiry,
                      ).toLocaleDateString()}
                    />
                  )}
                  {asset.insuranceExpiry && (
                    <InfoItem
                      label={t("assets.fields.insuranceExpiry", {
                        defaultValue: "Insurance Expiry",
                      })}
                      value={new Date(
                        asset.insuranceExpiry,
                      ).toLocaleDateString()}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {t("assets.details.employeeAssignments", {
                    defaultValue: "Employee Assignments",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("assets.details.employeeAssignmentsDescription", {
                    defaultValue: "Employees currently assigned to this asset",
                  })}
                </CardDescription>
              </div>
              {canWrite && (
                <Dialog
                  open={isAssignEmployeeOpen}
                  onOpenChange={(open) => {
                    setIsAssignEmployeeOpen(open);
                    if (!open) resetAssignmentForm();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      disabled={retired}
                      onClick={() => setIsAssignEmployeeOpen(true)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      {t("assets.actions.assignEmployee", {
                        defaultValue: "Assign Employee",
                      })}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {t("assets.assign.employee.title", {
                          defaultValue: "Assign Employee",
                        })}
                      </DialogTitle>
                      <DialogDescription>
                        {canReadEmployees
                          ? t("assets.assign.employee.subtitle", {
                              defaultValue: "Assign an employee to this asset",
                            })
                          : isRTL
                            ? "ليس لديك صلاحية لاستعراض الموظفين."
                            : "You don't have permission to browse employees."}
                      </DialogDescription>
                    </DialogHeader>
                    {canReadEmployees && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="employeeId">
                            {t("assets.assign.employee.selectEmployee", {
                              defaultValue: "Select Employee",
                            })}
                          </Label>
                          <Select
                            value={selectedEmployeeId}
                            onValueChange={setSelectedEmployeeId}
                          >
                            <SelectTrigger id="employeeId">
                              <SelectValue
                                placeholder={t(
                                  "assets.assign.employee.selectEmployee",
                                  { defaultValue: "Select Employee" },
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {(employeesData?.data || []).map((employee) => (
                                <SelectItem key={employee.id} value={employee.id}>
                                  {employee.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="employeeAssignmentNotes">
                            {t("assets.fields.notes", { defaultValue: "Notes" })}
                          </Label>
                          <Textarea
                            id="employeeAssignmentNotes"
                            value={assignmentNotes}
                            onChange={(e) => setAssignmentNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsAssignEmployeeOpen(false)}
                      >
                        {t("common.cancel", { defaultValue: "Cancel" })}
                      </Button>
                      <Button
                        onClick={handleAssignEmployee}
                        disabled={
                          !canReadEmployees ||
                          !selectedEmployeeId ||
                          assignEmployeeMutation.isPending
                        }
                      >
                        {t("assets.actions.assignEmployee", {
                          defaultValue: "Assign Employee",
                        })}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <DataTable
                data={employeeAssignments || []}
                columns={employeeAssignmentsColumns}
                keyExtractor={(assignment) => assignment.id}
                isLoading={isLoadingEmployees}
                enableClientSorting={true}
                enableExport={true}
                exportFilename={`asset_${asset?.assetNumber}_employee_assignments`}
                exportTitle={t("assets.details.employeeAssignments", {
                  defaultValue: "Employee Assignments",
                })}
                emptyMessage={t("assets.messages.noEmployeeAssignments", {
                  defaultValue: "No employee assignments",
                })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {t("assets.details.projectAssignments", {
                    defaultValue: "Project Assignments",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("assets.details.projectAssignmentsDescription", {
                    defaultValue: "Projects this asset is currently assigned to",
                  })}
                </CardDescription>
              </div>
              {canWrite && (
                <Dialog
                  open={isAssignProjectOpen}
                  onOpenChange={(open) => {
                    setIsAssignProjectOpen(open);
                    if (!open) resetAssignmentForm();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      disabled={retired}
                      onClick={() => setIsAssignProjectOpen(true)}
                    >
                      <FolderKanban className="mr-2 h-4 w-4" />
                      {t("assets.actions.assignProject", {
                        defaultValue: "Assign to Project",
                      })}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {t("assets.assign.project.title", {
                          defaultValue: "Assign to Project",
                        })}
                      </DialogTitle>
                      <DialogDescription>
                        {canReadProjects
                          ? t("assets.assign.project.subtitle", {
                              defaultValue: "Assign this asset to a project",
                            })
                          : isRTL
                            ? "ليس لديك صلاحية لاستعراض المشاريع."
                            : "You don't have permission to browse projects."}
                      </DialogDescription>
                    </DialogHeader>
                    {canReadProjects && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="projectId">
                            {t("assets.assign.project.selectProject", {
                              defaultValue: "Select Project",
                            })}
                          </Label>
                          <Select
                            value={selectedProjectId}
                            onValueChange={setSelectedProjectId}
                          >
                            <SelectTrigger id="projectId">
                              <SelectValue
                                placeholder={t(
                                  "assets.assign.project.selectProject",
                                  { defaultValue: "Select Project" },
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {(projectsData?.data || []).map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="projectAssignmentNotes">
                            {t("assets.fields.notes", { defaultValue: "Notes" })}
                          </Label>
                          <Textarea
                            id="projectAssignmentNotes"
                            value={assignmentNotes}
                            onChange={(e) => setAssignmentNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsAssignProjectOpen(false)}
                      >
                        {t("common.cancel", { defaultValue: "Cancel" })}
                      </Button>
                      <Button
                        onClick={handleAssignProject}
                        disabled={
                          !canReadProjects ||
                          !selectedProjectId ||
                          assignProjectMutation.isPending
                        }
                      >
                        {t("assets.actions.assignProject", {
                          defaultValue: "Assign to Project",
                        })}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <DataTable
                data={projectAssignments || []}
                columns={projectAssignmentsColumns}
                keyExtractor={(assignment) => assignment.id}
                isLoading={isLoadingProjects}
                enableClientSorting={true}
                enableExport={true}
                exportFilename={`asset_${asset?.assetNumber}_project_assignments`}
                exportTitle={t("assets.details.projectAssignments", {
                  defaultValue: "Project Assignments",
                })}
                emptyMessage={t("assets.messages.noProjectAssignments", {
                  defaultValue: "No project assignments",
                })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>
                {t("assets.details.maintenanceHistory", {
                  defaultValue: "Maintenance History",
                })}
              </CardTitle>
              <CardDescription>
                {t("assets.details.maintenanceHistoryDescription", {
                  defaultValue: "All maintenance requests for this asset",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable<MaintenanceRequestEntity>
                data={maintenanceRequests || []}
                columns={maintenanceColumns}
                keyExtractor={(maintenance) => maintenance.id}
                isLoading={isLoadingMaintenance}
                enableClientSorting={true}
                enableExport={true}
                exportFilename={`asset_${asset?.assetNumber}_maintenance`}
                exportTitle={t("assets.details.maintenanceHistory", {
                  defaultValue: "Maintenance History",
                })}
                emptyMessage={t("assets.messages.noMaintenanceRequests", {
                  defaultValue: "No maintenance requests",
                })}
                actions={[
                  {
                    label: t("common.view", { defaultValue: "View" }),
                    icon: <Eye className="h-4 w-4" />,
                    onClick: (m) => navigate(`/maintenance/${m.id}`),
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {t("assets.details.documents", {
                    defaultValue: "Documents",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("assets.documents.count", {
                    defaultValue: "{{count}} documents",
                    count: documents.length,
                  })}
                </CardDescription>
              </div>
              <Dialog
                open={isUploadDialogOpen}
                onOpenChange={(open) => {
                  setIsUploadDialogOpen(open);
                  if (!open) resetDocumentForm();
                }}
              >
                {canWrite && (
                  <Button onClick={() => setIsUploadDialogOpen(true)} size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    {t("assets.actions.uploadDocuments", {
                      defaultValue: "Upload",
                    })}
                  </Button>
                )}
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {t("assets.documents.upload.title", {
                        defaultValue: "Upload Documents",
                      })}
                    </DialogTitle>
                    <DialogDescription>
                      {t("assets.documents.upload.description", {
                        defaultValue: "Add documents for this asset",
                      })}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* File Input */}
                    <div className="space-y-2">
                      <Label htmlFor="files">
                        {t("assets.documents.files", { defaultValue: "Files" })}
                        *
                      </Label>
                      <Input
                        id="files"
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setSelectedFiles(files);
                          setValidationErrors((prev) => ({
                            ...prev,
                            files: "",
                          }));
                        }}
                      />
                      {validationErrors.files && (
                        <p className="text-sm text-destructive">
                          {validationErrors.files}
                        </p>
                      )}
                      {selectedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedFiles.map((file, index) => (
                            <Badge
                              key={index}
                              className={getStatusBadgeClass(
                                "neutral",
                                "gap-1",
                              )}
                            >
                              {file.name}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                  setSelectedFiles((prev) =>
                                    prev.filter((_, i) => i !== index),
                                  );
                                }}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Document Type */}
                    <div className="space-y-2">
                      <Label htmlFor="documentType">
                        {t("assets.documents.type", { defaultValue: "Type" })}*
                      </Label>
                      <Select
                        value={documentType}
                        onValueChange={(value) => {
                          setDocumentType(value);
                          setValidationErrors((prev) => ({
                            ...prev,
                            documentType: "",
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("assets.documents.selectType", {
                              defaultValue: "Select type",
                            })}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONTRACT">
                            {t("assets.documents.types.CONTRACT", {
                              defaultValue: "Contract",
                            })}
                          </SelectItem>
                          <SelectItem value="INVOICE">
                            {t("assets.documents.types.INVOICE", {
                              defaultValue: "Invoice",
                            })}
                          </SelectItem>
                          <SelectItem value="WARRANTY">
                            {t("assets.documents.types.WARRANTY", {
                              defaultValue: "Warranty",
                            })}
                          </SelectItem>
                          <SelectItem value="INSURANCE">
                            {t("assets.documents.types.INSURANCE", {
                              defaultValue: "Insurance",
                            })}
                          </SelectItem>
                          <SelectItem value="CERTIFICATE">
                            {t("assets.documents.types.CERTIFICATE", {
                              defaultValue: "Certificate",
                            })}
                          </SelectItem>
                          <SelectItem value="OTHER">
                            {t("assets.documents.types.OTHER", {
                              defaultValue: "Other",
                            })}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {validationErrors.documentType && (
                        <p className="text-sm text-destructive">
                          {validationErrors.documentType}
                        </p>
                      )}
                    </div>

                    {/* Document Name */}
                    <div className="space-y-2">
                      <Label htmlFor="documentName">
                        {t("assets.documents.name", { defaultValue: "Name" })}*
                      </Label>
                      <Input
                        id="documentName"
                        value={documentName}
                        onChange={(e) => {
                          setDocumentName(e.target.value);
                          setValidationErrors((prev) => ({
                            ...prev,
                            documentName: "",
                          }));
                        }}
                        placeholder={t("assets.documents.namePlaceholder", {
                          defaultValue: "Enter document name",
                        })}
                      />
                      {validationErrors.documentName && (
                        <p className="text-sm text-destructive">
                          {validationErrors.documentName}
                        </p>
                      )}
                    </div>

                    {/* Issue Date */}
                    <div className="space-y-2">
                      <Label htmlFor="issueDate">
                        {t("assets.documents.issueDate", {
                          defaultValue: "Issue Date",
                        })}
                      </Label>
                      <Input
                        id="issueDate"
                        type="date"
                        value={issueDate}
                        onChange={(e) => {
                          setIssueDate(e.target.value);
                          setValidationErrors((prev) => ({
                            ...prev,
                            issueDate: "",
                          }));
                        }}
                      />
                      {validationErrors.issueDate && (
                        <p className="text-sm text-destructive">
                          {validationErrors.issueDate}
                        </p>
                      )}
                    </div>

                    {/* Expiry Date */}
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">
                        {t("assets.documents.expiryDate", {
                          defaultValue: "Expiry Date",
                        })}
                      </Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={expiryDate}
                        onChange={(e) => {
                          setExpiryDate(e.target.value);
                          setValidationErrors((prev) => ({
                            ...prev,
                            expiryDate: "",
                          }));
                        }}
                      />
                      {validationErrors.expiryDate && (
                        <p className="text-sm text-destructive">
                          {validationErrors.expiryDate}
                        </p>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">
                        {t("assets.documents.notes", { defaultValue: "Notes" })}
                      </Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t("assets.documents.notesPlaceholder", {
                          defaultValue: "Additional notes...",
                        })}
                        rows={3}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsUploadDialogOpen(false);
                        resetDocumentForm();
                      }}
                    >
                      {t("common.cancel", { defaultValue: "Cancel" })}
                    </Button>
                    <Button
                      onClick={handleUploadDocuments}
                      disabled={uploadDocumentsMutation.isPending}
                    >
                      {uploadDocumentsMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("common.upload", { defaultValue: "Upload" })}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-tertiary)]">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>
                    {t("assets.documents.empty", {
                      defaultValue: "No documents uploaded",
                    })}
                  </p>
                  <p className="text-sm">
                    {t("assets.documents.emptyHint", {
                      defaultValue: "Click the upload button to add documents",
                    })}
                  </p>
                </div>
              ) : (
                <DataTable
                  data={documents || []}
                  columns={documentsColumns}
                  keyExtractor={(doc) => doc.id}
                  actions={[
                    {
                      label: t("common.actions.download", {
                        defaultValue: "Download",
                      }),
                      icon: <Download className="h-4 w-4" />,
                      onClick: (doc: AssetDocumentRecord) =>
                        handleDownloadDocument(doc),
                      variant: "ghost",
                    },
                    ...(canWrite
                      ? [
                          {
                            label: t("common.actions.delete", {
                              defaultValue: "Delete",
                            }),
                            icon: <Trash2 className="h-4 w-4" />,
                            onClick: (doc: AssetDocumentRecord) => {
                              if (
                                window.confirm(
                                  t("assets.documents.delete.description", {
                                    defaultValue: "This action cannot be undone.",
                                  }),
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
                  enableClientSorting={true}
                  enableExport={true}
                  exportFilename={`asset_${asset.assetNumber}_documents`}
                  exportTitle={`${t("assets.documents.title", { defaultValue: "Documents" })} - ${asset.assetNumber}`}
                  emptyMessage={t("assets.documents.empty", {
                    defaultValue: "No documents uploaded",
                  })}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

/**
 * InfoItem Component
 * Reusable component for displaying label-value pairs
 */
function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-[var(--text-tertiary)]">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  );
}
