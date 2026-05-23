/**
 * ============================================================================
 * EMPLOYEES REPORTS - FILTER DTOs
 * ============================================================================
 *
 * Comprehensive filter DTOs for all employee reports with validation
 *
 * Features:
 * - Base filters (month, year, department, employmentType, status)
 * - Report-specific filters
 * - Validation decorators (class-validator)
 * - Swagger documentation (ApiProperty)
 * - Optional parameters for flexible querying
 *
 * Design Decisions:
 * - Inheritance from base DTO for consistency
 * - Enum validation for type safety
 * - Optional filters for better UX
 * - Sort capabilities for all reports
 *
 * @module EmployeesReportsFilters
 * @version 1.0.0
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmploymentType, EmployeeStatus } from '@prisma/client';

/**
 * ============================================================================
 * BASE FILTERS DTO
 * ============================================================================
 * Common filters used across all employee reports
 */
export class BaseEmployeeFiltersDto {
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
    description: 'Filter by department',
    example: 'Engineering',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description: 'Filter by employment type',
    enum: EmploymentType,
    example: EmploymentType.PERMANENT,
  })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({
    description: 'Filter by employee status',
    enum: EmployeeStatus,
    example: EmployeeStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}

/**
 * ============================================================================
 * PAGINATED EMPLOYEE FILTERS DTO
 * ============================================================================
 * Shared pagination + lightweight search for tabular reports.
 */
export class PaginatedEmployeeFiltersDto extends BaseEmployeeFiltersDto {
  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 15,
    minimum: 1,
    maximum: 100,
    default: 15,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 15;

  @ApiPropertyOptional({
    description:
      'Search term for grouped rows (department, position, employment type)',
    example: 'engineering',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

/**
 * ============================================================================
 * EMPLOYEES OVERVIEW FILTERS
 * ============================================================================
 */
export class EmployeesOverviewFiltersDto extends BaseEmployeeFiltersDto {
  @ApiPropertyOptional({
    description: 'Include comparison with previous period',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeComparison?: boolean;

  @ApiPropertyOptional({
    description: 'Include department breakdown',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeDepartmentBreakdown?: boolean;
}

/**
 * ============================================================================
 * EMPLOYEES BY DEPARTMENT FILTERS
 * ============================================================================
 */
export class EmployeesByDepartmentFiltersDto extends PaginatedEmployeeFiltersDto {
  @ApiPropertyOptional({
    description: 'Minimum employees to include department',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minEmployees?: number;

  @ApiPropertyOptional({
    description: 'Include salary costs per department',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeSalaryCosts?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['employeeCount', 'activeCount', 'department', 'avgTenure'],
    example: 'employeeCount',
  })
  @IsOptional()
  @IsEnum(['employeeCount', 'activeCount', 'department', 'avgTenure'])
  sortBy?: 'employeeCount' | 'activeCount' | 'department' | 'avgTenure';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

/**
 * ============================================================================
 * EMPLOYEES BY EMPLOYMENT TYPE FILTERS
 * ============================================================================
 */
export class EmployeesByEmploymentTypeFiltersDto extends PaginatedEmployeeFiltersDto {
  @ApiPropertyOptional({
    description: 'Include expiring contracts (days)',
    example: 90,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  expiringContractsDays?: number;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['employeeCount', 'percentage', 'employmentType'],
    example: 'employeeCount',
  })
  @IsOptional()
  @IsEnum(['employeeCount', 'percentage', 'employmentType'])
  sortBy?: 'employeeCount' | 'percentage' | 'employmentType';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

/**
 * ============================================================================
 * EMPLOYEES BY POSITION FILTERS
 * ============================================================================
 */
export class EmployeesByPositionFiltersDto extends PaginatedEmployeeFiltersDto {
  @ApiPropertyOptional({
    description: 'Minimum employees to include position',
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
    enum: ['employeeCount', 'position', 'avgTenure'],
    example: 'employeeCount',
  })
  @IsOptional()
  @IsEnum(['employeeCount', 'position', 'avgTenure'])
  sortBy?: 'employeeCount' | 'position' | 'avgTenure';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

/**
 * ============================================================================
 * AGE & EXPERIENCE ANALYSIS FILTERS
 * ============================================================================
 */
export class AgeExperienceFiltersDto extends BaseEmployeeFiltersDto {
  @ApiPropertyOptional({
    description: 'Minimum age to include',
    example: 18,
    minimum: 18,
  })
  @IsOptional()
  @IsInt()
  @Min(18)
  @Type(() => Number)
  minAge?: number;

  @ApiPropertyOptional({
    description: 'Maximum age to include',
    example: 65,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Max(100)
  @Type(() => Number)
  maxAge?: number;

  @ApiPropertyOptional({
    description: 'Minimum experience years',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minExperience?: number;

  @ApiPropertyOptional({
    description: 'Maximum experience years',
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxExperience?: number;
}

/**
 * ============================================================================
 * TURNOVER ANALYSIS FILTERS
 * ============================================================================
 */
export class TurnoverAnalysisFiltersDto extends BaseEmployeeFiltersDto {
  @ApiPropertyOptional({
    description: 'Number of months to analyze',
    example: 12,
    minimum: 1,
    maximum: 24,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  @Type(() => Number)
  months?: number;

  @ApiPropertyOptional({
    description: 'Include termination reasons breakdown',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeReasons?: boolean;

  @ApiPropertyOptional({
    description: 'Include department-wise turnover',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeDepartmentBreakdown?: boolean;
}

/**
 * ============================================================================
 * STATUS DISTRIBUTION FILTERS
 * ============================================================================
 */
export class StatusDistributionFiltersDto extends BaseEmployeeFiltersDto {
  @ApiPropertyOptional({
    description: 'Include historical trend',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeTrend?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['employeeCount', 'percentage', 'status'],
    example: 'employeeCount',
  })
  @IsOptional()
  @IsEnum(['employeeCount', 'percentage', 'status'])
  sortBy?: 'employeeCount' | 'percentage' | 'status';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

/**
 * ============================================================================
 * EMPLOYEE ASSIGNMENT FILTERS
 * ============================================================================
 * Report 8 — Per-employee project deployment and allocation percentage
 */
export class EmployeeAssignmentFiltersDto extends BaseEmployeeFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by allocation status',
    enum: ['OVERHEAD', 'OVER_ALLOCATED', 'FULLY_ALLOCATED', 'UNDER_ALLOCATED'],
    example: 'OVER_ALLOCATED',
  })
  @IsOptional()
  @IsEnum(['OVERHEAD', 'OVER_ALLOCATED', 'FULLY_ALLOCATED', 'UNDER_ALLOCATED'])
  allocationStatus?:
    | 'OVERHEAD'
    | 'OVER_ALLOCATED'
    | 'FULLY_ALLOCATED'
    | 'UNDER_ALLOCATED';

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['employeeName', 'allocationPct', 'projectCount'],
    example: 'allocationPct',
  })
  @IsOptional()
  @IsEnum(['employeeName', 'allocationPct', 'projectCount'])
  sortBy?: 'employeeName' | 'allocationPct' | 'projectCount';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Include only active project assignments',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activeOnly?: boolean;
}

/**
 * ============================================================================
 * CONTRACT EXPIRY FILTERS
 * ============================================================================
 * Report 9 — Employees with contracts expiring soon
 */
export class ContractExpiryFiltersDto extends BaseEmployeeFiltersDto {
  @ApiPropertyOptional({
    description: 'Number of days ahead to look for expiring contracts',
    example: 90,
    minimum: 1,
    maximum: 365,
    default: 90,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  daysAhead?: number;

  @ApiPropertyOptional({
    description: 'Include already-expired contracts',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeExpired?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by urgency level',
    enum: ['EXPIRED', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    example: 'CRITICAL',
  })
  @IsOptional()
  @IsEnum(['EXPIRED', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
  urgency?: 'EXPIRED' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['expiryDate', 'employeeName', 'urgency'],
    example: 'expiryDate',
  })
  @IsOptional()
  @IsEnum(['expiryDate', 'employeeName', 'urgency'])
  sortBy?: 'expiryDate' | 'employeeName' | 'urgency';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'asc',
    default: 'asc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
