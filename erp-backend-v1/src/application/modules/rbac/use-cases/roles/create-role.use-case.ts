/**
 * Create Role Use Case
 * Business logic for creating a new role
 *
 * Security:
 * - Only SUPERADMIN can create roles
 * - Validates role name and slug
 * - Prevents duplicate slugs
 * - Can optionally assign permissions during creation
 * - Creates audit log
 */

import {
  Injectable,
  Inject,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import type { IRoleRepository } from '../../repositories/role.repository.interface';
import type { IPermissionRepository } from '../../repositories/permission.repository.interface';
import type { IAuthRepository } from '../../../auth/repositories';
import { ROLE_REPOSITORY, PERMISSION_REPOSITORY } from '../../repositories';
import { AUTH_REPOSITORY } from '../../../auth/repositories';
import { CreateRoleDto, RoleResponseDto } from '../../dto';
import { RoleEntity } from '../../entities';

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(CreateRoleUseCase.name);
  }

  async execute(
    createRoleDto: CreateRoleDto,
    createdBy: string,
  ): Promise<RoleResponseDto> {
    const { name, slug, description, isActive, permissionIds } = createRoleDto;

    // 1. Verify that the user creating the role is SUPERADMIN
    const admin = await this.authRepository.findUserWithRoles(createdBy, false);

    if (!admin || !admin.hasRole('SUPERADMIN')) {
      this.logger.warn(
        `Non-SUPERADMIN user attempted to create role: ${admin?.email || createdBy}`,
      );
      throw new ForbiddenException(
        this.i18n.t('rbac.roles.create.onlySuperadmin'),
      );
    }

    // 2. Validate role name and slug format
    RoleEntity.validateName(name);
    RoleEntity.validateSlug(slug);

    // 3. Check if role with this slug already exists
    const existing = await this.roleRepository.findBySlug(slug.toUpperCase());

    if (existing) {
      this.logger.warn(`Attempt to create duplicate role slug: ${slug}`);
      throw new ConflictException(
        this.i18n.t('rbac.roles.create.slugExists', { args: { slug } }),
      );
    }

    // 4. If permissions are provided, validate they exist
    if (permissionIds && permissionIds.length > 0) {
      const permissions =
        await this.permissionRepository.findByIds(permissionIds);

      if (permissions.length !== permissionIds.length) {
        const foundIds = permissions.map((p) => p.id);
        const missingIds = permissionIds.filter((id) => !foundIds.includes(id));
        throw new BadRequestException(
          `Some permission IDs do not exist: ${missingIds.join(', ')}`,
        );
      }
    }

    // 5. Create the role
    const role = await this.roleRepository.create({
      name,
      slug: slug.toUpperCase(),
      description,
      isSystemRole: false, // Custom roles are never system roles
      isActive: isActive ?? true,
    });

    // 6. Assign permissions if provided
    if (permissionIds && permissionIds.length > 0) {
      await this.roleRepository.assignPermissions(role.id, permissionIds);
    }

    // 7. Fetch role with permissions for response
    const roleWithPermissions = await this.roleRepository.findById(
      role.id,
      true,
    );

    this.logger.log(
      `Role created: ${role.name} (${role.slug}) by ${admin.email}`,
    );

    // 9. Return response
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
