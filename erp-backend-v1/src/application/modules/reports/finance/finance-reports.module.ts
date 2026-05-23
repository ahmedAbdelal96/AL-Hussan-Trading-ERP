/**
 * ============================================================================
 * FINANCE REPORTS MODULE
 * ============================================================================
 *
 * NestJS module for Finance Reports functionality.
 * Follows Clean Architecture with Use Cases pattern.
 *
 * Module Structure:
 * - Controller: HTTP endpoints (8 routes)
 * - Use Cases: Business logic (8 use cases, one per report)
 * - DTOs: Request filters and response structures
 * - Decorators: Swagger/OpenAPI documentation
 *
 * Dependencies:
 * - ReportsModule: Base services (BaseReportService, ExportService)
 * - RbacModule: Permission checking for @Auth() decorator
 * - DatabaseModule: Prisma access (via ReportsModule)
 *
 * Reports Provided:
 * 1. Overview (KPIs)
 * 2. By Cost Type
 * 3. By Payment Status
 * 4. Monthly Trend
 * 5. By Category
 * 6. By Project (Top N)
 * 7. Pending Approvals (Paginated)
 * 8. Overdue Payments (Paginated)
 *
 * @module FinanceReportsModule
 * @version 1.0.0
 */

import { Module } from '@nestjs/common';
import { ReportsModule } from '../reports.module';
import { RbacModule } from '../../rbac/rbac.module';
import { FinanceReportsController } from './finance-reports.controller';
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

/**
 * Finance Reports Module
 *
 * Encapsulates all finance reporting functionality.
 * Uses Use Cases pattern for business logic separation.
 */
@Module({
  imports: [
    ReportsModule, // Provides BaseReportService, ExportService, PrismaService
    RbacModule, // Provides PermissionResolverService for @Auth() decorator
  ],
  controllers: [FinanceReportsController],
  providers: [
    // Use Cases (Business Logic)
    GetFinanceOverviewUseCase,
    GetCostsByTypeUseCase,
    GetCostsByPaymentStatusUseCase,
    GetMonthlyTrendUseCase,
    GetCostsByCategoryUseCase,
    GetTopProjectsUseCase,
    GetPendingApprovalsUseCase,
    GetOverduePaymentsUseCase,
    GetTaxSummaryUseCase,
  ],
  exports: [
    // Export use cases for potential reuse in other modules
    GetFinanceOverviewUseCase,
    GetCostsByTypeUseCase,
    GetCostsByPaymentStatusUseCase,
    GetMonthlyTrendUseCase,
    GetCostsByCategoryUseCase,
    GetTopProjectsUseCase,
    GetPendingApprovalsUseCase,
    GetOverduePaymentsUseCase,
    GetTaxSummaryUseCase,
  ],
})
export class FinanceReportsModule {}
