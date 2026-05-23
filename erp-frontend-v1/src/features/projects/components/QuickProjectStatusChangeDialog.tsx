/**
 * Quick Project Status Change Dialog
 *
 * Allows quickly changing project status without opening the full edit form.
 * Shows contextual notes field for statuses that usually require explanation
 * (ON_HOLD, CANCELLED).
 */

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useUpdateProject } from "@/hooks/useProjects";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { ProjectStatus } from "@/types/projects.types";
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

interface QuickProjectStatusChangeDialogProps {
  projectId: string;
  projectName: string;
  currentStatus: ProjectStatus;
  rowVersion: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Color classes matching getStatusConfig in ProjectDetailsPage */
const getProjectStatusClass = (status: ProjectStatus) =>
  getStatusBadgeClass(getStatusTone(status));

/** Statuses that benefit from a reason / note */
const NEEDS_NOTES = new Set([ProjectStatus.ON_HOLD, ProjectStatus.CANCELLED]);

export const QuickProjectStatusChangeDialog = ({
  projectId,
  projectName,
  currentStatus,
  rowVersion,
  open,
  onOpenChange,
}: QuickProjectStatusChangeDialogProps) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateProject();
  const [newStatus, setNewStatus] = useState<ProjectStatus>(currentStatus);
  const [notes, setNotes] = useState("");

  const statusOptions = Object.values(ProjectStatus);

  const handleSubmit = async () => {
    try {
      await updateMutation.mutateAsync({
        id: projectId,
        data: {
          status: newStatus,
          rowVersion,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
      });
      onOpenChange(false);
    } catch {
      // toast shown by mutation hook
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      // reset on close
      setNewStatus(currentStatus);
      setNotes("");
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>
            {t("projects.quickActions.changeStatus.title", {
              defaultValue: "تغيير حالة المشروع",
            })}
          </DialogTitle>
          <DialogDescription>
            {t("projects.quickActions.changeStatus.description", {
              defaultValue: `المشروع: ${projectName}`,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="space-y-2">
            <Label>
              {t("projects.quickActions.changeStatus.currentStatus", {
                defaultValue: "الحالة الحالية",
              })}
            </Label>
            <div>
              <Badge variant="outline" className={getProjectStatusClass(currentStatus)}>
                {t(`projects.status.${currentStatus}`)}
              </Badge>
            </div>
          </div>

          {/* New Status */}
          <div className="space-y-2">
            <Label htmlFor="project-status">
              {t("projects.quickActions.changeStatus.newStatus", {
                defaultValue: "الحالة الجديدة",
              })}
            </Label>
            <Select
              value={newStatus}
              onValueChange={(v) => setNewStatus(v as ProjectStatus)}
            >
              <SelectTrigger id="project-status">
                <SelectValue>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${getProjectStatusClass(newStatus)}`}
                  >
                    {t(`projects.status.${newStatus}`)}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${getProjectStatusClass(status)}`}
                    >
                      {t(`projects.status.${status}`)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contextual notes for statuses that need explanation */}
          {NEEDS_NOTES.has(newStatus) && (
            <div className="space-y-2">
              <Label htmlFor="status-notes">
                {t("projects.quickActions.changeStatus.reason", {
                  defaultValue:
                    newStatus === ProjectStatus.ON_HOLD
                      ? "سبب التعليق"
                      : "سبب الإلغاء",
                })}
                <span className="text-muted-foreground text-xs ltr:ml-1 rtl:mr-1">
                  ({t("common.optional", { defaultValue: "اختياري" })})
                </span>
              </Label>
              <Textarea
                id="status-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t(
                  "projects.quickActions.changeStatus.reasonPlaceholder",
                  {
                    defaultValue: "أدخل السبب هنا...",
                  },
                )}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={updateMutation.isPending || newStatus === currentStatus}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ltr:mr-2 rtl:ml-2" />
                {t("common.saving")}
              </>
            ) : (
              t("common.save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
