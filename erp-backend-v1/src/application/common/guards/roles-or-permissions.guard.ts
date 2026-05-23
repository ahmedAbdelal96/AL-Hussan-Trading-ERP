/**
 * ============================================================================
 * ROLES OR PERMISSIONS GUARD
 * ============================================================================
 *
 * Unified guard that implements OR logic between roles and permissions.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../infrastructure/logger/winston-logger.service';
import { UserEntity } from '../../modules/auth/entities/user.entity';
import { PermissionResolverService } from '../../modules/rbac/services/permission-resolver.service';

@Injectable()
export class RolesOrPermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionResolverService: PermissionResolverService,
    private readonly i18n: I18nService,
    private readonly logger: WinstonLoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      'auth:roles',
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'auth:permissions',
      [context.getHandler(), context.getClass()],
    );

    const allowSelf = this.reflector.getAllAndOverride<boolean>(
      'auth:allowSelf',
      [context.getHandler(), context.getClass()],
    );

    const hasNoRequirements =
      (!requiredRoles || requiredRoles.length === 0) &&
      (!requiredPermissions || requiredPermissions.length === 0);

    if (hasNoRequirements) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: UserEntity = request.user;

    this.logger.logWithMeta('Authorizing request', {
      userId: user?.id,
      roles: user?.roles?.join(', ') || 'none',
      path: request?.url,
      method: request?.method,
      requestId: request?.id,
    });

    if (!user) {
      throw new ForbiddenException(
        this.i18n.t('rbac.authorization.userNotAuthenticated'),
      );
    }

    if (allowSelf) {
      const targetUserId = request.params?.id || request.params?.userId;
      if (targetUserId && targetUserId === user.id) {
        return true;
      }
    }

    if (user.hasRole('SUPERADMIN')) {
      return true;
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((role) => user.hasRole(role));
      if (hasRole) {
        return true;
      }
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const effectivePermissions =
        await this.permissionResolverService.resolveUserEffectivePermissions(
          user.id,
        );

      const hasAllPermissions = requiredPermissions.every((permission) =>
        effectivePermissions.has(permission),
      );

      if (hasAllPermissions) {
        return true;
      }

      const missingPermissions = requiredPermissions.filter(
        (permission) => !effectivePermissions.has(permission),
      );

      const rolesPart = requiredRoles?.length
        ? `roles: ${requiredRoles.join(', ')}`
        : '';
      const permissionsPart = requiredPermissions?.length
        ? `permissions: ${requiredPermissions.join(', ')}`
        : '';

      throw new ForbiddenException(
        this.i18n.t('rbac.authorization.requiredRolesOrPermissions', {
          args: {
            required: [rolesPart, permissionsPart].filter(Boolean).join(' OR '),
            permissions: missingPermissions.join(', '),
          },
        }),
      );
    }

    if (requiredRoles && requiredRoles.length > 0) {
      throw new ForbiddenException(
        this.i18n.t('rbac.authorization.requiredRolesWithUserRoles', {
          args: {
            requiredRoles: requiredRoles.join(', '),
            userRoles: user.roles?.join(', ') || 'none',
          },
        }),
      );
    }

    throw new ForbiddenException(
      this.i18n.t('rbac.authorization.accessDenied'),
    );
  }
}
