# Cost Allocation Frontend - Implementation Plan

## 📋 Executive Summary

**Goal:** Implement a comprehensive Cost Allocation UI that allows users to:

1. Create allocated costs (split across multiple projects)
2. View allocation breakdown
3. Update existing allocations
4. Convert regular costs to allocated
5. Delete allocations

**Timeline:** 2-3 weeks (based on team size and availability)

**Tech Stack:**

- React 18+ with TypeScript
- React Hook Form + Zod validation
- TanStack Query (React Query) for API calls
- Shadcn/ui components
- Tailwind CSS
- Zustand (if complex state needed)

---

## 🏗️ Architecture Overview

### **1. Component Structure**

```
src/features/finance/cost-allocation/
├── components/
│   ├── AllocationForm/
│   │   ├── AllocationForm.tsx              # Main form wrapper
│   │   ├── AllocationInputSection.tsx      # Project selection & amount/percentage
│   │   ├── AllocationSummary.tsx           # Real-time validation & totals
│   │   └── AllocationFormSchema.ts         # Zod validation schema
│   │
│   ├── AllocationBreakdown/
│   │   ├── AllocationBreakdownCard.tsx     # Display allocation details
│   │   ├── AllocationProjectItem.tsx       # Single project allocation row
│   │   └── AllocationValidationStatus.tsx  # Validation indicators
│   │
│   ├── AllocationActions/
│   │   ├── UpdateAllocationDialog.tsx      # Edit allocations
│   │   ├── ConvertToAllocatedDialog.tsx    # Convert regular → allocated
│   │   └── DeleteAllocationDialog.tsx      # Remove allocations
│   │
│   └── shared/
│       ├── ProjectSelector.tsx             # Multi-project picker
│       ├── AllocationModeToggle.tsx        # Switch: Amount vs Percentage
│       └── AllocationProgressBar.tsx       # Visual feedback (0-100%)
│
├── hooks/
│   ├── useAllocations.ts                   # API calls & state
│   ├── useAllocationValidation.ts          # Real-time validation
│   └── useAllocationCalculations.ts        # Amount ↔ Percentage conversion
│
├── types/
│   └── allocation.types.ts                 # TypeScript interfaces
│
├── utils/
│   ├── allocationValidators.ts             # Business rules
│   └── allocationCalculations.ts           # Math helpers
│
└── api/
    └── allocationApi.ts                    # API service layer
```

---

## 🎯 Phase 1: Foundation (Week 1, Days 1-3)

### **1.1 TypeScript Types**

**File:** `src/features/finance/cost-allocation/types/allocation.types.ts`

```typescript
// ============================================================================
// ALLOCATION TYPES
// ============================================================================

export interface CostAllocationInput {
  projectId: string;
  amount?: number;
  percentage?: number;
  notes?: string;
}

export interface CostAllocationResponse {
  id: string;
  costId: string;
  projectId: string;
  allocatedAmount: number;
  percentage: number;
  notes?: string;
  project: {
    id: string;
    projectCode: string;
    name: string;
    status: ProjectStatus;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CostAllocationsSummary {
  costId: string;
  totalAmount: number;
  projectCount: number;
  isValid: boolean;
  allocations: CostAllocationResponse[];
  validationMessages: string[];
}

export interface UpdateCostAllocationsDto {
  allocations: CostAllocationInput[];
}

export interface CreateAllocatedCostDto {
  costType: string;
  costTypeId: string;
  categoryId?: string;
  amount: number;
  transactionDate: string;
  description: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  allocations: CostAllocationInput[];
}

// Allocation mode (UI only)
export type AllocationMode = "amount" | "percentage";

// Form state (UI only)
export interface AllocationFormData {
  mode: AllocationMode;
  totalAmount: number;
  allocations: {
    projectId: string;
    value: number; // amount or percentage based on mode
    notes?: string;
  }[];
}

// Validation status (UI only)
export interface AllocationValidation {
  isValid: boolean;
  errors: {
    minProjects?: string;
    duplicateProjects?: string;
    sumMismatch?: string;
    negativeValues?: string;
  };
  warnings: string[];
}
```

---

### **1.2 API Service Layer**

**File:** `src/features/finance/cost-allocation/api/allocationApi.ts`

```typescript
import { apiClient } from "@/lib/api-client";
import type {
  CostAllocationsSummary,
  UpdateCostAllocationsDto,
  CostAllocationInput,
} from "../types/allocation.types";

// ============================================================================
// COST ALLOCATION API
// ============================================================================

const BASE_PATH = "/finance/costs";

export const allocationApi = {
  /**
   * Get allocations for a cost
   */
  getAllocations: async (costId: string): Promise<CostAllocationsSummary> => {
    const response = await apiClient.get(`${BASE_PATH}/${costId}/allocations`);
    return response.data;
  },

  /**
   * Update cost allocations (full replacement)
   */
  updateAllocations: async (
    costId: string,
    data: UpdateCostAllocationsDto,
  ): Promise<CostAllocationsSummary> => {
    const response = await apiClient.put(
      `${BASE_PATH}/${costId}/allocations`,
      data,
    );
    return response.data;
  },

  /**
   * Convert regular cost to allocated
   */
  convertToAllocated: async (
    costId: string,
    allocations: CostAllocationInput[],
  ): Promise<CostAllocationsSummary> => {
    const response = await apiClient.post(
      `${BASE_PATH}/${costId}/convert-to-allocated`,
      { allocations },
    );
    return response.data;
  },

  /**
   * Delete allocations (convert back to regular cost)
   */
  deleteAllocations: async (
    costId: string,
    projectId?: string,
  ): Promise<{ success: boolean; message: string }> => {
    const params = projectId ? { projectId } : {};
    const response = await apiClient.delete(
      `${BASE_PATH}/${costId}/allocations`,
      { params },
    );
    return response.data;
  },
};
```

---

### **1.3 React Query Hooks**

**File:** `src/features/finance/cost-allocation/hooks/useAllocations.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { allocationApi } from "../api/allocationApi";
import { toast } from "@/components/ui/use-toast";
import type {
  UpdateCostAllocationsDto,
  CostAllocationInput,
} from "../types/allocation.types";

// ============================================================================
// ALLOCATION HOOKS
// ============================================================================

/**
 * Query Keys
 */
export const allocationKeys = {
  all: ["cost-allocations"] as const,
  detail: (costId: string) => [...allocationKeys.all, costId] as const,
};

/**
 * Get allocations for a cost
 */
export function useGetAllocations(costId: string | undefined) {
  return useQuery({
    queryKey: allocationKeys.detail(costId!),
    queryFn: () => allocationApi.getAllocations(costId!),
    enabled: !!costId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update cost allocations
 */
export function useUpdateAllocations(costId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCostAllocationsDto) =>
      allocationApi.updateAllocations(costId, data),
    onSuccess: () => {
      // Invalidate allocations query
      queryClient.invalidateQueries({
        queryKey: allocationKeys.detail(costId),
      });
      // Invalidate cost query (to update cost details)
      queryClient.invalidateQueries({
        queryKey: ["costs", costId],
      });
      toast({
        title: "Success",
        description: "Cost allocations updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update allocations",
        variant: "destructive",
      });
    },
  });
}

/**
 * Convert cost to allocated
 */
export function useConvertToAllocated(costId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (allocations: CostAllocationInput[]) =>
      allocationApi.convertToAllocated(costId, allocations),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: allocationKeys.detail(costId),
      });
      queryClient.invalidateQueries({
        queryKey: ["costs", costId],
      });
      toast({
        title: "Success",
        description: "Cost converted to allocated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to convert cost",
        variant: "destructive",
      });
    },
  });
}

/**
 * Delete cost allocations
 */
export function useDeleteAllocations(costId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId?: string) =>
      allocationApi.deleteAllocations(costId, projectId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: allocationKeys.detail(costId),
      });
      queryClient.invalidateQueries({
        queryKey: ["costs", costId],
      });
      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete allocations",
        variant: "destructive",
      });
    },
  });
}
```

---

## 🎨 Phase 2: Core Components (Week 1, Days 4-5)

### **2.1 Validation Utilities**

**File:** `src/features/finance/cost-allocation/utils/allocationValidators.ts`

```typescript
import type { AllocationValidation } from "../types/allocation.types";

// ============================================================================
// ALLOCATION VALIDATORS
// ============================================================================

const PERCENTAGE_TOLERANCE = 0.01; // ±0.01%
const AMOUNT_TOLERANCE = 0.01; // ±0.01 SAR

/**
 * Validate allocations
 */
export function validateAllocations(
  allocations: { projectId: string; value: number }[],
  totalAmount: number,
  mode: "amount" | "percentage",
): AllocationValidation {
  const errors: AllocationValidation["errors"] = {};
  const warnings: string[] = [];

  // 1. Minimum projects
  if (allocations.length < 2) {
    errors.minProjects = "الحد الأدنى لعدد المشاريع هو 2 لتوزيع التكاليف";
  }

  // 2. Duplicate projects
  const projectIds = allocations.map((a) => a.projectId);
  const uniqueIds = new Set(projectIds);
  if (projectIds.length !== uniqueIds.size) {
    errors.duplicateProjects = "تم العثور على مشاريع مكررة في التوزيعات";
  }

  // 3. Negative values
  const hasNegative = allocations.some((a) => a.value <= 0);
  if (hasNegative) {
    errors.negativeValues = "جميع القيم يجب أن تكون أكبر من صفر";
  }

  // 4. Sum validation
  const sum = allocations.reduce((acc, a) => acc + a.value, 0);

  if (mode === "percentage") {
    // Percentage: sum must equal 100%
    if (Math.abs(sum - 100) > PERCENTAGE_TOLERANCE) {
      errors.sumMismatch = `مجموع النسب يجب أن يساوي 100% (المجموع الحالي: ${sum.toFixed(2)}%)`;
    }
  } else {
    // Amount: sum must equal total amount
    if (Math.abs(sum - totalAmount) > AMOUNT_TOLERANCE) {
      errors.sumMismatch = `مجموع المبالغ يجب أن يساوي المبلغ الإجمالي (${totalAmount.toFixed(2)} ر.س)`;
    }
  }

  // 5. Warnings
  if (mode === "percentage") {
    // Warn about very small percentages
    const smallPercentages = allocations.filter((a) => a.value < 5);
    if (smallPercentages.length > 0) {
      warnings.push(`يوجد ${smallPercentages.length} مشروع(ة) بنسبة أقل من 5%`);
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return { isValid, errors, warnings };
}

/**
 * Calculate percentage from amount
 */
export function calculatePercentage(
  amount: number,
  totalAmount: number,
): number {
  if (totalAmount === 0) return 0;
  return (amount / totalAmount) * 100;
}

/**
 * Calculate amount from percentage
 */
export function calculateAmount(
  percentage: number,
  totalAmount: number,
): number {
  return (percentage / 100) * totalAmount;
}

/**
 * Auto-distribute remaining amount/percentage
 */
export function autoDistribute(
  existingAllocations: { projectId: string; value: number }[],
  totalValue: number, // 100 for percentage, totalAmount for amount
): number {
  const sumExisting = existingAllocations.reduce((acc, a) => acc + a.value, 0);
  const remaining = totalValue - sumExisting;
  return Math.max(0, remaining);
}
```

---

### **2.2 Allocation Form Schema**

**File:** `src/features/finance/cost-allocation/components/AllocationForm/AllocationFormSchema.ts`

```typescript
import { z } from "zod";

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * Single allocation schema
 */
const allocationInputSchema = z.object({
  projectId: z.string().min(1, "يجب اختيار المشروع"),
  value: z.number().positive("القيمة يجب أن تكون أكبر من صفر"),
  notes: z.string().optional(),
});

/**
 * Allocation form schema
 */
export const allocationFormSchema = z.object({
  mode: z.enum(["amount", "percentage"]),
  totalAmount: z.number().positive("المبلغ الإجمالي يجب أن يكون أكبر من صفر"),
  allocations: z
    .array(allocationInputSchema)
    .min(2, "الحد الأدنى لعدد المشاريع هو 2")
    .refine(
      (allocations) => {
        // No duplicate projects
        const projectIds = allocations.map((a) => a.projectId);
        return new Set(projectIds).size === projectIds.length;
      },
      { message: "لا يمكن تكرار نفس المشروع" },
    )
    .refine(
      (allocations, ctx) => {
        // Sum validation (depends on mode)
        const mode = ctx.parent.mode;
        const totalAmount = ctx.parent.totalAmount;
        const sum = allocations.reduce((acc, a) => acc + a.value, 0);

        if (mode === "percentage") {
          return Math.abs(sum - 100) <= 0.01;
        } else {
          return Math.abs(sum - totalAmount) <= 0.01;
        }
      },
      {
        message: (val, ctx) => {
          const mode = ctx.parent.mode;
          return mode === "percentage"
            ? "مجموع النسب يجب أن يساوي 100%"
            : "مجموع المبالغ يجب أن يساوي المبلغ الإجمالي";
        },
      },
    ),
});

export type AllocationFormData = z.infer<typeof allocationFormSchema>;
```

---

### **2.3 Allocation Input Section Component**

**File:** `src/features/finance/cost-allocation/components/AllocationForm/AllocationInputSection.tsx`

```typescript
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectSelector } from '../shared/ProjectSelector';
import { calculatePercentage, calculateAmount } from '../../utils/allocationValidators';
import type { AllocationFormData } from './AllocationFormSchema';

// ============================================================================
// ALLOCATION INPUT SECTION
// ============================================================================

interface AllocationInputSectionProps {
  form: UseFormReturn<AllocationFormData>;
  isLoading?: boolean;
}

export function AllocationInputSection({
  form,
  isLoading,
}: AllocationInputSectionProps) {
  const allocations = form.watch('allocations');
  const mode = form.watch('mode');
  const totalAmount = form.watch('totalAmount');

  // Add new allocation row
  const handleAddAllocation = () => {
    const remaining = autoCalculateRemaining();
    form.setValue('allocations', [
      ...allocations,
      { projectId: '', value: remaining, notes: '' },
    ]);
  };

  // Remove allocation row
  const handleRemoveAllocation = (index: number) => {
    const newAllocations = allocations.filter((_, i) => i !== index);
    form.setValue('allocations', newAllocations);
  };

  // Auto-calculate remaining value
  const autoCalculateRemaining = () => {
    const sum = allocations.reduce((acc, a) => acc + (a.value || 0), 0);
    const target = mode === 'percentage' ? 100 : totalAmount;
    return Math.max(0, target - sum);
  };

  // Get display label based on mode
  const getValueLabel = () => {
    return mode === 'percentage' ? 'النسبة (%)' : 'المبلغ (ر.س)';
  };

  // Calculate opposite value (for display)
  const getOppositeValue = (value: number) => {
    if (mode === 'percentage') {
      return calculateAmount(value, totalAmount);
    } else {
      return calculatePercentage(value, totalAmount);
    }
  };

  // Getting current sum
  const currentSum = allocations.reduce((acc, a) => acc + (a.value || 0), 0);
  const remaining = autoCalculateRemaining();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          توزيع التكلفة على المشاريع
          {allocations.length > 0 && (
            <Badge variant="secondary">{allocations.length} مشروع</Badge>
          )}
        </CardTitle>
        <CardDescription>
          قم بتحديد المشاريع والنسب/المبالغ المخصصة لكل مشروع
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Bar */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-muted-foreground">المجموع الحالي:</span>{' '}
              <span className="font-semibold">
                {currentSum.toFixed(2)} {mode === 'percentage' ? '%' : 'ر.س'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">المتبقي:</span>{' '}
              <span
                className={`font-semibold ${remaining === 0 ? 'text-green-600' : 'text-orange-600'}`}
              >
                {remaining.toFixed(2)} {mode === 'percentage' ? '%' : 'ر.س'}
              </span>
            </div>
          </div>
          {mode === 'amount' && (
            <div className="text-muted-foreground">
              المبلغ الكلي: {totalAmount.toFixed(2)} ر.س
            </div>
          )}
        </div>

        {/* Allocations List */}
        <div className="space-y-3">
          {allocations.map((allocation, index) => (
            <Card key={index} className="border-2">
              <CardContent className="pt-4">
                <div className="grid gap-4 md:grid-cols-12 items-start">
                  {/* Project Selector - 5 cols */}
                  <div className="md:col-span-5 space-y-2">
                    <Label>
                      المشروع {index + 1}{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <ProjectSelector
                      value={allocation.projectId}
                      onChange={(projectId) =>
                        form.setValue(
                          `allocations.${index}.projectId`,
                          projectId,
                        )
                      }
                      excludeIds={allocations
                        .filter((_, i) => i !== index)
                        .map((a) => a.projectId)}
                      disabled={isLoading}
                    />
                    {form.formState.errors.allocations?.[index]?.projectId && (
                      <p className="text-sm text-destructive">
                        {
                          form.formState.errors.allocations[index]?.projectId
                            ?.message
                        }
                      </p>
                    )}
                  </div>

                  {/* Value Input - 3 cols */}
                  <div className="md:col-span-3 space-y-2">
                    <Label>{getValueLabel()}</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max={mode === 'percentage' ? 100 : undefined}
                        value={allocation.value || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          form.setValue(`allocations.${index}.value`, value);
                        }}
                        disabled={isLoading}
                        className="pr-12"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground text-sm">
                        {mode === 'percentage' ? '%' : 'ر.س'}
                      </div>
                    </div>
                    {/* Display opposite value */}
                    <p className="text-xs text-muted-foreground">
                      ≈{' '}
                      {mode === 'percentage'
                        ? `${getOppositeValue(allocation.value || 0).toFixed(2)} ر.س`
                        : `${getOppositeValue(allocation.value || 0).toFixed(2)}%`}
                    </p>
                  </div>

                  {/* Notes - 3 cols */}
                  <div className="md:col-span-3 space-y-2">
                    <Label>ملاحظات (اختياري)</Label>
                    <Textarea
                      value={allocation.notes || ''}
                      onChange={(e) =>
                        form.setValue(
                          `allocations.${index}.notes`,
                          e.target.value,
                        )
                      }
                      placeholder="أضف ملاحظة..."
                      rows={1}
                      disabled={isLoading}
                      className="resize-none"
                    />
                  </div>

                  {/* Delete Button - 1 col */}
                  <div className="md:col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAllocation(index)}
                      disabled={isLoading || allocations.length <= 2}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleAddAllocation}
          disabled={isLoading}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          إضافة مشروع
        </Button>

        {/* Helper Text */}
        {allocations.length < 2 && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              يجب تحديد مشروعين على الأقل لتوزيع التكلفة. يمكنك إضافة مشاريع
              إضافية حسب الحاجة.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 🔄 Phase 3: Advanced Components (Week 2, Days 1-3)

### **3.1 Allocation Breakdown Card**

**File:** `src/features/finance/cost-allocation/components/AllocationBreakdown/AllocationBreakdownCard.tsx`

```typescript
import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import type { CostAllocationsSummary } from '../../types/allocation.types';

// ============================================================================
// ALLOCATION BREAKDOWN CARD
// ============================================================================

interface AllocationBreakdownCardProps {
  summary: CostAllocationsSummary;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function AllocationBreakdownCard({
  summary,
  onEdit,
  onDelete,
}: AllocationBreakdownCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              تفاصيل التوزيع
              {summary.isValid ? (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  صحيح
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  يوجد أخطاء
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              موزع على {summary.projectCount} مشروع - المبلغ الكلي:{' '}
              {formatCurrency(summary.totalAmount)}
            </CardDescription>
          </div>

          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                تعديل
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" size="sm" onClick={onDelete}>
                حذف التوزيع
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Validation Messages */}
        {summary.validationMessages.length > 0 && (
          <div className="space-y-2">
            {summary.validationMessages.map((msg, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg text-sm text-orange-700 dark:text-orange-300"
              >
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{msg}</p>
              </div>
            ))}
          </div>
        )}

        {/* Allocations List */}
        <div className="space-y-3">
          {summary.allocations.map((allocation) => {
            const percentage = (
              (Number(allocation.allocatedAmount) / summary.totalAmount) *
              100
            ).toFixed(2);

            return (
              <div
                key={allocation.id}
                className="p-4 border rounded-lg space-y-3 hover:bg-accent/50 transition-colors"
              >
                {/* Project Info */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">
                        {allocation.project.name}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {allocation.project.projectCode}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          window.open(
                            `/projects/${allocation.projectId}`,
                            '_blank',
                          )
                        }
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                    {allocation.notes && (
                      <p className="text-sm text-muted-foreground">
                        {allocation.notes}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {formatCurrency(Number(allocation.allocatedAmount))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {percentage}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <Progress value={parseFloat(percentage)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {formatCurrency(Number(allocation.allocatedAmount))} من{' '}
                      {formatCurrency(summary.totalAmount)}
                    </span>
                    <span>{percentage}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">
              {summary.projectCount}
            </div>
            <div className="text-sm text-muted-foreground">مشروع</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalAmount)}
            </div>
            <div className="text-sm text-muted-foreground">المبلغ الكلي</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">100%</div>
            <div className="text-sm text-muted-foreground">موزع</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### **3.2 Update Allocation Dialog**

**File:** `src/features/finance/cost-allocation/components/AllocationActions/UpdateAllocationDialog.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AllocationInputSection } from '../AllocationForm/AllocationInputSection';
import { AllocationSummary } from '../AllocationForm/AllocationSummary';
import {
  allocationFormSchema,
  type AllocationFormData,
} from '../AllocationForm/AllocationFormSchema';
import { useUpdateAllocations, useGetAllocations } from '../../hooks/useAllocations';
import { calculatePercentage, calculateAmount } from '../../utils/allocationValidators';

// ============================================================================
// UPDATE ALLOCATION DIALOG
// ============================================================================

interface UpdateAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costId: string;
  totalAmount: number;
}

export function UpdateAllocationDialog({
  open,
  onOpenChange,
  costId,
  totalAmount,
}: UpdateAllocationDialogProps) {
  const [mode, setMode] = useState<'amount' | 'percentage'>('percentage');

  const { data: summary } = useGetAllocations(costId);
  const updateMutation = useUpdateAllocations(costId);

  const form = useForm<AllocationFormData>({
    resolver: zodResolver(allocationFormSchema),
    defaultValues: {
      mode: 'percentage',
      totalAmount,
      allocations: [],
    },
  });

  // Load existing allocations when dialog opens
  useEffect(() => {
    if (open && summary) {
      const allocations = summary.allocations.map((a) => ({
        projectId: a.projectId,
        value:
          mode === 'percentage'
            ? Number(a.percentage)
            : Number(a.allocatedAmount),
        notes: a.notes || '',
      }));

      form.reset({
        mode,
        totalAmount,
        allocations,
      });
    }
  }, [open, summary, mode, totalAmount, form]);

  // Handle mode change
  const handleModeChange = (newMode: 'amount' | 'percentage') => {
    const currentAllocations = form.getValues('allocations');

    // Convert values
    const convertedAllocations = currentAllocations.map((a) => ({
      ...a,
      value:
        newMode === 'percentage'
          ? calculatePercentage(a.value, totalAmount)
          : calculateAmount(a.value, totalAmount),
    }));

    setMode(newMode);
    form.setValue('mode', newMode);
    form.setValue('allocations', convertedAllocations);
  };

  // Handle submit
  const handleSubmit = async (data: AllocationFormData) => {
    // Convert to API format
    const allocations = data.allocations.map((a) => {
      if (data.mode === 'percentage') {
        return {
          projectId: a.projectId,
          percentage: a.value,
          notes: a.notes,
        };
      } else {
        return {
          projectId: a.projectId,
          amount: a.value,
          notes: a.notes,
        };
      }
    });

    await updateMutation.mutateAsync({ allocations });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل توزيع التكلفة</DialogTitle>
          <DialogDescription>
            قم بتعديل توزيع التكلفة على المشاريع. المبلغ الإجمالي:{' '}
            {totalAmount.toFixed(2)} ر.س
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Mode Toggle */}
          <div className="space-y-3">
            <Label>طريقة التوزيع</Label>
            <RadioGroup
              value={mode}
              onValueChange={(value) =>
                handleModeChange(value as 'amount' | 'percentage')
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="cursor-pointer">
                  نسبة مئوية (%)
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="amount" id="amount" />
                <Label htmlFor="amount" className="cursor-pointer">
                  مبلغ (ر.س)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Allocation Input Section */}
          <AllocationInputSection
            form={form}
            isLoading={updateMutation.isPending}
          />

          {/* Allocation Summary */}
          <AllocationSummary form={form} />

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🎯 Phase 4: Integration & Testing (Week 2, Days 4-5)

### **4.1 Cost Form Integration**

Update existing `ProjectCostForm.tsx` to support allocations:

```typescript
// Add to ProjectCostForm.tsx

const [showAllocationDialog, setShowAllocationDialog] = useState(false);
const [costType, setCostType] = useState<'single' | 'general' | 'allocated'>('single');

// Add radio group for cost type selection
<RadioGroup value={costType} onValueChange={setCostType}>
  <RadioGroupItem value="single">تكلفة مشروع واحد</RadioGroupItem>
  <RadioGroupItem value="general">مصروف عام</RadioGroupItem>
  <RadioGroupItem value="allocated">تكلفة موزعة</RadioGroupItem>
</RadioGroup>

// Conditional rendering
{costType === 'allocated' && (
  <AllocationInputSection form={form} />
)}
```

---

### **4.2 Cost Detail Page Integration**

```typescript
// In CostDetailPage.tsx

const { data: cost } = useGetCost(costId);
const { data: allocations } = useGetAllocations(
  cost?.isAllocated ? costId : undefined
);

return (
  <>
    {/* Basic Cost Info */}
    <CostDetailsCard cost={cost} />

    {/* Show allocation breakdown if cost is allocated */}
    {cost?.isAllocated && allocations && (
      <AllocationBreakdownCard
        summary={allocations}
        onEdit={() => setShowUpdateDialog(true)}
        onDelete={() => setShowDeleteDialog(true)}
      />
    )}

    {/* Show convert button if NOT allocated */}
    {!cost?.isAllocated && cost?.paymentStatus !== 'PAID' && (
      <Button onClick={() => setShowConvertDialog(true)}>
        تحويل إلى تكلفة موزعة
      </Button>
    )}

    {/* Dialogs */}
    <UpdateAllocationDialog ... />
    <ConvertToAllocatedDialog ... />
    <DeleteAllocationDialog ... />
  </>
);
```

---

## 🧪 Phase 5: Testing Strategy (Week 3)

### **5.1 Unit Tests**

```typescript
// allocationValidators.test.ts

describe("validateAllocations", () => {
  it("should reject less than 2 projects", () => {
    const result = validateAllocations(
      [{ projectId: "p1", value: 100 }],
      1000,
      "percentage",
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.minProjects).toBeDefined();
  });

  it("should reject duplicate projects", () => {
    const allocations = [
      { projectId: "p1", value: 50 },
      { projectId: "p1", value: 50 },
    ];
    const result = validateAllocations(allocations, 1000, "percentage");
    expect(result.errors.duplicateProjects).toBeDefined();
  });

  it("should reject percentage sum != 100", () => {
    const allocations = [
      { projectId: "p1", value: 40 },
      { projectId: "p2", value: 50 },
    ];
    const result = validateAllocations(allocations, 1000, "percentage");
    expect(result.errors.sumMismatch).toBeDefined();
  });

  it("should accept valid allocations", () => {
    const allocations = [
      { projectId: "p1", value: 60 },
      { projectId: "p2", value: 40 },
    ];
    const result = validateAllocations(allocations, 1000, "percentage");
    expect(result.isValid).toBe(true);
  });
});
```

---

### **5.2 Integration Tests**

```typescript
// AllocationForm.test.tsx

describe('AllocationForm', () => {
  it('should auto-calculate remaining percentage', () => {
    render(<AllocationForm totalAmount={10000} />);

    // Add first allocation: 60%
    // Add second allocation: 30%
    // Expect remaining: 10%
  });

  it('should convert between modes correctly', () => {
    // Set percentage mode: 60%, 40%
    // Switch to amount mode
    // Expect: 6000, 4000 (if total=10000)
  });

  it('should prevent duplicate projects', () => {
    // Select project A twice
    // Expect validation error
  });
});
```

---

## 📱 Phase 6: UI/UX Polish (Week 3)

### **6.1 Responsive Design**

- Mobile: Stack form fields vertically
- Tablet: 2-column layout
- Desktop: Full grid layout

### **6.2 Loading States**

```typescript
{isLoading && (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="mr-2">جاري التحميل...</span>
  </div>
)}
```

### **6.3 Empty States**

```typescript
{allocations.length === 0 && (
  <div className="text-center p-8 border-2 border-dashed rounded-lg">
    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
    <h3 className="font-semibold mb-2">لا يوجد توزيعات بعد</h3>
    <p className="text-sm text-muted-foreground mb-4">
      قم بإضافة مشروعين على الأقل لبدء التوزيع
    </p>
    <Button onClick={handleAddAllocation}>إضافة أول مشروع</Button>
  </div>
)}
```

---

## ⚡ Performance Optimization

### **7.1 Debouncing**

```typescript
import { useDebouncedCallback } from "use-debounce";

const debouncedValidation = useDebouncedCallback((allocations) => {
  validateAllocations(allocations, totalAmount, mode);
}, 300);
```

### **7.2 Memo & Callbacks**

```typescript
const calculatedValues = useMemo(() => {
  return allocations.map((a) => calculatePercentage(a.value, totalAmount));
}, [allocations, totalAmount]);

const handleValueChange = useCallback(
  (index: number, value: number) => {
    form.setValue(`allocations.${index}.value`, value);
  },
  [form],
);
```

### **7.3 Virtualization**

For large project lists (100+):

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

const virtualizer = useVirtualizer({
  count: projectList.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
});
```

---

## 🔐 Security Considerations

1. **Permission Checks:**

```typescript
const canEditAllocations = hasPermission("finance:write");
const canViewAllocations = hasPermission("finance:read");
```

2. **Input Sanitization:**

```typescript
const sanitizedNotes = DOMPurify.sanitize(notes);
```

3. **API Error Handling:**

```typescript
onError: (error) => {
  if (error.response?.status === 403) {
    toast({ title: "غير مصرح", variant: "destructive" });
  }
};
```

---

## 📝 Maintenance Plan

### **8.1 Documentation**

- Component Storybook stories
- API integration guide
- Troubleshooting guide

### **8.2 Monitoring**

```typescript
// Track allocation creation
analytics.track("allocation_created", {
  projectCount: allocations.length,
  totalAmount,
  mode,
});
```

### **8.3 Future Enhancements**

- [ ] Allocation templates (save common distributions)
- [ ] Bulk allocation update
- [ ] Export allocation reports
- [ ] Allocation history/timeline
- [ ] Smart suggestions based on project budgets

---

## 🎯 Success Metrics

- **Coverage:** 80%+ unit test coverage
- **Performance:** < 100ms form interaction
- **Accessibility:** WCAG 2.1 AA compliant
- **User Satisfaction:** < 3 clicks to complete allocation

---

## 📚 Resources

**Documentation:**

- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [TanStack Query](https://tanstack.com/query)
- [Shadcn/ui Components](https://ui.shadcn.com/)

**Backend API Reference:**

- See: `erp-backend-v1/docs/api/COST_ALLOCATION_API.md`

---

## 🚀 Getting Started

```bash
# 1. Create feature branch
git checkout -b feature/cost-allocation-ui

# 2. Create folder structure
mkdir -p src/features/finance/cost-allocation/{components,hooks,types,utils,api}

# 3. Start with types
# Copy types from this plan → allocation.types.ts

# 4. Build bottom-up
# API → Hooks → Utils → Components → Integration

# 5. Test incrementally
npm run test -- --watch

# 6. Review & merge
git push origin feature/cost-allocation-ui
```

---

**Ready to code! 🎨**
