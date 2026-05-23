/**
 * Permission Repository Implementation
 * Handles all permission data access operations using Prisma
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import type { IPermissionRepository } from './permission.repository.interface';
import { PermissionEntity } from '../entities';

@Injectable()
export class PermissionRepository implements IPermissionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(PermissionRepository.name);
  }

  /**
   * Map Prisma Permission to PermissionEntity
   */
  private mapToEntity(prismaPermission: any): PermissionEntity {
    return new PermissionEntity({
      id: prismaPermission.id,
      name: prismaPermission.name,
      resource: prismaPermission.resource,
      action: prismaPermission.action,
      description: prismaPermission.description,
      descriptionAr: prismaPermission.descriptionAr,
      createdAt: prismaPermission.createdAt,
    });
  }

  async findById(id: string): Promise<PermissionEntity | null> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    return permission ? this.mapToEntity(permission) : null;
  }

  async findByResourceAndAction(
    resource: string,
    action: string,
  ): Promise<PermissionEntity | null> {
    const permission = await this.prisma.permission.findFirst({
      where: {
        resource,
        action,
      },
    });

    return permission ? this.mapToEntity(permission) : null;
  }

  async findByPermissionString(
    permissionString: string,
  ): Promise<PermissionEntity | null> {
    const { resource, action } =
      PermissionEntity.parsePermissionString(permissionString);
    return this.findByResourceAndAction(resource, action);
  }

  async findAll(): Promise<PermissionEntity[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    return permissions.map((p) => this.mapToEntity(p));
  }

  async findByResource(resource: string): Promise<PermissionEntity[]> {
    const permissions = await this.prisma.permission.findMany({
      where: {
        resource,
      },
      orderBy: { action: 'asc' },
    });

    return permissions.map((p) => this.mapToEntity(p));
  }

  async findByIds(ids: string[]): Promise<PermissionEntity[]> {
    if (ids.length === 0) {
      return [];
    }

    const permissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    return permissions.map((p) => this.mapToEntity(p));
  }

  async search(searchTerm: string): Promise<PermissionEntity[]> {
    const permissions = await this.prisma.permission.findMany({
      where: {
        OR: [
          { resource: { contains: searchTerm, mode: 'insensitive' } },
          { action: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    return permissions.map((p) => this.mapToEntity(p));
  }

  async getAllResources(): Promise<string[]> {
    const permissions = await this.prisma.permission.findMany({
      select: { resource: true },
      distinct: ['resource'],
      orderBy: { resource: 'asc' },
    });

    return permissions.map((p) => p.resource);
  }

  async getActionsForResource(resource: string): Promise<string[]> {
    const permissions = await this.prisma.permission.findMany({
      where: {
        resource,
      },
      select: { action: true },
      orderBy: { action: 'asc' },
    });

    return permissions.map((p) => p.action);
  }

  async existsByResourceAndAction(
    resource: string,
    action: string,
  ): Promise<boolean> {
    const count = await this.prisma.permission.count({
      where: {
        resource,
        action,
      },
    });

    return count > 0;
  }

  async create(data: {
    resource: string;
    action: string;
    description: string;
  }): Promise<PermissionEntity> {
    // Validate format
    PermissionEntity.validatePermissionFormat(data.resource, data.action);

    const resource = data.resource.toLowerCase();
    const action = data.action.toLowerCase();
    const name = `${resource}:${action}`;

    const permission = await this.prisma.permission.create({
      data: {
        name,
        resource,
        action,
        description: data.description,
      },
    });

    this.logger.log(`Permission created: ${permission.name}`);

    return this.mapToEntity(permission);
  }

  async createMany(
    data: Array<{
      resource: string;
      action: string;
      description: string;
    }>,
  ): Promise<PermissionEntity[]> {
    // Validate all formats
    data.forEach((item) => {
      PermissionEntity.validatePermissionFormat(item.resource, item.action);
    });

    // Use transaction to ensure all or nothing
    const permissions = await this.prisma.$transaction(
      data.map((item) => {
        const resource = item.resource.toLowerCase();
        const action = item.action.toLowerCase();
        const name = `${resource}:${action}`;

        return this.prisma.permission.create({
          data: {
            name,
            resource,
            action,
            description: item.description,
          },
        });
      }),
    );

    this.logger.log(`Created ${permissions.length} permissions in bulk`);

    return permissions.map((p) => this.mapToEntity(p));
  }

  async update(
    id: string,
    data: {
      description?: string;
    },
  ): Promise<PermissionEntity> {
    const permission = await this.prisma.permission.update({
      where: { id },
      data: {
        description: data.description,
      },
    });

    this.logger.log(
      `Permission updated: ${permission.resource}:${permission.action}`,
    );

    return this.mapToEntity(permission);
  }

  async delete(id: string): Promise<void> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    // Check if assigned to any role
    const isAssigned = await this.isAssignedToAnyRole(id);

    if (isAssigned) {
      throw new Error(
        'Cannot delete permission that is assigned to one or more roles',
      );
    }

    await this.prisma.permission.delete({
      where: { id },
    });

    this.logger.warn(
      `Permission deleted: ${permission.resource}:${permission.action}`,
    );
  }

  async isAssignedToAnyRole(id: string): Promise<boolean> {
    const count = await this.prisma.rolePermission.count({
      where: { permissionId: id },
    });

    return count > 0;
  }

  async count(): Promise<number> {
    return this.prisma.permission.count();
  }

  async findPaginated(params: {
    page: number;
    limit: number;
    resource?: string;
    search?: string;
  }): Promise<{
    data: PermissionEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, resource, search } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      AND: [],
    };

    if (resource) {
      where.AND.push({ resource });
    }

    if (search) {
      where.AND.push({
        OR: [
          { resource: { contains: search, mode: 'insensitive' } },
          { action: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const finalWhere = where.AND.length > 0 ? where : undefined;

    const [permissions, total] = await Promise.all([
      this.prisma.permission.findMany({
        where: finalWhere,
        skip,
        take: limit,
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      }),
      this.prisma.permission.count({
        where: finalWhere,
      }),
    ]);

    return {
      data: permissions.map((p) => this.mapToEntity(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
