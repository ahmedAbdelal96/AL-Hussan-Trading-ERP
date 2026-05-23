/**
 * ============================================================================
 * PAYROLL REPORTS - SWAGGER DECORATORS (Part 2: Reports 5-8)
 * ============================================================================
 *
 * Continuation of Swagger documentation for remaining payroll endpoints.
 *
 * @module PayrollSwaggerDecorators
 * @version 1.0.0
 */

import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import {
  AllowancesReportResponseDto,
  DeductionsLoansReportResponseDto,
  PayrollTrendResponseDto,
  PayrollComparisonResponseDto,
} from '../dto';

/**
 * Swagger documentation for Allowances Report endpoint
 */
export function AllowancesReportDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get comprehensive allowances report',
      description: `
Detailed analysis of employee allowances and benefits.

**Analysis Includes:**
- Breakdown by allowance type (Housing, Transportation, Food, etc.)
- Breakdown by frequency (Monthly, One-time, etc.)
- Active vs inactive allowances
- Pending approvals
- Statistical analysis (min, max, average)

**Use Cases:**
- Benefits administration
- Allowance policy review
- Cost control for benefits
- Approval workflow management

**Performance:** ~350ms for 200+ allowance records

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
      name: 'allowanceTypeId',
      required: false,
      type: String,
      description: 'Filter by specific allowance type',
    }),
    ApiQuery({
      name: 'isActive',
      required: false,
      type: Boolean,
      description: 'Filter by active status',
    }),
    ApiQuery({
      name: 'pendingOnly',
      required: false,
      type: Boolean,
      description: 'Show only pending approvals',
      example: false,
    }),
    ApiResponse({
      status: 200,
      description: 'Allowances report retrieved successfully',
      type: AllowancesReportResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  );
}

/**
 * Swagger documentation for Deductions & Loans Report endpoint
 */
export function DeductionsLoansReportDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get deductions and loans report',
      description: `
Comprehensive analysis of payroll deductions and employee loans.

**Deductions Analysis:**
- Breakdown by type (Loan Repayment, Insurance, Tax, Penalties, etc.)
- Total amounts and employee counts
- Monthly trends

**Loans Analysis:**
- Outstanding loan balances
- Repayment schedules
- Loans by status (Active, Pending, Paid Off, Overdue)
- Default risk indicators
- Average loan amounts

**Use Cases:**
- Loan portfolio management
- Deduction tracking
- Risk assessment (overdue loans)
- Collection monitoring
- Financial planning

**Performance:** ~400ms with full loan analysis

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
      name: 'includeLoans',
      required: false,
      type: Boolean,
      description: 'Include loans summary',
      example: true,
    }),
    ApiQuery({
      name: 'includeDeductions',
      required: false,
      type: Boolean,
      description: 'Include deductions summary',
      example: true,
    }),
    ApiQuery({
      name: 'overdueLoansOnly',
      required: false,
      type: Boolean,
      description: 'Show only overdue/defaulted loans',
      example: false,
    }),
    ApiResponse({
      status: 200,
      description: 'Deductions and loans report retrieved successfully',
      type: DeductionsLoansReportResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  );
}

/**
 * Swagger documentation for Payroll Trend endpoint
 */
export function PayrollTrendDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get payroll trend analysis (time-series)',
      description: `
Time-series analysis of payroll data over multiple months.

**Analysis Includes:**
- Monthly payroll totals (base, allowances, deductions, net)
- Employee count trends
- Average salary trends
- Growth rate calculations
- Overall trend direction (up/down/neutral)
- Highest and lowest months

**Configurable Period:**
- 1 to 24 months (default: 12)
- Automatic monthly aggregation
- Chart-ready data format

**Use Cases:**
- Long-term payroll planning
- Trend identification
- Seasonal pattern analysis
- Budget forecasting
- Executive reporting

**Performance:** ~500ms for 12 months of data

**Permissions Required:** report:payroll
      `,
    }),
    ApiQuery({
      name: 'months',
      required: false,
      type: Number,
      description: 'Number of months to include (1-24)',
      example: 12,
    }),
    ApiQuery({ name: 'departmentId', required: false, type: String }),
    ApiQuery({ name: 'siteId', required: false, type: String }),
    ApiQuery({
      name: 'includeComponents',
      required: false,
      type: Boolean,
      description: 'Include component breakdown (base, allowances, deductions)',
      example: false,
    }),
    ApiResponse({
      status: 200,
      description: 'Payroll trend analysis retrieved successfully',
      type: PayrollTrendResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid month range',
    }),
  );
}

/**
 * Swagger documentation for Payroll Comparison endpoint
 */
export function PayrollComparisonDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Compare payroll between two periods',
      description: `
Side-by-side comparison of payroll metrics between two months.

**Comparison Metrics:**
- Base salaries, allowances, deductions
- Net payroll
- Employee counts
- Average salaries

**Variance Analysis:**
- Absolute differences
- Percentage changes
- Positive/negative indicators

**Employee Changes:**
- New hires count
- Resignations/terminations
- Salary increases/decreases
- Net employee change

**Use Cases:**
- Month-to-month analysis
- Year-over-year comparison
- Budget vs actual review
- Change impact assessment
- Workforce planning

**Performance:** ~600ms for full comparison with employee changes

**Permissions Required:** report:payroll
      `,
    }),
    ApiQuery({
      name: 'month1',
      required: false,
      type: Number,
      description: 'First comparison month (1-12)',
      example: 12,
    }),
    ApiQuery({
      name: 'year1',
      required: false,
      type: Number,
      description: 'First comparison year',
      example: 2025,
    }),
    ApiQuery({
      name: 'month2',
      required: false,
      type: Number,
      description: 'Second comparison month (1-12)',
      example: 1,
    }),
    ApiQuery({
      name: 'year2',
      required: false,
      type: Number,
      description: 'Second comparison year',
      example: 2026,
    }),
    ApiQuery({ name: 'departmentId', required: false, type: String }),
    ApiQuery({ name: 'siteId', required: false, type: String }),
    ApiQuery({
      name: 'includeEmployeeChanges',
      required: false,
      type: Boolean,
      description: 'Include employee-level changes analysis',
      example: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Payroll comparison retrieved successfully',
      type: PayrollComparisonResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid date ranges or same period selected',
    }),
  );
}
