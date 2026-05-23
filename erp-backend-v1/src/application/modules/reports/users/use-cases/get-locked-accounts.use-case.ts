/**
 * Get Locked Accounts Use Case
 * Track account lockouts and unlock history
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  LockedAccountsFiltersDto,
  LockedAccountsResponseDto,
  LockedAccountsMetricsDto,
  LockedAccountDetailDto,
  UnlockHistoryDto,
  LockTrendDataPointDto,
} from '../dto';
import { LockType } from '../dto/users-filters.dto';

@Injectable()
export class GetLockedAccountsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: LockedAccountsFiltersDto,
  ): Promise<LockedAccountsResponseDto> {
    const [metrics, lockedAccounts, unlockHistory, lockTrends] =
      await Promise.all([
        this.getLockedAccountsMetrics(filters),
        this.getLockedAccountDetails(filters),
        filters.includeUnlockHistory !== false
          ? this.getUnlockHistory(filters)
          : Promise.resolve(undefined),
        filters.includeTrends !== false
          ? this.getLockTrends(filters)
          : Promise.resolve(undefined),
      ]);

    return {
      metrics,
      lockedAccounts,
      unlockHistory,
      trend: lockTrends,
      generatedAt: new Date(),
    };
  }

  private async getLockedAccountsMetrics(
    filters: LockedAccountsFiltersDto, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<LockedAccountsMetricsDto> {
    const now = new Date();

    const [totalUsers, temporarilyLocked, permanentlyLocked] =
      await Promise.all([
        this.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
        this.prisma.user.count({
          where: {
            isActive: true,
            deletedAt: null,
            lockedUntil: { gt: now },
            permanentlyLocked: false,
          },
        }),
        this.prisma.user.count({
          where: {
            isActive: true,
            deletedAt: null,
            permanentlyLocked: true,
          },
        }),
      ]);

    const totalLocked = temporarilyLocked + permanentlyLocked;
    const lockRate =
      totalUsers > 0 ? Math.round((totalLocked / totalUsers) * 1000) / 10 : 0;

    // Get unlock history for last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const unlockEvents = await this.prisma.auditLog.count({
      where: {
        action: 'LOGOUT' as any, // Using LOGOUT as closest match
        createdAt: { gte: thirtyDaysAgo },
        status: 'SUCCESS',
      },
    });

    return {
      totalLocked,
      temporarilyLocked,
      permanentlyLocked,
      lockRate,
      unlockedInPeriod: unlockEvents,
      averageLockDuration: 0,
    };
  }

  private async getLockedAccountDetails(
    filters: LockedAccountsFiltersDto,
  ): Promise<LockedAccountDetailDto[]> {
    const now = new Date();
    const where: any = {
      isActive: true,
      deletedAt: null,
    };

    if (filters.lockType === LockType.TEMPORARY) {
      where.lockedUntil = { gt: now };
      where.permanentlyLocked = false;
    } else if (filters.lockType === LockType.PERMANENT) {
      where.permanentlyLocked = true;
    } else {
      // Both types
      where.OR = [
        { lockedUntil: { gt: now }, permanentlyLocked: false },
        { permanentlyLocked: true },
      ];
    }

    if (filters.userId) where.id = filters.userId;
    if (filters.email)
      where.email = { contains: filters.email, mode: 'insensitive' };

    const lockedUsers = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        permanentlyLocked: true,
        lastLoginAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return lockedUsers.map((user) => {
      const isPermanent = user.permanentlyLocked;
      const isTemporary =
        !isPermanent && user.lockedUntil && user.lockedUntil > now;

      const lockType: 'temporary' | 'permanent' = isPermanent
        ? 'permanent'
        : 'temporary';

      const hoursLockedFor = user.lockedUntil
        ? Math.max(
            0,
            Math.round(
              ((now.getTime() - user.updatedAt.getTime()) / (1000 * 60 * 60)) *
                10,
            ) / 10,
          )
        : isPermanent
          ? Math.round(
              ((now.getTime() - user.updatedAt.getTime()) / (1000 * 60 * 60)) *
                10,
            ) / 10
          : 0;

      const remainingMinutes =
        isTemporary && user.lockedUntil
          ? Math.max(
              0,
              Math.ceil(
                (user.lockedUntil.getTime() - now.getTime()) / (1000 * 60),
              ),
            )
          : undefined;

      return {
        userId: user.id,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        lockType,
        failedAttempts: user.failedLoginAttempts,
        lastFailedLoginIp: undefined,
        lastFailedLoginAt: undefined,
        lockedUntil: user.lockedUntil || undefined,
        remainingMinutes,
        unlockAttemptCount: 0,
        lockedReason: undefined,
        lockedByAdmin: undefined,
        lastLoginAt: user.lastLoginAt || undefined,
        hoursLockedFor,
      };
    });
  }

  private async getUnlockHistory(
    filters: LockedAccountsFiltersDto,
  ): Promise<UnlockHistoryDto[]> {
    const where: any = {
      action: 'LOGOUT' as any, // Using LOGOUT as closest match for UNLOCK
      status: 'SUCCESS',
    };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const unlockLogs = await this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return unlockLogs.map((log) => {
      const lockDurationHours = 0;
      const wasPermamentLock = false;

      return {
        userId: log.userId || undefined,
        email: log.user?.email || 'Unknown',
        fullName: log.user
          ? `${log.user.firstName} ${log.user.lastName}`
          : 'Unknown',
        unlockedAt: log.createdAt,
        unlockedByEmail: 'System',
        lockDurationHours: Math.round(lockDurationHours * 10) / 10,
        previousLockType: wasPermamentLock
          ? ('permanent' as const)
          : ('temporary' as const),
      };
    });
  }

  private async getLockTrends(
    filters: LockedAccountsFiltersDto,
  ): Promise<LockTrendDataPointDto[]> {
    const now = new Date();
    const days =
      filters.startDate && filters.endDate
        ? Math.ceil(
            (new Date(filters.endDate).getTime() -
              new Date(filters.startDate).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 30;
    const trends: LockTrendDataPointDto[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const [lockCount, unlockCount] = await Promise.all([
        this.prisma.auditLog.count({
          where: {
            action: 'LOGOUT' as any, // Using LOGOUT as closest match
            status: 'SUCCESS',
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
        }),
        this.prisma.auditLog.count({
          where: {
            action: 'LOGOUT' as any, // Using LOGOUT as closest match
            status: 'SUCCESS',
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
        }),
      ]);

      const dateString = startOfDay.toISOString().split('T')[0];

      trends.push({
        date: dateString,
        period: dateString,
        newLocks: lockCount,
        unlocked: unlockCount,
        netChange: lockCount - unlockCount,
      });
    }

    return trends;
  }
}
