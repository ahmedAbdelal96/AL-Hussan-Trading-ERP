import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  EmployeeResponseDto,
  EmployeesPaginatedResponseDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  BulkCreateEmployeesDto,
  EmployeesStatisticsDto,
} from '../dto';

export function ApiCreateEmployee() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create new employee',
      description:
        'Creates a new employee with auto-generated employee number (EMP-YYYY-XXXX)',
    }),
    ApiBody({ type: CreateEmployeeDto }),
    ApiResponse({
      status: 201,
      description: 'Employee created successfully',
      type: EmployeeResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Invalid input data' }),
    ApiResponse({
      status: 409,
      description: 'National ID or Email already exists',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiGetAllEmployees() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all employees',
      description: 'Retrieve paginated list of employees with optional filters',
    }),
    ApiQuery({ name: 'page', required: false, example: 1 }),
    ApiQuery({ name: 'pageSize', required: false, example: 10 }),
    ApiQuery({
      name: 'search',
      required: false,
      description:
        'Search by name, employee number, national ID, email, or phone',
    }),
    ApiQuery({
      name: 'employmentType',
      required: false,
      enum: ['PERMANENT', 'CONTRACT', 'FREELANCE', 'PART_TIME'],
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'],
    }),
    ApiQuery({ name: 'department', required: false }),
    ApiQuery({ name: 'position', required: false }),
    ApiQuery({ name: 'nationality', required: false }),
    ApiQuery({ name: 'country', required: false }),
    ApiResponse({
      status: 200,
      description: 'Employees retrieved successfully',
      type: EmployeesPaginatedResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiGetEmployee() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get employee by ID',
      description: 'Retrieve detailed information about a specific employee',
    }),
    ApiParam({ name: 'id', description: 'Employee ID' }),
    ApiResponse({
      status: 200,
      description: 'Employee retrieved successfully',
      type: EmployeeResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Employee not found' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiUpdateEmployee() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update employee',
      description: 'Update employee information by ID',
    }),
    ApiParam({ name: 'id', description: 'Employee ID' }),
    ApiBody({ type: UpdateEmployeeDto }),
    ApiResponse({
      status: 200,
      description: 'Employee updated successfully',
      type: EmployeeResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Invalid input data' }),
    ApiResponse({ status: 404, description: 'Employee not found' }),
    ApiResponse({
      status: 409,
      description: 'National ID or Email already exists',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiDeleteEmployee() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete employee',
      description: 'Soft delete an employee by ID',
    }),
    ApiParam({ name: 'id', description: 'Employee ID' }),
    ApiResponse({
      status: 200,
      description: 'Employee deleted successfully',
    }),
    ApiResponse({ status: 404, description: 'Employee not found' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiBulkCreateEmployees() {
  return applyDecorators(
    ApiOperation({
      summary: 'Bulk create employees',
      description:
        'Create multiple employees at once with auto-generated employee numbers',
    }),
    ApiBody({ type: BulkCreateEmployeesDto }),
    ApiResponse({
      status: 201,
      description: 'Employees created successfully',
      type: [EmployeeResponseDto],
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid input data or duplicates in batch',
    }),
    ApiResponse({
      status: 409,
      description: 'National ID or Email already exists',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiGetEmployeesStatistics() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get comprehensive employee statistics',
      description:
        'Retrieve detailed analytics including workforce metrics, demographics, employment type distribution, department breakdown, hiring trends, and more',
    }),
    ApiResponse({
      status: 200,
      description: 'Employee statistics retrieved successfully',
      type: EmployeesStatisticsDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
    }),
  );
}
