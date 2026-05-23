/**
 * Get Permission Use Case
 * Business logic for retrieving a single permission by ID
 *
 * Security:
 * - Only authenticated users with 'permissions:read' permission can access
 * - Returns 404 if permission doesn't exist
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import type { IPermissionRepository } from '../../repositories/permission.repository.interface';
import { PERMISSION_REPOSITORY } from '../../repositories';
import { PermissionResponseDto } from '../../dto';

@Injectable()
export class GetPermissionUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(GetPermissionUseCase.name);
  }

  async execute(permissionId: string): Promise<PermissionResponseDto> {
    // Find permission by ID
    const permission = await this.permissionRepository.findById(permissionId);

    if (!permission) {
      throw new NotFoundException(this.i18n.t('rbac.permissions.get.notFound'));
    }

    return this.mapToResponseDto(permission);
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
