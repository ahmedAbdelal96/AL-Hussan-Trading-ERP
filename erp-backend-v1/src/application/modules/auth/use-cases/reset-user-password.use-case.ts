/**
 * Reset User Password Use Case (Admin Only)
 * Allows Admin/SuperAdmin to reset any user's password
 * without requiring the current password
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { RedisCacheService } from '../../../../infrastructure/cache/redis-cache.service';
import type { IAuthRepository } from '../repositories';
import { AUTH_REPOSITORY } from '../repositories';
import { PasswordService } from '../services/password.service';
import { ResetUserPasswordDto } from '../dto/reset-user-password.dto';
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
export class ResetUserPasswordUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
    private readonly passwordService: PasswordService,
    private readonly cache: RedisCacheService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(ResetUserPasswordUseCase.name);
  }

  async execute(
    adminUserId: string,
    targetUserId: string,
    dto: ResetUserPasswordDto,
  ): Promise<void> {
    const { newPassword, confirmPassword } = dto;

    // 1. Verify that the requesting user is Admin/SuperAdmin
    const adminUser = await this.authRepository.findUserWithRoles(
      adminUserId,
      false,
    );

    if (!adminUser) {
      throw new ForbiddenException('Admin user not found');
    }

    const adminRoles = adminUser.roles?.map((role) => role.toUpperCase()) || [];
    const isAuthorized =
      adminRoles.includes('ADMIN') || adminRoles.includes('SUPERADMIN');

    if (!isAuthorized) {
      this.logger.warn(
        `Unauthorized password reset attempt by user: ${adminUser.email} (roles: ${adminRoles.join(', ')})`,
      );
      throw new ForbiddenException(
        'Only Admin or SuperAdmin can reset user passwords',
      );
    }

    // 2. Prevent self password reset (should use change-password endpoint)
    if (adminUserId === targetUserId) {
      throw new BadRequestException(
        'Use the change-password endpoint to change your own password',
      );
    }

    // 3. Get target user
    const targetUser = await this.authRepository.findUserById(targetUserId);

    if (!targetUser) {
      throw new NotFoundException(`User with ID ${targetUserId} not found`);
    }

    // 4. Check role hierarchy (ADMIN cannot reset SUPERADMIN password)
    const targetUserRoles = await this.authRepository.findUserWithRoles(
      targetUserId,
      false,
    );
    const targetRoles =
      targetUserRoles?.roles?.map((role) => role.toUpperCase()) || [];
    const targetIsSuperAdmin = targetRoles.includes('SUPERADMIN');

    if (
      adminRoles.includes('ADMIN') &&
      !adminRoles.includes('SUPERADMIN') &&
      targetIsSuperAdmin
    ) {
      this.logger.warn(
        `ADMIN ${adminUser.email} attempted to reset SUPERADMIN ${targetUser.email} password`,
      );
      throw new ForbiddenException('ADMIN cannot reset SUPERADMIN passwords');
    }

    // 5. Validate new password matches confirm password
    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password do not match',
      );
    }

    // 6. Validate new password strength
    const passwordValidation =
      this.passwordService.validatePasswordStrength(newPassword);

    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
      });
    }

    // 7. Check if new password is same as current (optional but good practice)
    const isSamePassword = await this.passwordService.verifyPassword(
      newPassword,
      targetUser.password,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // 8. Hash new password
    const hashedPassword = await this.passwordService.hashPassword(newPassword);

    // 9. Update password
    await this.authRepository.updateUserPassword(targetUserId, hashedPassword);

    // 10. Increment token version (invalidates ALL access tokens instantly)
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

    // 11. Revoke all refresh tokens (force re-login on all devices)
    await this.authRepository.revokeAllUserTokens(targetUserId);
    await this.cache.del(buildAuthMeCacheKey(targetUserId));
    await this.cache.invalidatePattern(
      buildJwtAuthContextUserPattern(targetUserId),
    );

    // 12. Log password reset by admin
    this.logger.logEvent('AdminPasswordReset', {
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
    });
    // Audit log is created automatically by AuditInterceptor

    this.logger.log(
      `Password reset by Admin ${adminUser.email} for user: ${targetUser.email}`,
    );
  }
}
