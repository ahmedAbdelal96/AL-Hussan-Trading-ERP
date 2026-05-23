/**
 * Auth Repository Interface
 * Defines contract for authentication data access
 */

import { UserEntity, RefreshTokenEntity } from '../entities';

export interface ActiveTokenWithUserRecord {
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userRoles: Array<{
      role: {
        name: string;
      };
    }>;
  };
}

export interface IAuthRepository {
  // User operations
  findUserByEmail(email: string): Promise<UserEntity | null>;
  findUserById(id: string): Promise<UserEntity | null>;
  findUserWithRoles(
    id: string,
    includePermissions?: boolean,
  ): Promise<UserEntity | null>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  updateUserLastLogin(userId: string, ipAddress?: string): Promise<void>;

  // Login rate limiting operations
  incrementFailedLoginAttempts(userId: string): Promise<number>;
  resetFailedLoginAttempts(userId: string): Promise<void>;
  lockAccountTemporarily(
    userId: string,
    lockDurationMinutes: number,
  ): Promise<void>;
  lockAccountPermanently(userId: string): Promise<void>;
  unlockAccount(userId: string): Promise<void>;

  // Token versioning operations
  incrementTokenVersion(userId: string): Promise<number>;

  // Refresh token operations
  createRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RefreshTokenEntity>;

  findRefreshToken(token: string): Promise<RefreshTokenEntity | null>;
  revokeRefreshToken(token: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;
  revokeAllTokens(): Promise<void>;
  deleteExpiredTokens(): Promise<number>;
  cleanupOldTokens(userId: string, keepLast: number): Promise<number>;

  // Active sessions operations
  getActiveTokensWithUsers(): Promise<ActiveTokenWithUserRecord[]>;
  countActiveSessions(): Promise<number>;
  countUsersWithActiveSessions(): Promise<number>;

  // Audit operations
  createAuditLog(data: {
    userId: string;
    userEmail: string;
    userName: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    resourceName?: string;
    ipAddress?: string;
    userAgent?: string;
    status: string;
  }): Promise<void>;
}
