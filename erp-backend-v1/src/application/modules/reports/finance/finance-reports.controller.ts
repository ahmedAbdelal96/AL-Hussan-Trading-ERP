/**
 * ============================================================================
 * FINANCE REPORTS CONTROLLER
 * ============================================================================
 *
 * HTTP layer for Finance Reports Module.
 * Delegates all business logic to Use Cases (Clean Architecture).
 *
 * Architecture Pattern: Controller → Use Case → Repository
 * - Controller: Handles HTTP requests/responses
 * - Use Case: Contains business logic (Single Responsibility)
 * - Repository: Data access (abstracted via Prisma)
 *
 * Security:
 * - All endpoints require authentication (@Auth decorator)
 * - Requires 'report:finance' permission
 *
 * API Endpoints (8 reports):
 * - GET /overview - High-level KPIs
 * - GET /by-cost-type - Breakdown by cost type
 * - GET /by-payment-status - Breakdown by payment status
 * - GET /monthly-trend - Time-series analysis
 * - GET /by-category - Breakdown by category
 * - GET /by-project - Top projects by cost
 * - GET /pending-approvals - Paginated pending approvals
 * - GET /overdue-payments - Paginated overdue payments
 *
 * @module FinanceReportsController
 * @version 1.0.0
 */

import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../auth/decorators/auth.decorator';
import {
  GetFinanceOverviewUseCase,
  GetCostsByTypeUseCase,
  GetCostsByPaymentStatusUseCase,
  GetMonthlyTrendUseCase,
  GetCostsByCategoryUseCase,
  GetTopProjectsUseCase,
  GetPendingApprovalsUseCase,
  GetOverduePaymentsUseCase,
  GetTaxSummaryUseCase,
} from './use-cases';
import {
  FinanceOverviewFiltersDto,
  CostTypeFiltersDto,
  PaymentStatusFiltersDto,
  MonthlyTrendFiltersDto,
  CategoryFiltersDto,
  TopProjectsFiltersDto,
  PendingApprovalsFiltersDto,
  OverduePaymentsFiltersDto,
} from './dto/finance-filters.dto';
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
} from './dto/finance-responses.dto';
import {
  FinanceOverviewDocs,
  CostsByTypeDocs,
  CostsByPaymentStatusDocs,
  MonthlyTrendDocs,
  CostsByCategoryDocs,
  TopProjectsDocs,
  PendingApprovalsDocs,
  OverduePaymentsDocs,
  TaxSummaryDocs,
} from './decorators/finance-swagger.decorators';

/**
 * Finance Reports Controller
 *
 * Base path: /api/v1/reports/finance
 */
@Controller('reports/finance')
@ApiTags('Reports - Finance')
export class FinanceReportsController {
  constructor(
    private getFinanceOverviewUseCase: GetFinanceOverviewUseCase,
    private getCostsByTypeUseCase: GetCostsByTypeUseCase,
    private getCostsByPaymentStatusUseCase: GetCostsByPaymentStatusUseCase,
    private getMonthlyTrendUseCase: GetMonthlyTrendUseCase,
    private getCostsByCategoryUseCase: GetCostsByCategoryUseCase,
    private getTopProjectsUseCase: GetTopProjectsUseCase,
    private getPendingApprovalsUseCase: GetPendingApprovalsUseCase,
    private getOverduePaymentsUseCase: GetOverduePaymentsUseCase,
    private getTaxSummaryUseCase: GetTaxSummaryUseCase,
  ) {}

  /**
   * GET /overview
   * Returns high-level KPIs for dashboard cards
   */
  @Get('overview')
  @HttpCode(HttpStatus.OK)
  @Auth({ permissions: ['report:finance'] })
  @FinanceOverviewDocs()
  async getOverview(
    @Query() filters: FinanceOverviewFiltersDto,
  ): Promise<FinanceOverviewResponseDto> {
    return this.getFinanceOverviewUseCase.execute(filters);
  }

  /**
   * GET /by-cost-type
   * Analyzes cost distribution across 13 cost types
   */
  @Get('by-cost-type')
  @HttpCode(HttpStatus.OK)
  @Auth({ permissions: ['report:finance'] })
  @CostsByTypeDocs()
  async getCostsByType(
    @Query() filters: CostTypeFiltersDto,
  ): Promise<CostsByTypeResponseDto> {
    return this.getCostsByTypeUseCase.execute(filters);
  }

  /**
   * GET /by-payment-status
   * Analyzes cost distribution across payment statuses
   */
  @Get('by-payment-status')
  @HttpCode(HttpStatus.OK)
  @Auth({ permissions: ['report:finance'] })
  @CostsByPaymentStatusDocs()
  async getCostsByPaymentStatus(
    @Query() filters: PaymentStatusFiltersDto,
  ): Promise<CostsByPaymentStatusResponseDto> {
    return this.getCostsByPaymentStatusUseCase.execute(filters);
  }

  /**
   * GET /monthly-trend
   * Time-series analysis of costs over months
   */
  @Get('monthly-trend')
  @HttpCode(HttpStatus.OK)
  @Auth({ permissions: ['report:finance'] })
  @MonthlyTrendDocs()
  async getMonthlyTrend(
    @Query() filters: MonthlyTrendFiltersDto,
  ): Promise<MonthlyTrendResponseDto> {
    return this.getMonthlyTrendUseCase.execute(filters);
  }

  /**
   * GET /by-category
   * Analyzes costs grouped by categories
   */
  @Get('by-category')
  @HttpCode(HttpStatus.OK)
  @Auth({ permissions: ['report:finance'] })
  @CostsByCategoryDocs()
  async getCostsByCategory(
    @Query() filters: CategoryFiltersDto,
  ): Promise<CostsByCategoryResponseDto> {
    return this.getCostsByCategoryUseCase.execute(filters);
  }

  /**
   * GET /by-project
   * Top N projects ranked by total cost
   */
  @Get('by-project')
  @HttpCode(HttpStatus.OK)
  @Auth({ permissions: ['report:finance'] })
  @TopProjectsDocs()
  async getTopProjects(
    @Query() filters: TopProjectsFiltersDto,
  ): Promise<TopProjectsResponseDto> {
    return this.getTopProjectsUseCase.execute(filters);
  }

  /**
   * GET /pending-approvals
   * Paginated list of costs awaiting approval (oldest first)
   */
  @Get('pending-approvals')
  @HttpCode(HttpStatus.OK)
  @Auth({ permissions: ['report:finance'] })
  @PendingApprovalsDocs()
  async getPendingApprovals(
    @Query() filters: PendingApprovalsFiltersDto,
  ): Promise<PendingApprovalsResponseDto> {
    return this.getPendingApprovalsUseCase.execute(filters);
  }

  /**
   * GET /overdue-payments
   * Paginated list of overdue payments (most overdue first)
   */
  @Get('overdue-payments')
  @HttpCode(HttpStatus.OK)
  @Auth({ permissions: ['report:finance'] })
  @OverduePaymentsDocs()
  async getOverduePayments(
    @Query() filters: OverduePaymentsFiltersDto,
  ): Promise<OverduePaymentsResponseDto> {
    return this.getOverduePaymentsUseCase.execute(filters);
  }

  /**
   * GET /tax-summary
   * Aggregated tax summary for selected costs
   */
  @Get('tax-summary')
  @HttpCode(HttpStatus.OK)
  @Auth({ permissions: ['report:finance'] })
  @TaxSummaryDocs()
  async getTaxSummary(
    @Query() filters: FinanceOverviewFiltersDto,
  ): Promise<TaxSummaryResponseDto> {
    return this.getTaxSummaryUseCase.execute(filters);
  }
}
