/**
 * Token Service
 * Handles JWT token generation, validation, and refresh token management
 *
 * Features:
 * - Access token generation (short-lived)
 * - Refresh token generation (long-lived)
 * - Token validation and decoding
 * - Refresh token storage in database
 * - Automatic token cleanup (revoked/expired)
 * - Device fingerprinting for security
 */

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { User } from '@prisma/client';
import { add, type Duration } from 'date-fns';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  roles: string[];
  tokenVersion: number; // For instant logout
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiryWithRemember: string;
  private readonly refreshTokenExpiryWithoutRemember: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {
    this.accessTokenSecret =
      this.configService.get<string>('jwt.accessSecret')!;
    this.refreshTokenSecret =
      this.configService.get<string>('jwt.refreshSecret')!;
    this.accessTokenExpiry =
      this.configService.get<string>('jwt.accessExpiresIn') || '15m';
    // Banking Model: Different expiry based on Remember Me
    this.refreshTokenExpiryWithRemember =
      this.configService.get<string>('jwt.refreshExpiresInWithRemember') ||
      '7d';
    this.refreshTokenExpiryWithoutRemember =
      this.configService.get<string>('jwt.refreshExpiresInWithoutRemember') ||
      '24h';
  }

  /**
   * Generate access and refresh token pair
   * @param user - User object
   * @param userAgent - Browser/device user agent
   * @param ipAddress - Client IP address
   * @param rememberMe - Keep user logged in longer (7 days vs 24 hours)
   */
  async generateTokenPair(
    user: User,
    userAgent?: string,
    ipAddress?: string,
    rememberMe: boolean = false,
  ): Promise<TokenPair> {
    // Get user roles
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId: user.id,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        role: true,
      },
    });

    const roles = userRoles.map((ur) => ur.role.slug);

    // Generate access token
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
      tokenVersion: user.tokenVersion,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.accessTokenSecret,
      expiresIn: this.accessTokenExpiry as any,
    });

    // Generate refresh token with appropriate expiry based on Remember Me
    const refreshTokenExpiry = rememberMe
      ? this.refreshTokenExpiryWithRemember
      : this.refreshTokenExpiryWithoutRemember;

    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
      tokenVersion: user.tokenVersion,
      type: 'refresh',
    };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.refreshTokenSecret,
      expiresIn: refreshTokenExpiry as any,
    });

    // Store refresh token in database
    await this.storeRefreshToken(
      user.id,
      refreshToken,
      refreshTokenExpiry,
      userAgent,
      ipAddress,
    );

    // Parse expiry to seconds
    const expiresIn = this.parseExpiryToSeconds(this.accessTokenExpiry);

    this.logger.log(
      `Generated token pair for user ${user.email} (Remember Me: ${rememberMe}, Refresh Token Expiry: ${refreshTokenExpiry})`,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.accessTokenSecret,
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException(this.i18n.t('auth.token.invalidType'));
      }

      return payload;
    } catch (error: any) {
      this.logger.error('Access token verification failed', error.message);
      throw new UnauthorizedException(
        this.i18n.t('auth.token.invalidAccessToken'),
      );
    }
  }

  /**
   * Verify and decode refresh token
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.refreshTokenSecret,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException(this.i18n.t('auth.token.invalidType'));
      }

      // Check if token exists in database and is not revoked
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token },
      });

      if (!storedToken) {
        throw new UnauthorizedException(
          this.i18n.t('auth.token.refreshTokenNotFound'),
        );
      }

      if (storedToken.isRevoked) {
        throw new UnauthorizedException(
          this.i18n.t('auth.token.refreshTokenRevoked'),
        );
      }

      if (storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException(
          this.i18n.t('auth.token.refreshTokenExpired'),
        );
      }

      return payload;
    } catch (error: any) {
      this.logger.error('Refresh token verification failed', error.message);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(
        this.i18n.t('auth.token.invalidRefreshToken'),
      );
    }
  }

  /**
   * Detect if a refresh token was created with Remember Me
   * by checking its expiry duration (> 1 day = Remember Me)
   */
  async wasTokenCreatedWithRememberMe(token: string): Promise<boolean> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken) {
      return false;
    }

    // Calculate duration in hours
    const durationMs =
      storedToken.expiresAt.getTime() - storedToken.createdAt.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    // If token expires in more than 25 hours, it was created with Remember Me
    // (24h without Remember Me + 1h buffer for clock skew)
    return durationHours > 25;
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(
    userId: string,
    token: string,
    refreshTokenExpiry: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    const expiresAt = add(new Date(), this.parseDuration(refreshTokenExpiry));

    // Check if token already exists (should not happen, but just in case)
    const existingToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (existingToken) {
      // Update existing token instead of creating new one
      await this.prisma.refreshToken.update({
        where: { token },
        data: {
          isRevoked: false,
          expiresAt,
          userAgent,
          ipAddress,
        },
      });
    } else {
      // Create new token
      await this.prisma.refreshToken.create({
        data: {
          token,
          userId,
          expiresAt,
          userAgent,
          ipAddress,
        },
      });
    }

    // Cleanup old tokens for this user (keep only last 5 active tokens)
    await this.cleanupOldTokens(userId);
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
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    this.logger.log(`Revoked all tokens for user ${userId}`);
  }

  /**
   * Cleanup old/expired tokens for a user
   */
  private async cleanupOldTokens(userId: string): Promise<void> {
    // Get all active tokens for user
    const activeTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Keep only the last 5 tokens
    if (activeTokens.length > 5) {
      const tokensToRevoke = activeTokens.slice(5);
      const tokenIds = tokensToRevoke.map((t) => t.id);

      await this.prisma.refreshToken.updateMany({
        where: { id: { in: tokenIds } },
        data: { isRevoked: true },
      });

      this.logger.debug(
        `Revoked ${tokensToRevoke.length} old tokens for user ${userId}`,
      );
    }

    // Delete expired tokens (older than 30 days)
    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: add(new Date(), { days: -30 }) },
      },
    });
  }

  /**
   * Parse expiry string (e.g., "15m", "7d") to seconds
   */
  private parseExpiryToSeconds(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900; // Default 15 minutes
    }
  }

  /**
   * Parse duration string to date-fns duration object
   */
  private parseDuration(duration: string): Duration {
    const unit = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1));

    switch (unit) {
      case 's':
        return { seconds: value };
      case 'm':
        return { minutes: value };
      case 'h':
        return { hours: value };
      case 'd':
        return { days: value };
      default:
        return { minutes: 15 };
    }
  }
}
