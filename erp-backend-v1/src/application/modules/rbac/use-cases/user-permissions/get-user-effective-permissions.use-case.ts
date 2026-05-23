/**
 * Get User Effective Permissions Use Case
 * Business logic for calculating and returning user's effective permissions
 *
 * This is THE MOST IMPORTANT use case for authorization!
 *
 * Algorithm:
 * Effective Permissions = (Role Permissions + GRANT) - REVOKE
 *
 * Uses PermissionResolverService to calculate effective permissions
 * considering:
 * - Active roles (not expired)
 * - Role permissions
 * - Custom GRANT permissions
 * - Custom REVOKE permissions (highest priority)
 *
 * Returns detailed breakdown for debugging and UI display
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import type { IAuthRepository } from '../../../auth/repositories';
import { AUTH_REPOSITORY } from '../../../auth/repositories';
import { PermissionResolverService } from '../../services';
import { ResolvedPermissionsResponseDto } from '../../dto';

@Injectable()
export class GetUserEffectivePermissionsUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly permissionResolver: PermissionResolverService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetUserEffectivePermissionsUseCase.name);
  }

  async execute(userId: string): Promise<ResolvedPermissionsResponseDto> {
    // 1. Check if user exists
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 2. Resolve all effective permissions using PermissionResolverService
    // This is where the magic happens!
    const resolved = await this.permissionResolver.resolvePermissions(userId);

    // 3. Check if user is SUPERADMIN
    const isSuperAdmin = await this.permissionResolver.isSuperAdmin(userId);

    // 4. Return detailed breakdown
    return {
      userId,
      permissions: resolved.permissions,
      rolePermissions: resolved.rolePermissions,
      grantedPermissions: resolved.grantedPermissions,
      revokedPermissions: resolved.revokedPermissions,
      roles: resolved.roles,
      totalPermissions: resolved.permissions.length,
      rolePermissionsCount: resolved.rolePermissions.length,
      grantedPermissionsCount: resolved.grantedPermissions.length,
      revokedPermissionsCount: resolved.revokedPermissions.length,
      isSuperAdmin,
    };
  }
}
