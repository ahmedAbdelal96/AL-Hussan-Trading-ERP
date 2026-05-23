/**
 * Quick Add Deduction Dialog
 *
 * Dialog for quickly adding a deduction to an employee
 *
 * @component QuickAddDeductionDialog
 * @module Employees
 */

import { useState, useMemo } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useCreateEmployeeDeduction } from "@/hooks/useEmployeeDeductions";
import { DeductionType } from "@/types/payroll.types";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseMoneyInput } from "@/lib/money";

interface QuickAddDeductionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
}

export function QuickAddDeductionDialog({
  isOpen,
  onClose,
  employeeId,
}: QuickAddDeductionDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateEmployeeDeduction();

  // Form state
  const [deductionType, setDeductionType] = useState<DeductionType | "">("");
  const [amount, setAmount] = useState<string>("");
  const [deductionDate, setDeductionDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Validation errors
  const [errors, setErrors] = useState<{
    deductionType?: string;
    amount?: string;
    deductionDate?: string;
  }>({});

  const AUTO_APPROVED_TYPES: DeductionType[] = [
    DeductionType.TAX,
    DeductionType.INSURANCE,
    DeductionType.LOAN_REPAYMENT,
  ];

  const isAutoApproved = useMemo(() => {
    return (
      deductionType &&
      AUTO_APPROVED_TYPES.includes(deductionType as DeductionType)
    );
  }, [deductionType]);

  const handleClose = () => {
    // Reset form
    setDeductionType("");
    setAmount("");
    setDeductionDate(new Date().toISOString().split("T")[0]);
    setReason("");
    setNotes("");
    setErrors({});
    onClose();
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!deductionType) {
      newErrors.deductionType = t(
        "payroll.employeeDeductions.validation.typeRequired",
        { defaultValue: "نوع الخصم مطلوب" },
      );
    }

    if (!amount || parseMoneyInput(amount) <= 0) {
      newErrors.amount = t(
        "payroll.employeeDeductions.validation.amountInvalid",
        { defaultValue: "المبلغ غير صحيح" },
      );
    }

    if (!deductionDate) {
      newErrors.deductionDate = t(
        "payroll.employeeDeductions.validation.dateRequired",
        { defaultValue: "التاريخ مطلوب" },
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        employeeId,
        deductionType: deductionType as DeductionType,
        amount: parseMoneyInput(amount),
        deductionDate,
        reason: reason || undefined,
        notes: notes || undefined,
      });
      handleClose();
    } catch (error) {
      console.error("Failed to create deduction:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t("payroll.employeeDeductions.addDialog.title", {
              defaultValue: "إضافة خصم جديد",
            })}
          </DialogTitle>
          <DialogDescription>
            {t("payroll.employeeDeductions.addDialog.description", {
              defaultValue: "أضف خصم جديد للموظف",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Deduction Type */}
          <div className="space-y-2">
            <Label htmlFor="deductionType">
              {t("payroll.employeeDeductions.fields.deductionType", {
                defaultValue: "نوع الخصم",
              })}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={deductionType}
              onValueChange={(value) =>
                setDeductionType(value as DeductionType)
              }
            >
              <SelectTrigger
                id="deductionType"
                className={errors.deductionType ? "border-destructive" : ""}
              >
                <SelectValue
                  placeholder={t("payroll.employeeDeductions.selectType", {
                    defaultValue: "اختر نوع الخصم",
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DeductionType.PENALTY}>
                  {t("payroll.deductionType.PENALTY", {
                    defaultValue: "جزاء / غرامة",
                  })}
                </SelectItem>
                <SelectItem value={DeductionType.ABSENCE}>
                  {t("payroll.deductionType.ABSENCE", {
                    defaultValue: "خصم غياب",
                  })}
                </SelectItem>
                <SelectItem value={DeductionType.ADVANCE_DEDUCTION}>
                  {t("payroll.deductionType.ADVANCE_DEDUCTION", {
                    defaultValue: "خصم سلفة",
                  })}
                </SelectItem>
                <SelectItem value={DeductionType.INSURANCE}>
                  {t("payroll.deductionType.INSURANCE", {
                    defaultValue: "تأمين",
                  })}
                </SelectItem>
                <SelectItem value={DeductionType.TAX}>
                  {t("payroll.deductionType.TAX", {
                    defaultValue: "ضريبة",
                  })}
                </SelectItem>
                <SelectItem value={DeductionType.OTHER}>
                  {t("payroll.deductionType.OTHER", {
                    defaultValue: "أخرى",
                  })}
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.deductionType && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.deductionType}
              </p>
            )}
          </div>

          {/* Auto-approval info */}
          {isAutoApproved && (
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription>
                {t("payroll.employeeDeductions.autoApproved", {
                  defaultValue: "هذا النوع يتم اعتماده تلقائياً",
                })}
              </AlertDescription>
            </Alert>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              {t("payroll.employeeDeductions.fields.amount", {
                defaultValue: "المبلغ",
              })}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={errors.amount ? "border-destructive" : ""}
            />
            {errors.amount && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.amount}
              </p>
            )}
          </div>

          {/* Deduction Date */}
          <div className="space-y-2">
            <Label htmlFor="deductionDate">
              {t("payroll.employeeDeductions.fields.deductionDate", {
                defaultValue: "تاريخ الخصم",
              })}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="deductionDate"
              type="date"
              value={deductionDate}
              onChange={(e) => setDeductionDate(e.target.value)}
              className={errors.deductionDate ? "border-destructive" : ""}
            />
            {errors.deductionDate && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.deductionDate}
              </p>
            )}
          </div>

          {/* Reason (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              {t("payroll.employeeDeductions.fields.reason", {
                defaultValue: "سبب الخصم",
              })}{" "}
              <span className="text-muted-foreground text-xs">
                ({t("common.optional", { defaultValue: "اختياري" })})
              </span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("payroll.employeeDeductions.reasonPlaceholder", {
                defaultValue: "مثال: غياب بدون إذن، تأخير متكرر...",
              })}
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              {t("payroll.employeeDeductions.fields.notes", {
                defaultValue: "ملاحظات",
              })}{" "}
              <span className="text-muted-foreground text-xs">
                ({t("common.optional", { defaultValue: "اختياري" })})
              </span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("payroll.employeeDeductions.notesPlaceholder", {
                defaultValue: "أي ملاحظات إضافية...",
              })}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("common.actions.cancel", { defaultValue: "إلغاء" })}
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 ltr:mr-2 rtl:ml-2 animate-spin" />
                {t("common.saving", { defaultValue: "جاري الحفظ..." })}
              </>
            ) : (
              t("common.actions.add", { defaultValue: "إضافة" })
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
