/**
 * Project Details Page
 *
 * Comprehensive project details view with professional UI.
 *
 * Features:
 * - Full project information display
 * - Status and progress visualization
 * - Budget and financial tracking
 * - Timeline with dates
 * - Client information
 * - Location/Site details
 * - Team management section
 * - Action buttons (Edit, Delete, Status change)
 * - Responsive design with beautiful cards
 * - Print-friendly layout
 *
 * @page ProjectDetailsPage
 */

import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";
import { CURRENCY } from "@/config/system.constants";
import { useState, useRef } from "react";
import {
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Phone,
  Mail,
  Building2,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Pause,
  PlayCircle,
  FileText,
  Archive,
  Target,
  Upload,
  Download,
  File,
  AlertTriangle,
  Activity,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageShell } from "@/components/common/PageShell";
import { DetailStickyPanel } from "@/components/common/DetailStickyPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { DataTable, ColumnConfig } from "@/components/common/DataTable";
import {
  useProject,
  useDeleteProject,
  useProjectDocuments,
  useUploadProjectDocuments,
  useDeleteProjectDocument,
} from "@/hooks/useProjects";
import { ProjectEmployeesCard } from "./components/ProjectEmployeesCard";
import { ProjectAssetsCard } from "./components/ProjectAssetsCard";
import { QuickProjectStatusChangeDialog } from "@/features/projects/components/QuickProjectStatusChangeDialog";
import { useSite } from "@/hooks/useSites";
import { useProjectCostSummary } from "@/hooks/useFinance";
import { ProjectStatus } from "@/types/projects.types";
import { projectsApi } from "@/services/api/projects.api";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  getStatusBadgeClass,
  getStatusTone,
  type StatusTone,
} from "@/components/common/statusBadgeStyles";

/**
 * Document Status Helper
 * Calculates document status based on expiry date
 */
function getDocumentStatus(expiryDate: string | null): {
  status: "valid" | "expiring" | "expired" | "no-expiry";
  label: string;
  tone: StatusTone;
  icon: React.ReactNode;
} {
  if (!expiryDate) {
    return {
      status: "no-expiry",
      label: "لا يوجد",
      tone: "neutral",
      icon: <Clock className="h-3 w-3" />,
    };
  }

  const expiry = new Date(expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntilExpiry < 0) {
    return {
      status: "expired",
      label: "منتهي",
      tone: "danger",
      icon: <AlertTriangle className="h-3 w-3" />,
    };
  } else if (daysUntilExpiry <= 30) {
    return {
      status: "expiring",
      label: `ينتهي خلال ${daysUntilExpiry} يوم`,
      tone: "warning",
      icon: <Clock className="h-3 w-3" />,
    };
  } else {
    return {
      status: "valid",
      label: "ساري",
      tone: "success",
      icon: <CheckCircle2 className="h-3 w-3" />,
    };
  }
}

/** Document row type matching the API response */
type ProjectDocumentRow = {
  id: string;
  documentType: string;
  documentName: string;
  issueDate: string | null;
  expiryDate: string | null;
  notes?: string;
};

/** Shared info section card */
function InfoSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)]">
      <CardHeader className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <span className="text-[var(--primary-main)]">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-1">{children}</CardContent>
    </Card>
  );
}

/** Label | value row with border */
function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[var(--border-subtle)]/75 last:border-0">
      <div className="flex items-center gap-1.5 w-[38%] shrink-0 text-xs text-[var(--text-tertiary)]">
        {icon && (
          <span className="shrink-0 text-[var(--text-tertiary)]/70">
            {icon}
          </span>
        )}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex-1 text-sm font-medium text-[var(--text-primary)] break-words">
        {value}
      </div>
    </div>
  );
}

/**
 * Document Type Label Helper
 */
function getDocumentTypeLabel(type: string): string {
  const types: Record<string, string> = {
    CONTRACT: "عقد",
    PERMIT: "تصريح",
    BLUEPRINT: "مخطط",
    INSPECTION: "معاينة",
    INVOICE: "فاتورة",
    REPORT: "تقرير",
    OTHER: "أخرى",
  };
  return types[type] || type;
}

export const ProjectDetailsPage = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { can, hasPermission } = usePermissions();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isRTL = language === "ar";
  const locale = isRTL ? ar : enUS;

  // Fetch project details
  const { data: project, isLoading, error } = useProject(id || "");

  // Fetch site details if project has siteId
  const { data: site } = useSite(project?.siteId || "");

  // Fetch project cost summary
  const { data: costSummary } = useProjectCostSummary(id || "");

  // Documents State & Queries
  const { data: documents = [] } = useProjectDocuments(id || "");
  const uploadDocuments = useUploadProjectDocuments();
  const deleteDocument = useDeleteProjectDocument();

  // Documents Upload Dialog State
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<string>("CONTRACT");
  const [documentName, setDocumentName] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const documentsFileInputRef = useRef<HTMLInputElement>(null);

  // Validate document form
  const validateDocumentForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (selectedFiles.length === 0) {
      errors.files = t("projects.documents.validation.filesRequired");
    }

    if (!documentName.trim()) {
      errors.documentName = t("projects.documents.validation.nameRequired");
    }

    if (issueDate && new Date(issueDate) > new Date()) {
      errors.issueDate = t("projects.documents.validation.issueDateFuture");
    }

    if (expiryDate) {
      if (!issueDate) {
        errors.expiryDate = t("projects.documents.validation.expiryNeedsIssue");
      } else {
        const issue = new Date(issueDate);
        const expiry = new Date(expiryDate);
        if (expiry <= issue) {
          errors.expiryDate = t(
            "projects.documents.validation.expiryBeforeIssue",
          );
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset document form
  const resetDocumentForm = () => {
    setSelectedFiles([]);
    setDocumentType("CONTRACT");
    setDocumentName("");
    setIssueDate("");
    setExpiryDate("");
    setNotes("");
    setValidationErrors({});
    if (documentsFileInputRef.current) {
      documentsFileInputRef.current.value = "";
    }
  };

  // Handle documents file selection
  const handleDocumentsFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  // Upload documents
  const handleUploadDocuments = async () => {
    if (!validateDocumentForm()) return;

    try {
      await uploadDocuments.mutateAsync({
        projectId: id!,
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
    } catch (_error) {
      // Error handled by mutation hook with toast notification
    }
  };

  // Mutations
  const deleteMutation = useDeleteProject();

  // Documents table column configuration
  const documentsColumns: ColumnConfig<ProjectDocumentRow>[] = [
    {
      key: "documentType",
      label: t("projects.documents.type"),
      align: "start",
      render: (doc) => (
        <div className="flex items-center gap-2">
          <File className="h-4 w-4 text-[var(--text-tertiary)]" />
          <span className="text-sm">
            {getDocumentTypeLabel(doc.documentType)}
          </span>
        </div>
      ),
      exportValue: (doc) => getDocumentTypeLabel(doc.documentType),
    },
    {
      key: "documentName",
      label: t("projects.documents.name"),
      align: "start",
      render: (doc) => (
        <div className="max-w-xs">
          <p className="text-sm font-medium truncate">{doc.documentName}</p>
          {doc.notes && (
            <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
              {doc.notes}
            </p>
          )}
        </div>
      ),
      exportValue: (doc) => doc.documentName,
    },
    {
      key: "issueDate",
      label: t("projects.documents.issueDate"),
      align: "center",
      sortable: true,
      render: (doc) =>
        doc.issueDate ? format(new Date(doc.issueDate), "PP", { locale }) : "-",
      exportValue: (doc) =>
        doc.issueDate ? format(new Date(doc.issueDate), "PP") : "-",
    },
    {
      key: "expiryDate",
      label: t("projects.documents.expiryDate"),
      align: "center",
      sortable: true,
      render: (doc) =>
        doc.expiryDate
          ? format(new Date(doc.expiryDate), "PP", { locale })
          : "-",
      exportValue: (doc) =>
        doc.expiryDate ? format(new Date(doc.expiryDate), "PP") : "-",
    },
    {
      key: "status",
      label: t("projects.documents.status"),
      align: "center",
      render: (doc) => {
        const status = getDocumentStatus(doc.expiryDate);
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
      exportValue: (doc) => getDocumentStatus(doc.expiryDate).label,
    },
  ];

  /**
   * Handle delete project
   */
  const handleDelete = async () => {
    if (!id || !project) return;
    try {
      await deleteMutation.mutateAsync({
        id,
        rowVersion: project.rowVersion,
      });
      navigate("/projects");
    } catch (_error) {
      // Error handled by mutation hook with toast notification
    }
  };

  /**
   * Get status configuration (color, icon, label)
   */
  const getStatusConfig = (status: ProjectStatus) => {
    const configs = {
      DRAFT: {
        color: getStatusBadgeClass(getStatusTone(ProjectStatus.DRAFT)),
        icon: FileText,
        label: t("projects.status.DRAFT"),
      },
      PLANNING: {
        color: getStatusBadgeClass(getStatusTone(ProjectStatus.PLANNING)),
        icon: Target,
        label: t("projects.status.PLANNING"),
      },
      ACTIVE: {
        color: getStatusBadgeClass(getStatusTone(ProjectStatus.ACTIVE)),
        icon: PlayCircle,
        label: t("projects.status.ACTIVE"),
      },
      ON_HOLD: {
        color: getStatusBadgeClass(getStatusTone(ProjectStatus.ON_HOLD)),
        icon: Pause,
        label: t("projects.status.ON_HOLD"),
      },
      COMPLETED: {
        color: getStatusBadgeClass(getStatusTone(ProjectStatus.COMPLETED)),
        icon: CheckCircle2,
        label: t("projects.status.COMPLETED"),
      },
      CANCELLED: {
        color: getStatusBadgeClass(getStatusTone(ProjectStatus.CANCELLED)),
        icon: XCircle,
        label: t("projects.status.CANCELLED"),
      },
      ARCHIVED: {
        color: getStatusBadgeClass(getStatusTone(ProjectStatus.ARCHIVED)),
        icon: Archive,
        label: t("projects.status.ARCHIVED"),
      },
    };
    return configs[status] || configs.DRAFT;
  };

  /**
   * Format date with locale
   */
  const formatDate = (date: string | Date | undefined | null) => {
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
  const formatCurrency = (amount: number | undefined | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat(isRTL ? "ar-SA" : "en-US", {
      style: "currency",
      currency: project?.currency || CURRENCY.DEFAULT,
    }).format(amount);
  };

  /**
   * Get progress color based on percentage
   */
  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-blue-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  /**
   * Calculate project duration in days
   */
  const calculateDuration = () => {
    if (!project?.plannedStartDate || !project?.plannedEndDate) return null;
    const start = new Date(project.plannedStartDate);
    const end = new Date(project.plannedEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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
  if (error || !project) {
    return (
      <PageShell size="narrow" density="compact">
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold">{t("projects.details.error")}</p>
          </div>
          <p className="text-sm">
            {(error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || t("projects.details.notFound")}
          </p>
        </div>
      </PageShell>
    );
  }

  const statusConfig = getStatusConfig(project.status);
  const StatusIcon = statusConfig.icon;
  const duration = calculateDuration();
  const canManageProject = hasPermission(PERMISSIONS.PROJECT_WRITE);
  const canDeleteProject = can({
    roles: [SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.ADMIN],
    permissions: [PERMISSIONS.PROJECT_DELETE],
  });

  return (
    <PageShell size="wide" density="compact" className="space-y-6">
      <Breadcrumbs />

      {/* â”€â”€ Project Hero Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)] overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-5">
            {/* Name, badges, actions, quick info strip */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                {/* Name + identity badges */}
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                    {project.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-xs font-mono text-[var(--text-tertiary)] bg-[var(--bg-surface-secondary)] px-2 py-0.5 rounded">
                      {project.projectCode}
                    </span>
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="h-3 w-3 ltr:mr-1 rtl:ml-1" />
                      {statusConfig.label}
                    </Badge>
                    {project.tenderNumber && (
                      <Badge className={getStatusBadgeClass("neutral")}>
                        <FileText className="h-3 w-3 ltr:mr-1 rtl:ml-1" />
                        {project.tenderNumber}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {canManageProject && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatusDialogOpen(true)}
                    >
                      <Activity className="h-3.5 w-3.5 ltr:mr-1.5 rtl:ml-1.5" />
                      {t("projects.quickActions.changeStatus")}
                    </Button>
                  )}
                  <Button variant="default" size="sm" asChild>
                    <Link to={`/projects/${id}/progress`}>
                      <TrendingUp className="h-3.5 w-3.5 ltr:mr-1.5 rtl:ml-1.5" />
                      {t("projects.details.progress")}
                    </Link>
                  </Button>
                  {canManageProject && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/projects/edit/${id}`}>
                        <Edit className="h-3.5 w-3.5 ltr:mr-1.5 rtl:ml-1.5" />
                        {t("projects.actions.edit")}
                      </Link>
                    </Button>
                  )}
                  {canDeleteProject && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("projects.actions.confirmDelete")}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("projects.actions.deleteWarning")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {t("projects.actions.cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {t("projects.actions.delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              {/* Quick info strip */}
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                {project.clientName && (
                  <span className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    {project.clientName}
                  </span>
                )}
                {site?.name && (
                  <span className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    {site.name}
                  </span>
                )}
                {project.plannedStartDate && (
                  <span className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {formatDate(project.plannedStartDate)}
                  </span>
                )}
                {duration && (
                  <span className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {duration} {t("projects.details.days")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress + Budget footer strip */}
          <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-5 py-2.5 flex items-center gap-4">
            <TrendingUp className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs text-[var(--text-tertiary)] shrink-0">
              {t("projects.details.completionPercentage")}
            </span>
            <div className="flex flex-1 items-center gap-3 min-w-0">
              <Progress
                value={project.completionPercentage || 0}
                className="h-1.5 flex-1"
                indicatorClassName={getProgressColor(
                  project.completionPercentage || 0,
                )}
              />
              <span className="text-sm font-semibold text-[var(--text-primary)] w-10 text-end shrink-0">
                {project.completionPercentage || 0}%
              </span>
            </div>
            {project.budget && (
              <>
                <span className="h-4 w-px bg-[var(--border-subtle)] shrink-0" />
                <DollarSign className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs text-[var(--text-tertiary)] shrink-0">
                  {t("projects.details.budget")}
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)] shrink-0">
                  {formatCurrency(project.budget)}
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Status Change Dialog */}
      <QuickProjectStatusChangeDialog
        projectId={project.id}
        projectName={project.name}
        currentStatus={project.status}
        rowVersion={project.rowVersion}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
      />

      {/* â”€â”€ Tabs + Sticky Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-1 shadow-[var(--shadow-xs)] md:grid-cols-4">
              {(
                [
                  {
                    value: "overview",
                    icon: FolderOpen,
                    label: t("projects.tabs.overview"),
                  },
                  {
                    value: "employees",
                    icon: User,
                    label: t("projects.tabs.employees"),
                  },
                  {
                    value: "assets",
                    icon: Target,
                    label: t("projects.tabs.assets"),
                  },
                  {
                    value: "documents",
                    icon: FileText,
                    label: t("projects.tabs.documents"),
                  },
                ] as const
              ).map(({ value, icon: Icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-xs font-medium sm:text-sm data-[state=active]:border data-[state=active]:border-[var(--border-subtle)] data-[state=active]:bg-[var(--bg-surface-primary)]"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* â”€â”€ Overview Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.95fr]">
                {/* Left column */}
                <div className="space-y-5">
                  {/* Timeline */}
                  <InfoSection
                    title={t("projects.sections.dateTimeline")}
                    icon={<Calendar className="h-3.5 w-3.5" />}
                  >
                    <InfoRow
                      icon={<Calendar className="h-3.5 w-3.5" />}
                      label={t("projects.details.plannedStartDate")}
                      value={formatDate(project.plannedStartDate)}
                    />
                    {project.plannedEndDate && (
                      <InfoRow
                        icon={<Calendar className="h-3.5 w-3.5" />}
                        label={t("projects.details.plannedEndDate")}
                        value={formatDate(project.plannedEndDate)}
                      />
                    )}
                    {project.actualStartDate && (
                      <InfoRow
                        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        label={t("projects.details.actualStartDate")}
                        value={formatDate(project.actualStartDate)}
                      />
                    )}
                    {project.actualEndDate && (
                      <InfoRow
                        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        label={t("projects.details.actualEndDate")}
                        value={formatDate(project.actualEndDate)}
                      />
                    )}
                    {duration && (
                      <InfoRow
                        icon={<Clock className="h-3.5 w-3.5" />}
                        label={t("projects.details.duration")}
                        value={`${duration} ${t("projects.details.days")}`}
                      />
                    )}
                  </InfoSection>

                  {/* Client Info */}
                  {(project.clientName ||
                    project.clientPhone ||
                    project.clientEmail) && (
                    <InfoSection
                      title={t("projects.details.clientInfo")}
                      icon={<User className="h-3.5 w-3.5" />}
                    >
                      {project.clientName && (
                        <InfoRow
                          icon={<User className="h-3.5 w-3.5" />}
                          label={t("projects.details.clientName")}
                          value={project.clientName}
                        />
                      )}
                      {project.clientPhone && (
                        <InfoRow
                          icon={<Phone className="h-3.5 w-3.5" />}
                          label={t("projects.details.clientPhone")}
                          value={<span dir="ltr">{project.clientPhone}</span>}
                        />
                      )}
                      {project.clientEmail && (
                        <InfoRow
                          icon={<Mail className="h-3.5 w-3.5" />}
                          label={t("projects.details.clientEmail")}
                          value={
                            <span dir="ltr" className="break-all">
                              {project.clientEmail}
                            </span>
                          }
                        />
                      )}
                    </InfoSection>
                  )}

                  {/* Description, Notes (full width in left col) */}
                  {(project.description ||
                    project.progressNotes ||
                    project.notes) && (
                    <InfoSection
                      title={t("projects.details.description")}
                      icon={<FileText className="h-3.5 w-3.5" />}
                    >
                      {project.description && (
                        <InfoRow
                          label={t("projects.details.description")}
                          value={
                            <p className="text-sm leading-relaxed">
                              {project.description}
                            </p>
                          }
                        />
                      )}
                      {project.progressNotes && (
                        <InfoRow
                          label={t("projects.details.progressNotes")}
                          value={
                            <p className="text-sm leading-relaxed">
                              {project.progressNotes}
                            </p>
                          }
                        />
                      )}
                      {project.notes && (
                        <InfoRow
                          label={t("projects.details.notes")}
                          value={
                            <p className="text-sm leading-relaxed">
                              {project.notes}
                            </p>
                          }
                        />
                      )}
                    </InfoSection>
                  )}
                </div>

                {/* Right column (sticky) */}
                <div className="space-y-5 xl:sticky xl:top-4 xl:self-start">
                  {/* Budget & Costs */}
                  {(project.budget || costSummary) && (
                    <InfoSection
                      title={t("projects.details.budget")}
                      icon={<DollarSign className="h-3.5 w-3.5" />}
                    >
                      {project.budget && (
                        <InfoRow
                          icon={<DollarSign className="h-3.5 w-3.5" />}
                          label={t("projects.details.budget")}
                          value={formatCurrency(project.budget)}
                        />
                      )}
                      {project.currency && (
                        <InfoRow
                          icon={<FileText className="h-3.5 w-3.5" />}
                          label={t("projects.fields.currency")}
                          value={project.currency}
                        />
                      )}
                      {costSummary && (
                        <>
                          <InfoRow
                            icon={<TrendingUp className="h-3.5 w-3.5" />}
                            label={t("projects.details.totalCosts")}
                            value={
                              <Link
                                to={`/finance/costs?projectId=${id}`}
                                className="text-primary hover:underline font-medium"
                              >
                                {formatCurrency(costSummary.totalAmount)}
                              </Link>
                            }
                          />
                          {costSummary.pendingAmount > 0 && (
                            <InfoRow
                              icon={<AlertCircle className="h-3.5 w-3.5" />}
                              label={t("projects.details.pending")}
                              value={
                                <span className="text-orange-600 font-semibold">
                                  {formatCurrency(costSummary.pendingAmount)}
                                </span>
                              }
                            />
                          )}
                        </>
                      )}
                    </InfoSection>
                  )}

                  {/* Site Info */}
                  {site && (
                    <InfoSection
                      title={t("projects.details.site")}
                      icon={<Building2 className="h-3.5 w-3.5" />}
                    >
                      <InfoRow
                        icon={<Building2 className="h-3.5 w-3.5" />}
                        label={t("sites.fields.name")}
                        value={
                          <Link
                            to={`/sites/${project.siteId}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {site.name}
                          </Link>
                        }
                      />
                      <InfoRow
                        icon={<FileText className="h-3.5 w-3.5" />}
                        label={t("sites.fields.code")}
                        value={
                          <span className="font-mono text-xs bg-[var(--bg-surface-secondary)] px-2 py-0.5 rounded">
                            {site.code}
                          </span>
                        }
                      />
                      <InfoRow
                        icon={<MapPin className="h-3.5 w-3.5" />}
                        label={t("sites.fields.city")}
                        value={[site.city, site.state]
                          .filter(Boolean)
                          .join("، ")}
                      />
                      <InfoRow
                        icon={<Activity className="h-3.5 w-3.5" />}
                        label={t("sites.fields.status")}
                        value={
                          <Badge
                            className={getStatusBadgeClass(
                              getStatusTone(site.status),
                            )}
                          >
                            {site.status}
                          </Badge>
                        }
                      />
                    </InfoSection>
                  )}

                  {/* Additional Info + Audit */}
                  <InfoSection
                    title={t("projects.sections.additionalInfo")}
                    icon={<FileText className="h-3.5 w-3.5" />}
                  >
                    {project.managerId && (
                      <InfoRow
                        icon={<User className="h-3.5 w-3.5" />}
                        label={t("projects.details.manager")}
                        value={
                          <span className="font-mono text-xs bg-[var(--bg-surface-secondary)] px-2 py-0.5 rounded">
                            {project.managerId}
                          </span>
                        }
                      />
                    )}
                    {project.tenderNumber && (
                      <InfoRow
                        icon={<FileText className="h-3.5 w-3.5" />}
                        label={t("projects.details.tenderNumber")}
                        value={project.tenderNumber}
                      />
                    )}
                    <InfoRow
                      icon={<Calendar className="h-3.5 w-3.5" />}
                      label={t("projects.details.createdAt")}
                      value={formatDate(project.createdAt)}
                    />
                    {project.updatedAt &&
                      project.updatedAt !== project.createdAt && (
                        <InfoRow
                          icon={<Calendar className="h-3.5 w-3.5" />}
                          label={t("projects.details.updatedAt")}
                          value={formatDate(project.updatedAt)}
                        />
                      )}
                  </InfoSection>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="employees" className="mt-0">
              <ProjectEmployeesCard
                projectId={id!}
                projectStatus={project.status}
              />
            </TabsContent>

            <TabsContent value="assets" className="mt-0">
              <ProjectAssetsCard
                projectId={id!}
                projectStatus={project.status}
              />
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
              {/* Documents Section */}
              <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)]">
                <CardHeader className="border-b border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {t("projects.details.documents")}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {documents.length} {t("projects.documents.count")}
                      </CardDescription>
                    </div>
                    {canManageProject && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsUploadDialogOpen(true)}
                      >
                        <Upload className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        {t("projects.actions.uploadDocuments")}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {documents.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-tertiary)]">
                      <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium">
                        {t("projects.documents.empty")}
                      </p>
                      <p className="text-xs mt-1">
                        {t("projects.documents.emptyHint")}
                      </p>
                    </div>
                  ) : (
                    <DataTable
                      data={documents
                        .slice()
                        .sort(
                          (a: ProjectDocumentRow, b: ProjectDocumentRow) => {
                            const statusA = getDocumentStatus(a.expiryDate);
                            const statusB = getDocumentStatus(b.expiryDate);
                            const order = {
                              expired: 0,
                              expiring: 1,
                              valid: 2,
                              "no-expiry": 3,
                            };
                            return (
                              order[statusA.status] - order[statusB.status]
                            );
                          },
                        )}
                      columns={documentsColumns}
                      keyExtractor={(doc) => doc.id}
                      actions={[
                        {
                          label: t("common.actions.download"),
                          icon: <Download className="h-4 w-4" />,
                          onClick: async (doc) => {
                            try {
                              const blob = await projectsApi.documents.download(
                                id!,
                                doc.id,
                              );
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = doc.documentName;
                              a.click();
                              window.URL.revokeObjectURL(url);
                            } catch (_error) {
                              // Error handled by mutation hook
                            }
                          },
                          variant: "ghost",
                        },
                        ...(canManageProject
                          ? [
                              {
                                label: t("common.actions.delete"),
                                icon: <Trash2 className="h-4 w-4" />,
                                onClick: (doc: { id: string }) =>
                                  deleteDocument.mutate({
                                    projectId: id!,
                                    documentId: doc.id,
                                  }),
                                variant: "ghost" as const,
                              },
                            ]
                          : []),
                      ]}
                      enableClientSorting={false}
                      enableExport={true}
                      exportFilename={`project_${project?.name}_documents`}
                      exportTitle={`${t("projects.documents.title")} - ${project?.name}`}
                      emptyMessage={t("projects.documents.empty")}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sticky Project Details Panel */}
        <DetailStickyPanel
          title={
            isRTL
              ? "ملخص المشروع"
              : t("projects.details.summary", {
                  defaultValue: "Project Summary",
                })
          }
          sections={[
            {
              label: t("projects.fields.status", { defaultValue: "Status" }),
              value: (
                <Badge className={statusConfig.color}>
                  <StatusIcon className="h-3 w-3 ltr:mr-1 rtl:ml-1" />
                  {statusConfig.label}
                </Badge>
              ),
            },
            {
              label: t("projects.fields.code", { defaultValue: "Code" }),
              value: (
                <span className="font-mono text-xs bg-[var(--bg-surface-secondary)] px-1.5 py-0.5 rounded">
                  {project.projectCode}
                </span>
              ),
            },
            ...(project.clientName
              ? [
                  {
                    label: t("projects.fields.client", {
                      defaultValue: "Client",
                    }),
                    value: project.clientName,
                  },
                ]
              : []),
            ...(project.budget
              ? [
                  {
                    label: t("projects.details.budget", {
                      defaultValue: "Budget",
                    }),
                    value: formatCurrency(project.budget),
                  },
                ]
              : []),
            {
              label: t("projects.details.completionPercentage", {
                defaultValue: "Completion",
              }),
              value: (
                <div className="flex items-center gap-2 w-full">
                  <Progress
                    value={project.completionPercentage || 0}
                    className="h-1.5 flex-1"
                    indicatorClassName={getProgressColor(
                      project.completionPercentage || 0,
                    )}
                  />
                  <span className="text-xs font-semibold shrink-0">
                    {project.completionPercentage || 0}%
                  </span>
                </div>
              ),
              wide: true,
            },
            ...(project.plannedStartDate
              ? [
                  {
                    label: t("projects.details.plannedStartDate", {
                      defaultValue: "Start",
                    }),
                    value: formatDate(project.plannedStartDate),
                  },
                ]
              : []),
            ...(project.plannedEndDate
              ? [
                  {
                    label: t("projects.details.plannedEndDate", {
                      defaultValue: "End",
                    }),
                    value: formatDate(project.plannedEndDate),
                  },
                ]
              : []),
          ]}
        />
      </div>

      {/* Upload Documents Dialog */}
      <Dialog
        open={canManageProject ? isUploadDialogOpen : false}
        onOpenChange={(open) => {
          if (!canManageProject) return;
          setIsUploadDialogOpen(open);
          if (!open) {
            resetDocumentForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("projects.actions.uploadDocuments")}</DialogTitle>
            <DialogDescription>
              {t("projects.documents.uploadDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* File Input */}
            <div className="grid gap-2">
              <Label htmlFor="documents-files">
                {t("projects.documents.files")} *
              </Label>
              <Input
                id="documents-files"
                ref={documentsFileInputRef}
                type="file"
                multiple
                onChange={handleDocumentsFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              {validationErrors.files && (
                <p className="text-xs text-destructive">
                  {validationErrors.files}
                </p>
              )}
              {selectedFiles.length > 0 && (
                <p className="text-xs text-[var(--text-tertiary)]">
                  {selectedFiles.length} {t("projects.documents.filesSelected")}
                </p>
              )}
            </div>

            {/* Document Type */}
            <div className="grid gap-2">
              <Label htmlFor="document-type">
                {t("projects.documents.type")} *
              </Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTRACT">
                    {t("projects.documents.types.CONTRACT")}
                  </SelectItem>
                  <SelectItem value="PERMIT">
                    {t("projects.documents.types.PERMIT")}
                  </SelectItem>
                  <SelectItem value="BLUEPRINT">
                    {t("projects.documents.types.BLUEPRINT")}
                  </SelectItem>
                  <SelectItem value="INSPECTION">
                    {t("projects.documents.types.INSPECTION")}
                  </SelectItem>
                  <SelectItem value="INVOICE">
                    {t("projects.documents.types.INVOICE")}
                  </SelectItem>
                  <SelectItem value="REPORT">
                    {t("projects.documents.types.REPORT")}
                  </SelectItem>
                  <SelectItem value="OTHER">
                    {t("projects.documents.types.OTHER")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Document Name */}
            <div className="grid gap-2">
              <Label htmlFor="document-name">
                {t("projects.documents.name")} *
              </Label>
              <Input
                id="document-name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder={t("projects.documents.namePlaceholder")}
              />
              {validationErrors.documentName && (
                <p className="text-xs text-destructive">
                  {validationErrors.documentName}
                </p>
              )}
            </div>

            {/* Issue Date */}
            <div className="grid gap-2">
              <Label htmlFor="issue-date">
                {t("projects.documents.issueDate")}
              </Label>
              <Input
                id="issue-date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
              {validationErrors.issueDate && (
                <p className="text-xs text-destructive">
                  {validationErrors.issueDate}
                </p>
              )}
            </div>

            {/* Expiry Date */}
            <div className="grid gap-2">
              <Label htmlFor="expiry-date">
                {t("projects.documents.expiryDate")}
              </Label>
              <Input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
              {validationErrors.expiryDate && (
                <p className="text-xs text-destructive">
                  {validationErrors.expiryDate}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">{t("projects.documents.notes")}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("projects.documents.notesPlaceholder")}
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
              {t("common.actions.cancel")}
            </Button>
            <Button
              onClick={handleUploadDocuments}
              disabled={uploadDocuments.isPending}
            >
              {uploadDocuments.isPending
                ? t("common.actions.uploading")
                : t("common.actions.upload")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default ProjectDetailsPage;
