import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  MaintenanceRequestResponseDto,
  MaintenanceStatisticsDto,
} from '../dto';

/**
 * Swagger decorator for Create Maintenance Request endpoint
 */
export function SwaggerCreateMaintenanceRequest() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create new maintenance request',
      description:
        'Create a new maintenance request for an asset. Optionally link to a project for cost tracking.',
    }),
    ApiResponse({
      status: 201,
      description: 'Maintenance request created successfully',
      type: MaintenanceRequestResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Bad request - validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Asset or Project not found' }),
    ApiBearerAuth(),
  );
}

/**
 * Swagger decorator for Get All Maintenance Requests endpoint
 */
export function SwaggerGetAllMaintenanceRequests() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all maintenance requests',
      description:
        'Get paginated list of maintenance requests with optional filters',
    }),
    ApiQuery({
      name: 'assetId',
      required: false,
      description: 'Filter by asset ID',
    }),
    ApiQuery({
      name: 'projectId',
      required: false,
      description: 'Filter by project ID',
    }),
    ApiQuery({
      name: 'maintenanceType',
      required: false,
      enum: ['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'SCHEDULED'],
    }),
    ApiQuery({
      name: 'priority',
      required: false,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
    }),
    ApiQuery({
      name: 'assignedTo',
      required: false,
      description: 'Filter by assigned user ID',
    }),
    ApiQuery({
      name: 'scheduledDateFrom',
      required: false,
      description: 'Filter by scheduled date from (ISO 8601)',
    }),
    ApiQuery({
      name: 'scheduledDateTo',
      required: false,
      description: 'Filter by scheduled date to (ISO 8601)',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default: 1)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (default: 10)',
    }),
    ApiResponse({
      status: 200,
      description: 'List of maintenance requests',
      schema: {
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/MaintenanceRequestResponseDto',
            },
          },
          total: { type: 'number', example: 100 },
          page: { type: 'number', example: 1 },
          limit: { type: 'number', example: 10 },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiBearerAuth(),
  );
}

/**
 * Swagger decorator for Get Maintenance Request by ID endpoint
 */
export function SwaggerGetMaintenanceRequest() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get maintenance request by ID',
      description:
        'Get detailed information about a specific maintenance request including attachments',
    }),
    ApiParam({
      name: 'id',
      description: 'Maintenance request ID',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Maintenance request details',
      type: MaintenanceRequestResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Maintenance request not found' }),
    ApiBearerAuth(),
  );
}

/**
 * Swagger decorator for Update Maintenance Request endpoint
 */
export function SwaggerUpdateMaintenanceRequest() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update maintenance request',
      description:
        'Update an existing maintenance request. Can update status, costs, work performed, etc.',
    }),
    ApiParam({
      name: 'id',
      description: 'Maintenance request ID',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Maintenance request updated successfully',
      type: MaintenanceRequestResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Bad request - validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Maintenance request not found' }),
    ApiBearerAuth(),
  );
}

/**
 * Swagger decorator for Delete Maintenance Request endpoint
 */
export function SwaggerDeleteMaintenanceRequest() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete maintenance request',
      description:
        'Delete a maintenance request. This action cannot be undone.',
    }),
    ApiParam({
      name: 'id',
      description: 'Maintenance request ID',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Maintenance request deleted successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - insufficient permissions',
    }),
    ApiResponse({ status: 404, description: 'Maintenance request not found' }),
    ApiBearerAuth(),
  );
}

/**
 * Swagger decorator for Get Maintenance Statistics endpoint
 */
export function SwaggerGetMaintenanceStatistics() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get maintenance statistics',
      description:
        'Get comprehensive maintenance statistics including KPIs, breakdowns, trends, and analysis. ' +
        'Provides insights into maintenance performance, costs, resolution times, and asset health.',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Start date for filtering (ISO 8601 format)',
      example: '2024-01-01T00:00:00Z',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'End date for filtering (ISO 8601 format)',
      example: '2024-12-31T23:59:59Z',
    }),
    ApiQuery({
      name: 'projectId',
      required: false,
      type: String,
      description: 'Filter by specific project ID',
    }),
    ApiQuery({
      name: 'assetId',
      required: false,
      type: String,
      description: 'Filter by specific asset ID',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
      description: 'Filter by maintenance status',
    }),
    ApiQuery({
      name: 'type',
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
    ApiResponse({
      status: 200,
      description: 'Maintenance statistics retrieved successfully',
      type: MaintenanceStatisticsDto,
      schema: {
        example: {
          totalRequests: 127,
          pendingRequests: 15,
          inProgressRequests: 8,
          onHoldRequests: 3,
          completedRequests: 95,
          cancelledRequests: 6,
          completionRate: 74.8,
          averageResolutionDays: 4.5,
          totalCost: 456789.5,
          averageCostPerRequest: 3596.77,
          highPriorityRequests: 22,
          overdueRequests: 5,
          statusBreakdown: [
            {
              status: 'COMPLETED',
              count: 95,
              percentage: 74.8,
              totalCost: 341592.5,
              averageCost: 3595.71,
            },
          ],
          typeBreakdown: [],
          priorityBreakdown: [],
          assetTypeBreakdown: [],
          monthlyTrend: [],
          topAssetsByMaintenance: [],
          costByType: [],
          resolutionTimeByStatus: [],
          generatedAt: '2024-03-20T10:30:00Z',
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - insufficient permissions',
    }),
    ApiBearerAuth(),
  );
}
