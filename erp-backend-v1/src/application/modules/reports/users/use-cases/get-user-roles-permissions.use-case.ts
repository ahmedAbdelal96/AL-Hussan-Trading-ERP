/**
 * Get User Roles & Permissions Use Case
 * Analyze RBAC configuration and permission assignments
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  UserRolesPermissionsFiltersDto,
  UserRolesPermissionsResponseDto,
  RBACMetricsDto,
} from '../dto';

@Injectable()
export class GetUserRolesPermissionsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: UserRolesPermissionsFiltersDto,
  ): Promise<UserRolesPermissionsResponseDto> {
    const [
      metrics,
      userRoles,
      customPermissions,
      roleDistribution,
      temporaryGrants,
    ] = await Promise.all([
      this.getRBACMetrics(filters),
      filters.userId ? this.getUserRoleDetails(filters) : Promise.resolve([]),
      filters.userId && filters.includeCustomPermissions !== false
        ? this.getUserCustomPermissions(filters)
        : Promise.resolve([]),
      filters.includeRoleDistribution !== false
        ? this.getRoleDistribution()
        : Promise.resolve(undefined),
      filters.includeTemporary !== false
        ? this.getTemporaryGrants(filters)
        : Promise.resolve([]),
    ]);

    return {
      metrics,
      userRoles: userRoles as any,
      customPermissions: customPermissions as any,
      roleDistribution,
      temporaryGrants: temporaryGrants as any,
      generatedAt: new Date(),
    } as any;
  }

  private async getRBACMetrics(
    filters: UserRolesPermissionsFiltersDto,
  ): Promise<RBACMetricsDto> {
    const now = new Date();

    const [
      totalRoles,
      totalPermissions,
      usersWithRoles,
      usersWithCustomPermissions,
      totalTemporaryGrants,
      expiringGrantsCount,
    ] = await Promise.all([
      this.prisma.role.count(),
      this.prisma.permission.count(),
      this.prisma.userRole.findMany({
        where: { isActive: true },
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.userCustomPermission.findMany({
        where: { isActive: true },
        select: { userId: true },
        distinct: ['userId'],
      }),
      (async () => {
        const rolesCount = await this.prisma.userRole.count({
          where: { isActive: true, isTemporary: true, expiresAt: { gt: now } },
        });
        const permsCount = await this.prisma.userCustomPermission.count({
          where: { isActive: true, isTemporary: true, expiresAt: { gt: now } },
        });
        return rolesCount + permsCount;
      })(),
      this.getExpiringGrantsCount(filters.expiringInDays || 7),
    ]);

    return {
      totalRoles,
      totalPermissions,
      usersWithRoles: usersWithRoles.length,
      usersWithoutRoles: 0,
      usersWithCustomPermissions: usersWithCustomPermissions.length,
      activeTemporaryGrants: totalTemporaryGrants,
      expiringGrantsCount,
    };
  }

  private async getUserRoleDetails(
    filters: UserRolesPermissionsFiltersDto,
  ): Promise<any[]> {
    const where: any = { isActive: true };
    if (filters.userId) where.userId = filters.userId;

    const userRoles = await this.prisma.userRole.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        role: {
          select: { id: true, name: true, slug: true, description: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return userRoles.map((ur) => ({
      userId: ur.user.id,
      userEmail: ur.user.email,
      userFullName: `${ur.user.firstName} ${ur.user.lastName}`,
      roleId: ur.role.id,
      roleName: ur.role.name,
      roleSlug: ur.role.slug,
      roleDescription: ur.role.description || undefined,
      grantedAt: ur.createdAt,
      grantedBy: ur.grantedBy || undefined,
      grantedByEmail: 'Unknown',
      isActive: ur.isActive,
      isTemporary: ur.isTemporary,
      expiresAt: ur.expiresAt || undefined,
      daysUntilExpiration: ur.expiresAt
        ? Math.ceil(
            (ur.expiresAt.getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : undefined,
    }));
  }

  private async getUserCustomPermissions(
    filters: UserRolesPermissionsFiltersDto,
  ): Promise<any[]> {
    const where: any = { isActive: true };
    if (filters.userId) where.userId = filters.userId;

    const customPermissions = await this.prisma.userCustomPermission.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        permission: {
          select: {
            id: true,
            name: true,
            description: true,
            resource: true,
            action: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return customPermissions.map((cp) => ({
      userId: cp.user.id,
      userEmail: cp.user.email,
      userFullName: `${cp.user.firstName} ${cp.user.lastName}`,
      permissionId: cp.permission.id,
      permissionName: cp.permission.name,
      permissionDescription: cp.permission.description || undefined,
      permissionType: cp.permissionType,
      resource: cp.permission.resource,
      action: cp.permission.action,
      grantedAt: cp.createdAt,
      grantedBy: cp.grantedBy || undefined,
      grantedByEmail: 'Unknown',
      isTemporary: cp.isTemporary,
      expiresAt: cp.expiresAt || undefined,
      daysUntilExpiration: cp.expiresAt
        ? Math.ceil(
            (cp.expiresAt.getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : undefined,
    }));
  }

  private async getRoleDistribution(): Promise<any[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        userRoles: {
          where: { isActive: true },
          select: { userId: true },
        },
      },
    });

    const totalActiveRoleAssignments = roles.reduce(
      (sum, role) => sum + role.userRoles.length,
      0,
    );

    return roles
      .map((role) => ({
        roleId: role.id,
        roleName: role.name,
        roleSlug: role.slug,
        roleDescription: role.description || undefined,
        usersCount: role.userRoles.length,
        percentage:
          totalActiveRoleAssignments > 0
            ? Math.round(
                (role.userRoles.length / totalActiveRoleAssignments) * 1000,
              ) / 10
            : 0,
        isSystemRole: role.isSystemRole,
      }))
      .sort((a, b) => b.usersCount - a.usersCount);
  }

  private async getTemporaryGrants(
    filters: UserRolesPermissionsFiltersDto,
  ): Promise<any[]> {
    const now = new Date();
    const expiringThreshold = new Date(
      now.getTime() + (filters.expiringInDays || 7) * 24 * 60 * 60 * 1000,
    );

    const [temporaryRoles, temporaryPermissions] = await Promise.all([
      this.prisma.userRole.findMany({
        where: {
          isActive: true,
          isTemporary: true,
          expiresAt: { gt: now, lte: expiringThreshold },
        },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          role: { select: { name: true } },
        },
        orderBy: { expiresAt: 'asc' },
      }),
      this.prisma.userCustomPermission.findMany({
        where: {
          isActive: true,
          isTemporary: true,
          expiresAt: { gt: now, lte: expiringThreshold },
        },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          permission: { select: { name: true } },
        },
        orderBy: { expiresAt: 'asc' },
      }),
    ]);

    const grants: any[] = [
      ...temporaryRoles.map((tr) => ({
        targetType: 'role' as const,
        targetName: tr.role.name,
        userEmail: tr.user.email,
        userFullName: `${tr.user.firstName} ${tr.user.lastName}`,
        grantedAt: tr.createdAt,
        expiresAt: tr.expiresAt!,
        daysUntilExpiration: Math.ceil(
          (tr.expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        ),
        grantedBy: tr.grantedBy || undefined,
      })),
      ...temporaryPermissions.map((tp) => ({
        targetType: 'permission' as const,
        targetName: tp.permission.name,
        userEmail: tp.user.email,
        userFullName: `${tp.user.firstName} ${tp.user.lastName}`,
        grantedAt: tp.createdAt,
        expiresAt: tp.expiresAt!,
        daysUntilExpiration: Math.ceil(
          (tp.expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        ),
        grantedBy: tp.grantedBy || undefined,
      })),
    ].sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());

    return grants;
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
}
