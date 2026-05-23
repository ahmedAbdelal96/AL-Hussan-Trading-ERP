/**
 * Auth Module Swagger Decorators
 * Centralized API documentation decorators for Auth endpoints
 */

import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import {
  LoginDto,
  ChangePasswordDto,
  ResetUserPasswordDto,
  RefreshTokenDto,
  LoginResponseDto,
  UserInfoDto,
  TokensDto,
  MessageResponseDto,
} from '../dto';

/**
 * Swagger decorator for Login endpoint
 */
export function ApiLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'User login',
      description:
        'Authenticate user with email and password. Returns access and refresh tokens.',
    }),
    ApiBody({ type: LoginDto }),
    ApiResponse({
      status: 200,
      description: 'Login successful',
      type: LoginResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid credentials or inactive account',
      schema: {
        example: {
          statusCode: 401,
          message: 'Invalid email or password',
          error: 'Unauthorized',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      schema: {
        example: {
          statusCode: 400,
          message: ['email must be a valid email', 'password is required'],
          error: 'Bad Request',
        },
      },
    }),
  );
}

/**
 * Swagger decorator for Refresh Token endpoint
 */
export function ApiRefreshTokens() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refresh access token',
      description:
        'Generate new access and refresh tokens using a valid refresh token. Old refresh token will be revoked.',
    }),
    ApiBody({ type: RefreshTokenDto }),
    ApiResponse({
      status: 200,
      description: 'Tokens refreshed successfully',
      type: TokensDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid or expired refresh token',
      schema: {
        example: {
          statusCode: 401,
          message: 'Invalid or expired refresh token',
          error: 'Unauthorized',
        },
      },
    }),
  );
}

/**
 * Swagger decorator for Logout endpoint
 */
export function ApiLogout() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'User logout',
      description:
        'Logout user and revoke refresh token. Access token will remain valid until expiration.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          refreshToken: {
            type: 'string',
            description: 'Refresh token to revoke (optional)',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      required: false,
    }),
    ApiResponse({
      status: 200,
      description: 'Logout successful',
      type: MessageResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing access token',
    }),
  );
}

/**
 * Swagger decorator for Get Current User endpoint
 */
export function ApiGetCurrentUser() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get current user',
      description: 'Retrieve authenticated user information including roles.',
    }),
    ApiResponse({
      status: 200,
      description: 'User information retrieved successfully',
      type: UserInfoDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing access token',
    }),
  );
}

/**
 * Swagger decorator for Change Password endpoint
 */
export function ApiChangePassword() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Change password',
      description:
        'Change user password. Requires current password. All refresh tokens will be revoked after password change.',
    }),
    ApiBody({ type: ChangePasswordDto }),
    ApiResponse({
      status: 200,
      description: 'Password changed successfully',
      type: MessageResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error or password requirements not met',
      schema: {
        example: {
          statusCode: 400,
          message: 'Password does not meet security requirements',
          errors: [
            'Password must contain at least one uppercase letter',
            'Password must contain at least one number',
          ],
          error: 'Bad Request',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Current password is incorrect',
      schema: {
        example: {
          statusCode: 401,
          message: 'Current password is incorrect',
          error: 'Unauthorized',
        },
      },
    }),
  );
}

/**
 * Swagger decorator for Reset User Password endpoint (Admin Only)
 */
export function ApiResetUserPassword() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Reset user password (ADMIN/SUPERADMIN only)',
      description:
        'Allows Admin or SuperAdmin to reset any user password without knowing current password. ADMIN cannot reset SUPERADMIN passwords. All user tokens will be revoked.',
    }),
    ApiBody({ type: ResetUserPasswordDto }),
    ApiResponse({
      status: 200,
      description: 'Password reset successfully',
      type: MessageResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error or password requirements not met',
      schema: {
        example: {
          statusCode: 400,
          message: 'Password does not meet security requirements',
          errors: [
            'Password must contain at least one uppercase letter',
            'Password must contain at least one number',
          ],
          error: 'Bad Request',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Only ADMIN/SUPERADMIN can reset passwords',
    }),
    ApiResponse({
      status: 404,
      description: 'Target user not found',
    }),
  );
}

/**
 * Swagger decorator for Unlock Account endpoint
 */
export function ApiUnlockAccount() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Unlock user account (SUPERADMIN only)',
      description:
        'Unlocks a permanently or temporarily locked user account. Only SUPERADMIN role can perform this action.',
    }),
    ApiResponse({
      status: 200,
      description: 'Account unlocked successfully',
      type: MessageResponseDto,
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Only SUPERADMIN can unlock accounts',
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
    }),
  );
}

/**
 * Swagger decorator for Get Active Sessions endpoint
 */
export function ApiGetActiveSessions() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get active user sessions (ADMIN/SUPERADMIN)',
      description:
        'Retrieves all users with active sessions, including device information. Only ADMIN or SUPERADMIN can access this.',
    }),
    ApiResponse({
      status: 200,
      description: 'Active sessions retrieved successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            email: { type: 'string' },
            fullName: { type: 'string' },
            role: { type: 'string' },
            activeSessions: { type: 'number' },
            lastActivity: { type: 'string', format: 'date-time' },
            devices: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  userAgent: { type: 'string' },
                  ipAddress: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Only ADMIN/SUPERADMIN can view sessions',
    }),
  );
}

/**
 * Swagger decorator for Force Logout User endpoint
 */
export function ApiForceLogoutUser() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Force logout specific user (ADMIN/SUPERADMIN)',
      description:
        'Revokes all refresh tokens for a specific user, forcing them to re-authenticate on all devices. ADMIN cannot logout SUPERADMIN.',
    }),
    ApiResponse({
      status: 200,
      description: 'User force logged out successfully',
      type: MessageResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid user ID or cannot logout yourself',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
    }),
  );
}

/**
 * Swagger decorator for Force Logout All Users endpoint
 */
export function ApiForceLogoutAll() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Force logout ALL users (SUPERADMIN only)',
      description:
        '⚠️ CRITICAL: Revokes ALL refresh tokens in the system, forcing every user to re-authenticate. Only SUPERADMIN can execute this emergency action.',
    }),
    ApiResponse({
      status: 200,
      description: 'All users force logged out successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          affectedUsers: { type: 'number' },
          affectedSessions: { type: 'number' },
          executedBy: { type: 'string' },
          executedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Only SUPERADMIN can force logout all users',
    }),
  );
}
