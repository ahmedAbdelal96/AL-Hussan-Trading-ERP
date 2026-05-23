/**
 * Generic Approval Dialog Component
 *
 * A reusable dialog for approval workflows across the application.
 * Follows DRY principle and provides consistent UX for all approval scenarios.
 *
 * Features:
 * - Generic typing for any entity type
 * - Optional notes field with validation
 * - Customizable content rendering
 * - Loading and error states
 * - Accessible keyboard navigation
 * - RTL support for Arabic
 *
 * Usage Example:
 * ```tsx
 * <ApprovalDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Approve Project Cost"
 *   item={selectedCost}
 *   onApprove={handleApprove}
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
 * @component ApprovalDialog
 * @template T - The entity type being approved
 */

import { useState, ReactNode } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
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
 * Props for the ApprovalDialog component
 */
interface ApprovalDialogProps<T> {
  /** Controls dialog visibility */
  open: boolean;

  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;

  /** Dialog title */
  title: string;

  /** Optional dialog description */
  description?: string;

  /** The item being approved */
  item: T | null;

  /** Callback when approval is confirmed */
  onApprove: (item: T, notes?: string) => void | Promise<void>;

  /** Whether the approval is in progress */
  isLoading?: boolean;

  /** Optional error message to display */
  error?: string | null;

  /** Render function for item details */
  renderContent: (item: T) => ReactNode;

  /** Whether notes field is required */
  notesRequired?: boolean;

  /** Placeholder for notes field */
  notesPlaceholder?: string;

  /** Label for notes field */
  notesLabel?: string;

  /** Confirm button text */
  confirmText?: string;

  /** Cancel button text */
  cancelText?: string;

  /** Minimum notes length (if required) */
  minNotesLength?: number;

  /** Maximum notes length */
  maxNotesLength?: number;
}

/**
 * Generic Approval Dialog Component
 *
 * Provides a consistent approval interface across the application.
 * Handles validation, loading states, and error display.
 */
export function ApprovalDialog<T>({
  open,
  onOpenChange,
  title,
  description,
  item,
  onApprove,
  isLoading = false,
  error = null,
  renderContent,
  notesRequired = false,
  notesPlaceholder,
  notesLabel,
  confirmText,
  cancelText,
  minNotesLength = 0,
  maxNotesLength = 500,
}: ApprovalDialogProps<T>) {
  const { t } = useTranslation();

  // Local state for notes
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState<string | null>(null);

  /**
   * Validate notes field
   * Returns true if validation passes
   */
  const validateNotes = (): boolean => {
    // Clear previous errors
    setNotesError(null);

    // Check if required but empty
    if (notesRequired && !notes.trim()) {
      setNotesError(t("common.validation.required"));
      return false;
    }

    // Check minimum length
    if (notes.trim() && notes.trim().length < minNotesLength) {
      setNotesError(
        t("common.validation.minLength", { count: minNotesLength }),
      );
      return false;
    }

    // Check maximum length
    if (notes.length > maxNotesLength) {
      setNotesError(
        t("common.validation.maxLength", { count: maxNotesLength }),
      );
      return false;
    }

    return true;
  };

  /**
   * Handle approval confirmation
   * Validates notes and calls onApprove callback
   */
  const handleConfirm = async () => {
    if (!item) return;

    // Validate notes if provided or required
    if (!validateNotes()) {
      return;
    }

    // Call approval callback
    await onApprove(item, notes.trim() || undefined);

    // Reset state
    setNotes("");
    setNotesError(null);
  };

  /**
   * Handle dialog close
   * Resets state on cancel
   */
  const handleClose = () => {
    if (isLoading) return; // Prevent closing during loading

    setNotes("");
    setNotesError(null);
    onOpenChange(false);
  };

  // Don't render if no item
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Item Details - Rendered by parent */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4">
            {renderContent(item)}
          </div>

          {/* Notes Field */}
          <div className="space-y-2">
            <Label htmlFor="approval-notes">
              {notesLabel || t("common.notes")}
              {notesRequired && (
                <span className="text-destructive ms-1">*</span>
              )}
            </Label>
            <Textarea
              id="approval-notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setNotesError(null); // Clear error on change
              }}
              placeholder={notesPlaceholder || t("common.notesPlaceholder")}
              rows={3}
              maxLength={maxNotesLength}
              disabled={isLoading}
              className={notesError ? "border-destructive" : ""}
            />
            {/* Character count */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {notesError && (
                  <span className="text-destructive">{notesError}</span>
                )}
              </span>
              <span>
                {notes.length} / {maxNotesLength}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {cancelText || t("common.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-success hover:bg-success/90"
          >
            {isLoading ? (
              <>
                <span className="animate-spin me-2">⏳</span>
                {t("common.processing")}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 me-2" />
                {confirmText || t("common.approve")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
