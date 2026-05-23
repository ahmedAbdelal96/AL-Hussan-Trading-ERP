/**
 * Allowance Type Form Component
 *
 * Simple form for creating and editing allowance types (master data).
 *
 * Fields:
 * - Name - Required
 * - Description
 * - Is Active - Toggle
 *
 * Features:
 * - Zod validation
 * - Clean data transformation
 *
 * @component AllowanceTypeForm
 * @module Payroll
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/i18n/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type {
  AllowanceTypeEntity,
  CreateAllowanceTypeDto,
} from "@/types/payroll.types";

/**
 * Zod Validation Schema
 */
const allowanceTypeFormSchema = z.object({
  name: z
    .string()
    .min(1, "اسم نوع البدل مطلوب")
    .max(100, "الاسم لا يتجاوز 100 حرف"),
  description: z.string().optional(),
  defaultAmount: z
    .number()
    .min(0, "القيمة الافتراضية يجب ألا تقل عن 0")
    .optional(),
  isActive: z.boolean().optional(),
});

type AllowanceTypeFormValues = z.infer<typeof allowanceTypeFormSchema>;

interface AllowanceTypeFormProps {
  initialData?: AllowanceTypeEntity;
  onSubmit: (data: CreateAllowanceTypeDto) => Promise<void>;
  isSubmitting: boolean;
  isEditMode: boolean;
}

/**
 * AllowanceTypeForm Component
 */
export const AllowanceTypeForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  isEditMode,
}: AllowanceTypeFormProps) => {
  const { language } = useLanguage();
  const t = translations[language].payroll.allowanceTypes;

  /**
   * Initialize form
   */
  const form = useForm<AllowanceTypeFormValues>({
    resolver: zodResolver(allowanceTypeFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      defaultAmount: initialData?.defaultAmount ?? undefined,
      isActive: initialData?.isActive ?? true,
    },
  });

  /**
   * Handle form submission
   */
  const handleSubmit = async (values: AllowanceTypeFormValues) => {
    const cleanedData: CreateAllowanceTypeDto = {
      name: values.name,
      description: values.description || undefined,
      defaultAmount: values.defaultAmount,
      isActive: values.isActive,
    };

    await onSubmit(cleanedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t.form.fields.name}
                <span className="text-error-600 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder={t.form.fields.namePlaceholder} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.form.fields.description}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t.form.fields.descriptionPlaceholder}
                  rows={4}
                />
              </FormControl>
              <FormDescription>
                {t.form.fields.descriptionDescription}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Default Amount */}
        <FormField
          control={form.control}
          name="defaultAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {(t.form.fields as { defaultAmount?: string }).defaultAmount ||
                  "Default Amount"}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(
                      value === "" ? undefined : Number.parseFloat(value),
                    );
                  }}
                  placeholder={
                    (
                      t.form.fields as {
                        defaultAmountPlaceholder?: string;
                      }
                    ).defaultAmountPlaceholder || "Leave empty to require manual amount"
                  }
                />
              </FormControl>
              <FormDescription>
                {(t.form.fields as { defaultAmountDescription?: string })
                  .defaultAmountDescription ||
                  "Used as a default when assigning this allowance to employees."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Is Active */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>{t.form.fields.isActive}</FormLabel>
                <FormDescription>
                  {t.form.fields.isActiveDescription}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting
              ? translations[language].common.actions.submitting
              : isEditMode
                ? t.actions.edit
                : t.actions.create}
          </Button>
        </div>
      </form>
    </Form>
  );
};
