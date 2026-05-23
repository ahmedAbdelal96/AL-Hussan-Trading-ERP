/**
 * Role Repository Implementation
 * Handles all role data access operations using Prisma
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import type { IRoleRepository } from './role.repository.interface';
import { RoleEntity, PermissionEntity } from '../entities';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(RoleRepository.name);
  }

  /**
   * Map Prisma Permission to PermissionEntity
   */
  private mapPermissionToEntity(prismaPermission: any): PermissionEntity {
    return new PermissionEntity({
      id: prismaPermission.id,
      name: prismaPermission.name,
      resource: prismaPermission.resource,
      action: prismaPermission.action,
      description: prismaPermission.description,
      createdAt: prismaPermission.createdAt,
    });
  }

  /**
   * Map Prisma Role to RoleEntity
   */
  private mapToEntity(prismaRole: any): RoleEntity {
    const permissions = prismaRole.rolePermissions
      ? prismaRole.rolePermissions.map((rp: any) =>
          this.mapPermissionToEntity(rp.permission),
        )
      : undefined;

    const entity = new RoleEntity({
      id: prismaRole.id,
      name: prismaRole.name,
      slug: prismaRole.slug,
      description: prismaRole.description,
      isSystemRole: prismaRole.isSystemRole,
      isActive: prismaRole.isActive,
      createdAt: prismaRole.createdAt,
      updatedAt: prismaRole.updatedAt,
      permissions,
    });

    // Store _count from Prisma for use-cases that need permissionCount without loading all permissions
    if (prismaRole._count?.rolePermissions !== undefined) {
      (entity as any)._permissionCount = prismaRole._count.rolePermissions;
    }

    return entity;
  }

  async findById(
    id: string,
    includePermissions: boolean = false,
  ): Promise<RoleEntity | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: includePermissions
        ? {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          }
        : undefined,
    });

    return role ? this.mapToEntity(role) : null;
  }

  async findBySlug(
    slug: string,
    includePermissions: boolean = false,
  ): Promise<RoleEntity | null> {
    const role = await this.prisma.role.findUnique({
      where: { slug },
      include: includePermissions
        ? {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          }
        : undefined,
    });

    return role ? this.mapToEntity(role) : null;
  }

  async findAll(
    includeInactive: boolean = false,
    includePermissions: boolean = false,
  ): Promise<RoleEntity[]> {
    const roles = await this.prisma.role.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: includePermissions
        ? {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          }
        : undefined,
      orderBy: [{ isSystemRole: 'desc' }, { name: 'asc' }],
    });

    return roles.map((r) => this.mapToEntity(r));
  }

  async findByIds(
    ids: string[],
    includePermissions: boolean = false,
  ): Promise<RoleEntity[]> {
    if (ids.length === 0) {
      return [];
    }

    const roles = await this.prisma.role.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: includePermissions
        ? {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          }
        : undefined,
      orderBy: [{ isSystemRole: 'desc' }, { name: 'asc' }],
    });

    return roles.map((r) => this.mapToEntity(r));
  }

  async findSystemRoles(
    includePermissions: boolean = false,
  ): Promise<RoleEntity[]> {
    const roles = await this.prisma.role.findMany({
      where: { isSystemRole: true, isActive: true },
      include: includePermissions
        ? {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          }
        : undefined,
      orderBy: { name: 'asc' },
    });

    return roles.map((r) => this.mapToEntity(r));
  }

  async findCustomRoles(
    includePermissions: boolean = false,
  ): Promise<RoleEntity[]> {
    const roles = await this.prisma.role.findMany({
      where: { isSystemRole: false, isActive: true },
      include: includePermissions
        ? {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          }
        : undefined,
      orderBy: { name: 'asc' },
    });

    return roles.map((r) => this.mapToEntity(r));
  }

  async search(
    searchTerm: string,
    includeInactive: boolean = false,
    includePermissions: boolean = false,
  ): Promise<RoleEntity[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { slug: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
          includeInactive ? {} : { isActive: true },
        ],
      },
      include: includePermissions
        ? {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          }
        : undefined,
      orderBy: [{ isSystemRole: 'desc' }, { name: 'asc' }],
    });

    return roles.map((r) => this.mapToEntity(r));
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.role.count({
      where: { slug },
    });

    return count > 0;
  }

  async getRolePermissions(roleId: string): Promise<PermissionEntity[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId,
      },
      include: {
        permission: true,
      },
    });

    return rolePermissions.map((rp) =>
      this.mapPermissionToEntity(rp.permission),
    );
  }

  async create(data: {
    name: string;
    slug: string;
    description: string;
    isSystemRole?: boolean;
    isActive?: boolean;
  }): Promise<RoleEntity> {
    // Validate slug format
    RoleEntity.validateSlug(data.slug);
    RoleEntity.validateName(data.name);

    const role = await this.prisma.role.create({
      data: {
        name: data.name,
        slug: data.slug.toLowerCase(),
        description: data.description,
        isSystemRole: data.isSystemRole ?? false,
        isActive: data.isActive ?? true,
      },
    });

    this.logger.log(`Role created: ${role.name} (${role.slug})`);

    return this.mapToEntity(role);
  }

  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      isActive?: boolean;
    },
  ): Promise<RoleEntity> {
    // Check if it's a system role
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new Error('Role not found');
    }

    if (existingRole.isSystemRole && (data.name || data.slug)) {
      throw new Error('Cannot update name or slug of system role');
    }

    // Validate if updating slug or name
    if (data.slug) {
      RoleEntity.validateSlug(data.slug);
    }

    if (data.name) {
      RoleEntity.validateName(data.name);
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug?.toLowerCase(),
        description: data.description,
        isActive: data.isActive,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Role updated: ${role.name} (${role.slug})`);

    return this.mapToEntity(role);
  }

  async activate(id: string): Promise<RoleEntity> {
    const role = await this.prisma.role.update({
      where: { id },
      data: {
        isActive: true,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Role activated: ${role.name} (${role.slug})`);

    return this.mapToEntity(role);
  }

  async deactivate(id: string): Promise<RoleEntity> {
    const role = await this.prisma.role.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Role deactivated: ${role.name} (${role.slug})`);

    return this.mapToEntity(role);
  }

  async delete(id: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSystemRole) {
      throw new Error('Cannot delete system role');
    }

    // Check if assigned to any user
    const isAssigned = await this.isAssignedToAnyUser(id);

    if (isAssigned) {
      throw new Error(
        'Cannot delete role that is assigned to one or more users',
      );
    }

    // Delete role permissions first (cascade might not be set)
    await this.prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // Delete role
    await this.prisma.role.delete({
      where: { id },
    });

    this.logger.warn(`Role deleted: ${role.name} (${role.slug})`);
  }

  async isAssignedToAnyUser(id: string): Promise<boolean> {
    const count = await this.prisma.userRole.count({
      where: { roleId: id },
    });

    return count > 0;
  }

  async assignPermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    if (permissionIds.length === 0) {
      return;
    }

    // Check which permissions are already assigned
    const existingAssignments = await this.prisma.rolePermission.findMany({
      where: {
        roleId,
        permissionId: {
          in: permissionIds,
        },
      },
      select: { permissionId: true },
    });

    const existingPermissionIds = existingAssignments.map(
      (a) => a.permissionId,
    );
    const newPermissionIds = permissionIds.filter(
      (id) => !existingPermissionIds.includes(id),
    );

    if (newPermissionIds.length === 0) {
      return; // All permissions already assigned
    }

    // Create role permission records
    await this.prisma.rolePermission.createMany({
      data: newPermissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
    });

    this.logger.log(
      `Assigned ${newPermissionIds.length} permission(s) to role ID: ${roleId}`,
    );
  }

  async removePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    if (permissionIds.length === 0) {
      return;
    }

    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: {
          in: permissionIds,
        },
      },
    });

    this.logger.log(
      `Removed ${permissionIds.length} permission(s) from role ID: ${roleId}`,
    );
  }

  async replacePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Remove all existing permissions
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // Add new permissions
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }
    });

    this.logger.log(
      `Replaced permissions for role ID: ${roleId} with ${permissionIds.length} permission(s)`,
    );
  }

  async hasPermission(roleId: string, permissionId: string): Promise<boolean> {
    const count = await this.prisma.rolePermission.count({
      where: {
        roleId,
        permissionId,
      },
    });

    return count > 0;
  }

  async getUserRoles(
    userId: string,
    includeExpired: boolean = false,
    includePermissions: boolean = false,
  ): Promise<RoleEntity[]> {
    const now = new Date();

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: {
          isActive: true,
        },
        ...(includeExpired
          ? {}
          : {
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            }),
      },
      include: {
        role: {
          include: includePermissions
            ? {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              }
            : undefined,
        },
      },
    });

    return userRoles.map((ur) => this.mapToEntity(ur.role));
  }

  async count(includeInactive: boolean = false): Promise<number> {
    return this.prisma.role.count({
      where: includeInactive ? undefined : { isActive: true },
    });
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    includeInactive?: boolean;
    includePermissions?: boolean;
    systemOnly?: boolean;
    customOnly?: boolean;
    search?: string;
  }): Promise<{
    data: RoleEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page,
      limit,
      includeInactive = false,
      includePermissions = false,
      systemOnly,
      customOnly,
      search,
    } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      AND: [],
    };

    if (!includeInactive) {
      where.AND.push({ isActive: true });
    }

    if (systemOnly) {
      where.AND.push({ isSystemRole: true });
    } else if (customOnly) {
      where.AND.push({ isSystemRole: false });
    }

    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const finalWhere = where.AND.length > 0 ? where : undefined;

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where: finalWhere,
        skip,
        take: limit,
        include: {
          ...(includePermissions
            ? {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              }
            : {}),
          _count: {
            select: { rolePermissions: true },
          },
        },
        orderBy: [{ isSystemRole: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.role.count({
        where: finalWhere,
      }),
    ]);

    return {
      data: roles.map((r) => this.mapToEntity(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
