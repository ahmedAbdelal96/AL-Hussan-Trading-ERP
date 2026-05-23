import { Module } from '@nestjs/common';
import { ReportsModule } from '../reports.module';
import { RbacModule } from '../../rbac/rbac.module';
import { PayrollReportsController } from './payroll-reports.controller';
import {
  GetPayrollOverviewUseCase,
  GetPayrollByDepartmentUseCase,
  GetPayrollBySiteUseCase,
  GetSalaryComponentsUseCase,
  GetAllowancesReportUseCase,
  GetDeductionsLoansUseCase,
  GetPayrollTrendUseCase,
  GetPayrollComparisonUseCase,
} from './use-cases';

/**
 * Payroll Reports Module
 *
 * Provides comprehensive payroll reporting functionality:
 * - Monthly payroll overview with KPIs
 * - Payroll breakdown by department and site
 * - Detailed salary components analysis
 * - Allowances tracking and reporting
 * - Deductions and loans portfolio analysis
 * - Time-series payroll trend analysis (1-24 months)
 * - Period-to-period comparison with variance analysis
 *
 * Architecture:
 * - Clean Architecture with Use Cases pattern
 * - Each report = dedicated Use Case class
 * - Controller delegates to Use Cases (thin layer)
 * - Shared BaseReportService for common utilities
 *
 * Business Logic:
 * - Net Payroll = Base Salaries + Allowances - Deductions
 * - MONTHLY allowances: Always included if active in period
 * - ONE_TIME allowances: Only if effectiveFrom in month
 * - Salary structures: Uses date ranges (effectiveFrom/effectiveTo)
 * - Defaults: Current month/year, ACTIVE employees only
 *
 * Performance:
 * - Parallel aggregations with Promise.all
 * - Selective field projections
 * - Database indexes on: employeeId, effectiveFrom, deductionDate
 *
 * @module PayrollReportsModule
 */
@Module({
  imports: [
    ReportsModule, // For BaseReportService
    RbacModule, // For @Auth() decorator
  ],
  controllers: [PayrollReportsController],
  providers: [
    // Use Cases (8 reports)
    GetPayrollOverviewUseCase,
    GetPayrollByDepartmentUseCase,
    GetPayrollBySiteUseCase,
    GetSalaryComponentsUseCase,
    GetAllowancesReportUseCase,
    GetDeductionsLoansUseCase,
    GetPayrollTrendUseCase,
    GetPayrollComparisonUseCase,
  ],
  exports: [
    // Export Use Cases for potential reuse in other modules
    GetPayrollOverviewUseCase,
    GetPayrollByDepartmentUseCase,
    GetPayrollBySiteUseCase,
    GetSalaryComponentsUseCase,
    GetAllowancesReportUseCase,
    GetDeductionsLoansUseCase,
    GetPayrollTrendUseCase,
    GetPayrollComparisonUseCase,
  ],
})
export class PayrollReportsModule {}
