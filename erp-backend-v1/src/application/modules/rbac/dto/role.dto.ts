/**
 * Role DTOs
 * Data Transfer Objects for Role operations
 */

import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionResponseDto } from './permission.dto';

/**
 * DTO for creating a new role
 */
export class CreateRoleDto {
  @ApiProperty({
    description: 'Role name',
    example: 'Project Manager',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Role slug (URL-safe, lowercase, hyphens and underscores)',
    example: 'project_manager',
    pattern: '^[a-z0-9_-]+$',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9_-]+$/, {
    message:
      'Slug must be lowercase alphanumeric with hyphens and underscores only',
  })
  slug: string;

  @ApiProperty({
    description: 'Description of what this role represents',
    example: 'Can manage projects, assign tasks, and view reports',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({
    description: 'Whether the role is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Array of permission IDs to assign to this role',
    type: [String],
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  permissionIds?: string[];
}

/**
 * DTO for updating a role
 * Note: Cannot update slug or isSystemRole? for system roles
 */
export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: 'Updated role name (not allowed for system roles)',
    example: 'Senior Project Manager',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated role slug (not allowed for system roles)',
    example: 'senior_project_manager',
    pattern: '^[a-z0-9_-]+$',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9_-]+$/, {
    message:
      'Slug must be lowercase alphanumeric with hyphens and underscores only',
  })
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Updated description',
    example: 'Can manage multiple projects and mentor junior managers',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the role is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO for assigning permissions to a role
 */
export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Array of permission IDs to assign',
    type: [String],
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one permission ID is required' })
  @IsUUID('4', { each: true })
  permissionIds: string[];
}

/**
 * DTO for removing permissions from a role
 */
export class RemovePermissionsDto {
  @ApiProperty({
    description: 'Array of permission IDs to remove',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one permission ID is required' })
  @IsUUID('4', { each: true })
  permissionIds: string[];
}

/**
 * DTO for replacing all role permissions at once
 */
export class ReplacePermissionsDto {
  @ApiProperty({
    description: 'Array of permission IDs (replaces all existing permissions)',
    type: [String],
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}

/**
 * Response DTO for role (summary without permissions)
 */
export class RoleSummaryResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'Project Manager' })
  name: string;

  @ApiProperty({ example: 'project_manager' })
  slug: string;

  @ApiProperty({ example: 'Can manage projects and assign tasks' })
  description: string;

  @ApiProperty({ example: false })
  isSystemRole: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 15 })
  permissionCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Response DTO for role (with full permissions)
 */
export class RoleResponseDto extends RoleSummaryResponseDto {
  @ApiProperty({ type: [PermissionResponseDto] })
  permissions: PermissionResponseDto[];
}

/**
 * Response DTO for paginated roles list
 */
export class PaginatedRolesResponseDto {
  @ApiProperty({ type: [RoleSummaryResponseDto] })
  data: RoleSummaryResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}
