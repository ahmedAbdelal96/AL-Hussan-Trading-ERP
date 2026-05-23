/**
 * JWT Access Token Strategy
 * Validates access tokens and attaches user to request
 */

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { RedisCacheService } from '../../../../infrastructure/cache/redis-cache.service';
import { JwtPayload } from '../services/token.service';
import { UserEntity } from '../entities/user.entity';
import { buildJwtAuthContextCacheKey } from '../auth-cache.keys';

type JwtAuthContext = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  permanentlyLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  tokenVersion: number;
  deletedAt: Date | null;
  roles: string[];
  permissions: Array<{ resource: string; action: string }>;
};

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  private readonly logger = new Logger(JwtAccessStrategy.name);
  private static readonly AUTH_CONTEXT_CACHE_TTL_SECONDS = 30;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret') as string,
    });
  }

  /**
   * Validate JWT payload and return user.
   * This method is called after JWT signature verification.
   */
  async validate(payload: JwtPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const authContext = await this.cache.getOrSet(
      buildJwtAuthContextCacheKey(payload.sub, payload.tokenVersion),
      async () => this.loadAuthContext(payload.sub),
      JwtAccessStrategy.AUTH_CONTEXT_CACHE_TTL_SECONDS,
    );

    if (!authContext.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    if (authContext.deletedAt) {
      throw new UnauthorizedException('User account has been deleted');
    }

    // Critical security check for instant logout/token invalidation.
    if (authContext.tokenVersion !== payload.tokenVersion) {
      this.logger.warn(
        `Token version mismatch for user ${authContext.email}. payload=${payload.tokenVersion}, db=${authContext.tokenVersion}`,
      );
      throw new UnauthorizedException(
        'Token has been invalidated. Please login again.',
      );
    }

    return new UserEntity({
      id: authContext.id,
      email: authContext.email,
      firstName: authContext.firstName,
      lastName: authContext.lastName,
      phone: authContext.phone,
      isActive: authContext.isActive,
      lastLoginAt: authContext.lastLoginAt,
      lastLoginIp: authContext.lastLoginIp,
      failedLoginAttempts: authContext.failedLoginAttempts,
      lockedUntil: authContext.lockedUntil,
      permanentlyLocked: authContext.permanentlyLocked,
      createdAt: authContext.createdAt,
      updatedAt: authContext.updatedAt,
      roles: authContext.roles,
      permissions: authContext.permissions,
    });
  }

  private async loadAuthContext(userId: string): Promise<JwtAuthContext> {
    const now = new Date();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        lastLoginIp: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        permanentlyLocked: true,
        createdAt: true,
        updatedAt: true,
        tokenVersion: true,
        deletedAt: true,
        userRoles: {
          where: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
          select: {
            role: {
              select: {
                slug: true,
                rolePermissions: {
                  select: {
                    permission: {
                      select: {
                        resource: true,
                        action: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        userCustomPermissions: {
          where: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
          select: {
            permissionType: true,
            permission: {
              select: {
                resource: true,
                action: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roles = user.userRoles.map((ur) => ur.role.slug);
    const rolePermissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => ({
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
    );

    const customPermissions = user.userCustomPermissions
      .filter((ucp) => ucp.permissionType === 'GRANT')
      .map((ucp) => ({
        resource: ucp.permission.resource,
        action: ucp.permission.action,
      }));

    const revokedPermissions = user.userCustomPermissions
      .filter((ucp) => ucp.permissionType === 'REVOKE')
      .map((ucp) => ({
        resource: ucp.permission.resource,
        action: ucp.permission.action,
      }));

    const effectivePermissions = [
      ...rolePermissions,
      ...customPermissions,
    ].filter(
      (perm) =>
        !revokedPermissions.some(
          (revoked) =>
            revoked.resource === perm.resource &&
            revoked.action === perm.action,
        ),
    );

    const permissions = Array.from(
      new Set(effectivePermissions.map((p) => `${p.resource}:${p.action}`)),
    ).map((permStr) => {
      const [resource, action] = permStr.split(':');
      return { resource, action };
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      lastLoginIp: user.lastLoginIp,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
      permanentlyLocked: user.permanentlyLocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      tokenVersion: user.tokenVersion,
      deletedAt: user.deletedAt,
      roles,
      permissions,
    };
  }
}
