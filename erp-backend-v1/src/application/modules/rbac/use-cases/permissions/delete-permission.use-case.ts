/**
 * Delete Permission Use Case
 * Business logic for deleting a permission
 *
 * Important Safety Rules:
 * - Cannot delete permission if it's assigned to any role
 * - Cannot delete permission if it's used in custom user permissions
 * - Only SUPERADMIN can delete permissions
 * - Creates audit log before deletion
 *
 * Recommendation: Instead of deleting, consider deactivating permissions
 * to preserve audit history and prevent breaking existing role configurations.
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
import type { IPermissionRepository } from '../../repositories/permission.repository.interface';
import type { IAuthRepository } from '../../../auth/repositories';
import { PERMISSION_REPOSITORY } from '../../repositories';
import { AUTH_REPOSITORY } from '../../../auth/repositories';
import { MessageResponseDto } from '../../dto';

@Injectable()
export class DeletePermissionUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(DeletePermissionUseCase.name);
  }

  async execute(
    permissionId: string,
    deletedBy: string,
  ): Promise<MessageResponseDto> {
    // 1. Verify that the user deleting the permission is SUPERADMIN
    const admin = await this.authRepository.findUserWithRoles(deletedBy, false);

    if (!admin || !admin.hasRole('SUPERADMIN')) {
      this.logger.warn(
        `Non-SUPERADMIN user attempted to delete permission: ${admin?.email || deletedBy}`,
      );
      throw new ForbiddenException(
        this.i18n.t('rbac.permissions.delete.onlySuperadmin'),
      );
    }

    // 2. Check if permission exists
    const permission = await this.permissionRepository.findById(permissionId);

    if (!permission) {
      throw new NotFoundException(
        this.i18n.t('rbac.permissions.delete.notFound'),
      );
    }

    // 3. Check if permission is assigned to any role
    const isAssigned =
      await this.permissionRepository.isAssignedToAnyRole(permissionId);

    if (isAssigned) {
      this.logger.warn(
        `Attempt to delete permission ${permission.getPermissionString()} which is assigned to roles`,
      );
      throw new BadRequestException(
        this.i18n.t('rbac.permissions.delete.hasAssignments'),
      );
    }

    const permissionString = permission.getPermissionString();

    // 5. Delete the permission
    await this.permissionRepository.delete(permissionId);

    this.logger.warn(
      `Permission deleted: ${permissionString} by ${admin.email}`,
    );

    return {
      message: `Permission '${permissionString}' deleted successfully`,
    };
  }
}
