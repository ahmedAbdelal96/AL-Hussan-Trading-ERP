/**
 * Grant Custom Permission to User Use Case
 * Business logic for granting a specific permission to a user (GRANT type)
 *
 * Use Cases:
 * - Give temporary elevated access to a user
 * - Grant exception permissions outside of role structure
 * - Handle special cases where role permissions are not flexible enough
 *
 * The Algorithm:
 * Effective Permissions = (Role Permissions + GRANT) - REVOKE
 *
 * Security:
 * - Only SUPERADMIN / IT_ADMIN can grant custom permissions
 * - Requires detailed reason for audit purposes (min 10 chars)
 * - Creates permission grant history
 * - Can be temporary (with expiration) or permanent
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import { RedisCacheService } from '../../../../../infrastructure/cache/redis-cache.service';
import type { IPermissionRepository } from '../../repositories/permission.repository.interface';
import type { IAuthRepository } from '../../../auth/repositories';
import { PERMISSION_REPOSITORY } from '../../repositories';
import { AUTH_REPOSITORY } from '../../../auth/repositories';
import {
  buildAuthMeCacheKey,
  buildJwtAuthContextUserPattern,
} from '../../../auth/auth-cache.keys';
import { GrantPermissionDto, UserCustomPermissionResponseDto } from '../../dto';
import { UserCustomPermissionEntity, PermissionType } from '../../entities';

@Injectable()
export class GrantPermissionToUserUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly cache: RedisCacheService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GrantPermissionToUserUseCase.name);
  }

  async execute(
    grantPermissionDto: GrantPermissionDto,
    grantedBy: string,
  ): Promise<UserCustomPermissionResponseDto> {
    const { userId, permissionId, expiresAt } = grantPermissionDto;

    // 1. Verify that the user granting permission is SUPERADMIN / IT_ADMIN
    const admin = await this.authRepository.findUserWithRoles(grantedBy, false);

    if (
      !admin ||
      (!admin.hasRole('SUPERADMIN') && !admin.hasRole('IT_ADMIN'))
    ) {
      this.logger.warn(
        `Non-SUPERADMIN/IT_ADMIN user attempted to grant custom permission: ${admin?.email || grantedBy}`,
      );
      throw new ForbiddenException(
        'Only SUPERADMIN or IT_ADMIN users can grant custom permissions',
      );
    }

    // 2. Check if target user exists
    const targetUser = await this.authRepository.findUserById(userId);

    if (!targetUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 3. Check if permission exists
    const permission = await this.permissionRepository.findById(permissionId);

    if (!permission) {
      throw new NotFoundException(
        `Permission with ID ${permissionId} not found`,
      );
    }

    // 4. Check if user already has active GRANT for this permission
    const now = new Date();
    const existingGrant = await this.prisma.userCustomPermission.findFirst({
      where: {
        userId,
        permissionId,
        permissionType: PermissionType.GRANT,
        OR: [
          { expiresAt: null }, // Permanent
          { expiresAt: { gt: now } }, // Not expired
        ],
      },
    });

    if (existingGrant) {
      throw new ConflictException(
        `User already has an active GRANT for permission '${permission.getPermissionString()}'`,
      );
    }

    // 5. Validate expiration date if provided
    let expirationDate: Date | null = null;
    if (expiresAt) {
      expirationDate = new Date(expiresAt);
      UserCustomPermissionEntity.validateExpirationDate(expirationDate);
    }

    // 6. Create custom permission (GRANT type)
    const customPermission = await this.prisma.userCustomPermission.create({
      data: {
        userId,
        permissionId,
        permissionType: PermissionType.GRANT,
        grantedBy,
        expiresAt: expirationDate,
      },
      include: {
        permission: true,
      },
    });

    // 7. Create permission grant history entry
    await this.prisma.permissionGrantHistory.create({
      data: {
        userId,
        action: 'PERMISSION_GRANT',
        targetType: 'PERMISSION',
        targetId: permissionId,
        grantedBy,
        expiresAt: expirationDate,
        reason: `Granted permission: ${permission.getPermissionString()}`,
      },
    });

    // RBAC changes affect the /auth/me response payload (roles + permissions).
    await this.cache.del(buildAuthMeCacheKey(userId));
    await this.cache.invalidatePattern(buildJwtAuthContextUserPattern(userId));

    this.logger.log(
      `Custom permission ${permission.getPermissionString()} GRANTED to user ${targetUser.email} by ${admin.email}${expirationDate ? ` (expires: ${expirationDate.toISOString()})` : ' (permanent)'}`,
    );

    // 9. Return response
    return this.mapToResponseDto(customPermission);
  }

  /**
   * Map Prisma UserCustomPermission to UserCustomPermissionResponseDto
   */
  private mapToResponseDto(
    customPermission: any,
  ): UserCustomPermissionResponseDto {
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
