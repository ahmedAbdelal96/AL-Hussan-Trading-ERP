/**
 * ============================================================================
 * FINANCE REPORTS - SWAGGER API DOCUMENTATION DECORATORS
 * ============================================================================
 *
 * Centralized Swagger/OpenAPI documentation decorators for Finance Reports endpoints.
 * Separating documentation from business logic improves code maintainability.
 *
 * Benefits of Separate Swagger Files:
 * - Cleaner controller code (business logic focus)
 * - Easier documentation updates
 * - Reusable documentation patterns
 * - Better TypeScript type inference
 * - Consistent API documentation style
 *
 * Usage in Controller:
 * @FinanceOverviewDocs()
 * async getOverview(...) { ... }
 *
 * @module FinanceReportsSwagger
 * @version 1.0.0
 */

import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  FinanceOverviewResponseDto,
  CostsByTypeResponseDto,
  CostsByPaymentStatusResponseDto,
  MonthlyTrendResponseDto,
  CostsByCategoryResponseDto,
  TopProjectsResponseDto,
  PendingApprovalsResponseDto,
  OverduePaymentsResponseDto,
  TaxSummaryResponseDto,
} from '../dto/finance-responses.dto';

/**
 * Common decorators applied to all finance endpoints
 */
const CommonFinanceDocs = () =>
  applyDecorators(
    ApiTags('Finance Reports'),
    ApiBearerAuth(),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
    ApiResponse({
      status: 403,
      description:
        'Forbidden - User does not have required permission (report:finance)',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
    }),
  );

/**
 * GET /api/v1/reports/finance/overview
 *
 * High-level financial KPIs for dashboard cards.
 * Returns summary statistics across all costs.
 */
export const FinanceOverviewDocs = () =>
  applyDecorators(
    CommonFinanceDocs(),
    ApiOperation({
      summary: 'Get Finance Overview (KPIs)',
      description: `
**Purpose:** Provides high-level financial KPIs for dashboard cards and summary displays.

**Returns:**
- Total costs and count
- Average cost per entry
- Breakdown by payment status (PENDING, APPROVED, PAID, OVERDUE)
- Month-over-month growth rate

**Use Cases:**
- Dashboard summary cards
- Financial health at-a-glance
- Executive summary reports

**Performance:** Optimized query with aggregations (~200ms)
      `.trim(),
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Filter start date (ISO 8601 format: YYYY-MM-DD)',
      example: '2025-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'Filter end date (ISO 8601 format: YYYY-MM-DD)',
      example: '2026-01-31',
    }),
    ApiQuery({
      name: 'projectId',
      required: false,
      type: String,
      description: 'Filter by specific project (UUID)',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Finance overview retrieved successfully',
      type: FinanceOverviewResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid date format or filters',
    }),
  );

/**
 * GET /api/v1/reports/finance/by-cost-type
 *
 * Breakdown of costs by their type (SALARY, FUEL, MAINTENANCE, etc.)
 * Sorted by amount descending for easy visualization.
 */
export const CostsByTypeDocs = () =>
  applyDecorators(
    CommonFinanceDocs(),
    ApiOperation({
      summary: 'Get Costs Breakdown by Type',
      description: `
**Purpose:** Analyzes cost distribution across different cost types.

**Returns:**
- Breakdown by 13 cost types (SALARY, FUEL, MAINTENANCE, etc.)
- Amount, count, percentage, and average per type
- Sorted by amount (highest first)

**Use Cases:**
- Pie charts showing cost type distribution
- Bar charts for cost type comparison
- Budget allocation analysis
- Expense category insights

**Cost Types Available:**
MAINTENANCE, PURCHASE, SALARY, ALLOWANCE, FUEL, MATERIAL, 
EQUIPMENT_RENTAL, SUBCONTRACTOR, UTILITY, TRANSPORTATION, 
INSURANCE, TAX, OTHER

**Visualization:** Best displayed as Pie Chart or Horizontal Bar Chart
      `.trim(),
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Filter start date',
      example: '2025-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'Filter end date',
      example: '2026-01-31',
    }),
    ApiQuery({
      name: 'costType',
      required: false,
      enum: [
        'MAINTENANCE',
        'PURCHASE',
        'SALARY',
        'ALLOWANCE',
        'FUEL',
        'MATERIAL',
        'EQUIPMENT_RENTAL',
        'SUBCONTRACTOR',
        'UTILITY',
        'TRANSPORTATION',
        'INSURANCE',
        'TAX',
        'OTHER',
      ],
      description: 'Filter by specific cost type',
      example: 'SALARY',
    }),
    ApiQuery({
      name: 'paymentStatus',
      required: false,
      enum: [
        'PENDING',
        'APPROVED',
        'PAID',
        'REJECTED',
        'PARTIALLY_PAID',
        'OVERDUE',
      ],
      description: 'Filter by payment status',
      example: 'PAID',
    }),
    ApiQuery({
      name: 'projectId',
      required: false,
      type: String,
      description: 'Filter by specific project',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Costs by type retrieved successfully',
      type: CostsByTypeResponseDto,
    }),
  );

/**
 * GET /api/v1/reports/finance/by-payment-status
 *
 * Breakdown of costs by payment status (PENDING, PAID, OVERDUE, etc.)
 */
export const CostsByPaymentStatusDocs = () =>
  applyDecorators(
    CommonFinanceDocs(),
    ApiOperation({
      summary: 'Get Costs Breakdown by Payment Status',
      description: `
**Purpose:** Analyzes cost distribution across payment statuses.

**Returns:**
- Breakdown by payment status (PENDING, APPROVED, PAID, etc.)
- Amount, count, and percentage per status
- Total amounts and counts

**Use Cases:**
- Payment tracking dashboards
- Cash flow analysis
- Approval workflow monitoring
- Overdue payment alerts

**Payment Statuses:**
- PENDING: Awaiting approval
- APPROVED: Approved but not paid yet
- PAID: Fully paid
- REJECTED: Rejected/Cancelled
- PARTIALLY_PAID: Partial payment made
- OVERDUE: Payment overdue

**Visualization:** Best displayed as Donut Chart or Stacked Bar Chart
      `.trim(),
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Filter start date',
      example: '2025-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'Filter end date',
      example: '2026-01-31',
    }),
    ApiQuery({
      name: 'paymentStatus',
      required: false,
      enum: [
        'PENDING',
        'APPROVED',
        'PAID',
        'REJECTED',
        'PARTIALLY_PAID',
        'OVERDUE',
      ],
      description: 'Filter by specific payment status',
      example: 'PENDING',
    }),
    ApiQuery({
      name: 'projectId',
      required: false,
      type: String,
      description: 'Filter by specific project',
    }),
    ApiQuery({
      name: 'costType',
      required: false,
      enum: [
        'MAINTENANCE',
        'PURCHASE',
        'SALARY',
        'FUEL',
        'MATERIAL',
        'SUBCONTRACTOR',
        'OTHER',
      ],
      description: 'Filter by cost type',
    }),
    ApiResponse({
      status: 200,
      description: 'Costs by payment status retrieved successfully',
      type: CostsByPaymentStatusResponseDto,
    }),
  );

/**
 * GET /api/v1/reports/finance/monthly-trend
 *
 * Time-series analysis of costs over months.
 * Shows trend patterns and seasonal variations.
 */
export const MonthlyTrendDocs = () =>
  applyDecorators(
    CommonFinanceDocs(),
    ApiOperation({
      summary: 'Get Monthly Costs Trend',
      description: `
**Purpose:** Analyzes cost trends over time (monthly granularity).

**Returns:**
- Monthly data points with amount, count, and average
- Trend direction (up/down/neutral)
- Total and average across all months
- Data sorted chronologically

**Use Cases:**
- Line charts showing cost trends
- Area charts for cumulative view
- Seasonal pattern analysis
- Budget forecasting
- Year-over-year comparison

**Configurable:** 
- Default: Last 12 months
- Range: 1-24 months

**Visualization:** Line Chart or Area Chart recommended
      `.trim(),
    }),
    ApiQuery({
      name: 'months',
      required: false,
      type: Number,
      description: 'Number of months to analyze (1-24, default: 12)',
      example: 12,
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Override with custom start date',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'Override with custom end date',
    }),
    ApiQuery({
      name: 'costType',
      required: false,
      description: 'Filter by specific cost type',
    }),
    ApiQuery({
      name: 'projectId',
      required: false,
      type: String,
      description: 'Filter by specific project',
    }),
    ApiResponse({
      status: 200,
      description: 'Monthly trend retrieved successfully',
      type: MonthlyTrendResponseDto,
    }),
  );

/**
 * GET /api/v1/reports/finance/by-category
 *
 * Breakdown by cost categories (hierarchical support).
 */
export const CostsByCategoryDocs = () =>
  applyDecorators(
    CommonFinanceDocs(),
    ApiOperation({
      summary: 'Get Costs Breakdown by Category',
      description: `
**Purpose:** Analyzes costs grouped by their categories.

**Returns:**
- Breakdown by categories (from CostCategory table)
- Supports hierarchical categories (parent-child)
- Amount, count, percentage per category
- Sorted by amount descending

**Use Cases:**
- Budget allocation by category
- Category-based expense tracking
- Hierarchical cost analysis
- Department/division budgeting

**Features:**
- Multi-language support (English + Arabic names)
- Hierarchical category navigation
- Optional child categories inclusion

**Visualization:** Horizontal Bar Chart or Treemap
      `.trim(),
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Filter start date',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'Filter end date',
    }),
    ApiQuery({
      name: 'categoryId',
      required: false,
      type: String,
      description: 'Filter by specific category',
    }),
    ApiQuery({
      name: 'includeChildren',
      required: false,
      type: Boolean,
      description: 'Include child categories (for hierarchical categories)',
      example: false,
    }),
    ApiQuery({
      name: 'projectId',
      required: false,
      type: String,
      description: 'Filter by specific project',
    }),
    ApiResponse({
      status: 200,
      description: 'Costs by category retrieved successfully',
      type: CostsByCategoryResponseDto,
    }),
  );

/**
 * GET /api/v1/reports/finance/by-project
 *
 * Top projects ranked by total cost.
 * Useful for project budget tracking.
 */
export const TopProjectsDocs = () =>
  applyDecorators(
    CommonFinanceDocs(),
    ApiOperation({
      summary: 'Get Top Projects by Cost',
      description: `
**Purpose:** Identifies top projects by total cost spent.

**Returns:**
- Top N projects ranked by total cost
- Breakdown by payment status per project
- Percentage of total budget
- Configurable limit (default: 10, max: 50)

**Use Cases:**
- Project budget tracking
- Top spenders identification
- Resource allocation analysis
- Project cost comparison

**Metrics per Project:**
- Total cost
- Cost count (number of transactions)
- Paid amount
- Pending amount
- Approved amount
- Percentage of total costs

**Visualization:** Horizontal Bar Chart or Table
      `.trim(),
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of top projects to return (1-50, default: 10)',
      example: 10,
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Filter start date',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'Filter end date',
    }),
    ApiQuery({
      name: 'costType',
      required: false,
      description: 'Filter by cost type',
    }),
    ApiQuery({
      name: 'paymentStatus',
      required: false,
      description: 'Filter by payment status',
    }),
    ApiResponse({
      status: 200,
      description: 'Top projects retrieved successfully',
      type: TopProjectsResponseDto,
    }),
  );

/**
 * GET /api/v1/reports/finance/pending-approvals
 *
 * Detailed paginated list of costs awaiting approval.
 * Action-required report for managers.
 */
export const PendingApprovalsDocs = () =>
  applyDecorators(
    CommonFinanceDocs(),
    ApiOperation({
      summary: 'Get Pending Approvals Report (Paginated)',
      description: `
**Purpose:** Lists all costs awaiting approval with detailed information.

**Returns:**
- Summary: Total pending amount, count, oldest approval
- Paginated details: Cost information, project, waiting days
- Sorted by oldest first (urgent items on top)

**Use Cases:**
- Approval workflow dashboards
- Manager action-required lists
- Pending items tracking
- Approval bottleneck identification

**Details per Item:**
- Cost ID, amount, description
- Project name
- Cost type
- Invoice number
- Days waiting for approval
- Created by (requester name)
- Created at timestamp

**Sorting:** Oldest pending first (prioritizes urgent approvals)

**Visualization:** Paginated Table with action buttons
      `.trim(),
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (default: 20)',
      example: 20,
    }),
    ApiQuery({
      name: 'projectId',
      required: false,
      type: String,
      description: 'Filter by specific project',
    }),
    ApiQuery({
      name: 'costType',
      required: false,
      description: 'Filter by cost type',
    }),
    ApiQuery({
      name: 'minDaysWaiting',
      required: false,
      type: Number,
      description: 'Filter items waiting at least N days',
      example: 7,
    }),
    ApiResponse({
      status: 200,
      description: 'Pending approvals retrieved successfully',
      type: PendingApprovalsResponseDto,
    }),
  );

/**
 * GET /api/v1/reports/finance/overdue-payments
 *
 * Detailed paginated list of overdue payments.
 * Critical alert report for payment tracking.
 */
export const OverduePaymentsDocs = () =>
  applyDecorators(
    CommonFinanceDocs(),
    ApiOperation({
      summary: 'Get Overdue Payments Report (Paginated)',
      description: `
**Purpose:** Lists all overdue payments requiring immediate attention.

**Returns:**
- Summary: Total overdue amount, count, average and max days overdue
- Paginated details: Payment information, project, overdue days
- Sorted by most overdue first (critical items on top)

**Use Cases:**
- Payment tracking dashboards
- Overdue alert widgets
- Cash flow management
- Vendor payment tracking

**Details per Item:**
- Cost ID, amount
- Project name
- Cost type
- Transaction date
- Invoice number
- Vendor/Supplier name
- Days overdue
- Created at timestamp

**Alert Levels:** Can be color-coded in UI based on days overdue:
- 1-7 days: Warning (Yellow)
- 8-30 days: Critical (Orange)
- 30+ days: Severe (Red)

**Sorting:** Most overdue first (highest priority on top)

**Visualization:** Paginated Table with alert indicators
      `.trim(),
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (default: 20)',
      example: 20,
    }),
    ApiQuery({
      name: 'projectId',
      required: false,
      type: String,
      description: 'Filter by specific project',
    }),
    ApiQuery({
      name: 'costType',
      required: false,
      description: 'Filter by cost type',
    }),
    ApiQuery({
      name: 'minDaysOverdue',
      required: false,
      type: Number,
      description: 'Filter items overdue at least N days',
      example: 7,
    }),
    ApiResponse({
      status: 200,
      description: 'Overdue payments retrieved successfully',
      type: OverduePaymentsResponseDto,
    }),
  );

/**
 * GET /api/v1/reports/finance/tax-summary
 *
 * Tax summary across filtered financial costs.
 */
export const TaxSummaryDocs = () =>
  applyDecorators(
    CommonFinanceDocs(),
    ApiOperation({
      summary: 'Get Tax Summary',
      description: `
**Purpose:** Provides a tax-focused summary across selected costs.

**Returns:**
- Total amount before tax
- Total tax amount
- Total amount including tax
- Effective tax rate
- Taxed vs non-taxed entry counts
- Monthly tax breakdown

**Use Cases:**
- Tax monitoring dashboard
- Finance month-end review
- VAT/tax reporting support
      `.trim(),
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Filter start date (ISO 8601 format: YYYY-MM-DD)',
      example: '2026-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'Filter end date (ISO 8601 format: YYYY-MM-DD)',
      example: '2026-12-31',
    }),
    ApiQuery({
      name: 'projectId',
      required: false,
      type: String,
      description: 'Filter by specific project (UUID)',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Tax summary retrieved successfully',
      type: TaxSummaryResponseDto,
    }),
  );
