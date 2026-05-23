/**
 * Generic Rejection Dialog Component
 *
 * A reusable dialog for rejection workflows across the application.
 * Follows DRY principle and provides consistent UX for all rejection scenarios.
 *
 * Features:
 * - Generic typing for any entity type
 * - Required reason field with validation
 * - Customizable content rendering
 * - Loading and error states
 * - Accessible keyboard navigation
 * - RTL support for Arabic
 * - Warning styling to indicate negative action
 *
 * Usage Example:
 * ```tsx
 * <RejectionDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Reject Project Cost"
 *   item={selectedCost}
 *   onReject={handleReject}
 *   isLoading={mutation.isPending}
 *   renderContent={(cost) => (
 *     <div>
 *       <p>Amount: {cost.amount}</p>
 *       <p>Project: {cost.projectName}</p>
 *     </div>
 *   )}
 * />
 * ```
 *
 * @component RejectionDialog
 * @template T - The entity type being rejected
 */

import { useState, ReactNode } from "react";
import { XCircle, AlertTriangle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "@/i18n/useTranslation";

/**
 * Props for the RejectionDialog component
 */
interface RejectionDialogProps<T> {
  /** Controls dialog visibility */
  open: boolean;

  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;

  /** Dialog title */
  title: string;

  /** Optional dialog description */
  description?: string;

  /** The item being rejected */
  item: T | null;

  /** Callback when rejection is confirmed */
  onReject: (item: T, reason: string) => void | Promise<void>;

  /** Whether the rejection is in progress */
  isLoading?: boolean;

  /** Optional error message to display */
  error?: string | null;

  /** Render function for item details */
  renderContent: (item: T) => ReactNode;

  /** Placeholder for reason field */
  reasonPlaceholder?: string;

  /** Label for reason field */
  reasonLabel?: string;

  /** Confirm button text */
  confirmText?: string;

  /** Cancel button text */
  cancelText?: string;

  /** Minimum reason length */
  minReasonLength?: number;

  /** Maximum reason length */
  maxReasonLength?: number;

  /** Warning message about rejection consequences */
  warningMessage?: string;
}

/**
 * Generic Rejection Dialog Component
 *
 * Provides a consistent rejection interface across the application.
 * Handles validation, loading states, and error display.
 * Reason is always required to maintain audit trail.
 */
export function RejectionDialog<T>({
  open,
  onOpenChange,
  title,
  description,
  item,
  onReject,
  isLoading = false,
  error = null,
  renderContent,
  reasonPlaceholder,
  reasonLabel,
  confirmText,
  cancelText,
  minReasonLength = 10,
  maxReasonLength = 500,
  warningMessage,
}: RejectionDialogProps<T>) {
  const { t } = useTranslation();

  // Local state for rejection reason
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  /**
   * Validate rejection reason
   * Reason is always required for audit trail
   * Returns true if validation passes
   */
  const validateReason = (): boolean => {
    // Clear previous errors
    setReasonError(null);

    // Check if empty
    if (!reason.trim()) {
      setReasonError(t("common.validation.required"));
      return false;
    }

    // Check minimum length
    if (reason.trim().length < minReasonLength) {
      setReasonError(
        t("common.validation.minLength", { count: minReasonLength }),
      );
      return false;
    }

    // Check maximum length
    if (reason.length > maxReasonLength) {
      setReasonError(
        t("common.validation.maxLength", { count: maxReasonLength }),
      );
      return false;
    }

    return true;
  };

  /**
   * Handle rejection confirmation
   * Validates reason and calls onReject callback
   */
  const handleConfirm = async () => {
    if (!item) return;

    // Validate reason (always required)
    if (!validateReason()) {
      return;
    }

    // Call rejection callback
    await onReject(item, reason.trim());

    // Reset state
    setReason("");
    setReasonError(null);
  };

  /**
   * Handle dialog close
   * Resets state on cancel
   */
  const handleClose = () => {
    if (isLoading) return; // Prevent closing during loading

    setReason("");
    setReasonError(null);
    onOpenChange(false);
  };

  // Don't render if no item
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Warning Message */}
          {warningMessage && (
            <Alert variant="warning" className="border-warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{warningMessage}</AlertDescription>
            </Alert>
          )}

          {/* Item Details - Rendered by parent */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4">
            {renderContent(item)}
          </div>

          {/* Rejection Reason Field - Always Required */}
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">
              {reasonLabel || t("common.rejectionReason")}
              <span className="text-destructive ms-1">*</span>
            </Label>
            <Textarea
              id="rejection-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setReasonError(null); // Clear error on change
              }}
              placeholder={
                reasonPlaceholder || t("common.rejectionReasonPlaceholder")
              }
              rows={4}
              maxLength={maxReasonLength}
              disabled={isLoading}
              className={reasonError ? "border-destructive" : ""}
              autoFocus // Focus on reason field for quick input
            />
            {/* Character count and validation error */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {reasonError ? (
                  <span className="text-destructive">{reasonError}</span>
                ) : (
                  <span>
                    {t("common.minLength")}: {minReasonLength}
                  </span>
                )}
              </span>
              <span>
                {reason.length} / {maxReasonLength}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {cancelText || t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin me-2">⏳</span>
                {t("common.processing")}
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 me-2" />
                {confirmText || t("common.reject")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
