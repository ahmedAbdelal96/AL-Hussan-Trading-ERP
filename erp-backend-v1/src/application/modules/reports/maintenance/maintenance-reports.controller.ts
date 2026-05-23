import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../auth/decorators/auth.decorator';
import {
  MaintenanceOverviewDocs,
  MaintenanceByTypeDocs,
  MaintenanceByStatusDocs,
  MaintenanceByAssetDocs,
  MaintenanceCostAnalysisDocs,
  MaintenancePerformanceDocs,
  PreventiveMaintenanceDocs,
} from './decorators';
import {
  MaintenanceOverviewFiltersDto,
  MaintenanceByTypeFiltersDto,
  MaintenanceByStatusFiltersDto,
  MaintenanceByAssetFiltersDto,
  MaintenanceCostAnalysisFiltersDto,
  MaintenancePerformanceFiltersDto,
  PreventiveMaintenanceFiltersDto,
  MaintenanceMtbfMttrFiltersDto,
  MaintenanceCostPerAssetFiltersDto,
  MaintenanceBudgetActualFiltersDto,
} from './dto';
import {
  GetMaintenanceOverviewUseCase,
  GetMaintenanceByTypeUseCase,
  GetMaintenanceByStatusUseCase,
  GetMaintenanceByAssetUseCase,
  GetMaintenanceCostAnalysisUseCase,
  GetMaintenancePerformanceUseCase,
  GetPreventiveMaintenanceUseCase,
  GetMtbfMttrPerAssetUseCase,
  GetMaintenanceCostPerAssetUseCase,
  GetMaintenanceBudgetActualUseCase,
} from './use-cases';

/**
 * Maintenance Reports Controller
 *
 * Provides comprehensive maintenance analytics and reporting endpoints.
 *
 * All endpoints require authentication and 'report:maintenance' permission.
 *
 * Reports Available:
 * 1. Overview: Dashboard view with KPIs and distributions
 * 2. By Type: Analysis by maintenance type (PREVENTIVE, CORRECTIVE, etc.)
 * 3. By Status: Workflow analysis by status (PENDING, IN_PROGRESS, etc.)
 * 4. By Asset: Asset-centric maintenance tracking
 * 5. Cost Analysis: Financial analysis with variance tracking
 * 6. Performance: KPIs including MTTR, MTBF, completion rates
 * 7. Preventive: Preventive maintenance planning and ROI
 */
@ApiTags('Reports - Maintenance')
@Controller('reports/maintenance')
export class MaintenanceReportsController {
  constructor(
    private readonly getOverviewUseCase: GetMaintenanceOverviewUseCase,
    private readonly getByTypeUseCase: GetMaintenanceByTypeUseCase,
    private readonly getByStatusUseCase: GetMaintenanceByStatusUseCase,
    private readonly getByAssetUseCase: GetMaintenanceByAssetUseCase,
    private readonly getCostAnalysisUseCase: GetMaintenanceCostAnalysisUseCase,
    private readonly getPerformanceUseCase: GetMaintenancePerformanceUseCase,
    private readonly getPreventiveUseCase: GetPreventiveMaintenanceUseCase,
    private readonly getMtbfMttrUseCase: GetMtbfMttrPerAssetUseCase,
    private readonly getCostPerAssetUseCase: GetMaintenanceCostPerAssetUseCase,
    private readonly getBudgetActualUseCase: GetMaintenanceBudgetActualUseCase,
  ) {}

  /**
   * Get Maintenance Overview Report
   *
   * Comprehensive dashboard view with total requests, completion rates,
   * MTTR, cost analysis, and status/type/priority distributions.
   */
  @Get('overview')
  @Auth({ permissions: ['report:maintenance'] })
  @MaintenanceOverviewDocs()
  async getOverview(@Query() filters: MaintenanceOverviewFiltersDto) {
    return this.getOverviewUseCase.execute(filters);
  }

  /**
   * Get Maintenance By Type Report
   *
   * Breakdown by maintenance type (PREVENTIVE, CORRECTIVE, EMERGENCY, SCHEDULED)
   * with cost analysis, completion rates, and top assets per type.
   */
  @Get('by-type')
  @Auth({ permissions: ['report:maintenance'] })
  @MaintenanceByTypeDocs()
  async getByType(@Query() filters: MaintenanceByTypeFiltersDto) {
    return this.getByTypeUseCase.execute(filters);
  }

  /**
   * Get Maintenance By Status Report
   *
   * Workflow analysis by status (PENDING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED)
   * with status transitions and delayed request alerts.
   */
  @Get('by-status')
  @Auth({ permissions: ['report:maintenance'] })
  @MaintenanceByStatusDocs()
  async getByStatus(@Query() filters: MaintenanceByStatusFiltersDto) {
    return this.getByStatusUseCase.execute(filters);
  }

  /**
   * Get Maintenance By Asset Report
   *
   * Asset-centric analysis showing maintenance frequency, costs,
   * preventive vs corrective ratio, and cost-to-value ratios.
   */
  @Get('by-asset')
  @Auth({ permissions: ['report:maintenance'] })
  @MaintenanceByAssetDocs()
  async getByAsset(@Query() filters: MaintenanceByAssetFiltersDto) {
    return this.getByAssetUseCase.execute(filters);
  }

  /**
   * Get Maintenance Cost Analysis Report
   *
   * Comprehensive financial analysis with estimated vs actual costs,
   * variance tracking, breakdowns by type/asset/vendor, and monthly trends.
   */
  @Get('cost-analysis')
  @Auth({ permissions: ['report:maintenance'] })
  @MaintenanceCostAnalysisDocs()
  async getCostAnalysis(@Query() filters: MaintenanceCostAnalysisFiltersDto) {
    return this.getCostAnalysisUseCase.execute(filters);
  }

  /**
   * Get Maintenance Performance Report
   *
   * Performance metrics including MTTR, MTBF, completion rates,
   * on-time metrics, employee/vendor performance, and emergency response times.
   */
  @Get('performance')
  @Auth({ permissions: ['report:maintenance'] })
  @MaintenancePerformanceDocs()
  async getPerformance(@Query() filters: MaintenancePerformanceFiltersDto) {
    return this.getPerformanceUseCase.execute(filters);
  }

  /**
   * Get Preventive Maintenance Report
   *
   * Preventive maintenance planning with upcoming schedule, overdue alerts,
   * unscheduled assets, and cost savings analysis.
   */
  @Get('preventive')
  @Auth({ permissions: ['report:maintenance'] })
  @PreventiveMaintenanceDocs()
  async getPreventive(@Query() filters: PreventiveMaintenanceFiltersDto) {
    return this.getPreventiveUseCase.execute(filters);
  }

  /**
   * Get MTBF/MTTR Per Asset Report
   *
   * Mean Time Between Failures and Mean Time To Repair broken down
   * per individual asset with composite reliability scores.
   */
  @Get('mtbf-mttr')
  @Auth({ permissions: ['report:maintenance'] })
  async getMtbfMttr(@Query() filters: MaintenanceMtbfMttrFiltersDto) {
    return this.getMtbfMttrUseCase.execute(filters);
  }

  /**
   * Get Maintenance Cost Per Asset Report
   *
   * Detailed cost breakdown per individual asset with estimated vs actual
   * costs, variance analysis, and optional cost-to-value ratios.
   */
  @Get('cost-per-asset')
  @Auth({ permissions: ['report:maintenance'] })
  async getCostPerAsset(@Query() filters: MaintenanceCostPerAssetFiltersDto) {
    return this.getCostPerAssetUseCase.execute(filters);
  }

  /**
   * Get Maintenance Budget vs. Actual Report
   *
   * Compares estimated (budget) vs actual maintenance spend grouped by
   * month, asset type, or maintenance type.
   */
  @Get('budget-vs-actual')
  @Auth({ permissions: ['report:maintenance'] })
  async getBudgetVsActual(@Query() filters: MaintenanceBudgetActualFiltersDto) {
    return this.getBudgetActualUseCase.execute(filters);
  }
}
