/**
 * Project Cost Form Component - V2
 *
 * =============================================================================
 * ARCHITECTURE OVERVIEW
 * =============================================================================
 *
 * Comprehensive form supporting 3 cost types:
 * 1. Single Project Cost - Cost assigned to one project
 * 2. Allocated Cost - Cost distributed across multiple projects (min 2)
 * 3. General Expense - Cost not tied to any project
 *
 * KEY DESIGN DECISIONS:
 * - Type-safe with Zod validation (dynamic schema based on cost type)
 * - Step-based UX for better user experience
 * - Conditional rendering reduces cognitive load
 * - Validation happens at form level with clear error messages
 * - Performance optimized with useMemo and useCallback
 *
 * SCALABILITY CONSIDERATIONS:
 * - Easy to add new cost types
 * - Reusable components for each section
 * - Clear separation of concerns
 * - Well-documented for future maintainers
 *
 * @author Senior Developer
 * @version 2.0
 * @backward-compatible No - Breaking change from V1
 */

import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import {
  Loader2,
  Check,
  ChevronsUpDown,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  ProjectCostEntity,
  CreateProjectCostDto,
  CostType,
  FINANCE_VALIDATION,
} from "@/types/finance.types";
import type { CostCategoryEntity } from "@/types/finance.types";
import { useProjects } from "@/hooks/useProjects";
import { useCostCategories } from "@/hooks/useFinance";
import { parseMoneyInput } from "@/lib/money";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Generate a proper UUID v4
 * Fallback for environments where crypto.randomUUID() is not available
 */
const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Cost Form Type Enum
 * Determines which fields are required and how data is submitted
 */
type CostFormType = "SINGLE_PROJECT" | "ALLOCATED" | "GENERAL_EXPENSE";

/**
 * Allocation Input Interface
 * Used for allocated costs - supports either percentage OR amount
 */
interface AllocationInput {
  id: string; // Unique ID for React keys
  projectId: string;
  percentage?: number;
  amount?: number;
  notes?: string;
}

/**
 * Allocation Mode - User chooses how to distribute cost
 */
type AllocationMode = "PERCENTAGE" | "AMOUNT";

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Base schema shared across all cost types
 * Contains fields common to all costs regardless of type
 */
const baseFormSchema = {
  costType: z.nativeEnum(CostType, {
    message: "الرجاء اختيار نوع تكلفة صحيح",
  }),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  amount: z.number().min(0.01, "المبلغ يجب أن يكون أكبر من 0"),
  taxRate: z
    .number()
    .min(0, "Tax rate must be 0 or greater")
    .max(100, "Tax rate cannot exceed 100"),
  transactionDate: z.string().min(1, "تاريخ المعاملة مطلوب"),
  description: z
    .string()
    .min(1, "الوصف مطلوب")
    .max(FINANCE_VALIDATION.COST.DESCRIPTION_MAX, "الوصف طويل جداً"),
  invoiceNumber: z.string().max(100).optional().or(z.literal("")),
  paymentMethod: z.string().max(50).optional().or(z.literal("")),
  paymentReference: z.string().max(100).optional().or(z.literal("")),
  referenceType: z.string().optional().or(z.literal("")),
  referenceId: z.string().uuid().optional().or(z.literal("")),
};

/**
 * Dynamic Schema Factory
 * Returns appropriate schema based on selected cost type
 *
 * DESIGN DECISION: Dynamic schemas prevent complex conditional validation
 * and make the code more maintainable than a single mega-schema
 */
const getCostFormSchema = (
  formType: CostFormType,
  allocationMode?: AllocationMode,
) => {
  switch (formType) {
    case "SINGLE_PROJECT":
      return z.object({
        ...baseFormSchema,
        formType: z.literal("SINGLE_PROJECT"),
        projectId: z.string().uuid("الرجاء اختيار مشروع"),
      });

    case "ALLOCATED": {
      // Allocation schema varies by mode (percentage vs amount)
      const allocationItemSchema =
        allocationMode === "PERCENTAGE"
          ? z.object({
              projectId: z.string().uuid("يجب اختيار مشروع"),
              percentage: z
                .number()
                .min(0.01, "النسبة يجب أن تكون أكبر من 0")
                .max(100, "النسبة لا يمكن أن تتجاوز 100"),
              notes: z.string().optional(),
            })
          : z.object({
              projectId: z.string().uuid("يجب اختيار مشروع"),
              amount: z.number().min(0.01, "المبلغ يجب أن يكون أكبر من 0"),
              notes: z.string().optional(),
            });

      return z
        .object({
          ...baseFormSchema,
          formType: z.literal("ALLOCATED"),
          allocations: z
            .array(allocationItemSchema)
            .min(2, "التكاليف الموزعة تتطلب على الأقل مشروعين")
            .refine(
              (allocations) => {
                // Check no duplicate projects
                const projectIds = allocations.map((a) => a.projectId);
                return new Set(projectIds).size === projectIds.length;
              },
              { message: "كل مشروع يمكن توزيع التكلفة عليه مرة واحدة فقط" },
            )
            .refine(
              (allocations) => {
                // If percentage mode, total should equal 100%
                if (allocationMode === "PERCENTAGE") {
                  const total = allocations.reduce(
                    (sum, a) =>
                      sum + ("percentage" in a ? (a.percentage ?? 0) : 0),
                    0,
                  );
                  return Math.abs(total - 100) < 0.01; // Allow for floating point errors
                }
                return true;
              },
              { message: "مجموع النسب المئوية يجب أن يساوي 100%" },
            ),
        })
        .superRefine((data, ctx) => {
          // Additional validation: In AMOUNT mode, sum of allocations must equal total amount
          if (allocationMode === "AMOUNT") {
            const totalAllocated = data.allocations.reduce(
              (sum, a) => sum + ("amount" in a ? (a.amount ?? 0) : 0),
              0,
            );
            const mainAmount = data.amount;

            if (Math.abs(totalAllocated - mainAmount) > 0.01) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["allocations"],
                message: `مجموع المبالغ الموزعة (${totalAllocated.toFixed(2)}) يجب أن يساوي التكلفة الإجمالية (${mainAmount.toFixed(2)})`,
              });
            }
          }
        });
    }

    case "GENERAL_EXPENSE":
      return z.object({
        ...baseFormSchema,
        formType: z.literal("GENERAL_EXPENSE"),
      });
  }
};

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface ProjectCostFormProps {
  initialData?: ProjectCostEntity;
  onSubmit: (data: CreateProjectCostDto) => Promise<void>;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

interface ProjectCostFormValues {
  formType: CostFormType;
  projectId?: string;
  allocations?: AllocationInput[];
  costType: CostType;
  categoryId?: string;
  amount: number;
  taxRate: number;
  transactionDate: string;
  description: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  paymentReference?: string;
  referenceType?: string;
  referenceId?: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get default form values based on cost type
 * Prevents undefined errors and provides sensible defaults
 */
const getDefaultValues = (
  formType: CostFormType,
  initialData?: ProjectCostEntity,
): ProjectCostFormValues => {
  const baseDefaults = {
    costType: initialData?.costType || CostType.OTHER,
    categoryId: initialData?.categoryId || "",
    amount: initialData?.amount || 0,
    taxRate: initialData?.taxRate || 0,
    transactionDate:
      initialData?.transactionDate || new Date().toISOString().split("T")[0],
    description: initialData?.description || "",
    invoiceNumber: initialData?.invoiceNumber || "",
    paymentMethod: initialData?.paymentMethod || "",
    paymentReference: initialData?.paymentReference || "",
    referenceType: initialData?.referenceType || "",
    referenceId: initialData?.referenceId || "",
  };

  switch (formType) {
    case "SINGLE_PROJECT":
      return {
        ...baseDefaults,
        formType: "SINGLE_PROJECT" as const,
        projectId: initialData?.projectId || "",
      };

    case "ALLOCATED":
      return {
        ...baseDefaults,
        formType: "ALLOCATED" as const,
        allocations:
          initialData?.allocations?.map((a) => ({
            id: generateUUID(),
            projectId: a.projectId,
            percentage: a.percentage,
            amount: a.allocatedAmount,
            notes: a.notes,
          })) || [],
      };

    case "GENERAL_EXPENSE":
      return {
        ...baseDefaults,
        formType: "GENERAL_EXPENSE" as const,
      };
  }
};

/**
 * Transform form data to CreateProjectCostDto
 * Handles the conversion from form structure to API structure
 *
 * CRITICAL: Must match backend DTO exactly
 */
const transformToDTO = (
  formData: ProjectCostFormValues,
  formType: CostFormType,
): CreateProjectCostDto => {
  const baseDTO = {
    costType: formData.costType,
    categoryId: formData.categoryId || undefined,
    amount: formData.amount,
    taxRate: formData.taxRate > 0 ? formData.taxRate : undefined,
    transactionDate: formData.transactionDate,
    description: formData.description,
    invoiceNumber: formData.invoiceNumber || undefined,
    paymentMethod: formData.paymentMethod || undefined,
    paymentReference: formData.paymentReference || undefined,
    referenceType: formData.referenceType || undefined,
    referenceId: formData.referenceId || undefined,
  };

  switch (formType) {
    case "SINGLE_PROJECT":
      return {
        ...baseDTO,
        projectId: formData.projectId,
      };

    case "ALLOCATED":
      return {
        ...baseDTO,
        allocations: (formData.allocations ?? []).map((a: AllocationInput) => {
          // Explicitly exclude the 'id' field (used only for React keys)
          const allocation: {
            projectId: string;
            percentage?: number;
            amount?: number;
            notes?: string;
          } = {
            projectId: a.projectId,
          };
          // Only include defined values
          if (a.percentage !== undefined) allocation.percentage = a.percentage;
          if (a.amount !== undefined) allocation.amount = a.amount;
          if (a.notes) allocation.notes = a.notes;
          return allocation;
        }),
      };

    case "GENERAL_EXPENSE":
      return baseDTO;
  }
};

/**
 * Detect initial form type from existing data
 * Used in edit mode to determine which form variant to show
 */
const detectFormType = (data?: ProjectCostEntity): CostFormType => {
  if (!data) return "SINGLE_PROJECT";

  if (data.allocations && data.allocations.length >= 2) {
    return "ALLOCATED";
  } else if (data.projectId) {
    return "SINGLE_PROJECT";
  } else {
    return "GENERAL_EXPENSE";
  }
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const ProjectCostForm = ({
  initialData,
  onSubmit,
  isLoading = false,
  mode = "create",
}: ProjectCostFormProps) => {
  const { t } = useTranslation();

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  // Determine initial form type from data or default to SINGLE_PROJECT
  const [formType, setFormType] = useState<CostFormType>(() =>
    detectFormType(initialData),
  );

  // For allocated costs - track allocation mode (percentage vs amount)
  const [allocationMode, setAllocationMode] = useState<AllocationMode>(() => {
    if (initialData?.allocations && initialData.allocations.length > 0) {
      return initialData.allocations[0].percentage ? "PERCENTAGE" : "AMOUNT";
    }
    return "PERCENTAGE";
  });

  // UI state for popovers
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const { data: projectsData, isLoading: isLoadingProjects } = useProjects({
    limit: 100,
  });

  // Mirror the backend guard: only editable projects can receive costs
  const EDITABLE_PROJECT_STATUSES = ["ACTIVE", "PLANNING", "DRAFT"] as const;
  const editableProjects = (projectsData?.data ?? []).filter((p) =>
    EDITABLE_PROJECT_STATUSES.includes(
      p.status as (typeof EDITABLE_PROJECT_STATUSES)[number],
    ),
  );

  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCostCategories({ limit: 100 });

  const [accountTypePopoverOpen, setAccountTypePopoverOpen] = useState(false);

  type CategoryOption = {
    id: string;
    name: string;
    level: number;
    path: string;
  };

  const categoryOptions = useMemo<CategoryOption[]>(() => {
    const categories = categoriesData?.data ?? [];
    if (categories.length === 0) return [];

    const childrenByParent = new Map<string | null, CostCategoryEntity[]>();
    for (const category of categories) {
      const parentKey = category.parentId ?? null;
      const siblings = childrenByParent.get(parentKey) ?? [];
      siblings.push(category);
      childrenByParent.set(parentKey, siblings);
    }

    for (const siblings of childrenByParent.values()) {
      siblings.sort((a, b) => a.name.localeCompare(b.name));
    }

    const options: CategoryOption[] = [];
    const visit = (
      parentId: string | null,
      level: number,
      parentPath: string,
    ) => {
      const children = childrenByParent.get(parentId) ?? [];
      for (const child of children) {
        const path = parentPath ? `${parentPath} > ${child.name}` : child.name;
        options.push({
          id: child.id,
          name: child.name,
          level,
          path,
        });
        visit(child.id, level + 1, path);
      }
    };

    visit(null, 0, "");
    return options;
  }, [categoriesData]);

  // ==========================================================================
  // FORM SETUP
  // ==========================================================================

  // Dynamic schema based on form type
  const schema = useMemo(
    () => getCostFormSchema(formType, allocationMode),
    [formType, allocationMode],
  );

  const form = useForm<ProjectCostFormValues, undefined, ProjectCostFormValues>(
    {
      resolver: zodResolver(schema) as Resolver<ProjectCostFormValues>,
      defaultValues: getDefaultValues(formType, initialData),
      mode: "onChange", // Validate on change for better UX
    },
  );

  const watchedAmount = useWatch({
    control: form.control,
    name: "amount",
  });
  const watchedTaxRate = useWatch({
    control: form.control,
    name: "taxRate",
  });

  const watchedReferenceType = useWatch({
    control: form.control,
    name: "referenceType",
  });

  const taxPreview = useMemo(() => {
    const totalAmount = Number(watchedAmount || 0);
    const taxRate = Number(watchedTaxRate || 0);
    if (totalAmount <= 0 || taxRate <= 0) {
      return {
        totalAmount,
        amountBeforeTax: totalAmount,
        taxAmount: 0,
      };
    }
    const divisor = 1 + taxRate / 100;
    const amountBeforeTax = Math.round((totalAmount / divisor) * 100) / 100;
    const taxAmount = Math.round((totalAmount - amountBeforeTax) * 100) / 100;
    return {
      totalAmount,
      amountBeforeTax,
      taxAmount,
    };
  }, [watchedAmount, watchedTaxRate]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  /**
   * Reset form when cost type changes
   * DESIGN DECISION: Complete reset prevents invalid state carry-over
   */
  useEffect(() => {
    if (mode === "create") {
      form.reset(getDefaultValues(formType));
    }
  }, [formType, mode, form]);

  /**
   * Re-validate allocations when allocation mode changes
   * Schema changes based on mode, so validation needs to be re-run
   */
  useEffect(() => {
    if (formType === "ALLOCATED") {
      // Give the schema time to update then re-validate
      setTimeout(() => form.trigger("allocations"), 0);
    }
  }, [allocationMode, formType, form]);

  useEffect(() => {
    const currentCategoryId = form.getValues("categoryId") ?? "";
    if (!currentCategoryId) return;

    const isValidCategory = categoryOptions.some(
      (category) => category.id === currentCategoryId,
    );

    if (!isValidCategory) {
      form.setValue("categoryId", "", { shouldValidate: true });
    }
  }, [categoryOptions, form]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  /**
   * Handle form type change
   * Warns user if they're switching types with data already entered
   */
  const handleFormTypeChange = useCallback(
    (newType: CostFormType) => {
      const currentValues = form.getValues();
      const hasData = Object.values(currentValues).some(
        (val) => val !== "" && val !== 0 && val !== undefined,
      );

      if (hasData && mode === "create") {
        const confirmed = window.confirm(
          t("finance.costs.form.switchTypeWarning") ||
            "Switching cost type will clear current data. Continue?",
        );
        if (!confirmed) return;
      }

      setFormType(newType);
    },
    [form, mode, t],
  );

  /**
   * Handle form submission
   * Transforms form data to DTO and calls parent onSubmit
   */
  const handleFormSubmit = useCallback(
    async (data: ProjectCostFormValues) => {
      try {
        const dto = transformToDTO(data, formType);
        await onSubmit(dto);
      } catch {
        // Error handling is done by parent component
      }
    },
    [formType, onSubmit],
  );

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-8"
      >
        {/* ===================================================================
            SECTION 1: COST TYPE SELECTION
            ================================================================ */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("finance.costs.form.costTypeTitle") || "Cost Type"}
            </CardTitle>
            <CardDescription>
              {t("finance.costs.form.costTypeDescription") ||
                "Select how this cost should be classified"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formType}
              onValueChange={(value) =>
                handleFormTypeChange(value as CostFormType)
              }
              disabled={mode === "edit"} // Cannot change type in edit mode
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Single Project Option */}
              <label
                htmlFor="single"
                className={cn(
                  "flex flex-col items-start space-y-2 rounded-lg border-2 p-4 cursor-pointer transition-colors",
                  formType === "SINGLE_PROJECT"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50",
                  mode === "edit" && "opacity-60 cursor-not-allowed",
                )}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SINGLE_PROJECT" id="single" />
                  <span className="font-medium">
                    {t("finance.costs.form.singleProject") || "Single Project"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("finance.costs.form.singleProjectDesc") ||
                    "Cost assigned to one project"}
                </p>
              </label>

              {/* Allocated Cost Option */}
              <label
                htmlFor="allocated"
                className={cn(
                  "flex flex-col items-start space-y-2 rounded-lg border-2 p-4 cursor-pointer transition-colors",
                  formType === "ALLOCATED"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50",
                  mode === "edit" && "opacity-60 cursor-not-allowed",
                )}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ALLOCATED" id="allocated" />
                  <span className="font-medium">
                    {t("finance.costs.form.allocatedCost") || "Allocated Cost"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("finance.costs.form.allocatedCostDesc") ||
                    "Distribute across multiple projects"}
                </p>
              </label>

              {/* General Expense Option */}
              <label
                htmlFor="general"
                className={cn(
                  "flex flex-col items-start space-y-2 rounded-lg border-2 p-4 cursor-pointer transition-colors",
                  formType === "GENERAL_EXPENSE"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50",
                  mode === "edit" && "opacity-60 cursor-not-allowed",
                )}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="GENERAL_EXPENSE" id="general" />
                  <span className="font-medium">
                    {t("finance.costs.form.generalExpense") ||
                      "General Expense"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("finance.costs.form.generalExpenseDesc") ||
                    "Not tied to any specific project"}
                </p>
              </label>
            </RadioGroup>

            {mode === "edit" && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t("finance.costs.form.cannotChangeType") ||
                    "Cost type cannot be changed after creation"}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* ===================================================================
            SECTION 2: PROJECT SELECTION (Dynamic based on cost type)
            ================================================================ */}

        {/* Single Project Selector */}
        {formType === "SINGLE_PROJECT" && (
          <Card>
            <CardHeader>
              <CardTitle>
                {t("finance.costs.form.projectSelection") ||
                  "Project Selection"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("finance.costs.fields.project")} *</FormLabel>
                    <Popover
                      open={projectPopoverOpen}
                      onOpenChange={setProjectPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={isLoadingProjects}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value
                              ? editableProjects.find(
                                  (p) => p.id === field.value,
                                )?.name || t("finance.costs.form.selectProject")
                              : isLoadingProjects
                                ? t("common.loading")
                                : t("finance.costs.form.selectProject")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder={
                              t("finance.costs.form.searchProject") ||
                              "Search project..."
                            }
                          />
                          <CommandList>
                            <CommandEmpty>
                              {t("finance.costs.form.noProjects") ||
                                "No projects found"}
                            </CommandEmpty>
                            <CommandGroup>
                              {editableProjects.map((project) => (
                                <CommandItem
                                  key={project.id}
                                  value={project.name}
                                  onSelect={() => {
                                    field.onChange(project.id);
                                    setProjectPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      project.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {project.name}
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
            </CardContent>
          </Card>
        )}

        {/* Allocated Cost Projects */}
        {formType === "ALLOCATED" && (
          <Card>
            <CardHeader>
              <CardTitle>
                {t("finance.costs.form.allocationTitle") ||
                  "Project Allocations"}
              </CardTitle>
              <CardDescription>
                {t("finance.costs.form.allocationDescription") ||
                  "Distribute cost across multiple projects (minimum 2)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Allocation Mode Selector */}
              <div>
                <FormLabel>
                  {t("finance.costs.form.allocationMode") ||
                    "Distribution Method"}
                </FormLabel>
                <RadioGroup
                  value={allocationMode}
                  onValueChange={(value) =>
                    setAllocationMode(value as AllocationMode)
                  }
                  className="flex gap-4 mt-2"
                >
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <RadioGroupItem value="PERCENTAGE" id="percentage" />
                    <span>
                      {t("finance.costs.form.byPercentage") ||
                        "By Percentage (%)"}
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <RadioGroupItem value="AMOUNT" id="amount" />
                    <span>
                      {t("finance.costs.form.byAmount") || "By Amount"}
                    </span>
                  </label>
                </RadioGroup>
                <p className="text-sm text-muted-foreground mt-2">
                  {allocationMode === "PERCENTAGE"
                    ? t("finance.costs.form.percentageHelp") ||
                      "Total must equal 100%"
                    : t("finance.costs.form.amountHelp") ||
                      "Sum of amounts will equal total cost"}
                </p>
              </div>

              {/* Allocations List */}
              <FormField
                control={form.control}
                name="allocations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("finance.costs.form.projectAllocations") ||
                        "Project Allocations"}{" "}
                      *
                    </FormLabel>
                    <div className="space-y-3">
                      {field.value && field.value.length > 0 ? (
                        field.value.map(
                          (allocation: AllocationInput, index: number) => (
                            <Card key={allocation.id} className="p-4">
                              <div className="grid grid-cols-12 gap-3 items-start">
                                {/* Project Selector */}
                                <div className="col-span-5">
                                  <Select
                                    value={allocation.projectId}
                                    onValueChange={(projectId) => {
                                      const newAllocations = [
                                        ...(field.value ?? []),
                                      ];
                                      newAllocations[index] = {
                                        ...allocation,
                                        projectId,
                                      };
                                      field.onChange(newAllocations);
                                      // Re-validate for duplicate projects
                                      setTimeout(
                                        () => form.trigger("allocations"),
                                        0,
                                      );
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue
                                        placeholder={t(
                                          "finance.costs.form.selectProject",
                                        )}
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {editableProjects.map((project) => (
                                        <SelectItem
                                          key={project.id}
                                          value={project.id}
                                          disabled={(field.value ?? []).some(
                                            (a: AllocationInput, i: number) =>
                                              i !== index &&
                                              a.projectId === project.id,
                                          )}
                                        >
                                          {project.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Percentage or Amount */}
                                <div className="col-span-3">
                                  <Input
                                    type="number"
                                    step={
                                      allocationMode === "PERCENTAGE"
                                        ? "0.01"
                                        : "0.01"
                                    }
                                    min="0"
                                    max={
                                      allocationMode === "PERCENTAGE"
                                        ? "100"
                                        : undefined
                                    }
                                    placeholder={
                                      allocationMode === "PERCENTAGE"
                                        ? "0.00%"
                                        : t("finance.costs.fields.amount")
                                    }
                                    value={
                                      allocationMode === "PERCENTAGE"
                                        ? allocation.percentage || ""
                                        : allocation.amount || ""
                                    }
                                    onChange={(e) => {
                                      const value = parseMoneyInput(
                                        e.target.value,
                                      );
                                      const newAllocations = [
                                        ...(field.value ?? []),
                                      ];
                                      newAllocations[index] = {
                                        ...allocation,
                                        ...(allocationMode === "PERCENTAGE"
                                          ? {
                                              percentage: value,
                                              amount: undefined,
                                            }
                                          : {
                                              amount: value,
                                              percentage: undefined,
                                            }),
                                      };
                                      field.onChange(newAllocations);
                                      // Re-validate to update error message immediately
                                      setTimeout(
                                        () => form.trigger("allocations"),
                                        0,
                                      );
                                    }}
                                  />
                                </div>

                                {/* Notes */}
                                <div className="col-span-3">
                                  <Input
                                    placeholder={
                                      t("finance.costs.form.notes") ||
                                      "Notes (optional)"
                                    }
                                    value={allocation.notes || ""}
                                    onChange={(e) => {
                                      const newAllocations = [
                                        ...(field.value ?? []),
                                      ];
                                      newAllocations[index] = {
                                        ...allocation,
                                        notes: e.target.value,
                                      };
                                      field.onChange(newAllocations);
                                    }}
                                  />
                                </div>

                                {/* Remove Button */}
                                <div className="col-span-1 flex justify-end">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newAllocations = (
                                        field.value ?? []
                                      ).filter(
                                        (_: AllocationInput, i: number) => i !== index,
                                      );
                                      field.onChange(newAllocations);
                                      // Re-validate after removing
                                      setTimeout(
                                        () => form.trigger("allocations"),
                                        0,
                                      );
                                    }}
                                    disabled={(field.value?.length ?? 0) <= 2}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ),
                        )
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {t("finance.costs.form.addProjectsToStart") ||
                              "Add at least 2 projects to continue"}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Add Project Button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newAllocation: AllocationInput = {
                            id: generateUUID(),
                            projectId: "",
                            ...(allocationMode === "PERCENTAGE"
                              ? { percentage: 0 }
                              : { amount: 0 }),
                          };
                          field.onChange([
                            ...(field.value || []),
                            newAllocation,
                          ]);
                          // Re-validate after adding
                          setTimeout(() => form.trigger("allocations"), 0);
                        }}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t("finance.costs.form.addProject") || "Add Project"}
                      </Button>

                      {/* Allocation Summary - Real-time Totals */}
                      {field.value && field.value.length > 0 && (
                        <div className="p-4 bg-muted rounded-md border-2 border-muted">
                          {allocationMode === "PERCENTAGE"
                            ? // Percentage Mode Summary
                              (() => {
                                const totalPercentage = field.value.reduce(
                                  (sum: number, a: AllocationInput) =>
                                    sum + (a.percentage || 0),
                                  0,
                                );
                                const isComplete =
                                  Math.abs(totalPercentage - 100) < 0.01;
                                return (
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium text-sm">
                                        {t(
                                          "finance.costs.form.totalPercentage",
                                        ) || "Total Percentage"}
                                        :
                                      </span>
                                      <span
                                        className={cn(
                                          "font-bold text-lg",
                                          isComplete
                                            ? "text-green-600"
                                            : "text-destructive",
                                        )}
                                      >
                                        {isComplete && (
                                          <span className="mr-1">✓</span>
                                        )}
                                        {totalPercentage.toFixed(2)}% / 100%
                                      </span>
                                    </div>
                                    {!isComplete && (
                                      <p className="text-xs text-muted-foreground">
                                        {totalPercentage < 100
                                          ? `${t("finance.costs.form.remaining") || "Remaining"}: ${(100 - totalPercentage).toFixed(2)}%`
                                          : `${t("finance.costs.form.excess") || "Excess"}: ${(totalPercentage - 100).toFixed(2)}%`}
                                      </p>
                                    )}
                                  </div>
                                );
                              })()
                            : // Amount Mode Summary
                              (() => {
                                const totalAllocated = field.value.reduce(
                                  (sum: number, a: AllocationInput) =>
                                    sum + (a.amount || 0),
                                  0,
                                );
                                const mainAmount = watchedAmount || 0;
                                const isComplete =
                                  Math.abs(totalAllocated - mainAmount) < 0.01;
                                const percentage =
                                  mainAmount > 0
                                    ? (totalAllocated / mainAmount) * 100
                                    : 0;

                                return (
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium text-sm">
                                        {t(
                                          "finance.costs.form.totalAllocated",
                                        ) || "Total Allocated"}
                                        :
                                      </span>
                                      <span
                                        className={cn(
                                          "font-bold text-lg",
                                          isComplete
                                            ? "text-green-600"
                                            : "text-amber-600",
                                        )}
                                      >
                                        {isComplete && (
                                          <span className="mr-1">✓</span>
                                        )}
                                        {totalAllocated.toLocaleString()}{" "}
                                        {t("common.currency") || "SAR"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-muted-foreground">
                                        {t("finance.costs.form.totalCost") ||
                                          "Total Cost"}
                                        :
                                      </span>
                                      <span className="font-medium">
                                        {mainAmount.toLocaleString()}{" "}
                                        {t("common.currency") || "SAR"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-muted-foreground">
                                        {t(
                                          "finance.costs.form.percentageAllocated",
                                        ) || "Allocated"}
                                        :
                                      </span>
                                      <span
                                        className={cn(
                                          "font-medium",
                                          isComplete
                                            ? "text-green-600"
                                            : percentage > 100
                                              ? "text-destructive"
                                              : "text-amber-600",
                                        )}
                                      >
                                        {percentage.toFixed(1)}%
                                      </span>
                                    </div>
                                    {!isComplete && mainAmount > 0 && (
                                      <p className="text-xs text-muted-foreground pt-1 border-t">
                                        {totalAllocated < mainAmount
                                          ? `${t("finance.costs.form.remaining") || "Remaining"}: ${(mainAmount - totalAllocated).toLocaleString()} ${t("common.currency") || "SAR"}`
                                          : `${t("finance.costs.form.excess") || "Excess"}: ${(totalAllocated - mainAmount).toLocaleString()} ${t("common.currency") || "SAR"}`}
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* General Expense - No project selection needed */}
        {formType === "GENERAL_EXPENSE" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t("finance.costs.form.generalExpenseInfo") ||
                "This expense will not be tied to any specific project"}
            </AlertDescription>
          </Alert>
        )}

        {/* ===================================================================
            SECTION 3: COST DETAILS (Shared across all types)
            ================================================================ */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("finance.costs.form.costDetails") || "Cost Details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Amount & Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("finance.costs.fields.amount")} *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          const value = parseMoneyInput(e.target.value);
                          field.onChange(value);
                          // Re-validate allocations when amount changes in ALLOCATED + AMOUNT mode
                          if (
                            formType === "ALLOCATED" &&
                            allocationMode === "AMOUNT"
                          ) {
                            setTimeout(() => form.trigger("allocations"), 0);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {formType === "ALLOCATED" &&
                      allocationMode === "PERCENTAGE"
                        ? t("finance.costs.form.totalAmountHelp") ||
                          "This is the total amount to be distributed"
                        : t("finance.costs.form.amountHelp") ||
                          "Enter total cost amount in SAR"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("finance.costs.fields.taxRate") || "Tax Rate (%)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseMoneyInput(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {t("finance.costs.form.taxRateHelp") ||
                        "Optional. Enter VAT/tax percentage (e.g., 15)."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("finance.costs.fields.transactionDate")} *
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {Number(watchedTaxRate || 0) > 0 && Number(watchedAmount || 0) > 0 && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span>
                    {t("finance.costs.fields.amountBeforeTax") || "Before Tax"}:{" "}
                    <strong>{taxPreview.amountBeforeTax.toFixed(2)}</strong>
                  </span>
                  <span>
                    {t("finance.costs.fields.taxAmount") || "Tax Amount"}:{" "}
                    <strong>{taxPreview.taxAmount.toFixed(2)}</strong>
                  </span>
                  <span>
                    {t("finance.costs.fields.totalWithTax") || "Total"}:{" "}
                    <strong>{taxPreview.totalAmount.toFixed(2)}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Account Type (Full Category Tree) */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => {
                const selectedCategory = categoryOptions.find(
                  (option) => option.id === field.value,
                );
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("finance.costs.fields.accountType")} *</FormLabel>
                    <Popover
                      open={accountTypePopoverOpen}
                      onOpenChange={setAccountTypePopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            disabled={isLoadingCategories}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {selectedCategory
                              ? selectedCategory.path
                              : isLoadingCategories
                                ? t("common.loading")
                                : t("finance.costs.form.selectAccountType")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                        <Command>
                          <CommandInput
                            placeholder={t("finance.costs.form.searchAccountType")}
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>
                              {t("finance.costs.form.noCategory")}
                            </CommandEmpty>
                            <CommandGroup>
                              {categoryOptions.map((option) => (
                                <CommandItem
                                  key={option.id}
                                  value={option.path}
                                  onSelect={() => {
                                    form.setValue("categoryId", option.id, {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    });
                                    form.setValue("costType", CostType.OTHER, {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    });
                                    setAccountTypePopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === option.id
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  <span className="truncate">
                                    {option.level > 0
                                      ? `${"-".repeat(option.level)} ${option.name}`
                                      : option.name}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      {t("finance.costs.form.accountTypeHelp")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("finance.costs.fields.description")} *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        t("finance.costs.form.descriptionPlaceholder") ||
                        "Detailed description of the cost..."
                      }
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("finance.costs.form.descriptionHelp") ||
                      "Provide clear details for future reference"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ===================================================================
            SECTION 4: ADDITIONAL DETAILS (Optional)
            ================================================================ */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("finance.costs.form.additionalDetails") ||
                "Additional Details"}
            </CardTitle>
            <CardDescription>
              {t("finance.costs.form.additionalDetailsDesc") ||
                "Optional payment and reference information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Invoice & Payment Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("finance.costs.fields.invoiceNumber")}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="INV-2026-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("finance.costs.fields.paymentMethod")}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              t("finance.costs.form.selectPaymentMethod") ||
                              "Select"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CASH">
                          {t("finance.costs.paymentMethods.CASH") || "Cash"}
                        </SelectItem>
                        <SelectItem value="BANK_TRANSFER">
                          {t("finance.costs.paymentMethods.BANK_TRANSFER") ||
                            "Bank Transfer"}
                        </SelectItem>
                        <SelectItem value="CHECK">
                          {t("finance.costs.paymentMethods.CHECK") || "Check"}
                        </SelectItem>
                        <SelectItem value="CARD">
                          {t("finance.costs.paymentMethods.CARD") || "Card"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Payment Reference */}
            <FormField
              control={form.control}
              name="paymentReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("finance.costs.fields.paymentReference")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        t("finance.costs.form.paymentReferencePlaceholder") ||
                        "Transaction ID or check number"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reference Link (Employee, Asset, etc.) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="referenceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("finance.costs.fields.referenceType")}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              t("finance.costs.form.selectReferenceType") ||
                              "Select"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Employee">
                          {t("finance.costs.referenceTypes.Employee") ||
                            "Employee"}
                        </SelectItem>
                        <SelectItem value="Asset">
                          {t("finance.costs.referenceTypes.Asset") || "Asset"}
                        </SelectItem>
                        <SelectItem value="Vendor">
                          {t("finance.costs.referenceTypes.Vendor") || "Vendor"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t("finance.costs.form.referenceTypeHelp") ||
                        "Link this cost to an employee, asset, or vendor"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referenceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("finance.costs.fields.referenceId")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          t("finance.costs.form.referenceIdPlaceholder") ||
                          "UUID"
                        }
                        {...field}
                        disabled={!watchedReferenceType}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("finance.costs.form.referenceIdHelp") ||
                        "Select reference type first"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* TO BE CONTINUED - More sections coming... */}

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button
            type="submit"
            disabled={
              isLoading ||
              !form.formState.isValid ||
              form.formState.isSubmitting
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "edit"
              ? t("common.saveChanges") || "Save Changes"
              : t("common.create") || "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

