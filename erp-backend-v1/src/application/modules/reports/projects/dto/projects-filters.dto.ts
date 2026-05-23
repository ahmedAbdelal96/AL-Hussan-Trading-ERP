/**
 * ============================================================================
 * PROJECTS REPORTS - FILTER DTOs
 * ============================================================================
 *
 * Filter DTOs for all 7 project reports with comprehensive validation
 *
 * Features:
 * - Date range filtering with validation
 * - Status/Site/Manager filtering
 * - Sorting and pagination support
 * - Budget threshold filtering
 * - Timeline status filtering
 * - Completion percentage ranges
 *
 * @module ProjectsFiltersDto
 * @version 1.0.0
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CostType, ProjectStatus } from '@prisma/client';

/**
 * ============================================================================
 * CUSTOM ENUMS (not in Prisma schema)
 * ============================================================================
 */

export enum TimelineStatus {
  ON_TIME = 'ON_TIME',
  BEHIND_SCHEDULE = 'BEHIND_SCHEDULE',
  AHEAD_OF_SCHEDULE = 'AHEAD_OF_SCHEDULE',
  NOT_STARTED = 'NOT_STARTED',
}

export enum BudgetStatus {
  WITHIN_BUDGET = 'WITHIN_BUDGET',
  OVER_BUDGET = 'OVER_BUDGET',
  UNDER_BUDGET = 'UNDER_BUDGET',
  NO_BUDGET = 'NO_BUDGET',
}

/**
 * ============================================================================
 * BASE FILTERS (shared across reports)
 * ============================================================================
 */

export class BaseProjectFiltersDto {
  @ApiPropertyOptional({
    description: 'Month for report (1-12)',
    example: 1,
    minimum: 1,
    maximum: 12,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  month?: number;

  @ApiPropertyOptional({
    description: 'Year for report',
    example: 2026,
    minimum: 2020,
    maximum: 2100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({
    description: 'Filter by project status',
    enum: ProjectStatus,
    example: ProjectStatus.ACTIVE,
  })
  @IsEnum(ProjectStatus)
  @IsOptional()
  projectStatus?: ProjectStatus;

  @ApiPropertyOptional({
    description: 'Filter by site ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  siteId?: string;

  @ApiPropertyOptional({
    description: 'Filter by project manager ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  managerId?: string;
}

/**
 * ============================================================================
 * REPORT 1: PROJECTS OVERVIEW
 * ============================================================================
 */

export class ProjectsOverviewFiltersDto extends BaseProjectFiltersDto {
  @ApiPropertyOptional({
    description: 'Include comparison with previous period',
    example: true,
  })
  @Type(() => Boolean)
  @IsOptional()
  includeComparison?: boolean;

  @ApiPropertyOptional({
    description: 'Include cost breakdown by type',
    example: true,
  })
  @Type(() => Boolean)
  @IsOptional()
  includeCostBreakdown?: boolean;
}

/**
 * ============================================================================
 * REPORT 2: PROJECTS BY STATUS
 * ============================================================================
 */

export class ProjectsByStatusFiltersDto extends BaseProjectFiltersDto {
  @ApiPropertyOptional({
    description: 'Minimum number of projects to include status in results',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  minProjects?: number;

  @ApiPropertyOptional({
    description: 'Sort by: count, budget, completion',
    enum: ['count', 'budget', 'completion', 'actualCost'],
    example: 'count',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'count' | 'budget' | 'completion' | 'actualCost';

  @ApiPropertyOptional({
    description: 'Sort order: asc or desc',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

/**
 * ============================================================================
 * REPORT 3: PROJECTS BY SITE
 * ============================================================================
 */

export class ProjectsBySiteFiltersDto extends BaseProjectFiltersDto {
  @ApiPropertyOptional({
    description: 'Minimum number of projects to include site',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  minProjects?: number;

  @ApiPropertyOptional({
    description:
      'Sort by: projectCount, totalBudget, activeCount, completionRate',
    enum: ['projectCount', 'totalBudget', 'activeCount', 'completionRate'],
    example: 'projectCount',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'projectCount' | 'totalBudget' | 'activeCount' | 'completionRate';

  @ApiPropertyOptional({
    description: 'Sort order: asc or desc',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

/**
 * ============================================================================
 * REPORT 4: BUDGET UTILIZATION
 * ============================================================================
 */

export class BudgetUtilizationFiltersDto extends BaseProjectFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by budget status',
    enum: BudgetStatus,
    example: BudgetStatus.OVER_BUDGET,
  })
  @IsEnum(BudgetStatus)
  @IsOptional()
  budgetStatus?: BudgetStatus;

  @ApiPropertyOptional({
    description: 'Minimum budget amount to include',
    example: 100000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minBudget?: number;

  @ApiPropertyOptional({
    description: 'Include cost breakdown by category',
    example: true,
  })
  @Type(() => Boolean)
  @IsOptional()
  includeCostBreakdown?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by: budgetVariance, utilization, actualCost',
    enum: ['budgetVariance', 'utilization', 'actualCost', 'budget'],
    example: 'budgetVariance',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'budgetVariance' | 'utilization' | 'actualCost' | 'budget';
}

/**
 * ============================================================================
 * REPORT 5: TIMELINE PROGRESS
 * ============================================================================
 */

export class TimelineProgressFiltersDto extends BaseProjectFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by timeline status',
    enum: TimelineStatus,
    example: TimelineStatus.BEHIND_SCHEDULE,
  })
  @IsEnum(TimelineStatus)
  @IsOptional()
  timelineStatus?: TimelineStatus;

  @ApiPropertyOptional({
    description: 'Minimum completion percentage',
    example: 0,
    minimum: 0,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  minCompletion?: number;

  @ApiPropertyOptional({
    description: 'Maximum completion percentage',
    example: 100,
    minimum: 0,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxCompletion?: number;

  @ApiPropertyOptional({
    description:
      'Sort by: daysVariance, completion, schedulePerformance, daysRemaining',
    enum: [
      'daysVariance',
      'completion',
      'schedulePerformance',
      'daysRemaining',
    ],
    example: 'daysVariance',
  })
  @IsString()
  @IsOptional()
  sortBy?:
    | 'daysVariance'
    | 'completion'
    | 'schedulePerformance'
    | 'daysRemaining';
}

/**
 * ============================================================================
 * REPORT 6: DELAYED PROJECTS
 * ============================================================================
 */

export class DelayedProjectsFiltersDto extends BaseProjectFiltersDto {
  @ApiPropertyOptional({
    description: 'Minimum delay in days to include',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  minDelayDays?: number;

  @ApiPropertyOptional({
    description: 'Include only at-risk projects (approaching deadline)',
    example: false,
  })
  @Type(() => Boolean)
  @IsOptional()
  atRiskOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by: delayDays, completion, budgetAtRisk',
    enum: ['delayDays', 'completion', 'budgetAtRisk'],
    example: 'delayDays',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'delayDays' | 'completion' | 'budgetAtRisk';
}

/**
 * ============================================================================
 * REPORT 7: COMPLETED PROJECTS
 * ============================================================================
 */

export class CompletedProjectsFiltersDto extends BaseProjectFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by completion month (1-12)',
    example: 12,
    minimum: 1,
    maximum: 12,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  completionMonth?: number;

  @ApiPropertyOptional({
    description: 'Filter by completion year',
    example: 2026,
    minimum: 2020,
  })
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @IsOptional()
  completionYear?: number;

  @ApiPropertyOptional({
    description: 'Include only successful projects (within budget and on time)',
    example: false,
  })
  @Type(() => Boolean)
  @IsOptional()
  successfulOnly?: boolean;

  @ApiPropertyOptional({
    description:
      'Sort by: completionDate, actualDuration, budgetPerformance, projectScore',
    enum: [
      'completionDate',
      'actualDuration',
      'budgetPerformance',
      'projectScore',
    ],
    example: 'projectScore',
  })
  @IsString()
  @IsOptional()
  sortBy?:
    | 'completionDate'
    | 'actualDuration'
    | 'budgetPerformance'
    | 'projectScore';
}

/**
 * ============================================================================
 * REPORT 8: PROJECT COST BREAKDOWN
 * ============================================================================
 */

export class ProjectCostBreakdownFiltersDto extends BaseProjectFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by specific cost type',
    enum: CostType,
    example: CostType.SALARY,
  })
  @IsEnum(CostType)
  @IsOptional()
  costType?: CostType;

  @ApiPropertyOptional({
    description: 'Include per-project cost type details',
    example: true,
  })
  @Type(() => Boolean)
  @IsOptional()
  includeCostDetails?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by: totalCost, budget, utilization, projectName',
    enum: ['totalCost', 'budget', 'utilization', 'projectName'],
    example: 'totalCost',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'totalCost' | 'budget' | 'utilization' | 'projectName';

  @ApiPropertyOptional({
    description: 'Sort order: asc or desc',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

/**
 * ============================================================================
 * REPORT 9: PROJECT LABOR COST
 * ============================================================================
 */

export class ProjectLaborCostFiltersDto extends BaseProjectFiltersDto {
  @ApiPropertyOptional({
    description: 'Include individual employee cost details per project',
    example: true,
  })
  @Type(() => Boolean)
  @IsOptional()
  includeEmployeeDetails?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by: totalLaborCost, employeeCount, laborPercentage',
    enum: ['totalLaborCost', 'employeeCount', 'laborPercentage'],
    example: 'totalLaborCost',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'totalLaborCost' | 'employeeCount' | 'laborPercentage';

  @ApiPropertyOptional({
    description: 'Sort order: asc or desc',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

/**
 * ============================================================================
 * REPORT 10: PROJECT ASSET UTILIZATION
 * ============================================================================
 */

export class ProjectAssetUtilizationFiltersDto extends BaseProjectFiltersDto {
  @ApiPropertyOptional({
    description: 'Include per-asset details per project',
    example: true,
  })
  @Type(() => Boolean)
  @IsOptional()
  includeAssetDetails?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by: totalAssets, totalAssetValue, maintenanceCost',
    enum: ['totalAssets', 'totalAssetValue', 'maintenanceCost'],
    example: 'totalAssetValue',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'totalAssets' | 'totalAssetValue' | 'maintenanceCost';

  @ApiPropertyOptional({
    description: 'Sort order: asc or desc',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
