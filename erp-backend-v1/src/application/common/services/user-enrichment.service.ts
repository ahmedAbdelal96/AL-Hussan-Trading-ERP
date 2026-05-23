import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../infrastructure/logger/winston-logger.service';
import { UserInfo } from '../interfaces/user-info.interface';

/**
 * User Enrichment Service
 *
 * Provides a reusable way to enrich entities with user information
 * for audit fields (createdBy, deletedBy, approvedBy, etc.)
 *
 * Key Features:
 * - Single query to fetch all users (no N+1 problem)
 * - Automatic deduplication of user IDs
 * - Type-safe with UserInfo interface
 * - Graceful handling of missing/deleted users
 * - Reusable across all entities
 *
 * Usage Example:
 * ```typescript
 * const allowances = await prisma.employeeAllowance.findMany();
 * const enriched = await userEnrichment.enrichWithUsers(
 *   allowances,
 *   ['createdBy', 'deletedBy', 'approvedBy']
 * );
 * // enriched items now have: createdByUser, deletedByUser, approvedByUser
 * ```
 */
@Injectable()
export class UserEnrichmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(UserEnrichmentService.name);
  }

  /**
   * Enrich entities with user information
   *
   * @param entities - Array of entities to enrich
   * @param userFields - Array of field names that contain user UUIDs
   * @returns Enriched entities with user objects (field + 'User' suffix)
   *
   * @example
   * enrichWithUsers(allowances, ['createdBy', 'deletedBy'])
   * // Returns: [{ ...allowance, createdByUser: {...}, deletedByUser: {...} }]
   */
  async enrichWithUsers<T extends Record<string, any>>(
    entities: T[],
    userFields: string[],
  ): Promise<T[]> {
    // Handle empty array
    if (!entities || entities.length === 0) {
      return entities;
    }

    try {
      // Step 1: Collect all unique user IDs from specified fields
      const userIds = new Set<string>();

      entities.forEach((entity) => {
        userFields.forEach((field) => {
          const userId = entity[field];
          if (userId && typeof userId === 'string') {
            userIds.add(userId);
          }
        });
      });

      // If no user IDs found, return entities as-is
      if (userIds.size === 0) {
        this.logger.debug('No user IDs found to enrich');
        return entities;
      }

      // Step 2: Fetch all users in a single query
      const users = await this.prisma.user.findMany({
        where: {
          id: { in: Array.from(userIds) },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      this.logger.debug(
        `Fetched ${users.length} users for ${userIds.size} unique IDs`,
      );

      // Step 3: Create a Map for O(1) lookup
      const userMap = new Map<string, UserInfo>(
        users.map((user) => [user.id, user]),
      );

      // Step 4: Enrich entities with user objects
      const enrichedEntities = entities.map((entity) => {
        const enrichment: Record<string, UserInfo | null> = {};

        userFields.forEach((field) => {
          const userId = entity[field];
          const userFieldName = `${field}User`;

          if (userId && typeof userId === 'string') {
            // Add user object or null if not found (user might be deleted)
            enrichment[userFieldName] = userMap.get(userId) || null;

            // Log warning if user not found
            if (!userMap.has(userId)) {
              this.logger.warn(
                `User with ID ${userId} not found for field ${field}`,
              );
            }
          } else {
            // Field is null/undefined
            enrichment[userFieldName] = null;
          }
        });

        return {
          ...entity,
          ...enrichment,
        };
      });

      return enrichedEntities;
    } catch (error) {
      this.logger.error(
        `Failed to enrich entities with users: ${error.message}`,
      );
      // Return original entities on error (graceful degradation)
      return entities;
    }
  }

  /**
   * Fetch user info by ID
   * Utility method for single user lookup
   *
   * @param userId - User UUID
   * @returns UserInfo or null if not found
   */
  async getUserInfo(
    userId: string | null | undefined,
  ): Promise<UserInfo | null> {
    if (!userId) return null;

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      return user;
    } catch (error) {
      this.logger.error(`Failed to fetch user ${userId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch multiple users by IDs
   * Utility method for batch user lookup
   *
   * @param userIds - Array of user UUIDs
   * @returns Map of userId to UserInfo
   */
  async getUsersMap(userIds: string[]): Promise<Map<string, UserInfo>> {
    if (!userIds || userIds.length === 0) {
      return new Map();
    }

    try {
      const users = await this.prisma.user.findMany({
        where: {
          id: { in: userIds },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      return new Map(users.map((user) => [user.id, user]));
    } catch (error) {
      this.logger.error(`Failed to fetch users: ${error.message}`);
      return new Map();
    }
  }
}
