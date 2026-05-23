import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiSecurity } from '@nestjs/swagger';
import {
  GetSitesOverviewUseCase,
  GetSitesByStatusUseCase,
  GetSitesByLocationUseCase,
  GetSitesCapacityUseCase,
  GetSitesWithProjectsUseCase,
  GetSitesPerformanceUseCase,
  GetSiteProfitabilityUseCase,
} from './use-cases';
import {
  SitesOverviewFiltersDto,
  SitesOverviewResponseDto,
  SitesByStatusFiltersDto,
  SitesByStatusResponseDto,
  SitesByLocationFiltersDto,
  SitesByLocationResponseDto,
  SitesCapacityFiltersDto,
  SitesCapacityResponseDto,
  SitesWithProjectsFiltersDto,
  SitesWithProjectsResponseDto,
  SitesPerformanceFiltersDto,
  SitesPerformanceResponseDto,
  SiteProfitabilityFiltersDto,
  SiteProfitabilityResponseDto,
} from './dto';
import {
  SitesOverviewDocs,
  SitesByStatusDocs,
  SitesByLocationDocs,
  SitesCapacityDocs,
  SitesWithProjectsDocs,
  SitesPerformanceDocs,
  SiteProfitabilityDocs,
} from './decorators';
import { Auth } from '../../auth/decorators/auth.decorator';

/**
 * Sites Reports Controller
 *
 * Provides 6 comprehensive reporting endpoints for site analysis:
 * 1. Overview - Executive dashboard
 * 2. By Status - Lifecycle analysis
 * 3. By Location - Geographic distribution
 * 4. Capacity - Utilization metrics
 * 5. With Projects - Project portfolio
 * 6. Performance - Site evaluation
 */
@Controller('reports/sites')
@ApiTags('Sites Reports')
@ApiSecurity('bearer')
export class SitesReportsController {
  constructor(
    private readonly getSitesOverviewUseCase: GetSitesOverviewUseCase,
    private readonly getSitesByStatusUseCase: GetSitesByStatusUseCase,
    private readonly getSitesByLocationUseCase: GetSitesByLocationUseCase,
    private readonly getSitesCapacityUseCase: GetSitesCapacityUseCase,
    private readonly getSitesWithProjectsUseCase: GetSitesWithProjectsUseCase,
    private readonly getSitesPerformanceUseCase: GetSitesPerformanceUseCase,
    private readonly getSiteProfitabilityUseCase: GetSiteProfitabilityUseCase,
  ) {}

  /**
   * Get Sites Overview Report
   * Dashboard with KPIs, distributions, and capacity metrics
   */
  @Get('overview')
  @Auth({ permissions: ['report:sites'] })
  @SitesOverviewDocs()
  async getOverview(
    @Query() filters: SitesOverviewFiltersDto,
  ): Promise<SitesOverviewResponseDto> {
    return this.getSitesOverviewUseCase.execute(filters);
  }

  /**
   * Get Sites By Status Report
   * Analyzes sites across 4 operational statuses
   */
  @Get('by-status')
  @Auth({ permissions: ['report:sites'] })
  @SitesByStatusDocs()
  async getByStatus(
    @Query() filters: SitesByStatusFiltersDto,
  ): Promise<SitesByStatusResponseDto> {
    return this.getSitesByStatusUseCase.execute(filters);
  }

  /**
   * Get Sites By Location Report
   * Geographic distribution and regional analysis
   */
  @Get('by-location')
  @Auth({ permissions: ['report:sites'] })
  @SitesByLocationDocs()
  async getByLocation(
    @Query() filters: SitesByLocationFiltersDto,
  ): Promise<SitesByLocationResponseDto> {
    return this.getSitesByLocationUseCase.execute(filters);
  }

  /**
   * Get Sites Capacity & Utilization Report
   * Track capacity usage and efficiency metrics
   */
  @Get('capacity')
  @Auth({ permissions: ['report:sites'] })
  @SitesCapacityDocs()
  async getCapacity(
    @Query() filters: SitesCapacityFiltersDto,
  ): Promise<SitesCapacityResponseDto> {
    return this.getSitesCapacityUseCase.execute(filters);
  }

  /**
   * Get Sites With Projects Report
   * Link sites with their associated projects
   */
  @Get('with-projects')
  @Auth({ permissions: ['report:sites'] })
  @SitesWithProjectsDocs()
  async getWithProjects(
    @Query() filters: SitesWithProjectsFiltersDto,
  ): Promise<SitesWithProjectsResponseDto> {
    return this.getSitesWithProjectsUseCase.execute(filters);
  }

  /**
   * Get Sites Performance Report
   * Evaluate site efficiency and profitability metrics
   */
  @Get('performance')
  @Auth({ permissions: ['report:sites'] })
  @SitesPerformanceDocs()
  async getPerformance(
    @Query() filters: SitesPerformanceFiltersDto,
  ): Promise<SitesPerformanceResponseDto> {
    return this.getSitesPerformanceUseCase.execute(filters);
  }

  /**
   * Get Site Profitability Report
   * Revenue vs costs per site with profit margin and rating
   */
  @Get('profitability')
  @Auth({ permissions: ['report:sites'] })
  @SiteProfitabilityDocs()
  async getProfitability(
    @Query() filters: SiteProfitabilityFiltersDto,
  ): Promise<SiteProfitabilityResponseDto> {
    return this.getSiteProfitabilityUseCase.execute(filters);
  }
}
