/**
 * ============================================================================
 * ASSETS STATISTICS DTOs
 * ============================================================================
 *
 * Comprehensive data transfer objects for asset analytics and reporting.
 * Provides detailed insights into:
 * - Asset inventory and valuation
 * - Status and utilization metrics
 * - Category and type distribution
 * - Age and depreciation analysis
 * - Maintenance performance
 * - Location and assignment tracking
 *
 * Design Principles:
 * - Complete metrics for executive decision-making
 * - Optimized for dashboard visualization
 * - Supports trend analysis and forecasting
 * - Performance-focused with efficient queries
 * - Internationalization ready (AR/EN labels)
 *
 * @module AssetsStatisticsDto
 * @version 1.0.0
 * @author Senior Software Developer
 */

import { ApiProperty } from '@nestjs/swagger';
import { AssetType, AssetStatus } from '@prisma/client';

/**
 * ============================================================================
 * BREAKDOWN DTOs - Granular analytics by different dimensions
 * ============================================================================
 */

/**
 * Asset Type Breakdown
 * Distribution of assets by their type (Vehicle, Equipment, Machinery, etc.)
 */
export class AssetTypeBreakdownDto {
  @ApiProperty({
    enum: AssetType,
    description: 'Asset type category',
    example: 'VEHICLE',
  })
  assetType: AssetType;

  @ApiProperty({
    description: 'Number of assets in this type',
    example: 45,
  })
  assetCount: number;

  @ApiProperty({
    description: 'Total value of assets in this type (in SAR)',
    example: 2500000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Percentage of total assets',
    example: 35.5,
  })
  percentage: number;
}

/**
 * Asset Status Breakdown
 * Distribution by current operational status
 */
export class AssetStatusBreakdownDto {
  @ApiProperty({
    enum: AssetStatus,
    description: 'Current asset status',
    example: 'AVAILABLE',
  })
  status: AssetStatus;

  @ApiProperty({
    description: 'Number of assets with this status',
    example: 30,
  })
  assetCount: number;

  @ApiProperty({
    description: 'Total value of assets in this status',
    example: 1500000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Percentage of total assets',
    example: 40.0,
  })
  percentage: number;
}

/**
 * Asset Category Breakdown
 * Distribution by custom category (Heavy Equipment, Vehicles, IT, etc.)
 */
export class AssetCategoryBreakdownDto {
  @ApiProperty({
    description: 'Asset category name',
    example: 'Heavy Equipment',
  })
  category: string;

  @ApiProperty({
    description: 'Number of assets in this category',
    example: 12,
  })
  assetCount: number;

  @ApiProperty({
    description: 'Total value of assets in this category',
    example: 850000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Percentage of total assets',
    example: 15.5,
  })
  percentage: number;

  @ApiProperty({
    description: 'Number of assets currently in use',
    example: 8,
  })
  inUseCount: number;
}

/**
 * Asset Location Breakdown
 * Distribution by current location/site
 */
export class AssetLocationBreakdownDto {
  @ApiProperty({
    description: 'Location name or site',
    example: 'Riyadh Main Office',
  })
  location: string;

  @ApiProperty({
    description: 'Number of assets at this location',
    example: 25,
  })
  assetCount: number;

  @ApiProperty({
    description: 'Total value of assets at this location',
    example: 1200000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Percentage of total assets',
    example: 33.5,
  })
  percentage: number;
}

/**
 * Asset Age Group Breakdown
 * Distribution by age ranges for depreciation analysis
 */
export class AssetAgeGroupBreakdownDto {
  @ApiProperty({
    description: 'Age range (e.g., "0-1 years", "1-3 years")',
    example: '1-3 years',
  })
  ageGroup: string;

  @ApiProperty({
    description: 'Number of assets in this age group',
    example: 18,
  })
  assetCount: number;

  @ApiProperty({
    description: 'Total value of assets in this age group',
    example: 950000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Percentage of total assets',
    example: 24.5,
  })
  percentage: number;

  @ApiProperty({
    description: 'Average age in years',
    example: 2.3,
  })
  averageAge: number;
}

/**
 * Asset Value Range Breakdown
 * Distribution by purchase price ranges
 */
export class AssetValueRangeBreakdownDto {
  @ApiProperty({
    description: 'Value range (e.g., "0-50K", "50K-100K")',
    example: '100K-500K',
  })
  valueRange: string;

  @ApiProperty({
    description: 'Number of assets in this value range',
    example: 15,
  })
  assetCount: number;

  @ApiProperty({
    description: 'Total value of assets in this range',
    example: 2400000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Percentage of total assets',
    example: 20.5,
  })
  percentage: number;
}

/**
 * Asset Manufacturer Breakdown
 * Distribution by manufacturer/brand (Top 10)
 */
export class AssetManufacturerBreakdownDto {
  @ApiProperty({
    description: 'Manufacturer name',
    example: 'Toyota',
  })
  manufacturer: string;

  @ApiProperty({
    description: 'Number of assets from this manufacturer',
    example: 22,
  })
  assetCount: number;

  @ApiProperty({
    description: 'Total value of assets from this manufacturer',
    example: 1850000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Percentage of total assets',
    example: 29.5,
  })
  percentage: number;
}

/**
 * Monthly Asset Acquisition Trend
 * Track asset purchases over the last 12 months
 */
export class MonthlyAssetTrendDto {
  @ApiProperty({
    description: 'Month in YYYY-MM format',
    example: '2026-01',
  })
  month: string;

  @ApiProperty({
    description: 'Number of assets purchased',
    example: 5,
  })
  assetsPurchased: number;

  @ApiProperty({
    description: 'Total purchase cost for the month',
    example: 450000,
  })
  totalPurchaseCost: number;

  @ApiProperty({
    description: 'Number of assets retired/disposed',
    example: 2,
  })
  assetsRetired: number;

  @ApiProperty({
    description: 'Net change in asset count',
    example: 3,
  })
  netChange: number;

  @ApiProperty({
    description: 'Running total of active assets',
    example: 75,
  })
  totalActiveAssets: number;
}

/**
 * ============================================================================
 * MAIN STATISTICS DTO
 * ============================================================================
 */

/**
 * Comprehensive Assets Statistics Response
 *
 * Aggregates all asset metrics and breakdowns in a single response.
 * Optimized for dashboard rendering with pre-calculated percentages.
 *
 * Performance Considerations:
 * - All queries executed in parallel with Promise.all
 * - Percentage calculations done at database level
 * - Efficient indexing on frequently queried fields
 * - Soft-deleted assets excluded from all calculations
 *
 * Usage:
 * ```typescript
 * GET /api/v1/assets/statistics
 * GET /api/v1/assets/statistics?startDate=2025-01-01&endDate=2025-12-31
 * ```
 */
export class AssetsStatisticsDto {
  // ============================================================================
  // OVERVIEW METRICS - High-level KPIs
  // ============================================================================

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
    description: 'Number of out-of-service assets',
    example: 2,
  })
  outOfServiceAssets: number;

  @ApiProperty({
    description: 'Assets purchased in last 30 days',
    example: 5,
  })
  newAssetsLast30Days: number;

  @ApiProperty({
    description: 'Assets retired in last 30 days',
    example: 1,
  })
  retiredAssetsLast30Days: number;

  @ApiProperty({
    description: 'Asset utilization rate (percentage in use)',
    example: 68.5,
  })
  utilizationRate: number;

  @ApiProperty({
    description: 'Average asset age in years',
    example: 3.2,
  })
  averageAge: number;

  @ApiProperty({
    description: 'Number of assets with expired warranty',
    example: 12,
  })
  expiredWarrantyCount: number;

  @ApiProperty({
    description: 'Total maintenance requests for assets',
    example: 45,
  })
  totalMaintenanceRequests: number;

  @ApiProperty({
    description: 'Average asset value in SAR',
    example: 70000,
  })
  averageAssetValue: number;

  @ApiProperty({
    description: 'Number of high-value assets (>100K SAR)',
    example: 28,
  })
  highValueAssetsCount: number;

  // ============================================================================
  // DETAILED BREAKDOWNS
  // ============================================================================

  @ApiProperty({
    type: [AssetTypeBreakdownDto],
    description: 'Distribution by asset type',
  })
  assetTypeBreakdown: AssetTypeBreakdownDto[];

  @ApiProperty({
    type: [AssetStatusBreakdownDto],
    description: 'Distribution by current status',
  })
  statusBreakdown: AssetStatusBreakdownDto[];

  @ApiProperty({
    type: [AssetCategoryBreakdownDto],
    description: 'Distribution by category (Top 10)',
  })
  categoryBreakdown: AssetCategoryBreakdownDto[];

  @ApiProperty({
    type: [AssetLocationBreakdownDto],
    description: 'Distribution by location (Top 10)',
  })
  locationBreakdown: AssetLocationBreakdownDto[];

  @ApiProperty({
    type: [AssetAgeGroupBreakdownDto],
    description: 'Distribution by age groups',
  })
  ageGroupBreakdown: AssetAgeGroupBreakdownDto[];

  @ApiProperty({
    type: [AssetValueRangeBreakdownDto],
    description: 'Distribution by value ranges',
  })
  valueRangeBreakdown: AssetValueRangeBreakdownDto[];

  @ApiProperty({
    type: [AssetManufacturerBreakdownDto],
    description: 'Distribution by manufacturer (Top 10)',
  })
  manufacturerBreakdown: AssetManufacturerBreakdownDto[];

  @ApiProperty({
    type: [MonthlyAssetTrendDto],
    description: 'Monthly acquisition and disposal trend (Last 12 months)',
  })
  monthlyTrend: MonthlyAssetTrendDto[];

  // ============================================================================
  // METADATA
  // ============================================================================

  @ApiProperty({
    description: 'Timestamp when statistics were generated',
    example: '2026-01-19T12:00:00.000Z',
  })
  generatedAt: Date;

  @ApiProperty({
    description: 'Filter start date (if applied)',
    example: '2025-01-01',
    required: false,
  })
  startDate?: string;

  @ApiProperty({
    description: 'Filter end date (if applied)',
    example: '2025-12-31',
    required: false,
  })
  endDate?: string;
}

/**
 * Query Parameters for Assets Statistics
 * Optional filters to narrow down the analysis
 */
export class AssetsStatisticsParamsDto {
  @ApiProperty({
    description: 'Filter by purchase date start (YYYY-MM-DD)',
    example: '2025-01-01',
    required: false,
  })
  startDate?: string;

  @ApiProperty({
    description: 'Filter by purchase date end (YYYY-MM-DD)',
    example: '2025-12-31',
    required: false,
  })
  endDate?: string;

  @ApiProperty({
    enum: AssetType,
    description: 'Filter by specific asset type',
    example: 'VEHICLE',
    required: false,
  })
  assetType?: AssetType;

  @ApiProperty({
    enum: AssetStatus,
    description: 'Filter by asset status',
    example: 'AVAILABLE',
    required: false,
  })
  status?: AssetStatus;

  @ApiProperty({
    description: 'Filter by location',
    example: 'Riyadh Main Office',
    required: false,
  })
  location?: string;
}
