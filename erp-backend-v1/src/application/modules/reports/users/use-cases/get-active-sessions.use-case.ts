/**
 * Get Active Sessions Use Case
 * Track active user sessions and device usage
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  ActiveSessionsFiltersDto,
  ActiveSessionsResponseDto,
  ActiveSessionsMetricsDto,
  UserActiveSessionDto,
  SessionDeviceDto,
  DeviceTypeDistributionDto,
} from '../dto';

@Injectable()
export class GetActiveSessionsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: ActiveSessionsFiltersDto,
  ): Promise<ActiveSessionsResponseDto> {
    const where = this.buildWhereClause(filters);

    const [metrics, usersWithSessions, deviceDistribution] = await Promise.all([
      this.getSessionMetrics(where),
      this.getUsersWithSessions(filters, where),
      filters.includeDeviceAnalysis !== false
        ? this.getDeviceDistribution(where)
        : Promise.resolve(undefined),
    ]);

    const topUsersBySessions = [...usersWithSessions]
      .sort((a, b) => b.activeSessionsCount - a.activeSessionsCount)
      .slice(0, filters.topUsersLimit || 20);

    return {
      metrics,
      usersWithSessions,
      topUsersBySessions,
      deviceDistribution,
      generatedAt: new Date(),
    };
  }

  private buildWhereClause(filters: ActiveSessionsFiltersDto): any {
    const where: any = {};
    const now = new Date();

    if (!filters.includeRevoked) {
      where.isRevoked = false;
    }

    if (!filters.includeExpired) {
      where.expiresAt = { gt: now };
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    return where;
  }

  private async getSessionMetrics(
    where: any,
  ): Promise<ActiveSessionsMetricsDto> {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [
      totalSessions,
      usersWithSessions,
      usersWithoutSessions,
      expiringIn24Hours,
    ] = await Promise.all([
      this.prisma.refreshToken.count({ where }),
      this.prisma.refreshToken.findMany({
        where,
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.user.count({
        where: {
          isActive: true,
          deletedAt: null,
          refreshTokens: { none: { isRevoked: false, expiresAt: { gt: now } } },
        },
      }),
      this.prisma.refreshToken.count({
        where: {
          ...where,
          expiresAt: { gte: now, lte: in24Hours },
        },
      }),
    ]);

    const uniqueUsers = usersWithSessions.length;
    const avgSessionsPerUser =
      uniqueUsers > 0
        ? Math.round((totalSessions / uniqueUsers) * 100) / 100
        : 0;

    const userSessionCounts = await this.prisma.refreshToken.groupBy({
      by: ['userId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    });

    const maxSessionsPerUser = userSessionCounts[0]?._count.id || 0;

    return {
      totalActiveSessions: totalSessions,
      usersWithActiveSessions: uniqueUsers,
      usersWithoutSessions,
      averageSessionsPerUser: avgSessionsPerUser,
      maxSessionsPerUser,
      expiringIn24Hours,
    };
  }

  private async getUsersWithSessions(
    filters: ActiveSessionsFiltersDto,
    where: any,
  ): Promise<UserActiveSessionDto[]> {
    const minSessions = filters.minSessions || 1;

    const sessions = await this.prisma.refreshToken.groupBy({
      by: ['userId'],
      where,
      _count: { id: true },
      having: {
        id: { _count: { gte: minSessions } },
      },
    });

    const userIds = sessions.map((s) => s.userId);
    if (userIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        lastLoginAt: true,
        isActive: true,
        refreshTokens: filters.includeDeviceDetails
          ? {
              where,
              select: {
                id: true,
                userAgent: true,
                ipAddress: true,
                createdAt: true,
                expiresAt: true,
              },
            }
          : false,
      },
    });

    return users.map((user) => {
      const sessionCount =
        sessions.find((s) => s.userId === user.id)?._count.id || 0;
      const devices = filters.includeDeviceDetails
        ? (user.refreshTokens || []).map(
            (token): SessionDeviceDto => this.parseSessionDevice(token),
          )
        : undefined;

      return {
        userId: user.id,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        activeSessionsCount: sessionCount,
        lastActivity: user.lastLoginAt,
        isActive: user.isActive,
        devices,
      };
    });
  }

  private parseSessionDevice(token: any): SessionDeviceDto {
    const now = new Date();
    const hoursUntilExpiration =
      (token.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    const userAgent = (token.userAgent as string) || 'Unknown';

    return {
      sessionId: token.id,
      userAgent,
      ipAddress: token.ipAddress || 'Unknown',
      deviceType: this.getDeviceType(userAgent),
      browser: this.getBrowser(userAgent),
      os: this.getOS(userAgent),
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      hoursUntilExpiration: Math.max(
        0,
        Math.round(hoursUntilExpiration * 10) / 10,
      ),
      isActive: token.expiresAt > now,
    };
  }

  private async getDeviceDistribution(
    where: any,
  ): Promise<DeviceTypeDistributionDto[]> {
    const sessions = await this.prisma.refreshToken.findMany({
      where,
      select: { userAgent: true },
    });

    const deviceCounts = new Map<string, number>();
    sessions.forEach((session) => {
      const deviceType = this.getDeviceType(
        (session.userAgent as string) || '',
      );
      deviceCounts.set(deviceType, (deviceCounts.get(deviceType) || 0) + 1);
    });

    const total = sessions.length;
    return Array.from(deviceCounts.entries())
      .map(([deviceType, count]) => ({
        deviceType,
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private getDeviceType(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (
      ua.includes('mobile') ||
      ua.includes('android') ||
      ua.includes('iphone')
    )
      return 'mobile';
    if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
    return 'desktop';
  }

  private getBrowser(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    return 'Unknown';
  }

  private getOS(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad'))
      return 'iOS';
    return 'Unknown';
  }
}
