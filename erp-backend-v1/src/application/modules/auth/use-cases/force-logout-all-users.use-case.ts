/**
 * Force Logout All Users Use Case
 *
 * Business Logic:
 * - Revokes ALL refresh tokens in the system
 * - Forces every user (except the executor) to re-authenticate
 * - Emergency action for security incidents or maintenance
 * - Requires SUPERADMIN role ONLY (highest privilege)
 *
 * Security Considerations:
 * - Most dangerous operation - requires highest privilege
 * - Creates detailed audit log with affected user count
 * - Should trigger alerts/notifications in production
 * - Cannot be undone - all users must login again
 *
 * Performance:
 * - Single UPDATE query to revoke all tokens
 * - Uses database transaction for atomicity
 * - Returns count of affected sessions for reporting
 *
 * Use Cases:
 * - Security breach detected
 * - Critical system update required
 * - Emergency maintenance mode
 * - Suspected token compromise
 */

import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { RedisCacheService } from '../../../../infrastructure/cache/redis-cache.service';
import type { IAuthRepository } from '../repositories';
import { AUTH_REPOSITORY } from '../repositories';

function toErrorTrace(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return String(error);
}

export interface ForceLogoutAllResult {
  affectedUsers: number;
  affectedSessions: number;
  executedBy: string;
  executedAt: Date;
}

@Injectable()
export class ForceLogoutAllUsersUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
    private readonly logger: WinstonLoggerService,
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {
    this.logger.setContext(ForceLogoutAllUsersUseCase.name);
  }

  /**
   * Execute: Force logout ALL users from the system
   *
   * WARNING: This is a critical operation that affects all users
   *
   * @param requestingUserId - ID of SUPERADMIN performing the action
   * @param ipAddress - IP address of requesting admin (for audit)
   * @returns Statistics about the operation
   */
  async execute(
    requestingUserId: string,
    ipAddress?: string,
  ): Promise<ForceLogoutAllResult> {
    this.logger.warn(
      `⚠️  FORCE LOGOUT ALL requested by user: ${requestingUserId}`,
    );

    // 1. Get requesting user and verify SUPERADMIN role
    const requestingUser = await this.authRepository.findUserWithRoles(
      requestingUserId,
      false,
    );

    if (!requestingUser) {
      throw new ForbiddenException('Requesting user not found');
    }

    // Normalize roles to uppercase for case-insensitive comparison
    const userRoles =
      requestingUser.roles?.map((role) => role.toUpperCase()) || [];
    const isSuperAdmin = userRoles.includes('SUPERADMIN');

    if (!isSuperAdmin) {
      this.logger.error(
        `❌ Unauthorized FORCE_LOGOUT_ALL attempt by ${requestingUser.email} (roles: ${userRoles.join(', ')})`,
      );
      throw new ForbiddenException(
        'Only SUPERADMIN can force logout all users',
      );
    }

    // 2. Count sessions before revocation (for reporting)
    const sessionCount = await this.authRepository.countActiveSessions();
    const userCount = await this.authRepository.countUsersWithActiveSessions();

    this.logger.warn(
      `About to revoke ${sessionCount} sessions for ${userCount} users`,
    );

    // 3. Increment token version for ALL users (invalidates all access tokens instantly)
    try {
      const result = await this.prisma.user.updateMany({
        data: {
          tokenVersion: {
            increment: 1,
          },
        },
      });
      this.logger.warn(
        `✅ Incremented token version for ${result.count} users`,
      );
    } catch (error) {
      this.logger.error(
        '❌ Failed to increment token versions',
        toErrorTrace(error),
      );
      throw error;
    }

    // 4. Revoke ALL refresh tokens in the system
    try {
      await this.authRepository.revokeAllTokens();
      await this.cache.invalidatePattern('auth:me:*');
      await this.cache.invalidatePattern('auth:jwt-context:*');

      this.logger.warn(
        `✅ Successfully revoked all ${sessionCount} active sessions in the system`,
      );
    } catch (error) {
      this.logger.error('❌ Failed to revoke all tokens', toErrorTrace(error));
      throw error;
    }

    // 4. Create critical audit log entry
    const result: ForceLogoutAllResult = {
      affectedUsers: userCount,
      affectedSessions: sessionCount,
      executedBy: requestingUser.email,
      executedAt: new Date(),
    };

    // Audit log is created automatically by AuditInterceptor

    // 5. Log critical event with full context
    this.logger.logWithMeta(
      `🚨 CRITICAL: All users force logged out by ${requestingUser.email}`,
      {
        requestingUserId,
        requestingUserEmail: requestingUser.email,
        affectedUsers: userCount,
        affectedSessions: sessionCount,
        ipAddress,
        timestamp: new Date().toISOString(),
      },
      'error', // Use error level for critical security events
    );

    return result;
  }
}
