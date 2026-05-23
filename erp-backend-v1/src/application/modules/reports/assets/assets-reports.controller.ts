/**
 * ============================================================================
 * ASSETS REPORTS CONTROLLER
 * ============================================================================
 *
 * HTTP layer for assets reports endpoints.
 * Handles request validation and response formatting.
 *
 * @module AssetsReportsController
 * @version 1.0.0
 */

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../auth/decorators/auth.decorator';
import {
  AssetsOverviewFiltersDto,
  AssetsByTypeFiltersDto,
  AssetsByStatusFiltersDto,
  AssetsByLocationFiltersDto,
  DepreciationAnalysisFiltersDto,
  UtilizationReportFiltersDto,
} from './dto';
import {
  AssetsOverviewDocs,
  AssetsByTypeDocs,
  AssetsByStatusDocs,
  AssetsByLocationDocs,
  DepreciationAnalysisDocs,
  UtilizationReportDocs,
} from './decorators';
import {
  GetAssetsOverviewUseCase,
  GetAssetsByTypeUseCase,
  GetAssetsByStatusUseCase,
  GetAssetsByLocationUseCase,
  GetDepreciationAnalysisUseCase,
  GetUtilizationReportUseCase,
} from './use-cases';

@ApiTags('Reports - Assets')
@Controller('reports/assets')
export class AssetsReportsController {
  constructor(
    private readonly getAssetsOverview: GetAssetsOverviewUseCase,
    private readonly getAssetsByType: GetAssetsByTypeUseCase,
    private readonly getAssetsByStatus: GetAssetsByStatusUseCase,
    private readonly getAssetsByLocation: GetAssetsByLocationUseCase,
    private readonly getDepreciationAnalysis: GetDepreciationAnalysisUseCase,
    private readonly getUtilizationReport: GetUtilizationReportUseCase,
  ) {}

  /**
   * Report 1: Assets Overview
   */
  @Get('overview')
  @Auth({ permissions: ['report:assets'] })
  @AssetsOverviewDocs()
  async getOverview(@Query() filters: AssetsOverviewFiltersDto) {
    return this.getAssetsOverview.execute(filters);
  }

  /**
   * Report 2: Assets By Type
   */
  @Get('by-type')
  @Auth({ permissions: ['report:assets'] })
  @AssetsByTypeDocs()
  async getByType(@Query() filters: AssetsByTypeFiltersDto) {
    return this.getAssetsByType.execute(filters);
  }

  /**
   * Report 3: Assets By Status
   */
  @Get('by-status')
  @Auth({ permissions: ['report:assets'] })
  @AssetsByStatusDocs()
  async getByStatus(@Query() filters: AssetsByStatusFiltersDto) {
    return this.getAssetsByStatus.execute(filters);
  }

  /**
   * Report 4: Assets By Location
   */
  @Get('by-location')
  @Auth({ permissions: ['report:assets'] })
  @AssetsByLocationDocs()
  async getByLocation(@Query() filters: AssetsByLocationFiltersDto) {
    return this.getAssetsByLocation.execute(filters);
  }

  /**
   * Report 5: Depreciation Analysis
   */
  @Get('depreciation')
  @Auth({ permissions: ['report:assets'] })
  @DepreciationAnalysisDocs()
  async getDepreciation(@Query() filters: DepreciationAnalysisFiltersDto) {
    return this.getDepreciationAnalysis.execute(filters);
  }

  /**
   * Report 6: Utilization Report
   */
  @Get('utilization')
  @Auth({ permissions: ['report:assets'] })
  @UtilizationReportDocs()
  async getUtilization(@Query() filters: UtilizationReportFiltersDto) {
    return this.getUtilizationReport.execute(filters);
  }
}
