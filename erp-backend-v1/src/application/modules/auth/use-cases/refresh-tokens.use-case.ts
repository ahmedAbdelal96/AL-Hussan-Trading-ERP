/**
 * Refresh Tokens Use Case
 * Business logic for refreshing access tokens
 */

import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import type { IAuthRepository } from '../repositories';
import { AUTH_REPOSITORY } from '../repositories';
import { TokenService } from '../services/token.service';
import { TokensDto } from '../dto';
import type { User } from '@prisma/client';

function toTokenUser(user: {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive: boolean;
  tokenVersion: number;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  lastLoginAt?: Date | null;
  lastLoginIp?: string | null;
  failedLoginAttempts: number;
  lastFailedLoginAt?: Date | null;
  lockedUntil?: Date | null;
  permanentlyLocked: boolean;
  permanentlyLockedAt?: Date | null;
  unlockAttemptCount: number;
  profilePicture?: string | null;
  createdAt: Date;
  updatedAt: Date;
  rowVersion?: number;
}): User {
  return {
    id: user.id,
    email: user.email,
    password: user.password,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? null,
    isActive: user.isActive,
    tokenVersion: user.tokenVersion,
    deletedAt: user.deletedAt ?? null,
    deletedBy: user.deletedBy ?? null,
    lastLoginAt: user.lastLoginAt ?? null,
    lastLoginIp: user.lastLoginIp ?? null,
    failedLoginAttempts: user.failedLoginAttempts,
    lastFailedLoginAt: user.lastFailedLoginAt ?? null,
    lockedUntil: user.lockedUntil ?? null,
    permanentlyLocked: user.permanentlyLocked,
    permanentlyLockedAt: user.permanentlyLockedAt ?? null,
    unlockAttemptCount: user.unlockAttemptCount,
    profilePicture: user.profilePicture ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    rowVersion: user.rowVersion ?? 1,
  };
}

@Injectable()
export class RefreshTokensUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
    private readonly tokenService: TokenService,
    private readonly i18n: I18nService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(RefreshTokensUseCase.name);
  }

  async execute(
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokensDto> {
    // 1. Verify refresh token
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);

    // 2. Detect if token was created with Remember Me
    const rememberMe =
      await this.tokenService.wasTokenCreatedWithRememberMe(refreshToken);

    // 3. Get user
    const user = await this.authRepository.findUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedException(this.i18n.t('auth.login.userNotFound'));
    }

    // 4. Check if user can login
    if (!user.canLogin()) {
      throw new UnauthorizedException(
        this.i18n.t('auth.login.accountInactive'),
      );
    }

    // 5. Revoke old refresh token
    await this.authRepository.revokeRefreshToken(refreshToken);

    // 6. Generate new token pair with same Remember Me setting
    const tokens = await this.tokenService.generateTokenPair(
      toTokenUser(user),
      userAgent,
      ipAddress,
      rememberMe, // Preserve Remember Me setting
    );

    // 6. Log event
    this.logger.logEvent('TokenRefreshed', {
      userId: user.id,
      email: user.email,
      rememberMe,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: 'Bearer',
      expiresIn: tokens.expiresIn,
    };
  }
}
