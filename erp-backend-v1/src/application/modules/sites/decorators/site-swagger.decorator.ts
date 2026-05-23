import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  SiteResponseDto,
  SitesPaginatedResponseDto,
  CreateSiteDto,
  UpdateSiteDto,
  BulkCreateSitesDto,
} from '../dto';

export function ApiCreateSite() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create new site',
      description:
        'Creates a new construction site with auto-generated code (SITE-XXXX) if not provided',
    }),
    ApiBody({ type: CreateSiteDto }),
    ApiResponse({
      status: 201,
      description: 'Site created successfully',
      type: SiteResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Invalid input data' }),
    ApiResponse({ status: 409, description: 'Site code already exists' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiGetAllSites() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all sites',
      description: 'Retrieve paginated list of sites with optional filters',
    }),
    ApiQuery({ name: 'page', required: false, example: 1 }),
    ApiQuery({ name: 'pageSize', required: false, example: 10 }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search by name, code, address, or city',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['ACTIVE', 'INACTIVE', 'UNDER_PREPARATION', 'CLOSED'],
    }),
    ApiQuery({ name: 'city', required: false }),
    ApiQuery({ name: 'state', required: false }),
    ApiQuery({ name: 'country', required: false }),
    ApiQuery({ name: 'code', required: false }),
    ApiResponse({
      status: 200,
      description: 'Sites retrieved successfully',
      type: SitesPaginatedResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiGetSite() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get site by ID',
      description: 'Retrieve detailed information about a specific site',
    }),
    ApiParam({ name: 'id', description: 'Site ID' }),
    ApiResponse({
      status: 200,
      description: 'Site retrieved successfully',
      type: SiteResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Site not found' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiUpdateSite() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update site',
      description: 'Update site information by ID',
    }),
    ApiParam({ name: 'id', description: 'Site ID' }),
    ApiBody({ type: UpdateSiteDto }),
    ApiResponse({
      status: 200,
      description: 'Site updated successfully',
      type: SiteResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Invalid input data' }),
    ApiResponse({ status: 404, description: 'Site not found' }),
    ApiResponse({ status: 409, description: 'Site code already exists' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiDeleteSite() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete site',
      description: 'Soft delete a site by ID',
    }),
    ApiParam({ name: 'id', description: 'Site ID' }),
    ApiResponse({
      status: 200,
      description: 'Site deleted successfully',
    }),
    ApiResponse({ status: 404, description: 'Site not found' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiBulkCreateSites() {
  return applyDecorators(
    ApiOperation({
      summary: 'Bulk create sites',
      description: 'Create multiple sites at once with auto-generated codes',
    }),
    ApiBody({ type: BulkCreateSitesDto }),
    ApiResponse({
      status: 201,
      description: 'Sites created successfully',
      type: [SiteResponseDto],
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid input data or duplicates in batch',
    }),
    ApiResponse({ status: 409, description: 'Site code already exists' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
