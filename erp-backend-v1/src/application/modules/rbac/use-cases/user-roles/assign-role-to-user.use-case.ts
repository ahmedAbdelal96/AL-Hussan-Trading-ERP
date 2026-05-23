/**
 * Assign Role to User Use Case
 * Business logic for assigning a role to a user
 *
 * Features:
 * - Can assign permanent or temporary (with expiration) roles
 * - Prevents duplicate role assignments
 * - Validates user and role existence
 * - Creates audit log and permission grant history
 *
 * Security:
 * - Only SUPERADMIN / IT_ADMIN can assign roles
 * - Cannot assign inactive roles
 * - Validates expiration date is in the future
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
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
import { AssignRoleDto, UserRoleResponseDto } from '../../dto';
import { UserRoleEntity } from '../../entities';

@Injectable()
export class AssignRoleToUserUseCase {
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
    this.logger.setContext(AssignRoleToUserUseCase.name);
  }

  async execute(
    assignRoleDto: AssignRoleDto,
    grantedBy: string,
  ): Promise<UserRoleResponseDto> {
    const { userId, roleId, expiresAt } = assignRoleDto;

    // 1. Verify that the user assigning the role is SUPERADMIN / IT_ADMIN
    const admin = await this.authRepository.findUserWithRoles(grantedBy, false);

    if (
      !admin ||
      (!admin.hasRole('SUPERADMIN') && !admin.hasRole('IT_ADMIN'))
    ) {
      this.logger.warn(
        `Non-SUPERADMIN/IT_ADMIN user attempted to assign role: ${admin?.email || grantedBy}`,
      );
      throw new ForbiddenException(
        'Only SUPERADMIN or IT_ADMIN users can assign roles',
      );
    }

    // 2. Check if target user exists
    const targetUser = await this.authRepository.findUserById(userId);

    if (!targetUser) {
      throw new NotFoundException(
        this.i18n.t('rbac.roles.assign.userNotFound', { args: { id: userId } }),
      );
    }

    // 3. Check if role exists and is active
    const role = await this.roleRepository.findById(roleId, false);

    if (!role) {
      throw new NotFoundException(
        this.i18n.t('rbac.roles.assign.roleNotFound', { args: { id: roleId } }),
      );
    }

    if (!role.isActive) {
      throw new BadRequestException(
        this.i18n.t('rbac.roles.assign.cannotAssignInactive', {
          args: { name: role.name },
        }),
      );
    }

    // 4. Check if user already has this role (active assignment)
    const existingAssignment = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        OR: [
          { expiresAt: null }, // Permanent
          { expiresAt: { gt: new Date() } }, // Not expired
        ],
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        `User already has role '${role.name}' assigned`,
      );
    }

    // 5. Validate expiration date if provided
    let expirationDate: Date | null = null;
    if (expiresAt) {
      expirationDate = new Date(expiresAt);
      UserRoleEntity.validateExpirationDate(expirationDate);
    }

    // 6. Create user role assignment
    const userRole = await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        grantedBy,
        expiresAt: expirationDate,
      },
      include: {
        role: true,
      },
    });

    // 7. Create permission grant history entry
    await this.prisma.permissionGrantHistory.create({
      data: {
        userId,
        action: 'ROLE_ASSIGNMENT',
        targetType: 'ROLE',
        targetId: roleId,
        grantedBy: grantedBy,
        expiresAt: expirationDate,
        reason: `Assigned role: ${role.name}`,
      },
    });

    // RBAC changes affect the /auth/me response payload (roles + permissions).
    await this.cache.del(buildAuthMeCacheKey(userId));
    await this.cache.invalidatePattern(buildJwtAuthContextUserPattern(userId));

    this.logger.log(
      `Role ${role.name} assigned to user ${targetUser.email} by ${admin.email}${expirationDate ? ` (expires: ${expirationDate.toISOString()})` : ' (permanent)'}`,
    );

    // 9. Return response
    return this.mapToResponseDto(userRole);
  }

  /**
   * Map Prisma UserRole to UserRoleResponseDto
   */
  private mapToResponseDto(userRole: any): UserRoleResponseDto {
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
        permissionCount: 0, // We don't load permissions here for performance
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
