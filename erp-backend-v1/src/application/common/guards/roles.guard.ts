/**
 * Roles Guard
 * Checks if user has at least one of the required roles
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

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly i18n: I18nService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      'auth:roles',
      [context.getHandler(), context.getClass()],
    );

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
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

    // Check if user has at least one of the required roles
    const hasRole = requiredRoles.some((role) => user.hasRole(role));

    if (!hasRole) {
      throw new ForbiddenException(
        this.i18n.t('rbac.authorization.requiredRoles', {
          args: { roles: requiredRoles.join(', ') },
        }),
      );
    }

    return true;
  }
}
