/**
 * ============================================================================
 * EMPLOYEES REPORTS CONTROLLER
 * ============================================================================
 */

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from '../../auth/decorators/auth.decorator';
import {
  EmployeesOverviewFiltersDto,
  EmployeesByDepartmentFiltersDto,
  EmployeesByEmploymentTypeFiltersDto,
  EmployeesByPositionFiltersDto,
  AgeExperienceFiltersDto,
  TurnoverAnalysisFiltersDto,
  StatusDistributionFiltersDto,
  EmployeeAssignmentFiltersDto,
  ContractExpiryFiltersDto,
} from './dto';
import {
  EmployeesOverviewDocs,
  EmployeesByDepartmentDocs,
  EmployeesByEmploymentTypeDocs,
  EmployeesByPositionDocs,
  AgeExperienceDocs,
  TurnoverAnalysisDocs,
  StatusDistributionDocs,
  EmployeeAssignmentDocs,
  ContractExpiryDocs,
} from './decorators';
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

@ApiTags('Employees Reports')
@ApiBearerAuth()
@Controller('reports/employees')
@Auth({ permissions: ['report:employees'] })
export class EmployeesReportsController {
  constructor(
    private readonly getEmployeesOverviewUseCase: GetEmployeesOverviewUseCase,
    private readonly getEmployeesByDepartmentUseCase: GetEmployeesByDepartmentUseCase,
    private readonly getEmployeesByEmploymentTypeUseCase: GetEmployeesByEmploymentTypeUseCase,
    private readonly getEmployeesByPositionUseCase: GetEmployeesByPositionUseCase,
    private readonly getAgeExperienceUseCase: GetAgeExperienceUseCase,
    private readonly getTurnoverAnalysisUseCase: GetTurnoverAnalysisUseCase,
    private readonly getStatusDistributionUseCase: GetStatusDistributionUseCase,
    private readonly getEmployeeAssignmentUseCase: GetEmployeeAssignmentUseCase,
    private readonly getContractExpiryUseCase: GetContractExpiryUseCase,
  ) {}

  /**
   * Report 1: Employees Overview
   */
  @Get('overview')
  @EmployeesOverviewDocs()
  async getOverview(@Query() filters: EmployeesOverviewFiltersDto) {
    return this.getEmployeesOverviewUseCase.execute(filters);
  }

  /**
   * Report 2: Employees By Department
   */
  @Get('by-department')
  @EmployeesByDepartmentDocs()
  async getByDepartment(@Query() filters: EmployeesByDepartmentFiltersDto) {
    return this.getEmployeesByDepartmentUseCase.execute(filters);
  }

  /**
   * Report 3: Employees By Employment Type
   */
  @Get('by-employment-type')
  @EmployeesByEmploymentTypeDocs()
  async getByEmploymentType(
    @Query() filters: EmployeesByEmploymentTypeFiltersDto,
  ) {
    return this.getEmployeesByEmploymentTypeUseCase.execute(filters);
  }

  /**
   * Report 4: Employees By Position
   */
  @Get('by-position')
  @EmployeesByPositionDocs()
  async getByPosition(@Query() filters: EmployeesByPositionFiltersDto) {
    return this.getEmployeesByPositionUseCase.execute(filters);
  }

  /**
   * Report 5: Age & Experience Analysis
   */
  @Get('age-experience')
  @AgeExperienceDocs()
  async getAgeExperience(@Query() filters: AgeExperienceFiltersDto) {
    return this.getAgeExperienceUseCase.execute(filters);
  }

  /**
   * Report 6: Turnover Analysis
   */
  @Get('turnover')
  @TurnoverAnalysisDocs()
  async getTurnoverAnalysis(@Query() filters: TurnoverAnalysisFiltersDto) {
    return this.getTurnoverAnalysisUseCase.execute(filters);
  }

  /**
   * Report 7: Status Distribution
   */
  @Get('status')
  @StatusDistributionDocs()
  async getStatusDistribution(@Query() filters: StatusDistributionFiltersDto) {
    return this.getStatusDistributionUseCase.execute(filters);
  }

  /**
   * Report 8: Employee Assignment
   */
  @Get('assignment')
  @EmployeeAssignmentDocs()
  async getAssignment(@Query() filters: EmployeeAssignmentFiltersDto) {
    return this.getEmployeeAssignmentUseCase.execute(filters);
  }

  /**
   * Report 9: Contract Expiry
   */
  @Get('contract-expiry')
  @ContractExpiryDocs()
  async getContractExpiry(@Query() filters: ContractExpiryFiltersDto) {
    return this.getContractExpiryUseCase.execute(filters);
  }
}
