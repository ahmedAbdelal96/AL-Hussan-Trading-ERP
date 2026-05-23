/**
 * ============================================================================
 * FINANCE REPORTS - RESPONSE DTOs
 * ============================================================================
 *
 * Defines all response structures for Finance Reports endpoints.
 * These DTOs ensure type-safety and provide clear API contracts for Frontend.
 *
 * Design Principles:
 * - Frontend-friendly structure (easy to consume in React components)
 * - Includes metadata for better UX (percentages, trends, formatting hints)
 * - Nullable fields properly typed (for TypeScript safety)
 * - Consistent naming conventions
 * - Rich Swagger documentation
 *
 * @module FinanceReportsResponses
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CostType, PaymentStatus } from '@prisma/client';

/**
 * ============================================================================
 * OVERVIEW REPORT RESPONSE
 * ============================================================================
 */

/**
 * Finance Overview Response
 *
 * High-level KPIs for dashboard cards.
 * Designed for quick insights and summary displays.
 *
 * Frontend Use Case:
 * - Dashboard KPI cards
 * - Summary widgets
 * - Quick stats display
 */
export class FinanceOverviewResponseDto {
  @ApiProperty({
    description: 'Total costs amount',
    example: 1250000,
    type: Number,
  })
  totalCosts: number;

  @ApiProperty({
    description: 'Total number of cost entries',
    example: 450,
    type: Number,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Average cost per entry',
    example: 2777.78,
    type: Number,
  })
  averageCost: number;

  @ApiProperty({
    description: 'Amount in PENDING status',
    example: 150000,
    type: Number,
  })
  pendingAmount: number;

  @ApiProperty({
    description: 'Number of PENDING entries',
    example: 45,
    type: Number,
  })
  pendingCount: number;

  @ApiProperty({
    description: 'Amount in APPROVED status',
    example: 200000,
    type: Number,
  })
  approvedAmount: number;

  @ApiProperty({
    description: 'Number of APPROVED entries',
    example: 50,
    type: Number,
  })
  approvedCount: number;

  @ApiProperty({
    description: 'Amount in PAID status',
    example: 850000,
    type: Number,
  })
  paidAmount: number;

  @ApiProperty({
    description: 'Number of PAID entries',
    example: 250,
    type: Number,
  })
  paidCount: number;

  @ApiProperty({
    description: 'Amount in OVERDUE status',
    example: 50000,
    type: Number,
  })
  overdueAmount: number;

  @ApiProperty({
    description: 'Number of OVERDUE entries',
    example: 15,
    type: Number,
  })
  overdueCount: number;

  @ApiProperty({
    description: 'Amount in REJECTED status',
    example: 25000,
    type: Number,
  })
  rejectedAmount: number;

  @ApiProperty({
    description: 'Number of REJECTED entries',
    example: 8,
    type: Number,
  })
  rejectedCount: number;

  @ApiProperty({
    description: 'Amount in PARTIALLY_PAID status',
    example: 30000,
    type: Number,
  })
  partiallyPaidAmount: number;

  @ApiProperty({
    description: 'Number of PARTIALLY_PAID entries',
    example: 10,
    type: Number,
  })
  partiallyPaidCount: number;

  @ApiProperty({
    description: 'Month-over-month growth rate (%)',
    example: 12.5,
    type: Number,
  })
  monthGrowthRate: number;

  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'SAR',
    default: 'SAR',
  })
  currency: string;

  @ApiProperty({
    description: 'Report generation timestamp',
    example: '2026-01-19T21:30:00Z',
    type: Date,
  })
  generatedAt: Date;
}

/**
 * ============================================================================
 * COSTS BY TYPE REPORT RESPONSE
 * ============================================================================
 */

/**
 * Single Cost Type Breakdown Item
 *
 * Represents one cost type in the breakdown.
 */
export class CostTypeBreakdownItemDto {
  @ApiProperty({
    description: 'Cost type',
    enum: CostType,
    example: 'SALARY',
  })
  costType: CostType;

  @ApiProperty({
    description: 'Cost type display name (English)',
    example: 'Salary',
  })
  costTypeName: string;

  @ApiProperty({
    description: 'Total amount for this cost type',
    example: 500000,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'Number of entries for this cost type',
    example: 120,
    type: Number,
  })
  count: number;

  @ApiProperty({
    description: 'Percentage of total costs',
    example: 40.0,
    type: Number,
  })
  percentage: number;

  @ApiProperty({
    description: 'Average amount per transaction',
    example: 4166.67,
    type: Number,
  })
  avgPerTransaction: number;
}

/**
 * Costs by Type Response
 *
 * Breakdown of costs by their type (SALARY, FUEL, etc.)
 * Sorted by amount (descending) for easy visualization.
 *
 * Frontend Use Case:
 * - Pie charts
 * - Bar charts
 * - Breakdown tables
 */
export class CostsByTypeResponseDto {
  @ApiProperty({
    description: 'Breakdown by cost type (sorted by amount desc)',
    type: [CostTypeBreakdownItemDto],
  })
  breakdown: CostTypeBreakdownItemDto[];

  @ApiProperty({
    description: 'Total amount across all types',
    example: 1250000,
    type: Number,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Total number of entries',
    example: 450,
    type: Number,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'SAR',
  })
  currency: string;

  @ApiProperty({
    description: 'Report generation timestamp',
    type: Date,
  })
  generatedAt: Date;
}

/**
 * ============================================================================
 * COSTS BY PAYMENT STATUS REPORT RESPONSE
 * ============================================================================
 */

/**
 * Single Payment Status Breakdown Item
 */
export class PaymentStatusBreakdownItemDto {
  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: 'PAID',
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Status display name (English)',
    example: 'Paid',
  })
  statusName: string;

  @ApiProperty({
    description: 'Total amount for this status',
    example: 850000,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'Number of entries for this status',
    example: 250,
    type: Number,
  })
  count: number;

  @ApiProperty({
    description: 'Percentage of total costs',
    example: 68.0,
    type: Number,
  })
  percentage: number;
}

/**
 * Costs by Payment Status Response
 *
 * Frontend Use Case:
 * - Donut charts
 * - Status distribution widgets
 * - Payment tracking dashboards
 */
export class CostsByPaymentStatusResponseDto {
  @ApiProperty({
    description: 'Breakdown by payment status',
    type: [PaymentStatusBreakdownItemDto],
  })
  breakdown: PaymentStatusBreakdownItemDto[];

  @ApiProperty({
    description: 'Total amount across all statuses',
    example: 1250000,
    type: Number,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Total number of entries',
    example: 450,
    type: Number,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'SAR',
  })
  currency: string;

  @ApiProperty({
    description: 'Report generation timestamp',
    type: Date,
  })
  generatedAt: Date;
}

/**
 * ============================================================================
 * MONTHLY TREND REPORT RESPONSE
 * ============================================================================
 */

/**
 * Single Month Data Point
 *
 * Represents one month in the time series.
 */
export class MonthDataPointDto {
  @ApiProperty({
    description: 'Month in YYYY-MM format',
    example: '2026-01',
  })
  month: string;

  @ApiProperty({
    description: 'Month display name (e.g., "Jan 2026")',
    example: 'Jan 2026',
  })
  monthName: string;

  @ApiProperty({
    description: 'Total amount for this month',
    example: 95000,
    type: Number,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Number of cost entries for this month',
    example: 35,
    type: Number,
  })
  count: number;

  @ApiProperty({
    description: 'Average cost per entry for this month',
    example: 2714.29,
    type: Number,
  })
  avgCost: number;
}

/**
 * Monthly Trend Response
 *
 * Time-series data for line/area charts.
 * Months are ordered chronologically (oldest to newest).
 *
 * Frontend Use Case:
 * - Line charts
 * - Area charts
 * - Trend analysis
 */
export class MonthlyTrendResponseDto {
  @ApiProperty({
    description: 'Monthly data points (chronological order)',
    type: [MonthDataPointDto],
  })
  data: MonthDataPointDto[];

  @ApiProperty({
    description: 'Total amount across all months',
    example: 1250000,
    type: Number,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Total count across all months',
    example: 450,
    type: Number,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Average per month',
    example: 104166.67,
    type: Number,
  })
  avgPerMonth: number;

  @ApiProperty({
    description: 'Trend direction (up, down, neutral)',
    example: 'up',
    enum: ['up', 'down', 'neutral'],
  })
  trend: 'up' | 'down' | 'neutral';

  @ApiProperty({
    description: 'Currency code',
    example: 'SAR',
  })
  currency: string;

  @ApiProperty({
    description: 'Report generation timestamp',
    type: Date,
  })
  generatedAt: Date;
}

/**
 * ============================================================================
 * COSTS BY CATEGORY REPORT RESPONSE
 * ============================================================================
 */

/**
 * Single Category Breakdown Item
 */
export class CategoryBreakdownItemDto {
  @ApiProperty({
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  categoryId: string;

  @ApiProperty({
    description: 'Category name (English)',
    example: 'Vehicle Maintenance',
  })
  categoryName: string;

  @ApiProperty({
    description: 'Total amount for this category',
    example: 150000,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'Number of entries for this category',
    example: 45,
    type: Number,
  })
  count: number;

  @ApiProperty({
    description: 'Percentage of total costs',
    example: 12.0,
    type: Number,
  })
  percentage: number;
}

/**
 * Costs by Category Response
 *
 * Frontend Use Case:
 * - Horizontal bar charts
 * - Category breakdown tables
 * - Budget allocation analysis
 */
export class CostsByCategoryResponseDto {
  @ApiProperty({
    description: 'Breakdown by category (sorted by amount desc)',
    type: [CategoryBreakdownItemDto],
  })
  breakdown: CategoryBreakdownItemDto[];

  @ApiProperty({
    description: 'Total amount across all categories',
    example: 1250000,
    type: Number,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Total number of entries',
    example: 450,
    type: Number,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'SAR',
  })
  currency: string;

  @ApiProperty({
    description: 'Report generation timestamp',
    type: Date,
  })
  generatedAt: Date;
}

/**
 * ============================================================================
 * TOP PROJECTS REPORT RESPONSE
 * ============================================================================
 */

/**
 * Single Project Cost Summary
 */
export class ProjectCostSummaryDto {
  @ApiProperty({
    description: 'Project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  projectId: string;

  @ApiProperty({
    description: 'Project name',
    example: 'Al-Noor Tower Construction',
  })
  projectName: string;

  @ApiProperty({
    description: 'Total cost for this project',
    example: 450000,
    type: Number,
  })
  totalCost: number;

  @ApiProperty({
    description: 'Number of cost entries',
    example: 85,
    type: Number,
  })
  costCount: number;

  @ApiProperty({
    description: 'Amount paid',
    example: 300000,
    type: Number,
  })
  paidAmount: number;

  @ApiProperty({
    description: 'Amount pending',
    example: 100000,
    type: Number,
  })
  pendingAmount: number;

  @ApiProperty({
    description: 'Amount approved',
    example: 50000,
    type: Number,
  })
  approvedAmount: number;

  @ApiProperty({
    description: 'Percentage of total costs',
    example: 36.0,
    type: Number,
  })
  percentage: number;
}

/**
 * Costs by Project Response
 *
 * Paginated full list of all projects with cost breakdown.
 * Sorted by total cost descending.
 */
export class TopProjectsResponseDto {
  @ApiProperty({
    description: 'Projects for current page (sorted by total cost desc)',
    type: [ProjectCostSummaryDto],
  })
  projects: ProjectCostSummaryDto[];

  @ApiProperty({
    description:
      'Total amount across ALL matching projects (not just this page)',
    example: 1250000,
    type: Number,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Total number of matching projects (for pagination)',
    example: 63,
    type: Number,
  })
  totalProjects: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'SAR',
  })
  currency: string;

  @ApiProperty({
    description: 'Pagination metadata',
  })
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  @ApiProperty({
    description: 'Report generation timestamp',
    type: Date,
  })
  generatedAt: Date;
}

/**
 * ============================================================================
 * PENDING APPROVALS REPORT RESPONSE
 * ============================================================================
 */

/**
 * Single Pending Cost Detail
 *
 * Detailed information for one pending approval.
 */
export class PendingCostDetailDto {
  @ApiProperty({
    description: 'Cost ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Project name',
    example: 'Al-Noor Tower',
  })
  projectName: string;

  @ApiProperty({
    description: 'Cost type',
    enum: CostType,
    example: 'MAINTENANCE',
  })
  costType: CostType;

  @ApiProperty({
    description: 'Cost type display name',
    example: 'Maintenance',
  })
  costTypeName: string;

  @ApiProperty({
    description: 'Cost amount',
    example: 5000,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'Cost description',
    example: 'Vehicle repair - Engine overhaul',
  })
  description: string;

  @ApiProperty({
    description: 'Transaction date',
    example: '2026-01-10',
    type: Date,
  })
  transactionDate: Date;

  @ApiPropertyOptional({
    description: 'Invoice number',
    example: 'INV-2026-001',
  })
  invoiceNumber?: string;

  @ApiProperty({
    description: 'Number of days waiting for approval',
    example: 9,
    type: Number,
  })
  daysWaiting: number;

  @ApiProperty({
    description: 'Created by user name',
    example: 'Ahmed Mohamed',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2026-01-10T10:30:00Z',
    type: Date,
  })
  createdAt: Date;
}

/**
 * Pending Approvals Summary
 */
export class PendingApprovalsSummaryDto {
  @ApiProperty({
    description: 'Total pending amount',
    example: 150000,
    type: Number,
  })
  totalPending: number;

  @ApiProperty({
    description: 'Number of pending approvals',
    example: 45,
    type: Number,
  })
  count: number;

  @ApiProperty({
    description: 'Oldest pending approval (days)',
    example: 25,
    type: Number,
  })
  oldestDays: number;

  @ApiProperty({
    description: 'Average days waiting',
    example: 12.5,
    type: Number,
  })
  avgDaysWaiting: number;
}

/**
 * Pending Approvals Response (Paginated)
 *
 * Frontend Use Case:
 * - Approval workflow tables
 * - Action required dashboards
 * - Pending items lists
 */
export class PendingApprovalsResponseDto {
  @ApiProperty({
    description: 'Summary statistics',
    type: PendingApprovalsSummaryDto,
  })
  summary: PendingApprovalsSummaryDto;

  @ApiProperty({
    description: 'Paginated list of pending costs (sorted by oldest first)',
    type: [PendingCostDetailDto],
  })
  data: PendingCostDetailDto[];

  @ApiProperty({
    description: 'Pagination metadata',
  })
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  @ApiProperty({
    description: 'Currency code',
    example: 'SAR',
  })
  currency: string;

  @ApiProperty({
    description: 'Report generation timestamp',
    type: Date,
  })
  generatedAt: Date;
}

/**
 * ============================================================================
 * OVERDUE PAYMENTS REPORT RESPONSE
 * ============================================================================
 */

/**
 * Single Overdue Payment Detail
 */
export class OverduePaymentDetailDto {
  @ApiProperty({
    description: 'Cost ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Project name',
    example: 'Office Building',
  })
  projectName: string;

  @ApiProperty({
    description: 'Cost type',
    enum: CostType,
    example: 'SUBCONTRACTOR',
  })
  costType: CostType;

  @ApiProperty({
    description: 'Cost type display name',
    example: 'Subcontractor',
  })
  costTypeName: string;

  @ApiProperty({
    description: 'Cost amount',
    example: 8000,
    type: Number,
  })
  amount: number;

  @ApiProperty({
    description: 'Transaction date',
    example: '2025-12-15',
    type: Date,
  })
  transactionDate: Date;

  @ApiPropertyOptional({
    description: 'Invoice number',
    example: 'INV-2025-456',
  })
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'Cost description / notes',
    example: 'Subcontractor payment for foundation work',
  })
  description?: string;

  @ApiProperty({
    description: 'Number of days overdue',
    example: 35,
    type: Number,
  })
  daysOverdue: number;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2025-12-15T14:20:00Z',
    type: Date,
  })
  createdAt: Date;
}

/**
 * Overdue Payments Summary
 */
export class OverduePaymentsSummaryDto {
  @ApiProperty({
    description: 'Total overdue amount',
    example: 50000,
    type: Number,
  })
  totalOverdue: number;

  @ApiProperty({
    description: 'Number of overdue payments',
    example: 15,
    type: Number,
  })
  count: number;

  @ApiProperty({
    description: 'Average days overdue',
    example: 18.5,
    type: Number,
  })
  avgDaysOverdue: number;

  @ApiProperty({
    description: 'Most overdue (days)',
    example: 45,
    type: Number,
  })
  maxDaysOverdue: number;
}

/**
 * Overdue Payments Response (Paginated)
 *
 * Frontend Use Case:
 * - Payment tracking dashboards
 * - Alert widgets
 * - Overdue items management
 */
export class OverduePaymentsResponseDto {
  @ApiProperty({
    description: 'Summary statistics',
    type: OverduePaymentsSummaryDto,
  })
  summary: OverduePaymentsSummaryDto;

  @ApiProperty({
    description:
      'Paginated list of overdue payments (sorted by most overdue first)',
    type: [OverduePaymentDetailDto],
  })
  data: OverduePaymentDetailDto[];

  @ApiProperty({
    description: 'Pagination metadata',
  })
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  @ApiProperty({
    description: 'Currency code',
    example: 'SAR',
  })
  currency: string;

  @ApiProperty({
    description: 'Report generation timestamp',
    type: Date,
  })
  generatedAt: Date;
}

/**
 * ============================================================================
 * TAX SUMMARY REPORT RESPONSE
 * ============================================================================
 */
export class TaxMonthlyBreakdownItemDto {
  @ApiProperty({
    description: 'Month in YYYY-MM format',
    example: '2026-04',
  })
  month: string;

  @ApiProperty({
    description: 'Month display name',
    example: 'Apr 2026',
  })
  monthName: string;

  @ApiProperty({
    description: 'Total amount before tax in the month',
    example: 100000,
    type: Number,
  })
  amountBeforeTax: number;

  @ApiProperty({
    description: 'Total tax amount in the month',
    example: 15000,
    type: Number,
  })
  taxAmount: number;

  @ApiProperty({
    description: 'Total amount including tax in the month',
    example: 115000,
    type: Number,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Taxed entries count in the month',
    example: 24,
    type: Number,
  })
  taxedCount: number;
}

export class TaxSummaryResponseDto {
  @ApiProperty({
    description: 'Total amount before tax',
    example: 950000,
    type: Number,
  })
  totalAmountBeforeTax: number;

  @ApiProperty({
    description: 'Total tax amount',
    example: 142500,
    type: Number,
  })
  totalTaxAmount: number;

  @ApiProperty({
    description: 'Total amount including tax',
    example: 1092500,
    type: Number,
  })
  totalAmountWithTax: number;

  @ApiProperty({
    description: 'Effective tax rate (%) over selected data',
    example: 15,
    type: Number,
  })
  effectiveTaxRate: number;

  @ApiProperty({
    description: 'Number of taxed entries',
    example: 120,
    type: Number,
  })
  taxedEntriesCount: number;

  @ApiProperty({
    description: 'Number of non-taxed entries',
    example: 32,
    type: Number,
  })
  nonTaxedEntriesCount: number;

  @ApiProperty({
    description: 'Monthly tax breakdown',
    type: [TaxMonthlyBreakdownItemDto],
  })
  monthlyBreakdown: TaxMonthlyBreakdownItemDto[];

  @ApiProperty({
    description: 'Currency code',
    example: 'SAR',
  })
  currency: string;

  @ApiProperty({
    description: 'Report generation timestamp',
    type: Date,
  })
  generatedAt: Date;
}
