/**
 * ============================================================================
 * PROJECTS REPORTS - RESPONSE DTOs (Part 1: Reports 1-4)
 * ============================================================================
 *
 * Response structures for the first 4 project reports
 *
 * Reports Included:
 * 1. Projects Overview Report
 * 2. Projects By Status Report
 * 3. Projects By Site Report
 * 4. Budget Utilization Report
 *
 * @module ProjectsResponsesPart1Dto
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { BudgetStatus } from './projects-filters.dto';

/**
 * ============================================================================
 * REPORT 1: PROJECTS OVERVIEW REPORT
 * ============================================================================
 */

/**
 * Cost breakdown by type (for overview)
 */
export class CostTypeBreakdownDto {
  @ApiProperty({
    description: 'Cost type',
    example: 'MATERIAL',
  })
  costType: string;

  @ApiProperty({
    description: 'Total amount for this cost type',
    example: 500000,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Number of transactions',
    example: 45,
  })
  transactionCount: number;

  @ApiProperty({
    description: 'Percentage of total costs',
    example: 25.5,
  })
  percentage: number;
}

/**
 * Previous period comparison data
 */
export class PeriodComparisonDto {
  @ApiProperty({ description: 'Total projects', example: 45 })
  totalProjects: number;

  @ApiProperty({ description: 'Active projects', example: 20 })
  activeProjects: number;

  @ApiProperty({ description: 'Completed projects', example: 18 })
  completedProjects: number;

  @ApiProperty({ description: 'Total budget', example: 45000000 })
  totalBudget: number;

  @ApiProperty({ description: 'Total actual cost', example: 32000000 })
  totalActualCost: number;

  @ApiProperty({ description: 'Average completion', example: 52.5 })
  avgCompletion: number;
}

/**
 * Main response for Projects Overview Report
 */
export class ProjectsOverviewResponseDto {
  // === KEY METRICS (12 KPIs) ===
  @ApiProperty({ description: 'Total number of projects', example: 50 })
  totalProjects: number;

  @ApiProperty({ description: 'Active projects', example: 22 })
  activeProjects: number;

  @ApiProperty({ description: 'Planning projects', example: 8 })
  planningProjects: number;

  @ApiProperty({ description: 'On hold projects', example: 3 })
  onHoldProjects: number;

  @ApiProperty({ description: 'Completed projects', example: 15 })
  completedProjects: number;

  @ApiProperty({ description: 'Cancelled projects', example: 2 })
  cancelledProjects: number;

  @ApiProperty({
    description: 'Total budget across all projects',
    example: 50000000,
  })
  totalBudget: number;

  @ApiProperty({ description: 'Total actual cost spent', example: 35000000 })
  totalActualCost: number;

  @ApiProperty({
    description: 'Budget variance (budget - actual)',
    example: 15000000,
  })
  budgetVariance: number;

  @ApiProperty({ description: 'Budget utilization percentage', example: 70.0 })
  budgetUtilization: number;

  @ApiProperty({ description: 'Average completion percentage', example: 55.5 })
  avgCompletion: number;

  @ApiProperty({
    description: 'Completion rate (completed / total)',
    example: 30.0,
  })
  completionRate: number;

  // === OPTIONAL BREAKDOWNS ===
  @ApiPropertyOptional({
    description: 'Cost breakdown by type (if requested)',
    type: [CostTypeBreakdownDto],
  })
  costBreakdown?: CostTypeBreakdownDto[];

  @ApiPropertyOptional({
    description: 'Previous period comparison (if requested)',
    type: PeriodComparisonDto,
  })
  previousPeriod?: PeriodComparisonDto;

  @ApiPropertyOptional({
    description: 'Growth rate percentage vs previous period',
    example: 8.5,
  })
  growthRate?: number;

  // === METADATA ===
  @ApiProperty({ description: 'Currency code', example: 'SAR' })
  currency: string;

  @ApiProperty({ description: 'Report month', example: 1 })
  month: number;

  @ApiProperty({ description: 'Report year', example: 2026 })
  year: number;

  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: Date;
}

/**
 * ============================================================================
 * REPORT 2: PROJECTS BY STATUS REPORT
 * ============================================================================
 */

/**
 * Single status breakdown item
 */
export class StatusBreakdownItemDto {
  @ApiProperty({
    description: 'Project status',
    enum: ProjectStatus,
    example: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @ApiProperty({
    description: 'Status name (English)',
    example: 'Active',
  })
  statusName: string;

  @ApiProperty({
    description: 'Status name (Arabic)',
    example: 'نشط',
  })
  statusNameAr: string;

  @ApiProperty({
    description: 'Number of projects in this status',
    example: 22,
  })
  projectCount: number;

  @ApiProperty({
    description: 'Percentage of total projects',
    example: 44.0,
  })
  percentage: number;

  @ApiProperty({
    description: 'Total budget for projects in this status',
    example: 25000000,
  })
  totalBudget: number;

  @ApiProperty({
    description: 'Total actual cost for projects in this status',
    example: 18000000,
  })
  totalActualCost: number;

  @ApiProperty({
    description: 'Budget variance for this status',
    example: 7000000,
  })
  budgetVariance: number;

  @ApiProperty({
    description: 'Average completion percentage',
    example: 65.5,
  })
  avgCompletion: number;

  @ApiProperty({
    description: 'Average budget utilization',
    example: 72.0,
  })
  avgBudgetUtilization: number;
}

/**
 * Main response for Projects By Status Report
 */
export class ProjectsByStatusResponseDto {
  @ApiProperty({
    description: 'Status breakdown items',
    type: [StatusBreakdownItemDto],
  })
  items: StatusBreakdownItemDto[];

  @ApiProperty({
    description: 'Total projects across all statuses',
    example: 50,
  })
  totalProjects: number;

  @ApiProperty({
    description: 'Total budget across all statuses',
    example: 50000000,
  })
  totalBudget: number;

  @ApiProperty({ description: 'Total actual cost', example: 35000000 })
  totalActualCost: number;

  @ApiProperty({ description: 'Currency code', example: 'SAR' })
  currency: string;

  @ApiProperty({ description: 'Report month', example: 1 })
  month: number;

  @ApiProperty({ description: 'Report year', example: 2026 })
  year: number;

  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: Date;
}

/**
 * ============================================================================
 * REPORT 3: PROJECTS BY SITE REPORT
 * ============================================================================
 */

/**
 * Single site breakdown item
 */
export class SiteBreakdownItemDto {
  @ApiProperty({
    description: 'Site ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  siteId: string;

  @ApiProperty({
    description: 'Site name',
    example: 'Riyadh Central District',
  })
  siteName: string;

  @ApiProperty({
    description: 'Site code',
    example: 'RCD-001',
  })
  siteCode: string;

  @ApiProperty({
    description: 'Total number of projects at this site',
    example: 12,
  })
  projectCount: number;

  @ApiProperty({
    description: 'Number of active projects',
    example: 5,
  })
  activeCount: number;

  @ApiProperty({
    description: 'Number of completed projects',
    example: 6,
  })
  completedCount: number;

  @ApiProperty({
    description: 'Number of on-hold projects',
    example: 1,
  })
  onHoldCount: number;

  @ApiProperty({
    description: 'Total budget for all projects at site',
    example: 15000000,
  })
  totalBudget: number;

  @ApiProperty({
    description: 'Total actual cost spent',
    example: 10500000,
  })
  totalActualCost: number;

  @ApiProperty({
    description: 'Budget variance',
    example: 4500000,
  })
  budgetVariance: number;

  @ApiProperty({
    description: 'Average completion percentage',
    example: 68.5,
  })
  avgCompletion: number;

  @ApiProperty({
    description: 'Completion rate (completed / total)',
    example: 50.0,
  })
  completionRate: number;

  @ApiProperty({
    description: 'Percentage of company total budget',
    example: 30.0,
  })
  percentageOfTotal: number;
}

/**
 * Main response for Projects By Site Report
 */
export class ProjectsBySiteResponseDto {
  @ApiProperty({
    description: 'Site breakdown items',
    type: [SiteBreakdownItemDto],
  })
  sites: SiteBreakdownItemDto[];

  @ApiProperty({ description: 'Total projects across all sites', example: 50 })
  totalProjects: number;

  @ApiProperty({ description: 'Total sites with projects', example: 8 })
  totalSites: number;

  @ApiProperty({ description: 'Total budget', example: 50000000 })
  totalBudget: number;

  @ApiProperty({ description: 'Total actual cost', example: 35000000 })
  totalActualCost: number;

  @ApiProperty({ description: 'Currency code', example: 'SAR' })
  currency: string;

  @ApiProperty({ description: 'Report month', example: 1 })
  month: number;

  @ApiProperty({ description: 'Report year', example: 2026 })
  year: number;

  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: Date;
}

/**
 * ============================================================================
 * REPORT 4: BUDGET UTILIZATION REPORT
 * ============================================================================
 */

/**
 * Cost category breakdown item
 */
export class CostCategoryBreakdownDto {
  @ApiProperty({
    description: 'Cost category name',
    example: 'Materials',
  })
  categoryName: string;

  @ApiProperty({
    description: 'Total amount spent',
    example: 5000000,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Number of transactions',
    example: 120,
  })
  transactionCount: number;

  @ApiProperty({
    description: 'Percentage of total costs',
    example: 20.5,
  })
  percentage: number;
}

/**
 * Single project budget utilization item
 */
export class ProjectBudgetItemDto {
  @ApiProperty({
    description: 'Project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  projectId: string;

  @ApiProperty({
    description: 'Project code',
    example: 'PRJ-0001',
  })
  projectCode: string;

  @ApiProperty({
    description: 'Project name',
    example: 'Hospital Construction',
  })
  projectName: string;

  @ApiProperty({
    description: 'Project status',
    enum: ProjectStatus,
    example: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @ApiProperty({
    description: 'Budget status',
    enum: BudgetStatus,
    example: BudgetStatus.WITHIN_BUDGET,
  })
  budgetStatus: BudgetStatus;

  @ApiProperty({
    description: 'Project budget',
    example: 5000000,
  })
  budget: number;

  @ApiProperty({
    description: 'Actual cost spent',
    example: 3500000,
  })
  actualCost: number;

  @ApiProperty({
    description: 'Budget variance (budget - actual)',
    example: 1500000,
  })
  budgetVariance: number;

  @ApiProperty({
    description: 'Budget utilization percentage',
    example: 70.0,
  })
  utilization: number;

  @ApiProperty({
    description: 'Completion percentage',
    example: 65.5,
  })
  completionPercentage: number;

  @ApiProperty({
    description: 'Cost efficiency (completion / utilization)',
    example: 93.57,
  })
  costEfficiency: number;
}

/**
 * Budget status summary
 */
export class BudgetStatusSummaryDto {
  @ApiProperty({
    description: 'Budget status',
    enum: BudgetStatus,
    example: BudgetStatus.WITHIN_BUDGET,
  })
  budgetStatus: BudgetStatus;

  @ApiProperty({ description: 'Number of projects', example: 25 })
  projectCount: number;

  @ApiProperty({ description: 'Percentage of total', example: 50.0 })
  percentage: number;

  @ApiProperty({ description: 'Total budget', example: 25000000 })
  totalBudget: number;

  @ApiProperty({ description: 'Total actual cost', example: 18000000 })
  totalActualCost: number;

  @ApiProperty({ description: 'Total variance', example: 7000000 })
  totalVariance: number;
}

/**
 * Main response for Budget Utilization Report
 */
export class BudgetUtilizationResponseDto {
  @ApiProperty({
    description: 'Project budget items',
    type: [ProjectBudgetItemDto],
  })
  projects: ProjectBudgetItemDto[];

  @ApiProperty({
    description: 'Budget status summary',
    type: [BudgetStatusSummaryDto],
  })
  budgetStatusSummary: BudgetStatusSummaryDto[];

  @ApiPropertyOptional({
    description: 'Cost breakdown by category (if requested)',
    type: [CostCategoryBreakdownDto],
  })
  costBreakdown?: CostCategoryBreakdownDto[];

  // === SUMMARY METRICS ===
  @ApiProperty({ description: 'Total projects included', example: 50 })
  totalProjects: number;

  @ApiProperty({ description: 'Total budget', example: 50000000 })
  totalBudget: number;

  @ApiProperty({ description: 'Total actual cost', example: 35000000 })
  totalActualCost: number;

  @ApiProperty({ description: 'Total budget variance', example: 15000000 })
  totalVariance: number;

  @ApiProperty({ description: 'Average utilization', example: 70.0 })
  avgUtilization: number;

  @ApiProperty({ description: 'Average cost efficiency', example: 85.5 })
  avgCostEfficiency: number;

  @ApiProperty({ description: 'Projects over budget', example: 5 })
  overBudgetCount: number;

  @ApiProperty({ description: 'Projects within budget', example: 35 })
  withinBudgetCount: number;

  @ApiProperty({ description: 'Projects under budget', example: 10 })
  underBudgetCount: number;

  // === METADATA ===
  @ApiProperty({ description: 'Currency code', example: 'SAR' })
  currency: string;

  @ApiProperty({ description: 'Report month', example: 1 })
  month: number;

  @ApiProperty({ description: 'Report year', example: 2026 })
  year: number;

  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: Date;
}
