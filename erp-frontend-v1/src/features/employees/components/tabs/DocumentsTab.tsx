import { useState, useRef } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import {
  useEmployeeDocuments,
  useUploadEmployeeDocuments,
  useDeleteEmployeeDocument,
} from "@/hooks/useEmployees";
import { employeesApi } from "@/services/api/employees.api";
import {
  DataTable,
  ColumnConfig,
  ActionButton,
} from "@/components/common/DataTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { getEmployeeFullName } from "@/types";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions.constants";
import {
  Upload,
  Download,
  Trash2,
  File,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { EmployeeEntity } from "@/types/employees.types";

interface DocumentItem {
  id: string;
  documentType: string;
  documentName: string;
  issueDate: string | null;
  expiryDate: string | null;
  notes?: string;
}

function getDocumentStatus(expiryDate: string | null): {
  status: "valid" | "expiring" | "expired" | "no-expiry";
  label: string;
  variant: "default" | "destructive" | "warning" | "secondary";
  icon: React.ReactNode;
} {
  if (!expiryDate) {
    return {
      status: "no-expiry",
      label: "\u0644\u0627 \u064a\u0648\u062c\u062f",
      variant: "secondary",
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
      label: "\u0645\u0646\u062a\u0647\u064a",
      variant: "destructive",
      icon: <AlertTriangle className="h-3 w-3" />,
    };
  } else if (daysUntilExpiry <= 30) {
    return {
      status: "expiring",
      label: `\u064a\u0646\u062a\u0647\u064a \u062e\u0644\u0627\u0644 ${daysUntilExpiry} \u064a\u0648\u0645`,
      variant: "warning",
      icon: <Clock className="h-3 w-3" />,
    };
  } else {
    return {
      status: "valid",
      label: "\u0633\u0627\u0631\u064a",
      variant: "default",
      icon: <CheckCircle2 className="h-3 w-3" />,
    };
  }
}

function getDocumentTypeLabel(type: string): string {
  const types: Record<string, string> = {
    ID_CARD: "\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0647\u0648\u064a\u0629",
    PASSPORT: "\u062c\u0648\u0627\u0632 \u0627\u0644\u0633\u0641\u0631",
    CONTRACT: "\u0639\u0642\u062f \u0627\u0644\u0639\u0645\u0644",
    CERTIFICATE: "\u0634\u0647\u0627\u062f\u0629",
    OTHER: "\u0623\u062e\u0631\u0649",
  };
  return types[type] || type;
}

interface DocumentsTabProps {
  employee: EmployeeEntity;
}

export const DocumentsTab = ({ employee }: DocumentsTabProps) => {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const canWriteEmployees = hasPermission(PERMISSIONS.EMPLOYEE_WRITE);

  const { data: documents = [] } = useEmployeeDocuments(employee.id);
  const uploadDocuments = useUploadEmployeeDocuments();
  const deleteDocument = useDeleteEmployeeDocument();

  // Upload dialog state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<string>("CONTRACT");
  const [documentName, setDocumentName] = useState<string>("");
  const [issueDate, setIssueDate] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<{
    issueDate?: string;
    expiryDate?: string;
  }>({});
  const documentsFileInputRef = useRef<HTMLInputElement>(null);

  // Table columns
  const documentColumns: ColumnConfig<DocumentItem>[] = [
    {
      key: "type",
      label: t("employees.documents.type", { defaultValue: "\u0627\u0644\u0646\u0648\u0639" }),
      align: "start",
      render: (doc) => (
        <div className="flex items-center gap-2">
          <File className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{getDocumentTypeLabel(doc.documentType)}</span>
        </div>
      ),
      exportValue: (doc) => getDocumentTypeLabel(doc.documentType),
    },
    {
      key: "name",
      label: t("employees.documents.name", { defaultValue: "\u0627\u0644\u0627\u0633\u0645" }),
      align: "start",
      render: (doc) => (
        <div className="max-w-xs">
          <p className="text-sm font-medium truncate">{doc.documentName}</p>
          {doc.notes && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {doc.notes}
            </p>
          )}
        </div>
      ),
      exportValue: (doc) => doc.documentName,
    },
    {
      key: "issueDate",
      label: t("employees.documents.issueDate", { defaultValue: "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0635\u062f\u0627\u0631" }),
      align: "center",
      sortable: true,
      render: (doc) => (
        <span className="text-sm">
          {doc.issueDate ? formatDate(doc.issueDate) : "-"}
        </span>
      ),
      exportValue: (doc) => (doc.issueDate ? formatDate(doc.issueDate) : "-"),
    },
    {
      key: "expiryDate",
      label: t("employees.documents.expiryDate", { defaultValue: "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0627\u0646\u062a\u0647\u0627\u0621" }),
      align: "center",
      sortable: true,
      render: (doc) => (
        <span className="text-sm">
          {doc.expiryDate ? formatDate(doc.expiryDate) : "-"}
        </span>
      ),
      exportValue: (doc) => (doc.expiryDate ? formatDate(doc.expiryDate) : "-"),
    },
    {
      key: "status",
      label: t("employees.documents.status", { defaultValue: "\u0627\u0644\u062d\u0627\u0644\u0629" }),
      align: "center",
      render: (doc) => {
        const status = getDocumentStatus(doc.expiryDate);
        return (
          <Badge
            variant={status.variant}
            className="flex items-center gap-1 w-fit mx-auto"
          >
            {status.icon}
            <span>{status.label}</span>
          </Badge>
        );
      },
      exportValue: (doc) => getDocumentStatus(doc.expiryDate).label,
    },
  ];

  const documentActions: ActionButton<DocumentItem>[] = [
    {
      label: t("common.actions.download", { defaultValue: "\u062a\u062d\u0645\u064a\u0644" }),
      icon: <Download className="h-4 w-4" />,
      onClick: async (doc) => {
        try {
          const blob = await employeesApi.documents.download(employee.id, doc.id);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = doc.documentName;
          a.click();
          window.URL.revokeObjectURL(url);
        } catch {
          // Error handled silently
        }
      },
      variant: "ghost",
    },
    ...(canWriteEmployees
      ? [
          {
            label: t("common.actions.delete", { defaultValue: "\u062d\u0630\u0641" }),
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (doc: DocumentItem) => {
              deleteDocument.mutate({
                employeeId: employee.id,
                documentId: doc.id,
              });
            },
            variant: "ghost" as const,
          },
        ]
      : []),
  ];

  // Validate dates
  const validateDates = () => {
    const errors: { issueDate?: string; expiryDate?: string } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (issueDate) {
      const issue = new Date(issueDate);
      if (issue > today) {
        errors.issueDate = t("employees.documents.validation.issueDateFuture", {
          defaultValue: "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0635\u062f\u0627\u0631 \u0644\u0627 \u064a\u0645\u0643\u0646 \u0623\u0646 \u064a\u0643\u0648\u0646 \u0641\u064a \u0627\u0644\u0645\u0633\u062a\u0642\u0628\u0644",
        });
      }
    }

    if (expiryDate) {
      if (!issueDate) {
        errors.expiryDate = t("employees.documents.validation.expiryNeedsIssue", {
          defaultValue: "\u064a\u062c\u0628 \u062a\u062d\u062f\u064a\u062f \u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0635\u062f\u0627\u0631 \u0623\u0648\u0644\u0627\u064b",
        });
      } else {
        const issue = new Date(issueDate);
        const expiry = new Date(expiryDate);
        if (expiry <= issue) {
          errors.expiryDate = t("employees.documents.validation.expiryBeforeIssue", {
            defaultValue: "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0627\u0646\u062a\u0647\u0627\u0621 \u064a\u062c\u0628 \u0623\u0646 \u064a\u0643\u0648\u0646 \u0628\u0639\u062f \u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0635\u062f\u0627\u0631",
          });
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDocumentsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleUploadDocuments = async () => {
    if (!canWriteEmployees) return;
    if (selectedFiles.length === 0 || !documentName) return;
    if (!validateDates()) return;

    try {
      await uploadDocuments.mutateAsync({
        id: employee.id,
        files: selectedFiles,
        metadata: {
          documentType,
          documentName,
          issueDate: issueDate || undefined,
          expiryDate: expiryDate || undefined,
          notes: notes || undefined,
        },
      });

      // Reset form
      setIsUploadDialogOpen(false);
      setSelectedFiles([]);
      setDocumentName("");
      setIssueDate("");
      setExpiryDate("");
      setNotes("");
      setValidationErrors({});
      if (documentsFileInputRef.current) {
        documentsFileInputRef.current.value = "";
      }
    } catch {
      // Error handled by mutation hook
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {t("employees.details.documents", { defaultValue: "\u0627\u0644\u0645\u0633\u062a\u0646\u062f\u0627\u062a" })}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {documents.length}{" "}
                {t("employees.documents.count", { defaultValue: "\u0645\u0633\u062a\u0646\u062f" })}
              </CardDescription>
            </div>
            {canWriteEmployees && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <Upload className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t("employees.actions.uploadDocuments", {
                  defaultValue: "\u0631\u0641\u0639 \u0645\u0633\u062a\u0646\u062f\u0627\u062a",
                })}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={documents}
            columns={documentColumns}
            actions={documentActions}
            keyExtractor={(doc) => doc.id}
            enableClientSorting={true}
            defaultSort={{ column: "status", direction: "asc" }}
            enableExport={true}
            exportFilename={`employee_${employee.employeeNumber}_documents`}
            exportTitle={`${getEmployeeFullName(employee)} - ${t("employees.documents.title", { defaultValue: "\u0627\u0644\u0645\u0633\u062a\u0646\u062f\u0627\u062a" })}`}
            emptyMessage={t("employees.documents.empty", {
              defaultValue: "\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0633\u062a\u0646\u062f\u0627\u062a \u0645\u0631\u0641\u0648\u0639\u0629",
            })}
          />
        </CardContent>
      </Card>

      {/* Upload Documents Dialog */}
      <Dialog
        open={canWriteEmployees && isUploadDialogOpen}
        onOpenChange={(open) => setIsUploadDialogOpen(canWriteEmployees && open)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {t("employees.actions.uploadDocuments", { defaultValue: "\u0631\u0641\u0639 \u0645\u0633\u062a\u0646\u062f\u0627\u062a" })}
            </DialogTitle>
            <DialogDescription>
              {t("employees.documents.uploadDescription", {
                defaultValue: "\u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0648\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629",
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* File Input */}
            <div className="grid gap-2">
              <Label htmlFor="documents-files">
                {t("employees.documents.files", { defaultValue: "\u0627\u0644\u0645\u0644\u0641\u0627\u062a" })} *
              </Label>
              <Input
                id="documents-files"
                ref={documentsFileInputRef}
                type="file"
                multiple
                onChange={handleDocumentsFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              {selectedFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedFiles.length}{" "}
                  {t("employees.documents.filesSelected", { defaultValue: "\u0645\u0644\u0641 \u0645\u062d\u062f\u062f" })}
                </p>
              )}
            </div>

            {/* Document Type */}
            <div className="grid gap-2">
              <Label htmlFor="document-type">
                {t("employees.documents.type", { defaultValue: "\u0646\u0648\u0639 \u0627\u0644\u0645\u0633\u062a\u0646\u062f" })} *
              </Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ID_CARD">
                    {t("employees.documents.types.ID_CARD", { defaultValue: "\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0647\u0648\u064a\u0629" })}
                  </SelectItem>
                  <SelectItem value="PASSPORT">
                    {t("employees.documents.types.PASSPORT", { defaultValue: "\u062c\u0648\u0627\u0632 \u0627\u0644\u0633\u0641\u0631" })}
                  </SelectItem>
                  <SelectItem value="CONTRACT">
                    {t("employees.documents.types.CONTRACT", { defaultValue: "\u0639\u0642\u062f \u0627\u0644\u0639\u0645\u0644" })}
                  </SelectItem>
                  <SelectItem value="CERTIFICATE">
                    {t("employees.documents.types.CERTIFICATE", { defaultValue: "\u0634\u0647\u0627\u062f\u0629" })}
                  </SelectItem>
                  <SelectItem value="OTHER">
                    {t("employees.documents.types.OTHER", { defaultValue: "\u0623\u062e\u0631\u0649" })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Document Name */}
            <div className="grid gap-2">
              <Label htmlFor="document-name">
                {t("employees.documents.name", { defaultValue: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u0646\u062f" })} *
              </Label>
              <Input
                id="document-name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder={t("employees.documents.namePlaceholder", {
                  defaultValue: "\u0645\u062b\u0627\u0644: \u0639\u0642\u062f \u0639\u0645\u0644 2026",
                })}
              />
            </div>

            {/* Issue Date */}
            <div className="grid gap-2">
              <Label htmlFor="issue-date">
                {t("employees.documents.issueDate", { defaultValue: "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0635\u062f\u0627\u0631" })}
              </Label>
              <Input
                id="issue-date"
                type="date"
                value={issueDate}
                onChange={(e) => {
                  setIssueDate(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, issueDate: undefined }));
                }}
                max={new Date().toISOString().split("T")[0]}
                className={validationErrors.issueDate ? "border-destructive" : ""}
              />
              {validationErrors.issueDate && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationErrors.issueDate}
                </p>
              )}
            </div>

            {/* Expiry Date */}
            <div className="grid gap-2">
              <Label htmlFor="expiry-date">
                {t("employees.documents.expiryDate", { defaultValue: "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0627\u0646\u062a\u0647\u0627\u0621" })}
              </Label>
              <Input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => {
                  setExpiryDate(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, expiryDate: undefined }));
                }}
                min={issueDate || undefined}
                className={validationErrors.expiryDate ? "border-destructive" : ""}
              />
              {validationErrors.expiryDate && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationErrors.expiryDate}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">
                {t("employees.documents.notes", { defaultValue: "\u0645\u0644\u0627\u062d\u0638\u0627\u062a" })}
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("employees.documents.notesPlaceholder", {
                  defaultValue: "\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0625\u0636\u0627\u0641\u064a\u0629...",
                })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
            >
              {t("common.actions.cancel", { defaultValue: "\u0625\u0644\u063a\u0627\u0621" })}
            </Button>
            <Button
              onClick={handleUploadDocuments}
              disabled={
                uploadDocuments.isPending ||
                selectedFiles.length === 0 ||
                !documentName
              }
            >
              {uploadDocuments.isPending ? (
                <>
                  <Upload className="h-4 w-4 ltr:mr-2 rtl:ml-2 animate-spin" />
                  {t("common.actions.uploading", { defaultValue: "\u062c\u0627\u0631\u064a \u0627\u0644\u0631\u0641\u0639..." })}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t("common.actions.upload", { defaultValue: "\u0631\u0641\u0639" })}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
