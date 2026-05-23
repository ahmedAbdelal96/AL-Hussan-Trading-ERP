import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  MaintenanceOverviewResponseDto,
  MaintenanceByTypeResponseDto,
  MaintenanceByStatusResponseDto,
  MaintenanceByAssetResponseDto,
} from '../dto';

/**
 * Swagger documentation for Maintenance Overview Report endpoint
 *
 * Provides comprehensive dashboard view of maintenance operations including:
 * - Total requests and completion rates
 * - Distribution by status, type, and priority
 * - Mean Time To Repair (MTTR) metrics
 * - Cost analysis with savings calculation
 * - Overdue maintenance tracking
 * - Period-over-period comparison
 *
 * Use Case: Executive dashboard for maintenance department oversight
 */
export function MaintenanceOverviewDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get maintenance overview report',
      description: `
        Comprehensive dashboard view of all maintenance operations.
        
        **Key Metrics:**
        - Total, completed, in-progress, and pending requests
        - Completion rate and average repair time (MTTR)
        - Cost analysis: estimated vs actual with savings
        - Distribution by status (5 statuses), type (4 types), and priority (4 levels)
        - Overdue maintenance count and alerts
        
        **Optional Features:**
        - Period comparison: Compare current period with previous period
        - Overdue alerts: List of maintenance requests past their scheduled date
        
        **Business Value:**
        - Quick assessment of maintenance department health
        - Identify bottlenecks and efficiency opportunities
        - Track cost performance and savings
        - Monitor overdue items for risk management
        
        **Typical Users:** Maintenance managers, operations directors, fleet managers
      `,
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Start date for the report period (ISO 8601)',
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'End date for the report period (ISO 8601)',
      example: '2024-12-31',
    }),
    ApiQuery({
      name: 'maintenanceType',
      required: false,
      enum: ['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'SCHEDULED'],
      description: 'Filter by maintenance type',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
      description: 'Filter by maintenance status',
    }),
    ApiQuery({
      name: 'priority',
      required: false,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      description: 'Filter by priority level',
    }),
    ApiQuery({
      name: 'assetType',
      required: false,
      enum: [
        'VEHICLE',
        'EQUIPMENT',
        'MACHINERY',
        'TOOL',
        'COMPUTER',
        'FURNITURE',
        'OTHER',
      ],
      description: 'Filter by asset type',
    }),
    ApiQuery({
      name: 'includeComparison',
      required: false,
      type: Boolean,
      description: 'Include period-over-period comparison data',
      example: true,
    }),
    ApiQuery({
      name: 'includeOverdueAlerts',
      required: false,
      type: Boolean,
      description: 'Include list of overdue maintenance requests',
      example: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Maintenance overview report generated successfully',
      type: MaintenanceOverviewResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid filter parameters',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Valid authentication required',
    }),
    ApiResponse({
      status: 403,
      description:
        'Forbidden - Insufficient permissions to view maintenance reports',
    }),
  );
}

/**
 * Swagger documentation for Maintenance By Type Report endpoint
 *
 * Analyzes maintenance patterns across 4 maintenance types:
 * - PREVENTIVE: Scheduled maintenance to prevent failures
 * - CORRECTIVE: Repairs after issues are detected
 * - EMERGENCY: Urgent repairs for critical failures
 * - SCHEDULED: Planned maintenance activities
 *
 * Use Case: Optimize maintenance strategy and resource allocation
 */
export function MaintenanceByTypeDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get maintenance breakdown by type',
      description: `
        Detailed analysis of maintenance activities grouped by type.
        
        **Maintenance Types:**
        - PREVENTIVE: Proactive scheduled maintenance
        - CORRECTIVE: Reactive repairs after detection
        - EMERGENCY: Critical urgent repairs
        - SCHEDULED: Planned maintenance activities
        
        **Metrics Per Type:**
        - Request count and percentage distribution
        - Cost analysis: estimated vs actual with variance
        - Average completion duration
        - Completion rate
        
        **Optional Features:**
        - Top assets: Most frequently maintained assets per type
        - Sorting: by count, cost, duration, or type name
        - Minimum request threshold filtering
        
        **Business Insights:**
        - Identify which types dominate (high corrective = poor preventive)
        - Optimize resource allocation by type
        - Track cost efficiency per maintenance type
        - Plan staffing based on type frequency
        
        **Typical Users:** Maintenance planners, operations analysts, asset managers
      `,
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Start date for filtering',
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'End date for filtering',
      example: '2024-12-31',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
      description: 'Filter by maintenance status',
    }),
    ApiQuery({
      name: 'assetType',
      required: false,
      enum: [
        'VEHICLE',
        'EQUIPMENT',
        'MACHINERY',
        'TOOL',
        'COMPUTER',
        'FURNITURE',
        'OTHER',
      ],
      description: 'Filter by asset type',
    }),
    ApiQuery({
      name: 'minRequests',
      required: false,
      type: Number,
      description: 'Minimum number of requests to include type in results',
      example: 5,
    }),
    ApiQuery({
      name: 'includeTopAssets',
      required: false,
      type: Boolean,
      description: 'Include top 5 most maintained assets per type',
      example: true,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['count', 'cost', 'duration', 'type'],
      description: 'Field to sort results by',
      example: 'cost',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['asc', 'desc'],
      description: 'Sort direction',
      example: 'desc',
    }),
    ApiResponse({
      status: 200,
      description: 'Maintenance by type report generated successfully',
      type: MaintenanceByTypeResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid filter parameters',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
    }),
  );
}

/**
 * Swagger documentation for Maintenance By Status Report endpoint
 *
 * Tracks maintenance requests through their lifecycle:
 * - PENDING: Awaiting assignment or approval
 * - IN_PROGRESS: Currently being worked on
 * - ON_HOLD: Temporarily paused
 * - COMPLETED: Successfully finished
 * - CANCELLED: Terminated without completion
 *
 * Use Case: Monitor workflow and identify bottlenecks
 */
export function MaintenanceByStatusDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get maintenance breakdown by status',
      description: `
        Comprehensive status tracking and workflow analysis.
        
        **Status Lifecycle:**
        - PENDING → IN_PROGRESS → COMPLETED (ideal flow)
        - ON_HOLD: Items temporarily paused
        - CANCELLED: Items terminated
        
        **Metrics Per Status:**
        - Request count and percentage
        - Total cost accumulated
        - Average days in current status
        - Average completion time (for COMPLETED)
        
        **Optional Features:**
        - Status transitions: Track movement between statuses
        - Delayed alerts: Items stuck in status too long
        - Cancellation analysis
        
        **Business Insights:**
        - Identify workflow bottlenecks (high PENDING = assignment issues)
        - Monitor completion efficiency
        - Track cancellation patterns and reasons
        - Optimize status transition times
        
        **Performance Indicators:**
        - High completion rate = efficient operations
        - Low cancellation rate = good planning
        - Short status duration = fast processing
        
        **Typical Users:** Maintenance supervisors, workflow managers, quality analysts
      `,
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Start date for filtering',
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'End date for filtering',
      example: '2024-12-31',
    }),
    ApiQuery({
      name: 'maintenanceType',
      required: false,
      enum: ['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'SCHEDULED'],
      description: 'Filter by maintenance type',
    }),
    ApiQuery({
      name: 'priority',
      required: false,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      description: 'Filter by priority level',
    }),
    ApiQuery({
      name: 'assetType',
      required: false,
      enum: [
        'VEHICLE',
        'EQUIPMENT',
        'MACHINERY',
        'TOOL',
        'COMPUTER',
        'FURNITURE',
        'OTHER',
      ],
      description: 'Filter by asset type',
    }),
    ApiQuery({
      name: 'includeTransitions',
      required: false,
      type: Boolean,
      description: 'Include status transition history and timing',
      example: true,
    }),
    ApiQuery({
      name: 'includeAlerts',
      required: false,
      type: Boolean,
      description: 'Include alerts for delayed requests',
      example: true,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['count', 'status', 'avgDuration'],
      description: 'Field to sort results by',
      example: 'count',
    }),
    ApiResponse({
      status: 200,
      description: 'Maintenance by status report generated successfully',
      type: MaintenanceByStatusResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid filter parameters',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
    }),
  );
}

/**
 * Swagger documentation for Maintenance By Asset Report endpoint
 *
 * Asset-centric maintenance analysis showing which assets require most attention.
 *
 * Use Case: Asset lifecycle management and maintenance budgeting
 */
export function MaintenanceByAssetDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get maintenance breakdown by asset',
      description: `
        Asset-focused maintenance analysis for lifecycle management.
        
        **Key Metrics Per Asset:**
        - Total maintenance requests and frequency
        - Total and average costs
        - Last maintenance date and days since
        - Preventive vs corrective maintenance split
        - Cost-to-value ratio (maintenance cost as % of asset value)
        
        **Optional Features:**
        - Maintenance history: Recent maintenance entries per asset
        - Cost ratio analysis: Identify assets with high maintenance costs
        - Frequency filtering: Focus on high-maintenance assets
        
        **Business Insights:**
        - Identify high-maintenance assets for replacement consideration
        - Track maintenance patterns per asset
        - Budget allocation by asset
        - Warranty and lifecycle planning
        
        **Red Flags:**
        - High cost-to-value ratio (>50%) = consider replacement
        - High corrective vs preventive = poor maintenance planning
        - Frequent maintenance = potential quality issues
        
        **Typical Users:** Asset managers, financial planners, procurement teams
      `,
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Start date for filtering',
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'End date for filtering',
      example: '2024-12-31',
    }),
    ApiQuery({
      name: 'maintenanceType',
      required: false,
      enum: ['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'SCHEDULED'],
      description: 'Filter by maintenance type',
    }),
    ApiQuery({
      name: 'assetType',
      required: false,
      enum: [
        'VEHICLE',
        'EQUIPMENT',
        'MACHINERY',
        'TOOL',
        'COMPUTER',
        'FURNITURE',
        'OTHER',
      ],
      description: 'Filter by asset type',
    }),
    ApiQuery({
      name: 'minFrequency',
      required: false,
      type: Number,
      description: 'Minimum maintenance frequency to include asset',
      example: 3,
    }),
    ApiQuery({
      name: 'includeHistory',
      required: false,
      type: Boolean,
      description: 'Include recent maintenance history per asset',
      example: true,
    }),
    ApiQuery({
      name: 'includeCostRatio',
      required: false,
      type: Boolean,
      description: 'Include cost-to-value ratio analysis',
      example: true,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['frequency', 'cost', 'lastMaintenance', 'assetName'],
      description: 'Field to sort results by',
      example: 'frequency',
    }),
    ApiResponse({
      status: 200,
      description: 'Maintenance by asset report generated successfully',
      type: MaintenanceByAssetResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid filter parameters',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
    }),
  );
}
