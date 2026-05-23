/**
 * ============================================================================
 * GET DASHBOARD STATISTICS USE CASE
 * ============================================================================
 *
 * Aggregates statistics from all modules for the main dashboard.
 * Executes all module queries in parallel for optimal performance.
 *
 * @module GetDashboardStatisticsUseCase
 * @version 1.0.0
 * @performance ~300-500ms execution time
 */

import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  DashboardStatisticsDto,
  AssetsModuleSummaryDto,
  ProjectsModuleSummaryDto,
  EmployeesModuleSummaryDto,
  MaintenanceModuleSummaryDto,
  FinanceModuleSummaryDto,
  CriticalAlertsDto,
} from '../dto';
import { RedisCacheService } from '../../../../infrastructure/cache/redis-cache.service';
import { GetAssetsStatisticsUseCase } from '../../assets/use-cases/get-assets-statistics.use-case';
import { GetProjectsStatisticsUseCase } from '../../projects/use-cases/get-projects-statistics.use-case';
import { GetEmployeesStatisticsUseCase } from '../../employees/use-cases/get-employees-statistics.use-case';
import { GetMaintenanceStatisticsUseCase } from '../../maintenance/use-cases/get-maintenance-statistics.use-case';
import { GetFinanceStatisticsUseCase } from '../../finance/use-cases/get-finance-statistics.use-case';

/**
 * Use Case: Retrieve comprehensive dashboard statistics from all modules
 */
@Injectable()
export class GetDashboardStatisticsUseCase {
  private readonly logger = new Logger(GetDashboardStatisticsUseCase.name);
  private static readonly MODULE_CONCURRENCY = 2;
  private static readonly DASHBOARD_CACHE_TTL_SECONDS = (() => {
    const raw = process.env.DASHBOARD_CACHE_TTL_SECONDS;
    const parsed = Number(raw);

    // Default tuned for fresher UX while still reducing dashboard pressure.
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 15;
    }

    return Math.floor(parsed);
  })();

  constructor(
    private readonly assetsStatistics: GetAssetsStatisticsUseCase,
    private readonly projectsStatistics: GetProjectsStatisticsUseCase,
    private readonly employeesStatistics: GetEmployeesStatisticsUseCase,
    private readonly maintenanceStatistics: GetMaintenanceStatisticsUseCase,
    private readonly financeStatistics: GetFinanceStatisticsUseCase,
    private readonly cache: RedisCacheService,
  ) {}

  /**
   * Check if user has a specific permission
   */
  private hasPermission(
    userPermissions: string[],
    userRoles: string[],
    permission: string,
  ): boolean {
    // SUPERADMIN and ADMIN bypass all checks
    if (userRoles.includes('SUPERADMIN') || userRoles.includes('ADMIN')) {
      return true;
    }
    return userPermissions.includes(permission);
  }

  /**
   * Run module-level stats with bounded concurrency to prevent DB pool saturation.
   */
  private async runWithConcurrencyLimit<T>(
    tasks: Array<{ key: string; run: () => Promise<T> }>,
    concurrency: number,
  ): Promise<Record<string, T>> {
    if (tasks.length === 0) {
      return {};
    }

    const results: Record<string, T> = {};
    let cursor = 0;

    const workers = Array.from(
      { length: Math.min(concurrency, tasks.length) },
      async () => {
        while (cursor < tasks.length) {
          const index = cursor++;
          const task = tasks[index];
          results[task.key] = await task.run();
        }
      },
    );

    await Promise.all(workers);
    return results;
  }

  /**
   * Build a stable cache key from user access scope.
   * Hashing keeps keys short and avoids leaking raw permission sets.
   */
  private buildCacheKey(
    userPermissions: string[],
    userRoles: string[],
  ): string {
    const normalized = {
      roles: [...userRoles].sort(),
      permissions: [...userPermissions].sort(),
    };
    const hash = createHash('sha1')
      .update(JSON.stringify(normalized))
      .digest('hex');
    return `dashboard:stats:${hash}`;
  }

  /**
   * Execute the use case - fetch only permitted module statistics in parallel
   * @param userPermissions Array of permission strings (e.g., ['employee:read', 'asset:read'])
   * @param userRoles Array of role slugs (e.g., ['HR_MANAGER'])
   * @returns Permission-filtered dashboard statistics
   */
  async execute(
    userPermissions: string[],
    userRoles: string[],
    forceRefresh = false,
  ): Promise<DashboardStatisticsDto> {
    const startTime = Date.now();
    this.logger.log('Fetching permission-filtered dashboard statistics...');
    const cacheKey = this.buildCacheKey(userPermissions, userRoles);
    const buildStats = async (): Promise<DashboardStatisticsDto> => {
      try {
        // Determine which modules the user can access
        const canAssets = this.hasPermission(
          userPermissions,
          userRoles,
          'asset:read',
        );
        const canProjects = this.hasPermission(
          userPermissions,
          userRoles,
          'project:read',
        );
        const canEmployees = this.hasPermission(
          userPermissions,
          userRoles,
          'employee:read',
        );
        const canMaintenance = this.hasPermission(
          userPermissions,
          userRoles,
          'maintenance:read',
        );
        const canFinance = this.hasPermission(
          userPermissions,
          userRoles,
          'finance:read',
        );
        const tasks: Array<{ key: string; run: () => Promise<any> }> = [];
        if (canAssets)
          tasks.push({
            key: 'assets',
            run: () => this.assetsStatistics.execute(),
          });
        if (canProjects)
          tasks.push({
            key: 'projects',
            run: () => this.projectsStatistics.execute(),
          });
        if (canEmployees)
          tasks.push({
            key: 'employees',
            run: () => this.employeesStatistics.execute(),
          });
        if (canMaintenance)
          tasks.push({
            key: 'maintenance',
            run: () => this.maintenanceStatistics.execute(),
          });
        if (canFinance)
          tasks.push({
            key: 'finance',
            run: () => this.financeStatistics.execute(),
          });

        const statsMap = await this.runWithConcurrencyLimit(
          tasks,
          GetDashboardStatisticsUseCase.MODULE_CONCURRENCY,
        );

        // Build response - only include permitted modules
        let assetsSummary: AssetsModuleSummaryDto | null = null;
        if (statsMap.assets) {
          const s = statsMap.assets;
          assetsSummary = {
            totalAssets: s.totalAssets,
            totalValue: s.totalValue,
            availableAssets: s.availableAssets,
            inUseAssets: s.inUseAssets,
            underMaintenanceAssets: s.underMaintenanceAssets,
            utilizationRate: s.utilizationRate,
            expiredWarrantyCount: s.expiredWarrantyCount,
          };
        }

        let projectsSummary: ProjectsModuleSummaryDto | null = null;
        if (statsMap.projects) {
          const s = statsMap.projects;
          projectsSummary = {
            totalProjects: s.totalProjects,
            activeProjects: s.activeProjects,
            completedProjects: s.completedProjects,
            onHoldProjects: s.onHoldProjects,
            cancelledProjects: s.cancelledProjects,
            totalBudget: s.totalBudget,
            totalActualCost: s.totalActualCost,
            completionRate: s.completionRate,
          };
        }

        let employeesSummary: EmployeesModuleSummaryDto | null = null;
        if (statsMap.employees) {
          const s = statsMap.employees;
          employeesSummary = {
            totalEmployees: s.totalEmployees,
            activeEmployees: s.activeEmployees,
            inactiveEmployees: s.inactiveEmployees,
            onLeaveEmployees: s.onLeaveEmployees,
          };
        }

        let maintenanceSummary: MaintenanceModuleSummaryDto | null = null;
        if (statsMap.maintenance) {
          const s = statsMap.maintenance;
          maintenanceSummary = {
            totalRequests: s.totalRequests,
            pendingRequests: s.pendingRequests,
            inProgressRequests: s.inProgressRequests,
            completedRequests: s.completedRequests,
            completionRate: s.completionRate,
          };
        }

        let financeSummary: FinanceModuleSummaryDto | null = null;
        if (statsMap.finance) {
          const s = statsMap.finance;
          financeSummary = {
            totalCosts: s.totalCosts,
            pendingAmount: s.pendingAmount,
            approvedAmount: s.approvedAmount,
            paidAmount: s.paidAmount,
            rejectedAmount: s.rejectedAmount,
            averageCost: s.averageCost,
            totalEntries: s.totalEntries,
          };
        }

        // Aggregate critical alerts from available modules only
        const alerts: CriticalAlertsDto = {
          pendingMaintenance: statsMap.maintenance?.pendingRequests || 0,
          expiredWarranties: statsMap.assets?.expiredWarrantyCount || 0,
          onHoldProjects: statsMap.projects?.onHoldProjects || 0,
          pendingApprovals: (statsMap.finance?.pendingAmount || 0) > 0 ? 1 : 0,
          inactiveEmployees: statsMap.employees?.inactiveEmployees || 0,
          highTurnoverAlert:
            (statsMap.employees?.turnoverRate || 0) > 10 ? 1 : 0,
        };

        const executionTime = Date.now() - startTime;
        this.logger.log(
          `Dashboard statistics fetched in ${executionTime}ms (modules: ${tasks.map((task) => task.key).join(', ') || 'none'})`,
        );

        return {
          assets: assetsSummary,
          projects: projectsSummary,
          employees: employeesSummary,
          maintenance: maintenanceSummary,
          finance: financeSummary,
          alerts,
          generatedAt: new Date(),
        };
      } catch (error) {
        this.logger.error('Failed to fetch dashboard statistics:', error);
        throw error;
      }
    };

    if (forceRefresh) {
      return buildStats();
    }

    return this.cache.getOrSet(
      cacheKey,
      buildStats,
      GetDashboardStatisticsUseCase.DASHBOARD_CACHE_TTL_SECONDS,
    );
  }
}
