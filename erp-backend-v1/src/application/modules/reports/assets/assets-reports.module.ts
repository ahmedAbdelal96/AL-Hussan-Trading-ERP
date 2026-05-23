/**
 * ============================================================================
 * ASSETS REPORTS MODULE
 * ============================================================================
 *
 * NestJS module for assets reporting functionality.
 * Provides comprehensive asset analysis and insights.
 *
 * @module AssetsReportsModule
 * @version 1.0.0
 */

import { Module } from '@nestjs/common';
import { ReportsModule } from '../reports.module';
import { RbacModule } from '../../rbac/rbac.module';
import { AssetsReportsController } from './assets-reports.controller';
import {
  GetAssetsOverviewUseCase,
  GetAssetsByTypeUseCase,
  GetAssetsByStatusUseCase,
  GetAssetsByLocationUseCase,
  GetDepreciationAnalysisUseCase,
  GetUtilizationReportUseCase,
} from './use-cases';

@Module({
  imports: [ReportsModule, RbacModule],
  controllers: [AssetsReportsController],
  providers: [
    GetAssetsOverviewUseCase,
    GetAssetsByTypeUseCase,
    GetAssetsByStatusUseCase,
    GetAssetsByLocationUseCase,
    GetDepreciationAnalysisUseCase,
    GetUtilizationReportUseCase,
  ],
  exports: [
    GetAssetsOverviewUseCase,
    GetAssetsByTypeUseCase,
    GetAssetsByStatusUseCase,
    GetAssetsByLocationUseCase,
    GetDepreciationAnalysisUseCase,
    GetUtilizationReportUseCase,
  ],
})
export class AssetsReportsModule {}
