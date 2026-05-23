/**
 * Quick Add Loan Dialog
 *
 * Dialog for quickly adding a loan to an employee.
 *
 * @component QuickAddLoanDialog
 * @module Employees
 */

import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useCreateEmployeeLoan } from "@/hooks/useEmployeeLoans";
import type { CreateEmployeeLoanDto } from "@/types/payroll.types";
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
import { AlertCircle, Loader2, Calculator } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import { parseIntegerInput, parseMoneyInput } from "@/lib/money";

interface QuickAddLoanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
}

export function QuickAddLoanDialog({
  isOpen,
  onClose,
  employeeId,
}: QuickAddLoanDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateEmployeeLoan();

  const [amount, setAmount] = useState<string>("");
  const [installments, setInstallments] = useState<string>("12");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [errors, setErrors] = useState<{
    amount?: string;
    installments?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  const installmentAmount = useMemo(() => {
    const amt = parseMoneyInput(amount);
    const inst = Math.floor(parseIntegerInput(installments));
    if (amt > 0 && inst > 0) return amt / inst;
    return 0;
  }, [amount, installments]);

  // Auto-calculate end date whenever start date or installment count changes
  useEffect(() => {
    const inst = Math.floor(parseIntegerInput(installments));
    if (!startDate || inst <= 0) {
      setEndDate("");
      return;
    }
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + inst);
    setEndDate(date.toISOString().split("T")[0]);
  }, [startDate, installments]);

  const handleClose = () => {
    setAmount("");
    setInstallments("12");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setPurpose("");
    setNotes("");
    setErrors({});
    onClose();
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!amount || parseMoneyInput(amount) <= 0) {
      newErrors.amount = t("payroll.employeeLoans.validation.amountInvalid", {
        defaultValue: "المبلغ غير صحيح",
      });
    }

    const instNum = parseIntegerInput(installments);
    if (!installments || instNum <= 0 || !Number.isInteger(instNum)) {
      newErrors.installments = t(
        "payroll.employeeLoans.validation.installmentsInvalid",
        {
          defaultValue: "عدد الأقساط يجب أن يكون عدد صحيح أكبر من صفر",
        },
      );
    } else if (instNum > 120) {
      newErrors.installments = t(
        "payroll.employeeLoans.validation.installmentsMax",
        {
          defaultValue: "عدد الأقساط لا يتجاوز 120 قسط",
        },
      );
    }

    if (!startDate) {
      newErrors.startDate = t("payroll.employeeLoans.validation.startDate", {
        defaultValue: "تاريخ البداية مطلوب",
      });
    }

    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = t("payroll.employeeLoans.validation.endDate", {
        defaultValue: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية",
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const payload: CreateEmployeeLoanDto = {
        employeeId,
        amount: parseMoneyInput(amount),
        installments: parseIntegerInput(installments),
        startDate,
        endDate: endDate || undefined,
        purpose: purpose || undefined,
        notes: notes || undefined,
      };

      await createMutation.mutateAsync(payload);
      handleClose();
    } catch (error) {
      console.error("Failed to create loan:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {t("payroll.employeeLoans.addDialog.title", {
              defaultValue: "إضافة سلفة جديدة",
            })}
          </DialogTitle>
          <DialogDescription>
            {t("payroll.employeeLoans.addDialog.description", {
              defaultValue: "أضف سلفة جديدة للموظف",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loanAmount">
                {t("payroll.employeeLoans.fields.amount", {
                  defaultValue: "المبلغ",
                })}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="loanAmount"
                type="number"
                min="0"
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

            <div className="space-y-2">
              <Label htmlFor="loanInstallments">
                {t("payroll.employeeLoans.fields.installments", {
                  defaultValue: "عدد الأقساط",
                })}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="loanInstallments"
                type="number"
                min="1"
                step="1"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className={errors.installments ? "border-destructive" : ""}
              />
              {errors.installments && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.installments}
                </p>
              )}
            </div>
          </div>

          {/* Monthly Installment Calculation */}
          {installmentAmount > 0 && (
            <Alert className="bg-primary/5 border-primary/20">
              <Calculator className="h-4 w-4 text-primary" />
              <AlertDescription>
                <strong>
                  {t("payroll.employeeLoans.installmentAmount", {
                    defaultValue: "قيمة القسط الشهري",
                  })}
                  :
                </strong>{" "}
                <span className="font-semibold text-primary">
                  {formatCurrency(installmentAmount)}
                </span>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loanStartDate">
                {t("payroll.employeeLoans.fields.startDate", {
                  defaultValue: "تاريخ البداية",
                })}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="loanStartDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={errors.startDate ? "border-destructive" : ""}
              />
              {errors.startDate && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.startDate}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanEndDate">
                {t("payroll.employeeLoans.fields.endDate", {
                  defaultValue: "تاريخ الانتهاء",
                })}
                <span className="text-muted-foreground text-xs ms-1">
                  ({t("common.calculatedAuto", { defaultValue: "محسوب تلقائياً" })})
                </span>
              </Label>
              <Input
                id="loanEndDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={errors.endDate ? "border-destructive" : "bg-muted/40"}
              />
              {errors.endDate && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.endDate}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loanPurpose">
              {t("payroll.employeeLoans.fields.purpose", {
                defaultValue: "الغرض",
              })}{" "}
              <span className="text-muted-foreground text-xs">
                ({t("common.optional", { defaultValue: "اختياري" })})
              </span>
            </Label>
            <Input
              id="loanPurpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder={t(
                "payroll.employeeLoans.fields.purposePlaceholder",
                {
                  defaultValue: "مثال: ظرف طارئ",
                },
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loanNotes">
              {t("payroll.employeeLoans.fields.notes", {
                defaultValue: "ملاحظات",
              })}{" "}
              <span className="text-muted-foreground text-xs">
                ({t("common.optional", { defaultValue: "اختياري" })})
              </span>
            </Label>
            <Textarea
              id="loanNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            {t("common.actions.cancel", { defaultValue: "إلغاء" })}
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {t("common.actions.save", { defaultValue: "حفظ" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
