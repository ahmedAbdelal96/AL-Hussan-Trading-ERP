import { Module } from '@nestjs/common';
import { ReportsModule } from '../reports.module';
import { RbacModule } from '../../rbac/rbac.module';
import { MaintenanceReportsController } from './maintenance-reports.controller';
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
 * Maintenance Reports Module
 *
 * Provides comprehensive maintenance analytics and reporting capabilities
 * for maintenance operations management.
 *
 * Features:
 * - Overview dashboard with KPIs
 * - Analysis by type, status, and asset
 * - Cost analysis with variance tracking
 * - Performance metrics (MTTR, MTBF, completion rates)
 * - Preventive maintenance planning and ROI
 *
 * All use cases are exported for potential reuse in other modules.
 */
@Module({
  imports: [ReportsModule, RbacModule],
  controllers: [MaintenanceReportsController],
  providers: [
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
  ],
  exports: [
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
  ],
})
export class MaintenanceReportsModule {}
