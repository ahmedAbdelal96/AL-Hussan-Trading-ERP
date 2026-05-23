/**
 * Update Permission Use Case
 * Business logic for updating an existing permission
 *
 * Note: Cannot update resource or action (these define the permission identity)
 * Can only update: description and isActive status
 *
 * Security:
 * - Only SUPERADMIN can update permissions
 * - Creates audit log
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import type { IPermissionRepository } from '../../repositories/permission.repository.interface';
import type { IAuthRepository } from '../../../auth/repositories';
import { PERMISSION_REPOSITORY } from '../../repositories';
import { AUTH_REPOSITORY } from '../../../auth/repositories';
import { UpdatePermissionDto, PermissionResponseDto } from '../../dto';

@Injectable()
export class UpdatePermissionUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(UpdatePermissionUseCase.name);
  }

  async execute(
    permissionId: string,
    updatePermissionDto: UpdatePermissionDto,
    updatedBy: string,
  ): Promise<PermissionResponseDto> {
    const { description } = updatePermissionDto;

    // 1. Verify that the user updating the permission is SUPERADMIN
    const admin = await this.authRepository.findUserWithRoles(updatedBy, false);

    if (!admin || !admin.hasRole('SUPERADMIN')) {
      this.logger.warn(
        `Non-SUPERADMIN user attempted to update permission: ${admin?.email || updatedBy}`,
      );
      throw new ForbiddenException(
        this.i18n.t('rbac.permissions.update.onlySuperadmin'),
      );
    }

    // 2. Check if permission exists
    const existingPermission =
      await this.permissionRepository.findById(permissionId);

    if (!existingPermission) {
      throw new NotFoundException(
        this.i18n.t('rbac.permissions.update.notFound'),
      );
    }

    // 3. Update the permission
    const updatedPermission = await this.permissionRepository.update(
      permissionId,
      {
        description,
      },
    );

    this.logger.log(
      `Permission updated: ${updatedPermission.getPermissionString()} by ${admin.email}`,
    );

    // 5. Return response
    return this.mapToResponseDto(updatedPermission);
  }

  /**
   * Map PermissionEntity to PermissionResponseDto
   */
  private mapToResponseDto(permission: any): PermissionResponseDto {
    return {
      id: permission.id,
      resource: permission.resource,
      action: permission.action,
      permission: permission.getPermissionString(),
      description: permission.description,
      descriptionAr: permission.descriptionAr || permission.description,
      createdAt: permission.createdAt,
    };
  }
}
