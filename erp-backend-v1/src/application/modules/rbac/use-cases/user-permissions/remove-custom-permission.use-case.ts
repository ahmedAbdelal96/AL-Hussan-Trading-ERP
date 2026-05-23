/**
 * Remove Custom Permission Use Case
 * Business logic for completely removing a custom permission (both GRANT and REVOKE)
 *
 * This is different from expiration - this completely deletes the custom permission record.
 *
 * Use Cases:
 * - Cancel a previously granted/revoked permission
 * - Clean up custom permissions
 * - Undo permission exceptions
 *
 * Security:
 * - Only SUPERADMIN / IT_ADMIN can remove custom permissions
 * - Creates audit log
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import { RedisCacheService } from '../../../../../infrastructure/cache/redis-cache.service';
import type { IAuthRepository } from '../../../auth/repositories';
import { AUTH_REPOSITORY } from '../../../auth/repositories';
import {
  buildAuthMeCacheKey,
  buildJwtAuthContextUserPattern,
} from '../../../auth/auth-cache.keys';
import { RemoveCustomPermissionDto, MessageResponseDto } from '../../dto';

@Injectable()
export class RemoveCustomPermissionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly cache: RedisCacheService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(RemoveCustomPermissionUseCase.name);
  }

  async execute(
    removeDto: RemoveCustomPermissionDto,
    removedBy: string,
  ): Promise<MessageResponseDto> {
    const { customPermissionId } = removeDto;

    // 1. Verify that the user is SUPERADMIN / IT_ADMIN
    const admin = await this.authRepository.findUserWithRoles(removedBy, false);

    if (
      !admin ||
      (!admin.hasRole('SUPERADMIN') && !admin.hasRole('IT_ADMIN'))
    ) {
      this.logger.warn(
        `Non-SUPERADMIN/IT_ADMIN user attempted to remove custom permission: ${admin?.email || removedBy}`,
      );
      throw new ForbiddenException(
        'Only SUPERADMIN or IT_ADMIN users can remove custom permissions',
      );
    }

    // 2. Find custom permission
    const customPermission = await this.prisma.userCustomPermission.findUnique({
      where: { id: customPermissionId },
      include: {
        permission: true,
      },
    });

    if (!customPermission) {
      throw new NotFoundException(
        `Custom permission with ID ${customPermissionId} not found`,
      );
    }

    // 3. Get user for audit log
    const user = await this.authRepository.findUserById(
      customPermission.userId,
    );

    const permissionString = `${customPermission.permission.resource}:${customPermission.permission.action}`;

    // 4. Delete the custom permission
    await this.prisma.userCustomPermission.delete({
      where: { id: customPermissionId },
    });

    // 5. Create permission grant history entry
    await this.prisma.permissionGrantHistory.create({
      data: {
        userId: customPermission.userId,
        action: 'PERMISSION_REMOVAL',
        targetType: 'PERMISSION',
        targetId: customPermission.permissionId,
        grantedBy: removedBy,
        expiresAt: null,
        reason: `Removed custom permission (${customPermission.permissionType}): ${permissionString}`,
      },
    });

    // RBAC changes affect the /auth/me response payload (roles + permissions).
    await this.cache.del(buildAuthMeCacheKey(customPermission.userId));
    await this.cache.invalidatePattern(
      buildJwtAuthContextUserPattern(customPermission.userId),
    );

    this.logger.log(
      `Custom permission ${permissionString} (${customPermission.permissionType}) removed from user ${user?.email || customPermission.userId} by ${admin.email}`,
    );

    return {
      message: `Custom permission removed successfully`,
    };
  }
}
