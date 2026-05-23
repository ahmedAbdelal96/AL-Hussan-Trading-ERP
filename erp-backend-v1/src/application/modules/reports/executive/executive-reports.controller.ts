import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiSecurity } from '@nestjs/swagger';
import {
  GetExecutiveDashboardUseCase,
  GetCompanyPnlUseCase,
} from './use-cases';
import {
  ExecutiveDashboardFiltersDto,
  CompanyPnlFiltersDto,
  ExecutiveDashboardResponseDto,
  CompanyPnlResponseDto,
} from './dto';
import { ExecutiveDashboardDocs, CompanyPnlDocs } from './dto';
import { Auth } from '../../auth/decorators/auth.decorator';

/**
 * Executive Reports Controller
 *
 * Cross-module reports for senior management:
 * 1. Executive Dashboard — real-time KPI snapshot across all modules
 * 2. Company P&L — Profit & Loss statement with cost bucketing
 *
 * Permission: report:system  (SUPERADMIN + ADMIN)
 */
@Controller('reports/executive')
@ApiTags('Executive Reports')
@ApiSecurity('bearer')
export class ExecutiveReportsController {
  constructor(
    private readonly getExecutiveDashboardUseCase: GetExecutiveDashboardUseCase,
    private readonly getCompanyPnlUseCase: GetCompanyPnlUseCase,
  ) {}

  /**
   * Executive Dashboard
   * Cross-module KPI snapshot: active projects, at-risk, asset utilization,
   * headcount, labor cost, maintenance overdue, 6-month cost trend.
   */
  @Get('dashboard')
  @Auth({ permissions: ['report:system'] })
  @ExecutiveDashboardDocs()
  async getDashboard(
    @Query() filters: ExecutiveDashboardFiltersDto,
  ): Promise<ExecutiveDashboardResponseDto> {
    return this.getExecutiveDashboardUseCase.execute(filters);
  }

  /**
   * Company P&L
   * Profit & Loss statement for the selected period with cost bucketing,
   * optional monthly trend, cost-by-type detail, and top projects.
   */
  @Get('pnl')
  @Auth({ permissions: ['report:system'] })
  @CompanyPnlDocs()
  async getPnl(
    @Query() filters: CompanyPnlFiltersDto,
  ): Promise<CompanyPnlResponseDto> {
    return this.getCompanyPnlUseCase.execute(filters);
  }
}
