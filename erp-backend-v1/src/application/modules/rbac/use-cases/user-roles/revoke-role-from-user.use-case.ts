/**
 * Revoke Role from User Use Case
 * Business logic for removing a role from a user
 *
 * Security:
 * - Only SUPERADMIN / IT_ADMIN can revoke roles
 * - Creates audit log and permission grant history
 * - Cannot revoke SUPERADMIN role if user is the last SUPERADMIN
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import { RedisCacheService } from '../../../../../infrastructure/cache/redis-cache.service';
import type { IRoleRepository } from '../../repositories/role.repository.interface';
import type { IAuthRepository } from '../../../auth/repositories';
import { ROLE_REPOSITORY } from '../../repositories';
import { AUTH_REPOSITORY } from '../../../auth/repositories';
import {
  buildAuthMeCacheKey,
  buildJwtAuthContextUserPattern,
} from '../../../auth/auth-cache.keys';
import { RevokeRoleDto, MessageResponseDto } from '../../dto';

@Injectable()
export class RevokeRoleFromUserUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly cache: RedisCacheService,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(RevokeRoleFromUserUseCase.name);
  }

  async execute(
    revokeRoleDto: RevokeRoleDto,
    revokedBy: string,
  ): Promise<MessageResponseDto> {
    const { userId, roleId } = revokeRoleDto;

    // 1. Verify that the user revoking the role is SUPERADMIN / IT_ADMIN
    const admin = await this.authRepository.findUserWithRoles(revokedBy, false);

    if (
      !admin ||
      (!admin.hasRole('SUPERADMIN') && !admin.hasRole('IT_ADMIN'))
    ) {
      this.logger.warn(
        `Non-SUPERADMIN/IT_ADMIN user attempted to revoke role: ${admin?.email || revokedBy}`,
      );
      throw new ForbiddenException(
        'Only SUPERADMIN or IT_ADMIN users can revoke roles',
      );
    }

    // 2. Check if target user exists
    const targetUser = await this.authRepository.findUserById(userId);

    if (!targetUser) {
      throw new NotFoundException(
        this.i18n.t('rbac.roles.revoke.userNotFound', { args: { id: userId } }),
      );
    }

    // 3. Check if role exists
    const role = await this.roleRepository.findById(roleId, false);

    if (!role) {
      throw new NotFoundException(
        this.i18n.t('rbac.roles.revoke.roleNotFound', { args: { id: roleId } }),
      );
    }

    // 4. Find active user role assignment
    const now = new Date();
    const userRoleAssignment = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        OR: [
          { expiresAt: null }, // Permanent
          { expiresAt: { gt: now } }, // Not expired
        ],
      },
    });

    if (!userRoleAssignment) {
      throw new NotFoundException(
        this.i18n.t('rbac.roles.revoke.assignmentNotFound'),
      );
    }

    // 5. CRITICAL SAFETY CHECK: Prevent revoking last SUPERADMIN
    if (role.slug === 'SUPERADMIN') {
      const superadminCount = await this.prisma.userRole.count({
        where: {
          role: {
            slug: 'SUPERADMIN',
            isActive: true,
          },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      });

      if (superadminCount <= 1) {
        this.logger.error(
          `Attempt to revoke last SUPERADMIN role from user ${targetUser.email} by ${admin.email}`,
        );
        throw new BadRequestException(
          'Cannot revoke SUPERADMIN role from the last SUPERADMIN user. System must have at least one SUPERADMIN.',
        );
      }
    }

    // 5.5. SAFETY CHECK: Prevent revoking user's only role
    const userRolesCount = await this.prisma.userRole.count({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });

    if (userRolesCount <= 1) {
      this.logger.warn(
        `Attempt to revoke the only role from user ${targetUser.email} by ${admin.email}`,
      );
      throw new BadRequestException(
        'Cannot revoke the only role from user. User must have at least one role.',
      );
    }

    // 6. Delete the user role assignment
    await this.prisma.userRole.delete({
      where: {
        id: userRoleAssignment.id,
      },
    });

    // 7. Create permission grant history entry
    await this.prisma.permissionGrantHistory.create({
      data: {
        userId,
        action: 'ROLE_REVOCATION',
        targetType: 'ROLE',
        targetId: roleId,
        grantedBy: revokedBy,
        expiresAt: null,
        reason: `Revoked role: ${role.name}`,
      },
    });

    // RBAC changes affect the /auth/me response payload (roles + permissions).
    await this.cache.del(buildAuthMeCacheKey(userId));
    await this.cache.invalidatePattern(buildJwtAuthContextUserPattern(userId));

    this.logger.log(
      `Role ${role.name} revoked from user ${targetUser.email} by ${admin.email}`,
    );

    return {
      message: `Successfully revoked role '${role.name}' from user`,
    };
  }
}
