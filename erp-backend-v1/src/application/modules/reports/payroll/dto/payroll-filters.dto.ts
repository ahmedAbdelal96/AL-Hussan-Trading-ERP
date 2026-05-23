/**
 * ============================================================================
 * PAYROLL REPORTS - FILTER DTOs
 * ============================================================================
 *
 * Type-safe filter DTOs for all 8 payroll report endpoints.
 * Includes validation decorators for input sanitization.
 *
 * Design Principles:
 * - Each report has its own specialized DTO (Single Responsibility)
 * - Common filters (date, department, site) reused via inheritance
 * - All fields validated with class-validator decorators
 * - Optional fields have proper default values
 *
 * @module PayrollReportsFilters
 * @version 1.0.0
 */

import { IsOptional, IsUUID, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeStatus } from '@prisma/client';

/**
 * ============================================================================
 * BASE FILTERS
 * ============================================================================
 */

/**
 * Base filters for payroll reports
 * Provides common filtering options across all payroll reports
 */
export class BasePayrollFiltersDto {
  @ApiPropertyOptional({
    description: 'Month (1-12) for filtering',
    example: 1,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;

  @ApiPropertyOptional({
    description: 'Year for filtering',
    example: 2026,
    minimum: 2020,
    maximum: 2100,
  })
  @IsOptional()
  @IsInt()
  @Min(2020)
  @Max(2100)
  @Type(() => Number)
  year?: number;

  @ApiPropertyOptional({
    description: 'Filter by department ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by site ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiPropertyOptional({
    description: 'Filter by employee status',
    enum: EmployeeStatus,
    example: EmployeeStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  employeeStatus?: EmployeeStatus;
}

/**
 * ============================================================================
 * REPORT 1: MONTHLY PAYROLL OVERVIEW
 * ============================================================================
 */

export class PayrollOverviewFiltersDto extends BasePayrollFiltersDto {
  @ApiPropertyOptional({
    description: 'Include comparison with previous month',
    example: true,
    default: true,
  })
  @IsOptional()
  includeComparison?: boolean;
}

/**
 * ============================================================================
 * REPORT 2: PAYROLL BY DEPARTMENT
 * ============================================================================
 */

export class PayrollByDepartmentFiltersDto extends BasePayrollFiltersDto {
  @ApiPropertyOptional({
    description: 'Minimum employee count to include department',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minEmployees?: number;

  @ApiPropertyOptional({
    description: 'Sort by field (totalPayroll, employeeCount, avgSalary)',
    example: 'totalPayroll',
    default: 'totalPayroll',
  })
  @IsOptional()
  sortBy?: 'totalPayroll' | 'employeeCount' | 'avgSalary';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

/**
 * ============================================================================
 * REPORT 3: PAYROLL BY SITE
 * ============================================================================
 */

export class PayrollBySiteFiltersDto extends BasePayrollFiltersDto {
  @ApiPropertyOptional({
    description: 'Minimum employee count to include site',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minEmployees?: number;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'totalPayroll',
    default: 'totalPayroll',
  })
  @IsOptional()
  sortBy?: 'totalPayroll' | 'employeeCount' | 'avgSalary';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

/**
 * ============================================================================
 * REPORT 4: SALARY COMPONENTS BREAKDOWN
 * ============================================================================
 */

export class SalaryComponentsFiltersDto extends BasePayrollFiltersDto {
  @ApiPropertyOptional({
    description: 'Include detailed allowance types breakdown',
    example: true,
    default: true,
  })
  @IsOptional()
  includeAllowanceTypes?: boolean;

  @ApiPropertyOptional({
    description: 'Include detailed deduction types breakdown',
    example: true,
    default: true,
  })
  @IsOptional()
  includeDeductionTypes?: boolean;
}

/**
 * ============================================================================
 * REPORT 5: ALLOWANCES REPORT
 * ============================================================================
 */

export class AllowancesReportFiltersDto extends BasePayrollFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by allowance type ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  allowanceTypeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Include pending approvals only',
    example: false,
    default: false,
  })
  @IsOptional()
  pendingOnly?: boolean;
}

/**
 * ============================================================================
 * REPORT 6: DEDUCTIONS & LOANS REPORT
 * ============================================================================
 */

export class DeductionsLoansFiltersDto extends BasePayrollFiltersDto {
  @ApiPropertyOptional({
    description: 'Include loans summary',
    example: true,
    default: true,
  })
  @IsOptional()
  includeLoans?: boolean;

  @ApiPropertyOptional({
    description: 'Include deductions summary',
    example: true,
    default: true,
  })
  @IsOptional()
  includeDeductions?: boolean;

  @ApiPropertyOptional({
    description: 'Show only overdue loans',
    example: false,
    default: false,
  })
  @IsOptional()
  overdueLoansOnly?: boolean;
}

/**
 * ============================================================================
 * REPORT 7: PAYROLL TREND (12 MONTHS)
 * ============================================================================
 */

export class PayrollTrendFiltersDto {
  @ApiPropertyOptional({
    description: 'Number of months to include in trend (1-24)',
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
  months?: number;

  @ApiPropertyOptional({
    description: 'Filter by department ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by site ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiPropertyOptional({
    description: 'Include component breakdown (base, allowances, deductions)',
    example: true,
    default: false,
  })
  @IsOptional()
  includeComponents?: boolean;
}

/**
 * ============================================================================
 * REPORT 8: PAYROLL COMPARISON
 * ============================================================================
 */

export class PayrollComparisonFiltersDto {
  @ApiPropertyOptional({
    description: 'First comparison month (1-12)',
    example: 12,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month1?: number;

  @ApiPropertyOptional({
    description: 'First comparison year',
    example: 2025,
    minimum: 2020,
    maximum: 2100,
  })
  @IsOptional()
  @IsInt()
  @Min(2020)
  @Max(2100)
  @Type(() => Number)
  year1?: number;

  @ApiPropertyOptional({
    description: 'Second comparison month (1-12)',
    example: 1,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month2?: number;

  @ApiPropertyOptional({
    description: 'Second comparison year',
    example: 2026,
    minimum: 2020,
    maximum: 2100,
  })
  @IsOptional()
  @IsInt()
  @Min(2020)
  @Max(2100)
  @Type(() => Number)
  year2?: number;

  @ApiPropertyOptional({
    description: 'Filter by department ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by site ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiPropertyOptional({
    description:
      'Include employee-level changes (new hires, resignations, salary changes)',
    example: true,
    default: true,
  })
  @IsOptional()
  includeEmployeeChanges?: boolean;
}
