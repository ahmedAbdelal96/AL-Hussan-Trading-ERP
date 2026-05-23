/**
 * Logout Use Case
 * Business logic for user logout
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import type { IAuthRepository } from '../repositories';
import { AUTH_REPOSITORY } from '../repositories';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(LogoutUseCase.name);
  }

  async execute(userId: string, refreshToken?: string): Promise<void> {
    // 1. Revoke refresh token if provided
    if (refreshToken) {
      await this.authRepository.revokeRefreshToken(refreshToken);
    }

    // 2. Get user for audit log
    const user = await this.authRepository.findUserById(userId);

    if (user) {
      // 3. Log logout event
      this.logger.logEvent('UserLogout', {
        userId: user.id,
        email: user.email,
      });
      // Audit log is created automatically by AuditInterceptor
    }
  }
}
