/**
 * ============================================================================
 * PROJECTS REPORTS CONTROLLER
 * ============================================================================
 *
 * HTTP endpoints for all 7 project reports
 *
 * Features:
 * - RESTful endpoints with proper HTTP methods
 * - Swagger/OpenAPI documentation
 * - RBAC authentication with permissions
 * - Input validation via DTOs
 * - Clean separation of concerns
 *
 * @module ProjectsReportsController
 * @version 1.0.0
 */

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../auth/decorators/auth.decorator';
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
import {
  ProjectsOverviewFiltersDto,
  ProjectsByStatusFiltersDto,
  ProjectsBySiteFiltersDto,
  BudgetUtilizationFiltersDto,
  TimelineProgressFiltersDto,
  DelayedProjectsFiltersDto,
  CompletedProjectsFiltersDto,
  ProjectCostBreakdownFiltersDto,
  ProjectLaborCostFiltersDto,
  ProjectAssetUtilizationFiltersDto,
} from './dto';
import {
  ProjectsOverviewDocs,
  ProjectsByStatusDocs,
  ProjectsBySiteDocs,
  BudgetUtilizationDocs,
  TimelineProgressDocs,
  DelayedProjectsDocs,
  CompletedProjectsDocs,
} from './decorators';

@ApiTags('Reports - Projects')
@Controller('reports/projects')
export class ProjectsReportsController {
  constructor(
    private readonly getProjectsOverviewUseCase: GetProjectsOverviewUseCase,
    private readonly getProjectsByStatusUseCase: GetProjectsByStatusUseCase,
    private readonly getProjectsBySiteUseCase: GetProjectsBySiteUseCase,
    private readonly getBudgetUtilizationUseCase: GetBudgetUtilizationUseCase,
    private readonly getTimelineProgressUseCase: GetTimelineProgressUseCase,
    private readonly getDelayedProjectsUseCase: GetDelayedProjectsUseCase,
    private readonly getCompletedProjectsUseCase: GetCompletedProjectsUseCase,
    private readonly getProjectCostBreakdownUseCase: GetProjectCostBreakdownUseCase,
    private readonly getProjectLaborCostUseCase: GetProjectLaborCostUseCase,
    private readonly getProjectAssetUtilizationUseCase: GetProjectAssetUtilizationUseCase,
  ) {}

  /**
   * GET /reports/projects/overview
   */
  @Get('overview')
  @Auth({ permissions: ['report:projects'] })
  @ProjectsOverviewDocs()
  async getOverview(@Query() filters: ProjectsOverviewFiltersDto) {
    return this.getProjectsOverviewUseCase.execute(filters);
  }

  /**
   * GET /reports/projects/by-status
   */
  @Get('by-status')
  @Auth({ permissions: ['report:projects'] })
  @ProjectsByStatusDocs()
  async getByStatus(@Query() filters: ProjectsByStatusFiltersDto) {
    return this.getProjectsByStatusUseCase.execute(filters);
  }

  /**
   * GET /reports/projects/by-site
   */
  @Get('by-site')
  @Auth({ permissions: ['report:projects'] })
  @ProjectsBySiteDocs()
  async getBySite(@Query() filters: ProjectsBySiteFiltersDto) {
    return await this.getProjectsBySiteUseCase.execute(filters);
  }

  /**
   * GET /reports/projects/budget-utilization
   */
  @Get('budget-utilization')
  @Auth({ permissions: ['report:projects'] })
  @BudgetUtilizationDocs()
  async getBudgetUtilization(@Query() filters: BudgetUtilizationFiltersDto) {
    return await this.getBudgetUtilizationUseCase.execute(filters);
  }

  /**
   * GET /reports/projects/timeline-progress
   */
  @Get('timeline-progress')
  @Auth({ permissions: ['report:projects'] })
  @TimelineProgressDocs()
  async getTimelineProgress(@Query() filters: TimelineProgressFiltersDto) {
    return await this.getTimelineProgressUseCase.execute(filters);
  }

  /**
   * GET /reports/projects/timeline
   * Alias for timeline-progress (frontend compatibility)
   */
  @Get('timeline')
  @Auth({ permissions: ['report:projects'] })
  @TimelineProgressDocs()
  async getTimeline(@Query() filters: TimelineProgressFiltersDto) {
    return await this.getTimelineProgressUseCase.execute(filters);
  }

  /**
   * GET /reports/projects/delayed
   */
  @Get('delayed')
  @Auth({ permissions: ['report:projects'] })
  @DelayedProjectsDocs()
  async getDelayed(@Query() filters: DelayedProjectsFiltersDto) {
    return await this.getDelayedProjectsUseCase.execute(filters);
  }

  /**
   * GET /reports/projects/completed
   */
  @Get('completed')
  @Auth({ permissions: ['report:projects'] })
  @CompletedProjectsDocs()
  async getCompleted(@Query() filters: CompletedProjectsFiltersDto) {
    return await this.getCompletedProjectsUseCase.execute(filters);
  }

  /**
   * GET /reports/projects/cost-breakdown
   * Phase 1: Cost breakdown by type per project
   */
  @Get('cost-breakdown')
  @Auth({ permissions: ['report:projects'] })
  async getCostBreakdown(@Query() filters: ProjectCostBreakdownFiltersDto) {
    return await this.getProjectCostBreakdownUseCase.execute(filters);
  }

  /**
   * GET /reports/projects/labor-cost
   * Phase 1: Labor cost (SALARY + ALLOWANCE) per project
   */
  @Get('labor-cost')
  @Auth({ permissions: ['report:projects'] })
  async getLaborCost(@Query() filters: ProjectLaborCostFiltersDto) {
    return await this.getProjectLaborCostUseCase.execute(filters);
  }

  /**
   * GET /reports/projects/asset-utilization
   * Phase 1: Asset assignments and costs per project
   */
  @Get('asset-utilization')
  @Auth({ permissions: ['report:projects'] })
  async getAssetUtilization(
    @Query() filters: ProjectAssetUtilizationFiltersDto,
  ) {
    return await this.getProjectAssetUtilizationUseCase.execute(filters);
  }
}
