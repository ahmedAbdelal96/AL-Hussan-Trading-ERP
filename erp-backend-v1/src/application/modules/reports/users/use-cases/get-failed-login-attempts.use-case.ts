/**
 * Get Failed Login Attempts Use Case
 * Security monitoring for authentication failures
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  FailedLoginAttemptsFiltersDto,
  FailedLoginAttemptsResponseDto,
  FailedLoginSecurityMetricsDto,
  UserFailedLoginDto,
  SuspiciousIpDto,
} from '../dto';

@Injectable()
export class GetFailedLoginAttemptsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: FailedLoginAttemptsFiltersDto,
  ): Promise<FailedLoginAttemptsResponseDto> {
    const where = this.buildWhereClause(filters);

    const [metrics, usersWithFailures, suspiciousIps, recentlyLocked] =
      await Promise.all([
        this.getSecurityMetrics(where),
        this.getUsersWithFailures(filters),
        filters.includeIpAnalysis !== false
          ? this.getSuspiciousIps()
          : Promise.resolve(undefined),
        filters.includeRecentlyLocked !== false
          ? this.getRecentlyLockedAccounts()
          : Promise.resolve(undefined),
      ]);

    const atRiskUsers =
      filters.includeAtRiskUsers !== false
        ? usersWithFailures.filter(
            (u) => u.currentFailedAttempts >= 3 && u.currentFailedAttempts < 5,
          )
        : [];

    return {
      metrics,
      usersWithFailures,
      atRiskUsers,
      suspiciousIps,
      recentlyLocked,
      generatedAt: new Date(),
    };
  }

  private buildWhereClause(filters: FailedLoginAttemptsFiltersDto): any {
    const where: any = {};

    if (filters.startDate || filters.endDate) {
      where.lastFailedLoginAt = {};
      if (filters.startDate)
        where.lastFailedLoginAt.gte = new Date(filters.startDate);
      if (filters.endDate)
        where.lastFailedLoginAt.lte = new Date(filters.endDate);
    }

    if (filters.minFailedAttempts !== undefined) {
      where.failedLoginAttempts = { gte: filters.minFailedAttempts };
    }

    if (filters.userId) where.id = filters.userId;
    if (filters.email)
      where.email = { contains: filters.email, mode: 'insensitive' };

    return where;
  }

  private async getSecurityMetrics(
    where: any,
  ): Promise<FailedLoginSecurityMetricsDto> {
    const [
      totalFailedAttempts,
      uniqueUsersWithFailures,
      atRiskCount,
      recentlyLockedCount,
    ] = await Promise.all([
      this.prisma.user.aggregate({
        where: { ...where, failedLoginAttempts: { gt: 0 }, deletedAt: null },
        _sum: { failedLoginAttempts: true },
      }),
      this.prisma.user.count({
        where: { ...where, failedLoginAttempts: { gt: 0 }, deletedAt: null },
      }),
      this.prisma.user.count({
        where: {
          failedLoginAttempts: { gte: 3, lt: 5 },
          deletedAt: null,
          permanentlyLocked: false,
          lockedUntil: { lte: new Date() },
        },
      }),
      this.prisma.user.count({
        where: {
          lockedUntil: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          deletedAt: null,
        },
      }),
    ]);

    const total = totalFailedAttempts._sum.failedLoginAttempts || 0;
    const avgFailedAttempts =
      uniqueUsersWithFailures > 0
        ? Math.round((total / uniqueUsersWithFailures) * 10) / 10
        : 0;

    return {
      totalFailedAttempts: total,
      uniqueUsersWithFailures,
      uniqueIpsWithFailures: 0,
      atRiskUsersCount: atRiskCount,
      recentlyLockedCount,
      averageFailedAttemptsPerUser: avgFailedAttempts,
    };
  }

  private async getUsersWithFailures(
    filters: FailedLoginAttemptsFiltersDto,
  ): Promise<UserFailedLoginDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        failedLoginAttempts: { gte: filters.minFailedAttempts || 1 },
        deletedAt: null,
        ...(filters.userId ? { id: filters.userId } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        failedLoginAttempts: true,
        lastFailedLoginAt: true,
        lockedUntil: true,
        permanentlyLocked: true,
        isActive: true,
      },
      orderBy: { failedLoginAttempts: 'desc' },
      take: 100,
    });

    const now = new Date();
    return users.map((user) => {
      const isTemporarilyLocked = user.lockedUntil && user.lockedUntil > now;
      const remainingLockMinutes = isTemporarilyLocked
        ? Math.ceil((user.lockedUntil!.getTime() - now.getTime()) / 60000)
        : null;

      let lockStatus:
        | 'none'
        | 'at_risk'
        | 'temporarily_locked'
        | 'permanently_locked' = 'none';
      if (user.permanentlyLocked) lockStatus = 'permanently_locked';
      else if (isTemporarilyLocked) lockStatus = 'temporarily_locked';
      else if (user.failedLoginAttempts >= 3) lockStatus = 'at_risk';

      return {
        userId: user.id,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        currentFailedAttempts: user.failedLoginAttempts,
        lastFailedLoginAt: user.lastFailedLoginAt,
        lastFailedLoginIp: null,
        lockStatus,
        lockedUntil: user.lockedUntil,
        remainingLockMinutes,
        isActive: user.isActive,
      };
    });
  }

  private getSuspiciousIps(): Promise<SuspiciousIpDto[] | undefined> {
    // For now, return empty array - would need IP tracking in AuditLog
    return Promise.resolve([]);
  }

  private async getRecentlyLockedAccounts(): Promise<
    UserFailedLoginDto[] | undefined
  > {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const now = new Date();

    const users = await this.prisma.user.findMany({
      where: {
        lockedUntil: { gte: yesterday },
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        failedLoginAttempts: true,
        lastFailedLoginAt: true,
        lockedUntil: true,
        permanentlyLocked: true,
        isActive: true,
      },
      orderBy: { lockedUntil: 'desc' },
      take: 20,
    });

    return users.map((user) => ({
      userId: user.id,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`,
      currentFailedAttempts: user.failedLoginAttempts,
      lastFailedLoginAt: user.lastFailedLoginAt,
      lastFailedLoginIp: null,
      lockStatus: user.permanentlyLocked
        ? ('permanently_locked' as const)
        : ('temporarily_locked' as const),
      lockedUntil: user.lockedUntil,
      remainingLockMinutes:
        user.lockedUntil && user.lockedUntil > now
          ? Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000)
          : null,
      isActive: user.isActive,
    }));
  }
}
