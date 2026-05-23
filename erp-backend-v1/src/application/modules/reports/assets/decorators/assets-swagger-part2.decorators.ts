/**
 * ============================================================================
 * ASSETS REPORTS - SWAGGER DECORATORS (Part 2: Reports 4-6)
 * ============================================================================
 *
 * Swagger/OpenAPI documentation decorators for asset reports endpoints.
 * Provides comprehensive API documentation with examples and response schemas.
 *
 * Reports in this file:
 * - Report 4: Assets By Location
 * - Report 5: Depreciation Analysis
 * - Report 6: Utilization Report
 *
 * @module AssetsSwagger
 * @version 1.0.0
 */

import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AssetsByLocationResponseDto,
  DepreciationAnalysisResponseDto,
  UtilizationReportResponseDto,
} from '../dto';

/**
 * ============================================================================
 * REPORT 4: ASSETS BY LOCATION DOCUMENTATION
 * ============================================================================
 */
export function AssetsByLocationDocs() {
  return applyDecorators(
    ApiTags('Reports - Assets'),
    ApiOperation({
      summary: 'Get assets distribution by location',
      description: `
        **Assets By Location Report**
        
        Provides geographic distribution analysis of assets across different locations with capacity and utilization insights.
        
        **Key Metrics Per Location:**
        - Asset count and total value
        - Percentage of total assets
        - Type distribution (VEHICLE, EQUIPMENT, etc.)
        - Utilization rate (optional)
        - Available vs in-use assets
        - Capacity analysis
        
        **Location Intelligence:**
        - Identify over/under-allocated locations
        - Balance asset distribution across sites
        - Track location-specific utilization
        - Plan asset transfers between locations
        - Optimize resource allocation
        
        **Use Cases:**
        - Geographic asset distribution analysis
        - Location capacity planning
        - Asset allocation optimization
        - Resource balancing across sites
        - Location-specific procurement planning
        
        **Filters:**
        - Date range for location assignment filtering
        - Asset type (VEHICLE, EQUIPMENT, etc.)
        - Asset status (AVAILABLE, IN_USE, etc.)
        - Specific location (partial match)
        - Category, manufacturer
        - Minimum assets per location threshold
        - Include utilization metrics
        - Sorting options (by count, value, location, utilization)
        
        **Performance:**
        - Typical response time: 180-280ms
        - Cached for 5 minutes
        - Efficient location grouping
        
        **Example Use Cases:**
        1. Branch office asset inventory
        2. Inter-location asset transfers
        3. Location-specific budget allocation
        4. Site capacity assessment
        5. Regional resource optimization
      `,
    }),
    ApiResponse({
      status: 200,
      description: 'Assets by location distribution retrieved successfully',
      type: AssetsByLocationResponseDto,
      example: {
        breakdown: [
          {
            location: 'Riyadh Main Office',
            assetCount: 50,
            totalValue: 2500000,
            percentage: 33.33,
            typeDistribution: [
              { assetType: 'VEHICLE', count: 20, percentage: 40.0 },
              { assetType: 'COMPUTER', count: 15, percentage: 30.0 },
              { assetType: 'FURNITURE', count: 15, percentage: 30.0 },
            ],
            utilizationRate: 82.5,
            availableAssets: 28,
            assetsInUse: 18,
          },
          {
            location: 'Jeddah Branch',
            assetCount: 35,
            totalValue: 1800000,
            percentage: 23.33,
            typeDistribution: [
              { assetType: 'MACHINERY', count: 15, percentage: 42.86 },
              { assetType: 'VEHICLE', count: 12, percentage: 34.29 },
              { assetType: 'EQUIPMENT', count: 8, percentage: 22.86 },
            ],
            utilizationRate: 75.0,
            availableAssets: 18,
            assetsInUse: 15,
          },
        ],
        totalLocations: 8,
        totalAssets: 150,
        totalValue: 8950000,
        topLocation: 'Riyadh Main Office',
        highestValueLocation: 'Jeddah Branch',
        averageAssetsPerLocation: 18.75,
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
 * REPORT 5: DEPRECIATION ANALYSIS DOCUMENTATION
 * ============================================================================
 */
export function DepreciationAnalysisDocs() {
  return applyDecorators(
    ApiTags('Reports - Assets'),
    ApiOperation({
      summary: 'Get asset depreciation and value analysis',
      description: `
        **Depreciation Analysis Report**
        
        Provides comprehensive financial analysis of asset depreciation, current values, and investment tracking.
        
        **Depreciation Methods:**
        - Straight-line depreciation
        - Configurable annual depreciation rate
        - Age-based value calculation
        - Type-specific depreciation rates
        
        **Key Financial Metrics:**
        - Total purchase value vs current value
        - Total depreciation amount and percentage
        - Depreciation by asset type
        - Depreciation by age group
        - High-value assets tracking
        - ROI analysis for project-assigned assets
        
        **Age Groups:**
        - Less than 1 year (minimal depreciation)
        - 1-2 years
        - 3-5 years
        - 6-10 years
        - More than 10 years (high depreciation)
        
        **Use Cases:**
        - Financial reporting and auditing
        - Budget planning for asset replacement
        - Insurance valuation
        - Tax calculation support
        - Investment ROI analysis
        - Asset lifecycle cost analysis
        
        **Filters:**
        - Date range for purchase date filtering
        - Asset type (VEHICLE, EQUIPMENT, etc.)
        - Asset status
        - Location, category, manufacturer
        - Minimum/maximum purchase value
        - Custom depreciation rate
        - Include high-value assets (top 10)
        
        **Performance:**
        - Typical response time: 220-320ms
        - Cached for 5 minutes
        - Optimized value calculations
        
        **Example Use Cases:**
        1. Annual financial reporting
        2. Asset replacement planning
        3. Insurance coverage review
        4. Tax depreciation calculations
        5. Investment performance tracking
        6. Budget forecasting
      `,
    }),
    ApiResponse({
      status: 200,
      description: 'Depreciation analysis retrieved successfully',
      type: DepreciationAnalysisResponseDto,
      example: {
        totalPurchaseValue: 10200000,
        totalCurrentValue: 8950000,
        totalDepreciation: 1250000,
        averageDepreciationPercentage: 12.25,
        byType: [
          {
            assetType: 'VEHICLE',
            assetCount: 50,
            purchaseValue: 3500000,
            currentValue: 2625000,
            totalDepreciation: 875000,
            depreciationPercentage: 25.0,
            averageAge: 3.5,
          },
          {
            assetType: 'MACHINERY',
            assetCount: 35,
            purchaseValue: 2800000,
            currentValue: 2380000,
            totalDepreciation: 420000,
            depreciationPercentage: 15.0,
            averageAge: 2.1,
          },
        ],
        byAgeGroup: [
          {
            ageGroup: '1-2 years',
            assetCount: 45,
            purchaseValue: 3200000,
            currentValue: 2560000,
            totalDepreciation: 640000,
            depreciationPercentage: 20.0,
          },
          {
            ageGroup: '3-5 years',
            assetCount: 55,
            purchaseValue: 4000000,
            currentValue: 2800000,
            totalDepreciation: 1200000,
            depreciationPercentage: 30.0,
          },
        ],
        highValueAssets: [
          {
            assetId: 'asset_123',
            assetNumber: 'AST-2026-001',
            name: 'Caterpillar Excavator 320D',
            assetType: 'MACHINERY',
            purchaseDate: '2023-05-15',
            purchasePrice: 450000,
            currentValue: 337500,
            totalDepreciation: 112500,
            age: 2.7,
          },
        ],
        depreciationRate: 20.0,
        totalAssets: 150,
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
 * REPORT 6: UTILIZATION REPORT DOCUMENTATION
 * ============================================================================
 */
export function UtilizationReportDocs() {
  return applyDecorators(
    ApiTags('Reports - Assets'),
    ApiOperation({
      summary: 'Get asset utilization and performance report',
      description: `
        **Utilization Report**
        
        Provides comprehensive analysis of asset utilization, operation hours, efficiency metrics, and idle asset identification.
        
        **Utilization Calculation:**
        - Based on AssetOperation logs
        - Operation hours vs available hours
        - Time-based utilization rate
        - Location and project assignments
        
        **Key Performance Metrics:**
        - Overall utilization rate
        - Total operation hours
        - High/low/idle asset counts
        - Utilization by asset type
        - Most/least utilized assets
        - Fuel consumption (vehicles)
        - Distance traveled (vehicles)
        
        **Utilization Categories:**
        - High utilization: >80% (optimal usage)
        - Medium utilization: 50-80% (acceptable)
        - Low utilization: <50% (underutilized)
        - Idle assets: 0% (unused, requiring action)
        
        **Vehicle-Specific Metrics:**
        - Odometer readings and distance traveled
        - Fuel consumption tracking
        - Fuel efficiency calculations
        - Trip frequency and duration
        
        **Idle Asset Detection:**
        - Assets with zero operations
        - Days idle tracking
        - Last operation date
        - Location-based idle analysis
        - Status-based filtering
        
        **Use Cases:**
        - Asset utilization optimization
        - Identifying underutilized assets
        - Rightsizing asset inventory
        - Procurement justification
        - Asset disposal recommendations
        - Fleet management and efficiency
        - Operational efficiency improvement
        
        **Filters:**
        - Date range for operation period
        - Asset type (VEHICLE, EQUIPMENT, etc.)
        - Asset status
        - Location, category, manufacturer
        - Utilization rate range (min/max)
        - Include operation details
        - Include idle assets
        - Sorting options (by utilization, count, hours)
        
        **Performance:**
        - Typical response time: 250-350ms
        - Cached for 5 minutes
        - Optimized operation aggregation
        
        **Example Use Cases:**
        1. Monthly utilization review
        2. Asset optimization decisions
        3. Disposal candidate identification
        4. Procurement need justification
        5. Fleet efficiency analysis
        6. Fuel cost management
        7. Idle asset reallocation
      `,
    }),
    ApiResponse({
      status: 200,
      description: 'Utilization report retrieved successfully',
      type: UtilizationReportResponseDto,
      example: {
        overallUtilization: 72.5,
        totalOperationHours: 25000.5,
        totalAssets: 150,
        highUtilizationCount: 58,
        lowUtilizationCount: 25,
        idleAssetsCount: 12,
        byType: [
          {
            assetType: 'VEHICLE',
            assetCount: 50,
            averageUtilization: 75.5,
            totalHours: 12500.5,
            highUtilization: 28,
            lowUtilization: 8,
            idleAssets: 3,
          },
          {
            assetType: 'MACHINERY',
            assetCount: 35,
            averageUtilization: 82.3,
            totalHours: 9500.0,
            highUtilization: 25,
            lowUtilization: 5,
            idleAssets: 2,
          },
        ],
        mostUtilized: [
          {
            assetId: 'asset_123',
            assetNumber: 'AST-2026-001',
            name: 'Toyota Hilux 2023',
            assetType: 'VEHICLE',
            totalHours: 450.5,
            operationCount: 85,
            totalFuelConsumption: 1250.5,
            totalDistance: 8500,
            utilizationRate: 95.2,
            lastOperation: '2026-01-15T10:30:00Z',
          },
        ],
        leastUtilized: [
          {
            assetId: 'asset_456',
            assetNumber: 'AST-2026-045',
            name: 'Forklift Toyota 8FG25',
            assetType: 'EQUIPMENT',
            totalHours: 25.0,
            operationCount: 8,
            utilizationRate: 12.5,
            lastOperation: '2026-01-10T14:20:00Z',
          },
        ],
        idleAssets: [
          {
            assetId: 'asset_789',
            assetNumber: 'AST-2026-089',
            name: 'Compressor Atlas Copco XAS 185',
            assetType: 'EQUIPMENT',
            status: 'AVAILABLE',
            daysIdle: 45,
            lastOperation: null,
            location: 'Riyadh Warehouse',
          },
        ],
        totalFuelConsumption: 28500.5,
        totalDistance: 185000,
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
