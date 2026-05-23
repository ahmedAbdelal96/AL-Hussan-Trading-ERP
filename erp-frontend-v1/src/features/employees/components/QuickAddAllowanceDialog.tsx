/**
 * Quick Add Allowance Dialog Component
 *
 * Streamlined dialog for quickly adding an allowance to an employee.
 * Pre-fills employee information and provides smart defaults.
 *
 * Features:
 * - Pre-filled employee (non-editable for context)
 * - Smart filtering (only shows allowance types not already assigned)
 * - Real-time monthly equivalent calculation
 * - Form validation with Zod
 * - Auto-default frequency from allowance type
 * - Date validation (end date after start date)
 * - Optimistic UI updates
 * - Accessibility (ARIA labels, keyboard navigation)
 *
 * Performance Optimizations:
 * - Memoized filtered allowance types
 * - Debounced calculations
 * - Lazy loading of dropdown data
 *
 * @component QuickAddAllowanceDialog
 * @module Employees
 */

import { useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/i18n/useTranslation";
import { Calculator, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { calculateMonthlyEquivalent } from "@/features/payroll/components/common";
import { useAllowanceTypes } from "@/hooks/useAllowanceTypes";
import {
  useEmployeeAllowancesByEmployee,
  useCreateEmployeeAllowance,
} from "@/hooks/useEmployeeAllowances";
import { useEmployee } from "@/hooks/useEmployees";
import { formatCurrency } from "@/lib/utils";
import { parseMoneyInput } from "@/lib/money";
import { getAllowanceStatus } from "@/features/payroll/components/common/AllowanceStatusBadge";
import { AllowanceStatus } from "@/types/payroll.types";
import type {
  CreateEmployeeAllowanceDto,
  AllowanceFrequency,
} from "@/types/payroll.types";

/**
 * Form validation schema using Zod
 *
 * Validates:
 * - Allowance type selection (required)
 * - Amount (positive number)
 * - Frequency (enum)
 * - Start date (required, valid date)
 * - End date (optional, must be after start date)
 * - Notes (optional, max 500 chars)
 */
const formSchema = z
  .object({
    allowanceTypeId: z.string().min(1, "اختر نوع البدل"),
    amount: z
      .number()
      .positive("المبلغ يجب أن يكون أكبر من صفر")
      .max(9999999.99, "المبلغ لا يمكن أن يتجاوز 9,999,999.99"),
    frequency: z.enum([
      "MONTHLY",
      "QUARTERLY",
      "SEMI_ANNUAL",
      "ANNUAL",
      "ONE_TIME",
    ]),
    effectiveFrom: z.string().min(1, "تاريخ البداية مطلوب"),
    effectiveTo: z.string().optional(),
    notes: z.string().max(500, "الملاحظات لا تتجاوز 500 حرف").optional(),
  })
  .refine(
    (data) => {
      if (data.effectiveTo && data.effectiveFrom) {
        return new Date(data.effectiveTo) > new Date(data.effectiveFrom);
      }
      return true;
    },
    {
      message: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية",
      path: ["effectiveTo"],
    },
  );

type FormValues = z.infer<typeof formSchema>;

/**
 * Props interface for QuickAddAllowanceDialog
 */
interface QuickAddAllowanceDialogProps {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;

  /**
   * Callback when dialog is closed
   */
  onClose: () => void;

  /**
   * Employee ID (pre-filled, non-editable)
   */
  employeeId: string;
}

/**
 * QuickAddAllowanceDialog Component
 *
 * Provides a streamlined interface for adding an allowance to an employee
 * with smart defaults and validation.
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <Button onClick={() => setIsOpen(true)}>Add Allowance</Button>
 * <QuickAddAllowanceDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   employeeId="employee-uuid-123"
 * />
 * ```
 */
export const QuickAddAllowanceDialog = ({
  isOpen,
  onClose,
  employeeId,
}: QuickAddAllowanceDialogProps) => {
  const { t } = useTranslation();

  // Fetch employee data for display
  const { data: employee } = useEmployee(employeeId);

  // Fetch allowance types (active only)
  const { data: allowanceTypesData, isLoading: isLoadingTypes } =
    useAllowanceTypes({
      isActive: true,
      limit: 100,
      sortBy: "name",
      sortOrder: "asc",
    });

  // Fetch existing allowances for this employee
  const { data: existingAllowances = [] } =
    useEmployeeAllowancesByEmployee(employeeId);

  // Create mutation
  const createMutation = useCreateEmployeeAllowance();

  /**
   * Filter out allowance types already assigned and active
   *
   * Business Logic:
   * - An employee can have multiple allowances of the same type if:
   *   1. Previous one is expired/rejected
   *   2. Previous one has an end date and new one starts after
   * - For simplicity, we only show types NOT currently active
   */
  const availableAllowanceTypes = useMemo(() => {
    if (!allowanceTypesData?.data || !existingAllowances) {
      return allowanceTypesData?.data || [];
    }

    // Get IDs of currently active allowances
    const activeTypeIds = existingAllowances
      .filter((allowance) => {
        const status = getAllowanceStatus(allowance);
        return (
          status === AllowanceStatus.APPROVED ||
          status === AllowanceStatus.PENDING
        );
      })
      .map((allowance) => allowance.allowanceTypeId);

    // Filter out already assigned types
    return allowanceTypesData.data.filter(
      (type) => !activeTypeIds.includes(type.id),
    );
  }, [allowanceTypesData, existingAllowances]);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      allowanceTypeId: "",
      amount: 0,
      frequency: "MONTHLY",
      effectiveFrom: new Date().toISOString().split("T")[0],
      effectiveTo: "",
      notes: "",
    },
  });

  // Watch form values for calculations
  const watchAmount = form.watch("amount");
  const watchFrequency = form.watch("frequency");
  const watchAllowanceTypeId = form.watch("allowanceTypeId");

  /**
   * Calculate monthly equivalent in real-time
   */
  const monthlyEquivalent = useMemo(() => {
    if (!watchAmount || watchAmount <= 0) return 0;
    return calculateMonthlyEquivalent(
      watchAmount,
      watchFrequency as AllowanceFrequency,
    );
  }, [watchAmount, watchFrequency]);

  /**
   * Get selected allowance type for displaying default frequency
   */
  const selectedType = useMemo(() => {
    if (!watchAllowanceTypeId || !availableAllowanceTypes) return null;
    return availableAllowanceTypes.find((t) => t.id === watchAllowanceTypeId);
  }, [watchAllowanceTypeId, availableAllowanceTypes]);

  /**
   * Auto-set frequency to MONTHLY as default since defaultFrequency doesn't exist
   */
  useEffect(() => {
    if (selectedType && !form.getValues("frequency")) {
      form.setValue("frequency", "MONTHLY");
    }
  }, [selectedType, form]);

  /**
   * Auto-fill amount from allowance type default amount.
   * User can still override it manually before submit.
   */
  useEffect(() => {
    if (!selectedType) return;
    if (selectedType.defaultAmount === null || selectedType.defaultAmount === undefined) {
      return;
    }
    form.setValue("amount", Number(selectedType.defaultAmount), {
      shouldValidate: true,
    });
  }, [selectedType, form]);

  /**
   * Reset form when dialog is closed
   */
  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (values: FormValues) => {
    try {
      const payload: CreateEmployeeAllowanceDto = {
        employeeId,
        allowanceTypeId: values.allowanceTypeId,
        amount: values.amount,
        frequency: values.frequency as AllowanceFrequency,
        effectiveFrom: values.effectiveFrom,
        effectiveTo: values.effectiveTo || undefined,
        notes: values.notes || undefined,
      };

      await createMutation.mutateAsync(payload);
      onClose();
    } catch (error) {
      // Error is handled by mutation with toast
      console.error("Error creating allowance:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("payroll.employeeAllowances.actions.addNew", {
              defaultValue: "Add New Allowance",
            })}
          </DialogTitle>
          <DialogDescription>
            {employee?.fullName && (
              <span>
                {t("payroll.employeeAllowances.form.forEmployee", {
                  defaultValue: "For employee:",
                })}{" "}
                <strong>{employee.fullName}</strong>
                {employee.employeeNumber && (
                  <span className="text-muted-foreground ml-1">
                    #{employee.employeeNumber}
                  </span>
                )}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Warning if all types are assigned */}
            {availableAllowanceTypes.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t("payroll.employeeAllowances.messages.allTypesAssigned", {
                    defaultValue:
                      "All available allowance types are already assigned to this employee.",
                  })}
                </AlertDescription>
              </Alert>
            )}

            {/* Allowance Type Selection */}
            <FormField
              control={form.control}
              name="allowanceTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("payroll.employeeAllowances.form.allowanceType", {
                      defaultValue: "Allowance Type",
                    })}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={
                      isLoadingTypes || availableAllowanceTypes.length === 0
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingTypes
                              ? t("common.loading")
                              : t("common.select")
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableAllowanceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center justify-between gap-4">
                            <span>{type.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedType?.description && (
                    <FormDescription>
                      {selectedType.description}
                    </FormDescription>
                  )}
                  {selectedType?.defaultAmount !== null &&
                    selectedType?.defaultAmount !== undefined && (
                      <FormDescription>
                        {t("payroll.allowanceTypes.form.fields.defaultAmount", {
                          defaultValue: "Default Amount",
                        })}
                        : {formatCurrency(Number(selectedType.defaultAmount))}
                      </FormDescription>
                    )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("payroll.employeeAllowances.form.amount", {
                        defaultValue: "Amount",
                      })}{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="9999999.99"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseMoneyInput(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Frequency */}
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("payroll.employeeAllowances.form.frequency", {
                        defaultValue: "Frequency",
                      })}{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MONTHLY">
                          {t("payroll.frequency.monthly", {
                            defaultValue: "Monthly",
                          })}
                        </SelectItem>
                        <SelectItem value="QUARTERLY">
                          {t("payroll.frequency.quarterly", {
                            defaultValue: "Quarterly",
                          })}
                        </SelectItem>
                        <SelectItem value="SEMI_ANNUAL">
                          {t("payroll.frequency.semi_annual", {
                            defaultValue: "Semi-Annual",
                          })}
                        </SelectItem>
                        <SelectItem value="ANNUAL">
                          {t("payroll.frequency.annual", {
                            defaultValue: "Annual",
                          })}
                        </SelectItem>
                        <SelectItem value="ONE_TIME">
                          {t("payroll.frequency.one_time", {
                            defaultValue: "One Time",
                          })}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Monthly Equivalent Calculation Display */}
            {watchAmount > 0 && watchFrequency !== "ONE_TIME" && (
              <Alert className="bg-primary/5 border-primary/20">
                <Calculator className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <strong>
                    {t("payroll.employeeAllowances.monthlyEquivalent", {
                      defaultValue: "Monthly Equivalent",
                    })}
                    :
                  </strong>{" "}
                  <span className="font-semibold text-primary">
                    {formatCurrency(monthlyEquivalent)}
                  </span>{" "}
                  / {t("common.month", { defaultValue: "month" })}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Effective From */}
              <FormField
                control={form.control}
                name="effectiveFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("payroll.employeeAllowances.form.effectiveFrom", {
                        defaultValue: "Effective From",
                      })}{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Effective To (Optional) */}
              <FormField
                control={form.control}
                name="effectiveTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("payroll.employeeAllowances.form.effectiveTo", {
                        defaultValue: "Effective To",
                      })}{" "}
                      <span className="text-muted-foreground text-xs">
                        ({t("common.optional", { defaultValue: "optional" })})
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      {t(
                        "payroll.employeeAllowances.form.effectiveToDescription",
                        {
                          defaultValue: "Leave empty for ongoing allowance",
                        },
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes (Optional) */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("payroll.employeeAllowances.form.notes", {
                      defaultValue: "Notes",
                    })}{" "}
                    <span className="text-muted-foreground text-xs">
                      ({t("common.optional", { defaultValue: "optional" })})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      maxLength={500}
                      placeholder={t(
                        "payroll.employeeAllowances.form.notesPlaceholder",
                        {
                          defaultValue: "Enter any additional notes...",
                        },
                      )}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0} / 500
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dialog Footer with Actions */}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createMutation.isPending}
              >
                {t("common.actions.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending ||
                  availableAllowanceTypes.length === 0
                }
              >
                {createMutation.isPending
                  ? t("common.saving", { defaultValue: "Saving..." })
                  : t("common.actions.save", { defaultValue: "Save" })}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
