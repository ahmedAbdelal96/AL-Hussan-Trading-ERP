/**
 * Get Active Sessions Use Case
 *
 * Business Logic:
 * - Retrieves all active refresh tokens (non-revoked, non-expired)
 * - Groups them by user for better organization
 * - Returns user information with their active session count
 * - Requires ADMIN or SUPERADMIN role to access
 *
 * Security Considerations:
 * - Only returns essential user information (no passwords)
 * - Filters out expired tokens automatically
 * - Includes device fingerprinting data for audit
 */

import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import type { IAuthRepository } from '../repositories';
import { AUTH_REPOSITORY } from '../repositories';

/**
 * DTO for active session response
 */
export interface ActiveSessionDto {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  activeSessions: number;
  lastActivity?: Date;
  devices?: {
    userAgent: string;
    ipAddress: string;
    createdAt: Date;
  }[];
}

@Injectable()
export class GetActiveSessionsUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetActiveSessionsUseCase.name);
  }

  /**
   * Execute: Get all users with active sessions
   *
   * @param requestingUserId - ID of the user making the request
   * @returns Array of users with their active sessions
   */
  async execute(requestingUserId: string): Promise<ActiveSessionDto[]> {
    this.logger.log(
      `Getting active sessions requested by user: ${requestingUserId}`,
    );

    // 1. Verify requesting user has appropriate role
    const requestingUser = await this.authRepository.findUserWithRoles(
      requestingUserId,
      false,
    );

    if (!requestingUser) {
      throw new ForbiddenException('User not found');
    }

    // Normalize roles to uppercase for case-insensitive comparison
    const userRoles =
      requestingUser.roles?.map((role) => role.toUpperCase()) || [];

    const hasPermission =
      userRoles.includes('SUPERADMIN') || userRoles.includes('ADMIN');

    if (!hasPermission) {
      this.logger.warn(
        `Unauthorized active sessions access attempt by user: ${requestingUser.email} with roles: ${userRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        'Only ADMIN or SUPERADMIN can view active sessions',
      );
    }

    // 2. Get all active refresh tokens from database
    // Note: Using raw query for performance since we need to join and group
    const activeSessions = await this.getActiveTokensGroupedByUser();

    this.logger.log(
      `Found ${activeSessions.length} users with active sessions`,
    );

    return activeSessions;
  }

  /**
   * Helper: Get active tokens grouped by user
   *
   * Performance Optimization:
   * - Uses single query with grouping instead of N+1 queries
   * - Filters at database level for better performance
   * - Only fetches necessary fields to reduce payload
   */
  private async getActiveTokensGroupedByUser(): Promise<ActiveSessionDto[]> {
    // Get all active tokens with user information
    const tokens = await this.authRepository.getActiveTokensWithUsers();

    // Group by user and aggregate session information
    const userSessionMap = new Map<string, ActiveSessionDto>();

    for (const token of tokens) {
      const userId = token.userId;

      if (!userSessionMap.has(userId)) {
        const roles =
          token.user.userRoles.map(({ role }) => role.name).filter(Boolean) ||
          [];
        userSessionMap.set(userId, {
          userId: token.user.id,
          email: token.user.email,
          fullName: `${token.user.firstName} ${token.user.lastName}`,
          role: roles[0] || 'USER',
          activeSessions: 0,
          devices: [],
        });
      }

      const userSession = userSessionMap.get(userId)!;
      userSession.activeSessions++;

      // Add device information
      if (token.userAgent || token.ipAddress) {
        userSession.devices!.push({
          userAgent: token.userAgent || 'Unknown',
          ipAddress: token.ipAddress || 'Unknown',
          createdAt: token.createdAt,
        });
      }

      // Track most recent activity
      if (
        !userSession.lastActivity ||
        token.createdAt > userSession.lastActivity
      ) {
        userSession.lastActivity = token.createdAt;
      }
    }

    // Convert map to array and sort by most recent activity
    return Array.from(userSessionMap.values()).sort((a, b) => {
      const dateA = a.lastActivity?.getTime() || 0;
      const dateB = b.lastActivity?.getTime() || 0;
      return dateB - dateA; // Most recent first
    });
  }
}
