/**
 * Get User Custom Permissions Use Case
 * Business logic for retrieving all custom permissions for a user
 *
 * Returns both GRANT and REVOKE type custom permissions
 * Useful for debugging and showing user's permission exceptions
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import type { IAuthRepository } from '../../../auth/repositories';
import { AUTH_REPOSITORY } from '../../../auth/repositories';
import {
  UserCustomPermissionsResponseDto,
  UserCustomPermissionResponseDto,
} from '../../dto';
import { UserCustomPermissionEntity, PermissionType } from '../../entities';

@Injectable()
export class GetUserCustomPermissionsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetUserCustomPermissionsUseCase.name);
  }

  async execute(
    userId: string,
    includeExpired: boolean = false,
  ): Promise<UserCustomPermissionsResponseDto> {
    // 1. Check if user exists
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 2. Get user custom permissions
    const now = new Date();
    const whereClause: any = {
      userId,
    };

    if (!includeExpired) {
      whereClause.OR = [
        { expiresAt: null }, // Permanent
        { expiresAt: { gt: now } }, // Not expired
      ];
    }

    const customPermissions = await this.prisma.userCustomPermission.findMany({
      where: whereClause,
      include: {
        permission: true,
      },
      orderBy: [
        { permissionType: 'asc' }, // GRANT before REVOKE
        { expiresAt: 'asc' }, // Expiring soon first
        { grantedAt: 'desc' }, // Recently granted first
      ],
    });

    // 3. Map to response DTOs
    const customPermissionDtos = customPermissions.map((cp) =>
      this.mapToDto(cp),
    );

    // 4. Calculate statistics
    const grantedCount = customPermissionDtos.filter(
      (cp) => cp.permissionType === PermissionType.GRANT,
    ).length;
    const revokedCount = customPermissionDtos.filter(
      (cp) => cp.permissionType === PermissionType.REVOKE,
    ).length;

    return {
      userId,
      customPermissions: customPermissionDtos,
      totalCustomPermissions: customPermissionDtos.length,
      grantedCount,
      revokedCount,
    };
  }

  /**
   * Map Prisma UserCustomPermission to UserCustomPermissionResponseDto
   */
  private mapToDto(customPermission: any): UserCustomPermissionResponseDto {
    const entity = new UserCustomPermissionEntity({
      id: customPermission.id,
      userId: customPermission.userId,
      permissionId: customPermission.permissionId,
      permissionType: customPermission.permissionType,
      grantedBy: customPermission.grantedBy,
      grantedAt: customPermission.grantedAt,
      expiresAt: customPermission.expiresAt,
    });

    return {
      id: customPermission.id,
      userId: customPermission.userId,
      permissionId: customPermission.permissionId,
      permission: {
        id: customPermission.permission.id,
        resource: customPermission.permission.resource,
        action: customPermission.permission.action,
        permission: `${customPermission.permission.resource}:${customPermission.permission.action}`,
        description: customPermission.permission.description,
        descriptionAr:
          customPermission.permission.descriptionAr ||
          customPermission.permission.description,
      },
      permissionType: customPermission.permissionType,
      grantedBy: customPermission.grantedBy,
      grantedAt: customPermission.grantedAt,
      expiresAt: customPermission.expiresAt,
      isPermanent: entity.isPermanent(),
      isExpired: entity.isExpired(),
      isActive: entity.isActive(),
      remainingDays: entity.getRemainingDays(),
    };
  }
}
