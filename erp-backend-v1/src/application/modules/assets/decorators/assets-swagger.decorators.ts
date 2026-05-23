/**
 * Assets Swagger Decorators
 * Centralized Swagger documentation for all asset endpoints
 */

import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  AssetResponseDto,
  AssetListResponseDto,
  MessageResponseDto,
  AssetsStatisticsDto,
} from '../dto';

export function SwaggerCreateAsset() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create new asset',
      description: 'Creates a new asset with auto-generated asset number',
    }),
    ApiResponse({
      status: 201,
      description: 'Asset created successfully',
      type: AssetResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Bad request - validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({
      status: 409,
      description: 'Conflict - asset already exists',
    }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetAsset() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get asset by ID',
      description: 'Retrieves detailed information about a specific asset',
    }),
    ApiResponse({
      status: 200,
      description: 'Asset found',
      type: AssetResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Asset not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetAllAssets() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all assets',
      description: 'Retrieves paginated list of assets with optional filters',
    }),
    ApiResponse({
      status: 200,
      description: 'Assets retrieved successfully',
      type: AssetListResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiBearerAuth(),
  );
}

export function SwaggerUpdateAsset() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update asset',
      description: 'Updates asset information (partial update supported)',
    }),
    ApiResponse({
      status: 200,
      description: 'Asset updated successfully',
      type: AssetResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Asset not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerDeleteAsset() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete asset (soft delete)',
      description: 'Soft deletes an asset (sets deletedAt timestamp)',
    }),
    ApiResponse({
      status: 200,
      description: 'Asset deleted successfully',
      type: MessageResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - asset cannot be deleted',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Asset not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerAssignEmployeeToAsset() {
  return applyDecorators(
    ApiOperation({
      summary: 'Assign employee to asset',
      description: 'Assigns an employee to an asset with specified role',
    }),
    ApiResponse({ status: 201, description: 'Employee assigned successfully' }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Asset not found' }),
    ApiResponse({ status: 409, description: 'Employee already assigned' }),
    ApiBearerAuth(),
  );
}

export function SwaggerAssignAssetToProject() {
  return applyDecorators(
    ApiOperation({
      summary: 'Assign asset to project',
      description: 'Assigns an asset to a project (one project at a time)',
    }),
    ApiResponse({
      status: 201,
      description: 'Asset assigned to project successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - asset not available or already assigned',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Asset not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerCreateMaintenanceRequest() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create maintenance request',
      description: 'Creates a maintenance request for an asset',
    }),
    ApiResponse({
      status: 201,
      description: 'Maintenance request created successfully',
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Asset not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetAssetsStatistics() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get comprehensive asset statistics',
      description:
        'Retrieve detailed analytics including asset inventory, valuation, status distribution, type breakdown, location tracking, age analysis, manufacturer distribution, and monthly acquisition trends. Supports optional filtering by date range, asset type, status, and location.',
    }),
    ApiResponse({
      status: 200,
      description: 'Asset statistics retrieved successfully',
      type: AssetsStatisticsDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
    ApiResponse({
      status: 403,
      description:
        'Forbidden - Insufficient permissions to view asset statistics',
    }),
    ApiBearerAuth(),
  );
}
