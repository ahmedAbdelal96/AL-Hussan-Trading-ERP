/**
 * Replace Role Permissions Use Case
 * Business logic for replacing ALL permissions of a role at once
 *
 * This is more efficient than manually removing and adding permissions
 * when you want to completely replace the role's permission set.
 *
 * Security:
 * - Only SUPERADMIN can replace permissions
 * - Creates audit log with before/after comparison
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { RedisCacheService } from '../../../../../infrastructure/cache/redis-cache.service';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import type { IRoleRepository } from '../../repositories/role.repository.interface';
import type { IPermissionRepository } from '../../repositories/permission.repository.interface';
import type { IAuthRepository } from '../../../auth/repositories';
import { ROLE_REPOSITORY, PERMISSION_REPOSITORY } from '../../repositories';
import { AUTH_REPOSITORY } from '../../../auth/repositories';
import { ReplacePermissionsDto, MessageResponseDto } from '../../dto';

@Injectable()
export class ReplaceRolePermissionsUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly cache: RedisCacheService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(ReplaceRolePermissionsUseCase.name);
  }

  async execute(
    roleId: string,
    replacePermissionsDto: ReplacePermissionsDto,
    replacedBy: string,
  ): Promise<MessageResponseDto> {
    const { permissionIds } = replacePermissionsDto;

    // 1. Verify that the user is SUPERADMIN
    const admin = await this.authRepository.findUserWithRoles(
      replacedBy,
      false,
    );

    if (!admin || !admin.hasRole('SUPERADMIN')) {
      this.logger.warn(
        `Non-SUPERADMIN user attempted to replace role permissions: ${admin?.email || replacedBy}`,
      );
      throw new ForbiddenException(
        'Only SUPERADMIN users can replace role permissions',
      );
    }

    // 2. Check if role exists and get current permissions
    const role = await this.roleRepository.findById(roleId, true);

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const oldPermissions = role.permissions || [];

    // 3. Validate new permission IDs if any provided
    if (permissionIds.length > 0) {
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

    // 4. Replace permissions (atomic operation)
    await this.roleRepository.replacePermissions(roleId, permissionIds);
    await this.cache.invalidatePattern('auth:me:*');
    await this.cache.invalidatePattern('auth:jwt-context:*');

    // 5. Get new permissions for audit
    const newPermissions =
      permissionIds.length > 0
        ? await this.permissionRepository.findByIds(permissionIds)
        : [];

    this.logger.log(
      `Replaced permissions for role ${role.name} (${role.slug}): ${oldPermissions.length} → ${newPermissions.length} by ${admin.email}`,
    );

    return {
      message: `Successfully replaced permissions for role '${role.name}'. New count: ${newPermissions.length}`,
    };
  }
}
