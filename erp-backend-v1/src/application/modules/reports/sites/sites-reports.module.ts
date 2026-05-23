import { Module } from '@nestjs/common';
import { ReportsModule } from '../reports.module';
import { RbacModule } from '../../rbac/rbac.module';
import { SitesReportsController } from './sites-reports.controller';
import {
  GetSitesOverviewUseCase,
  GetSitesByStatusUseCase,
  GetSitesByLocationUseCase,
  GetSitesCapacityUseCase,
  GetSitesWithProjectsUseCase,
  GetSitesPerformanceUseCase,
  GetSiteProfitabilityUseCase,
} from './use-cases';

/**
 * Sites Reports Module
 *
 * Comprehensive reporting module for site analysis and management.
 * Provides 6 specialized reports with geographic, capacity, and performance metrics.
 *
 * Providers (6 Use Cases):
 * 1. GetSitesOverviewUseCase - Executive dashboard
 * 2. GetSitesByStatusUseCase - Lifecycle analysis
 * 3. GetSitesByLocationUseCase - Geographic distribution
 * 4. GetSitesCapacityUseCase - Capacity utilization
 * 5. GetSitesWithProjectsUseCase - Project portfolio
 * 6. GetSitesPerformanceUseCase - Performance evaluation
 */
@Module({
  imports: [ReportsModule, RbacModule],
  providers: [
    GetSitesOverviewUseCase,
    GetSitesByStatusUseCase,
    GetSitesByLocationUseCase,
    GetSitesCapacityUseCase,
    GetSitesWithProjectsUseCase,
    GetSitesPerformanceUseCase,
    GetSiteProfitabilityUseCase,
  ],
  controllers: [SitesReportsController],
  exports: [
    GetSitesOverviewUseCase,
    GetSitesByStatusUseCase,
    GetSitesByLocationUseCase,
    GetSitesCapacityUseCase,
    GetSitesWithProjectsUseCase,
    GetSitesPerformanceUseCase,
    GetSiteProfitabilityUseCase,
  ],
})
export class SitesReportsModule {}
