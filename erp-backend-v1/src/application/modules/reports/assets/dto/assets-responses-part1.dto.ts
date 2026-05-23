/**
 * ============================================================================
 * ASSETS REPORTS - RESPONSE DTOs (Part 1: Reports 1-3)
 * ============================================================================
 *
 * Response data structures for asset reports.
 * Organized for clarity and maintainability.
 *
 * Reports in this file:
 * - Report 1: Assets Overview
 * - Report 2: Assets By Type
 * - Report 3: Assets By Status
 *
 * @module AssetsResponses
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType, AssetStatus } from '@prisma/client';

/**
 * ============================================================================
 * REPORT 1: ASSETS OVERVIEW
 * ============================================================================
 */

/**
 * Previous period comparison data
 */
export class PeriodComparisonDto {
  @ApiProperty({
    description: 'Total assets in previous period',
    example: 145,
  })
  totalAssets: number;

  @ApiProperty({
    description: 'Total value in previous period',
    example: 8500000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Change in asset count',
    example: 5,
  })
  assetChange: number;

  @ApiProperty({
    description: 'Change in total value',
    example: 450000,
  })
  valueChange: number;

  @ApiProperty({
    description: 'Percentage change in assets',
    example: 3.45,
  })
  assetChangePercentage: number;

  @ApiProperty({
    description: 'Percentage change in value',
    example: 5.29,
  })
  valueChangePercentage: number;
}

/**
 * Warranty status breakdown
 */
export class WarrantyStatusDto {
  @ApiProperty({
    description: 'Assets with active warranty',
    example: 85,
  })
  activeWarranty: number;

  @ApiProperty({
    description: 'Assets with expired warranty',
    example: 45,
  })
  expiredWarranty: number;

  @ApiProperty({
    description: 'Assets with warranty expiring soon (within 90 days)',
    example: 12,
  })
  expiringSoon: number;

  @ApiProperty({
    description: 'Assets without warranty information',
    example: 8,
  })
  noWarranty: number;
}

/**
 * Assets Overview Response
 */
export class AssetsOverviewResponseDto {
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
    description: 'Average asset value',
    example: 59666.67,
  })
  averageValue: number;

  @ApiProperty({
    description: 'Number of available assets',
    example: 85,
  })
  availableAssets: number;

  @ApiProperty({
    description: 'Number of assets in use',
    example: 45,
  })
  assetsInUse: number;

  @ApiProperty({
    description: 'Number of assets under maintenance',
    example: 12,
  })
  assetsUnderMaintenance: number;

  @ApiProperty({
    description: 'Number of assets out of service',
    example: 5,
  })
  assetsOutOfService: number;

  @ApiProperty({
    description: 'Number of retired assets',
    example: 3,
  })
  retiredAssets: number;

  @ApiProperty({
    description: 'Assets acquired in current period',
    example: 8,
  })
  newAcquisitions: number;

  @ApiProperty({
    description: 'Value of new acquisitions',
    example: 650000,
  })
  newAcquisitionsValue: number;

  @ApiProperty({
    description: 'Assets retired in current period',
    example: 2,
  })
  assetsRetiredThisPeriod: number;

  @ApiProperty({
    description: 'Utilization rate (percentage)',
    example: 78.5,
  })
  utilizationRate: number;

  @ApiProperty({
    description: 'Maintenance rate (percentage)',
    example: 8.0,
  })
  maintenanceRate: number;

  @ApiProperty({
    description: 'Availability rate (percentage)',
    example: 86.7,
  })
  availabilityRate: number;

  @ApiProperty({
    description: 'Estimated total depreciation',
    example: 1250000,
  })
  totalDepreciation: number;

  @ApiPropertyOptional({
    description: 'Previous period comparison',
    type: PeriodComparisonDto,
  })
  comparison?: PeriodComparisonDto;

  @ApiPropertyOptional({
    description: 'Warranty status breakdown',
    type: WarrantyStatusDto,
  })
  warrantyStatus?: WarrantyStatusDto;
}

/**
 * ============================================================================
 * REPORT 2: ASSETS BY TYPE
 * ============================================================================
 */

/**
 * Status distribution per type
 */
export class StatusDistributionDto {
  @ApiProperty({
    enum: AssetStatus,
    description: 'Asset status',
    example: 'AVAILABLE',
  })
  status: AssetStatus;

  @ApiProperty({
    description: 'Number of assets with this status',
    example: 35,
  })
  count: number;

  @ApiProperty({
    description: 'Percentage of assets with this status',
    example: 70.0,
  })
  percentage: number;
}

/**
 * Top manufacturer per type
 */
export class TopManufacturerDto {
  @ApiProperty({
    description: 'Manufacturer name',
    example: 'Toyota',
  })
  manufacturer: string;

  @ApiProperty({
    description: 'Number of assets from this manufacturer',
    example: 25,
  })
  count: number;

  @ApiProperty({
    description: 'Total value of assets from this manufacturer',
    example: 1250000,
  })
  totalValue: number;
}

/**
 * Type breakdown item
 */
export class AssetTypeBreakdownDto {
  @ApiProperty({
    enum: AssetType,
    description: 'Asset type',
    example: 'VEHICLE',
  })
  assetType: AssetType;

  @ApiProperty({
    description: 'Number of assets of this type',
    example: 50,
  })
  assetCount: number;

  @ApiProperty({
    description: 'Total value of assets of this type',
    example: 3500000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Percentage of total assets',
    example: 33.33,
  })
  percentage: number;

  @ApiProperty({
    description: 'Average value per asset',
    example: 70000,
  })
  averageValue: number;

  @ApiProperty({
    description: 'Average age in years',
    example: 3.5,
  })
  averageAge: number;

  @ApiProperty({
    description: 'Status distribution',
    type: [StatusDistributionDto],
  })
  statusDistribution: StatusDistributionDto[];

  @ApiPropertyOptional({
    description: 'Top manufacturers for this type',
    type: [TopManufacturerDto],
  })
  topManufacturers?: TopManufacturerDto[];
}

/**
 * Assets By Type Response
 */
export class AssetsByTypeResponseDto {
  @ApiProperty({
    description: 'Asset type breakdown',
    type: [AssetTypeBreakdownDto],
  })
  breakdown: AssetTypeBreakdownDto[];

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
    description: 'Most common asset type',
    enum: AssetType,
    example: 'VEHICLE',
  })
  mostCommonType: AssetType;

  @ApiProperty({
    description: 'Highest value asset type',
    enum: AssetType,
    example: 'MACHINERY',
  })
  highestValueType: AssetType;
}

/**
 * ============================================================================
 * REPORT 3: ASSETS BY STATUS
 * ============================================================================
 */

/**
 * Status transition data
 */
export class StatusTransitionDto {
  @ApiProperty({
    enum: AssetStatus,
    description: 'From status',
    example: 'AVAILABLE',
  })
  fromStatus: AssetStatus;

  @ApiProperty({
    enum: AssetStatus,
    description: 'To status',
    example: 'IN_USE',
  })
  toStatus: AssetStatus;

  @ApiProperty({
    description: 'Number of transitions',
    example: 35,
  })
  count: number;

  @ApiProperty({
    description: 'Last transition date',
    example: '2026-01-15T10:30:00Z',
  })
  lastTransition: Date;
}

/**
 * Assets requiring attention
 */
export class AssetAlertDto {
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
    enum: AssetStatus,
    description: 'Current status',
    example: 'UNDER_MAINTENANCE',
  })
  status: AssetStatus;

  @ApiProperty({
    description: 'Alert reason',
    example: 'Under maintenance for 30+ days',
  })
  alertReason: string;

  @ApiProperty({
    description: 'Days in current status',
    example: 35,
  })
  daysInStatus: number;
}

/**
 * Status breakdown item
 */
export class AssetStatusBreakdownDto {
  @ApiProperty({
    enum: AssetStatus,
    description: 'Asset status',
    example: 'AVAILABLE',
  })
  status: AssetStatus;

  @ApiProperty({
    description: 'Number of assets with this status',
    example: 85,
  })
  assetCount: number;

  @ApiProperty({
    description: 'Total value of assets with this status',
    example: 4250000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Percentage of total assets',
    example: 56.67,
  })
  percentage: number;

  @ApiProperty({
    description: 'Average age of assets with this status (years)',
    example: 3.2,
  })
  averageAge: number;

  @ApiProperty({
    description: 'Average time in this status (days)',
    example: 180,
  })
  averageDaysInStatus: number;
}

/**
 * Assets By Status Response
 */
export class AssetsByStatusResponseDto {
  @ApiProperty({
    description: 'Status breakdown',
    type: [AssetStatusBreakdownDto],
  })
  breakdown: AssetStatusBreakdownDto[];

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

  @ApiPropertyOptional({
    description: 'Status transitions in period',
    type: [StatusTransitionDto],
  })
  transitions?: StatusTransitionDto[];

  @ApiPropertyOptional({
    description: 'Assets requiring attention',
    type: [AssetAlertDto],
  })
  alerts?: AssetAlertDto[];

  @ApiProperty({
    description: 'Operational efficiency rate (percentage)',
    example: 86.7,
  })
  operationalEfficiency: number;
}
