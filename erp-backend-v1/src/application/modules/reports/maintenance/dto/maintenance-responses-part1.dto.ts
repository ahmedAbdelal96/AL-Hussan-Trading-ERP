import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MaintenanceType,
  MaintenanceStatus,
  MaintenancePriority,
  AssetType,
} from '@prisma/client';
import { PaginationMeta } from '../../dto/common/report-response.dto';

// ============================================================================
// REPORT 1: MAINTENANCE OVERVIEW
// ============================================================================

/**
 * Status distribution for maintenance overview
 */
export class StatusDistributionDto {
  @ApiProperty({ enum: MaintenanceStatus })
  status: MaintenanceStatus;

  @ApiProperty({ example: 45 })
  count: number;

  @ApiProperty({ example: 25.5 })
  percentage: number;

  @ApiProperty({ example: 125000 })
  totalCost: number;
}

/**
 * Type distribution for maintenance overview
 */
export class TypeDistributionDto {
  @ApiProperty({ enum: MaintenanceType })
  type: MaintenanceType;

  @ApiProperty({ example: 30 })
  count: number;

  @ApiProperty({ example: 18.2 })
  percentage: number;

  @ApiProperty({ example: 85000 })
  totalCost: number;
}

/**
 * Priority distribution for maintenance overview
 */
export class PriorityDistributionDto {
  @ApiProperty({ enum: MaintenancePriority })
  priority: MaintenancePriority;

  @ApiProperty({ example: 20 })
  count: number;

  @ApiProperty({ example: 12.5 })
  percentage: number;

  @ApiProperty({ example: 45000 })
  totalCost: number;
}

/**
 * Period comparison data for trends analysis
 */
export class PeriodComparisonDto {
  @ApiProperty({ example: 180 })
  previousPeriodCount: number;

  @ApiProperty({ example: 165 })
  previousPeriodCompleted: number;

  @ApiProperty({ example: 420000 })
  previousPeriodCost: number;

  @ApiProperty({ example: -8.3 })
  countChangePercentage: number;

  @ApiProperty({ example: 5.2 })
  costChangePercentage: number;
}

/**
 * Overdue maintenance alert
 */
export class OverdueMaintenanceDto {
  @ApiProperty({ example: 'MNT-0123' })
  maintenanceNumber: string;

  @ApiProperty({ example: 'Vehicle Engine Repair' })
  title: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  assetId: string;

  @ApiProperty({ example: 'VEH-001' })
  assetNumber: string;

  @ApiProperty({ example: 'Ford Transit' })
  assetName: string;

  @ApiProperty({ enum: MaintenancePriority })
  priority: MaintenancePriority;

  @ApiProperty({ example: '2024-06-15T10:00:00Z' })
  scheduledDate: Date;

  @ApiProperty({ example: 15 })
  daysOverdue: number;

  @ApiProperty({ example: 12500 })
  estimatedCost: number;
}

/**
 * Response DTO for Maintenance Overview Report
 * Provides comprehensive dashboard view of maintenance operations
 */
export class MaintenanceOverviewResponseDto {
  @ApiProperty({ example: 250 })
  totalRequests: number;

  @ApiProperty({ example: 180 })
  completedRequests: number;

  @ApiProperty({ example: 40 })
  inProgressRequests: number;

  @ApiProperty({ example: 25 })
  pendingRequests: number;

  @ApiProperty({ example: 72.0 })
  completionRate: number;

  @ApiProperty({ example: 3.5 })
  averageRepairTime: number; // in days

  @ApiProperty({ example: 650000 })
  totalEstimatedCost: number;

  @ApiProperty({ example: 580000 })
  totalActualCost: number;

  @ApiProperty({ example: 70000 })
  costSavings: number;

  @ApiProperty({ example: 10.8 })
  costSavingsPercentage: number;

  @ApiProperty({ type: [StatusDistributionDto] })
  statusDistribution: StatusDistributionDto[];

  @ApiProperty({ type: [TypeDistributionDto] })
  typeDistribution: TypeDistributionDto[];

  @ApiProperty({ type: [PriorityDistributionDto] })
  priorityDistribution: PriorityDistributionDto[];

  @ApiProperty({ example: 18 })
  overdueCount: number;

  @ApiProperty({ example: 7.2 })
  overduePercentage: number;

  @ApiPropertyOptional({ type: PeriodComparisonDto })
  periodComparison?: PeriodComparisonDto;

  @ApiPropertyOptional({ type: [OverdueMaintenanceDto] })
  overdueAlerts?: OverdueMaintenanceDto[];
}

// ============================================================================
// REPORT 2: MAINTENANCE BY TYPE
// ============================================================================

/**
 * Asset summary for maintenance type analysis
 */
export class TopAssetForTypeDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  assetId: string;

  @ApiProperty({ example: 'VEH-001' })
  assetNumber: string;

  @ApiProperty({ example: 'Ford Transit' })
  assetName: string;

  @ApiProperty({ enum: AssetType })
  assetType: AssetType;

  @ApiProperty({ example: 12 })
  maintenanceCount: number;

  @ApiProperty({ example: 45000 })
  totalCost: number;
}

/**
 * Detailed breakdown by maintenance type
 */
export class MaintenanceTypeBreakdownDto {
  @ApiProperty({ enum: MaintenanceType })
  type: MaintenanceType;

  @ApiProperty({ example: 65 })
  count: number;

  @ApiProperty({ example: 26.0 })
  percentage: number;

  @ApiProperty({ example: 180000 })
  totalEstimatedCost: number;

  @ApiProperty({ example: 165000 })
  totalActualCost: number;

  @ApiProperty({ example: 15000 })
  costVariance: number;

  @ApiProperty({ example: 8.3 })
  costVariancePercentage: number;

  @ApiProperty({ example: 4.2 })
  averageDuration: number; // in days

  @ApiProperty({ example: 58 })
  completedCount: number;

  @ApiProperty({ example: 89.2 })
  completionRate: number;

  @ApiPropertyOptional({ type: [TopAssetForTypeDto] })
  topAssets?: TopAssetForTypeDto[];
}

/**
 * Response DTO for Maintenance By Type Report
 */
export class MaintenanceByTypeResponseDto {
  @ApiProperty({ example: 250 })
  totalRequests: number;

  @ApiProperty({ type: [MaintenanceTypeBreakdownDto] })
  breakdown: MaintenanceTypeBreakdownDto[];

  @ApiProperty({ example: '2024-01-01' })
  startDate: string;

  @ApiProperty({ example: '2024-12-31' })
  endDate: string;
}

// ============================================================================
// REPORT 3: MAINTENANCE BY STATUS
// ============================================================================

/**
 * Status transition tracking
 */
export class StatusTransitionDto {
  @ApiProperty({ enum: MaintenanceStatus })
  fromStatus: MaintenanceStatus;

  @ApiProperty({ enum: MaintenanceStatus })
  toStatus: MaintenanceStatus;

  @ApiProperty({ example: 35 })
  count: number;

  @ApiProperty({ example: 2.5 })
  averageTimeInHours: number;
}

/**
 * Alert for delayed maintenance requests
 */
export class DelayedMaintenanceAlertDto {
  @ApiProperty({ example: 'MNT-0045' })
  maintenanceNumber: string;

  @ApiProperty({ example: 'Equipment Repair' })
  title: string;

  @ApiProperty({ enum: MaintenanceStatus })
  status: MaintenanceStatus;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  assetId: string;

  @ApiProperty({ example: 'EQP-015' })
  assetNumber: string;

  @ApiProperty({ example: 25 })
  daysInCurrentStatus: number;

  @ApiProperty({ enum: MaintenancePriority })
  priority: MaintenancePriority;
}

/**
 * Detailed breakdown by maintenance status
 */
export class MaintenanceStatusBreakdownDto {
  @ApiProperty({ enum: MaintenanceStatus })
  status: MaintenanceStatus;

  @ApiProperty({ example: 45 })
  count: number;

  @ApiProperty({ example: 18.0 })
  percentage: number;

  @ApiProperty({ example: 125000 })
  totalCost: number;

  @ApiProperty({ example: 5.8 })
  averageDaysInStatus: number;

  @ApiProperty({ example: 3.2 })
  averageCompletionTime: number; // for completed status

  @ApiPropertyOptional({ type: [StatusTransitionDto] })
  transitions?: StatusTransitionDto[];
}

/**
 * Response DTO for Maintenance By Status Report
 */
export class MaintenanceByStatusResponseDto {
  @ApiProperty({ example: 250 })
  totalRequests: number;

  @ApiProperty({ type: [MaintenanceStatusBreakdownDto] })
  breakdown: MaintenanceStatusBreakdownDto[];

  @ApiProperty({ example: 72.0 })
  overallCompletionRate: number;

  @ApiProperty({ example: 8 })
  cancelledCount: number;

  @ApiProperty({ example: 3.2 })
  cancellationRate: number;

  @ApiPropertyOptional({ type: [DelayedMaintenanceAlertDto] })
  delayedAlerts?: DelayedMaintenanceAlertDto[];

  @ApiProperty({ example: '2024-01-01' })
  startDate: string;

  @ApiProperty({ example: '2024-12-31' })
  endDate: string;
}

// ============================================================================
// REPORT 4: MAINTENANCE BY ASSET
// ============================================================================

/**
 * Recent maintenance entry for asset history
 */
export class MaintenanceHistoryEntryDto {
  @ApiProperty({ example: 'MNT-0123' })
  maintenanceNumber: string;

  @ApiProperty({ enum: MaintenanceType })
  type: MaintenanceType;

  @ApiProperty({ enum: MaintenanceStatus })
  status: MaintenanceStatus;

  @ApiProperty({ example: '2024-06-15T10:00:00Z' })
  date: Date;

  @ApiProperty({ example: 8500 })
  cost: number;

  @ApiProperty({ example: 'Engine oil change and filter replacement' })
  description: string;
}

/**
 * Detailed maintenance breakdown per asset
 */
export class AssetMaintenanceBreakdownDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  assetId: string;

  @ApiProperty({ example: 'VEH-001' })
  assetNumber: string;

  @ApiProperty({ example: 'Ford Transit' })
  assetName: string;

  @ApiProperty({ enum: AssetType })
  assetType: AssetType;

  @ApiProperty({ example: 18 })
  maintenanceCount: number;

  @ApiProperty({ example: 85000 })
  totalCost: number;

  @ApiProperty({ example: 4722 })
  averageCostPerMaintenance: number;

  @ApiProperty({ example: '2024-10-20T14:30:00Z' })
  lastMaintenanceDate: Date;

  @ApiProperty({ example: 45 })
  daysSinceLastMaintenance: number;

  @ApiProperty({ example: 12 })
  preventiveCount: number;

  @ApiProperty({ example: 6 })
  correctiveCount: number;

  @ApiPropertyOptional({ example: 150000 })
  assetValue?: number;

  @ApiPropertyOptional({ example: 56.7 })
  costToValueRatio?: number; // percentage

  @ApiPropertyOptional({ type: [MaintenanceHistoryEntryDto] })
  recentHistory?: MaintenanceHistoryEntryDto[];
}

/**
 * Response DTO for Maintenance By Asset Report
 */
export class MaintenanceByAssetResponseDto {
  @ApiProperty({ example: 85 })
  totalAssets: number;

  @ApiProperty({ example: 250 })
  totalMaintenanceRequests: number;

  @ApiProperty({ type: [AssetMaintenanceBreakdownDto] })
  breakdown: AssetMaintenanceBreakdownDto[];

  @ApiPropertyOptional({ type: PaginationMeta })
  meta?: PaginationMeta;

  @ApiProperty({ example: 2.94 })
  averageMaintenanceFrequency: number; // per asset

  @ApiProperty({ example: '2024-01-01' })
  startDate: string;

  @ApiProperty({ example: '2024-12-31' })
  endDate: string;
}
