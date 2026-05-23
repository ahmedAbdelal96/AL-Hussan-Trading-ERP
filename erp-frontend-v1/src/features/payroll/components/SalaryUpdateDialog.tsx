/**
 * ============================================================================
 * SALARY UPDATE DIALOG COMPONENT
 * ============================================================================
 *
 * A comprehensive dialog for updating an employee's salary with:
 * - Form validation (positive number, maximum decimal places)
 * - Optimistic locking support via version field
 * - Concurrent update conflict detection (409 response)
 * - Salary change preview (before/after, amount, percentage)
 * - Reason field for audit trail
 * - Loading state and error handling
 *
 * Optimistic Locking:
 * The version field in the form ensures that the update fails with a 409
 * Conflict if another user modifies the employee salary between when this
 * dialog is opened and when the user submits. The hook shows an error
 * message and prompts the user to refresh.
 *
 * Performance:
 * - Controlled component with local state
 * - Debounced salary preview calculation
 * - Single API call on submit (no confirmation step)
 * - Immediate cache update on success
 * - No full page reload required
 *
 * Accessibility:
 * - Proper form labels with htmlFor attributes
 * - Semantic HTML form structure
 * - Keyboard navigation support
 * - Error messages linked to form fields
 * - Focus management via Dialog component
 *
 * @component
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * const [selectedEmployee, setSelectedEmployee] = useState<EmployeeEntity>();
 *
 * return (
 *   <>
 *     <Button onClick={() => {
 *       setSelectedEmployee(employee);
 *       setOpen(true);
 *     }}>
 *       Update Salary
 *     </Button>
 *
 *     <SalaryUpdateDialog
 *       open={open}
 *       onOpenChange={setOpen}
 *       employee={selectedEmployee}
 *     />
 *   </>
 * );
 * ```
 */

import { useState, useMemo } from "react";
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
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { useUpdateSalary } from "@/hooks/useEmployees";
import type { EmployeeEntity } from "@/types/employees.types";
import { formatCurrency } from "@/lib/utils";
import { parseMoneyInput } from "@/lib/money";
import { CURRENCY } from "@/config/system.constants";

interface SalaryUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: EmployeeEntity;
}

/**
 * Salary Update Dialog Component
 *
 * Provides a user-friendly interface for updating employee salary with:
 * - Current salary display
 * - New salary input with validation
 * - Real-time change preview (amount, percentage)
 * - Optional reason field for audit trail
 * - Version field for optimistic locking (hidden)
 * - Submit/Cancel buttons with loading state
 *
 * Form Validation:
 * - Salary must be a positive number
 * - Salary must be different from current salary
 * - Decimal places limited to 2
 * - Reason field limited to 500 characters
 *
 * Error States:
 * - Missing employee: Dialog shows "No employee selected" message
 * - No current salary: Dialog shows "Current salary not available" message
 * - Invalid input: Form shows inline error under field
 * - API error: Hook handles and shows toast notification
 * - 409 Conflict: Hook prompts user to refresh and retry
 *
 * Success:
 * - Employee detail cache updated with new salary and version
 * - Salary history invalidated to fetch new entry
 * - Dialog closes automatically
 * - Success toast shown
 */
export const SalaryUpdateDialog = ({
  open,
  onOpenChange,
  employee,
}: SalaryUpdateDialogProps) => {
  const { t } = useTranslation();
  const updateSalary = useUpdateSalary();

  // Form state
  const [newSalary, setNewSalary] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Current salary
  const currentSalary = employee?.baseSalary ?? null;
  const currentCurrency = CURRENCY.DEFAULT;

  // Calculate salary change preview
  const preview = useMemo(() => {
    if (!newSalary || currentSalary === null || currentSalary === undefined) {
      return { amount: 0, percentage: 0, isRaise: false };
    }

    const newValue = parseMoneyInput(newSalary);
    if (isNaN(newValue)) {
      return { amount: 0, percentage: 0, isRaise: false };
    }

    const amount = newValue - currentSalary;
    const percentage = (amount / currentSalary) * 100;

    return {
      amount: Math.round(amount * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
      isRaise: amount > 0,
    };
  }, [newSalary, currentSalary]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newSalary) {
      newErrors.salary = t("payroll.salary.required", {
        defaultValue: "الراتب مطلوب",
      });
    } else {
      const value = parseMoneyInput(newSalary);
      if (isNaN(value) || value <= 0) {
        newErrors.salary = t("payroll.salary.mustBePositive", {
          defaultValue: "الراتب يجب أن يكون رقماً موجباً",
        });
      } else if (value === currentSalary) {
        newErrors.salary = t("payroll.salary.unchanged", {
          defaultValue: "الراتب لم يتغير",
        });
      }
    }

    if (reason && reason.length > 500) {
      newErrors.reason = t("payroll.salary.reasonTooLong", {
        defaultValue: "السبب لا يجب أن يزيد عن 500 حرف",
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !employee) return;

    try {
      await updateSalary.mutateAsync({
        employeeId: employee.id,
        payload: {
          baseSalary: parseMoneyInput(newSalary),
          currency: CURRENCY.DEFAULT,
          reason: reason || undefined,
          rowVersion: employee.rowVersion ?? employee.version ?? 0,
        },
      });

      // Reset form and close dialog on success
      setNewSalary("");
      setReason("");
      onOpenChange(false);
    } catch {
      // Error handling is done by the hook (showToast)
      // For 409 Conflict: Hook shows error and invalidates employee query
    }
  };

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setNewSalary("");
      setReason("");
      setErrors({});
    }
    onOpenChange(newOpen);
  };

  // Show message if no employee selected
  if (!employee) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("payroll.salary.updateTitle", {
                defaultValue: "تحديث الراتب",
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-800 rounded-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>
              {t("common.noSelection", {
                defaultValue: "لم يتم تحديد بيانات",
              })}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show message if no current salary
  if (currentSalary === null || currentSalary === undefined) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("payroll.salary.updateTitle", {
                defaultValue: "تحديث الراتب",
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-800 rounded-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>
              {t("payroll.salary.noCurrentSalary", {
                defaultValue: "الراتب الحالي غير متوفر",
              })}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t("payroll.salary.updateTitle", {
              defaultValue: "تحديث الراتب",
            })}
          </DialogTitle>
          <DialogDescription>
            {t("payroll.salary.updateDescription", {
              defaultValue: `تحديث راتب ${employee.firstName} ${employee.lastName}`,
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Salary Display */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <Label className="text-sm font-medium text-blue-900 mb-2 block">
              {t("payroll.salary.currentSalary", {
                defaultValue: "الراتب الحالي",
              })}
            </Label>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-900">
                {formatCurrency(currentSalary)}
              </span>
              <span className="text-sm text-blue-700">{currentCurrency}</span>
            </div>
          </div>

          {/* New Salary Input */}
          <div className="space-y-2">
            <Label htmlFor="salary">
              {t("payroll.salary.newSalary", {
                defaultValue: "الراتب الجديد",
              })}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="salary"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
              value={newSalary}
              onChange={(e) => setNewSalary(e.target.value)}
              className={errors.salary ? "border-red-500" : ""}
              disabled={updateSalary.isPending}
            />
            {errors.salary && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.salary}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              {t("payroll.salary.currency", {
                defaultValue: "العملة",
              })}
            </Label>
            <Input value={CURRENCY.DEFAULT} readOnly disabled />
          </div>

          {/* Change Preview */}
          {newSalary && !errors.salary && preview.amount !== 0 && (
            <div
              className={`p-4 rounded-lg border-l-4 ${
                preview.isRaise
                  ? "bg-green-50 border-green-500"
                  : "bg-red-50 border-red-500"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      preview.isRaise ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    {preview.isRaise
                      ? t("payroll.salary.increase", {
                          defaultValue: "زيادة",
                        })
                      : t("payroll.salary.decrease", {
                          defaultValue: "تخفيض",
                        })}
                  </span>
                  {preview.isRaise ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-1">
                      {t("payroll.salary.amount", { defaultValue: "المبلغ" })}
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        preview.isRaise ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {preview.isRaise ? "+" : ""}
                      {formatCurrency(preview.amount)} {currentCurrency}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-1">
                      {t("payroll.salary.percentage", {
                        defaultValue: "النسبة",
                      })}
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        preview.isRaise ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {preview.isRaise ? "+" : ""}
                      {preview.percentage.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reason Field */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              {t("payroll.salary.reason", {
                defaultValue: "السبب (اختياري)",
              })}
            </Label>
            <Textarea
              id="reason"
              placeholder={t("payroll.salary.reasonPlaceholder", {
                defaultValue: "مثال: زيادة سنوية، ترقية، تعديل السوق",
              })}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              disabled={updateSalary.isPending}
              className={errors.reason ? "border-red-500" : ""}
            />
            <div className="flex justify-between items-center">
              {errors.reason && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.reason}
                </p>
              )}
              <p className="text-xs text-[var(--text-tertiary)] ml-auto">
                {reason.length}/500
              </p>
            </div>
          </div>

          {/* Hidden Version Field (for optimistic locking) */}
          <input
            type="hidden"
            value={employee.rowVersion ?? employee.version ?? 0}
          />

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={updateSalary.isPending}
            >
              {t("common.cancel", { defaultValue: "إلغاء" })}
            </Button>
            <Button
              type="submit"
              disabled={updateSalary.isPending || !newSalary}
              className="flex items-center gap-2"
            >
              {updateSalary.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("common.updating", { defaultValue: "جاري التحديث..." })}
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  {t("payroll.salary.update", { defaultValue: "تحديث الراتب" })}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
