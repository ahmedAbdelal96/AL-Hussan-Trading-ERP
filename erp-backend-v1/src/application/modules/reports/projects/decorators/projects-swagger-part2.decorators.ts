/**
 * ============================================================================
 * PROJECTS REPORTS - SWAGGER DECORATORS (Part 2: Reports 5-7)
 * ============================================================================
 *
 * Comprehensive Swagger documentation decorators
 *
 * @module ProjectsSwaggerPart2Decorators
 * @version 1.0.0
 */

import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { TimelineStatus } from '../dto';

/**
 * ============================================================================
 * REPORT 5: TIMELINE PROGRESS SWAGGER
 * ============================================================================
 */
export function TimelineProgressDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get Timeline Progress Report',
      description: `
## Timeline Progress Report ⏱️

Comprehensive timeline analysis showing project schedules, progress, and delays.

### Features:
- **Timeline Status**: On time, behind schedule, ahead, not started
- **Schedule Analysis**: Planned vs actual dates comparison
- **Progress Tracking**: Days elapsed, remaining, variance
- **Performance Metrics**: Schedule performance index (SPI)
- **Risk Identification**: At-risk projects flagging
- **Completion Range**: Filter by completion percentage

### Use Cases:
- Schedule performance monitoring
- Delay identification and tracking
- Resource reallocation decisions
- Project timeline forecasting
- PMO dashboard metrics

### Timeline Status Types:
- ON_TIME: Within ±5% of planned timeline
- BEHIND_SCHEDULE: Delayed by >5%
- AHEAD_OF_SCHEDULE: Ahead by >5%
- NOT_STARTED: Planned start date not yet reached

### Key Metrics:
- Days Variance: Negative = behind, Positive = ahead
- Schedule Performance: completion% / time_elapsed%
- At Risk: Projects likely to miss deadline

### Performance:
- Optimized date calculations
- Response time: ~200-400ms
- Real-time progress analysis
      `,
    }),
    ApiQuery({
      name: 'month',
      required: false,
      type: Number,
      description: 'Month for report (1-12)',
    }),
    ApiQuery({
      name: 'year',
      required: false,
      type: Number,
      description: 'Year for report',
    }),
    ApiQuery({
      name: 'projectStatus',
      required: false,
      enum: ProjectStatus,
      description: 'Filter by project status',
    }),
    ApiQuery({
      name: 'siteId',
      required: false,
      type: String,
      description: 'Filter by site ID',
    }),
    ApiQuery({
      name: 'managerId',
      required: false,
      type: String,
      description: 'Filter by manager ID',
    }),
    ApiQuery({
      name: 'timelineStatus',
      required: false,
      enum: TimelineStatus,
      description: 'Filter by timeline status',
      example: 'BEHIND_SCHEDULE',
    }),
    ApiQuery({
      name: 'minCompletion',
      required: false,
      type: Number,
      description: 'Minimum completion percentage (0-100)',
      example: 0,
    }),
    ApiQuery({
      name: 'maxCompletion',
      required: false,
      type: Number,
      description: 'Maximum completion percentage (0-100)',
      example: 100,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['daysVariance', 'completion', 'plannedEndDate', 'daysRemaining'],
      description: 'Sort by field',
      example: 'daysVariance',
    }),
    ApiResponse({
      status: 200,
      description: 'Timeline progress report generated successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
    ApiForbiddenResponse({
      description: 'Forbidden - Missing permission',
    }),
  );
}

/**
 * ============================================================================
 * REPORT 6: DELAYED PROJECTS SWAGGER
 * ============================================================================
 */
export function DelayedProjectsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get Delayed Projects Report',
      description: `
## Delayed Projects Report ⚠️

Focused report on projects experiencing delays with risk assessment.

### Features:
- **Delay Tracking**: Days behind schedule for each project
- **Risk Classification**: Minor, Moderate, Major, Critical delays
- **Budget Impact**: Budget at risk due to delays
- **Delay Reasons**: Captured from progress notes
- **Critical Alerts**: Projects with 30+ days delay
- **Action Items**: Prioritized list for intervention

### Use Cases:
- Urgent intervention identification
- Risk management and mitigation
- Escalation to management
- Resource reallocation priorities
- Contractor performance review

### Delay Categories:
- **Minor**: 1-7 days delay
- **Moderate**: 8-30 days delay  
- **Major**: 31-60 days delay
- **Critical**: 60+ days delay

### Risk Indicators:
- isCritical: 30+ days delay
- budgetAtRisk: Estimated additional cost
- daysRemaining: Can be negative (overdue)

### Performance:
- Filtered query for delayed only
- Response time: ~150-300ms
- Priority-sorted results
      `,
    }),
    ApiQuery({
      name: 'month',
      required: false,
      type: Number,
      description: 'Month for report (1-12)',
    }),
    ApiQuery({
      name: 'year',
      required: false,
      type: Number,
      description: 'Year for report',
    }),
    ApiQuery({
      name: 'projectStatus',
      required: false,
      enum: ProjectStatus,
      description: 'Filter by project status',
    }),
    ApiQuery({
      name: 'siteId',
      required: false,
      type: String,
      description: 'Filter by site ID',
    }),
    ApiQuery({
      name: 'managerId',
      required: false,
      type: String,
      description: 'Filter by manager ID',
    }),
    ApiQuery({
      name: 'minDelayDays',
      required: false,
      type: Number,
      description: 'Minimum delay in days',
      example: 1,
    }),
    ApiQuery({
      name: 'atRiskOnly',
      required: false,
      type: Boolean,
      description: 'Show only at-risk projects',
      example: false,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['delayDays', 'budget', 'completion', 'daysRemaining'],
      description: 'Sort by field',
      example: 'delayDays',
    }),
    ApiResponse({
      status: 200,
      description: 'Delayed projects report generated successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
    ApiForbiddenResponse({
      description: 'Forbidden - Missing permission',
    }),
  );
}

/**
 * ============================================================================
 * REPORT 7: COMPLETED PROJECTS SWAGGER
 * ============================================================================
 */
export function CompletedProjectsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get Completed Projects Report',
      description: `
## Completed Projects Report ✅

Comprehensive analysis of completed projects with success metrics and lessons learned.

### Features:
- **Success Analysis**: On-time and within-budget metrics
- **Duration Performance**: Actual vs planned duration
- **Budget Performance**: Final cost vs budget comparison
- **Project Scoring**: 0-100 score based on multiple factors
- **Performance Categories**: Excellent, Good, Fair, Poor
- **Completion Period**: Filter by specific completion month/year

### Use Cases:
- Historical performance analysis
- Success rate tracking
- Best practices identification
- Post-project review
- Future project estimation
- Team performance evaluation

### Success Criteria:
- **Successful Project**: Both on-time AND within budget
- **On-Time**: Completed within ±5% of planned duration
- **Within Budget**: Final cost within ±5% of budget

### Project Scoring (0-100):
- **90-100**: Excellent - Early + Under budget
- **75-89**: Good - On time + Within budget
- **60-74**: Fair - Minor delays or cost overruns
- **0-59**: Poor - Significant issues

### Metrics Included:
- Success rate percentage
- Average duration variance
- Average budget performance
- Total budget saved/overrun
- Completion distribution

### Performance:
- Query with date range filtering
- Response time: ~200-350ms
- Historical data analysis
      `,
    }),
    ApiQuery({
      name: 'month',
      required: false,
      type: Number,
      description: 'Month for report (1-12)',
    }),
    ApiQuery({
      name: 'year',
      required: false,
      type: Number,
      description: 'Year for report',
    }),
    ApiQuery({
      name: 'projectStatus',
      required: false,
      enum: ProjectStatus,
      description: 'Should be COMPLETED (auto-filtered)',
    }),
    ApiQuery({
      name: 'siteId',
      required: false,
      type: String,
      description: 'Filter by site ID',
    }),
    ApiQuery({
      name: 'managerId',
      required: false,
      type: String,
      description: 'Filter by manager ID',
    }),
    ApiQuery({
      name: 'completionMonth',
      required: false,
      type: Number,
      description: 'Filter by completion month (1-12)',
      example: 12,
    }),
    ApiQuery({
      name: 'completionYear',
      required: false,
      type: Number,
      description: 'Filter by completion year',
      example: 2026,
    }),
    ApiQuery({
      name: 'successfulOnly',
      required: false,
      type: Boolean,
      description: 'Show only successful projects',
      example: false,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['completionDate', 'duration', 'budgetPerformance', 'budget'],
      description: 'Sort by field',
      example: 'completionDate',
    }),
    ApiResponse({
      status: 200,
      description: 'Completed projects report generated successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
    ApiForbiddenResponse({
      description: 'Forbidden - Missing permission',
    }),
  );
}
