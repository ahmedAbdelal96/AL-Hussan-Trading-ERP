import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

// ============================================================================
// COST CATEGORY SWAGGER DECORATORS
// ============================================================================

export function SwaggerCreateCostCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new cost category' }),
    ApiResponse({
      status: 201,
      description: 'Cost category created successfully',
    }),
    ApiResponse({ status: 400, description: 'Bad request - validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({
      status: 409,
      description: 'Conflict - category name already exists',
    }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetAllCostCategories() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all cost categories with filtering and pagination',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search by name or description',
    }),
    ApiQuery({
      name: 'parentId',
      required: false,
      description: 'Filter by parent category ID',
    }),
    ApiQuery({
      name: 'isActive',
      required: false,
      description: 'Filter by active status',
    }),
    ApiQuery({
      name: 'rootOnly',
      required: false,
      description: 'Show only root categories',
    }),
    ApiQuery({
      name: 'includeChildren',
      required: false,
      description: 'Include child categories',
    }),
    ApiQuery({ name: 'page', required: false, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, description: 'Items per page' }),
    ApiResponse({
      status: 200,
      description: 'Cost categories retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetCostCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a single cost category by ID' }),
    ApiParam({ name: 'id', description: 'Cost category UUID' }),
    ApiResponse({
      status: 200,
      description: 'Cost category retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Cost category not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerUpdateCostCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a cost category' }),
    ApiParam({ name: 'id', description: 'Cost category UUID' }),
    ApiResponse({
      status: 200,
      description: 'Cost category updated successfully',
    }),
    ApiResponse({ status: 400, description: 'Bad request - validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Cost category not found' }),
    ApiResponse({
      status: 409,
      description:
        'Conflict - category name already exists or circular reference',
    }),
    ApiBearerAuth(),
  );
}

export function SwaggerDeleteCostCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a cost category' }),
    ApiParam({ name: 'id', description: 'Cost category UUID' }),
    ApiResponse({
      status: 200,
      description: 'Cost category deleted successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Cost category not found' }),
    ApiResponse({
      status: 409,
      description: 'Conflict - category has associated costs or children',
    }),
    ApiBearerAuth(),
  );
}

// ============================================================================
// PROJECT COST SWAGGER DECORATORS
// ============================================================================

export function SwaggerCreateProjectCost() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new project cost entry' }),
    ApiResponse({
      status: 201,
      description: 'Project cost created successfully',
    }),
    ApiResponse({ status: 400, description: 'Bad request - validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Project or category not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetAllProjectCosts() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all project costs with filtering and pagination',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search by description or invoice number',
    }),
    ApiQuery({
      name: 'projectId',
      required: false,
      description: 'Filter by project ID',
    }),
    ApiQuery({
      name: 'categoryId',
      required: false,
      description: 'Filter by category ID',
    }),
    ApiQuery({
      name: 'costType',
      required: false,
      description: 'Filter by cost type',
    }),
    ApiQuery({
      name: 'paymentStatus',
      required: false,
      description: 'Filter by payment status',
    }),
    ApiQuery({
      name: 'dateFrom',
      required: false,
      description: 'Filter by date from',
    }),
    ApiQuery({
      name: 'dateTo',
      required: false,
      description: 'Filter by date to',
    }),
    ApiQuery({
      name: 'minAmount',
      required: false,
      description: 'Filter by minimum amount',
    }),
    ApiQuery({
      name: 'maxAmount',
      required: false,
      description: 'Filter by maximum amount',
    }),
    ApiQuery({ name: 'page', required: false, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, description: 'Items per page' }),
    ApiResponse({
      status: 200,
      description: 'Project costs retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetProjectCost() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a single project cost by ID' }),
    ApiParam({ name: 'id', description: 'Project cost UUID' }),
    ApiResponse({
      status: 200,
      description: 'Project cost retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Project cost not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerUpdateProjectCost() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a project cost' }),
    ApiParam({ name: 'id', description: 'Project cost UUID' }),
    ApiResponse({
      status: 200,
      description: 'Project cost updated successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation error or status restriction',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Project cost not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerDeleteProjectCost() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a project cost' }),
    ApiParam({ name: 'id', description: 'Project cost UUID' }),
    ApiResponse({
      status: 200,
      description: 'Project cost deleted successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Project cost not found' }),
    ApiResponse({
      status: 409,
      description: 'Conflict - cannot delete approved or paid cost',
    }),
    ApiBearerAuth(),
  );
}

export function SwaggerApproveProjectCost() {
  return applyDecorators(
    ApiOperation({ summary: 'Approve a pending project cost' }),
    ApiParam({ name: 'id', description: 'Project cost UUID' }),
    ApiResponse({
      status: 200,
      description: 'Project cost approved successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - only pending costs can be approved',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Project cost not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerRejectProjectCost() {
  return applyDecorators(
    ApiOperation({ summary: 'Reject a pending project cost' }),
    ApiParam({ name: 'id', description: 'Project cost UUID' }),
    ApiResponse({
      status: 200,
      description: 'Project cost rejected successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - only pending costs can be rejected',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Project cost not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetProjectCostSummary() {
  return applyDecorators(
    ApiOperation({ summary: 'Get cost summary/statistics for a project' }),
    ApiParam({ name: 'projectId', description: 'Project UUID' }),
    ApiResponse({
      status: 200,
      description: 'Project cost summary retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiBearerAuth(),
  );
}

// ============================================================================
// COST ALLOCATION SWAGGER DECORATORS
// ============================================================================

export function SwaggerGetCostAllocations() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get allocations for an allocated cost',
      description:
        'Returns allocation breakdown showing how the cost is distributed across multiple projects. ' +
        'Includes validation status to verify allocations sum to 100%.',
    }),
    ApiParam({ name: 'id', description: 'Cost UUID' }),
    ApiResponse({
      status: 200,
      description: 'Cost allocations retrieved successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - cost is not allocated',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Cost not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerUpdateCostAllocations() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update allocations for an allocated cost',
      description:
        'Updates cost distribution across projects. Uses full replacement strategy: ' +
        'deletes all existing allocations and creates new ones. ' +
        'Requires minimum 2 projects. Sum must equal 100% or total cost amount.',
    }),
    ApiParam({ name: 'id', description: 'Cost UUID' }),
    ApiResponse({
      status: 200,
      description: 'Cost allocations updated successfully',
    }),
    ApiResponse({
      status: 400,
      description:
        'Bad request - validation failed, cost not allocated, or cost is paid',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Cost or project not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerConvertCostToAllocated() {
  return applyDecorators(
    ApiOperation({
      summary: 'Convert regular cost to allocated cost',
      description:
        'Converts a single-project cost or general expense to an allocated cost ' +
        'distributed across multiple projects. Cannot convert paid costs.',
    }),
    ApiParam({ name: 'id', description: 'Cost UUID' }),
    ApiResponse({
      status: 200,
      description: 'Cost converted to allocated successfully',
    }),
    ApiResponse({
      status: 400,
      description:
        'Bad request - validation failed, cost already allocated, or cost is paid',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Cost or project not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerDeleteCostAllocations() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete allocations and convert to regular cost',
      description:
        'Removes all allocations from an allocated cost and converts it back to either ' +
        'a single-project cost (if projectId provided) or general expense (if no projectId). ' +
        'Cannot delete allocations from paid costs.',
    }),
    ApiParam({ name: 'id', description: 'Cost UUID' }),
    ApiQuery({
      name: 'projectId',
      required: false,
      description:
        'Project ID to assign cost to (converts to single-project cost). ' +
        'If omitted, converts to general expense.',
    }),
    ApiResponse({
      status: 200,
      description: 'Cost allocations deleted and cost converted successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - cost not allocated or cost is paid',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Cost or project not found' }),
    ApiBearerAuth(),
  );
}
