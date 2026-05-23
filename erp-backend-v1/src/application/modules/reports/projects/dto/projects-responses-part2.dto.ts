/**
 * ============================================================================
 * PROJECTS REPORTS - RESPONSE DTOs (Part 2: Reports 5-7)
 * ============================================================================
 *
 * Response structures for the remaining 3 project reports
 *
 * Reports Included:
 * 5. Timeline Progress Report
 * 6. Delayed Projects Report
 * 7. Completed Projects Report
 *
 * @module ProjectsResponsesPart2Dto
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { TimelineStatus } from './projects-filters.dto';

/**
 * ============================================================================
 * REPORT 5: TIMELINE PROGRESS REPORT
 * ============================================================================
 */

/**
 * Timeline status summary
 */
export class TimelineStatusSummaryDto {
  @ApiProperty({
    description: 'Timeline status',
    enum: TimelineStatus,
    example: TimelineStatus.ON_TIME,
  })
  timelineStatus: TimelineStatus;

  @ApiProperty({
    description: 'Status name (English)',
    example: 'On Time',
  })
  statusName: string;

  @ApiProperty({
    description: 'Status name (Arabic)',
    example: 'في الموعد',
  })
  statusNameAr: string;

  @ApiProperty({ description: 'Number of projects', example: 15 })
  projectCount: number;

  @ApiProperty({ description: 'Percentage of total', example: 30.0 })
  percentage: number;

  @ApiProperty({ description: 'Average days variance', example: -5 })
  avgDaysVariance: number;

  @ApiProperty({ description: 'Average completion', example: 55.5 })
  avgCompletion: number;
}

/**
 * Single project timeline item
 */
export class ProjectTimelineItemDto {
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
    description: 'Timeline status',
    enum: TimelineStatus,
    example: TimelineStatus.ON_TIME,
  })
  timelineStatus: TimelineStatus;

  @ApiPropertyOptional({
    description: 'Planned start date',
    example: '2026-01-01',
  })
  plannedStartDate?: string;

  @ApiPropertyOptional({
    description: 'Actual start date',
    example: '2026-01-03',
  })
  actualStartDate?: string;

  @ApiPropertyOptional({
    description: 'Planned end date',
    example: '2026-12-31',
  })
  plannedEndDate?: string;

  @ApiPropertyOptional({
    description: 'Expected completion date (based on current progress)',
    example: '2026-12-28',
  })
  expectedCompletionDate?: string;

  @ApiProperty({
    description: 'Completion percentage',
    example: 65.5,
  })
  completionPercentage: number;

  @ApiProperty({
    description: 'Planned duration in days',
    example: 365,
  })
  plannedDuration: number;

  @ApiProperty({
    description: 'Elapsed days since start',
    example: 180,
  })
  elapsedDays: number;

  @ApiProperty({
    description: 'Days remaining until planned end',
    example: 185,
  })
  daysRemaining: number;

  @ApiProperty({
    description: 'Days variance (negative = behind, positive = ahead)',
    example: -3,
  })
  daysVariance: number;

  @ApiProperty({
    description: 'Schedule performance index (completion / time elapsed %)',
    example: 0.95,
  })
  schedulePerformance: number;

  @ApiProperty({
    description: 'Is at risk of delay',
    example: false,
  })
  isAtRisk: boolean;
}

/**
 * Main response for Timeline Progress Report
 */
export class TimelineProgressResponseDto {
  @ApiProperty({
    description: 'Project timeline items',
    type: [ProjectTimelineItemDto],
  })
  projects: ProjectTimelineItemDto[];

  @ApiProperty({
    description: 'Timeline status summary',
    type: [TimelineStatusSummaryDto],
  })
  timelineSummary: TimelineStatusSummaryDto[];

  // === SUMMARY METRICS ===
  @ApiProperty({ description: 'Total projects analyzed', example: 50 })
  totalProjects: number;

  @ApiProperty({ description: 'Projects on time', example: 30 })
  onTimeCount: number;

  @ApiProperty({ description: 'Projects behind schedule', example: 15 })
  behindScheduleCount: number;

  @ApiProperty({ description: 'Projects ahead of schedule', example: 5 })
  aheadOfScheduleCount: number;

  @ApiProperty({ description: 'Projects not started', example: 0 })
  notStartedCount: number;

  @ApiProperty({ description: 'Projects at risk', example: 8 })
  atRiskCount: number;

  @ApiProperty({ description: 'Average days variance', example: -2.5 })
  avgDaysVariance: number;

  @ApiProperty({ description: 'Average schedule performance', example: 0.92 })
  avgSchedulePerformance: number;

  @ApiProperty({ description: 'Average completion', example: 55.5 })
  avgCompletion: number;

  // === METADATA ===
  @ApiProperty({ description: 'Report month', example: 1 })
  month: number;

  @ApiProperty({ description: 'Report year', example: 2026 })
  year: number;

  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: Date;
}

/**
 * ============================================================================
 * REPORT 6: DELAYED PROJECTS REPORT
 * ============================================================================
 */

/**
 * Single delayed project item
 */
export class DelayedProjectItemDto {
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

  @ApiPropertyOptional({
    description: 'Site name',
    example: 'Riyadh Central',
  })
  siteName?: string;

  @ApiPropertyOptional({
    description: 'Manager name',
    example: 'John Doe',
  })
  managerName?: string;

  @ApiPropertyOptional({
    description: 'Planned start date',
    example: '2026-01-01',
  })
  plannedStartDate?: string;

  @ApiPropertyOptional({
    description: 'Actual start date',
    example: '2026-01-03',
  })
  actualStartDate?: string;

  @ApiPropertyOptional({
    description: 'Planned end date',
    example: '2026-12-31',
  })
  plannedEndDate?: string;

  @ApiPropertyOptional({
    description: 'Expected completion date',
    example: '2027-01-15',
  })
  expectedCompletionDate?: string;

  @ApiProperty({
    description: 'Delay in days',
    example: 15,
  })
  delayDays: number;

  @ApiProperty({
    description: 'Delay category',
    example: 'Moderate',
  })
  delayCategory: string;

  @ApiProperty({
    description: 'Completion percentage',
    example: 45.5,
  })
  completionPercentage: number;

  @ApiProperty({
    description: 'Days remaining (can be negative)',
    example: -5,
  })
  daysRemaining: number;

  @ApiProperty({
    description: 'Is at critical risk',
    example: true,
  })
  isCritical: boolean;

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
    description: 'Budget at risk due to delay',
    example: 500000,
  })
  budgetAtRisk: number;

  @ApiPropertyOptional({
    description: 'Delay reason/notes',
    example: 'Material shortage',
  })
  delayReason?: string;

  @ApiPropertyOptional({
    description: 'Last progress update',
    example: '2026-01-15T10:00:00Z',
  })
  lastProgressUpdate?: string;
}

/**
 * Delay category summary
 */
export class DelayCategorySummaryDto {
  @ApiProperty({
    description: 'Delay category (Minor: 1-7 days, Moderate: 8-30, Major: 31+)',
    example: 'Moderate',
  })
  category: string;

  @ApiProperty({ description: 'Number of projects', example: 8 })
  projectCount: number;

  @ApiProperty({ description: 'Percentage of delayed projects', example: 40.0 })
  percentage: number;

  @ApiProperty({ description: 'Average delay days', example: 15 })
  avgDelayDays: number;

  @ApiProperty({ description: 'Total budget at risk', example: 5000000 })
  totalBudgetAtRisk: number;
}

/**
 * Main response for Delayed Projects Report
 */
export class DelayedProjectsResponseDto {
  @ApiProperty({
    description: 'Delayed project items',
    type: [DelayedProjectItemDto],
  })
  projects: DelayedProjectItemDto[];

  @ApiProperty({
    description: 'Delay category summary',
    type: [DelayCategorySummaryDto],
  })
  delaySummary: DelayCategorySummaryDto[];

  // === SUMMARY METRICS ===
  @ApiProperty({ description: 'Total delayed projects', example: 20 })
  totalDelayedProjects: number;

  @ApiProperty({
    description: 'Critical projects (30+ days delay)',
    example: 5,
  })
  criticalProjectsCount: number;

  @ApiProperty({ description: 'Average delay in days', example: 18.5 })
  avgDelayDays: number;

  @ApiProperty({ description: 'Maximum delay in days', example: 45 })
  maxDelayDays: number;

  @ApiProperty({ description: 'Total budget at risk', example: 15000000 })
  totalBudgetAtRisk: number;

  @ApiProperty({
    description: 'Average completion of delayed projects',
    example: 42.5,
  })
  avgCompletion: number;

  @ApiProperty({
    description: 'Percentage of total active projects',
    example: 40.0,
  })
  percentageOfActive: number;

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
 * REPORT 7: COMPLETED PROJECTS REPORT
 * ============================================================================
 */

/**
 * Single completed project item
 */
export class CompletedProjectItemDto {
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

  @ApiPropertyOptional({
    description: 'Site name',
    example: 'Riyadh Central',
  })
  siteName?: string;

  @ApiPropertyOptional({
    description: 'Manager name',
    example: 'John Doe',
  })
  managerName?: string;

  @ApiPropertyOptional({
    description: 'Planned start date',
    example: '2025-01-01',
  })
  plannedStartDate?: string;

  @ApiPropertyOptional({
    description: 'Actual start date',
    example: '2025-01-01',
  })
  actualStartDate?: string;

  @ApiPropertyOptional({
    description: 'Planned end date',
    example: '2025-12-31',
  })
  plannedEndDate?: string;

  @ApiPropertyOptional({
    description: 'Actual completion date',
    example: '2025-12-31',
  })
  actualEndDate?: string;

  @ApiProperty({
    description: 'Actual duration in days',
    example: 365,
  })
  actualDuration: number;

  @ApiProperty({
    description: 'Planned duration in days',
    example: 360,
  })
  plannedDuration: number;

  @ApiProperty({
    description: 'Duration variance in days',
    example: 5,
  })
  durationVariance: number;

  @ApiProperty({
    description: 'Was completed on time',
    example: false,
  })
  onTime: boolean;

  @ApiProperty({
    description: 'Project budget',
    example: 5000000,
  })
  budget: number;

  @ApiProperty({
    description: 'Final actual cost',
    example: 4800000,
  })
  actualCost: number;

  @ApiProperty({
    description: 'Budget variance (budget - actual)',
    example: 200000,
  })
  budgetVariance: number;

  @ApiProperty({
    description: 'Budget performance percentage',
    example: 96.0,
  })
  budgetPerformance: number;

  @ApiProperty({
    description: 'Was completed within budget',
    example: true,
  })
  withinBudget: boolean;

  @ApiProperty({
    description: 'Project was successful (on time AND within budget)',
    example: false,
  })
  isSuccessful: boolean;

  @ApiProperty({
    description: 'Final completion percentage (should be 100)',
    example: 100,
  })
  completionPercentage: number;

  @ApiProperty({
    description: 'Overall project score (0-100)',
    example: 85.5,
  })
  projectScore: number;
}

/**
 * Performance category summary
 */
export class PerformanceCategorySummaryDto {
  @ApiProperty({
    description: 'Performance category',
    example: 'Excellent',
  })
  category: string;

  @ApiProperty({ description: 'Number of projects', example: 5 })
  projectCount: number;

  @ApiProperty({ description: 'Percentage of total', example: 33.33 })
  percentage: number;

  @ApiProperty({ description: 'Average project score', example: 92.5 })
  avgScore: number;
}

/**
 * Main response for Completed Projects Report
 */
export class CompletedProjectsResponseDto {
  @ApiProperty({
    description: 'Completed project items',
    type: [CompletedProjectItemDto],
  })
  projects: CompletedProjectItemDto[];

  @ApiProperty({
    description: 'Performance category summary',
    type: [PerformanceCategorySummaryDto],
  })
  performanceSummary: PerformanceCategorySummaryDto[];

  // === SUMMARY METRICS ===
  @ApiProperty({ description: 'Total completed projects', example: 15 })
  totalCompleted: number;

  @ApiProperty({
    description: 'Successful projects (on time + within budget)',
    example: 8,
  })
  successfulCount: number;

  @ApiProperty({ description: 'Success rate percentage', example: 53.33 })
  successRate: number;

  @ApiProperty({ description: 'Projects completed on time', example: 10 })
  onTimeCount: number;

  @ApiProperty({ description: 'Projects within budget', example: 12 })
  withinBudgetCount: number;

  @ApiProperty({ description: 'Average duration in days', example: 180 })
  avgDuration: number;

  @ApiProperty({ description: 'Average duration variance', example: 5.5 })
  avgDurationVariance: number;

  @ApiProperty({ description: 'Average budget performance', example: 95.5 })
  avgBudgetPerformance: number;

  @ApiProperty({ description: 'Average project score', example: 82.5 })
  avgProjectScore: number;

  @ApiProperty({
    description: 'Total budget of completed projects',
    example: 75000000,
  })
  totalBudget: number;

  @ApiProperty({ description: 'Total actual cost', example: 72000000 })
  totalActualCost: number;

  @ApiProperty({ description: 'Total budget saved', example: 3000000 })
  totalSaved: number;

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
