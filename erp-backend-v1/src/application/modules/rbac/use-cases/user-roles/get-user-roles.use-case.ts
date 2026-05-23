/**
 * Get User Roles Use Case
 * Business logic for retrieving all roles assigned to a user
 *
 * Features:
 * - Returns active and expired roles separately
 * - Includes role details and expiration information
 * - Calculates remaining days for temporary roles
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import type { IAuthRepository } from '../../../auth/repositories';
import { AUTH_REPOSITORY } from '../../../auth/repositories';
import { UserRolesResponseDto, UserRoleResponseDto } from '../../dto';
import { UserRoleEntity } from '../../entities';

@Injectable()
export class GetUserRolesUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetUserRolesUseCase.name);
  }

  async execute(
    userId: string,
    includeExpired: boolean = false,
  ): Promise<UserRolesResponseDto> {
    // 1. Check if user exists
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 2. Get user role assignments
    const now = new Date();
    const whereClause: any = {
      userId,
      role: {
        isActive: true,
      },
    };

    if (!includeExpired) {
      whereClause.OR = [
        { expiresAt: null }, // Permanent
        { expiresAt: { gt: now } }, // Not expired
      ];
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: whereClause,
      include: {
        role: {
          include: {
            rolePermissions: {
              select: {
                permissionId: true,
              },
            },
          },
        },
      },
      orderBy: [
        { expiresAt: 'asc' }, // Expiring soon first
        { grantedAt: 'desc' }, // Recently assigned first
      ],
    });

    // 3. Map to response DTOs
    const roleDtos = userRoles.map((ur) => this.mapToRoleDto(ur));

    // 4. Calculate statistics
    const activeRoles = roleDtos.filter((r) => r.isActive).length;
    const expiredRoles = roleDtos.filter((r) => r.isExpired).length;

    return {
      userId,
      roles: roleDtos,
      totalRoles: roleDtos.length,
      activeRoles,
      expiredRoles,
    };
  }

  /**
   * Map Prisma UserRole to UserRoleResponseDto
   */
  private mapToRoleDto(userRole: any): UserRoleResponseDto {
    const entity = new UserRoleEntity({
      id: userRole.id,
      userId: userRole.userId,
      roleId: userRole.roleId,
      grantedBy: userRole.grantedBy,
      grantedAt: userRole.grantedAt,
      expiresAt: userRole.expiresAt,
    });

    return {
      id: userRole.id,
      userId: userRole.userId,
      roleId: userRole.roleId,
      role: {
        id: userRole.role.id,
        name: userRole.role.name,
        slug: userRole.role.slug,
        description: userRole.role.description,
        isSystemRole: userRole.role.isSystemRole,
        isActive: userRole.role.isActive,
        permissionCount: userRole.role.permissions?.length || 0,
      },
      grantedBy: userRole.grantedBy,
      grantedAt: userRole.grantedAt,
      expiresAt: userRole.expiresAt,
      isPermanent: entity.isPermanent(),
      isExpired: entity.isExpired(),
      isActive: entity.isActive(),
      remainingDays: entity.getRemainingDays(),
    };
  }
}
