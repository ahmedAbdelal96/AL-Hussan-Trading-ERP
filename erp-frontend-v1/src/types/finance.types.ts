/**
 * Finance Module Types
 *
 * Type definitions for the Finance module matching backend exactly.
 * Includes: Cost Categories, Project Costs, Enums, DTOs, and API responses.
 *
 * Backend Reference:
 * - Entity: src/application/modules/finance/entities/
 * - DTOs: src/application/modules/finance/dto/
 * - Enums: prisma/schema.prisma (CostType, PaymentStatus)
 *
 * @module finance.types
 */

import { CURRENCY } from "@/config/system.constants";

// ============================================================================
// ENUMS - Matching Prisma Schema exactly
// ============================================================================

/**
 * Cost Type Enum
 * Represents different types of project costs
 * Backend: prisma/schema.prisma - enum CostType
 */
export enum CostType {
  MAINTENANCE = "MAINTENANCE",
  PURCHASE = "PURCHASE",
  SALARY = "SALARY",
  ALLOWANCE = "ALLOWANCE",
  FUEL = "FUEL",
  MATERIAL = "MATERIAL",
  EQUIPMENT_RENTAL = "EQUIPMENT_RENTAL",
  SUBCONTRACTOR = "SUBCONTRACTOR",
  UTILITY = "UTILITY",
  TRANSPORTATION = "TRANSPORTATION",
  INSURANCE = "INSURANCE",
  TAX = "TAX",
  OTHER = "OTHER",
}

/**
 * Payment Status Enum
 * Represents the payment workflow status
 * Backend: prisma/schema.prisma - enum PaymentStatus
 */
export enum PaymentStatus {
  PENDING = "PENDING", // Waiting for approval
  APPROVED = "APPROVED", // Approved but not paid yet
  PAID = "PAID", // Fully paid
  REJECTED = "REJECTED", // Rejected by approver
  PARTIALLY_PAID = "PARTIALLY_PAID", // Partially paid
  OVERDUE = "OVERDUE", // Payment overdue
}

// ============================================================================
// COST CATEGORY TYPES
// ============================================================================

/**
 * Cost Category Entity
 * Represents a hierarchical cost category (e.g., "Materials" > "Construction Materials" > "Cement")
 * Backend: src/application/modules/finance/entities/cost-category.entity.ts
 */
export interface CostCategoryEntity {
  id: string;
  name: string; // Category name (required, max 100)
  description?: string; // Category description
  parentId?: string; // Parent category ID for hierarchy
  isActive: boolean; // Active/Inactive status
  rowVersion: number;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp

  // Relations (populated when included)
  parent?: CostCategoryEntity; // Parent category
  children?: CostCategoryEntity[]; // Subcategories
}

/**
 * Create Cost Category DTO
 * Backend: src/application/modules/finance/dto/create-cost-category.dto.ts
 */
export interface CreateCostCategoryDto {
  name: string; // Required, max 100
  description?: string; // Optional
  parentId?: string; // Optional - for creating subcategories
  isActive?: boolean; // Optional, default: true
}

/**
 * Update Cost Category DTO
 * Backend: src/application/modules/finance/dto/update-cost-category.dto.ts
 */
export interface UpdateCostCategoryDto {
  name?: string; // Optional, max 100
  description?: string; // Optional
  parentId?: string; // Optional
  isActive?: boolean; // Optional
  rowVersion?: number;
}

/**
 * Cost Category Filters DTO
 * Backend: src/application/modules/finance/dto/cost-category-filters.dto.ts
 */
export interface CostCategoryFiltersDto {
  page?: number; // Page number (default: 1, min: 1)
  limit?: number; // Items per page (default: 10, min: 1, max: 100)
  search?: string; // Search by name or description
  isActive?: boolean; // Filter by active status
  parentId?: string; // Filter by parent category
  rootOnly?: boolean; // Show only root categories (no parent)
  includeChildren?: boolean; // Include children in response
  sortBy?: "name" | "createdAt" | "updatedAt"; // Sort by field
  sortOrder?: "asc" | "desc"; // Sort order
}

/**
 * Cost Category List Response
 * Backend: Paginated response wrapper
 */
export interface CostCategoryListResponse {
  data: CostCategoryEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// PROJECT COST TYPES
// ============================================================================

/**
 * Project Cost Entity
 * Represents a financial cost entry for a project with approval workflow
 * Backend: src/application/modules/finance/entities/project-cost.entity.ts
 */
export interface ProjectCostEntity {
  id: string;
  projectId?: string | null; // Reference to project (can be null for allocated costs)

  // Polymorphic reference - can link to any entity (Employee, Asset, Vendor, etc.)
  costType: CostType; // Type of cost (MATERIAL, SALARY, etc.)
  referenceType?: string; // e.g., "Employee", "Asset", "Vendor"
  referenceId?: string; // UUID of the referenced entity

  // Cost allocation (for distributed costs)
  isAllocated?: boolean; // True if cost is distributed across multiple projects
  allocations?: CostAllocationEntity[]; // Populated when included

  // Cost details
  categoryId?: string; // Reference to cost category
  amount: number; // Final cost amount (tax-inclusive total)
  amountBeforeTax: number; // Net amount before tax
  taxRate: number; // Tax rate percentage
  taxAmount: number; // Tax amount derived from final amount
  currency: string; // Currency code (default: "SAR")

  // Transaction details
  transactionDate: string; // ISO date (yyyy-MM-dd format)
  description: string; // Cost description (required)
  descriptionAr?: string; // Arabic description (optional)
  invoiceNumber?: string; // Invoice reference number

  // Payment tracking
  paymentStatus: PaymentStatus; // Current payment status
  paidDate?: string; // ISO date when payment was made
  paymentMethod?: string; // e.g., "Bank Transfer", "Cash", "Check"
  paymentReference?: string; // Transaction ID or check number

  // Approval workflow
  approvedBy?: string; // User ID who approved
  approvedAt?: string; // ISO timestamp of approval
  rejectedReason?: string; // Reason for rejection

  notes?: string; // Additional notes

  // Audit fields
  createdBy: string; // User ID who created
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  rowVersion: number;

  // Relations (populated when included)
  category?: CostCategoryEntity;
  project?: {
    id: string;
    projectCode?: string;
    name: string;
    status?: string;
  } | null;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
}

/**
 * Cost Allocation Input DTO
 * Used when creating allocated costs
 * Supports either amount OR percentage (not both)
 */
export interface CostAllocationInputDto {
  projectId: string; // Required - UUID
  amount?: number; // Optional - use either amount OR percentage
  percentage?: number; // Optional - use either amount OR percentage (0-100)
  notes?: string; // Optional - notes for this allocation
}

/**
 * Create Project Cost DTO
 * Backend: src/application/modules/finance/dto/create-project-cost.dto.ts
 *
 * Supports 3 types of costs:
 * 1. Single Project Cost: Provide projectId only
 * 2. Allocated Cost: Provide allocations array (minimum 2 projects)
 * 3. General Expense: Don't provide projectId or allocations
 */
export interface CreateProjectCostDto {
  projectId?: string; // Optional - UUID (for single project costs only)
  costType: CostType; // Required - enum value

  // Polymorphic reference (optional)
  referenceType?: string; // Optional, max 100
  referenceId?: string; // Optional - UUID

  // Cost details
  categoryId?: string; // Optional - UUID
  amount: number; // Required, min: 0, max decimal places: 2
  taxRate?: number; // Optional, min: 0, max: 100

  // Transaction details
  transactionDate: string; // Required - ISO date string (yyyy-MM-dd)
  description: string; // Required
  invoiceNumber?: string; // Optional, max 100

  // Payment details (optional)
  paymentMethod?: string; // Optional, max 50
  paymentReference?: string; // Optional, max 100

  // Allocations (for multi-project costs)
  allocations?: CostAllocationInputDto[]; // Optional - for allocated costs (min 2 projects)
}

/**
 * Update Project Cost DTO
 * Backend: src/application/modules/finance/dto/update-project-cost.dto.ts
 */
export interface UpdateProjectCostDto {
  projectId?: string;
  costType?: CostType;
  referenceType?: string;
  referenceId?: string;
  categoryId?: string;
  amount?: number;
  taxRate?: number;
  transactionDate?: string;
  description?: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  paymentReference?: string;
  rowVersion?: number;
  // Note: Payment status and approval fields are updated via separate endpoints
}

/**
 * Project Cost Filters DTO
 * Backend: src/application/modules/finance/dto/project-cost-filters.dto.ts
 */
export interface ProjectCostFiltersDto {
  page?: number; // Page number (default: 1, min: 1)
  limit?: number; // Items per page (default: 10, min: 1, max: 100)
  search?: string; // Search by description, invoice number
  projectId?: string; // Filter by specific project
  costType?: CostType; // Filter by cost type
  categoryId?: string; // Filter by category
  paymentStatus?: PaymentStatus | string; // Filter by payment status
  isAllocated?: boolean; // Legacy compatibility for allocated-cost pages
  referenceType?: string; // Filter by reference type
  referenceId?: string; // Filter by reference ID
  dateFrom?: string; // Filter from transaction date (ISO date)
  dateTo?: string; // Filter to transaction date (ISO date)
  minAmount?: number; // Filter by minimum amount
  maxAmount?: number; // Filter by maximum amount
  createdBy?: string; // Filter by creator
  approvedBy?: string; // Filter by approver
  sortBy?: "transactionDate" | "amount" | "createdAt" | "updatedAt"; // Sort by field
  sortOrder?: "asc" | "desc"; // Sort order (default: 'desc')
}

/**
 * Project Cost List Response
 * Backend: Paginated response wrapper
 */
export interface ProjectCostListResponse {
  data: ProjectCostEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Approve Project Cost DTO
 * Backend: src/application/modules/finance/dto/approve-project-cost.dto.ts
 */
export interface ApproveProjectCostDto {
  notes?: string; // Optional approval notes
  paidDate?: string; // Optional - ISO date if marking as paid
  paymentMethod?: string; // Optional - payment method if paid
  paymentReference?: string; // Optional - payment reference if paid
  rowVersion?: number;
}

/**
 * Reject Project Cost DTO
 * Backend: src/application/modules/finance/dto/reject-project-cost.dto.ts
 */
export interface RejectProjectCostDto {
  rejectedReason: string; // Required - reason for rejection
  rowVersion?: number;
}

// ============================================================================
// PROJECT COST SUMMARY TYPES
// ============================================================================

/**
 * Project Cost Summary
 * Aggregated cost statistics for a specific project
 * Backend: Computed from GetProjectCostSummaryUseCase
 */
export interface ProjectCostSummary {
  projectId: string;

  // Budget tracking
  budget: number | null;
  remainingBudget: number | null;
  budgetUtilization: number | null; // Percentage (0-100+)

  // Total amounts by status
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  rejectedAmount: number;
  partiallyPaidAmount: number;
  overdueAmount: number;

  // Counts by status
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  paidCount: number;
  rejectedCount: number;

  // Breakdown by cost type
  costTypeBreakdown: {
    costType: CostType;
    totalAmount: number;
    count: number;
    percentage: number;
  }[];

  // Breakdown by category
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    totalAmount: number;
    count: number;
    percentage: number;
  }[];

  // Monthly trend data (last 12 months)
  monthlyTrend: {
    month: string; // Format: "2026-01"
    totalAmount: number;
    count: number;
  }[];

  currency: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Cost Type Option
 * For rendering select dropdowns
 */
export interface CostTypeOption {
  value: CostType;
  label: string; // English label
  labelAr: string; // Arabic label
  icon?: string; // Icon name (lucide-react)
  color?: string; // Color class
}

/**
 * Payment Status Option
 * For rendering select dropdowns and badges
 */
export interface PaymentStatusOption {
  value: PaymentStatus;
  label: string;
  labelAr: string;
  color: "default" | "warning" | "success" | "destructive" | "secondary";
  icon?: string;
}

/**
 * Category Tree Node
 * For rendering hierarchical category tree
 */
export interface CategoryTreeNode extends CostCategoryEntity {
  children?: CategoryTreeNode[];
  level: number; // Depth level in tree (0 = root)
  hasChildren: boolean; // Whether has subcategories
  isExpanded?: boolean; // UI state for tree expansion
  isSelected?: boolean; // UI state for selection
}

// ============================================================================
// FORM VALIDATION SCHEMAS (for reference)
// ============================================================================

/**
 * Validation constraints matching backend
 * Use these with Zod schemas in form components
 */
export const FINANCE_VALIDATION = {
  CATEGORY: {
    NAME_MAX: 100,
  },
  COST: {
    DESCRIPTION_REQUIRED: true,
    DESCRIPTION_MAX: 500,
    AMOUNT_MIN: 0,
    AMOUNT_DECIMAL_PLACES: 2,
    CURRENCY_MAX: 3,
    CURRENCY_DEFAULT: CURRENCY.DEFAULT,
    INVOICE_NUMBER_MAX: 100,
    PAYMENT_METHOD_MAX: 50,
    PAYMENT_REFERENCE_MAX: 100,
    REFERENCE_TYPE_MAX: 100,
  },
} as const;

// ============================================================================
// STATISTICS & ANALYTICS TYPES
// ============================================================================

/**
 * Monthly Trend Data Point
 */
export interface MonthlyTrendDto {
  month: string; // e.g., "Jan 2026"
  amount: number;
  count: number;
}

/**
 * Status Breakdown Item
 */
export interface StatusBreakdownDto {
  status: PaymentStatus;
  count: number;
  amount: number;
  percentage: number;
}

/**
 * Cost Type Breakdown Item
 */
export interface CostTypeBreakdownDto {
  type: CostType;
  amount: number;
  count: number;
  percentage: number;
}

/**
 * Category Breakdown Item
 */
export interface CategoryBreakdownDto {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
}

/**
 * Top Project by Cost
 */
export interface TopProjectDto {
  projectId: string;
  projectName: string;
  totalCost: number;
  costCount: number;
  dominantStatus: PaymentStatus;
}

/**
 * Finance Statistics Response
 * Complete analytics data for dashboard
 */
export interface FinanceStatisticsDto {
  // Overview Numbers
  totalCosts: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  rejectedAmount: number;
  totalEntries: number;

  // Breakdowns
  statusBreakdown: StatusBreakdownDto[];
  costTypeBreakdown: CostTypeBreakdownDto[];
  categoryBreakdown: CategoryBreakdownDto[];

  // Trends
  monthlyTrend: MonthlyTrendDto[];
  topProjects: TopProjectDto[];

  // Recent Activity
  recentCosts: number;
  growthRate: number;
  averageCost: number;

  // Metadata
  currency: string;
  calculatedAt: string;
}

// ============================================================================
// COST ALLOCATION TYPES
// ============================================================================

/**
 * Cost Allocation Entity
 * Represents distributed cost allocation to specific projects
 */
export interface CostAllocationEntity {
  id: string;
  costId: string;
  projectId: string;
  allocatedAmount: number;
  percentage: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Relations (populated when included)
  cost?: ProjectCostEntity;
  project?: {
    id: string;
    projectCode?: string;
    name: string;
    status?: string;
  };
}

/**
 * Create Cost Allocation DTO
 * Used for creating individual allocations
 */
export interface CreateCostAllocationDto {
  projectId: string;
  amount?: number; // Optional - use either amount OR percentage
  percentage?: number; // Optional - use either amount OR percentage (0-100)
  notes?: string;
}

/**
 * Update Cost Allocation DTO
 */
export interface UpdateCostAllocationDto {
  amount?: number;
  notes?: string;
}

/**
 * Convert to Allocated Cost DTO
 * Used to convert a regular cost to an allocated cost
 */
export interface ConvertToAllocatedDto {
  allocations: CreateCostAllocationDto[];
}

/**
 * Cost Allocation Filters DTO
 */
export interface CostAllocationFiltersDto {
  page?: number;
  limit?: number;
  costId?: string;
  projectId?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: "amount" | "percentage" | "createdAt";
  sortOrder?: "asc" | "desc";
}

/**
 * Cost Allocation List Response
 */
export interface CostAllocationListResponse {
  items: CostAllocationEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
