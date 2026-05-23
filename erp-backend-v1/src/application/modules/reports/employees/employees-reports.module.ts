/**
 * ============================================================================
 * EMPLOYEES REPORTS MODULE
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { ReportsModule } from '../reports.module';
import { RbacModule } from '../../rbac/rbac.module';
import { EmployeesReportsController } from './employees-reports.controller';
import {
  GetEmployeesOverviewUseCase,
  GetEmployeesByDepartmentUseCase,
  GetEmployeesByEmploymentTypeUseCase,
  GetEmployeesByPositionUseCase,
  GetAgeExperienceUseCase,
  GetTurnoverAnalysisUseCase,
  GetStatusDistributionUseCase,
  GetEmployeeAssignmentUseCase,
  GetContractExpiryUseCase,
} from './use-cases';

@Module({
  imports: [ReportsModule, RbacModule],
  controllers: [EmployeesReportsController],
  providers: [
    GetEmployeesOverviewUseCase,
    GetEmployeesByDepartmentUseCase,
    GetEmployeesByEmploymentTypeUseCase,
    GetEmployeesByPositionUseCase,
    GetAgeExperienceUseCase,
    GetTurnoverAnalysisUseCase,
    GetStatusDistributionUseCase,
    GetEmployeeAssignmentUseCase,
    GetContractExpiryUseCase,
  ],
  exports: [
    GetEmployeesOverviewUseCase,
    GetEmployeesByDepartmentUseCase,
    GetEmployeesByEmploymentTypeUseCase,
    GetEmployeesByPositionUseCase,
    GetAgeExperienceUseCase,
    GetTurnoverAnalysisUseCase,
    GetStatusDistributionUseCase,
    GetEmployeeAssignmentUseCase,
    GetContractExpiryUseCase,
  ],
})
export class EmployeesReportsModule {}
