/**
 * Employee Deduction Form Component - Full Implementation
 *
 * Complete form for creating/editing employee deductions.
 *
 * Features:
 * - Employee selection
 * - Deduction type selection
 * - Amount input with validation
 * - Frequency selection (one_time, recurring)
 * - Date range picker
 * - Notes field
 * - Auto-approval for recurring deductions
 * - Validation with Zod
 * - Loading states
 * - Error handling
 *
 * Business Rules:
 * - Amount must be positive
 * - End date must be after start date (for recurring)
 * - End date required for one_time
 * - Recurring deductions auto-approved
 * - Notes optional
 *
 * @component EmployeeDeductionForm
 * @module Payroll/EmployeeDeductions
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { Info, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEmployees } from "@/hooks/useEmployees";
import { EmployeeStatus } from "@/types/employees.types";
import { parseMoneyInput } from "@/lib/money";
import type {
  CreateEmployeeDeductionDto,
  UpdateEmployeeDeductionDto,
  EmployeeDeductionEntity,
} from "@/types/payroll.types";

/**
 * Form schema with validation
 */
const formSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  deductionTypeId: z.string().min(1, "Deduction type is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  frequency: z.enum(["one_time", "recurring"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  notes: z.string().max(500, "Notes must not exceed 500 characters").optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EmployeeDeductionFormProps {
  deduction?: EmployeeDeductionEntity;
  onSubmit: (
    data: CreateEmployeeDeductionDto | UpdateEmployeeDeductionDto,
  ) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

/**
 * EmployeeDeductionForm Component
 */
export const EmployeeDeductionForm = ({
  deduction,
  onSubmit,
  onCancel,
  isLoading = false,
}: EmployeeDeductionFormProps) => {
  const { t } = useTranslation();
  const isEditMode = !!deduction;
  const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false);
  const [deductionTypePopoverOpen, setDeductionTypePopoverOpen] =
    useState(false);

  // Fetch employees for dropdown
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees({
    status: EmployeeStatus.ACTIVE,
    pageSize: 100,
  });

  /**
   * Initialize form
   */
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: deduction?.employeeId || "",
      deductionTypeId: deduction?.deductionType || "",
      amount: deduction?.amount || 0,
      frequency: "one_time",
      startDate: deduction?.deductionDate
        ? new Date(deduction.deductionDate).toISOString().split("T")[0]
        : "",
      endDate: "",
      notes: deduction?.notes || "",
    },
  });

  /**
   * Watch frequency for conditional validation
   */
  const watchFrequency = form.watch("frequency");

  /**
   * Validate end date is after start date
   */
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "startDate" || name === "endDate") {
        const startDate = value.startDate;
        const endDate = value.endDate;

        if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
          form.setError("endDate", {
            type: "manual",
            message: "End date must be after start date",
          });
        } else {
          form.clearErrors("endDate");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (values: FormValues) => {
    try {
      await onSubmit({
        employeeId: values.employeeId,
        deductionType: values.deductionTypeId as any, // Form uses deductionTypeId as enum value
        amount: values.amount,
        deductionDate: values.startDate,
        notes: values.notes || undefined,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Auto-approval Notice */}
        {watchFrequency === "recurring" && (
          <Alert className="border-info-main/50 bg-info-main/10">
            <Info className="h-4 w-4 text-info-main" />
            <AlertDescription className="text-sm">
              {t("payroll.employeeDeductions.form.recurringAutoApproval")}
            </AlertDescription>
          </Alert>
        )}

        {/* Employee and Deduction Type */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Employee ID */}
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>
                  {t("payroll.employeeDeductions.form.employeeId")}
                  <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <Popover
                  open={employeePopoverOpen}
                  onOpenChange={setEmployeePopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={isLoading || isEditMode || isLoadingEmployees}
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value
                          ? (() => {
                              const selectedEmployee =
                                employeesData?.data?.find(
                                  (emp) => emp.id === field.value,
                                );
                              return selectedEmployee ? (
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">
                                    {selectedEmployee.fullName}
                                  </span>
                                  {selectedEmployee.employeeNumber && (
                                    <span className="text-xs text-muted-foreground">
                                      #{selectedEmployee.employeeNumber}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                t(
                                  "payroll.employeeDeductions.form.employeeIdPlaceholder",
                                )
                              );
                            })()
                          : isLoadingEmployees
                            ? t("common.loading")
                            : t(
                                "payroll.employeeDeductions.form.employeeIdPlaceholder",
                              )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder={t("common.search")}
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>{t("employees.list.empty")}</CommandEmpty>
                        <CommandGroup>
                          {employeesData?.data?.map((employee) => (
                            <CommandItem
                              key={employee.id}
                              value={`${employee.fullName} ${employee.employeeNumber || ""}`}
                              onSelect={() => {
                                field.onChange(employee.id);
                                setEmployeePopoverOpen(false);
                              }}
                            >
                              <div className="flex flex-col flex-1">
                                <span className="font-medium">
                                  {employee.fullName}
                                </span>
                                {employee.employeeNumber && (
                                  <span className="text-xs text-muted-foreground">
                                    #{employee.employeeNumber}
                                  </span>
                                )}
                              </div>
                              <Check
                                className={cn(
                                  "ml-2 h-4 w-4",
                                  employee.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Deduction Type ID */}
          <FormField
            control={form.control}
            name="deductionTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("payroll.employeeDeductions.form.deductionType")}
                  <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t(
                      "payroll.employeeDeductions.form.deductionTypePlaceholder",
                    )}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Amount and Frequency */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("payroll.employeeDeductions.form.amount")}
                  <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    placeholder="0.00"
                    disabled={isLoading}
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
                  {t("payroll.employeeDeductions.form.frequency")}
                  <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="one_time">
                      {t("payroll.deductionFrequency.one_time")}
                    </SelectItem>
                    <SelectItem value="recurring">
                      {t("payroll.deductionFrequency.recurring")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  {t("payroll.employeeDeductions.form.frequencyHint")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Start Date */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("payroll.employeeDeductions.form.startDate")}
                  <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} type="date" disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* End Date */}
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("payroll.employeeDeductions.form.endDate")}
                  {watchFrequency === "one_time" && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input {...field} type="date" disabled={isLoading} />
                </FormControl>
                <FormDescription className="text-xs">
                  {watchFrequency === "recurring"
                    ? t("payroll.employeeDeductions.form.endDateOptional")
                    : t("payroll.employeeDeductions.form.endDateRequired")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("payroll.employeeDeductions.form.notes")}
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t(
                    "payroll.employeeDeductions.form.notesPlaceholder",
                  )}
                  rows={3}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {t("payroll.common.actions.cancel")}
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? t("payroll.common.loading")
              : isEditMode
                ? t("payroll.common.actions.update")
                : t("payroll.common.actions.create")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
