/**
 * Unlock Account Use Case
 * Business logic for unlocking locked user accounts (SUPERADMIN only)
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import type { IAuthRepository } from '../repositories';
import { AUTH_REPOSITORY } from '../repositories';
import { LoginRateLimiterService } from '../services/login-rate-limiter.service';

@Injectable()
export class UnlockAccountUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
    private readonly loginRateLimiter: LoginRateLimiterService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(UnlockAccountUseCase.name);
  }

  async execute(userId: string, unlockedBy: string): Promise<void> {
    // 1. Verify that the user performing unlock is SUPERADMIN
    const superadmin = await this.authRepository.findUserWithRoles(
      unlockedBy,
      false,
    );

    if (!superadmin) {
      throw new ForbiddenException('Unauthorized to perform this action');
    }

    if (!superadmin.hasRole('SUPERADMIN')) {
      this.logger.warn(
        `Non-SUPERADMIN user ${superadmin.email} attempted to unlock account ${userId}`,
      );
      throw new ForbiddenException('Only SUPERADMIN users can unlock accounts');
    }

    // 2. Check if user exists
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 2. Check if account is actually locked
    const isLocked = user.isPermanentlyLocked() || user.isTemporarilyLocked();

    if (!isLocked) {
      this.logger.log(
        `Unlock attempt for already unlocked account: ${user.email} by ${unlockedBy}`,
      );
      return; // Already unlocked, nothing to do
    }

    // 3. Unlock account
    await this.loginRateLimiter.unlockAccount(userId);
    // Audit log is created automatically by AuditInterceptor

    this.logger.log(
      `Account unlocked: ${user.email} by SUPERADMIN: ${unlockedBy}`,
    );
  }
}
