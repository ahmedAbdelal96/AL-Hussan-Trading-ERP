/**
 * ============================================================================
 * ASSETS REPORTS - FILTER DTOs
 * ============================================================================
 *
 * Request validation and filtering for asset reports.
 * Following Clean Architecture principles with separation of concerns.
 *
 * Design Decisions:
 * - Base class pattern for shared filters (DRY principle)
 * - Optional filters for flexible querying
 * - Enum validation for type safety
 * - Date range validation for time-based reports
 * - Value range validation for financial analysis
 *
 * @module AssetsFilters
 * @version 1.0.0
 */

import {
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
  IsInt,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType, AssetStatus } from '@prisma/client';

/**
 * ============================================================================
 * BASE FILTERS DTO
 * ============================================================================
 * Common filters used across all asset reports
 */
export class BaseAssetFiltersDto {
  @ApiPropertyOptional({
    description: 'Start date for date range filtering',
    example: '2026-01-01',
  })
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'End date for date range filtering',
    example: '2026-12-31',
  })
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({
    enum: AssetType,
    description: 'Filter by asset type',
    example: 'VEHICLE',
  })
  @IsOptional()
  @IsEnum(AssetType)
  assetType?: AssetType;

  @ApiPropertyOptional({
    enum: AssetStatus,
    description: 'Filter by asset status',
    example: 'AVAILABLE',
  })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @ApiPropertyOptional({
    description: 'Filter by location (partial match)',
    example: 'Riyadh',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Filter by category',
    example: 'Heavy Equipment',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by manufacturer',
    example: 'Toyota',
  })
  @IsOptional()
  @IsString()
  manufacturer?: string;
}

/**
 * Report 1: Assets Overview Filters
 */
export class AssetsOverviewFiltersDto extends BaseAssetFiltersDto {
  @ApiPropertyOptional({
    description: 'Include previous period comparison',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeComparison?: boolean;

  @ApiPropertyOptional({
    description: 'Include warranty status breakdown',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeWarrantyStatus?: boolean;
}

/**
 * Report 2: Assets By Type Filters
 */
export class AssetsByTypeFiltersDto extends BaseAssetFiltersDto {
  @ApiPropertyOptional({
    description: 'Minimum asset count to include in results',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minAssets?: number;

  @ApiPropertyOptional({
    description: 'Include top manufacturers per type',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeManufacturers?: boolean;

  @ApiPropertyOptional({
    enum: ['assetCount', 'totalValue', 'assetType'],
    description: 'Sort by field',
    example: 'assetCount',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'assetCount' | 'totalValue' | 'assetType';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

/**
 * Report 3: Assets By Status Filters
 */
export class AssetsByStatusFiltersDto extends BaseAssetFiltersDto {
  @ApiPropertyOptional({
    description: 'Include status transition history',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeTransitions?: boolean;

  @ApiPropertyOptional({
    description: 'Include assets requiring attention',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeAlerts?: boolean;

  @ApiPropertyOptional({
    enum: ['assetCount', 'totalValue', 'status'],
    description: 'Sort by field',
    example: 'assetCount',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'assetCount' | 'totalValue' | 'status';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

/**
 * Report 4: Assets By Location Filters
 */
export class AssetsByLocationFiltersDto extends BaseAssetFiltersDto {
  @ApiPropertyOptional({
    description: 'Minimum asset count per location',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minAssets?: number;

  @ApiPropertyOptional({
    description: 'Include utilization rate per location',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeUtilization?: boolean;

  @ApiPropertyOptional({
    enum: ['assetCount', 'totalValue', 'location', 'utilizationRate'],
    description: 'Sort by field',
    example: 'assetCount',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'assetCount' | 'totalValue' | 'location' | 'utilizationRate';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

/**
 * Report 5: Depreciation Analysis Filters
 */
export class DepreciationAnalysisFiltersDto extends BaseAssetFiltersDto {
  @ApiPropertyOptional({
    description: 'Minimum purchase value filter',
    example: 10000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minValue?: number;

  @ApiPropertyOptional({
    description: 'Maximum purchase value filter',
    example: 1000000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxValue?: number;

  @ApiPropertyOptional({
    description: 'Annual depreciation rate (percentage)',
    example: 20,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  depreciationRate?: number;

  @ApiPropertyOptional({
    description: 'Include high-value assets (top 10)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeTopAssets?: boolean;
}

/**
 * Report 6: Utilization Report Filters
 */
export class UtilizationReportFiltersDto extends BaseAssetFiltersDto {
  @ApiPropertyOptional({
    description: 'Minimum utilization rate filter (percentage)',
    example: 0,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  minUtilization?: number;

  @ApiPropertyOptional({
    description: 'Maximum utilization rate filter (percentage)',
    example: 100,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  maxUtilization?: number;

  @ApiPropertyOptional({
    description: 'Include operation details',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeOperations?: boolean;

  @ApiPropertyOptional({
    description: 'Include idle assets (zero or low utilization)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeIdleAssets?: boolean;

  @ApiPropertyOptional({
    enum: ['utilizationRate', 'assetCount', 'totalHours'],
    description: 'Sort by field',
    example: 'utilizationRate',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'utilizationRate' | 'assetCount' | 'totalHours';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
