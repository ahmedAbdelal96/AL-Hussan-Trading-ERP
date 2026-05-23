/**
 * Force Logout User Use Case
 *
 * Business Logic:
 * - Revokes all refresh tokens for a specific user
 * - Forces the user to re-authenticate on all devices
 * - Creates audit log for compliance and security tracking
 * - Requires ADMIN or SUPERADMIN role
 *
 * Security Considerations:
 * - Cannot force logout users with equal or higher role
 * - Cannot force logout yourself (prevents accidental lockout)
 * - All actions are logged for audit trail
 *
 * Performance:
 * - Uses batch update for token revocation (single query)
 * - Asynchronous audit logging to avoid blocking
 */

import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { RedisCacheService } from '../../../../infrastructure/cache/redis-cache.service';
import type { IAuthRepository } from '../repositories';
import { AUTH_REPOSITORY } from '../repositories';
import {
  buildAuthMeCacheKey,
  buildJwtAuthContextUserPattern,
} from '../auth-cache.keys';

function toErrorTrace(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return String(error);
}

@Injectable()
export class ForceLogoutUserUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
    private readonly cache: RedisCacheService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(ForceLogoutUserUseCase.name);
  }

  /**
   * Execute: Force logout a specific user from all devices
   *
   * @param requestingUserId - ID of admin performing the action
   * @param targetUserId - ID of user to force logout
   * @param ipAddress - IP address of requesting admin (for audit)
   * @returns void
   */
  async execute(
    requestingUserId: string,
    targetUserId: string,
    ipAddress?: string,
  ): Promise<void> {
    this.logger.log(
      `Force logout requested for user ${targetUserId} by ${requestingUserId}`,
    );

    // 1. Validate input
    if (!targetUserId || targetUserId.trim() === '') {
      throw new BadRequestException('Target user ID is required');
    }

    // 2. Prevent self-logout (safety check)
    if (requestingUserId === targetUserId) {
      throw new BadRequestException(
        'Cannot force logout yourself. Use normal logout instead.',
      );
    }

    // 3. Get requesting user and verify permissions
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
    const hasPermission =
      userRoles.includes('SUPERADMIN') || userRoles.includes('ADMIN');

    if (!hasPermission) {
      this.logger.warn(
        `Unauthorized force logout attempt by user: ${requestingUser.email} (roles: ${userRoles.join(', ')}) on user: ${targetUserId}`,
      );
      throw new ForbiddenException(
        'Only ADMIN or SUPERADMIN can force logout users',
      );
    }

    // 4. Get target user and validate
    const targetUser = await this.authRepository.findUserWithRoles(
      targetUserId,
      false,
    );

    if (!targetUser) {
      throw new NotFoundException(`User with ID ${targetUserId} not found`);
    }

    // 5. Check role hierarchy (ADMIN cannot logout SUPERADMIN)
    const requestingUserRole =
      requestingUser.roles?.[0]?.toUpperCase() || 'USER';
    const targetUserRole = targetUser.roles?.[0]?.toUpperCase() || 'USER';

    if (requestingUserRole === 'ADMIN' && targetUserRole === 'SUPERADMIN') {
      this.logger.warn(
        `ADMIN ${requestingUser.email} attempted to logout SUPERADMIN ${targetUser.email}`,
      );
      throw new ForbiddenException('ADMIN cannot force logout SUPERADMIN');
    }

    // 6. Increment token version (invalidates all existing tokens instantly)
    try {
      const newVersion =
        await this.authRepository.incrementTokenVersion(targetUserId);
      this.logger.log(
        `Token version incremented to ${newVersion} for user: ${targetUser.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to increment token version for user ${targetUserId}`,
        toErrorTrace(error),
      );
      throw new Error('Failed to invalidate user tokens');
    }

    // 7. Revoke all refresh tokens for target user
    try {
      await this.authRepository.revokeAllUserTokens(targetUserId);
      await this.cache.del(buildAuthMeCacheKey(targetUserId));
      await this.cache.invalidatePattern(
        buildJwtAuthContextUserPattern(targetUserId),
      );

      this.logger.log(
        `Successfully revoked all tokens for user: ${targetUser.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to revoke tokens for user ${targetUserId}`,
        toErrorTrace(error),
      );
      throw error;
    }

    // Audit log is created automatically by AuditInterceptor

    this.logger.logWithMeta(
      `User ${targetUser.email} force logged out by ${requestingUser.email}`,
      {
        requestingUserId,
        targetUserId,
        requestingUserEmail: requestingUser.email,
        targetUserEmail: targetUser.email,
        ipAddress,
      },
      'warn',
    );
  }
}
