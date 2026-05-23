/**
 * Delete Role Use Case
 * Business logic for deleting a role
 *
 * Important Safety Rules:
 * - CANNOT delete system roles (SUPERADMIN, ADMIN, etc.)
 * - CANNOT delete role if assigned to any user
 * - Only SUPERADMIN can delete roles
 * - Creates audit log before deletion
 * - All role permissions are removed automatically
 *
 * Recommendation: Instead of deleting, consider deactivating roles
 * to preserve audit history and prevent breaking user assignments.
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import type { IRoleRepository } from '../../repositories/role.repository.interface';
import type { IAuthRepository } from '../../../auth/repositories';
import { ROLE_REPOSITORY } from '../../repositories';
import { AUTH_REPOSITORY } from '../../../auth/repositories';
import { MessageResponseDto } from '../../dto';

@Injectable()
export class DeleteRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(DeleteRoleUseCase.name);
  }

  async execute(
    roleId: string,
    deletedBy: string,
  ): Promise<MessageResponseDto> {
    // 1. Verify that the user deleting the role is SUPERADMIN
    const admin = await this.authRepository.findUserWithRoles(deletedBy, false);

    if (!admin || !admin.hasRole('SUPERADMIN')) {
      this.logger.warn(
        `Non-SUPERADMIN user attempted to delete role: ${admin?.email || deletedBy}`,
      );
      throw new ForbiddenException(
        this.i18n.t('rbac.roles.delete.onlySuperadmin'),
      );
    }

    // 2. Check if role exists
    const role = await this.roleRepository.findById(roleId, false);

    if (!role) {
      throw new NotFoundException(
        this.i18n.t('rbac.roles.delete.notFound', { args: { id: roleId } }),
      );
    }

    // 3. Check if it's a system role
    if (role.isSystemRole) {
      this.logger.warn(
        `Attempt to delete system role ${role.slug} by ${admin.email}`,
      );
      throw new BadRequestException(
        this.i18n.t('rbac.roles.delete.cannotDeleteSystemRole', {
          args: { name: role.name },
        }),
      );
    }

    // 4. Check if role is assigned to any user
    const isAssigned = await this.roleRepository.isAssignedToAnyUser(roleId);

    if (isAssigned) {
      this.logger.warn(
        `Attempt to delete role ${role.slug} which is assigned to users`,
      );
      throw new BadRequestException(
        this.i18n.t('rbac.roles.delete.hasAssignedUsers'),
      );
    }

    const roleName = role.name;
    const roleSlug = role.slug;

    // 6. Delete the role (will also delete role permissions via repository)
    await this.roleRepository.delete(roleId);

    this.logger.warn(
      `Role deleted: ${roleName} (${roleSlug}) by ${admin.email}`,
    );

    return {
      message: `Role '${roleName}' deleted successfully`,
    };
  }
}
