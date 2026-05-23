/**
 * Allowance Approval Dialog Component
 *
 * Dialog for approving or rejecting employee allowances with notes.
 *
 * Features:
 * - Approve/Reject actions
 * - Required approval notes
 * - Validation
 * - Loading states
 * - Error handling
 *
 * Business Logic:
 * - Approval notes are required for both approve/reject
 * - Once approved/rejected, allowance cannot be modified
 * - Approval updates approvedBy and approvedAt fields
 *
 * @component AllowanceApprovalDialog
 * @module Payroll
 */

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { CheckCircle, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import {
  AllowanceFrequencyBadge,
  MonthlyEquivalentDisplay,
} from "@/features/payroll/components/common";
import type { EmployeeAllowanceEntity } from "@/types/payroll.types";

/**
 * Validation Schema
 */
const approvalFormSchema = z.object({
  approvalNotes: z
    .string()
    .max(500, "ملاحظات الاعتماد يجب ألا تزيد عن 500 حرف"),
});

type ApprovalFormValues = z.infer<typeof approvalFormSchema>;

interface AllowanceApprovalDialogProps {
  allowance: EmployeeAllowanceEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: string, notes: string) => Promise<void>;
  onReject: (id: string, notes: string) => Promise<void>;
}

/**
 * AllowanceApprovalDialog Component
 * Handles approval/rejection of employee allowances
 */
export const AllowanceApprovalDialog = ({
  allowance,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: AllowanceApprovalDialogProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  /**
   * Initialize form
   */
  const form = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalFormSchema),
    defaultValues: {
      approvalNotes: "",
    },
  });

  /**
   * Handle approval - notes are optional
   */
  const handleApprove = async (values: ApprovalFormValues) => {
    if (!allowance) return;

    setAction("approve");
    setIsSubmitting(true);
    try {
      await onApprove(allowance.id, values.approvalNotes?.trim() || "");
      handleClose();
    } catch {
      // Error handled by caller
    } finally {
      setIsSubmitting(false);
      setAction(null);
    }
  };

  /**
   * Handle rejection - reason is required (min 3 chars)
   */
  const handleReject = async (values: ApprovalFormValues) => {
    if (!allowance) return;

    if (!values.approvalNotes || values.approvalNotes.trim().length < 3) {
      form.setError("approvalNotes", {
        message: "سبب الرفض يجب أن يكون على الأقل 3 أحرف",
      });
      return;
    }

    setAction("reject");
    setIsSubmitting(true);
    try {
      await onReject(allowance.id, values.approvalNotes);
      handleClose();
    } catch {
      // Error handled by caller
    } finally {
      setIsSubmitting(false);
      setAction(null);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    form.reset();
    setAction(null);
    onOpenChange(false);
  };

  if (!allowance) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {t("payroll.employeeAllowances.approval.title")}
          </DialogTitle>
          <DialogDescription>
            {t("payroll.employeeAllowances.approval.description")}
          </DialogDescription>
        </DialogHeader>

        {/* Allowance Details */}
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4">
            {/* Employee */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("payroll.employeeAllowances.approval.employee")}
              </p>
              <p className="text-base font-semibold">
                {allowance.employee
                  ? `${allowance.employee.firstName} ${allowance.employee.lastName}`
                  : allowance.employeeId}
              </p>
            </div>

            {/* Amount */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("payroll.employeeAllowances.approval.amount")}
              </p>
              <p className="text-base font-semibold">
                {allowance.amount.toLocaleString()}{" "}
                {t("payroll.common.currency")}
              </p>
            </div>

            {/* Frequency */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("payroll.employeeAllowances.approval.frequency")}
              </p>
              <div className="mt-1">
                <AllowanceFrequencyBadge frequency={allowance.frequency} />
              </div>
            </div>

            {/* Monthly Equivalent */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("payroll.employeeAllowances.approval.monthlyEquivalent")}
              </p>
              <MonthlyEquivalentDisplay
                amount={allowance.amount}
                frequency={allowance.frequency}
              />
            </div>

            {/* Date Range */}
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t("payroll.employeeAllowances.approval.dateRange")}
              </p>
              <p className="text-base">
                {new Date(allowance.effectiveFrom).toLocaleDateString()}
                {allowance.effectiveTo && (
                  <> → {new Date(allowance.effectiveTo).toLocaleDateString()}</>
                )}
              </p>
            </div>

            {/* Notes */}
            {allowance.notes && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("payroll.employeeAllowances.approval.requestNotes")}
                </p>
                <p className="text-sm text-foreground">{allowance.notes}</p>
              </div>
            )}

            {/* Current Status */}
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t("payroll.employeeAllowances.approval.currentStatus")}
              </p>
              <div className="mt-1">
                <Badge
                  variant={
                    allowance.status === "APPROVED"
                      ? "success"
                      : allowance.status === "REJECTED"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {t(
                    `payroll.employeeAllowances.status.${allowance.status}`
                  )}
                </Badge>
              </div>
            </div>
          </div>

          {/* Approval Form */}
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="approvalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("payroll.employeeAllowances.approval.notes")}{" "}
                      <span className="text-muted-foreground font-normal">(اختياري للاعتماد، مطلوب للرفض)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t(
                          "payroll.employeeAllowances.approval.notesPlaceholder"
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
            </form>
          </Form>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t("common.actions.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={form.handleSubmit(handleReject)}
            disabled={isSubmitting || allowance.status !== "PENDING"}
          >
            <XCircle className="h-4 w-4" />
            {action === "reject" && isSubmitting
              ? t("common.actions.submitting")
              : t("payroll.employeeAllowances.actions.reject")}
          </Button>
          <Button
            onClick={form.handleSubmit(handleApprove)}
            disabled={isSubmitting || allowance.status !== "PENDING"}
          >
            <CheckCircle className="h-4 w-4" />
            {action === "approve" && isSubmitting
              ? t("common.actions.submitting")
              : t("payroll.employeeAllowances.actions.approve")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
