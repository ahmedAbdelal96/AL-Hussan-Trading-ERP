/**
 * ============================================================================
 * AUDIT ANALYTICS SERVICE
 * ============================================================================
 *
 * Provides analytics and insights from audit logs.
 * Helps management identify patterns, anomalies, and security risks.
 *
 * Features:
 * - User activity patterns
 * - Suspicious activity detection
 * - Resource access frequency
 * - Failed operation analysis
 * - Time-based analytics
 *
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { AuditAction, AuditStatus } from '@prisma/client';

interface ActivityPattern {
  userId: string;
  userEmail: string;
  totalActions: number;
  failedActions: number;
  successRate: number;
  mostCommonAction: string;
  mostAccessedResource: string;
  timeRange: {
    first: Date;
    last: Date;
  };
}

interface SuspiciousActivity {
  userId: string;
  userEmail: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  failedAttempts: number;
  timeWindow: string;
  details: any;
}

@Injectable()
export class AuditAnalyticsService {
  private readonly logger = new Logger(AuditAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user activity patterns
   */
  async getUserActivityPatterns(
    startDate?: Date,
    endDate?: Date,
  ): Promise<ActivityPattern[]> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const end = endDate || new Date();

    // Get all user activities
    const activities = await this.prisma.auditLog.groupBy({
      by: ['userId', 'userEmail'],
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        userId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      _min: {
        createdAt: true,
      },
      _max: {
        createdAt: true,
      },
    });

    // Get detailed patterns for each user
    const patterns: ActivityPattern[] = [];

    for (const activity of activities) {
      if (!activity.userId) continue;

      const [successCount, failedCount, actions, resources] = await Promise.all(
        [
          this.prisma.auditLog.count({
            where: {
              userId: activity.userId,
              status: AuditStatus.SUCCESS,
              createdAt: { gte: start, lte: end },
            },
          }),
          this.prisma.auditLog.count({
            where: {
              userId: activity.userId,
              status: AuditStatus.FAILED,
              createdAt: { gte: start, lte: end },
            },
          }),
          this.prisma.auditLog.groupBy({
            by: ['action'],
            where: {
              userId: activity.userId,
              createdAt: { gte: start, lte: end },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 1,
          }),
          this.prisma.auditLog.groupBy({
            by: ['resourceType'],
            where: {
              userId: activity.userId,
              createdAt: { gte: start, lte: end },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 1,
          }),
        ],
      );

      const totalActions = successCount + failedCount;

      patterns.push({
        userId: activity.userId,
        userEmail: activity.userEmail || 'Unknown',
        totalActions,
        failedActions: failedCount,
        successRate: totalActions > 0 ? (successCount / totalActions) * 100 : 0,
        mostCommonAction: actions[0]?.action || 'N/A',
        mostAccessedResource: resources[0]?.resourceType || 'N/A',
        timeRange: {
          first: activity._min.createdAt!,
          last: activity._max.createdAt!,
        },
      });
    }

    return patterns.sort((a, b) => b.totalActions - a.totalActions);
  }

  /**
   * Detect suspicious activities
   */
  async detectSuspiciousActivities(
    timeWindowMinutes: number = 60,
  ): Promise<SuspiciousActivity[]> {
    const cutoffDate = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const suspicious: SuspiciousActivity[] = [];

    // 1. Multiple failed login attempts
    const failedLogins = await this.prisma.auditLog.groupBy({
      by: ['userId', 'userEmail'],
      where: {
        action: AuditAction.LOGIN,
        status: AuditStatus.FAILED,
        createdAt: {
          gte: cutoffDate,
        },
      },
      _count: { id: true },
      having: {
        id: {
          _count: {
            gte: 5, // 5+ failed attempts
          },
        },
      },
    });

    for (const failed of failedLogins) {
      suspicious.push({
        userId: failed.userId || 'Unknown',
        userEmail: failed.userEmail || 'Unknown',
        reason: 'Multiple failed login attempts',
        severity: failed._count.id >= 10 ? 'CRITICAL' : 'HIGH',
        failedAttempts: failed._count.id,
        timeWindow: `Last ${timeWindowMinutes} minutes`,
        details: { attempts: failed._count.id },
      });
    }

    // 2. Unusual number of DELETE operations
    const massDeletes = await this.prisma.auditLog.groupBy({
      by: ['userId', 'userEmail'],
      where: {
        action: AuditAction.DELETE,
        status: AuditStatus.SUCCESS,
        createdAt: {
          gte: cutoffDate,
        },
      },
      _count: { id: true },
      having: {
        id: {
          _count: {
            gte: 10, // 10+ deletes in short time
          },
        },
      },
    });

    for (const deletes of massDeletes) {
      suspicious.push({
        userId: deletes.userId || 'Unknown',
        userEmail: deletes.userEmail || 'Unknown',
        reason: 'Unusual number of delete operations',
        severity: deletes._count.id >= 20 ? 'CRITICAL' : 'HIGH',
        failedAttempts: deletes._count.id,
        timeWindow: `Last ${timeWindowMinutes} minutes`,
        details: { deletions: deletes._count.id },
      });
    }

    // 3. Access from multiple IPs
    const multipleIPs = await this.prisma.$queryRaw<any[]>`
      SELECT 
        user_id,
        user_email,
        COUNT(DISTINCT ip_address) as ip_count,
        ARRAY_AGG(DISTINCT ip_address) as ip_addresses
      FROM audit_logs
      WHERE created_at >= ${cutoffDate}
        AND user_id IS NOT NULL
      GROUP BY user_id, user_email
      HAVING COUNT(DISTINCT ip_address) >= 3
    `;

    for (const ipCheck of multipleIPs) {
      suspicious.push({
        userId: ipCheck.user_id,
        userEmail: ipCheck.user_email || 'Unknown',
        reason: 'Access from multiple IP addresses',
        severity: ipCheck.ip_count >= 5 ? 'CRITICAL' : 'MEDIUM',
        failedAttempts: 0,
        timeWindow: `Last ${timeWindowMinutes} minutes`,
        details: {
          ipCount: ipCheck.ip_count,
          ipAddresses: ipCheck.ip_addresses,
        },
      });
    }

    // 4. Failed permission checks
    const permissionFailures = await this.prisma.auditLog.groupBy({
      by: ['userId', 'userEmail'],
      where: {
        status: AuditStatus.FAILED,
        errorMessage: {
          contains: 'permission',
        },
        createdAt: {
          gte: cutoffDate,
        },
      },
      _count: { id: true },
      having: {
        id: {
          _count: {
            gte: 5,
          },
        },
      },
    });

    for (const failure of permissionFailures) {
      suspicious.push({
        userId: failure.userId || 'Unknown',
        userEmail: failure.userEmail || 'Unknown',
        reason: 'Multiple permission denied attempts',
        severity: 'MEDIUM',
        failedAttempts: failure._count.id,
        timeWindow: `Last ${timeWindowMinutes} minutes`,
        details: { deniedAttempts: failure._count.id },
      });
    }

    return suspicious.sort((a, b) => {
      const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Get resource access frequency
   */
  async getResourceAccessFrequency(resourceType?: string, days: number = 7) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const accessFrequency = await this.prisma.auditLog.groupBy({
      by: ['resourceType', 'resourceId', 'resourceName'],
      where: {
        createdAt: {
          gte: startDate,
        },
        action: {
          in: [AuditAction.VIEW, AuditAction.UPDATE, AuditAction.DELETE],
        },
        ...(resourceType && { resourceType }),
      },
      _count: { id: true },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 50, // Top 50 most accessed resources
    });

    return accessFrequency.map((item) => ({
      resourceType: item.resourceType,
      resourceId: item.resourceId,
      resourceName: item.resourceName,
      accessCount: item._count.id,
    }));
  }

  /**
   * Get hourly activity distribution
   */
  async getHourlyActivityDistribution(days: number = 7) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const hourlyData = await this.prisma.$queryRaw<any[]>`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_count
      FROM audit_logs
      WHERE created_at >= ${startDate}
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `;

    return hourlyData.map((row) => ({
      hour: Number(row.hour),
      totalActions: Number(row.count),
      failedActions: Number(row.failed_count),
    }));
  }

  /**
   * Get change frequency by resource type
   */
  async getChangeFrequencyByResource(days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const changes = await this.prisma.auditLog.groupBy({
      by: ['resourceType'],
      where: {
        action: AuditAction.UPDATE,
        createdAt: {
          gte: startDate,
        },
      },
      _count: { id: true },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return changes.map((item) => ({
      resourceType: item.resourceType,
      updateCount: item._count.id,
      averagePerDay: Math.round(item._count.id / days),
    }));
  }
}
