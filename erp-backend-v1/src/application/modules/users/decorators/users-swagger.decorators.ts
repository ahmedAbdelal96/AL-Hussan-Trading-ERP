import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import {
  UserResponseDto,
  UsersPaginatedResponseDto,
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordDto,
  BulkCreateUsersDto,
} from '../dto';

export function SwaggerCreateUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Create new user (SUPERADMIN only)' }),
    ApiBody({ type: CreateUserDto }),
    ApiResponse({
      status: 201,
      description: 'User created successfully',
      type: UserResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Requires SUPERADMIN role',
    }),
    ApiResponse({ status: 409, description: 'Email already exists' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetAllUsers() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all users with pagination and filters' }),
    ApiResponse({
      status: 200,
      description: 'Users retrieved successfully',
      type: UsersPaginatedResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Get user by ID' }),
    ApiParam({ name: 'id', description: 'User ID (UUID)' }),
    ApiResponse({
      status: 200,
      description: 'User retrieved successfully',
      type: UserResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiResponse({ status: 404, description: 'User not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerUpdateUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Update user information' }),
    ApiParam({ name: 'id', description: 'User ID (UUID)' }),
    ApiBody({ type: UpdateUserDto }),
    ApiResponse({
      status: 200,
      description: 'User updated successfully',
      type: UserResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Cannot deactivate own account',
    }),
    ApiResponse({ status: 404, description: 'User not found' }),
    ApiResponse({ status: 409, description: 'Email already exists' }),
    ApiBearerAuth(),
  );
}

export function SwaggerDeleteUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete user (soft delete)' }),
    ApiParam({ name: 'id', description: 'User ID (UUID)' }),
    ApiResponse({ status: 200, description: 'User deleted successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Cannot delete own account or SUPERADMIN',
    }),
    ApiResponse({ status: 404, description: 'User not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerResetPassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Reset user password (SUPERADMIN only)' }),
    ApiParam({ name: 'id', description: 'User ID (UUID)' }),
    ApiBody({ type: ResetPasswordDto }),
    ApiResponse({ status: 200, description: 'Password reset successfully' }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Requires SUPERADMIN role',
    }),
    ApiResponse({ status: 404, description: 'User not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerBulkCreateUsers() {
  return applyDecorators(
    ApiOperation({ summary: 'Bulk create users (SUPERADMIN only)' }),
    ApiBody({ type: BulkCreateUsersDto }),
    ApiResponse({
      status: 201,
      description: 'Bulk create completed (returns success/failed lists)',
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Requires SUPERADMIN role',
    }),
    ApiBearerAuth(),
  );
}
