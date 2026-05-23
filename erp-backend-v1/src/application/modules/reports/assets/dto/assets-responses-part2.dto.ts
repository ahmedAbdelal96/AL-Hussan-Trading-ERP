/**
 * ============================================================================
 * ASSETS REPORTS - RESPONSE DTOs (Part 2: Reports 4-6)
 * ============================================================================
 *
 * Response data structures for asset reports.
 * Organized for clarity and maintainability.
 *
 * Reports in this file:
 * - Report 4: Assets By Location
 * - Report 5: Depreciation Analysis
 * - Report 6: Utilization Report
 *
 * @module AssetsResponses
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType, AssetStatus } from '@prisma/client';

/**
 * ============================================================================
 * REPORT 4: ASSETS BY LOCATION
 * ============================================================================
 */

/**
 * Type distribution per location
 */
export class TypeDistributionDto {
  @ApiProperty({
    enum: AssetType,
    description: 'Asset type',
    example: 'VEHICLE',
  })
  assetType: AssetType;

  @ApiProperty({
    description: 'Number of assets of this type',
    example: 15,
  })
  count: number;

  @ApiProperty({
    description: 'Percentage of location assets',
    example: 30.0,
  })
  percentage: number;
}

/**
 * Location breakdown item
 */
export class LocationBreakdownDto {
  @ApiProperty({
    description: 'Location name',
    example: 'Riyadh Main Office',
  })
  location: string;

  @ApiProperty({
    description: 'Number of assets at this location',
    example: 50,
  })
  assetCount: number;

  @ApiProperty({
    description: 'Total value of assets at this location',
    example: 2500000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Percentage of total assets',
    example: 33.33,
  })
  percentage: number;

  @ApiProperty({
    description: 'Type distribution at this location',
    type: [TypeDistributionDto],
  })
  typeDistribution: TypeDistributionDto[];

  @ApiPropertyOptional({
    description: 'Utilization rate at this location (percentage)',
    example: 82.5,
  })
  utilizationRate?: number;

  @ApiProperty({
    description: 'Available assets at this location',
    example: 28,
  })
  availableAssets: number;

  @ApiProperty({
    description: 'Assets in use at this location',
    example: 18,
  })
  assetsInUse: number;
}

/**
 * Assets By Location Response
 */
export class AssetsByLocationResponseDto {
  @ApiProperty({
    description: 'Location breakdown',
    type: [LocationBreakdownDto],
  })
  breakdown: LocationBreakdownDto[];

  @ApiProperty({
    description: 'Total number of locations',
    example: 8,
  })
  totalLocations: number;

  @ApiProperty({
    description: 'Total number of assets',
    example: 150,
  })
  totalAssets: number;

  @ApiProperty({
    description: 'Total value of all assets',
    example: 8950000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Location with most assets',
    example: 'Riyadh Main Office',
  })
  topLocation: string;

  @ApiProperty({
    description: 'Location with highest value',
    example: 'Jeddah Branch',
  })
  highestValueLocation: string;

  @ApiProperty({
    description: 'Average assets per location',
    example: 18.75,
  })
  averageAssetsPerLocation: number;
}

/**
 * ============================================================================
 * REPORT 5: DEPRECIATION ANALYSIS
 * ============================================================================
 */

/**
 * Age group breakdown
 */
export class AgeGroupBreakdownDto {
  @ApiProperty({
    description: 'Age group label',
    example: '1-2 years',
  })
  ageGroup: string;

  @ApiProperty({
    description: 'Number of assets in this age group',
    example: 45,
  })
  assetCount: number;

  @ApiProperty({
    description: 'Total purchase value',
    example: 3200000,
  })
  purchaseValue: number;

  @ApiProperty({
    description: 'Estimated current value',
    example: 2560000,
  })
  currentValue: number;

  @ApiProperty({
    description: 'Total depreciation',
    example: 640000,
  })
  totalDepreciation: number;

  @ApiProperty({
    description: 'Depreciation percentage',
    example: 20.0,
  })
  depreciationPercentage: number;
}

/**
 * Type depreciation breakdown
 */
export class TypeDepreciationDto {
  @ApiProperty({
    enum: AssetType,
    description: 'Asset type',
    example: 'VEHICLE',
  })
  assetType: AssetType;

  @ApiProperty({
    description: 'Number of assets',
    example: 50,
  })
  assetCount: number;

  @ApiProperty({
    description: 'Total purchase value',
    example: 3500000,
  })
  purchaseValue: number;

  @ApiProperty({
    description: 'Estimated current value',
    example: 2625000,
  })
  currentValue: number;

  @ApiProperty({
    description: 'Total depreciation',
    example: 875000,
  })
  totalDepreciation: number;

  @ApiProperty({
    description: 'Depreciation percentage',
    example: 25.0,
  })
  depreciationPercentage: number;

  @ApiProperty({
    description: 'Average asset age (years)',
    example: 3.5,
  })
  averageAge: number;
}

/**
 * High-value asset
 */
export class HighValueAssetDto {
  @ApiProperty({
    description: 'Asset ID',
    example: 'asset_123',
  })
  assetId: string;

  @ApiProperty({
    description: 'Asset number',
    example: 'AST-2026-001',
  })
  assetNumber: string;

  @ApiProperty({
    description: 'Asset name',
    example: 'Caterpillar Excavator 320D',
  })
  name: string;

  @ApiProperty({
    enum: AssetType,
    description: 'Asset type',
    example: 'MACHINERY',
  })
  assetType: AssetType;

  @ApiProperty({
    description: 'Purchase date',
    example: '2023-05-15',
  })
  purchaseDate: Date;

  @ApiProperty({
    description: 'Purchase price',
    example: 450000,
  })
  purchasePrice: number;

  @ApiProperty({
    description: 'Estimated current value',
    example: 337500,
  })
  currentValue: number;

  @ApiProperty({
    description: 'Total depreciation',
    example: 112500,
  })
  totalDepreciation: number;

  @ApiProperty({
    description: 'Asset age (years)',
    example: 2.7,
  })
  age: number;
}

/**
 * Depreciation Analysis Response
 */
export class DepreciationAnalysisResponseDto {
  @ApiProperty({
    description: 'Total purchase value of all assets',
    example: 10200000,
  })
  totalPurchaseValue: number;

  @ApiProperty({
    description: 'Estimated total current value',
    example: 8950000,
  })
  totalCurrentValue: number;

  @ApiProperty({
    description: 'Total depreciation amount',
    example: 1250000,
  })
  totalDepreciation: number;

  @ApiProperty({
    description: 'Average depreciation percentage',
    example: 12.25,
  })
  averageDepreciationPercentage: number;

  @ApiProperty({
    description: 'Depreciation by asset type',
    type: [TypeDepreciationDto],
  })
  byType: TypeDepreciationDto[];

  @ApiProperty({
    description: 'Depreciation by age group',
    type: [AgeGroupBreakdownDto],
  })
  byAgeGroup: AgeGroupBreakdownDto[];

  @ApiPropertyOptional({
    description: 'Top 10 high-value assets',
    type: [HighValueAssetDto],
  })
  highValueAssets?: HighValueAssetDto[];

  @ApiProperty({
    description: 'Annual depreciation rate used',
    example: 20.0,
  })
  depreciationRate: number;

  @ApiProperty({
    description: 'Total number of assets analyzed',
    example: 150,
  })
  totalAssets: number;
}

/**
 * ============================================================================
 * REPORT 6: UTILIZATION REPORT
 * ============================================================================
 */

/**
 * Asset operation summary
 */
export class AssetOperationSummaryDto {
  @ApiProperty({
    description: 'Asset ID',
    example: 'asset_123',
  })
  assetId: string;

  @ApiProperty({
    description: 'Asset number',
    example: 'AST-2026-001',
  })
  assetNumber: string;

  @ApiProperty({
    description: 'Asset name',
    example: 'Toyota Hilux 2023',
  })
  name: string;

  @ApiProperty({
    enum: AssetType,
    description: 'Asset type',
    example: 'VEHICLE',
  })
  assetType: AssetType;

  @ApiProperty({
    description: 'Total operation hours',
    example: 450.5,
  })
  totalHours: number;

  @ApiProperty({
    description: 'Number of operations',
    example: 85,
  })
  operationCount: number;

  @ApiPropertyOptional({
    description: 'Total fuel consumption (liters)',
    example: 1250.5,
  })
  totalFuelConsumption?: number;

  @ApiPropertyOptional({
    description: 'Total distance traveled (km)',
    example: 8500,
  })
  totalDistance?: number;

  @ApiProperty({
    description: 'Utilization rate (percentage)',
    example: 78.5,
  })
  utilizationRate: number;

  @ApiProperty({
    description: 'Last operation date',
    example: '2026-01-15T10:30:00Z',
  })
  lastOperation: Date;
}

/**
 * Type utilization breakdown
 */
export class TypeUtilizationDto {
  @ApiProperty({
    enum: AssetType,
    description: 'Asset type',
    example: 'VEHICLE',
  })
  assetType: AssetType;

  @ApiProperty({
    description: 'Number of assets',
    example: 50,
  })
  assetCount: number;

  @ApiProperty({
    description: 'Average utilization rate (percentage)',
    example: 75.5,
  })
  averageUtilization: number;

  @ApiProperty({
    description: 'Total operation hours',
    example: 12500.5,
  })
  totalHours: number;

  @ApiProperty({
    description: 'Assets with high utilization (>80%)',
    example: 28,
  })
  highUtilization: number;

  @ApiProperty({
    description: 'Assets with low utilization (<50%)',
    example: 8,
  })
  lowUtilization: number;

  @ApiProperty({
    description: 'Idle assets (0% utilization)',
    example: 3,
  })
  idleAssets: number;
}

/**
 * Idle asset
 */
export class IdleAssetDto {
  @ApiProperty({
    description: 'Asset ID',
    example: 'asset_123',
  })
  assetId: string;

  @ApiProperty({
    description: 'Asset number',
    example: 'AST-2026-001',
  })
  assetNumber: string;

  @ApiProperty({
    description: 'Asset name',
    example: 'Forklift Toyota 8FG25',
  })
  name: string;

  @ApiProperty({
    enum: AssetType,
    description: 'Asset type',
    example: 'EQUIPMENT',
  })
  assetType: AssetType;

  @ApiProperty({
    enum: AssetStatus,
    description: 'Current status',
    example: 'AVAILABLE',
  })
  status: AssetStatus;

  @ApiProperty({
    description: 'Days idle',
    example: 45,
  })
  daysIdle: number;

  @ApiProperty({
    description: 'Last operation date',
    example: '2025-12-01T10:30:00Z',
    nullable: true,
  })
  lastOperation: Date | null;

  @ApiProperty({
    description: 'Current location',
    example: 'Riyadh Warehouse',
  })
  location: string;
}

/**
 * Utilization Report Response
 */
export class UtilizationReportResponseDto {
  @ApiProperty({
    description: 'Overall utilization rate (percentage)',
    example: 72.5,
  })
  overallUtilization: number;

  @ApiProperty({
    description: 'Total operation hours',
    example: 25000.5,
  })
  totalOperationHours: number;

  @ApiProperty({
    description: 'Total number of assets analyzed',
    example: 150,
  })
  totalAssets: number;

  @ApiProperty({
    description: 'Assets with high utilization (>80%)',
    example: 58,
  })
  highUtilizationCount: number;

  @ApiProperty({
    description: 'Assets with low utilization (<50%)',
    example: 25,
  })
  lowUtilizationCount: number;

  @ApiProperty({
    description: 'Idle assets (0% utilization)',
    example: 12,
  })
  idleAssetsCount: number;

  @ApiProperty({
    description: 'Utilization by asset type',
    type: [TypeUtilizationDto],
  })
  byType: TypeUtilizationDto[];

  @ApiPropertyOptional({
    description: 'Most utilized assets (top 10)',
    type: [AssetOperationSummaryDto],
  })
  mostUtilized?: AssetOperationSummaryDto[];

  @ApiPropertyOptional({
    description: 'Least utilized assets (bottom 10)',
    type: [AssetOperationSummaryDto],
  })
  leastUtilized?: AssetOperationSummaryDto[];

  @ApiPropertyOptional({
    description: 'Idle assets requiring attention',
    type: [IdleAssetDto],
  })
  idleAssets?: IdleAssetDto[];

  @ApiPropertyOptional({
    description: 'Total fuel consumption (liters)',
    example: 28500.5,
  })
  totalFuelConsumption?: number;

  @ApiPropertyOptional({
    description: 'Total distance traveled (km)',
    example: 185000,
  })
  totalDistance?: number;
}
