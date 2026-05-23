/**
 * Permissions Guard
 * Checks if user has all required permissions
 *
 * Uses PermissionResolverService to calculate effective permissions:
 * Effective Permissions = (Role Permissions + GRANT) - REVOKE
 *
 * Used by @Auth() decorator
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { UserEntity } from '../../modules/auth/entities/user.entity';
import { PermissionResolverService } from '../../modules/rbac/services/permission-resolver.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionResolverService: PermissionResolverService,
    private readonly i18n: I18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'auth:permissions',
      [context.getHandler(), context.getClass()],
    );

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user: UserEntity = request.user;

    if (!user) {
      throw new ForbiddenException(
        this.i18n.t('rbac.authorization.userNotAuthenticated'),
      );
    }

    // SUPERADMIN bypasses all permission checks
    if (user.hasRole('SUPERADMIN')) {
      return true;
    }

    // Get user's effective permissions (Role Permissions + GRANT - REVOKE)
    const effectivePermissions =
      await this.permissionResolverService.resolveUserEffectivePermissions(
        user.id,
      );

    // Check if user has ALL required permissions
    const hasAllPermissions = requiredPermissions.every((requiredPermission) =>
      effectivePermissions.has(requiredPermission),
    );

    if (!hasAllPermissions) {
      // Find which permissions are missing
      const missingPermissions = requiredPermissions.filter(
        (permission) => !effectivePermissions.has(permission),
      );

      throw new ForbiddenException(
        this.i18n.t('rbac.authorization.missingPermissions', {
          args: { permissions: missingPermissions.join(', ') },
        }),
      );
    }

    return true;
  }
}
