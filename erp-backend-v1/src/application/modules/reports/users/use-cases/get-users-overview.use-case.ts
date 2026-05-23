/**
 * ============================================================================
 * GET USERS OVERVIEW USE CASE
 * ============================================================================
 *
 * Executive dashboard providing comprehensive user base health metrics.
 *
 * Features:
 * - User KPIs (total/active/inactive/deleted/growth)
 * - Lock statistics (temporary/permanent locks)
 * - Session statistics (active sessions/average per user)
 * - Role distribution across user base
 *
 * Performance:
 * - Parallel queries for optimal performance
 * - Efficient aggregations with Prisma
 * - Minimal database load
 * - Response time target: <500ms
 *
 * @module GetUsersOverviewUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  UsersOverviewFiltersDto,
  UsersOverviewResponseDto,
  UserKPIDto,
  LockStatisticsDto,
  SessionStatisticsDto,
  RoleDistributionItemDto,
} from '../dto';

@Injectable()
export class GetUsersOverviewUseCase {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute: Generate users overview report
   *
   * Strategy:
   * 1. Build base where clause from filters
   * 2. Execute parallel queries for all metrics
   * 3. Calculate derived metrics (percentages, rates)
   * 4. Return comprehensive overview
   */
  async execute(
    filters: UsersOverviewFiltersDto,
  ): Promise<UsersOverviewResponseDto> {
    const whereClause = this.buildWhereClause(filters);

    // Execute all queries in parallel for performance
    const [kpis, lockStats, sessionStats, roleDistribution] = await Promise.all(
      [
        this.getUserKPIs(whereClause, filters),
        this.getLockStatistics(whereClause),
        this.getSessionStatistics(),
        filters.includeRoleDistribution !== false
          ? this.getRoleDistribution(whereClause)
          : Promise.resolve([]),
      ],
    );

    return {
      kpis,
      lockStatistics: lockStats,
      sessionStatistics: sessionStats,
      roleDistribution,
      generatedAt: new Date(),
    };
  }

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(filters: UsersOverviewFiltersDto): any {
    const where: any = {};

    // Date range filtering
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    // Active status filter (default: active users only)
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Exclude deleted users by default
    if (!filters.includeDeleted) {
      where.deletedAt = null;
    }

    // User ID filter
    if (filters.userId) {
      where.id = filters.userId;
    }

    // Email filter
    if (filters.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }

    return where;
  }

  /**
   * Calculate User KPIs
   *
   * Metrics:
   * - Total/Active/Inactive/Deleted users
   * - Active percentage
   * - Growth metrics (7/30 days)
   * - Growth rate
   */
  private async getUserKPIs(
    whereClause: any,
    filters: UsersOverviewFiltersDto,
  ): Promise<UserKPIDto> {
    // Get user counts in parallel
    const [totalUsers, activeUsers, inactiveUsers, deletedUsers] =
      await Promise.all([
        // Total users
        this.prisma.user.count({
          where: {
            ...whereClause,
            deletedAt: filters.includeDeleted ? undefined : null,
          },
        }),

        // Active users
        this.prisma.user.count({
          where: {
            ...whereClause,
            isActive: true,
            deletedAt: null,
          },
        }),

        // Inactive users
        this.prisma.user.count({
          where: {
            ...whereClause,
            isActive: false,
            deletedAt: null,
          },
        }),

        // Deleted users (if included)
        filters.includeDeleted
          ? this.prisma.user.count({
              where: {
                ...whereClause,
                deletedAt: { not: null },
              },
            })
          : Promise.resolve(0),
      ]);

    // Calculate growth metrics
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [newUsersLast7Days, newUsersLast30Days] = await Promise.all([
      this.prisma.user.count({
        where: {
          createdAt: { gte: sevenDaysAgo },
          deletedAt: null,
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          deletedAt: null,
        },
      }),
    ]);

    // Calculate derived metrics
    const activePercentage =
      totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 1000) / 10 : 0;

    // Growth rate: (new users in last 30 days / total users) * 100
    const growthRate =
      totalUsers > 0
        ? Math.round((newUsersLast30Days / totalUsers) * 1000) / 10
        : 0;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      deletedUsers,
      activePercentage,
      newUsersLast7Days,
      newUsersLast30Days,
      growthRate,
    };
  }

  /**
   * Calculate Lock Statistics
   *
   * Metrics:
   * - Total locked accounts
   * - Temporary vs. permanent locks
   * - Lock rate percentage
   */
  private async getLockStatistics(
    whereClause: any,
  ): Promise<LockStatisticsDto> {
    const now = new Date();

    // Count locked accounts in parallel
    const [temporarilyLocked, permanentlyLocked, totalUsers] =
      await Promise.all([
        // Temporarily locked (lockedUntil > now)
        this.prisma.user.count({
          where: {
            ...whereClause,
            lockedUntil: { gt: now },
            permanentlyLocked: false,
            deletedAt: null,
          },
        }),

        // Permanently locked
        this.prisma.user.count({
          where: {
            ...whereClause,
            permanentlyLocked: true,
            deletedAt: null,
          },
        }),

        // Total users for rate calculation
        this.prisma.user.count({
          where: {
            ...whereClause,
            deletedAt: null,
          },
        }),
      ]);

    const totalLocked = temporarilyLocked + permanentlyLocked;
    const lockRate =
      totalUsers > 0 ? Math.round((totalLocked / totalUsers) * 1000) / 10 : 0;

    return {
      totalLocked,
      temporarilyLocked,
      permanentlyLocked,
      lockRate,
    };
  }

  /**
   * Calculate Session Statistics
   *
   * Metrics:
   * - Active sessions count
   * - Users with active sessions
   * - Average sessions per user
   */
  private async getSessionStatistics(): Promise<SessionStatisticsDto> {
    const now = new Date();

    // Count active sessions and users with sessions
    const [activeSessions, usersWithSessions] = await Promise.all([
      // Active sessions (not revoked, not expired)
      this.prisma.refreshToken.count({
        where: {
          isRevoked: false,
          expiresAt: { gt: now },
        },
      }),

      // Unique users with active sessions
      this.prisma.refreshToken.findMany({
        where: {
          isRevoked: false,
          expiresAt: { gt: now },
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      }),
    ]);

    const uniqueUsersWithSessions = usersWithSessions.length;

    // Calculate average sessions per user
    const averageSessionsPerUser =
      uniqueUsersWithSessions > 0
        ? Math.round((activeSessions / uniqueUsersWithSessions) * 100) / 100
        : 0;

    return {
      activeSessions,
      usersWithSessions: uniqueUsersWithSessions,
      averageSessionsPerUser,
    };
  }

  /**
   * Calculate Role Distribution
   *
   * Shows user count per role with percentages.
   * Useful for understanding access control patterns.
   */
  private async getRoleDistribution(
    whereClause: any,
  ): Promise<RoleDistributionItemDto[]> {
    // Get total users for percentage calculation
    const totalUsers = await this.prisma.user.count({
      where: {
        ...whereClause,
        deletedAt: null,
      },
    });

    if (totalUsers === 0) {
      return [];
    }

    // Get user-role assignments with role details
    const userRoles = await this.prisma.userRole.groupBy({
      by: ['roleId'],
      where: {
        isActive: true,
        user: {
          ...whereClause,
          deletedAt: null,
        },
      },
      _count: {
        userId: true,
      },
    });

    // Get role details
    const roleIds = userRoles.map((ur) => ur.roleId);
    const roles = await this.prisma.role.findMany({
      where: {
        id: { in: roleIds },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    // Map roles to distribution items
    const distribution: RoleDistributionItemDto[] = userRoles.map((ur) => {
      const role = roles.find((r) => r.id === ur.roleId);
      const usersCount = ur._count.userId;
      const percentage = Math.round((usersCount / totalUsers) * 1000) / 10;

      return {
        roleId: ur.roleId,
        roleName: role?.name || 'Unknown',
        roleSlug: role?.slug || 'unknown',
        usersCount,
        percentage,
      };
    });

    // Sort by user count descending
    return distribution.sort((a, b) => b.usersCount - a.usersCount);
  }
}
