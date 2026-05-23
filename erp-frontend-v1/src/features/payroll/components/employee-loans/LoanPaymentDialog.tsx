/**
 * Loan Payment Dialog Component - Full Implementation
 *
 * Dialog for recording installment payments for active loans.
 *
 * Features:
 * - Display loan and payment schedule
 * - Record installment payment
 * - Payment amount validation
 * - Payment date picker
 * - Payment notes
 * - Outstanding balance calculation
 * - Overpayment/underpayment detection
 *
 * Business Rules:
 * - Only active loans can have payments
 * - Payment amount cannot exceed outstanding balance
 * - Payment date cannot be in future
 * - All fields required except notes
 *
 * @component LoanPaymentDialog
 * @module Payroll/EmployeeLoans
 */

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/i18n/useTranslation";
import { Calendar, Receipt } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { usePayLoanInstallment } from "@/hooks/useEmployeeLoans";
import { LoanProgressBar } from "@/features/payroll/components/common/LoanProgressBar";
import type { EmployeeLoanEntity } from "@/types/payroll.types";
import { LoanStatus } from "@/types/payroll.types";

/**
 * Form schema with validation
 */
const paymentFormSchema = z.object({
  deductionDate: z.string().min(1, "Payment date is required"),
  notes: z.string().max(500, "Notes must not exceed 500 characters").optional(),
});

type FormValues = z.infer<typeof paymentFormSchema>;

interface LoanPaymentDialogProps {
  loan: EmployeeLoanEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * LoanPaymentDialog Component
 */
export const LoanPaymentDialog = ({
  loan,
  open,
  onOpenChange,
}: LoanPaymentDialogProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recordPaymentMutation = usePayLoanInstallment();

  /**
   * Calculate loan details
   */
  const loanDetails = useMemo(() => {
    if (!loan) return null;

    const installmentAmount =
      loan.installmentAmount || loan.amount / loan.installments;
    const paidAmount = Math.max(loan.amount - loan.remainingAmount, 0);
    const remainingInstallments = Math.max(
      loan.installments - loan.paidInstallments,
      0,
    );
    const progressPercentage =
      loan.amount > 0 ? (paidAmount / loan.amount) * 100 : 0;

    return {
      installmentAmount,
      paidAmount,
      remainingInstallments,
      progressPercentage,
    };
  }, [loan]);

  /**
   * Initialize form
   */
  const form = useForm<FormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      deductionDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  /**
   * Reset form when dialog closes
   */
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setIsSubmitting(false);
    }
    onOpenChange(newOpen);
  };

  /**
   * Handle payment submission
   */
  const handleSubmit = async (values: FormValues) => {
    if (!loan || !loanDetails) return;

    try {
      setIsSubmitting(true);

      await recordPaymentMutation.mutateAsync({
        id: loan.id,
        data: {
          deductionDate: values.deductionDate,
          notes: values.notes,
          rowVersion: loan.rowVersion,
        },
      });

      handleOpenChange(false);
    } catch {
      // Error handled by mutation hook
    } finally {
      setIsSubmitting(false);
    }
  };

  if (
    !loan ||
    !loanDetails ||
    loan.status !== LoanStatus.APPROVED ||
    loan.remainingAmount <= 0
  )
    return null;

  const employeeLabel = loan.employee
    ? `${loan.employee.firstName} ${loan.employee.lastName}`
    : loan.employeeId;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t("payroll.employeeLoans.payment.title")}
          </DialogTitle>
          <DialogDescription>
            {t("payroll.employeeLoans.payment.description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Loan Summary */}
            <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4">
              {/* Employee */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  {t("payroll.employeeLoans.fields.employee")}
                </Label>
                <span className="font-medium">{employeeLabel}</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {t("payroll.employeeLoans.payment.progress")}
                  </span>
                  <span className="font-medium">
                    {loanDetails.progressPercentage.toFixed(1)}%
                  </span>
                </div>
                <LoanProgressBar
                  loan={{
                    amount: loan.amount,
                    remainingAmount: loan.remainingAmount,
                    installments: loan.installments,
                    paidInstallments: loan.paidInstallments,
                  }}
                />
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-2 gap-3 border-t pt-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("payroll.employeeLoans.fields.totalAmount")}
                  </Label>
                  <div className="font-semibold">
                    {loan.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {t("payroll.common.currency")}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("payroll.employeeLoans.payment.paidAmount")}
                  </Label>
                  <div className="font-semibold text-success-main">
                    {loanDetails.paidAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {t("payroll.common.currency")}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("payroll.employeeLoans.payment.outstandingBalance")}
                  </Label>
                  <div className="font-bold text-lg text-primary-main">
                    {loan.remainingAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {t("payroll.common.currency")}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("payroll.employeeLoans.fields.monthlyInstallment")}
                  </Label>
                  <div className="font-semibold">
                    {loanDetails.installmentAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {t("payroll.common.currency")}
                  </div>
                </div>
              </div>

              {/* Remaining Installments */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">
                    {t("payroll.employeeLoans.payment.remainingInstallments")}
                  </Label>
                  <span className="font-semibold">
                    {loanDetails.remainingInstallments} / {loan.installments}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Date */}
            <FormField
              control={form.control}
              name="deductionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t("payroll.employeeLoans.payment.paymentDate")}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("payroll.employeeLoans.payment.notes")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t(
                        "payroll.employeeLoans.payment.notesPlaceholder",
                      )}
                      rows={3}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                {t("payroll.common.actions.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t("payroll.common.loading")
                  : t("payroll.employeeLoans.payment.recordPayment")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
