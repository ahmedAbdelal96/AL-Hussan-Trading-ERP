/**
 * Login Use Case
 * Business logic for user authentication with rate limiting
 */

import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import type { IAuthRepository } from '../repositories';
import { AUTH_REPOSITORY } from '../repositories';
import { PasswordService } from '../services/password.service';
import { TokenService } from '../services/token.service';
import { LoginRateLimiterService } from '../services/login-rate-limiter.service';
import { LoginDto, LoginResponseDto, UserInfoDto, TokensDto } from '../dto';
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

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly loginRateLimiter: LoginRateLimiterService,
    private readonly i18n: I18nService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(LoginUseCase.name);
  }

  async execute(
    loginDto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<LoginResponseDto> {
    const { email, password, rememberMe = false } = loginDto;

    try {
      // 1. Find user by email
      const user = await this.authRepository.findUserByEmail(email);

      if (!user) {
        this.logger.logWithMeta(
          `Login attempt with invalid email: ${email}`,
          { ipAddress, userAgent },
          'warn',
        );
        throw new UnauthorizedException(
          this.i18n.t('auth.login.invalidCredentials'),
        );
      }

      // 2. Check rate limiting (temporary/permanent locks)
      this.loginRateLimiter.validateLoginAttempt(user);

      // 3. Check if user can login (active, not deleted)
      if (!user.isActive || user.deletedAt) {
        const reason = user.deletedAt ? 'deleted' : 'inactive';
        this.logger.logWithMeta(
          `Login attempt for ${reason} user: ${user.email}`,
          { ipAddress, userAgent },
          'warn',
        );
        throw new UnauthorizedException(
          this.i18n.t('auth.login.accountInactive'),
        );
      }

      // 4. Verify password
      const isPasswordValid = await this.passwordService.verifyPassword(
        password,
        user.password,
      );

      if (!isPasswordValid) {
        this.logger.logWithMeta(
          `Failed login attempt for user: ${user.email}`,
          { ipAddress, userAgent },
          'warn',
        );

        // Handle failed login (increment counter, lock if needed)
        await this.loginRateLimiter.handleFailedLogin(user);

        // This line won't execute because handleFailedLogin throws
        // but TypeScript doesn't know that
        throw new UnauthorizedException(
          this.i18n.t('auth.login.invalidCredentials'),
        );
      }

      // 5. Password is correct - Reset failed attempts
      await this.loginRateLimiter.handleSuccessfulLogin(user);

      // 6. Get user with roles
      const userWithRoles = await this.authRepository.findUserWithRoles(
        user.id,
      );

      if (!userWithRoles) {
        throw new UnauthorizedException(this.i18n.t('auth.login.userNotFound'));
      }

      // 7. Generate tokens (with Remember Me support)
      const tokens = await this.tokenService.generateTokenPair(
        toTokenUser(userWithRoles),
        userAgent,
        ipAddress,
        rememberMe, // Pass Remember Me flag
      );

      // 8. Update last login
      await this.authRepository.updateUserLastLogin(
        userWithRoles.id,
        ipAddress,
      );

      // 9. Log successful login
      this.logger.logEvent('UserLogin', {
        userId: userWithRoles.id,
        email: userWithRoles.email,
        ipAddress,
        userAgent,
      });

      // 10. Prepare response (include resolved permissions from DB)
      const userInfo: UserInfoDto = {
        id: userWithRoles.id,
        email: userWithRoles.email,
        firstName: userWithRoles.firstName,
        lastName: userWithRoles.lastName,
        roles: userWithRoles.roles || [],
        permissions: (userWithRoles.permissions || []).map(
          (p) => `${p.resource}:${p.action}`,
        ),
        isActive: userWithRoles.isActive,
      };

      const tokensDto: TokensDto = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: 'Bearer',
        expiresIn: tokens.expiresIn,
      };

      return {
        user: userInfo,
        tokens: tokensDto,
      };
    } catch (error) {
      // Failed login is automatically logged by AuditInterceptor (catchError)
      this.logger.warn(`Login execution failed: ${toErrorMessage(error)}`);
      throw error;
    }
  }
}
