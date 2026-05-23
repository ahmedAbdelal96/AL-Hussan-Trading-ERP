/**
 * Auth Repository Implementation
 * Implements authentication data access using Prisma
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import {
  ActiveTokenWithUserRecord,
  IAuthRepository,
} from './auth.repository.interface';
import { UserEntity, RefreshTokenEntity } from '../entities';
import { add } from 'date-fns';

@Injectable()
export class AuthRepository implements IAuthRepository {
  private readonly logger = new Logger(AuthRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) return null;

    return new UserEntity(user);
  }

  /**
   * Find user by ID
   */
  async findUserById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return new UserEntity(user);
  }

  /**
   * Find user with roles and permissions
   */
  async findUserWithRoles(
    id: string,
    includePermissions: boolean = true,
  ): Promise<UserEntity | null> {
    const now = new Date();

    if (!includePermissions) {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          password: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          profilePicture: true,
          lastLoginAt: true,
          lastLoginIp: true,
          failedLoginAttempts: true,
          lastFailedLoginAt: true,
          lockedUntil: true,
          permanentlyLocked: true,
          permanentlyLockedAt: true,
          unlockAttemptCount: true,
          tokenVersion: true,
          deletedAt: true,
          deletedBy: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            where: {
              isActive: true,
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
            select: {
              role: {
                select: {
                  slug: true,
                },
              },
            },
          },
        },
      });

      if (!user) return null;

      return new UserEntity({
        ...user,
        roles: user.userRoles.map((ur) => ur.role.slug),
        permissions: [],
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        profilePicture: true,
        lastLoginAt: true,
        lastLoginIp: true,
        failedLoginAttempts: true,
        lastFailedLoginAt: true,
        lockedUntil: true,
        permanentlyLocked: true,
        permanentlyLockedAt: true,
        unlockAttemptCount: true,
        tokenVersion: true,
        deletedAt: true,
        deletedBy: true,
        createdAt: true,
        updatedAt: true,
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

    if (!user) return null;

    // Extract roles
    const roles = user.userRoles.map((ur) => ur.role.slug);

    // Extract permissions from roles
    const rolePermissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => ({
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
    );

    // Extract custom permissions (GRANT only)
    const customPermissions = user.userCustomPermissions
      .filter((ucp) => ucp.permissionType === 'GRANT')
      .map((ucp) => ({
        resource: ucp.permission.resource,
        action: ucp.permission.action,
      }));

    // Remove revoked permissions
    const revokedPermissions = user.userCustomPermissions
      .filter((ucp) => ucp.permissionType === 'REVOKE')
      .map((ucp) => ({
        resource: ucp.permission.resource,
        action: ucp.permission.action,
      }));

    // Combine and deduplicate permissions
    const allPermissions = [...rolePermissions, ...customPermissions].filter(
      (perm) =>
        !revokedPermissions.some(
          (revoked) =>
            revoked.resource === perm.resource &&
            revoked.action === perm.action,
        ),
    );

    const permissions = Array.from(
      new Set(allPermissions.map((p) => `${p.resource}:${p.action}`)),
    ).map((permStr) => {
      const [resource, action] = permStr.split(':');
      return { resource, action };
    });

    return new UserEntity({
      ...user,
      roles,
      permissions,
    });
  }

  /**
   * Update user password
   */
  async updateUserPassword(
    userId: string,
    hashedPassword: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Update user last login
   */
  async updateUserLastLogin(userId: string, ipAddress?: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });
  }

  /**
   * Increment failed login attempts and return new count
   */
  async incrementFailedLoginAttempts(userId: string): Promise<number> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: { increment: 1 },
        lastFailedLoginAt: new Date(),
      },
    });

    return user.failedLoginAttempts;
  }

  /**
   * Reset failed login attempts to zero
   */
  async resetFailedLoginAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        lockedUntil: null,
      },
    });
  }

  /**
   * Lock account temporarily
   */
  async lockAccountTemporarily(
    userId: string,
    lockDurationMinutes: number,
  ): Promise<void> {
    const lockedUntil = add(new Date(), { minutes: lockDurationMinutes });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil,
      },
    });

    this.logger.warn(
      `User ${userId} temporarily locked until ${lockedUntil.toISOString()}`,
    );
  }

  /**
   * Lock account permanently
   */
  async lockAccountPermanently(userId: string): Promise<void> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        permanentlyLocked: true,
        permanentlyLockedAt: new Date(),
        unlockAttemptCount: { increment: 1 },
      },
    });

    this.logger.error(
      `User ${userId} permanently locked after ${user.unlockAttemptCount} unlock cycle(s)`,
    );
  }

  /**
   * Unlock account (SUPERADMIN only)
   */
  async unlockAccount(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        permanentlyLocked: false,
        permanentlyLockedAt: null,
        lockedUntil: null,
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
      },
    });

    this.logger.log(`User ${userId} unlocked by SUPERADMIN`);
  }

  /**
   * Increment token version for instant logout
   */
  async incrementTokenVersion(userId: string): Promise<number> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
      select: {
        tokenVersion: true,
      },
    });

    this.logger.log(
      `Token version incremented for user ${userId} to ${user.tokenVersion}`,
    );

    return user.tokenVersion;
  }

  /**
   * Create refresh token
   */
  async createRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RefreshTokenEntity> {
    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    return new RefreshTokenEntity(refreshToken);
  }

  /**
   * Find refresh token
   */
  async findRefreshToken(token: string): Promise<RefreshTokenEntity | null> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!refreshToken) return null;

    return new RefreshTokenEntity(refreshToken);
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  }

  /**
   * Revoke all user tokens
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    this.logger.log(`Revoked all tokens for user ${userId}`);
  }

  /**
   * Revoke ALL tokens in the system (emergency function)
   */
  async revokeAllTokens(): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { isRevoked: false },
      data: { isRevoked: true },
    });

    this.logger.warn('⚠️  CRITICAL: Revoked ALL tokens in the system');
  }

  /**
   * Get active tokens with user information
   * Used for displaying active sessions
   */
  async getActiveTokensWithUsers(): Promise<ActiveTokenWithUserRecord[]> {
    return this.prisma.refreshToken.findMany({
      where: {
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            userRoles: {
              select: {
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Count total active sessions
   */
  async countActiveSessions(): Promise<number> {
    return this.prisma.refreshToken.count({
      where: {
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Count users with active sessions
   */
  async countUsersWithActiveSessions(): Promise<number> {
    const result = await this.prisma.refreshToken.findMany({
      where: {
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    return result.length;
  }

  /**
   * Delete expired tokens (older than 30 days)
   */
  async deleteExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: add(new Date(), { days: -30 }) },
      },
    });

    return result.count;
  }

  /**
   * Cleanup old tokens for user (keep only last N tokens)
   */
  async cleanupOldTokens(
    userId: string,
    keepLast: number = 5,
  ): Promise<number> {
    // Get all active tokens for user
    const activeTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Keep only the last N tokens
    if (activeTokens.length > keepLast) {
      const tokensToRevoke = activeTokens.slice(keepLast);
      const tokenIds = tokensToRevoke.map((t) => t.id);

      const result = await this.prisma.refreshToken.updateMany({
        where: { id: { in: tokenIds } },
        data: { isRevoked: true },
      });

      this.logger.debug(
        `Revoked ${result.count} old tokens for user ${userId}`,
      );

      return result.count;
    }

    return 0;
  }

  /**
   * Create audit log
   */
  async createAuditLog(data: {
    userId: string;
    userEmail: string;
    userName: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    resourceName?: string;
    ipAddress?: string;
    userAgent?: string;
    status: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName,
          action: data.action as any,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          resourceName: data.resourceName,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          status: data.status as any,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
    }
  }
}
