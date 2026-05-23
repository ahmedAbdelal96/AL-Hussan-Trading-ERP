/**
 * Remove Permissions from Role Use Case
 * Business logic for removing permissions from a role
 *
 * Security:
 * - Only SUPERADMIN can remove permissions
 * - Creates audit log
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { RedisCacheService } from '../../../../../infrastructure/cache/redis-cache.service';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import type { IRoleRepository } from '../../repositories/role.repository.interface';
import type { IPermissionRepository } from '../../repositories/permission.repository.interface';
import type { IAuthRepository } from '../../../auth/repositories';
import { ROLE_REPOSITORY, PERMISSION_REPOSITORY } from '../../repositories';
import { AUTH_REPOSITORY } from '../../../auth/repositories';
import { RemovePermissionsDto, MessageResponseDto } from '../../dto';

@Injectable()
export class RemovePermissionsFromRoleUseCase {
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
    this.logger.setContext(RemovePermissionsFromRoleUseCase.name);
  }

  async execute(
    roleId: string,
    removePermissionsDto: RemovePermissionsDto,
    removedBy: string,
  ): Promise<MessageResponseDto> {
    const { permissionIds } = removePermissionsDto;

    // 1. Verify that the user is SUPERADMIN
    const admin = await this.authRepository.findUserWithRoles(removedBy, false);

    if (!admin || !admin.hasRole('SUPERADMIN')) {
      this.logger.warn(
        `Non-SUPERADMIN user attempted to remove permissions from role: ${admin?.email || removedBy}`,
      );
      throw new ForbiddenException(
        'Only SUPERADMIN users can remove permissions from roles',
      );
    }

    // 2. Check if role exists
    const role = await this.roleRepository.findById(roleId, false);

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // 3. Get permission details for audit log
    const permissions =
      await this.permissionRepository.findByIds(permissionIds);

    // 4. Remove permissions from role
    await this.roleRepository.removePermissions(roleId, permissionIds);
    await this.cache.invalidatePattern('auth:me:*');
    await this.cache.invalidatePattern('auth:jwt-context:*');

    this.logger.log(
      `Removed ${permissions.length} permission(s) from role ${role.name} (${role.slug}) by ${admin.email}`,
    );

    return {
      message: `Successfully removed ${permissions.length} permission(s) from role '${role.name}'`,
    };
  }
}
