/**
 * Common DTOs
 * Shared DTOs across RBAC module
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard success message response
 */
export class MessageResponseDto {
  @ApiProperty({
    example: 'Operation completed successfully',
  })
  message: string;
}

/**
 * Response DTO for permission check
 */
export class PermissionCheckResponseDto {
  @ApiProperty({ example: true })
  hasPermission: boolean;

  @ApiProperty({ example: 'users:create' })
  permission: string;

  @ApiProperty({ example: 'user-uuid' })
  userId: string;
}

/**
 * Response DTO for role check
 */
export class RoleCheckResponseDto {
  @ApiProperty({ example: true })
  hasRole: boolean;

  @ApiProperty({ example: 'project_manager' })
  role: string;

  @ApiProperty({ example: 'user-uuid' })
  userId: string;
}
