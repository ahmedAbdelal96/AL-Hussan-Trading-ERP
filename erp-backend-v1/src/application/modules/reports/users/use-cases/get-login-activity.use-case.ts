/**
 * ============================================================================
 * GET LOGIN ACTIVITY USE CASE
 * ============================================================================
 *
 * Comprehensive login activity tracking and analysis.
 *
 * Features:
 * - Login/failure metrics and rates
 * - Most active users tracking
 * - Inactive users identification
 * - Login trends (daily/weekly/monthly)
 * - Peak hours analysis
 *
 * Performance:
 * - Efficient AuditLog queries with indexes
 * - Parallel data retrieval
 * - Configurable limits and grouping
 *
 * @module GetLoginActivityUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  LoginActivityFiltersDto,
  LoginActivityResponseDto,
  LoginActivityKPIDto,
  UserLoginDetailDto,
  LoginTrendDataPointDto,
  PeakHourDto,
  LoginActivityGroupBy,
} from '../dto';

@Injectable()
export class GetLoginActivityUseCase {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute: Generate login activity report
   */
  async execute(
    filters: LoginActivityFiltersDto,
  ): Promise<LoginActivityResponseDto> {
    const whereClause = this.buildWhereClause(filters);

    // Execute queries in parallel
    const [kpis, mostActiveUsers, inactiveUsers, trend, peakHours] =
      await Promise.all([
        this.getLoginKPIs(whereClause),
        this.getMostActiveUsers(filters, whereClause),
        this.getInactiveUsers(filters),
        filters.includeTrend !== false
          ? this.getLoginTrend(whereClause, filters.groupBy)
          : Promise.resolve(undefined),
        filters.includePeakHours !== false
          ? this.getPeakHours(whereClause)
          : Promise.resolve(undefined),
      ]);

    return {
      kpis,
      mostActiveUsers,
      inactiveUsers,
      trend,
      peakHours,
      generatedAt: new Date(),
    };
  }

  /**
   * Build where clause for AuditLog queries
   */
  private buildWhereClause(filters: LoginActivityFiltersDto): any {
    const where: any = {
      action: { in: ['LOGIN', 'LOGOUT'] },
    };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.email) {
      where.userEmail = { contains: filters.email, mode: 'insensitive' };
    }

    return where;
  }

  /**
   * Calculate login KPIs
   */
  private async getLoginKPIs(whereClause: any): Promise<LoginActivityKPIDto> {
    // Get all login attempts
    const [successfulLogins, failedLogins, uniqueUsers] = await Promise.all([
      this.prisma.auditLog.count({
        where: {
          ...whereClause,
          action: 'LOGIN',
          status: 'SUCCESS',
        },
      }),
      this.prisma.auditLog.count({
        where: {
          ...whereClause,
          action: 'LOGIN',
          status: { in: ['FAILED', 'UNAUTHORIZED'] },
        },
      }),
      this.prisma.auditLog.findMany({
        where: {
          ...whereClause,
          action: 'LOGIN',
          status: 'SUCCESS',
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
    ]);

    const totalAttempts = successfulLogins + failedLogins;
    const successRate =
      totalAttempts > 0
        ? Math.round((successfulLogins / totalAttempts) * 1000) / 10
        : 0;
    const failureRate = totalAttempts > 0 ? 100 - successRate : 0;

    return {
      totalAttempts,
      successfulLogins,
      failedLogins,
      successRate,
      failureRate,
      uniqueUsers: uniqueUsers.length,
    };
  }

  /**
   * Get most active users
   */
  private async getMostActiveUsers(
    filters: LoginActivityFiltersDto,
    whereClause: any,
  ): Promise<UserLoginDetailDto[]> {
    const limit = filters.topUsersLimit || 20;

    // Get login counts per user
    const loginCounts = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        ...whereClause,
        action: 'LOGIN',
        userId: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    const userIds = loginCounts
      .map((lc) => lc.userId)
      .filter((id): id is string => id !== null);

    if (userIds.length === 0) {
      return [];
    }

    // Get user details
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        lastLoginAt: true,
        lastLoginIp: true,
        failedLoginAttempts: true,
        isActive: true,
      },
    });

    // Map to response DTOs
    const now = new Date();
    return loginCounts
      .map((lc) => {
        const user = users.find((u) => u.id === lc.userId);
        if (!user) return null;

        const daysSinceLastLogin = user.lastLoginAt
          ? Math.floor(
              (now.getTime() - user.lastLoginAt.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null;

        return {
          userId: user.id,
          email: user.email,
          fullName: `${user.firstName} ${user.lastName}`,
          lastLoginAt: user.lastLoginAt,
          lastLoginIp: user.lastLoginIp,
          loginCount: lc._count.id,
          failedAttempts: user.failedLoginAttempts,
          daysSinceLastLogin,
          isActive: user.isActive,
        };
      })
      .filter((item): item is UserLoginDetailDto => item !== null);
  }

  /**
   * Get inactive users (not logged in for X days)
   */
  private async getInactiveUsers(
    filters: LoginActivityFiltersDto,
  ): Promise<UserLoginDetailDto[]> {
    const inactiveDays = filters.inactiveDays || 30;
    const thresholdDate = new Date(
      Date.now() - inactiveDays * 24 * 60 * 60 * 1000,
    );

    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [{ lastLoginAt: { lt: thresholdDate } }, { lastLoginAt: null }],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        lastLoginAt: true,
        lastLoginIp: true,
        failedLoginAttempts: true,
        isActive: true,
      },
      take: 100, // Limit for performance
    });

    const now = new Date();
    return users.map((user) => ({
      userId: user.id,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`,
      lastLoginAt: user.lastLoginAt,
      lastLoginIp: user.lastLoginIp,
      loginCount: 0,
      failedAttempts: user.failedLoginAttempts,
      daysSinceLastLogin: user.lastLoginAt
        ? Math.floor(
            (now.getTime() - user.lastLoginAt.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null,
      isActive: user.isActive,
    }));
  }

  /**
   * Get login trend over time
   */
  private async getLoginTrend(
    whereClause: any,
    groupBy?: LoginActivityGroupBy,
  ): Promise<LoginTrendDataPointDto[]> {
    const groupByValue = groupBy || LoginActivityGroupBy.DAILY;

    // Get all login attempts
    const logs = await this.prisma.auditLog.findMany({
      where: {
        ...whereClause,
        action: 'LOGIN',
      },
      select: {
        createdAt: true,
        status: true,
        userId: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by period
    const grouped = new Map<string, LoginTrendDataPointDto>();

    logs.forEach((log) => {
      const period = this.getPeriodKey(log.createdAt, groupByValue);
      const existing = grouped.get(period) || {
        period,
        successfulLogins: 0,
        failedLogins: 0,
        totalAttempts: 0,
        uniqueUsers: 0,
      };

      if (log.status === 'SUCCESS') {
        existing.successfulLogins++;
      } else {
        existing.failedLogins++;
      }
      existing.totalAttempts++;

      grouped.set(period, existing);
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  /**
   * Get peak login hours
   */
  private async getPeakHours(whereClause: any): Promise<PeakHourDto[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        ...whereClause,
        action: 'LOGIN',
        status: 'SUCCESS',
      },
      select: {
        createdAt: true,
      },
    });

    // Group by hour
    const hourCounts = new Map<number, number>();
    logs.forEach((log) => {
      const hour = log.createdAt.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const total = logs.length;

    // Convert to array and calculate percentages
    const peakHours: PeakHourDto[] = Array.from(hourCounts.entries())
      .map(([hour, count]) => ({
        hour,
        loginCount: count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.loginCount - a.loginCount);

    return peakHours.slice(0, 10); // Top 10 peak hours
  }

  /**
   * Helper: Get period key based on grouping
   */
  private getPeriodKey(date: Date, groupBy: LoginActivityGroupBy): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (groupBy) {
      case LoginActivityGroupBy.DAILY: {
        return `${year}-${month}-${day}`;
      }
      case LoginActivityGroupBy.WEEKLY: {
        const weekNumber = this.getWeekNumber(date);
        return `${year}-W${String(weekNumber).padStart(2, '0')}`;
      }
      case LoginActivityGroupBy.MONTHLY: {
        return `${year}-${month}`;
      }
      default: {
        return `${year}-${month}-${day}`;
      }
    }
  }

  /**
   * Helper: Get ISO week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
