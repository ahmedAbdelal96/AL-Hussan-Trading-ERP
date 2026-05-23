/**
 * ============================================================================
 * DASHBOARD STATISTICS DTOs
 * ============================================================================
 *
 * Comprehensive dashboard statistics combining all modules.
 * Provides high-level KPIs for executive decision-making.
 *
 * Design Principles:
 * - Single request for all dashboard data (performance optimized)
 * - Essential metrics only (no overwhelming details)
 * - Supports trend analysis and alerts
 * - Internationalization ready (AR/EN labels)
 *
 * @module DashboardStatisticsDto
 * @version 1.0.0
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Assets Module Summary
 */
export class AssetsModuleSummaryDto {
  @ApiProperty({
    description: 'Total number of active assets',
    example: 75,
  })
  totalAssets: number;

  @ApiProperty({
    description: 'Total value of all assets (in SAR)',
    example: 5250000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Number of available assets',
    example: 45,
  })
  availableAssets: number;

  @ApiProperty({
    description: 'Number of assets currently in use',
    example: 25,
  })
  inUseAssets: number;

  @ApiProperty({
    description: 'Number of assets under maintenance',
    example: 3,
  })
  underMaintenanceAssets: number;

  @ApiProperty({
    description: 'Asset utilization rate (percentage)',
    example: 68.5,
  })
  utilizationRate: number;

  @ApiProperty({
    description: 'Number of assets with expired warranty',
    example: 12,
  })
  expiredWarrantyCount: number;
}

/**
 * Projects Module Summary
 */
export class ProjectsModuleSummaryDto {
  @ApiProperty({
    description: 'Total number of projects',
    example: 25,
  })
  totalProjects: number;

  @ApiProperty({
    description: 'Number of active projects',
    example: 12,
  })
  activeProjects: number;

  @ApiProperty({
    description: 'Number of completed projects',
    example: 8,
  })
  completedProjects: number;

  @ApiProperty({
    description: 'Number of on-hold projects',
    example: 3,
  })
  onHoldProjects: number;

  @ApiProperty({
    description: 'Number of cancelled projects',
    example: 2,
  })
  cancelledProjects: number;

  @ApiProperty({
    description: 'Total budget of all projects',
    example: 15000000,
  })
  totalBudget: number;

  @ApiProperty({
    description: 'Total actual cost spent',
    example: 8500000,
  })
  totalActualCost: number;

  @ApiProperty({
    description: 'Completion rate percentage',
    example: 37.5,
  })
  completionRate: number;
}

/**
 * Employees Module Summary
 */
export class EmployeesModuleSummaryDto {
  @ApiProperty({
    description: 'Total number of employees',
    example: 150,
  })
  totalEmployees: number;

  @ApiProperty({
    description: 'Number of active employees',
    example: 145,
  })
  activeEmployees: number;

  @ApiProperty({
    description: 'Number of inactive employees',
    example: 5,
  })
  inactiveEmployees: number;

  @ApiProperty({
    description: 'Number of employees on leave',
    example: 3,
  })
  onLeaveEmployees: number;
}

/**
 * Maintenance Module Summary
 */
export class MaintenanceModuleSummaryDto {
  @ApiProperty({
    description: 'Total maintenance requests',
    example: 85,
  })
  totalRequests: number;

  @ApiProperty({
    description: 'Pending maintenance requests',
    example: 12,
  })
  pendingRequests: number;

  @ApiProperty({
    description: 'In-progress maintenance requests',
    example: 8,
  })
  inProgressRequests: number;

  @ApiProperty({
    description: 'Completed maintenance requests',
    example: 60,
  })
  completedRequests: number;

  @ApiProperty({
    description: 'Completion rate percentage',
    example: 74.8,
  })
  completionRate: number;
}

/**
 * Finance Module Summary
 */
export class FinanceModuleSummaryDto {
  @ApiProperty({
    description: 'Total costs across all projects',
    example: 12000000,
  })
  totalCosts: number;

  @ApiProperty({
    description: 'Pending amount (awaiting approval)',
    example: 850000,
  })
  pendingAmount: number;

  @ApiProperty({
    description: 'Approved amount',
    example: 9500000,
  })
  approvedAmount: number;

  @ApiProperty({
    description: 'Paid amount',
    example: 8500000,
  })
  paidAmount: number;

  @ApiProperty({
    description: 'Rejected amount',
    example: 150000,
  })
  rejectedAmount: number;

  @ApiProperty({
    description: 'Average cost per entry',
    example: 125000,
  })
  averageCost: number;

  @ApiProperty({
    description: 'Total number of cost entries',
    example: 96,
  })
  totalEntries: number;
}

/**
 * Critical Alerts Summary
 */
export class CriticalAlertsDto {
  @ApiProperty({
    description: 'Pending maintenance requests',
    example: 12,
  })
  pendingMaintenance: number;

  @ApiProperty({
    description: 'Expired warranties',
    example: 12,
  })
  expiredWarranties: number;

  @ApiProperty({
    description: 'On-hold projects',
    example: 3,
  })
  onHoldProjects: number;

  @ApiProperty({
    description: 'Pending cost approvals',
    example: 23,
  })
  pendingApprovals: number;

  @ApiProperty({
    description: 'Inactive employees',
    example: 5,
  })
  inactiveEmployees: number;

  @ApiProperty({
    description: 'High turnover rate alert',
    example: 0,
  })
  highTurnoverAlert: number;
}

/**
 * ============================================================================
 * MAIN DASHBOARD STATISTICS DTO
 * ============================================================================
 */

/**
 * Comprehensive Dashboard Statistics Response
 *
 * Aggregates high-level KPIs from all modules in a single response.
 * Optimized for main dashboard rendering.
 *
 * Performance Considerations:
 * - All module statistics fetched in parallel with Promise.all
 * - Only essential metrics included (no detailed breakdowns)
 * - Efficient caching strategy recommended
 * - Soft-deleted records excluded from all calculations
 *
 * Usage:
 * ```typescript
 * GET /api/v1/dashboard
 * ```
 */
export class DashboardStatisticsDto {
  @ApiProperty({
    type: AssetsModuleSummaryDto,
    description: 'Assets module summary (null if user lacks asset:read)',
    nullable: true,
  })
  assets: AssetsModuleSummaryDto | null;

  @ApiProperty({
    type: ProjectsModuleSummaryDto,
    description: 'Projects module summary (null if user lacks project:read)',
    nullable: true,
  })
  projects: ProjectsModuleSummaryDto | null;

  @ApiProperty({
    type: EmployeesModuleSummaryDto,
    description: 'Employees module summary (null if user lacks employee:read)',
    nullable: true,
  })
  employees: EmployeesModuleSummaryDto | null;

  @ApiProperty({
    type: MaintenanceModuleSummaryDto,
    description:
      'Maintenance module summary (null if user lacks maintenance:read)',
    nullable: true,
  })
  maintenance: MaintenanceModuleSummaryDto | null;

  @ApiProperty({
    type: FinanceModuleSummaryDto,
    description: 'Finance module summary (null if user lacks finance:read)',
    nullable: true,
  })
  finance: FinanceModuleSummaryDto | null;

  @ApiProperty({
    type: CriticalAlertsDto,
    description: 'Critical alerts requiring attention',
  })
  alerts: CriticalAlertsDto;

  @ApiProperty({
    description: 'Timestamp when statistics were generated',
    example: '2026-02-16T12:00:00.000Z',
  })
  generatedAt: Date;
}
