/**
 * User Custom Permission DTOs
 * Data Transfer Objects for granting/revoking custom permissions to/from users
 */

import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionType } from '../entities';

/**
 * DTO for granting a custom permission to a user
 */
export class GrantPermissionDto {
  @ApiProperty({
    description: 'User ID to grant the permission to',
    example: 'user-uuid-here',
  })
  @IsUUID('4')
  userId: string;

  @ApiProperty({
    description: 'Permission ID to grant',
    example: 'permission-uuid-here',
  })
  @IsUUID('4')
  permissionId: string;

  @ApiPropertyOptional({
    description: 'Reason for granting this permission (for audit purposes)',
    example: 'Needs temporary access during vacation coverage',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description:
      'Expiration date for temporary permission grant (ISO 8601 format)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

/**
 * DTO for revoking a custom permission from a user
 */
export class RevokePermissionDto {
  @ApiProperty({
    description: 'User ID to revoke the permission from',
    example: 'user-uuid-here',
  })
  @IsUUID('4')
  userId: string;

  @ApiProperty({
    description: 'Permission ID to revoke',
    example: 'permission-uuid-here',
  })
  @IsUUID('4')
  permissionId: string;

  @ApiPropertyOptional({
    description: 'Reason for revoking this permission (for audit purposes)',
    example: 'No longer needs access to this module',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Expiration date for temporary revocation (ISO 8601 format)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

/**
 * DTO for removing a custom permission (both GRANT and REVOKE)
 */
export class RemoveCustomPermissionDto {
  @ApiProperty({
    description: 'User custom permission ID to remove',
    example: 'user-permission-uuid-here',
  })
  @IsUUID('4')
  customPermissionId: string;
}

/**
 * Response DTO for user custom permission
 */
export class UserCustomPermissionResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'user-uuid' })
  userId: string;

  @ApiProperty({ example: 'permission-uuid' })
  permissionId: string;

  @ApiProperty({
    example: {
      id: 'permission-uuid',
      resource: 'users',
      action: 'delete',
      permission: 'users:delete',
      description: 'Allows deleting users',
      descriptionAr: 'حذف المستخدمين',
    },
  })
  permission: {
    id: string;
    resource: string;
    action: string;
    permission: string;
    description: string;
    descriptionAr: string;
  };

  @ApiProperty({ enum: PermissionType, example: PermissionType.GRANT })
  permissionType: PermissionType;

  @ApiProperty({ example: 'superadmin-uuid' })
  grantedBy: string;

  @ApiProperty()
  grantedAt: Date;

  @ApiProperty({ nullable: true })
  expiresAt: Date | null;

  @ApiProperty({ example: true })
  isPermanent: boolean;

  @ApiProperty({ example: false })
  isExpired: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 30, nullable: true })
  remainingDays: number | null;
}

/**
 * Response DTO for user's custom permissions list
 */
export class UserCustomPermissionsResponseDto {
  @ApiProperty({ example: 'user-uuid' })
  userId: string;

  @ApiProperty({ type: [UserCustomPermissionResponseDto] })
  customPermissions: UserCustomPermissionResponseDto[];

  @ApiProperty({ example: 5 })
  totalCustomPermissions: number;

  @ApiProperty({ example: 3 })
  grantedCount: number;

  @ApiProperty({ example: 2 })
  revokedCount: number;
}

/**
 * Response DTO for resolved user permissions (effective permissions)
 */
export class ResolvedPermissionsResponseDto {
  @ApiProperty({ example: 'user-uuid' })
  userId: string;

  @ApiProperty({
    example: ['users:create', 'users:read', 'projects:read', 'projects:update'],
    description:
      'All effective permissions after applying role permissions + GRANTs - REVOKEs',
  })
  permissions: string[];

  @ApiProperty({
    example: ['users:create', 'users:read'],
    description: 'Permissions from user roles',
  })
  rolePermissions: string[];

  @ApiProperty({
    example: ['projects:update'],
    description: 'Custom granted permissions',
  })
  grantedPermissions: string[];

  @ApiProperty({
    example: ['users:delete'],
    description: 'Custom revoked permissions',
  })
  revokedPermissions: string[];

  @ApiProperty({
    example: ['project_manager', 'team_lead'],
    description: 'User role slugs',
  })
  roles: string[];

  @ApiProperty({ example: 50 })
  totalPermissions: number;

  @ApiProperty({ example: 45 })
  rolePermissionsCount: number;

  @ApiProperty({ example: 7 })
  grantedPermissionsCount: number;

  @ApiProperty({ example: 2 })
  revokedPermissionsCount: number;

  @ApiProperty({ example: false })
  isSuperAdmin: boolean;
}
