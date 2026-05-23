/**
 * User Role Assignment DTOs
 * Data Transfer Objects for assigning/revoking roles to/from users
 */

import {
  IsUUID,
  IsOptional,
  IsDateString,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for assigning a role to a user
 */
export class AssignRoleDto {
  @ApiProperty({
    description: 'User ID to assign the role to',
    example: 'user-uuid-here',
  })
  @IsUUID('4')
  userId: string;

  @ApiProperty({
    description: 'Role ID to assign',
    example: 'role-uuid-here',
  })
  @IsUUID('4')
  roleId: string;

  @ApiPropertyOptional({
    description:
      'Expiration date for temporary role assignment (ISO 8601 format)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

/**
 * DTO for assigning multiple roles to a user
 */
export class AssignMultipleRolesDto {
  @ApiProperty({
    description: 'User ID to assign roles to',
    example: 'user-uuid-here',
  })
  @IsUUID('4')
  userId: string;

  @ApiProperty({
    description: 'Array of role IDs to assign',
    type: [String],
    example: ['role-uuid-1', 'role-uuid-2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  roleIds: string[];

  @ApiPropertyOptional({
    description: 'Optional expiration date for all role assignments',
    example: '2024-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

/**
 * DTO for revoking a role from a user
 */
export class RevokeRoleDto {
  @ApiProperty({
    description: 'User ID to revoke the role from',
    example: 'user-uuid-here',
  })
  @IsUUID('4')
  userId: string;

  @ApiProperty({
    description: 'Role ID to revoke',
    example: 'role-uuid-here',
  })
  @IsUUID('4')
  roleId: string;
}

/**
 * DTO for extending a temporary role assignment
 */
export class ExtendRoleDto {
  @ApiProperty({
    description: 'User role assignment ID',
    example: 'user-role-uuid-here',
  })
  @IsUUID('4')
  userRoleId: string;

  @ApiProperty({
    description: 'Number of days to extend',
    example: 30,
  })
  @Type(() => Number)
  days: number;
}

/**
 * DTO for making a role assignment permanent
 */
export class MakeRolePermanentDto {
  @ApiProperty({
    description: 'User role assignment ID',
    example: 'user-role-uuid-here',
  })
  @IsUUID('4')
  userRoleId: string;
}

/**
 * Response DTO for user role assignment
 */
export class UserRoleResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'user-uuid' })
  userId: string;

  @ApiProperty({ example: 'role-uuid' })
  roleId: string;

  @ApiProperty({
    example: {
      id: 'role-uuid',
      name: 'Project Manager',
      slug: 'project_manager',
    },
  })
  role: {
    id: string;
    name: string;
    slug: string;
    description: string;
    isSystemRole: boolean;
    isActive: boolean;
    permissionCount: number;
  };

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
 * Response DTO for user's roles list
 */
export class UserRolesResponseDto {
  @ApiProperty({ example: 'user-uuid' })
  userId: string;

  @ApiProperty({ type: [UserRoleResponseDto] })
  roles: UserRoleResponseDto[];

  @ApiProperty({ example: 3 })
  totalRoles: number;

  @ApiProperty({ example: 2 })
  activeRoles: number;

  @ApiProperty({ example: 1 })
  expiredRoles: number;
}
