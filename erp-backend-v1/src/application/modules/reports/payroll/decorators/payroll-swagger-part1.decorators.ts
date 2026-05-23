/**
 * ============================================================================
 * PAYROLL REPORTS - SWAGGER DECORATORS (Part 1: Reports 1-4)
 * ============================================================================
 *
 * Separated Swagger/OpenAPI documentation for payroll report endpoints.
 * Each decorator provides comprehensive API documentation.
 *
 * @module PayrollSwaggerDecorators
 * @version 1.0.0
 */

import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import {
  PayrollOverviewResponseDto,
  PayrollByDepartmentResponseDto,
  PayrollBySiteResponseDto,
  SalaryComponentsResponseDto,
} from '../dto';

/**
 * Swagger documentation for Payroll Overview endpoint
 */
export function PayrollOverviewDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get monthly payroll overview (KPIs)',
      description: `
Returns high-level payroll metrics for dashboard cards.

**Key Metrics:**
- Total base salaries, allowances, deductions
- Net payroll calculation
- Employee count and averages
- Month-over-month comparison

**Use Cases:**
- Dashboard KPI cards
- Executive summary
- Quick payroll health check
- Comparison with previous periods

**Performance:** Optimized with parallel aggregations (~200ms for 500+ employees)

**Permissions Required:** report:payroll
      `,
    }),
    ApiQuery({
      name: 'month',
      required: false,
      type: Number,
      description: 'Month (1-12). Defaults to current month',
      example: 1,
    }),
    ApiQuery({
      name: 'year',
      required: false,
      type: Number,
      description: 'Year. Defaults to current year',
      example: 2026,
    }),
    ApiQuery({
      name: 'departmentId',
      required: false,
      type: String,
      description: 'Filter by specific department',
    }),
    ApiQuery({
      name: 'siteId',
      required: false,
      type: String,
      description: 'Filter by specific site',
    }),
    ApiQuery({
      name: 'employeeStatus',
      required: false,
      enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'],
      description: 'Filter by employee status. Defaults to ACTIVE',
    }),
    ApiQuery({
      name: 'includeComparison',
      required: false,
      type: Boolean,
      description: 'Include comparison with previous month',
      example: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Payroll overview retrieved successfully',
      type: PayrollOverviewResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Missing required permission (report:payroll)',
    }),
  );
}

/**
 * Swagger documentation for Payroll by Department endpoint
 */
export function PayrollByDepartmentDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get payroll breakdown by department',
      description: `
Analyzes payroll distribution across departments.

**Returns:**
- Department-wise payroll breakdown
- Employee counts per department
- Averages and percentages
- Sorted data for easy analysis

**Use Cases:**
- Department budget analysis
- Resource allocation decisions
- Cost center reporting
- Departmental performance tracking

**Sorting Options:**
- By total payroll (default)
- By employee count
- By average salary

**Performance:** ~300ms for 20+ departments

**Permissions Required:** report:payroll
      `,
    }),
    ApiQuery({ name: 'month', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'year', required: false, type: Number, example: 2026 }),
    ApiQuery({ name: 'departmentId', required: false, type: String }),
    ApiQuery({ name: 'siteId', required: false, type: String }),
    ApiQuery({
      name: 'employeeStatus',
      required: false,
      enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'],
    }),
    ApiQuery({
      name: 'minEmployees',
      required: false,
      type: Number,
      description: 'Minimum employee count to include department',
      example: 1,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['totalPayroll', 'employeeCount', 'avgSalary'],
      description: 'Sort by field',
      example: 'totalPayroll',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['asc', 'desc'],
      description: 'Sort order',
      example: 'desc',
    }),
    ApiResponse({
      status: 200,
      description: 'Department payroll breakdown retrieved successfully',
      type: PayrollByDepartmentResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  );
}

/**
 * Swagger documentation for Payroll by Site endpoint
 */
export function PayrollBySiteDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get payroll breakdown by site/location',
      description: `
Analyzes payroll distribution across company sites.

**Returns:**
- Site-wise payroll breakdown
- Employee counts per site
- Averages and percentages
- Location-based analysis

**Use Cases:**
- Geographic cost analysis
- Site budget planning
- Multi-location comparison
- Regional payroll trends

**Sorting Options:**
- By total payroll (default)
- By employee count
- By average salary

**Performance:** ~300ms for 10+ sites

**Permissions Required:** report:payroll
      `,
    }),
    ApiQuery({ name: 'month', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'year', required: false, type: Number, example: 2026 }),
    ApiQuery({ name: 'departmentId', required: false, type: String }),
    ApiQuery({ name: 'siteId', required: false, type: String }),
    ApiQuery({
      name: 'employeeStatus',
      required: false,
      enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'],
    }),
    ApiQuery({
      name: 'minEmployees',
      required: false,
      type: Number,
      description: 'Minimum employee count to include site',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['totalPayroll', 'employeeCount', 'avgSalary'],
    }),
    ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] }),
    ApiResponse({
      status: 200,
      description: 'Site payroll breakdown retrieved successfully',
      type: PayrollBySiteResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  );
}

/**
 * Swagger documentation for Salary Components endpoint
 */
export function SalaryComponentsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get detailed salary components breakdown',
      description: `
Provides comprehensive analysis of salary structure components.

**Components Analyzed:**
- Base salaries
- Allowances by type (Housing, Transportation, etc.)
- Deductions by type (Loans, Insurance, Tax, etc.)
- Percentages and distributions

**Returns:**
- Total amounts for each component
- Percentage of gross payroll
- Breakdown by allowance types
- Breakdown by deduction types
- Employee counts per component

**Use Cases:**
- Payroll structure analysis
- Component cost tracking
- Budget planning by component
- Compensation strategy review

**Performance:** ~400ms with full breakdown

**Permissions Required:** report:payroll
      `,
    }),
    ApiQuery({ name: 'month', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'year', required: false, type: Number, example: 2026 }),
    ApiQuery({ name: 'departmentId', required: false, type: String }),
    ApiQuery({ name: 'siteId', required: false, type: String }),
    ApiQuery({
      name: 'employeeStatus',
      required: false,
      enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'],
    }),
    ApiQuery({
      name: 'includeAllowanceTypes',
      required: false,
      type: Boolean,
      description: 'Include detailed allowance types breakdown',
      example: true,
    }),
    ApiQuery({
      name: 'includeDeductionTypes',
      required: false,
      type: Boolean,
      description: 'Include detailed deduction types breakdown',
      example: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Salary components breakdown retrieved successfully',
      type: SalaryComponentsResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  );
}
