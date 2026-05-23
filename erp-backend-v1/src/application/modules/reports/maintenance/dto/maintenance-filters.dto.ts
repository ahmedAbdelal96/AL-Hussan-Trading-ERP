import {
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  MaintenanceType,
  MaintenanceStatus,
  MaintenancePriority,
  AssetType,
} from '@prisma/client';

/**
 * Base filters shared across all maintenance reports
 * Provides common filtering capabilities for date ranges and maintenance attributes
 */
export class BaseMaintenanceFiltersDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering maintenance records',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering maintenance records',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by maintenance type',
    enum: MaintenanceType,
    example: MaintenanceType.PREVENTIVE,
  })
  @IsOptional()
  @IsEnum(MaintenanceType)
  maintenanceType?: MaintenanceType;

  @ApiPropertyOptional({
    description: 'Filter by maintenance status',
    enum: MaintenanceStatus,
    example: MaintenanceStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @ApiPropertyOptional({
    description: 'Filter by maintenance priority',
    enum: MaintenancePriority,
    example: MaintenancePriority.HIGH,
  })
  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @ApiPropertyOptional({
    description: 'Filter by asset type',
    enum: AssetType,
    example: AssetType.VEHICLE,
  })
  @IsOptional()
  @IsEnum(AssetType)
  assetType?: AssetType;

  @ApiPropertyOptional({
    description: 'Filter by specific asset ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @ApiPropertyOptional({
    description: 'Filter by project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by assigned employee ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by vendor name',
    example: 'ABC Maintenance Co.',
  })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({
    description: 'Page number (starts at 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page (max 100)',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * Filters for Maintenance Overview Report
 * Extends base filters with comparison capabilities
 */
export class MaintenanceOverviewFiltersDto extends BaseMaintenanceFiltersDto {
  @ApiPropertyOptional({
    description: 'Include period-over-period comparison',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeComparison?: boolean;

  @ApiPropertyOptional({
    description: 'Include overdue maintenance alerts',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeOverdueAlerts?: boolean;
}

/**
 * Filters for Maintenance By Type Report
 * Extends base filters with type-specific analysis options
 */
export class MaintenanceByTypeFiltersDto extends BaseMaintenanceFiltersDto {
  @ApiPropertyOptional({
    description: 'Minimum number of requests to include in results',
    example: 5,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minRequests?: number;

  @ApiPropertyOptional({
    description: 'Include top assets for each type',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeTopAssets?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['count', 'cost', 'duration', 'type'],
    example: 'cost',
  })
  @IsOptional()
  @IsEnum(['count', 'cost', 'duration', 'type'])
  sortBy?: 'count' | 'cost' | 'duration' | 'type';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filters for Maintenance By Status Report
 * Extends base filters with status transition tracking
 */
export class MaintenanceByStatusFiltersDto extends BaseMaintenanceFiltersDto {
  @ApiPropertyOptional({
    description: 'Include status transition history',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeTransitions?: boolean;

  @ApiPropertyOptional({
    description: 'Include alerts for delayed requests',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeAlerts?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['count', 'status', 'avgDuration'],
    example: 'count',
  })
  @IsOptional()
  @IsEnum(['count', 'status', 'avgDuration'])
  sortBy?: 'count' | 'status' | 'avgDuration';
}

/**
 * Filters for Maintenance By Asset Report
 * Extends base filters with asset-specific analysis
 */
export class MaintenanceByAssetFiltersDto extends BaseMaintenanceFiltersDto {
  @ApiPropertyOptional({
    description: 'Minimum maintenance frequency to include',
    example: 3,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minFrequency?: number;

  @ApiPropertyOptional({
    description: 'Include maintenance history for each asset',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeHistory?: boolean;

  @ApiPropertyOptional({
    description: 'Include cost-to-value ratio analysis',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeCostRatio?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['frequency', 'cost', 'lastMaintenance', 'assetName'],
    example: 'frequency',
  })
  @IsOptional()
  @IsEnum(['frequency', 'cost', 'lastMaintenance', 'assetName'])
  sortBy?: 'frequency' | 'cost' | 'lastMaintenance' | 'assetName';
}

/**
 * Filters for Maintenance Cost Analysis Report
 * Extends base filters with cost-specific parameters
 */
export class MaintenanceCostAnalysisFiltersDto extends BaseMaintenanceFiltersDto {
  @ApiPropertyOptional({
    description: 'Minimum cost to include',
    example: 1000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minCost?: number;

  @ApiPropertyOptional({
    description: 'Maximum cost to include',
    example: 50000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxCost?: number;

  @ApiPropertyOptional({
    description: 'Include cost variance analysis',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeVariance?: boolean;

  @ApiPropertyOptional({
    description: 'Include monthly cost trends',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeTrends?: boolean;

  @ApiPropertyOptional({
    description: 'Include top costly requests',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeTopCostly?: boolean;
}

/**
 * Filters for Maintenance Performance Report
 * Extends base filters with performance metrics options
 */
export class MaintenancePerformanceFiltersDto extends BaseMaintenanceFiltersDto {
  @ApiPropertyOptional({
    description: 'Include employee performance metrics',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeEmployeeMetrics?: boolean;

  @ApiPropertyOptional({
    description: 'Include vendor performance metrics',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeVendorMetrics?: boolean;

  @ApiPropertyOptional({
    description: 'Include MTTR (Mean Time To Repair) analysis',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeMTTR?: boolean;

  @ApiPropertyOptional({
    description: 'Include on-time completion metrics',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeOnTimeMetrics?: boolean;
}

/**
 * Filters for Preventive Maintenance Report
 * Extends base filters with preventive maintenance scheduling
 */
export class PreventiveMaintenanceFiltersDto extends BaseMaintenanceFiltersDto {
  @ApiPropertyOptional({
    description: 'Include upcoming scheduled maintenance',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeUpcoming?: boolean;

  @ApiPropertyOptional({
    description: 'Include overdue preventive maintenance',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeOverdue?: boolean;

  @ApiPropertyOptional({
    description: 'Include assets without preventive schedule',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeUnscheduled?: boolean;

  @ApiPropertyOptional({
    description: 'Days ahead to look for upcoming maintenance',
    example: 30,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  daysAhead?: number;

  @ApiPropertyOptional({
    description: 'Include cost savings analysis',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeCostSavings?: boolean;
}

/**
 * Filters for MTBF/MTTR Per Asset Report
 * Extends base filters with reliability metric options
 */
export class MaintenanceMtbfMttrFiltersDto extends BaseMaintenanceFiltersDto {
  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['mttr', 'mtbf', 'assetName', 'failureCount'],
    example: 'mtbf',
  })
  @IsOptional()
  @IsEnum(['mttr', 'mtbf', 'assetName', 'failureCount'])
  sortBy?: 'mttr' | 'mtbf' | 'assetName' | 'failureCount';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Minimum number of completed requests to include an asset',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minCompletedCount?: number;
}

/**
 * Filters for Maintenance Cost Per Asset Report
 * Extends base filters with per-asset cost analysis options
 */
export class MaintenanceCostPerAssetFiltersDto extends BaseMaintenanceFiltersDto {
  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['totalCost', 'avgCost', 'assetName', 'requestCount', 'costRatio'],
    example: 'totalCost',
  })
  @IsOptional()
  @IsEnum(['totalCost', 'avgCost', 'assetName', 'requestCount', 'costRatio'])
  sortBy?: 'totalCost' | 'avgCost' | 'assetName' | 'requestCount' | 'costRatio';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Minimum total actual cost to include an asset',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minCost?: number;

  @ApiPropertyOptional({
    description: 'Include breakdown of costs by maintenance type',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeTypeBreakdown?: boolean;
}

/**
 * Filters for Maintenance Budget vs Actual Report
 * Extends base filters with grouping options
 */
export class MaintenanceBudgetActualFiltersDto extends BaseMaintenanceFiltersDto {
  @ApiPropertyOptional({
    description: 'Group results by period, asset type, or maintenance type',
    enum: ['month', 'assetType', 'maintenanceType'],
    example: 'month',
  })
  @IsOptional()
  @IsEnum(['month', 'assetType', 'maintenanceType'])
  groupBy?: 'month' | 'assetType' | 'maintenanceType';
}
