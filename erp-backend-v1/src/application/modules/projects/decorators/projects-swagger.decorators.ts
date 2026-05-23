/**
 * Projects Swagger Decorators
 * API documentation decorators for project endpoints
 */

import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  ProjectResponseDto,
  ProjectsPaginatedResponseDto,
  MessageResponseDto,
  ProjectsStatisticsDto,
} from '../dto';

export function SwaggerCreateProject() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new project' }),
    ApiResponse({
      status: 201,
      description: 'Project created successfully',
      type: ProjectResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation failed',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({
      status: 409,
      description: 'Conflict - tender number already exists',
    }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetProject() {
  return applyDecorators(
    ApiOperation({ summary: 'Get project by ID' }),
    ApiParam({ name: 'id', description: 'Project ID', type: String }),
    ApiResponse({
      status: 200,
      description: 'Project retrieved successfully',
      type: ProjectResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Project not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetAllProjects() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all projects with filters and pagination' }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 5 }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: [
        'DRAFT',
        'PLANNING',
        'ACTIVE',
        'ON_HOLD',
        'COMPLETED',
        'CANCELLED',
        'ARCHIVED',
      ],
    }),
    ApiQuery({ name: 'siteId', required: false, type: String }),
    ApiQuery({ name: 'managerId', required: false, type: String }),
    ApiQuery({ name: 'clientName', required: false, type: String }),
    ApiResponse({
      status: 200,
      description: 'Projects retrieved successfully',
      type: ProjectsPaginatedResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiBearerAuth(),
  );
}

export function SwaggerUpdateProject() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an existing project' }),
    ApiParam({ name: 'id', description: 'Project ID', type: String }),
    ApiResponse({
      status: 200,
      description: 'Project updated successfully',
      type: ProjectResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation failed',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Project not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerDeleteProject() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a project (soft delete)' }),
    ApiParam({ name: 'id', description: 'Project ID', type: String }),
    ApiResponse({
      status: 200,
      description: 'Project deleted successfully',
      type: MessageResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - insufficient permissions',
    }),
    ApiResponse({ status: 404, description: 'Project not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerUpdateProgress() {
  return applyDecorators(
    ApiOperation({ summary: 'Update project progress' }),
    ApiParam({ name: 'id', description: 'Project ID', type: String }),
    ApiResponse({
      status: 200,
      description: 'Progress updated successfully',
      type: ProjectResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation failed',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Project not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetProjectMedia() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all media for a project' }),
    ApiParam({ name: 'id', description: 'Project ID', type: String }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 50 }),
    ApiQuery({
      name: 'category',
      required: false,
      enum: [
        'PROGRESS_PHOTO',
        'PLAN',
        'REPORT',
        'INVOICE',
        'CONTRACT',
        'CERTIFICATE',
        'OTHER',
      ],
    }),
    ApiResponse({
      status: 200,
      description: 'Media retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProjectMediaResponseDto' },
          },
          total: { type: 'number' },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Project not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetProjectsStatistics() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get projects statistics',
      description:
        'Get comprehensive projects statistics including KPIs, breakdowns, trends, and analysis. ' +
        'Returns 14 overview metrics and 8 detailed breakdowns.',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      type: String,
      description: 'Filter by start date (YYYY-MM-DD)',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      type: String,
      description: 'Filter by end date (YYYY-MM-DD)',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: [
        'DRAFT',
        'PLANNING',
        'ACTIVE',
        'ON_HOLD',
        'COMPLETED',
        'CANCELLED',
        'ARCHIVED',
      ],
      description: 'Filter by project status',
    }),
    ApiQuery({
      name: 'siteId',
      required: false,
      type: String,
      description: 'Filter by site ID',
    }),
    ApiQuery({
      name: 'managerId',
      required: false,
      type: String,
      description: 'Filter by manager ID',
    }),
    ApiResponse({
      status: 200,
      description: 'Statistics retrieved successfully',
      type: ProjectsStatisticsDto,
    }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiBearerAuth(),
  );
}
