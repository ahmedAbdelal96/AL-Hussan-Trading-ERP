/**
 * Quick Position Change Dialog
 *
 * Allows quickly changing employee position using a Select from the API,
 * filtered by the employee's current department.
 */

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useUpdateEmployee } from "@/hooks/useEmployees";
import { useActivePositions } from "@/hooks/usePositions";
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

interface QuickPositionChangeDialogProps {
  employeeId: string;
  employeeVersion?: number;
  currentPositionId: string | null;
  currentPositionName: string | null;
  employeeDepartmentId: string | null;
  employeeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickPositionChangeDialog = ({
  employeeId,
  employeeVersion,
  currentPositionId,
  currentPositionName,
  employeeDepartmentId,
  employeeName,
  open,
  onOpenChange,
}: QuickPositionChangeDialogProps) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateEmployee();
  // Filter positions by employee's department (if available)
  const { data: positions = [] } = useActivePositions(
    employeeDepartmentId || undefined,
  );
  const [selectedPositionId, setSelectedPositionId] = useState<string>(
    currentPositionId || "",
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
          positionId: selectedPositionId || undefined,
          rowVersion: employeeVersion,
        },
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Position update error:", error);
    }
  };

  const hasChanged = selectedPositionId !== (currentPositionId || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t("employees.quickActions.changePosition")}
          </DialogTitle>
          <DialogDescription>
            {t("employees.quickActions.changePositionFor", {
              name: employeeName,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Position Display */}
          {currentPositionName && (
            <div className="space-y-2">
              <Label>{t("employees.quickActions.currentPosition")}</Label>
              <div className="text-sm text-muted-foreground">
                {currentPositionName}
              </div>
            </div>
          )}

          {/* New Position Select */}
          <div className="space-y-2">
            <Label htmlFor="position">
              {t("employees.quickActions.newPosition")}
            </Label>
            <Select
              value={selectedPositionId || "none"}
              onValueChange={(value) =>
                setSelectedPositionId(value === "none" ? "" : value)
              }
            >
              <SelectTrigger id="position">
                <SelectValue
                  placeholder={t("employees.quickActions.newPosition")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t("employees.quickActions.noPosition")}
                </SelectItem>
                {positions.map((pos) => (
                  <SelectItem key={pos.id} value={pos.id}>
                    {pos.nameAr}
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
