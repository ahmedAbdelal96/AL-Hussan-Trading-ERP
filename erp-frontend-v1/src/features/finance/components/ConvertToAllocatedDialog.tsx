/**
 * ConvertToAllocatedDialog
 *
 * Dialog that converts a regular (single-project or general) cost into an
 * allocated cost distributed across multiple projects.
 *
 * Reuses the same allocation entry UX as ManageAllocationsDialog.
 */

import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { useProjects } from "@/hooks/useProjects";
import { useConvertToAllocated } from "@/hooks/useFinance";
import { CURRENCY } from "@/config/system.constants";
import { Plus, X, AlertCircle, CheckCircle2, GitBranch } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { ProjectStatus } from "@/types/projects.types";

// ============================================================================
// TYPES
// ============================================================================

type AllocationMode = "amount" | "percentage";

interface AllocationRow {
  projectId: string;
  value: string;
  notes: string;
}

interface ConvertToAllocatedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costId: string;
  costAmount: number;
  rowVersion: number;
  currency?: string;
}

// ============================================================================
// HELPERS (identical to ManageAllocationsDialog)
// ============================================================================

const TOLERANCE = 0.01;

function sumValues(rows: AllocationRow[]): number {
  return rows.reduce((acc, r) => acc + (parseFloat(r.value) || 0), 0);
}

function validateRows(
  rows: AllocationRow[],
  mode: AllocationMode,
  totalAmount: number,
): string[] {
  const errors: string[] = [];

  if (rows.length < 2) {
    errors.push("minProjects");
    return errors;
  }

  const projectIds = rows.map((r) => r.projectId);
  if (new Set(projectIds).size !== projectIds.length) {
    errors.push("duplicateProjects");
  }

  if (rows.some((r) => !r.projectId)) {
    errors.push("unselectedProject");
  }

  const hasNonPositive = rows.some((r) => {
    const v = parseFloat(r.value);
    return isNaN(v) || v <= 0;
  });
  if (hasNonPositive) {
    errors.push("nonPositiveValues");
  }

  const sum = sumValues(rows);
  const target = mode === "percentage" ? 100 : totalAmount;
  if (Math.abs(sum - target) > TOLERANCE) {
    errors.push("sumMismatch");
  }

  return errors;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ConvertToAllocatedDialog({
  open,
  onOpenChange,
  costId,
  costAmount,
  rowVersion,
  currency = CURRENCY.DEFAULT,
}: ConvertToAllocatedDialogProps) {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const isRTL = language === "ar";

  const { data: projectsData, isLoading: projectsLoading } = useProjects({
    status: ProjectStatus.ACTIVE,
    limit: 100,
  });

  const convertMutation = useConvertToAllocated();

  // ── State ───────────────────────────────────────────────────────────────────

  const [mode, setMode] = useState<AllocationMode>("percentage");
  const [rows, setRows] = useState<AllocationRow[]>([
    { projectId: "", value: "50", notes: "" },
    { projectId: "", value: "50", notes: "" },
  ]);

  const projects = useMemo(() => projectsData?.data ?? [], [projectsData]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const currentSum = useMemo(() => sumValues(rows), [rows]);
  const target = mode === "percentage" ? 100 : costAmount;
  const remaining = Math.max(0, target - currentSum);
  const validationErrors = useMemo(
    () => validateRows(rows, mode, costAmount),
    [rows, mode, costAmount],
  );
  const isValid = validationErrors.length === 0;

  // ── Labels ──────────────────────────────────────────────────────────────────

  const labels = useMemo(
    () => ({
      title: t("finance.costs.allocations.convert.title"),
      description: t("finance.costs.allocations.convert.description"),
      warning: t("finance.costs.allocations.convert.warning"),
      projectLabel: t("finance.costs.allocations.fields.project"),
      valueLabel:
        mode === "percentage"
          ? t("finance.costs.allocations.fields.percentage")
          : t("finance.costs.allocations.fields.amount"),
      notesLabel: t("finance.costs.allocations.fields.notes"),
      modeAmount: t("finance.costs.allocations.mode.switchToAmount"),
      modePercent: t("finance.costs.allocations.mode.switchToPercentage"),
      addRow: t("finance.costs.allocations.actions.addAllocation"),
      autoFill: t("finance.costs.allocations.actions.autoFill"),
      totalLabel: t("finance.costs.allocations.fields.totalAmount"),
      remainingLabel: t("finance.costs.allocations.fields.remainingAmount"),
      convert: t("finance.costs.allocations.actions.convert"),
      cancel: t("common.cancel"),
      errorMinProjects: t("finance.costs.allocations.validation.minProjects"),
      errorDuplicate: t(
        "finance.costs.allocations.validation.duplicateDetected",
      ),
      errorUnselected: t(
        "finance.costs.allocations.validation.unselectedProject",
      ),
      errorNonPositive: t(
        "finance.costs.allocations.validation.nonPositiveValue",
      ),
      errorSum:
        mode === "percentage"
          ? t("finance.costs.allocations.validation.sumPercentage", {
              current: currentSum.toFixed(2),
            })
          : t("finance.costs.allocations.validation.sumAmount", {
              expected: costAmount.toFixed(2),
              currency,
              current: currentSum.toFixed(2),
            }),
    }),
    [t, mode, currentSum, costAmount, currency],
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAddRow = useCallback(() => {
    setRows((prev) => [...prev, { projectId: "", value: "", notes: "" }]);
  }, []);

  const handleRemoveRow = useCallback((idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleRowChange = useCallback(
    (idx: number, field: keyof AllocationRow, value: string) => {
      setRows((prev) =>
        prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
      );
    },
    [],
  );

  const handleAutoFill = useCallback(
    (idx: number) => {
      const rem = remaining;
      if (rem <= 0) return;
      setRows((prev) =>
        prev.map((row, i) =>
          i === idx
            ? { ...row, value: (parseFloat(row.value || "0") + rem).toFixed(2) }
            : row,
        ),
      );
    },
    [remaining],
  );

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "amount" ? "percentage" : "amount";
      setRows((currentRows) =>
        currentRows.map((row) => {
          const v = parseFloat(row.value) || 0;
          if (prev === "amount" && costAmount > 0) {
            return { ...row, value: ((v / costAmount) * 100).toFixed(2) };
          } else {
            return { ...row, value: ((v / 100) * costAmount).toFixed(2) };
          }
        }),
      );
      return next;
    });
  }, [costAmount]);

  const handleConvert = useCallback(async () => {
    if (!isValid) return;

    const allocations = rows.map((row) => ({
      projectId: row.projectId,
      ...(mode === "percentage"
        ? { percentage: parseFloat(row.value) }
        : { amount: parseFloat(row.value) }),
      ...(row.notes ? { notes: row.notes } : {}),
    }));

    try {
      await convertMutation.mutateAsync({
        costId,
        data: { allocations },
        rowVersion,
      });
      onOpenChange(false);
    } catch {
      // Error handled by hook
    }
  }, [isValid, rows, mode, costId, rowVersion, convertMutation, onOpenChange]);

  const errorLabel = useMemo(() => {
    const map: Record<string, string> = {
      minProjects: labels.errorMinProjects,
      duplicateProjects: labels.errorDuplicate,
      unselectedProject: labels.errorUnselected,
      nonPositiveValues: labels.errorNonPositive,
      sumMismatch: labels.errorSum,
    };
    return validationErrors.map((e) => map[e] ?? e);
  }, [validationErrors, labels]);

  const usedProjectIds = useMemo(
    () => new Set(rows.map((r) => r.projectId).filter(Boolean)),
    [rows],
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            {labels.title}
          </DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        {/* Warning */}
        <Alert className="border-amber-500/40 bg-amber-50/30 text-foreground">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-800">
            {labels.warning}
          </AlertDescription>
        </Alert>

        {/* Mode toggle + summary bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMode}
            className="h-7 text-xs gap-1.5"
          >
            {mode === "amount" ? labels.modePercent : labels.modeAmount}
          </Button>
          <Badge variant="secondary" className="text-xs">
            {mode === "amount"
              ? isRTL
                ? "مبلغ"
                : "Amount"
              : isRTL
                ? "نسبة"
                : "Percentage"}
          </Badge>
          <div className="ms-auto rounded-md border bg-muted/30 px-3 py-1.5 flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">
                {labels.totalLabel}:{" "}
              </span>
              <span className="font-semibold">
                {mode === "percentage"
                  ? "100%"
                  : `${currency} ${costAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">
                {labels.remainingLabel}:{" "}
              </span>
              <span
                className={cn(
                  "font-semibold",
                  Math.abs(remaining) < TOLERANCE
                    ? "text-emerald-600"
                    : remaining < 0
                      ? "text-red-600"
                      : "text-amber-600",
                )}
              >
                {mode === "percentage"
                  ? `${remaining.toFixed(2)}%`
                  : `${currency} ${remaining.toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-3">
          {rows.map((row, idx) => {
            const isDuplicate =
              row.projectId &&
              rows.filter((r) => r.projectId === row.projectId).length > 1;

            return (
              <div
                key={idx}
                className={cn(
                  "rounded-md border p-3 space-y-2 bg-card",
                  isDuplicate && "border-red-400/60 bg-red-50/20",
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      {labels.projectLabel}
                    </Label>
                    <Select
                      value={row.projectId || ""}
                      onValueChange={(v) =>
                        handleRowChange(idx, "projectId", v)
                      }
                      disabled={projectsLoading}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue
                          placeholder={
                            isRTL ? "اختر مشروعاً..." : "Select project..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem
                            key={p.id}
                            value={p.id}
                            disabled={
                              usedProjectIds.has(p.id) && p.id !== row.projectId
                            }
                          >
                            <span className="font-medium">{p.name}</span>
                            <span className="text-muted-foreground text-xs ms-2">
                              {p.projectCode}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-32 shrink-0">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      {labels.valueLabel}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.value}
                        onChange={(e) =>
                          handleRowChange(idx, "value", e.target.value)
                        }
                        className="h-8 text-sm pe-7"
                        dir="ltr"
                      />
                      <span className="absolute end-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        {mode === "percentage" ? "%" : currency.slice(0, 3)}
                      </span>
                    </div>
                  </div>

                  {remaining > TOLERANCE && (
                    <div className="pt-5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-primary hover:text-primary/80 px-1.5"
                        onClick={() => handleAutoFill(idx)}
                        title={labels.autoFill}
                      >
                        {labels.autoFill}
                      </Button>
                    </div>
                  )}

                  {rows.length > 2 && (
                    <div className="pt-5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveRow(idx)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                <Input
                  type="text"
                  placeholder={`${labels.notesLabel} (${isRTL ? "اختياري" : "optional"})`}
                  value={row.notes}
                  onChange={(e) =>
                    handleRowChange(idx, "notes", e.target.value)
                  }
                  className="h-7 text-xs text-muted-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleAddRow}
        >
          <Plus className="h-4 w-4 me-2" />
          {labels.addRow}
        </Button>

        {errorLabel.length > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-1">
            {errorLabel.map((msg, i) => (
              <p
                key={i}
                className="flex items-center gap-2 text-sm text-destructive"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {msg}
              </p>
            ))}
          </div>
        )}

        {isValid && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 rounded-md border border-emerald-500/30 bg-emerald-50/30 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {isRTL
              ? "التوزيعات صحيحة — جاهز للتحويل"
              : "Allocations are valid — ready to convert"}
          </div>
        )}

        <Separator />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={convertMutation.isPending}
          >
            {labels.cancel}
          </Button>
          <Button
            onClick={handleConvert}
            disabled={!isValid || convertMutation.isPending}
          >
            {convertMutation.isPending && (
              <span className="animate-spin me-2">⟳</span>
            )}
            {labels.convert}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
