/**
 * ============================================================================
 * ASSETS REPORTS - SWAGGER DECORATORS (Part 1: Reports 1-3)
 * ============================================================================
 *
 * Swagger/OpenAPI documentation decorators for asset reports endpoints.
 * Provides comprehensive API documentation with examples and response schemas.
 *
 * Reports in this file:
 * - Report 1: Assets Overview
 * - Report 2: Assets By Type
 * - Report 3: Assets By Status
 *
 * @module AssetsSwagger
 * @version 1.0.0
 */

import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AssetsOverviewResponseDto,
  AssetsByTypeResponseDto,
  AssetsByStatusResponseDto,
} from '../dto';

/**
 * ============================================================================
 * REPORT 1: ASSETS OVERVIEW DOCUMENTATION
 * ============================================================================
 */
export function AssetsOverviewDocs() {
  return applyDecorators(
    ApiTags('Reports - Assets'),
    ApiOperation({
      summary: 'Get assets overview report',
      description: `
        **Assets Overview Report**
        
        Provides a comprehensive dashboard view of all assets with key performance indicators.
        
        **Key Metrics:**
        - Total assets count and value
        - Assets by status (Available, In Use, Under Maintenance, etc.)
        - New acquisitions and retirements
        - Utilization and availability rates
        - Warranty status breakdown
        - Period-over-period comparison
        
        **Use Cases:**
        - Executive dashboard for asset management
        - Quick snapshot of asset inventory
        - Monitoring asset acquisition and retirement trends
        - Tracking warranty status and expiration
        - Period comparison for trend analysis
        
        **Filters:**
        - Date range for analysis period
        - Asset type (VEHICLE, EQUIPMENT, MACHINERY, etc.)
        - Asset status (AVAILABLE, IN_USE, etc.)
        - Location, category, manufacturer
        - Include comparison with previous period
        - Include warranty status breakdown
        
        **Performance:**
        - Typical response time: 150-250ms
        - Cached for 5 minutes
        - Supports filtering by multiple criteria
        
        **Example Use Cases:**
        1. Monthly asset management review
        2. Budget planning based on asset value
        3. Warranty management and renewal planning
        4. Asset utilization optimization
        5. Identifying underutilized assets
      `,
    }),
    ApiResponse({
      status: 200,
      description: 'Assets overview retrieved successfully',
      type: AssetsOverviewResponseDto,
      example: {
        totalAssets: 150,
        totalValue: 8950000,
        averageValue: 59666.67,
        availableAssets: 85,
        assetsInUse: 45,
        assetsUnderMaintenance: 12,
        assetsOutOfService: 5,
        retiredAssets: 3,
        newAcquisitions: 8,
        newAcquisitionsValue: 650000,
        assetsRetiredThisPeriod: 2,
        utilizationRate: 78.5,
        maintenanceRate: 8.0,
        availabilityRate: 86.7,
        totalDepreciation: 1250000,
        comparison: {
          totalAssets: 145,
          totalValue: 8500000,
          assetChange: 5,
          valueChange: 450000,
          assetChangePercentage: 3.45,
          valueChangePercentage: 5.29,
        },
        warrantyStatus: {
          activeWarranty: 85,
          expiredWarranty: 45,
          expiringSoon: 12,
          noWarranty: 8,
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions to view reports',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );
}

/**
 * ============================================================================
 * REPORT 2: ASSETS BY TYPE DOCUMENTATION
 * ============================================================================
 */
export function AssetsByTypeDocs() {
  return applyDecorators(
    ApiTags('Reports - Assets'),
    ApiOperation({
      summary: 'Get assets breakdown by type',
      description: `
        **Assets By Type Report**
        
        Provides detailed breakdown of assets categorized by their type with value distribution and status analysis.
        
        **Asset Types Covered:**
        - VEHICLE (Cars, Trucks, Vans, etc.)
        - EQUIPMENT (General equipment)
        - MACHINERY (Heavy machinery, excavators, etc.)
        - TOOL (Hand tools, power tools)
        - COMPUTER (Laptops, desktops, servers)
        - FURNITURE (Office furniture)
        - OTHER (Miscellaneous assets)
        
        **Metrics Per Type:**
        - Asset count and total value
        - Percentage of total assets
        - Average value per asset
        - Average age (years)
        - Status distribution
        - Top manufacturers (optional)
        
        **Use Cases:**
        - Asset portfolio analysis
        - Budget allocation by asset type
        - Procurement planning
        - Type-specific utilization analysis
        - Manufacturer preference analysis
        
        **Filters:**
        - Date range for purchase date filtering
        - Specific asset type
        - Asset status
        - Location, category, manufacturer
        - Minimum asset count threshold
        - Include top manufacturers per type
        - Sorting options (by count, value, type)
        
        **Performance:**
        - Typical response time: 180-280ms
        - Cached for 5 minutes
        - Parallel query execution for efficiency
        
        **Example Use Cases:**
        1. Understanding asset composition
        2. Identifying over/under-invested categories
        3. Planning future purchases by type
        4. Manufacturer performance analysis
        5. Type-specific depreciation tracking
      `,
    }),
    ApiResponse({
      status: 200,
      description: 'Assets by type breakdown retrieved successfully',
      type: AssetsByTypeResponseDto,
      example: {
        breakdown: [
          {
            assetType: 'VEHICLE',
            assetCount: 50,
            totalValue: 3500000,
            percentage: 33.33,
            averageValue: 70000,
            averageAge: 3.5,
            statusDistribution: [
              { status: 'AVAILABLE', count: 25, percentage: 50.0 },
              { status: 'IN_USE', count: 20, percentage: 40.0 },
              { status: 'UNDER_MAINTENANCE', count: 5, percentage: 10.0 },
            ],
            topManufacturers: [
              { manufacturer: 'Toyota', count: 25, totalValue: 1750000 },
              { manufacturer: 'Ford', count: 15, totalValue: 1050000 },
            ],
          },
          {
            assetType: 'MACHINERY',
            assetCount: 35,
            totalValue: 2800000,
            percentage: 23.33,
            averageValue: 80000,
            averageAge: 4.2,
            statusDistribution: [
              { status: 'IN_USE', count: 25, percentage: 71.43 },
              { status: 'AVAILABLE', count: 8, percentage: 22.86 },
              { status: 'UNDER_MAINTENANCE', count: 2, percentage: 5.71 },
            ],
          },
        ],
        totalAssets: 150,
        totalValue: 8950000,
        mostCommonType: 'VEHICLE',
        highestValueType: 'MACHINERY',
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions to view reports',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );
}

/**
 * ============================================================================
 * REPORT 3: ASSETS BY STATUS DOCUMENTATION
 * ============================================================================
 */
export function AssetsByStatusDocs() {
  return applyDecorators(
    ApiTags('Reports - Assets'),
    ApiOperation({
      summary: 'Get assets breakdown by status',
      description: `
        **Assets By Status Report**
        
        Provides detailed breakdown of assets categorized by their current operational status with insights into asset lifecycle and utilization.
        
        **Status Categories:**
        - AVAILABLE: Assets ready for use
        - IN_USE: Assets currently in operation
        - UNDER_MAINTENANCE: Assets undergoing maintenance
        - OUT_OF_SERVICE: Assets temporarily unavailable
        - RETIRED: Assets permanently removed from service
        
        **Metrics Per Status:**
        - Asset count and total value
        - Percentage of total assets
        - Average age of assets
        - Average time in current status
        - Status transition history (optional)
        - Assets requiring attention (optional)
        
        **Status Transitions:**
        - Track status changes over time
        - Identify transition patterns
        - Monitor frequently changing assets
        - Analyze status change reasons
        
        **Alerts:**
        - Assets under maintenance too long (30+ days)
        - Assets out of service requiring review
        - Stale statuses needing update
        - High-value assets in problematic states
        
        **Use Cases:**
        - Operational efficiency monitoring
        - Maintenance planning and scheduling
        - Asset availability tracking
        - Identifying problematic assets
        - Status lifecycle analysis
        
        **Filters:**
        - Date range for status change filtering
        - Specific asset status
        - Asset type (VEHICLE, EQUIPMENT, etc.)
        - Location, category, manufacturer
        - Include status transitions
        - Include asset alerts
        - Sorting options (by count, value, status)
        
        **Performance:**
        - Typical response time: 200-300ms
        - Cached for 5 minutes
        - Optimized queries for transitions
        
        **Example Use Cases:**
        1. Daily operations dashboard
        2. Maintenance workload planning
        3. Asset availability forecasting
        4. Problem asset identification
        5. Status change audit trail
      `,
    }),
    ApiResponse({
      status: 200,
      description: 'Assets by status breakdown retrieved successfully',
      type: AssetsByStatusResponseDto,
      example: {
        breakdown: [
          {
            status: 'AVAILABLE',
            assetCount: 85,
            totalValue: 4250000,
            percentage: 56.67,
            averageAge: 3.2,
            averageDaysInStatus: 180,
          },
          {
            status: 'IN_USE',
            assetCount: 45,
            totalValue: 3200000,
            percentage: 30.0,
            averageAge: 2.8,
            averageDaysInStatus: 120,
          },
          {
            status: 'UNDER_MAINTENANCE',
            assetCount: 12,
            totalValue: 950000,
            percentage: 8.0,
            averageAge: 4.5,
            averageDaysInStatus: 15,
          },
        ],
        totalAssets: 150,
        totalValue: 8950000,
        transitions: [
          {
            fromStatus: 'AVAILABLE',
            toStatus: 'IN_USE',
            count: 35,
            lastTransition: '2026-01-15T10:30:00Z',
          },
          {
            fromStatus: 'IN_USE',
            toStatus: 'UNDER_MAINTENANCE',
            count: 12,
            lastTransition: '2026-01-14T14:20:00Z',
          },
        ],
        alerts: [
          {
            assetId: 'asset_123',
            assetNumber: 'AST-2026-001',
            name: 'Toyota Hilux 2023',
            status: 'UNDER_MAINTENANCE',
            alertReason: 'Under maintenance for 30+ days',
            daysInStatus: 35,
          },
        ],
        operationalEfficiency: 86.7,
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions to view reports',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );
}
