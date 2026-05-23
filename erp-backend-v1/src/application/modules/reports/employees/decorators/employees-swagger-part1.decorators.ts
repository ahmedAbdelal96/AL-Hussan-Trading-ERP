/**
 * ============================================================================
 * EMPLOYEES REPORTS - SWAGGER DECORATORS (PART 1)
 * ============================================================================
 *
 * Comprehensive API documentation decorators for first 4 reports
 *
 * @module EmployeesSwaggerDecorators1
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
  EmployeesOverviewResponseDto,
  EmployeesByDepartmentResponseDto,
  EmployeesByEmploymentTypeResponseDto,
  EmployeesByPositionResponseDto,
} from '../dto';

/**
 * ============================================================================
 * REPORT 1: EMPLOYEES OVERVIEW
 * ============================================================================
 */
export function EmployeesOverviewDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get Employees Overview Report',
      description: `
# Employees Overview Report

Comprehensive overview of workforce metrics with KPIs and optional comparisons.

## Features
- **Total & Active Counts**: Total employees, active, inactive, on leave, suspended
- **Hiring Metrics**: New hires, terminations, net change
- **Turnover Analysis**: Turnover rate calculation
- **Tenure Tracking**: Average tenure and probation period monitoring
- **Gender Diversity**: Male/female counts and diversity ratio
- **Optional Previous Period Comparison**: Growth rates and trends
- **Optional Department Breakdown**: Quick department distribution

## Use Cases
- Executive dashboard display
- Monthly workforce reporting
- HR strategic planning
- Diversity tracking
- Hiring effectiveness analysis

## Performance
- Response time: ~150-300ms
- Parallel query execution
- Efficient aggregations
- Handles 1000+ employees

## Filters
- Month/Year: Period for new hires and terminations
- Department: Filter by specific department
- Employment Type: Filter by employment type
- Status: Filter by employee status
- Include Comparison: Add previous period data
- Include Department Breakdown: Add department summary
      `,
    }),
    ApiQuery({
      name: 'month',
      required: false,
      type: Number,
      description: 'Month (1-12)',
      example: 1,
    }),
    ApiQuery({
      name: 'year',
      required: false,
      type: Number,
      description: 'Year',
      example: 2026,
    }),
    ApiQuery({
      name: 'department',
      required: false,
      type: String,
      description: 'Filter by department',
      example: 'Engineering',
    }),
    ApiQuery({
      name: 'employmentType',
      required: false,
      enum: ['PERMANENT', 'CONTRACT', 'FREELANCE', 'PART_TIME'],
      description: 'Filter by employment type',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'],
      description: 'Filter by status',
    }),
    ApiQuery({
      name: 'includeComparison',
      required: false,
      type: Boolean,
      description: 'Include previous period comparison',
      example: true,
    }),
    ApiQuery({
      name: 'includeDepartmentBreakdown',
      required: false,
      type: Boolean,
      description: 'Include department breakdown',
      example: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Employees overview report retrieved successfully',
      type: EmployeesOverviewResponseDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid query parameters' }),
    ApiUnauthorizedResponse({ description: 'User not authenticated' }),
    ApiForbiddenResponse({ description: 'Insufficient permissions' }),
  );
}

/**
 * ============================================================================
 * REPORT 2: EMPLOYEES BY DEPARTMENT
 * ============================================================================
 */
export function EmployeesByDepartmentDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get Employees By Department Report',
      description: `
# Employees By Department Report

Detailed workforce distribution across departments with activity metrics.

## Features
- **Department Breakdown**: Employee count per department
- **Status Distribution**: Active, inactive, on leave counts per department
- **Tenure Analysis**: Average tenure per department
- **Hiring Activity**: New hires and terminations per department
- **Optional Salary Costs**: Total and average salaries per department
- **Sortable Results**: Sort by count, active, department name, or tenure

## Metrics Per Department
- Total employee count
- Active vs inactive breakdown
- On leave count
- Percentage of total workforce
- Average tenure (years)
- New hires in period
- Terminations in period
- Total salary costs (optional)
- Average salary (optional)

## Use Cases
- Department headcount planning
- Budget allocation by department
- Identifying understaffed departments
- Turnover analysis by department
- Salary benchmarking

## Performance
- Response time: ~200-400ms
- Efficient groupBy queries
- Optional salary calculation
- Handles 50+ departments

## Sorting Options
- employeeCount: Sort by total employees (default)
- activeCount: Sort by active employees
- department: Sort alphabetically
- avgTenure: Sort by average tenure
      `,
    }),
    ApiQuery({
      name: 'month',
      required: false,
      type: Number,
      description: 'Month (1-12)',
    }),
    ApiQuery({
      name: 'year',
      required: false,
      type: Number,
      description: 'Year',
    }),
    ApiQuery({
      name: 'department',
      required: false,
      type: String,
      description: 'Filter by specific department',
    }),
    ApiQuery({
      name: 'employmentType',
      required: false,
      enum: ['PERMANENT', 'CONTRACT', 'FREELANCE', 'PART_TIME'],
      description: 'Filter by employment type',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'],
      description: 'Filter by status',
    }),
    ApiQuery({
      name: 'minEmployees',
      required: false,
      type: Number,
      description: 'Minimum employees to include department',
      example: 1,
    }),
    ApiQuery({
      name: 'includeSalaryCosts',
      required: false,
      type: Boolean,
      description: 'Include salary costs per department',
      example: false,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['employeeCount', 'activeCount', 'department', 'avgTenure'],
      description: 'Sort by field',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['asc', 'desc'],
      description: 'Sort order',
    }),
    ApiResponse({
      status: 200,
      description: 'Department report retrieved successfully',
      type: EmployeesByDepartmentResponseDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid query parameters' }),
    ApiUnauthorizedResponse({ description: 'User not authenticated' }),
    ApiForbiddenResponse({ description: 'Insufficient permissions' }),
  );
}

/**
 * ============================================================================
 * REPORT 3: EMPLOYEES BY EMPLOYMENT TYPE
 * ============================================================================
 */
export function EmployeesByEmploymentTypeDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get Employees By Employment Type Report',
      description: `
# Employees By Employment Type Report

Workforce composition by employment type with contract tracking.

## Employment Types
- **PERMANENT**: Permanent employees with indefinite contracts
- **CONTRACT**: Fixed-term contract employees
- **FREELANCE**: Freelance/consultant workers
- **PART_TIME**: Part-time employees

## Features
- **Type Distribution**: Count and percentage per employment type
- **Activity Status**: Active count per type
- **Tenure Analysis**: Average tenure per type
- **Localized Names**: English and Arabic names
- **Expiring Contracts**: Contracts expiring within specified days
- **Renewal Tracking**: Renewable vs non-renewable contracts

## Expiring Contracts Details
When enabled, provides list of contracts expiring soon with:
- Employee information (ID, number, name)
- Department and position
- Contract end date
- Days until expiry
- Renewal eligibility

## Use Cases
- Contract renewal planning
- Workforce composition analysis
- Budgeting for contract renewals
- Compliance tracking
- Strategic hiring decisions

## Performance
- Response time: ~150-350ms
- Efficient type grouping
- Optional contract queries
- Supports 1000+ employees

## Filter Parameters
- expiringContractsDays: Look ahead period (e.g., 30, 60, 90 days)
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
      name: 'expiringContractsDays',
      required: false,
      type: Number,
      description: 'Days to look ahead for expiring contracts',
      example: 90,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['employeeCount', 'percentage', 'employmentType'],
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['asc', 'desc'],
    }),
    ApiResponse({
      status: 200,
      description: 'Employment type report retrieved successfully',
      type: EmployeesByEmploymentTypeResponseDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid query parameters' }),
    ApiUnauthorizedResponse({ description: 'User not authenticated' }),
    ApiForbiddenResponse({ description: 'Insufficient permissions' }),
  );
}

/**
 * ============================================================================
 * REPORT 4: EMPLOYEES BY POSITION
 * ============================================================================
 */
export function EmployeesByPositionDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get Employees By Position Report',
      description: `
# Employees By Position Report

Workforce distribution by job titles/positions with demographics.

## Features
- **Position Breakdown**: Employee count per position
- **Activity Status**: Active employees per position
- **Tenure Analysis**: Average tenure per position
- **Age Demographics**: Average age per position
- **Hiring Activity**: New hires per position in period
- **Sortable Results**: Sort by count, position name, or tenure

## Metrics Per Position
- Total employee count
- Active employee count
- Percentage of total workforce
- Average tenure (years)
- Average age
- New hires in period

## Use Cases
- Organizational structure analysis
- Position-based headcount planning
- Skills gap identification
- Succession planning
- Career path mapping
- Salary benchmarking by position

## Performance
- Response time: ~150-300ms
- Efficient position grouping
- Handles 100+ unique positions

## Sorting Options
- employeeCount: Sort by total employees (default)
- position: Sort alphabetically by position name
- avgTenure: Sort by average tenure
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
      name: 'minEmployees',
      required: false,
      type: Number,
      description: 'Minimum employees to include position',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['employeeCount', 'position', 'avgTenure'],
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['asc', 'desc'],
    }),
    ApiResponse({
      status: 200,
      description: 'Position report retrieved successfully',
      type: EmployeesByPositionResponseDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid query parameters' }),
    ApiUnauthorizedResponse({ description: 'User not authenticated' }),
    ApiForbiddenResponse({ description: 'Insufficient permissions' }),
  );
}
