/**
 * CompleteMaintenanceDialog
 *
 * Shown before marking a maintenance request as COMPLETED.
 * Lets the user:
 *  1. Enter the actual cost
 *  2. Review / adjust how that cost is split across the linked projects
 *  3. Confirm — the percentages and final cost are sent to the backend together
 *
 * Business rules enforced:
 *  - All percentages must sum to exactly 100 (±0.01 float tolerance)
 *  - actualCost must be ≥ 0
 */

import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, AlertCircle, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUpdateMaintenance } from "@/hooks/useMaintenance";
import { MaintenanceStatus } from "@/types/maintenance.types";
import type { MaintenanceProjectAllocation } from "@/types/maintenance.types";
import { useTranslation } from "@/i18n/useTranslation";


interface AllocationRow {
  projectId: string;
  projectName: string | null | undefined;
  percentage: number;
}

interface CompleteMaintenanceDialogProps {
  maintenanceId: string;
  maintenanceNumber: string;
  rowVersion: number;
  /** Current allocations stored on the maintenance request (from API) */
  projectAllocations: MaintenanceProjectAllocation[];
  /** Pre-fill actual cost from estimatedCost or last saved actualCost */
  defaultActualCost?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


export const CompleteMaintenanceDialog = ({
  maintenanceId,
  maintenanceNumber,
  rowVersion,
  projectAllocations,
  defaultActualCost,
  open,
  onOpenChange,
}: CompleteMaintenanceDialogProps) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateMaintenance();

  const [actualCost, setActualCost] = useState<string>(
    defaultActualCost != null ? String(defaultActualCost) : "",
  );

  const [rows, setRows] = useState<AllocationRow[]>([]);

  // Reset state every time the dialog opens
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActualCost(defaultActualCost != null ? String(defaultActualCost) : "");
      setRows(
        projectAllocations.map((a) => ({
          projectId: a.projectId,
          projectName: a.projectName,
          percentage: a.percentage,
        })),
      );
    }
  }, [open, projectAllocations, defaultActualCost]);

  const parsedCost = useMemo(() => {
    const v = parseFloat(actualCost);
    return isNaN(v) || v < 0 ? 0 : v;
  }, [actualCost]);

  const totalPercentage = useMemo(
    () => rows.reduce((sum, r) => sum + (r.percentage || 0), 0),
    [rows],
  );

  const percentageError = useMemo(() => {
    if (rows.length === 0) return null;
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return t("maintenance.complete.percentageMustBe100", {
        defaultValue: `مجموع النسب يجب أن يساوي 100٪. الحالي: ${totalPercentage.toFixed(2)}٪`,
      });
    }
    return null;
  }, [totalPercentage, rows.length, t]);

  const isValid = !percentageError && actualCost !== "";

  const handlePercentageChange = (index: number, value: string) => {
    const parsed = parseFloat(value);
    setRows((prev) =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              percentage: isNaN(parsed)
                ? 0
                : Math.min(100, Math.max(0, parsed)),
            }
          : r,
      ),
    );
  };

  const handleConfirm = async () => {
    if (!isValid) return;
    try {
      await updateMutation.mutateAsync({
        id: maintenanceId,
        data: {
          status: MaintenanceStatus.COMPLETED,
          rowVersion,
          actualCost: parsedCost,
          // Only send allocations override if there are multiple projects
          ...(rows.length > 1 && {
            projectAllocations: rows.map((r) => ({
              projectId: r.projectId,
              percentage: r.percentage,
            })),
          }),
        },
      });
      onOpenChange(false);
    } catch {
      // error toast is shown by the mutation hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            {t("maintenance.complete.title", {
              defaultValue: "إتمام طلب الصيانة",
            })}
          </DialogTitle>
          <DialogDescription>
            {t("maintenance.complete.description", {
              defaultValue: `طلب الصيانة ${maintenanceNumber} — راجع التكلفة والتوزيع قبل التأكيد`,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ── Actual Cost ─────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="actualCost">
              {t("maintenance.fields.actualCost", {
                defaultValue: "التكلفة الفعلية (ر.س)",
              })}
              <span className="text-destructive mr-1">*</span>
            </Label>
            <Input
              id="actualCost"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
            />
          </div>

          {/* ── Allocation Table ─────────────────────────────────────────── */}
          {rows.length > 0 && (
            <div className="space-y-2">
              <Label>
                {t("maintenance.complete.costDistribution", {
                  defaultValue: "توزيع التكلفة على المشاريع",
                })}
              </Label>

              {/* Header */}
              <div className="grid grid-cols-[1fr_100px_100px] gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>
                  {t("maintenance.complete.project", {
                    defaultValue: "المشروع",
                  })}
                </span>
                <span className="text-center">
                  {t("maintenance.complete.percentage", {
                    defaultValue: "النسبة %",
                  })}
                </span>
                <span className="text-center">
                  {t("maintenance.complete.amount", {
                    defaultValue: "المبلغ",
                  })}
                </span>
              </div>

              {/* Rows */}
              {rows.map((row, index) => {
                const amount =
                  parsedCost > 0
                    ? Math.round((row.percentage / 100) * parsedCost * 100) /
                      100
                    : 0;
                return (
                  <div
                    key={row.projectId}
                    className="grid grid-cols-[1fr_100px_100px] gap-2 items-center"
                  >
                    {/* Project name */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm">
                        {row.projectName ||
                          t("maintenance.complete.unknownProject", {
                            defaultValue: "مشروع",
                          })}
                      </span>
                    </div>

                    {/* Percentage input — editable only when >1 project */}
                    {rows.length > 1 ? (
                      <Input
                        type="number"
                        min={0.01}
                        max={100}
                        step={0.01}
                        value={row.percentage}
                        onChange={(e) =>
                          handlePercentageChange(index, e.target.value)
                        }
                        className="text-center h-8 text-sm"
                      />
                    ) : (
                      <div className="text-center text-sm font-medium">
                        {row.percentage}%
                      </div>
                    )}

                    {/* Computed amount */}
                    <div className="text-center text-sm font-medium text-green-700 dark:text-green-400">
                      {parsedCost > 0
                        ? amount.toLocaleString("ar-SA", {
                            minimumFractionDigits: 2,
                          })
                        : "—"}
                    </div>
                  </div>
                );
              })}

              {/* Total row */}
              <div className="grid grid-cols-[1fr_100px_100px] gap-2 items-center border-t pt-2 mt-1">
                <span className="text-sm font-semibold">
                  {t("maintenance.complete.total", {
                    defaultValue: "الإجمالي",
                  })}
                </span>
                <div
                  className={`text-center text-sm font-bold ${
                    percentageError
                      ? "text-destructive"
                      : "text-green-700 dark:text-green-400"
                  }`}
                >
                  {totalPercentage.toFixed(2)}%
                </div>
                <div className="text-center text-sm font-bold text-green-700 dark:text-green-400">
                  {parsedCost > 0
                    ? parsedCost.toLocaleString("ar-SA", {
                        minimumFractionDigits: 2,
                      })
                    : "—"}
                </div>
              </div>
            </div>
          )}

          {/* ── Validation error ─────────────────────────────────────────── */}
          {percentageError && (
            <Alert className="border-red-400 bg-red-50 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{percentageError}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            {t("common.cancel", { defaultValue: "إلغاء" })}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || updateMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {updateMutation.isPending
              ? t("common.saving", { defaultValue: "جارٍ الحفظ..." })
              : t("maintenance.complete.confirm", {
                  defaultValue: "تأكيد الإتمام",
                })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteMaintenanceDialog;
