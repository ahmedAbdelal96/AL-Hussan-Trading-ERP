import { Module } from '@nestjs/common';
import { ReportsModule } from '../reports.module';
import { RbacModule } from '../../rbac/rbac.module';
import { ExecutiveReportsController } from './executive-reports.controller';
import {
  GetExecutiveDashboardUseCase,
  GetCompanyPnlUseCase,
} from './use-cases';

/**
 * Executive Reports Module
 *
 * Cross-module reporting for senior management — aggregates data across
 * Projects, Assets, Employees, Costs, and Maintenance in a single request.
 *
 * Providers:
 *   GetExecutiveDashboardUseCase — 11 parallel queries for KPI snapshot
 *   GetCompanyPnlUseCase         — Company-level P&L with cost bucketing
 *
 * Permission required: report:system  (SUPERADMIN + ADMIN)
 */
@Module({
  imports: [ReportsModule, RbacModule],
  providers: [GetExecutiveDashboardUseCase, GetCompanyPnlUseCase],
  controllers: [ExecutiveReportsController],
  exports: [GetExecutiveDashboardUseCase, GetCompanyPnlUseCase],
})
export class ExecutiveReportsModule {}
