/**
 * ============================================================================
 * PROJECTS REPORTS MODULE
 * ============================================================================
 *
 * Module configuration for Projects Reports with all dependencies
 *
 * Features:
 * - 7 Use Cases (one per report)
 * - RBAC integration
 * - Shared services (BaseReportService)
 * - Clean architecture compliance
 *
 * @module ProjectsReportsModule
 * @version 1.0.0
 */

import { Module } from '@nestjs/common';
import { ProjectsReportsController } from './projects-reports.controller';
import {
  GetProjectsOverviewUseCase,
  GetProjectsByStatusUseCase,
  GetProjectsBySiteUseCase,
  GetBudgetUtilizationUseCase,
  GetTimelineProgressUseCase,
  GetDelayedProjectsUseCase,
  GetCompletedProjectsUseCase,
  GetProjectCostBreakdownUseCase,
  GetProjectLaborCostUseCase,
  GetProjectAssetUtilizationUseCase,
} from './use-cases';
import { ReportsModule } from '../reports.module';
import { RbacModule } from '../../rbac/rbac.module';

@Module({
  imports: [
    ReportsModule, // For BaseReportService
    RbacModule, // For @Auth decorator
  ],
  controllers: [ProjectsReportsController],
  providers: [
    GetProjectsOverviewUseCase,
    GetProjectsByStatusUseCase,
    GetProjectsBySiteUseCase,
    GetBudgetUtilizationUseCase,
    GetTimelineProgressUseCase,
    GetDelayedProjectsUseCase,
    GetCompletedProjectsUseCase,
    GetProjectCostBreakdownUseCase,
    GetProjectLaborCostUseCase,
    GetProjectAssetUtilizationUseCase,
  ],
  exports: [
    GetProjectsOverviewUseCase,
    GetProjectsByStatusUseCase,
    GetProjectsBySiteUseCase,
    GetBudgetUtilizationUseCase,
    GetTimelineProgressUseCase,
    GetDelayedProjectsUseCase,
    GetCompletedProjectsUseCase,
    GetProjectCostBreakdownUseCase,
    GetProjectLaborCostUseCase,
    GetProjectAssetUtilizationUseCase,
  ],
})
export class ProjectsReportsModule {}
