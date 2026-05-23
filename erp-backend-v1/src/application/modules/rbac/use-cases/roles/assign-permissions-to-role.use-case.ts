/**
 * Assign Permissions to Role Use Case
 * Business logic for adding permissions to a role
 *
 * This ADDS permissions to the role without removing existing ones.
 * Use ReplaceRolePermissionsUseCase if you want to replace all permissions at once.
 *
 * Security:
 * - Only SUPERADMIN can assign permissions
 * - Validates all permission IDs exist
 * - Only assigns active permissions
 * - Creates audit log
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
import { AssignPermissionsDto, MessageResponseDto } from '../../dto';

@Injectable()
export class AssignPermissionsToRoleUseCase {
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
    this.logger.setContext(AssignPermissionsToRoleUseCase.name);
  }

  async execute(
    roleId: string,
    assignPermissionsDto: AssignPermissionsDto,
    assignedBy: string,
  ): Promise<MessageResponseDto> {
    const { permissionIds } = assignPermissionsDto;

    // 1. Verify that the user is SUPERADMIN
    const admin = await this.authRepository.findUserWithRoles(
      assignedBy,
      false,
    );

    if (!admin || !admin.hasRole('SUPERADMIN')) {
      this.logger.warn(
        `Non-SUPERADMIN user attempted to assign permissions to role: ${admin?.email || assignedBy}`,
      );
      throw new ForbiddenException(
        'Only SUPERADMIN users can assign permissions to roles',
      );
    }

    // 2. Check if role exists
    const role = await this.roleRepository.findById(roleId, false);

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // 3. Validate all permission IDs exist
    const permissions =
      await this.permissionRepository.findByIds(permissionIds);

    if (permissions.length !== permissionIds.length) {
      const foundIds = permissions.map((p) => p.id);
      const missingIds = permissionIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(
        `Some permission IDs do not exist: ${missingIds.join(', ')}`,
      );
    }

    // 5. Assign permissions to role
    await this.roleRepository.assignPermissions(roleId, permissionIds);
    await this.cache.invalidatePattern('auth:me:*');
    await this.cache.invalidatePattern('auth:jwt-context:*');

    this.logger.log(
      `Assigned ${permissions.length} permission(s) to role ${role.name} (${role.slug}) by ${admin.email}`,
    );

    return {
      message: `Successfully assigned ${permissions.length} permission(s) to role '${role.name}'`,
    };
  }
}
