/**
 * Permission DTOs
 * Data Transfer Objects for Permission operations
 */

import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new permission
 */
export class CreatePermissionDto {
  @ApiProperty({
    description: 'Resource name (lowercase, alphanumeric with underscores)',
    example: 'users',
    pattern: '^[a-z0-9_]+$',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'Resource must be lowercase alphanumeric with underscores only',
  })
  resource: string;

  @ApiProperty({
    description: 'Action name (lowercase, alphanumeric with underscores)',
    example: 'create',
    pattern: '^[a-z0-9_]+$',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'Action must be lowercase alphanumeric with underscores only',
  })
  action: string;

  @ApiProperty({
    description: 'Description of what this permission allows',
    example: 'Allows creating new users',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description: string;
}

/**
 * DTO for creating multiple permissions at once (bulk creation)
 */
export class CreateBulkPermissionsDto {
  @ApiProperty({
    description: 'Array of permissions to create',
    type: [CreatePermissionDto],
  })
  permissions: CreatePermissionDto[];
}

/**
 * DTO for updating a permission
 * Note: Cannot update resource or action, only description
 */
export class UpdatePermissionDto {
  @ApiPropertyOptional({
    description: 'Updated description',
    example: 'Allows creating and inviting new users',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  @IsOptional()
  description?: string;
}

/**
 * Response DTO for permission
 */
export class PermissionResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'users' })
  resource: string;

  @ApiProperty({ example: 'create' })
  action: string;

  @ApiProperty({ example: 'users:create' })
  permission: string;

  @ApiProperty({ example: 'Allows creating new users' })
  description: string;

  @ApiProperty({ example: 'إنشاء مستخدمين جدد' })
  descriptionAr: string;

  @ApiProperty()
  createdAt: Date;
}

/**
 * Response DTO for paginated permissions list
 */
export class PaginatedPermissionsResponseDto {
  @ApiProperty({ type: [PermissionResponseDto] })
  data: PermissionResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

/**
 * Response DTO for resources list
 */
export class ResourcesResponseDto {
  @ApiProperty({
    example: ['users', 'roles', 'permissions', 'projects'],
    description: 'List of all unique resources in the system',
  })
  resources: string[];

  @ApiProperty({ example: 4 })
  count: number;
}

/**
 * Response DTO for actions of a specific resource
 */
export class ResourceActionsResponseDto {
  @ApiProperty({ example: 'users' })
  resource: string;

  @ApiProperty({
    example: ['create', 'read', 'update', 'delete', 'list'],
    description: 'List of all actions for this resource',
  })
  actions: string[];

  @ApiProperty({ example: 5 })
  count: number;
}
