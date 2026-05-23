/**
 * Change Password Use Case
 * Business logic for changing user password
 * Available to all authenticated users to change their own password
 */

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { RedisCacheService } from '../../../../infrastructure/cache/redis-cache.service';
import type { IAuthRepository } from '../repositories';
import { AUTH_REPOSITORY } from '../repositories';
import { PasswordService } from '../services/password.service';
import { ChangePasswordDto } from '../dto';
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
export class ChangePasswordUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
    private readonly passwordService: PasswordService,
    private readonly cache: RedisCacheService,
    private readonly i18n: I18nService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(ChangePasswordUseCase.name);
  }

  async execute(userId: string, dto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword, confirmPassword } = dto;

    // 1. Get user who is making the request
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException(this.i18n.t('auth.login.userNotFound'));
    }

    // 2. Validate new password matches confirm password
    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        this.i18n.t('auth.password.passwordsNotMatch'),
      );
    }

    // 3. Verify current password

    // 3. Verify current password
    const isCurrentPasswordValid = await this.passwordService.verifyPassword(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      this.logger.logWithMeta(
        `Failed password change attempt for user: ${user.email}`,
        {},
        'warn',
      );
      throw new UnauthorizedException(
        this.i18n.t('auth.password.invalidCurrent'),
      );
    }

    // 4. Validate new password strength
    const passwordValidation =
      this.passwordService.validatePasswordStrength(newPassword);

    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: this.i18n.t('auth.password.weak'),
        errors: passwordValidation.errors,
      });
    }

    // 5. Check if new password is same as current
    const isSamePassword = await this.passwordService.verifyPassword(
      newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new BadRequestException(this.i18n.t('auth.password.sameAsOld'));
    }

    // 6. Hash new password
    const hashedPassword = await this.passwordService.hashPassword(newPassword);

    // 7. Update password
    await this.authRepository.updateUserPassword(userId, hashedPassword);

    // 8. Increment token version (invalidates ALL access tokens instantly)
    try {
      const newVersion =
        await this.authRepository.incrementTokenVersion(userId);
      this.logger.log(
        `Token version incremented to ${newVersion} for user: ${user.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to increment token version for user ${userId}`,
        toErrorTrace(error),
      );
      throw new Error(this.i18n.t('auth.token.invalidateFailed'));
    }

    // 9. Revoke all refresh tokens (force re-login on all devices)
    await this.authRepository.revokeAllUserTokens(userId);
    await this.cache.del(buildAuthMeCacheKey(userId));
    await this.cache.invalidatePattern(buildJwtAuthContextUserPattern(userId));

    // 10. Log password change
    this.logger.logEvent('PasswordChanged', {
      userId: user.id,
      email: user.email,
    });
    // Audit log is created automatically by AuditInterceptor
  }
}
