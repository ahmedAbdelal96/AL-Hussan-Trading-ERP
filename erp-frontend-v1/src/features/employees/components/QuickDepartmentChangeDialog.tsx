/**
 * Quick Department Change Dialog
 *
 * Allows quickly changing employee department using a Select from the API
 */

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useUpdateEmployee } from "@/hooks/useEmployees";
import { useActiveDepartments } from "@/hooks/useDepartments";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";

interface QuickDepartmentChangeDialogProps {
  employeeId: string;
  employeeVersion?: number;
  currentDepartmentId: string | null;
  currentDepartmentName: string | null;
  employeeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickDepartmentChangeDialog = ({
  employeeId,
  employeeVersion,
  currentDepartmentId,
  currentDepartmentName,
  employeeName,
  open,
  onOpenChange,
}: QuickDepartmentChangeDialogProps) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateEmployee();
  const { data: departments = [] } = useActiveDepartments();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    currentDepartmentId || "",
  );

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

      await updateMutation.mutateAsync({
        id: employeeId,
        data: {
          departmentId: selectedDepartmentId || undefined,
          rowVersion: employeeVersion,
        },
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Department update error:", error);
    }
  };

  const hasChanged = selectedDepartmentId !== (currentDepartmentId || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t("employees.quickActions.changeDepartment")}
          </DialogTitle>
          <DialogDescription>
            {t("employees.quickActions.changeDepartmentFor", {
              name: employeeName,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Department Display */}
          {currentDepartmentName && (
            <div className="space-y-2">
              <Label>{t("employees.quickActions.currentDepartment")}</Label>
              <div className="text-sm text-muted-foreground">
                {currentDepartmentName}
              </div>
            </div>
          )}

          {/* New Department Select */}
          <div className="space-y-2">
            <Label htmlFor="department">
              {t("employees.quickActions.newDepartment")}
            </Label>
            <Select
              value={selectedDepartmentId || "none"}
              onValueChange={(value) =>
                setSelectedDepartmentId(value === "none" ? "" : value)
              }
            >
              <SelectTrigger id="department">
                <SelectValue
                  placeholder={t("employees.quickActions.newDepartment")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t("employees.quickActions.noDepartment")}
                </SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.nameAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            disabled={updateMutation.isPending || !hasChanged}
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
