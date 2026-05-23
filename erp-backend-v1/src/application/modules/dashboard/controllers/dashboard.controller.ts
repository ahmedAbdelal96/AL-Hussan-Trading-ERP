/**
 * Dashboard Controller
 * Handles main dashboard statistics endpoint
 *
 * Endpoints:
 * - GET /dashboard - Retrieve comprehensive dashboard statistics
 */

import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Auth } from '../../auth/decorators';
import { CurrentUser } from '../../../common/decorators';
import { DashboardStatisticsDto } from '../dto';
import { GetDashboardStatisticsUseCase } from '../use-cases';

interface DashboardRequestUser {
  email: string;
  roles?: string[];
  permissions?: Array<{
    resource: string;
    action: string;
  }>;
}

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(
    private readonly getDashboardStatisticsUseCase: GetDashboardStatisticsUseCase,
  ) {}

  /**
   * Get comprehensive dashboard statistics from all modules
   * Aggregates data from: Assets, Projects, Employees, Maintenance, Finance
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Auth()
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Returns permission-filtered statistics. Each user sees only the modules they have access to.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatisticsDto,
  })
  async getDashboardStatistics(
    @CurrentUser() user: DashboardRequestUser,
    @Query('forceRefresh') forceRefreshRaw?: string,
  ): Promise<DashboardStatisticsDto> {
    const userPermissions = (user.permissions || []).map(
      (p: { resource: string; action: string }) => `${p.resource}:${p.action}`,
    );
    const userRoles: string[] = user.roles || [];

    this.logger.log(
      `Dashboard request from ${user.email} with roles: [${userRoles.join(', ')}]`,
    );

    const forceRefresh =
      typeof forceRefreshRaw === 'string' &&
      ['1', 'true', 'yes'].includes(forceRefreshRaw.toLowerCase());

    return this.getDashboardStatisticsUseCase.execute(
      userPermissions,
      userRoles,
      forceRefresh,
    );
  }
}
