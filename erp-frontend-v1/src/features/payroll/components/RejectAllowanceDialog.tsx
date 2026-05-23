/**
 * Reject Allowance Dialog Component
 *
 * Dialog for rejecting an employee allowance with a required reason.
 * Used in approval workflow to provide feedback for rejection.
 *
 * Features:
 * - Required rejection reason field
 * - Validation (minimum length)
 * - Loading states
 * - Accessibility features
 *
 * @component RejectAllowanceDialog
 * @module Payroll/Allowances
 */

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
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

interface RejectAllowanceDialogProps {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;

  /**
   * Callback to close the dialog
   */
  onClose: () => void;

  /**
   * Callback when reject is confirmed with reason
   */
  onReject: (reason: string) => void;

  /**
   * Whether the rejection is in progress
   */
  isLoading?: boolean;
}

/**
 * RejectAllowanceDialog Component
 */
export const RejectAllowanceDialog = ({
  isOpen,
  onClose,
  onReject,
  isLoading = false,
}: RejectAllowanceDialogProps) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  /**
   * Handle dialog close - reset state
   */
  const handleClose = () => {
    if (!isLoading) {
      setReason("");
      setError("");
      onClose();
    }
  };

  /**
   * Handle rejection submission with validation
   */
  const handleReject = () => {
    // Validate reason
    if (!reason.trim()) {
      setError(
        t("payroll.employeeAllowances.approval.rejectionReasonRequired", {
          defaultValue: "Rejection reason is required",
        }),
      );
      return;
    }

    if (reason.trim().length < 10) {
      setError(
        t("payroll.employeeAllowances.approval.rejectionReasonMinLength", {
          defaultValue: "Rejection reason must be at least 10 characters",
        }),
      );
      return;
    }

    // Clear error and submit
    setError("");
    onReject(reason.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("payroll.employeeAllowances.approval.rejectTitle", {
              defaultValue: "Reject Allowance",
            })}
          </DialogTitle>
          <DialogDescription>
            {t("payroll.employeeAllowances.approval.rejectDescription", {
              defaultValue: "Enter rejection reason",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">
              {t("payroll.employeeAllowances.approval.rejectionReason", {
                defaultValue: "Rejection Reason",
              })}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder={t(
                "payroll.employeeAllowances.approval.rejectionReasonPlaceholder",
                {
                  defaultValue: "Enter reason for rejection",
                },
              )}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              disabled={isLoading}
              className="min-h-[100px] resize-none"
              aria-invalid={!!error}
              aria-describedby={error ? "rejection-reason-error" : undefined}
            />
            {error && (
              <p
                id="rejection-reason-error"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            type="button"
          >
            {t("common.actions.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isLoading}
            type="button"
          >
            {isLoading
              ? t("common.loading", { defaultValue: "Loading..." })
              : t("payroll.employeeAllowances.reject", {
                  defaultValue: "Reject",
                })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
