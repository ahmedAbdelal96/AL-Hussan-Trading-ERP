/**
 * Login Rate Limiter Service
 * Handles failed login attempts and account locking logic
 *
 * Security Rules:
 * - 5 failed attempts → Lock account for 15 minutes (temporary)
 * - After unlock, if user fails 5 times again → Lock permanently
 * - Only SUPERADMIN can unlock permanently locked accounts
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import type { IAuthRepository } from '../repositories';
import { AUTH_REPOSITORY } from '../repositories';
import { Inject } from '@nestjs/common';
import { UserEntity } from '../entities';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class LoginRateLimiterService {
  // Configuration constants
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly TEMPORARY_LOCK_DURATION_MINUTES = 15;

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(LoginRateLimiterService.name);
  }

  /**
   * Check if user can attempt login
   * @throws UnauthorizedException if account is locked
   */
  validateLoginAttempt(user: UserEntity): void {
    // Check if permanently locked
    if (user.isPermanentlyLocked()) {
      this.logger.warn(
        `Login attempt blocked - Account permanently locked: ${user.email}`,
      );
      throw new UnauthorizedException(
        this.i18n.t('auth.account.permanentlyLocked'),
      );
    }

    // Check if temporarily locked
    if (user.isTemporarilyLocked()) {
      const remainingMinutes = user.getRemainingLockTime();
      this.logger.warn(
        `Login attempt blocked - Account temporarily locked: ${user.email} (${remainingMinutes} minutes remaining)`,
      );
      throw new UnauthorizedException(
        this.i18n.t('auth.account.temporarilyLocked', {
          args: { minutes: remainingMinutes },
        }),
      );
    }
  }

  /**
   * Handle failed login attempt
   * Implements the security rules:
   * - Increment failed attempts counter
   * - Lock temporarily after 5 attempts (first time)
   * - Lock permanently after 5 attempts (second time after unlock)
   */
  async handleFailedLogin(user: UserEntity): Promise<void> {
    // Increment failed login attempts
    const failedAttempts =
      await this.authRepository.incrementFailedLoginAttempts(user.id);

    this.logger.warn(
      `Failed login attempt ${failedAttempts}/${this.MAX_FAILED_ATTEMPTS} for user: ${user.email}`,
    );

    // Check if reached maximum attempts
    if (failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      // Determine if this is first lock (temporary) or subsequent lock (permanent)
      if (user.unlockAttemptCount === 0) {
        // First time reaching max attempts → Temporary lock
        await this.authRepository.lockAccountTemporarily(
          user.id,
          this.TEMPORARY_LOCK_DURATION_MINUTES,
        );

        this.logger.warn(
          `Account temporarily locked for ${this.TEMPORARY_LOCK_DURATION_MINUTES} minutes: ${user.email}`,
        );

        throw new UnauthorizedException(
          this.i18n.t('auth.account.locked', {
            args: { minutes: this.TEMPORARY_LOCK_DURATION_MINUTES },
          }),
        );
      } else {
        // Second time (or more) reaching max attempts → Permanent lock
        await this.authRepository.lockAccountPermanently(user.id);

        this.logger.error(
          `Account permanently locked after repeated failed attempts: ${user.email}`,
        );

        throw new UnauthorizedException(
          this.i18n.t('auth.account.permanentlyLocked'),
        );
      }
    }

    // Not yet at max attempts, throw generic error
    const remainingAttempts = this.MAX_FAILED_ATTEMPTS - failedAttempts;
    throw new UnauthorizedException(
      this.i18n.t('auth.login.attemptsRemaining', {
        args: { attempts: remainingAttempts },
      }),
    );
  }

  /**
   * Handle successful login
   * Resets failed login attempts counter
   */
  async handleSuccessfulLogin(user: UserEntity): Promise<void> {
    // Only reset if user had failed attempts
    if (user.failedLoginAttempts > 0) {
      await this.authRepository.resetFailedLoginAttempts(user.id);
      this.logger.log(
        `Failed login attempts reset after successful login: ${user.email}`,
      );
    }
  }

  /**
   * Unlock account (SUPERADMIN only)
   * Resets all locks and counters
   */
  async unlockAccount(userId: string): Promise<void> {
    await this.authRepository.unlockAccount(userId);
    this.logger.log(`Account unlocked by SUPERADMIN: ${userId}`);
  }
}
