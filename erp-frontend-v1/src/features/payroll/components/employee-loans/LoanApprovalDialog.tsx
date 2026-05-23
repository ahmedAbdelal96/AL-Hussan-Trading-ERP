/**
 * Loan Approval Dialog Component - Full Implementation
 *
 * Comprehensive dialog for approving/rejecting employee loan requests.
 *
 * Features:
 * - Display loan details (employee, amount, installments)
 * - Approve/Reject actions with required notes
 * - Approval notes validation (10-500 characters)
 * - Status badges
 * - Loading states
 * - Error handling
 * - Repayment schedule with status tracking
 *
 * Business Rules:
 * - Only pending loans can be approved/rejected
 * - Approval notes are mandatory
 * - Approved loans generate installment schedule
 * - Rejected loans require rejection reason
 *
 * @component LoanApprovalDialog
 * @module Payroll/EmployeeLoans
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import {
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import {
  useApproveEmployeeLoan,
  useRejectEmployeeLoan,
} from "@/hooks/useEmployeeLoans";
import { useLoanRepayments } from "@/hooks/useEmployeeDeductions";
import { LoanStatusBadge } from "@/features/payroll/components/common/LoanStatusBadge";
import type { EmployeeLoanEntity } from "@/types/payroll.types";
import { LoanStatus } from "@/types/payroll.types";

/**
 * Form schema with validation
 */
const approvalNotesSchema = z.object({
  approvalNotes: z
    .string()
    .max(500, "ملاحظات الاعتماد يجب ألا تزيد عن 500 حرف"),
});

type FormValues = z.infer<typeof approvalNotesSchema>;

interface LoanApprovalDialogProps {
  loan: EmployeeLoanEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * LoanApprovalDialog Component
 */
export const LoanApprovalDialog = ({
  loan,
  open,
  onOpenChange,
}: LoanApprovalDialogProps) => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [showAllSchedule, setShowAllSchedule] = useState(false);

  const approveMutation = useApproveEmployeeLoan();
  const rejectMutation = useRejectEmployeeLoan();
  const { data: repaymentsResponse } = useLoanRepayments(loan?.id, open);
  const repayments = repaymentsResponse?.data ?? [];

  /**
   * Initialize form
   */
  const form = useForm<FormValues>({
    resolver: zodResolver(approvalNotesSchema),
    defaultValues: {
      approvalNotes: "",
    },
  });

  /**
   * Reset form when dialog closes
   */
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setAction(null);
      setIsSubmitting(false);
    }
    onOpenChange(newOpen);
  };

  /**
   * Handle approve - notes are optional
   */
  const handleApprove = async (values: FormValues) => {
    if (!loan) return;

    try {
      setIsSubmitting(true);
      setAction("approve");

      await approveMutation.mutateAsync({
        id: loan.id,
        data: {
          notes: values.approvalNotes?.trim() || undefined,
          rowVersion: loan.rowVersion,
        },
      });

      handleOpenChange(false);
    } catch {
      // Error handled by mutation hook
    } finally {
      setIsSubmitting(false);
      setAction(null);
    }
  };

  /**
   * Handle reject - reason is required (min 3 chars)
   */
  const handleReject = async (values: FormValues) => {
    if (!loan) return;

    if (!values.approvalNotes || values.approvalNotes.trim().length < 3) {
      form.setError("approvalNotes", {
        message: "سبب الرفض يجب أن يكون على الأقل 3 أحرف",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setAction("reject");

      await rejectMutation.mutateAsync({
        id: loan.id,
        data: {
          rejectedReason: values.approvalNotes,
          rowVersion: loan.rowVersion,
        },
      });

      handleOpenChange(false);
    } catch {
      // Error handled by mutation hook
    } finally {
      setIsSubmitting(false);
      setAction(null);
    }
  };

  if (!loan) return null;

  const isPending = loan.status === LoanStatus.PENDING;
  const paidAmount = Math.max(loan.amount - loan.remainingAmount, 0);
  const installmentAmount = loan.installmentAmount || (loan.amount / loan.installments);
  const employeeLabel = loan.employee
    ? `${loan.employee.firstName} ${loan.employee.lastName}${loan.employee.employeeNumber ? ` - #${loan.employee.employeeNumber}` : ""}`
    : loan.employeeId;

  const formatDate = (value?: string | Date | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US");
  };

  const normalizeDate = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate());

  const schedule = loan.startDate
    ? Array.from({ length: loan.installments }, (_, index) => {
        const dueDate = new Date(loan.startDate as Date | string);
        dueDate.setMonth(dueDate.getMonth() + index);

        const payment = repayments[index];
        const paidDate = payment?.deductionDate
          ? new Date(payment.deductionDate)
          : undefined;

        let status: "early" | "onTime" | "late" | "unpaid" = "unpaid";
        if (paidDate) {
          const due = normalizeDate(dueDate).getTime();
          const paid = normalizeDate(paidDate).getTime();
          status = paid < due ? "early" : paid > due ? "late" : "onTime";
        }

        return {
          index: index + 1,
          dueDate,
          paidDate,
          status,
        };
      })
    : [];

  const visibleSchedule = showAllSchedule ? schedule : schedule.slice(0, 6);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("payroll.employeeLoans.approval.title")}
            <LoanStatusBadge status={loan.status} />
          </DialogTitle>
          <DialogDescription>
            {isPending
              ? t("payroll.employeeLoans.approval.description")
              : t("payroll.employeeLoans.approval.viewOnly")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
            {/* Loan Details */}
            <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Employee */}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("payroll.employeeLoans.fields.employee")}
                  </Label>
                  <div className="font-medium">{employeeLabel}</div>
                </div>

                {/* Status */}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("payroll.employeeLoans.fields.status")}
                  </Label>
                  <div>
                    <LoanStatusBadge status={loan.status} />
                  </div>
                </div>

                {/* Loan Amount */}
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {t("payroll.employeeLoans.fields.totalAmount")}
                  </Label>
                  <div className="font-semibold text-lg">
                    {loan.amount.toLocaleString()}{" "}
                    {t("payroll.common.currency")}
                  </div>
                </div>

                {/* Number of Installments */}
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t("payroll.employeeLoans.fields.installments")}
                  </Label>
                  <div className="font-medium">
                    {loan.installments}{" "}
                    {t("payroll.employeeLoans.fields.months")}
                  </div>
                </div>

                {/* Monthly Installment */}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("payroll.employeeLoans.fields.monthlyInstallment")}
                  </Label>
                  <div className="font-semibold text-primary-main">
                    {installmentAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {t("payroll.common.currency")}
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="grid grid-cols-2 gap-4 border-t pt-3 mt-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("payroll.employeeLoans.form.calculated.paidAmount")}
                  </Label>
                  <div className="font-medium text-success-main">
                    {paidAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {t("payroll.common.currency")}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("payroll.employeeLoans.form.calculated.remainingAmount")}
                  </Label>
                  <div className="font-medium text-orange-600">
                    {loan.remainingAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {t("payroll.common.currency")}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("payroll.employeeLoans.form.fields.startDate")}
                  </Label>
                  <div className="font-medium">
                    {formatDate(loan.startDate)}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("payroll.employeeLoans.form.fields.endDate")}
                  </Label>
                  <div className="font-medium">{formatDate(loan.endDate)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                <div>
                  <span className="font-medium">{loan.paidInstallments}</span>
                  <span className="mx-1">/</span>
                  <span>{loan.installments}</span>
                  <span className="ml-1">
                    {t("payroll.employeeLoans.table.installments")}
                  </span>
                </div>
              </div>

              {schedule.length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      {t("payroll.employeeLoans.payment.scheduleTitle")}
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsScheduleOpen((value) => !value)}
                    >
                      {isScheduleOpen
                        ? t("payroll.employeeLoans.payment.scheduleToggleHide")
                        : t("payroll.employeeLoans.payment.scheduleToggleShow")}
                    </Button>
                  </div>

                  {isScheduleOpen && (
                    <div className="mt-2">
                      <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                        <div className="font-medium text-foreground">
                          {t("payroll.employeeLoans.payment.installment")}
                        </div>
                        <div className="font-medium text-foreground">
                          {t("payroll.employeeLoans.payment.dueDate")}
                        </div>
                        <div className="font-medium text-foreground">
                          {t("payroll.employeeLoans.payment.paidDate")}
                        </div>
                        <div className="font-medium text-foreground">
                          {t("payroll.employeeLoans.payment.paymentStatus")}
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-muted-foreground max-h-52 overflow-auto rounded-md border border-muted/60 p-2">
                        {visibleSchedule.map((item) => (
                          <div key={item.index} className="contents">
                            <div>{item.index}</div>
                            <div>{formatDate(item.dueDate)}</div>
                            <div>
                              {item.paidDate ? formatDate(item.paidDate) : "-"}
                            </div>
                            <div>
                              {t(
                                `payroll.employeeLoans.payment.status.${item.status}`,
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {schedule.length > 6 && (
                        <div className="mt-2 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setShowAllSchedule((value) => !value)
                            }
                          >
                            {showAllSchedule
                              ? t(
                                  "payroll.employeeLoans.payment.scheduleShowLess",
                                )
                              : t(
                                  "payroll.employeeLoans.payment.scheduleShowAll",
                                )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Purpose */}
              {loan.purpose && (
                <div className="border-t pt-3 mt-3">
                  <Label className="text-xs text-muted-foreground">
                    {t("payroll.employeeLoans.fields.purpose")}
                  </Label>
                  <p className="text-sm mt-1">{loan.purpose}</p>
                </div>
              )}

              {/* Notes */}
              {loan.notes && (
                <div className="border-t pt-3 mt-3">
                  <Label className="text-xs text-muted-foreground">
                    {t("payroll.employeeLoans.fields.notes")}
                  </Label>
                  <p className="text-sm mt-1">{loan.notes}</p>
                </div>
              )}
            </div>

            {/* Approval Notes */}
            {isPending && (
              <FormField
                control={form.control}
                name="approvalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("payroll.employeeLoans.approval.notes")}{" "}
                      <span className="text-muted-foreground font-normal">(اختياري للاعتماد، مطلوب للرفض)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t(
                          "payroll.employeeLoans.approval.notesPlaceholder",
                        )}
                        rows={4}
                        disabled={isSubmitting}
                        maxLength={500}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Rejection Reason (View Mode) */}
            {loan.status === LoanStatus.REJECTED && loan.rejectedReason && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-destructive">
                  {t("payroll.employeeLoans.approval.rejectionReason")}
                </Label>
                <div className="rounded-lg border border-destructive/50 p-3 bg-destructive/5">
                  <p className="text-sm">{loan.rejectedReason}</p>
                </div>
              </div>
            )}
          </form>
        </Form>

        <DialogFooter>
          {isPending ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                {t("payroll.common.actions.cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={form.handleSubmit(handleReject)}
                disabled={isSubmitting}
              >
                {isSubmitting && action === "reject" ? (
                  <>{t("payroll.common.loading")}</>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    {t("payroll.common.actions.reject")}
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit(handleApprove)}
                disabled={isSubmitting}
              >
                {isSubmitting && action === "approve" ? (
                  <>{t("payroll.common.loading")}</>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t("payroll.common.actions.approve")}
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t("payroll.common.actions.close")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
