/**
 * Get Permission Grant History Use Case
 * Track permission and role grant/revoke history for governance
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  PermissionGrantHistoryFiltersDto,
  PermissionGrantHistoryResponseDto,
  GrantHistoryMetricsDto,
  GrantHistoryDetailDto,
  MostGrantedDto,
  AdminGrantingActivityDto,
} from '../dto';
import { GrantAction } from '../dto/users-filters.dto';

@Injectable()
export class GetPermissionGrantHistoryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: PermissionGrantHistoryFiltersDto,
  ): Promise<PermissionGrantHistoryResponseDto> {
    const [metrics, history, mostGranted, adminActivity] = await Promise.all([
      this.getGrantHistoryMetrics(filters),
      this.getGrantHistory(filters),
      filters.includeMostGranted !== false
        ? this.getMostGranted(filters)
        : Promise.resolve(undefined),
      filters.includeAdminActivity !== false
        ? this.getAdminGrantingActivity(filters)
        : Promise.resolve(undefined),
    ]);

    return {
      metrics,
      history,
      mostGranted,
      adminActivity,
      generatedAt: new Date(),
    };
  }

  private async getGrantHistoryMetrics(
    filters: PermissionGrantHistoryFiltersDto,
  ): Promise<GrantHistoryMetricsDto> {
    const where = this.buildWhereClause(filters);

    const [totalGrants, grantCount, revokeCount, expiringGrants] =
      await Promise.all([
        this.prisma.permissionGrantHistory.count({ where }),
        this.prisma.permissionGrantHistory.count({
          where: { ...where, action: GrantAction.GRANT },
        }),
        this.prisma.permissionGrantHistory.count({
          where: { ...where, action: GrantAction.REVOKE },
        }),
        this.getExpiringGrantsCount(filters.expiringInDays || 7),
      ]);

    const grantRevokeRatio =
      revokeCount > 0
        ? Math.round((grantCount / revokeCount) * 100) / 100
        : grantCount;

    const temporaryGrantsActive = await this.getActiveTemporaryGrantsCount();

    return {
      totalGrants,
      grantCount,
      revokeCount,
      grantRevokeRatio,
      temporaryGrantsActive,
      expiringGrantsCount: expiringGrants,
    };
  }

  private buildWhereClause(filters: PermissionGrantHistoryFiltersDto): any {
    const where: any = {};

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters.userId) where.userId = filters.userId;
    if (filters.grantedBy) where.grantedBy = filters.grantedBy;
    if (filters.action) where.action = filters.action;
    if (filters.targetType) where.targetType = filters.targetType;
    if (filters.targetId) where.targetId = filters.targetId;

    return where;
  }

  private async getGrantHistory(
    filters: PermissionGrantHistoryFiltersDto,
  ): Promise<GrantHistoryDetailDto[]> {
    const where = this.buildWhereClause(filters);
    const page = filters.page || 1;
    const pageSize = filters.limit || filters.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const history = await this.prisma.permissionGrantHistory.findMany({
      where,
      include: {
        grantor: {
          select: {
            id: true,
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

    // Fetch target names (roles/permissions)
    const roleIds = history
      .filter((h) => h.targetType === 'ROLE')
      .map((h) => h.targetId);
    const permissionIds = history
      .filter((h) => h.targetType === 'PERMISSION')
      .map((h) => h.targetId);

    const [roles, permissions] = await Promise.all([
      roleIds.length > 0
        ? this.prisma.role.findMany({
            where: { id: { in: roleIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      permissionIds.length > 0
        ? this.prisma.permission.findMany({
            where: { id: { in: permissionIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ]);

    const roleMap = new Map(
      roles.map((r) => [r.id, r.name] as [string, string]),
    );
    const permissionMap = new Map(
      permissions.map((p) => [p.id, p.name] as [string, string]),
    );

    // Fetch user details separately
    const userIds = [...new Set(history.map((h) => h.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return history.map((h) => {
      const targetName: string =
        h.targetType === 'ROLE'
          ? roleMap.get(h.targetId) || 'Unknown Role'
          : permissionMap.get(h.targetId) || 'Unknown Permission';

      const now = new Date();
      const daysUntilExpiration = h.expiresAt
        ? Math.ceil(
            (h.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          )
        : undefined;

      const user = userMap.get(h.userId);

      return {
        id: h.id,
        action: h.action as 'GRANT' | 'REVOKE',
        targetType: h.targetType as 'ROLE' | 'PERMISSION',
        targetId: h.targetId,
        targetName,
        userId: h.userId,
        userEmail: user?.email || 'Unknown',
        userFullName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        grantedBy: h.grantedBy,
        grantedByEmail: h.grantor?.email || undefined,
        grantedByFullName: h.grantor
          ? `${h.grantor.firstName} ${h.grantor.lastName}`
          : undefined,
        grantReason: h.reason || undefined,
        isTemporary: !!h.expiresAt,
        expiresAt: h.expiresAt || undefined,
        daysUntilExpiration,
        createdAt: h.createdAt,
        metadata: undefined,
      };
    });
  }

  private async getMostGranted(
    filters: PermissionGrantHistoryFiltersDto,
  ): Promise<MostGrantedDto[]> {
    const where = this.buildWhereClause(filters);

    const grants = await this.prisma.permissionGrantHistory.groupBy({
      by: ['targetType', 'targetId'],
      where: { ...where, action: GrantAction.GRANT },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: filters.topGrantedLimit || 20,
    });

    const roleIds = grants
      .filter((g) => g.targetType === 'ROLE')
      .map((g) => g.targetId);
    const permissionIds = grants
      .filter((g) => g.targetType === 'PERMISSION')
      .map((g) => g.targetId);

    const [roles, permissions] = await Promise.all([
      roleIds.length > 0
        ? this.prisma.role.findMany({
            where: { id: { in: roleIds } },
            select: { id: true, name: true, description: true },
          })
        : Promise.resolve([]),
      permissionIds.length > 0
        ? this.prisma.permission.findMany({
            where: { id: { in: permissionIds } },
            select: {
              id: true,
              name: true,
              description: true,
              resource: true,
              action: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const roleMap = new Map(roles.map((r) => [r.id, r] as [string, typeof r]));
    const permissionMap = new Map(
      permissions.map((p) => [p.id, p] as [string, typeof p]),
    );

    return grants.map((g) => {
      const isRole = g.targetType === 'ROLE';
      const target = isRole
        ? roleMap.get(g.targetId)
        : permissionMap.get(g.targetId);

      return {
        targetType: g.targetType as 'ROLE' | 'PERMISSION',
        targetId: g.targetId,
        targetName: target ? target.name : 'Unknown',
        targetDescription: target?.description || undefined,
        grantCount: g._count.id,
        resource: !isRole ? target?.resource : undefined,
        action: !isRole ? target?.action : undefined,
      };
    });
  }

  private async getAdminGrantingActivity(
    filters: PermissionGrantHistoryFiltersDto,
  ): Promise<AdminGrantingActivityDto[]> {
    const where = this.buildWhereClause(filters);

    const adminActivity = await this.prisma.permissionGrantHistory.groupBy({
      by: ['grantedBy', 'action'],
      where,
      _count: { id: true },
    });

    const adminMap = new Map<
      string,
      { totalGrants: number; grants: number; revokes: number }
    >();

    adminActivity.forEach((aa) => {
      if (!adminMap.has(aa.grantedBy)) {
        adminMap.set(aa.grantedBy, { totalGrants: 0, grants: 0, revokes: 0 });
      }
      const data = adminMap.get(aa.grantedBy)!;
      data.totalGrants += aa._count.id;
      if (aa.action === 'GRANT') data.grants += aa._count.id;
      if (aa.action === 'REVOKE') data.revokes += aa._count.id;
    });

    const adminIds = Array.from(adminMap.keys());
    if (adminIds.length === 0) return [];

    const admins = await this.prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    const grantHistory = await this.prisma.permissionGrantHistory.findMany({
      where: { grantedBy: { in: adminIds } },
      select: { grantedBy: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      distinct: ['grantedBy'],
    });

    const lastActivityMap = new Map(
      grantHistory.map((gh) => [gh.grantedBy, gh.createdAt]),
    );

    return (
      admins
        .map((admin) => {
          const data = adminMap.get(admin.id);
          if (!data) return null;

          return {
            adminId: admin.id,
            adminEmail: admin.email,
            adminFullName: `${admin.firstName} ${admin.lastName}`,
            totalGrants: data.totalGrants,
            grantCount: data.grants,
            revokeCount: data.revokes,
            lastActivity: lastActivityMap.get(admin.id),
          };
        })
        .filter((item) => item !== null) as AdminGrantingActivityDto[]
    )
      .sort((a, b) => b.totalGrants - a.totalGrants)
      .slice(0, 20);
  }

  private async getExpiringGrantsCount(days: number): Promise<number> {
    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const [rolesCount, permissionsCount] = await Promise.all([
      this.prisma.userRole.count({
        where: {
          isActive: true,
          isTemporary: true,
          expiresAt: { gt: now, lte: threshold },
        },
      }),
      this.prisma.userCustomPermission.count({
        where: {
          isActive: true,
          isTemporary: true,
          expiresAt: { gt: now, lte: threshold },
        },
      }),
    ]);

    return rolesCount + permissionsCount;
  }

  private async getActiveTemporaryGrantsCount(): Promise<number> {
    const now = new Date();

    const [rolesCount, permissionsCount] = await Promise.all([
      this.prisma.userRole.count({
        where: {
          isActive: true,
          isTemporary: true,
          expiresAt: { gt: now },
        },
      }),
      this.prisma.userCustomPermission.count({
        where: {
          isActive: true,
          isTemporary: true,
          expiresAt: { gt: now },
        },
      }),
    ]);

    return rolesCount + permissionsCount;
  }
}
