import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { CostType, PaymentStatus } from '@prisma/client';
import { CostAllocationResponseDto } from './cost-allocation-response.dto';

/**
 * Response DTO for project cost
 * Now supports 3 types: Single Project, General Expense, Allocated Cost
 */
export class ProjectCostResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Project ID (null for general expenses and allocated costs)',
  })
  projectId?: string;

  @ApiProperty({
    example: false,
    description: 'True if cost is allocated across multiple projects',
  })
  isAllocated: boolean;

  @ApiProperty({ enum: CostType, example: CostType.MATERIAL })
  costType: CostType;

  @ApiPropertyOptional({ example: 'Employee' })
  referenceType?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  referenceId?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  categoryId?: string;

  @ApiProperty({ example: 15000.5, description: 'Precise decimal amount' })
  amount: number;

  @ApiProperty({
    example: 13043.48,
    description: 'Cost amount before tax',
  })
  amountBeforeTax: number;

  @ApiProperty({
    example: 15,
    description: 'Tax rate percentage',
  })
  taxRate: number;

  @ApiProperty({
    example: 1956.52,
    description: 'Computed tax amount',
  })
  taxAmount: number;

  @ApiProperty({ example: 'SAR' })
  currency: string;

  @ApiProperty({ example: '2024-01-15T00:00:00Z' })
  transactionDate: Date;

  @ApiProperty({ example: 'Purchase of construction materials for Phase 1' })
  description: string;

  @ApiPropertyOptional({ example: 'INV-2024-001' })
  invoiceNumber?: string;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @ApiPropertyOptional({ example: '2024-01-20T00:00:00Z' })
  paidDate?: Date;

  @ApiPropertyOptional({ example: 'Bank Transfer' })
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'TXN-2024-001' })
  paymentReference?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  approvedBy?: string;

  @ApiPropertyOptional({ example: '2024-01-16T10:30:00Z' })
  approvedAt?: Date;

  @ApiPropertyOptional({ example: 'Budget exceeded' })
  rejectedReason?: string;

  @ApiPropertyOptional({ example: 'Approved by project manager' })
  notes?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  createdBy: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;

  @ApiProperty({
    example: 7,
    description: 'Optimistic concurrency row version',
  })
  rowVersion: number;

  // Relations (optional, populated when requested)
  @ApiPropertyOptional({ description: 'Project details' })
  project?: any;

  @ApiPropertyOptional({ description: 'Cost category details' })
  category?: any;

  @ApiPropertyOptional({ description: 'Creator user details' })
  creator?: any;

  @ApiPropertyOptional({ description: 'Approver user details' })
  approver?: any;

  @ApiPropertyOptional({
    description: 'Cost allocations (for allocated costs only)',
    type: [CostAllocationResponseDto],
  })
  allocations?: CostAllocationResponseDto[];
}

/**
 * Response DTO for list of project costs with pagination
 */
export class ProjectCostListResponseDto {
  @ApiProperty({ type: [ProjectCostResponseDto] })
  data: ProjectCostResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

/**
 * DTO for approving a project cost
 */
export class ApproveProjectCostDto {
  @ApiPropertyOptional({
    description: 'Optional notes about the approval',
    example: 'Approved within budget',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description:
      'Current row version for optimistic concurrency control. If stale, approval fails with 409.',
    example: 3,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  rowVersion?: number;
}

/**
 * DTO for rejecting a project cost
 */
export class RejectProjectCostDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Budget exceeded',
  })
  @IsString()
  rejectedReason: string;

  @ApiPropertyOptional({
    description:
      'Current row version for optimistic concurrency control. If stale, rejection fails with 409.',
    example: 3,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  rowVersion?: number;
}

// ========== Summary Sub-DTOs ==========

export class CostTypeBreakdownItem {
  @ApiProperty({ enum: CostType })
  costType: CostType;

  @ApiProperty({ example: 50000 })
  totalAmount: number;

  @ApiProperty({ example: 5 })
  count: number;

  @ApiProperty({ example: 33.3 })
  percentage: number;
}

export class CategoryBreakdownItem {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  categoryId: string;

  @ApiProperty({ example: 'مواد بناء' })
  categoryName: string;

  @ApiProperty({ example: 45000 })
  totalAmount: number;

  @ApiProperty({ example: 8 })
  count: number;

  @ApiProperty({ example: 30.0 })
  percentage: number;
}

export class MonthlyTrendItem {
  @ApiProperty({ example: '2026-01', description: 'Month in YYYY-MM format' })
  month: string;

  @ApiProperty({ example: 25000 })
  totalAmount: number;

  @ApiProperty({ example: 12 })
  count: number;
}

/**
 * Response DTO for project cost summary/statistics
 * Includes budget tracking, status breakdowns, and analytics
 */
export class ProjectCostSummaryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  projectId: string;

  // ========== BUDGET TRACKING ==========
  @ApiPropertyOptional({
    example: 450000000,
    description: 'Project budget (null if not set)',
  })
  budget: number | null;

  @ApiPropertyOptional({
    example: 330000000,
    description: 'Remaining budget (budget - totalAmount)',
  })
  remainingBudget: number | null;

  @ApiPropertyOptional({
    example: 26.7,
    description: 'Budget utilization percentage',
  })
  budgetUtilization: number | null;

  // ========== AMOUNTS BY STATUS ==========
  @ApiProperty({ example: 120000000, description: 'Total of all costs' })
  totalAmount: number;

  @ApiProperty({ example: 25000, description: 'Total pending amount' })
  pendingAmount: number;

  @ApiProperty({ example: 50000, description: 'Total approved amount' })
  approvedAmount: number;

  @ApiProperty({ example: 40000, description: 'Total paid amount' })
  paidAmount: number;

  @ApiProperty({ example: 5000, description: 'Total rejected amount' })
  rejectedAmount: number;

  @ApiProperty({ example: 0, description: 'Total partially paid amount' })
  partiallyPaidAmount: number;

  @ApiProperty({ example: 0, description: 'Total overdue amount' })
  overdueAmount: number;

  // ========== COUNTS ==========
  @ApiProperty({ example: 45, description: 'Total number of cost entries' })
  totalCount: number;

  @ApiProperty({ example: 10 })
  pendingCount: number;

  @ApiProperty({ example: 15 })
  approvedCount: number;

  @ApiProperty({ example: 18 })
  paidCount: number;

  @ApiProperty({ example: 2 })
  rejectedCount: number;

  // ========== BREAKDOWNS ==========
  @ApiProperty({
    type: [CostTypeBreakdownItem],
    description: 'Breakdown by cost type',
  })
  costTypeBreakdown: CostTypeBreakdownItem[];

  @ApiProperty({
    type: [CategoryBreakdownItem],
    description: 'Breakdown by category',
  })
  categoryBreakdown: CategoryBreakdownItem[];

  @ApiProperty({
    type: [MonthlyTrendItem],
    description: 'Monthly cost trend (last 12 months)',
  })
  monthlyTrend: MonthlyTrendItem[];

  @ApiProperty({ example: 'SAR' })
  currency: string;
}
