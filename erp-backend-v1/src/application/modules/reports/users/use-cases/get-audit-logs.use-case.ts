/**
 * Get Audit Logs Use Case
 * Comprehensive audit trail for compliance and forensics
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  AuditLogsFiltersDto,
  AuditLogsResponseDto,
  AuditLogsMetricsDto,
  AuditLogDetailDto,
  UserActivitySummaryDto,
  ActionDistributionDto,
  ResourceDistributionDto,
} from '../dto';

@Injectable()
export class GetAuditLogsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filters: AuditLogsFiltersDto): Promise<AuditLogsResponseDto> {
    const where = this.buildWhereClause(filters);

    // Get total count for pagination
    const totalLogs = await this.prisma.auditLog.count({ where });

    // Calculate pagination
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const totalPages = Math.ceil(totalLogs / limit);

    const [metrics, logs, userActivity] = await Promise.all([
      this.getAuditMetrics(where),
      this.getAuditLogs(filters, where),
      filters.includeUserActivity !== false
        ? this.getUserActivitySummary(where, filters.topUsersLimit || 20)
        : Promise.resolve(undefined),
    ]);

    const [actionDistribution, resourceDistribution] = await Promise.all([
      filters.includeActionDistribution !== false
        ? this.getActionDistribution(where)
        : Promise.resolve(undefined),
      filters.includeResourceDistribution !== false
        ? this.getResourceDistribution(where)
        : Promise.resolve(undefined),
    ]);

    return {
      metrics,
      actionDistribution: actionDistribution || [],
      resourceDistribution: resourceDistribution || [],
      mostActiveUsers: userActivity || [],
      logs,
      pagination: {
        page,
        limit,
        totalItems: totalLogs,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      generatedAt: new Date(),
    };
  }

  private buildWhereClause(filters: AuditLogsFiltersDto): any {
    const where: any = {};

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters.userId) where.userId = filters.userId;

    // Support both single action and multiple actions
    if (filters.actions && filters.actions.length > 0) {
      where.action = { in: filters.actions };
    } else if (filters.action) {
      where.action = filters.action;
    }

    if (filters.status) where.status = filters.status;
    if (filters.resourceType) where.resourceType = filters.resourceType;
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (filters.ipAddress) where.ipAddress = filters.ipAddress;
    if (filters.requestId) where.requestId = filters.requestId;

    return where;
  }

  private async getAuditMetrics(where: any): Promise<AuditLogsMetricsDto> {
    const [totalLogs, uniqueUsers, successCount, failedCount] =
      await Promise.all([
        this.prisma.auditLog.count({ where }),
        this.prisma.auditLog.findMany({
          where,
          select: { userId: true },
          distinct: ['userId'],
        }),
        this.prisma.auditLog.count({ where: { ...where, status: 'SUCCESS' } }),
        this.prisma.auditLog.count({ where: { ...where, status: 'FAILED' } }),
      ]);

    const successRate =
      totalLogs > 0 ? Math.round((successCount / totalLogs) * 1000) / 10 : 0;

    return {
      totalLogs,
      successfulActions: successCount,
      failedActions: failedCount,
      uniqueUsers: uniqueUsers.length,
      successRate,
    };
  }

  private async getAuditLogs(
    filters: AuditLogsFiltersDto,
    where: any,
  ): Promise<AuditLogDetailDto[]> {
    const page = filters.page || 1;
    const pageSize = filters.limit || 50;
    const skip = (page - 1) * pageSize;

    const logs = await this.prisma.auditLog.findMany({
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
      skip,
      take: pageSize,
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      resourceType: log.resourceType || undefined,
      resourceId: log.resourceId || undefined,
      resourceName: undefined,
      status: log.status,
      userId: log.userId,
      userEmail: log.user?.email || undefined,
      userFullName: log.user
        ? `${log.user.firstName} ${log.user.lastName}`
        : undefined,
      ipAddress: log.ipAddress || undefined,
      userAgent: log.userAgent || undefined,
      oldValues: log.oldValues as Record<string, any> | undefined,
      newValues: log.newValues as Record<string, any> | undefined,
      changedFields: log.changedFields as string[] | undefined,
      errorMessage: log.errorMessage || undefined,
      createdAt: log.createdAt,
      requestMethod: log.requestMethod || undefined,
      requestUrl: log.requestUrl || undefined,
      requestId: log.requestId || undefined,
      durationMs: log.durationMs ?? undefined,
    }));
  }

  private async getUserActivitySummary(
    where: any,
    limit: number,
  ): Promise<UserActivitySummaryDto[]> {
    const userActions = await this.prisma.auditLog.groupBy({
      by: ['userId', 'action'],
      where,
      _count: { id: true },
    });

    const userMap = new Map<
      string,
      { totalActions: number; actions: Map<string, number> }
    >();

    userActions.forEach((ua) => {
      if (!ua.userId) return; // Skip null userIds
      if (!userMap.has(ua.userId)) {
        userMap.set(ua.userId, { totalActions: 0, actions: new Map() });
      }
      const userData = userMap.get(ua.userId)!;
      userData.totalActions += ua._count.id;
      userData.actions.set(ua.action, ua._count.id);
    });

    const topUsers = Array.from(userMap.entries())
      .sort((a, b) => b[1].totalActions - a[1].totalActions)
      .slice(0, limit);

    const userIds = topUsers.map(([userId]) => userId);
    if (userIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    return topUsers
      .map(([userId, data]) => {
        const user = users.find((u) => u.id === userId);
        if (!user) return null;

        const mostCommonAction = Array.from(data.actions.entries()).sort(
          (a, b) => b[1] - a[1],
        )[0];

        const actionBreakdown = Array.from(data.actions.entries())
          .map(([action, count]) => ({ action, count }))
          .sort((a, b) => b.count - a.count);

        return {
          userId: user.id,
          userEmail: user.email,
          userFullName: `${user.firstName} ${user.lastName}`,
          totalActions: data.totalActions,
          mostCommonAction: mostCommonAction ? mostCommonAction[0] : undefined,
          actionBreakdown,
        };
      })
      .filter((item) => item !== null) as UserActivitySummaryDto[];
  }

  private async getActionDistribution(
    where: any,
  ): Promise<ActionDistributionDto[]> {
    const actions = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const total = actions.reduce((sum, a) => sum + a._count.id, 0);

    return actions.map((a) => ({
      action: a.action,
      count: a._count.id,
      percentage: total > 0 ? Math.round((a._count.id / total) * 1000) / 10 : 0,
    }));
  }

  private async getResourceDistribution(
    where: any,
  ): Promise<ResourceDistributionDto[]> {
    // Extract resourceType from where clause if it exists
    const { resourceType, ...restWhere } = where;

    // Build where clause - don't add NOT condition for groupBy
    const queryWhere: any = { ...restWhere };

    // Add resourceType filter only if specified
    if (resourceType) {
      queryWhere.resourceType = resourceType;
    }

    const resources = await this.prisma.auditLog.groupBy({
      by: ['resourceType'],
      where: queryWhere,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // Filter out null resourceType after groupBy
    const filteredResources = resources.filter((r) => r.resourceType !== null);
    const total = filteredResources.reduce((sum, r) => sum + r._count.id, 0);

    return filteredResources.map((r) => ({
      resourceType: r.resourceType || 'Unknown',
      count: r._count.id,
      percentage: total > 0 ? Math.round((r._count.id / total) * 1000) / 10 : 0,
    }));
  }
}
