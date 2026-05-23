/**
 * ============================================================================
 * PROJECTS STATISTICS DTOs
 * ============================================================================
 *
 * DTOs لإحصائيات المشاريع الشاملة
 *
 * يحتوي على:
 * - معاملات الفلترة (ProjectsStatisticsParams)
 * - DTO الإحصائيات الرئيسي (ProjectsStatisticsDto)
 * - DTOs التحليلات المختلفة (Status, Timeline, Budget, Monthly, etc.)
 *
 * @module ProjectsStatisticsDto
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';

/**
 * ============================================================================
 * ENUMS
 * ============================================================================
 */

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED',
}

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
 * QUERY PARAMETERS
 * ============================================================================
 */

export class ProjectsStatisticsParams {
  @ApiPropertyOptional({
    description: 'Filter by start date (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by project status',
    enum: ProjectStatus,
    example: ProjectStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({
    description: 'Filter by site ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiPropertyOptional({
    description: 'Filter by manager ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  managerId?: string;
}

/**
 * ============================================================================
 * BREAKDOWN DTOs
 * ============================================================================
 */

/**
 * DTO للتوزيع حسب الحالة
 */
export class StatusBreakdownDto {
  @ApiProperty({
    description: 'Project status',
    enum: ProjectStatus,
    example: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @ApiProperty({
    description: 'Number of projects in this status',
    example: 15,
  })
  count: number;

  @ApiProperty({
    description: 'Percentage of total projects',
    example: 35.5,
  })
  percentage: number;

  @ApiProperty({
    description: 'Total budget for projects in this status',
    example: 5000000,
  })
  totalBudget: number;

  @ApiProperty({
    description: 'Total actual cost for projects in this status',
    example: 4500000,
  })
  totalActualCost: number;

  @ApiProperty({
    description: 'Average completion percentage',
    example: 65.5,
  })
  averageCompletion: number;
}

/**
 * DTO للتوزيع حسب الجدول الزمني
 */
export class TimelineBreakdownDto {
  @ApiProperty({
    description: 'Timeline status',
    enum: TimelineStatus,
    example: TimelineStatus.ON_TIME,
  })
  timelineStatus: TimelineStatus;

  @ApiProperty({
    description: 'Number of projects',
    example: 10,
  })
  count: number;

  @ApiProperty({
    description: 'Percentage of total active projects',
    example: 45.5,
  })
  percentage: number;

  @ApiProperty({
    description: 'Average days variance (negative = behind, positive = ahead)',
    example: -5,
  })
  averageDaysVariance: number;
}

/**
 * DTO للتوزيع حسب الميزانية
 */
export class BudgetBreakdownDto {
  @ApiProperty({
    description: 'Budget status',
    enum: BudgetStatus,
    example: BudgetStatus.WITHIN_BUDGET,
  })
  budgetStatus: BudgetStatus;

  @ApiProperty({
    description: 'Number of projects',
    example: 8,
  })
  count: number;

  @ApiProperty({
    description: 'Percentage of total projects with budget',
    example: 40.0,
  })
  percentage: number;

  @ApiProperty({
    description: 'Total budget variance',
    example: 150000,
  })
  totalVariance: number;

  @ApiProperty({
    description: 'Average budget variance percentage',
    example: 5.5,
  })
  averageVariancePercentage: number;
}

/**
 * DTO للبيانات الشهرية
 */
export class MonthlyTrendDto {
  @ApiProperty({
    description: 'Month in YYYY-MM format',
    example: '2024-01',
  })
  month: string;

  @ApiProperty({
    description: 'Number of projects started',
    example: 5,
  })
  projectsStarted: number;

  @ApiProperty({
    description: 'Number of projects completed',
    example: 3,
  })
  projectsCompleted: number;

  @ApiProperty({
    description: 'Number of projects cancelled',
    example: 1,
  })
  projectsCancelled: number;

  @ApiProperty({
    description: 'Total budget for started projects',
    example: 1500000,
  })
  totalBudget: number;

  @ApiProperty({
    description: 'Total actual cost',
    example: 1200000,
  })
  totalActualCost: number;

  @ApiProperty({
    description: 'Number of active projects at month end',
    example: 15,
  })
  activeProjectsCount: number;
}

/**
 * DTO للمشاريع الأكبر
 */
export class TopProjectDto {
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
    example: 'New Hospital Construction',
  })
  projectName: string;

  @ApiProperty({
    description: 'Project status',
    enum: ProjectStatus,
    example: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @ApiProperty({
    description: 'Budget amount',
    example: 5000000,
  })
  budget: number;

  @ApiProperty({
    description: 'Actual cost',
    example: 3500000,
  })
  actualCost: number;

  @ApiProperty({
    description: 'Budget variance',
    example: 1500000,
  })
  budgetVariance: number;

  @ApiProperty({
    description: 'Completion percentage',
    example: 65.5,
  })
  completionPercentage: number;

  @ApiProperty({
    description: 'Duration in days',
    example: 180,
  })
  durationDays: number;
}

/**
 * DTO لتوزيع الموظفين
 */
export class EmployeeDistributionDto {
  @ApiProperty({
    description: 'Project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  projectId: string;

  @ApiProperty({
    description: 'Project name',
    example: 'New Hospital Construction',
  })
  projectName: string;

  @ApiProperty({
    description: 'Number of employees',
    example: 25,
  })
  employeeCount: number;

  @ApiProperty({
    description: 'Total cost for employees',
    example: 500000,
  })
  totalEmployeeCost: number;
}

/**
 * DTO لتوزيع المواقع
 */
export class SiteDistributionDto {
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
    description: 'Number of projects',
    example: 8,
  })
  projectCount: number;

  @ApiProperty({
    description: 'Total budget for projects at this site',
    example: 10000000,
  })
  totalBudget: number;

  @ApiProperty({
    description: 'Number of active projects',
    example: 5,
  })
  activeProjectsCount: number;

  @ApiProperty({
    description: 'Number of completed projects',
    example: 3,
  })
  completedProjectsCount: number;
}

/**
 * ============================================================================
 * MAIN STATISTICS DTO
 * ============================================================================
 */

export class ProjectsStatisticsDto {
  // ============================================
  // OVERVIEW METRICS (14 KPIs)
  // ============================================

  @ApiProperty({
    description: 'Total number of projects',
    example: 50,
  })
  totalProjects: number;

  @ApiProperty({
    description: 'Number of draft projects',
    example: 5,
  })
  draftProjects: number;

  @ApiProperty({
    description: 'Number of projects in planning',
    example: 8,
  })
  planningProjects: number;

  @ApiProperty({
    description: 'Number of active projects',
    example: 20,
  })
  activeProjects: number;

  @ApiProperty({
    description: 'Number of projects on hold',
    example: 3,
  })
  onHoldProjects: number;

  @ApiProperty({
    description: 'Number of completed projects',
    example: 12,
  })
  completedProjects: number;

  @ApiProperty({
    description: 'Number of cancelled projects',
    example: 2,
  })
  cancelledProjects: number;

  @ApiProperty({
    description: 'Overall completion rate (completed / (completed + active))',
    example: 37.5,
  })
  completionRate: number;

  @ApiProperty({
    description: 'Total budget across all projects',
    example: 50000000,
  })
  totalBudget: number;

  @ApiProperty({
    description: 'Total actual cost across all projects',
    example: 35000000,
  })
  totalActualCost: number;

  @ApiProperty({
    description: 'Overall budget variance (budget - actual cost)',
    example: 15000000,
  })
  budgetVariance: number;

  @ApiProperty({
    description: 'Average completion percentage across active projects',
    example: 55.5,
  })
  averageCompletion: number;

  // ============================================
  // BREAKDOWNS (8 Analysis)
  // ============================================

  @ApiProperty({
    description: 'Projects breakdown by status',
    type: [StatusBreakdownDto],
  })
  statusBreakdown: StatusBreakdownDto[];

  @ApiProperty({
    description: 'Monthly trend data (last 12 months)',
    type: [MonthlyTrendDto],
  })
  monthlyTrend: MonthlyTrendDto[];

  @ApiProperty({
    description: 'Top 10 projects by budget',
    type: [TopProjectDto],
  })
  topProjectsByBudget: TopProjectDto[];

  @ApiProperty({
    description: 'Top 10 projects by actual cost',
    type: [TopProjectDto],
  })
  topProjectsByCost: TopProjectDto[];

  @ApiProperty({
    description: 'Employee distribution across projects',
    type: [EmployeeDistributionDto],
  })
  employeeDistribution: EmployeeDistributionDto[];

  @ApiProperty({
    description: 'Project distribution by site',
    type: [SiteDistributionDto],
  })
  siteDistribution: SiteDistributionDto[];

  // ============================================
  // METADATA
  // ============================================

  @ApiProperty({
    description: 'Timestamp when statistics were generated',
    example: '2024-01-15T10:30:00Z',
  })
  generatedAt: Date;
}
