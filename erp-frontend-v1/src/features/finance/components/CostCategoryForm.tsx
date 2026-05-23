/**
 * Cost Category Form Component
 *
 * Form for creating and editing cost categories.
 * Supports hierarchical categories with parent selection.
 *
 * Validation Rules (matching backend):
 * - name: Required, max 100 characters
 * - description: Optional
 * - parentId: Optional UUID
 * - isActive: Optional boolean (default: true)
 *
 * @component CostCategoryForm
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Check, ChevronsUpDown } from "lucide-react";
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
import type {
  CostCategoryEntity,
  CreateCostCategoryDto,
} from "@/types/finance.types";
import { FINANCE_VALIDATION } from "@/types/finance.types";

/**
 * Zod validation schema matching backend exactly
 */
const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, "finance.categories.validation.nameRequired")
    .max(
      FINANCE_VALIDATION.CATEGORY.NAME_MAX,
      "finance.categories.validation.nameMax",
    ),
  description: z.string().optional().or(z.literal("")),
  parentId: z.string().uuid().optional().or(z.literal("")),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof categoryFormSchema>;

interface CostCategoryFormProps {
  initialData?: CostCategoryEntity;
  parentCategories?: CostCategoryEntity[]; // Available parent categories
  defaultParentId?: string; // Pre-select parent (for "Add Child")
  onSubmit: (data: CreateCostCategoryDto) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

/**
 * Cost Category Form Component
 */
export const CostCategoryForm = ({
  initialData,
  parentCategories = [],
  defaultParentId,
  onSubmit,
  onCancel,
  isLoading = false,
}: CostCategoryFormProps) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const [parentPopoverOpen, setParentPopoverOpen] = useState(false);

  // Initialize form with default values
  const form = useForm<FormValues, undefined, FormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      parentId: defaultParentId || initialData?.parentId || "",
      isActive: initialData?.isActive ?? true,
    },
  });

  // Reset form when initialData or defaultParentId changes
  // Skip reset if initialData is undefined (for create mode)
  useEffect(() => {
    if (!initialData && !defaultParentId) {
      // Don't reset on initial mount for create mode
      return;
    }

    form.reset({
      name: initialData?.name || "",
      description: initialData?.description || "",
      parentId: defaultParentId || initialData?.parentId || "",
      isActive: initialData?.isActive ?? true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id, defaultParentId]);

  // Handle form submission
  const handleSubmit = async (values: FormValues) => {
    // Clean data: convert empty strings to undefined
    const cleanData: CreateCostCategoryDto = {
      name: values.name,
      description: values.description || undefined,
      parentId: values.parentId || undefined,
      isActive: values.isActive,
    };

    await onSubmit(cleanData);
  };

  // Filter out current category from parent options (can't be its own parent)
  const availableParents = parentCategories.filter(
    (cat) => cat.id !== initialData?.id,
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Category Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("finance.categories.fields.name")}
                <span className="text-destructive ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("finance.categories.form.namePlaceholder")}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription className="text-xs">
                {t("finance.categories.validation.nameMax")}
              </FormDescription>
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
              <FormLabel>
                {t("finance.categories.fields.description")}
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t(
                    "finance.categories.form.descriptionPlaceholder",
                  )}
                  disabled={isLoading}
                  rows={3}
                />
              </FormControl>
              <FormDescription className="text-xs">
                {t("finance.categories.form.descriptionHint")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Parent Category */}
        {availableParents.length > 0 && (
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>
                  {t("finance.categories.fields.parentCategory")}
                </FormLabel>
                <Popover
                  open={parentPopoverOpen}
                  onOpenChange={setParentPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={isLoading}
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value
                          ? (() => {
                              const selectedParent = availableParents.find(
                                (parent) => parent.id === field.value,
                              );
                              return selectedParent ? (
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">
                                    {selectedParent.name}
                                  </span>
                                  {selectedParent.description && (
                                    <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                                      {selectedParent.description}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                t(
                                  "finance.categories.form.selectParentPlaceholder",
                                )
                              );
                            })()
                          : t(
                              "finance.categories.form.selectParentPlaceholder",
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
                        <CommandEmpty>
                          {t("finance.categories.list.empty")}
                        </CommandEmpty>
                        <CommandGroup>
                          {/* No Parent Option */}
                          <CommandItem
                            value="no-parent"
                            onSelect={() => {
                              field.onChange("");
                              setParentPopoverOpen(false);
                            }}
                          >
                            <div className="flex flex-col flex-1">
                              <span className="font-medium">
                                {t("finance.categories.fields.noParent")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {t("finance.categories.form.topLevelHint")}
                              </span>
                            </div>
                            <Check
                              className={cn(
                                "ml-2 h-4 w-4",
                                !field.value ? "opacity-100" : "opacity-0",
                              )}
                            />
                          </CommandItem>

                          {/* Available Parents */}
                          {availableParents.map((parent) => (
                            <CommandItem
                              key={parent.id}
                              value={`${parent.name} ${parent.description || ""}`}
                              onSelect={() => {
                                field.onChange(parent.id);
                                setParentPopoverOpen(false);
                              }}
                            >
                              <div className="flex flex-col flex-1">
                                <span className="font-medium">
                                  {parent.name}
                                </span>
                                {parent.description && (
                                  <span className="text-xs text-muted-foreground truncate">
                                    {parent.description}
                                  </span>
                                )}
                              </div>
                              <Check
                                className={cn(
                                  "ml-2 h-4 w-4",
                                  parent.id === field.value
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
                <FormDescription className="text-xs">
                  {t("finance.categories.form.parentHint")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Active Status */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {t("finance.categories.fields.isActive")}
                </FormLabel>
                <FormDescription>
                  {t("finance.categories.form.activeHint")}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="min-w-[100px]">
            {isLoading
              ? t("common.saving")
              : isEdit
                ? t("common.edit")
                : t("common.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
