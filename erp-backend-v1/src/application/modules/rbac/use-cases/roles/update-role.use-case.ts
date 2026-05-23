/**
 * Update Role Use Case
 * Business logic for updating an existing role
 *
 * Important Rules:
 * - System roles (SUPERADMIN, ADMIN, etc.) cannot be renamed or have slug changed
 * - System roles CAN have description and permissions updated
 * - Only SUPERADMIN can update roles
 * - Creates audit log
 *
 * Security:
 * - Only SUPERADMIN can update roles
 * - Validates role exists
 * - Protects system roles from name/slug changes
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { RedisCacheService } from '../../../../../infrastructure/cache/redis-cache.service';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import type { IRoleRepository } from '../../repositories/role.repository.interface';
import type { IAuthRepository } from '../../../auth/repositories';
import { ROLE_REPOSITORY } from '../../repositories';
import { AUTH_REPOSITORY } from '../../../auth/repositories';
import { UpdateRoleDto, RoleResponseDto } from '../../dto';
import { RoleEntity } from '../../entities';

@Injectable()
export class UpdateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly cache: RedisCacheService,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(UpdateRoleUseCase.name);
  }

  async execute(
    roleId: string,
    updateRoleDto: UpdateRoleDto,
    updatedBy: string,
  ): Promise<RoleResponseDto> {
    const { name, slug, description, isActive } = updateRoleDto;

    // 1. Verify that the user updating the role is SUPERADMIN
    const admin = await this.authRepository.findUserWithRoles(updatedBy, false);

    if (!admin || !admin.hasRole('SUPERADMIN')) {
      this.logger.warn(
        `Non-SUPERADMIN user attempted to update role: ${admin?.email || updatedBy}`,
      );
      throw new ForbiddenException(
        this.i18n.t('rbac.roles.update.onlySuperadmin'),
      );
    }

    // 2. Check if role exists
    const existingRole = await this.roleRepository.findById(roleId, true);

    if (!existingRole) {
      throw new NotFoundException(
        this.i18n.t('rbac.roles.update.notFound', { args: { id: roleId } }),
      );
    }

    // 3. Check if trying to update name/slug of system role
    if (existingRole.isSystemRole && (name || slug)) {
      this.logger.warn(
        `Attempt to rename system role ${existingRole.slug} by ${admin.email}`,
      );
      throw new BadRequestException(
        this.i18n.t('rbac.roles.update.cannotUpdateSystemRole', {
          args: { name: existingRole.name },
        }),
      );
    }

    // 4. Validate new name and slug if provided
    if (name) {
      RoleEntity.validateName(name);
    }

    if (slug) {
      RoleEntity.validateSlug(slug);

      // Check if new slug conflicts with existing role (excluding current role)
      const conflicting = await this.roleRepository.findBySlug(
        slug.toLowerCase(),
      );
      if (conflicting && conflicting.id !== roleId) {
        throw new BadRequestException(
          `Role with slug '${slug}' already exists`,
        );
      }
    }

    // 5. Update the role
    const updatedRole = await this.roleRepository.update(roleId, {
      name,
      slug: slug?.toLowerCase(),
      description,
      isActive,
    });
    await this.cache.invalidatePattern('auth:me:*');
    await this.cache.invalidatePattern('auth:jwt-context:*');

    // 6. Fetch updated role with permissions
    const roleWithPermissions = await this.roleRepository.findById(
      roleId,
      true,
    );

    this.logger.log(`Role updated: ${updatedRole.name} by ${admin.email}`);

    // 8. Return response
    return this.mapToResponseDto(roleWithPermissions!);
  }

  /**
   * Map RoleEntity to RoleResponseDto
   */
  private mapToResponseDto(role: RoleEntity): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystemRole: role.isSystemRole,
      isActive: role.isActive,
      permissionCount: role.permissions?.length || 0,
      permissions:
        role.permissions?.map((p) => ({
          id: p.id,
          resource: p.resource,
          action: p.action,
          permission: p.getPermissionString(),
          description: p.description,
          descriptionAr: p.descriptionAr || p.description,
          createdAt: p.createdAt,
        })) || [],
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
