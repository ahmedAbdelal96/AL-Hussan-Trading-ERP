/**
 * ============================================================================
 * FINANCE REPORTS - FILTER DTOs
 * ============================================================================
 *
 * Provides specialized filter DTOs for finance report queries.
 * These DTOs extend the common report filters with finance-specific options.
 *
 * Design Principles:
 * - Extends common filters (DateRange, Pagination) for consistency
 * - Type-safe with Prisma enums
 * - Validation-ready with class-validator decorators
 * - Optional filters for flexible queries
 * - Clear documentation for Frontend integration
 *
 * @module FinanceReportsFilters
 * @version 1.0.0
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CostType, PaymentStatus } from '@prisma/client';
import {
  DateRangeFilterDto,
  PaginationDto,
  ReportFiltersDto,
} from '../../dto/common/report-filters.dto';

/**
 * Finance Overview Filters
 *
 * Simple date range filter for high-level KPIs.
 * Used in: Overview endpoint (summary cards)
 */
export class FinanceOverviewFiltersDto extends DateRangeFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by specific project',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;
}

/**
 * Cost Type Filters
 *
 * Filters for analyzing costs by their type (SALARY, FUEL, etc.)
 * Includes pagination for large datasets.
 */
export class CostTypeFiltersDto extends DateRangeFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by specific cost type',
    enum: CostType,
    example: 'SALARY',
  })
  @IsOptional()
  @IsEnum(CostType)
  costType?: CostType;

  @ApiPropertyOptional({
    description: 'Filter by payment status',
    enum: PaymentStatus,
    example: 'PAID',
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Filter by specific project',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;
}

/**
 * Payment Status Filters
 *
 * Filters for analyzing costs by payment status (PENDING, PAID, etc.)
 */
export class PaymentStatusFiltersDto extends DateRangeFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by specific payment status',
    enum: PaymentStatus,
    example: 'PENDING',
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Filter by specific project',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by cost type',
    enum: CostType,
    example: 'MAINTENANCE',
  })
  @IsOptional()
  @IsEnum(CostType)
  costType?: CostType;
}

/**
 * Monthly Trend Filters
 *
 * Filters for time-series analysis of costs.
 * Includes configurable number of months to analyze.
 */
export class MonthlyTrendFiltersDto extends DateRangeFilterDto {
  @ApiPropertyOptional({
    description: 'Number of months to analyze (default: 12)',
    example: 12,
    minimum: 1,
    maximum: 24,
    default: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  @Type(() => Number)
  months?: number = 12;

  @ApiPropertyOptional({
    description: 'Filter by cost type',
    enum: CostType,
    example: 'SALARY',
  })
  @IsOptional()
  @IsEnum(CostType)
  costType?: CostType;

  @ApiPropertyOptional({
    description: 'Filter by specific project',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;
}

/**
 * Category Filters
 *
 * Filters for analyzing costs by their category.
 * Categories are hierarchical (parent-child relationship).
 */
export class CategoryFiltersDto extends DateRangeFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by specific category',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Include child categories (for hierarchical categories)',
    example: true,
    default: false,
  })
  @IsOptional()
  includeChildren?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by specific project',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;
}

/**
 * Top Projects Filters
 *
 * Fully paginated filter for ALL projects by cost.
 * Supports search, date range, cost type, payment status, and server-side pagination.
 */
export class TopProjectsFiltersDto extends ReportFiltersDto {
  @ApiPropertyOptional({
    description: 'Search by project name',
    example: 'Construction',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by cost type',
    enum: CostType,
    example: 'MAINTENANCE',
  })
  @IsOptional()
  @IsEnum(CostType)
  costType?: CostType;

  @ApiPropertyOptional({
    description: 'Filter by payment status',
    enum: PaymentStatus,
    example: 'PAID',
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}

/**
 * Pending Approvals Filters
 *
 * Filters for detailed list of costs awaiting approval.
 * Includes full pagination support for large lists.
 */
export class PendingApprovalsFiltersDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by specific project',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by cost type',
    enum: CostType,
    example: 'MAINTENANCE',
  })
  @IsOptional()
  @IsEnum(CostType)
  costType?: CostType;

  @ApiPropertyOptional({
    description: 'Minimum days waiting (for overdue detection)',
    example: 7,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minDaysWaiting?: number;
}

/**
 * Overdue Payments Filters
 *
 * Filters for detailed list of overdue payments.
 * Includes full pagination support.
 */
export class OverduePaymentsFiltersDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by specific project',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by cost type',
    enum: CostType,
    example: 'SUBCONTRACTOR',
  })
  @IsOptional()
  @IsEnum(CostType)
  costType?: CostType;

  @ApiPropertyOptional({
    description: 'Minimum days overdue',
    example: 7,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minDaysOverdue?: number;
}
