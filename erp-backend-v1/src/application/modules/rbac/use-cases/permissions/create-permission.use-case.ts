/**
 * Create Permission Use Case
 * Business logic for creating a new permission
 *
 * Security:
 * - Only SUPERADMIN can create permissions
 * - Validates permission format (resource:action)
 * - Prevents duplicate permissions
 * - Creates audit log
 */

import {
  Injectable,
  Inject,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import type { IPermissionRepository } from '../../repositories/permission.repository.interface';
import type { IAuthRepository } from '../../../auth/repositories';
import { PERMISSION_REPOSITORY } from '../../repositories';
import { AUTH_REPOSITORY } from '../../../auth/repositories';
import { CreatePermissionDto, PermissionResponseDto } from '../../dto';
import { PermissionEntity } from '../../entities';

@Injectable()
export class CreatePermissionUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(CreatePermissionUseCase.name);
  }

  async execute(
    createPermissionDto: CreatePermissionDto,
    createdBy: string,
  ): Promise<PermissionResponseDto> {
    const { resource, action, description } = createPermissionDto;

    // 1. Verify that the user creating the permission is SUPERADMIN
    const admin = await this.authRepository.findUserWithRoles(createdBy, false);

    if (!admin || !admin.hasRole('SUPERADMIN')) {
      this.logger.warn(
        `Non-SUPERADMIN user attempted to create permission: ${admin?.email || createdBy}`,
      );
      throw new ForbiddenException(
        this.i18n.t('rbac.permissions.create.onlySuperadmin'),
      );
    }

    // 2. Validate permission format
    // This will throw an error if format is invalid
    PermissionEntity.validatePermissionFormat(resource, action);

    // 3. Check if permission already exists
    const existing = await this.permissionRepository.findByResourceAndAction(
      resource.toLowerCase(),
      action.toLowerCase(),
    );

    if (existing) {
      const permissionString = existing.getPermissionString();
      this.logger.warn(
        `Attempt to create duplicate permission: ${permissionString}`,
      );
      throw new ConflictException(
        this.i18n.t('rbac.permissions.create.exists', {
          args: { permission: permissionString },
        }),
      );
    }

    // 4. Create the permission
    const permission = await this.permissionRepository.create({
      resource: resource.toLowerCase(),
      action: action.toLowerCase(),
      description,
    });

    this.logger.log(
      `Permission created: ${permission.getPermissionString()} by ${admin.email}`,
    );

    // 6. Return response
    return this.mapToResponseDto(permission);
  }

  /**
   * Map PermissionEntity to PermissionResponseDto
   */
  private mapToResponseDto(
    permission: PermissionEntity,
  ): PermissionResponseDto {
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
