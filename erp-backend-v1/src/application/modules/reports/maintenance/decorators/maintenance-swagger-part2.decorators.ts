import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  MaintenanceCostAnalysisResponseDto,
  MaintenancePerformanceResponseDto,
  PreventiveMaintenanceResponseDto,
} from '../dto';

/**
 * Swagger documentation for Maintenance Cost Analysis Report endpoint
 *
 * Comprehensive financial analysis of maintenance operations including:
 * - Cost variance tracking (estimated vs actual)
 * - Breakdowns by type, asset type, vendor, and project
 * - Monthly cost trends
 * - Top costly maintenance identification
 *
 * Use Case: Financial planning, budgeting, and cost control
 */
export function MaintenanceCostAnalysisDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get maintenance cost analysis report',
      description: `
        Comprehensive financial analysis for maintenance budgeting and control.
        
        **Financial Metrics:**
        - Total estimated vs actual costs
        - Cost variance (difference and percentage)
        - Average cost per request
        - Cost distribution by maintenance type
        - Cost distribution by asset type
        
        **Optional Analyses:**
        - Cost by vendor: Vendor performance and cost comparison
        - Monthly trends: Track cost patterns over time
        - Top costly requests: Identify expensive maintenance items
        
        **Business Value:**
        - Budget planning and forecasting
        - Vendor cost comparison and negotiation
        - Cost control and variance management
        - Identify cost-saving opportunities
        
        **Key Insights:**
        - Positive variance = under budget (good)
        - Negative variance = over budget (needs attention)
        - Cost trends indicate seasonal patterns
        - Vendor comparison enables better contracting
        
        **Financial KPIs:**
        - Variance percentage <10% = good cost control
        - Cost per request trends = efficiency indicator
        - Type-based costs = allocation priorities
        
        **Typical Users:** CFOs, financial controllers, maintenance managers, procurement
      `,
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Start date for cost analysis period',
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'End date for cost analysis period',
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
      name: 'minCost',
      required: false,
      type: Number,
      description: 'Minimum cost threshold',
      example: 1000,
    }),
    ApiQuery({
      name: 'maxCost',
      required: false,
      type: Number,
      description: 'Maximum cost threshold',
      example: 50000,
    }),
    ApiQuery({
      name: 'vendor',
      required: false,
      type: String,
      description: 'Filter by specific vendor',
      example: 'ABC Maintenance Co.',
    }),
    ApiQuery({
      name: 'includeVariance',
      required: false,
      type: Boolean,
      description: 'Include detailed cost variance analysis',
      example: true,
    }),
    ApiQuery({
      name: 'includeTrends',
      required: false,
      type: Boolean,
      description: 'Include monthly cost trends',
      example: true,
    }),
    ApiQuery({
      name: 'includeTopCostly',
      required: false,
      type: Boolean,
      description: 'Include top 10 most costly maintenance requests',
      example: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Cost analysis report generated successfully',
      type: MaintenanceCostAnalysisResponseDto,
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
 * Swagger documentation for Maintenance Performance Report endpoint
 *
 * Performance metrics and KPIs for maintenance operations:
 * - MTTR (Mean Time To Repair)
 * - MTBF (Mean Time Between Failures)
 * - On-time completion rates
 * - Employee and vendor performance
 * - Emergency response times
 *
 * Use Case: Performance monitoring and continuous improvement
 */
export function MaintenancePerformanceDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get maintenance performance metrics report',
      description: `
        Comprehensive performance analysis with industry-standard KPIs.
        
        **Core Performance Metrics:**
        - MTTR (Mean Time To Repair): Average repair duration
        - MTBF (Mean Time Between Failures): Estimated failure intervals
        - Overall completion rate
        - Emergency response time
        
        **Optional Performance Analyses:**
        - Employee performance: Individual technician metrics
        - Vendor performance: External contractor effectiveness
        - On-time metrics: Schedule adherence rates
        - MTTR by type: Performance per maintenance type
        
        **Performance Indicators:**
        
        **MTTR (Target: <3 days for routine, <1 day for emergency):**
        - Lower = more efficient repairs
        - Track by type for specific insights
        
        **Completion Rate (Target: >85%):**
        - Higher = better workflow efficiency
        - Compare employees/vendors for benchmarking
        
        **On-Time Rate (Target: >80%):**
        - Schedule adherence indicator
        - Affects operational planning
        
        **Emergency Response (Target: <2 hours):**
        - Critical for safety and operations
        - SLA compliance tracking
        
        **Business Value:**
        - Identify top and bottom performers
        - Set realistic service level agreements (SLAs)
        - Optimize resource allocation
        - Continuous improvement tracking
        - Vendor management and selection
        
        **Typical Users:** Operations managers, HR for performance reviews, procurement for vendor evaluation
      `,
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Start date for performance analysis',
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'End date for performance analysis',
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
      name: 'assignedTo',
      required: false,
      type: String,
      description: 'Filter by assigned employee ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiQuery({
      name: 'includeEmployeeMetrics',
      required: false,
      type: Boolean,
      description: 'Include individual employee performance metrics',
      example: true,
    }),
    ApiQuery({
      name: 'includeVendorMetrics',
      required: false,
      type: Boolean,
      description: 'Include vendor performance comparison',
      example: true,
    }),
    ApiQuery({
      name: 'includeMTTR',
      required: false,
      type: Boolean,
      description: 'Include detailed MTTR analysis by type',
      example: true,
    }),
    ApiQuery({
      name: 'includeOnTimeMetrics',
      required: false,
      type: Boolean,
      description: 'Include on-time completion analysis',
      example: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Performance report generated successfully',
      type: MaintenancePerformanceResponseDto,
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
 * Swagger documentation for Preventive Maintenance Report endpoint
 *
 * Preventive maintenance planning and compliance tracking:
 * - Upcoming scheduled maintenance
 * - Overdue preventive maintenance
 * - Assets without preventive schedules
 * - Cost savings from preventive vs corrective
 *
 * Use Case: Proactive maintenance planning and cost reduction
 */
export function PreventiveMaintenanceDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get preventive maintenance schedule and analysis',
      description: `
        Strategic preventive maintenance planning and ROI analysis.
        
        **Core Metrics:**
        - Total preventive maintenance count
        - Completed preventive maintenance
        - Upcoming scheduled maintenance
        - Overdue preventive maintenance
        - Compliance rate (on-time preventive %)
        
        **Optional Features:**
        - Upcoming schedule: Next 30-90 days (configurable)
        - Overdue alerts: Past-due preventive maintenance
        - Unscheduled assets: Assets lacking preventive plans
        - Cost savings: Preventive vs corrective cost analysis
        
        **Business Strategy:**
        
        **Preventive Maintenance Benefits:**
        - Reduces emergency breakdowns
        - Lower overall maintenance costs
        - Extended asset lifespan
        - Improved safety and reliability
        - Better budget predictability
        
        **Cost Savings Calculation:**
        - Avg corrective cost typically 2-3x preventive cost
        - Each preventive action prevents multiple corrective repairs
        - ROI calculation: (Corrective Cost - Preventive Cost) / Preventive Cost
        
        **Compliance Rate (Target: >85%):**
        - High compliance = fewer breakdowns
        - Low compliance = reactive operations
        
        **Key Insights:**
        - High overdue count = scheduling issues or resource shortage
        - Unscheduled assets = coverage gaps
        - Cost ratio validates preventive strategy ROI
        
        **Action Items:**
        - Schedule overdue maintenance immediately
        - Create preventive plans for unscheduled assets
        - Adjust preventive frequency based on cost analysis
        - Allocate resources for upcoming maintenance
        
        **Typical Users:** Maintenance planners, asset managers, operations directors
      `,
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Start date for analysis period',
      example: '2024-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'End date for analysis period',
      example: '2024-12-31',
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
      name: 'assetId',
      required: false,
      type: String,
      description: 'Filter by specific asset',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiQuery({
      name: 'priority',
      required: false,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      description: 'Filter by priority level',
    }),
    ApiQuery({
      name: 'includeUpcoming',
      required: false,
      type: Boolean,
      description: 'Include upcoming scheduled preventive maintenance',
      example: true,
    }),
    ApiQuery({
      name: 'includeOverdue',
      required: false,
      type: Boolean,
      description: 'Include overdue preventive maintenance alerts',
      example: true,
    }),
    ApiQuery({
      name: 'includeUnscheduled',
      required: false,
      type: Boolean,
      description: 'Include assets without preventive maintenance schedule',
      example: true,
    }),
    ApiQuery({
      name: 'daysAhead',
      required: false,
      type: Number,
      description: 'Number of days to look ahead for upcoming maintenance',
      example: 30,
    }),
    ApiQuery({
      name: 'includeCostSavings',
      required: false,
      type: Boolean,
      description: 'Include cost savings analysis (preventive vs corrective)',
      example: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Preventive maintenance report generated successfully',
      type: PreventiveMaintenanceResponseDto,
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
