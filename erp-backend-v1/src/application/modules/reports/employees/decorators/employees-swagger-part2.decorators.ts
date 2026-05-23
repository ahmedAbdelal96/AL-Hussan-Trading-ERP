/**
 * ============================================================================
 * EMPLOYEES REPORTS - SWAGGER DECORATORS (PART 2)
 * ============================================================================
 *
 * API documentation decorators for remaining 3 reports
 *
 * @module EmployeesSwaggerDecorators2
 * @version 1.0.0
 */

import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import {
  AgeExperienceResponseDto,
  TurnoverAnalysisResponseDto,
  StatusDistributionResponseDto,
} from '../dto';

/**
 * ============================================================================
 * REPORT 5: AGE & EXPERIENCE ANALYSIS
 * ============================================================================
 */
export function AgeExperienceDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get Age & Experience Analysis Report',
      description: `
# Age & Experience Analysis Report

Comprehensive workforce demographics analysis by age and experience.

## Features
- **Age Group Breakdown**: Distribution across age ranges
  - 18-25: Entry level, fresh graduates
  - 26-35: Early career professionals
  - 36-45: Mid-career professionals
  - 46-55: Senior professionals
  - 56+: Late career, near retirement
- **Experience Range Analysis**: Tenure-based distribution
  - 0-1 years: New hires, probation
  - 1-3 years: Junior employees
  - 3-5 years: Mid-level employees
  - 5-10 years: Senior employees
  - 10+ years: Veterans, long-tenured
- **Department Summary**: Age/experience metrics per department
- **Gender Distribution**: Age breakdown by gender
- **Statistical Metrics**: Average, median, min, max age

## Key Metrics
- Total employees analyzed
- Average age across workforce
- Average tenure (experience)
- Median age for balanced view
- Age range (youngest to oldest)
- Demographic segments (under 30, 30-45, over 45)

## Use Cases
- Succession planning
- Retirement risk assessment
- Diversity and inclusion tracking
- Training needs analysis
- Recruitment targeting
- Workforce aging trends
- Knowledge transfer planning

## Performance
- Response time: ~200-400ms
- Complex age calculations
- Multi-level grouping
- Handles 1000+ employees

## Filters
- minAge/maxAge: Age range filtering
- minExperience/maxExperience: Tenure range filtering
      `,
    }),
    ApiQuery({ name: 'month', required: false, type: Number }),
    ApiQuery({ name: 'year', required: false, type: Number }),
    ApiQuery({ name: 'department', required: false, type: String }),
    ApiQuery({
      name: 'employmentType',
      required: false,
      enum: ['PERMANENT', 'CONTRACT', 'FREELANCE', 'PART_TIME'],
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'],
    }),
    ApiQuery({
      name: 'minAge',
      required: false,
      type: Number,
      description: 'Minimum age filter',
      example: 18,
    }),
    ApiQuery({
      name: 'maxAge',
      required: false,
      type: Number,
      description: 'Maximum age filter',
      example: 65,
    }),
    ApiQuery({
      name: 'minExperience',
      required: false,
      type: Number,
      description: 'Minimum experience (years)',
      example: 0,
    }),
    ApiQuery({
      name: 'maxExperience',
      required: false,
      type: Number,
      description: 'Maximum experience (years)',
      example: 20,
    }),
    ApiResponse({
      status: 200,
      description: 'Age & experience report retrieved successfully',
      type: AgeExperienceResponseDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid query parameters' }),
    ApiUnauthorizedResponse({ description: 'User not authenticated' }),
    ApiForbiddenResponse({ description: 'Insufficient permissions' }),
  );
}

/**
 * ============================================================================
 * REPORT 6: TURNOVER ANALYSIS
 * ============================================================================
 */
export function TurnoverAnalysisDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get Turnover Analysis Report',
      description: `
# Turnover Analysis Report

Comprehensive employee turnover tracking and risk assessment.

## Features
- **Monthly Trend**: New hires, terminations, net change over time
- **Turnover Rate Calculation**: Monthly and average rates
- **Termination Reasons**: Breakdown of why employees leave
  - Resignation (voluntary)
  - Termination (involuntary)
  - Contract expiry
  - Retirement
  - Other reasons
- **Department Analysis**: Turnover rates by department
- **Tenure of Leavers**: How long employees stayed before leaving
- **Risk Assessment**: Automatic risk level determination

## Key Metrics
- Total new hires in period
- Total terminations in period
- Net workforce change
- Average monthly turnover rate
- Highest/lowest monthly turnover
- Average tenure of terminated employees
- Voluntary termination rate (resignations)

## Risk Levels
- **Low**: Average turnover < 5%
- **Medium**: Average turnover 5-10%
- **High**: Average turnover > 10%

## Turnover Rate Formula
Monthly Turnover % = (Terminations / Total Employees) × 100

## Use Cases
- Retention strategy development
- HR effectiveness measurement
- Exit interview prioritization
- Department health assessment
- Budget planning for recruitment
- Workforce stability tracking
- Employee satisfaction indicators

## Performance
- Response time: ~300-500ms
- Multi-month aggregations
- Complex grouping operations
- Default: 12 months analysis

## Analysis Period
- months: Number of months to analyze (1-24)
- Default: 12 months for annual view
      `,
    }),
    ApiQuery({ name: 'month', required: false, type: Number }),
    ApiQuery({ name: 'year', required: false, type: Number }),
    ApiQuery({ name: 'department', required: false, type: String }),
    ApiQuery({
      name: 'employmentType',
      required: false,
      enum: ['PERMANENT', 'CONTRACT', 'FREELANCE', 'PART_TIME'],
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'],
    }),
    ApiQuery({
      name: 'months',
      required: false,
      type: Number,
      description: 'Number of months to analyze',
      example: 12,
    }),
    ApiQuery({
      name: 'includeReasons',
      required: false,
      type: Boolean,
      description: 'Include termination reasons breakdown',
      example: true,
    }),
    ApiQuery({
      name: 'includeDepartmentBreakdown',
      required: false,
      type: Boolean,
      description: 'Include department-wise turnover',
      example: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Turnover analysis retrieved successfully',
      type: TurnoverAnalysisResponseDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid query parameters' }),
    ApiUnauthorizedResponse({ description: 'User not authenticated' }),
    ApiForbiddenResponse({ description: 'Insufficient permissions' }),
  );
}

/**
 * ============================================================================
 * REPORT 7: STATUS DISTRIBUTION
 * ============================================================================
 */
export function StatusDistributionDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get Status Distribution Report',
      description: `
# Status Distribution Report

Employee status breakdown with availability tracking.

## Employee Status Types
- **ACTIVE**: Currently working employees
- **INACTIVE**: Employees not currently working (long-term leave, sabbatical)
- **ON_LEAVE**: Employees on temporary leave (vacation, sick leave)
- **SUSPENDED**: Employees temporarily suspended
- **TERMINATED**: Former employees (shown if within filter period)

## Features
- **Status Breakdown**: Count and percentage per status
- **Gender Distribution**: Male/female breakdown per status
- **Tenure Analysis**: Average tenure per status
- **Localized Names**: English and Arabic status names
- **Historical Trend**: Optional month-by-month status changes
- **Availability Rate**: Percentage of workforce available to work

## Key Metrics
- Total employees
- Active percentage (workforce engagement)
- Inactive percentage
- On leave percentage
- Availability rate (active employees / total)

## Availability Rate
Measures the percentage of workforce available for work:
- Availability = (Active Employees / Total Employees) × 100
- High availability (>90%): Healthy workforce
- Medium availability (80-90%): Monitor closely
- Low availability (<80%): Potential issues

## Use Cases
- Daily workforce planning
- Leave management tracking
- Capacity planning
- Resource allocation
- Attendance monitoring
- Workforce availability forecasting
- HR policy effectiveness

## Historical Trend
When enabled, shows status distribution over past months:
- Identifies patterns in leave taking
- Tracks workforce stability
- Highlights seasonal variations
- Monitors long-term trends

## Performance
- Response time: ~150-300ms
- Simple status grouping
- Optional trend calculation
- Real-time data

## Localization
- Status names provided in English and Arabic
- Suitable for bilingual dashboards
      `,
    }),
    ApiQuery({ name: 'month', required: false, type: Number }),
    ApiQuery({ name: 'year', required: false, type: Number }),
    ApiQuery({ name: 'department', required: false, type: String }),
    ApiQuery({
      name: 'employmentType',
      required: false,
      enum: ['PERMANENT', 'CONTRACT', 'FREELANCE', 'PART_TIME'],
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'],
    }),
    ApiQuery({
      name: 'includeTrend',
      required: false,
      type: Boolean,
      description: 'Include historical trend',
      example: true,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['employeeCount', 'percentage', 'status'],
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['asc', 'desc'],
    }),
    ApiResponse({
      status: 200,
      description: 'Status distribution retrieved successfully',
      type: StatusDistributionResponseDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid query parameters' }),
    ApiUnauthorizedResponse({ description: 'User not authenticated' }),
    ApiForbiddenResponse({ description: 'Insufficient permissions' }),
  );
}
