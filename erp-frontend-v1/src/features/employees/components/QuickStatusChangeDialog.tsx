/**
 * Quick Status Change Dialog
 *
 * Allows quickly changing employee status without full edit mode
 */

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useUpdateEmployee } from "@/hooks/useEmployees";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Lock } from "lucide-react";
import { EmployeeStatus } from "@/types/employees.types";
import { showToast } from "@/lib/toast";
import {
  getAllowedTransitions,
  isTerminalStatus,
} from "@/lib/employee-status-transitions";

interface QuickStatusChangeDialogProps {
  employeeId: string;
  employeeVersion?: number;
  currentStatus: EmployeeStatus | null | undefined;
  employeeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickStatusChangeDialog = ({
  employeeId,
  employeeVersion,
  currentStatus,
  employeeName,
  open,
  onOpenChange,
}: QuickStatusChangeDialogProps) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateEmployee();
  const actualStatus = currentStatus || EmployeeStatus.ACTIVE;
  const allowedTransitions = getAllowedTransitions(actualStatus);
  const locked = isTerminalStatus(actualStatus);
  const [newStatus, setNewStatus] = useState<EmployeeStatus>(
    allowedTransitions[0] ?? actualStatus,
  );
  const [terminationDate, setTerminationDate] = useState("");
  const [terminationReason, setTerminationReason] = useState("");

  const handleSubmit = async () => {
    try {
      if (typeof employeeVersion !== "number") {
        showToast.error(
          t("employees.quickActions.versionMissing", {
            defaultValue:
              "تعذر تحديث بيانات الموظف الآن. يرجى إعادة تحميل الصفحة.",
          }),
        );
        return;
      }

      const updateData: Record<string, unknown> = {
        status: newStatus,
        rowVersion: employeeVersion,
      };

      // If status is TERMINATED, include termination details
      if (newStatus === EmployeeStatus.TERMINATED) {
        if (!terminationDate) {
          showToast.error(
            t("employees.form.validation.terminationDateRequired"),
          );
          return;
        }
        updateData.terminationDate = terminationDate;
        if (terminationReason) {
          updateData.terminationReason = terminationReason;
        }
      }
      // For non-TERMINATED status, don't include termination fields at all
      // Backend will handle clearing them

      await updateMutation.mutateAsync({
        id: employeeId,
        data: updateData,
      });

      // Toast will be shown by the mutation hook automatically
      onOpenChange(false);
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  const statusOptions: EmployeeStatus[] = getAllowedTransitions(actualStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t("employees.quickActions.changeStatus.title", {
              defaultValue: "تغيير حالة الموظف",
            })}
          </DialogTitle>
          <DialogDescription>
            {t("employees.quickActions.changeStatus.description", {
              defaultValue: `تغيير حالة: ${employeeName}`,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status Display */}
          <div className="space-y-2">
            <Label>
              {t("employees.quickActions.changeStatus.currentStatus", {
                defaultValue: "الحالة الحالية",
              })}
            </Label>
            <div className="text-sm text-muted-foreground">
              {actualStatus ? t(`employees.status.${actualStatus}`) : "—"}
            </div>
          </div>

          {/* LOCKED — terminal state, no transitions allowed */}
          {locked ? (
            <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4">
              <Lock className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  {t("employees.quickActions.changeStatus.terminatedTitle", {
                    defaultValue: "لا يمكن تغيير الحالة",
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("employees.quickActions.changeStatus.terminatedMessage", {
                    defaultValue:
                      "الموظف منتهي الخدمة — الحالة نهائية ولا يمكن التراجع عنها. لإعادة التوظيف، أنشئ سجل موظف جديد.",
                  })}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* New Status Selection — only valid transitions */}
              <div className="space-y-2">
                <Label htmlFor="status">
                  {t("employees.quickActions.changeStatus.newStatus", {
                    defaultValue: "الحالة الجديدة",
                  })}
                </Label>
                <Select
                  value={newStatus}
                  onValueChange={(value) =>
                    setNewStatus(value as EmployeeStatus)
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`employees.status.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Termination Fields (Conditional) */}
              {newStatus === EmployeeStatus.TERMINATED && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="terminationDate">
                      {t("employees.form.fields.terminationDate")} *
                    </Label>
                    <Input
                      id="terminationDate"
                      type="date"
                      value={terminationDate}
                      onChange={(e) => setTerminationDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="terminationReason">
                      {t("employees.form.fields.terminationReason")}
                    </Label>
                    <Textarea
                      id="terminationReason"
                      value={terminationReason}
                      onChange={(e) => setTerminationReason(e.target.value)}
                      placeholder={t(
                        "employees.form.placeholders.terminationReason",
                      )}
                      rows={3}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              updateMutation.isPending || locked || newStatus === actualStatus
            }
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
