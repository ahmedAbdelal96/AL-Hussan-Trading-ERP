/**
 * Deduction Approval Dialog Component
 *
 * Dialog for approving or rejecting employee deductions that require manual approval.
 *
 * Features:
 * - Approve/Reject actions
 * - Required approval notes
 * - Display deduction details (employee, type, amount, reason)
 * - Validation
 * - Loading states
 * - Error handling
 *
 * Business Logic:
 * - Only PENALTY, ABSENCE, ADVANCE_DEDUCTION, OTHER require approval
 * - TAX, INSURANCE, LOAN_REPAYMENT are auto-approved (no dialog)
 * - Approval notes are required for both approve/reject
 * - Once approved/rejected, deduction is final
 * - Requires PAYROLL_APPROVE permission
 *
 * @component DeductionApprovalDialog
 * @module Payroll/EmployeeDeductions
 */

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { CheckCircle, XCircle, AlertTriangle, DollarSign } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import type {
  EmployeeDeductionEntity,
  DeductionType,
} from "@/types/payroll.types";

/**
 * Validation Schema
 */
const approvalFormSchema = z.object({
  approvalNotes: z.string().max(500, "ملاحظات الاعتماد يجب ألا تزيد عن 500 حرف"),
});

type ApprovalFormValues = z.infer<typeof approvalFormSchema>;

interface DeductionApprovalDialogProps {
  deduction: EmployeeDeductionEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (notes?: string) => Promise<void>;
  onReject: (rejectionReason: string) => Promise<void>;
}

/**
 * Get deduction type label
 */
const getDeductionTypeLabel = (type: DeductionType): string => {
  const typeMap: Record<DeductionType, string> = {
    TAX: "payroll.employeeDeductions.deductionType.TAX",
    INSURANCE: "payroll.employeeDeductions.deductionType.INSURANCE",
    LOAN_REPAYMENT: "payroll.employeeDeductions.deductionType.LOAN_REPAYMENT",
    PENALTY: "payroll.employeeDeductions.deductionType.PENALTY",
    ADVANCE_DEDUCTION:
      "payroll.employeeDeductions.deductionType.ADVANCE_DEDUCTION",
    ABSENCE: "payroll.employeeDeductions.deductionType.ABSENCE",
    OTHER: "payroll.employeeDeductions.deductionType.OTHER",
  };
  return typeMap[type] || type;
};

/**
 * Get deduction type badge variant
 */
const getDeductionTypeBadgeVariant = (
  type: DeductionType,
): "destructive" | "secondary" | "warning" => {
  switch (type) {
    case "PENALTY":
    case "ABSENCE":
      return "destructive";
    case "ADVANCE_DEDUCTION":
    case "OTHER":
      return "warning";
    default:
      return "secondary";
  }
};

/**
 * DeductionApprovalDialog Component
 * Handles approval/rejection of employee deductions
 */
export const DeductionApprovalDialog = ({
  deduction,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: DeductionApprovalDialogProps) => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
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
    if (!deduction) return;

    setAction("approve");
    setIsSubmitting(true);
    try {
      await onApprove(values.approvalNotes?.trim() || undefined);
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
    if (!deduction) return;

    if (!values.approvalNotes || values.approvalNotes.trim().length < 3) {
      form.setError("approvalNotes", {
        message: "سبب الرفض يجب أن يكون على الأقل 3 أحرف",
      });
      return;
    }

    setAction("reject");
    setIsSubmitting(true);
    try {
      await onReject(values.approvalNotes);
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
    onClose();
  };

  if (!deduction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t("payroll.employeeDeductions.approval.title")}
          </DialogTitle>
          <DialogDescription>
            {t("payroll.employeeDeductions.approval.description")}
          </DialogDescription>
        </DialogHeader>

        {/* Deduction Details */}
        <div className="space-y-4 py-4">
          {/* Alert */}
          <Alert>
            <AlertDescription>
              {t("payroll.employeeDeductions.approval.info")}
            </AlertDescription>
          </Alert>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            {/* Employee */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {t("payroll.employeeDeductions.form.fields.employeeId")}
              </p>
              <p className="font-semibold">
                {deduction.employee
                  ? `${deduction.employee.firstName} ${deduction.employee.lastName}`
                  : deduction.employeeId}
              </p>
            </div>

            {/* Deduction Type */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {t("payroll.employeeDeductions.form.fields.deductionType")}
              </p>
              <Badge
                variant={getDeductionTypeBadgeVariant(deduction.deductionType)}
              >
                {t(getDeductionTypeLabel(deduction.deductionType))}
              </Badge>
            </div>

            {/* Amount */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {t("payroll.employeeDeductions.form.fields.amount")}
              </p>
              <p className="text-lg font-bold text-destructive flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {deduction.amount.toLocaleString()}{" "}
                {t("payroll.common.currency")}
              </p>
            </div>

            {/* Deduction Date */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {t("payroll.employeeDeductions.form.fields.deductionDate")}
              </p>
              <p className="font-medium">
                {new Date(deduction.deductionDate).toLocaleDateString(
                  language === "ar" ? "ar-EG" : "en-US",
                )}
              </p>
            </div>

            {/* Reason (if exists) */}
            {deduction.reason && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("payroll.employeeDeductions.form.fields.reason")}
                </p>
                <p className="text-sm bg-background p-2 rounded border">
                  {deduction.reason}
                </p>
              </div>
            )}

            {/* Notes (if exists) */}
            {deduction.notes && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("payroll.employeeDeductions.form.fields.notes")}
                </p>
                <p className="text-sm bg-background p-2 rounded border">
                  {deduction.notes}
                </p>
              </div>
            )}
          </div>

          {/* Approval Form */}
          <Form {...form}>
            <FormField
              control={form.control}
              name="approvalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("payroll.employeeDeductions.approval.notesLabel")}{" "}
                    <span className="text-muted-foreground font-normal">(اختياري للاعتماد، مطلوب للرفض)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t(
                        "payroll.employeeDeductions.approval.notesPlaceholder",
                      )}
                      rows={4}
                      disabled={isSubmitting}
                      className="resize-none"
                      maxLength={500}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t("payroll.common.actions.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={form.handleSubmit(handleReject)}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting && action === "reject" ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {t("payroll.employeeDeductions.approval.reject")}
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={form.handleSubmit(handleApprove)}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting && action === "approve" ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {t("payroll.employeeDeductions.approval.approve")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeductionApprovalDialog;
