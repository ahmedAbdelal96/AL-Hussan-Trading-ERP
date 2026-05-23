/**
 * Get Role Use Case
 * Business logic for retrieving a single role by ID with its permissions
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import type { IRoleRepository } from '../../repositories/role.repository.interface';
import { ROLE_REPOSITORY } from '../../repositories';
import { RoleResponseDto } from '../../dto';
import { RoleEntity } from '../../entities';

@Injectable()
export class GetRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(GetRoleUseCase.name);
  }

  async execute(roleId: string): Promise<RoleResponseDto> {
    // Find role by ID with permissions
    const role = await this.roleRepository.findById(roleId, true);

    if (!role) {
      throw new NotFoundException(this.i18n.t('rbac.roles.get.notFound'));
    }

    return this.mapToResponseDto(role);
  }

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
