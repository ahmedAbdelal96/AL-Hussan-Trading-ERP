/**
 * Get All Roles Use Case
 * Business logic for retrieving all roles with pagination and filtering
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import type { IRoleRepository } from '../../repositories/role.repository.interface';
import { ROLE_REPOSITORY } from '../../repositories';
import { PaginatedRolesResponseDto, RoleSummaryResponseDto } from '../../dto';

interface GetAllRolesParams {
  page?: number;
  limit?: number;
  includeInactive?: boolean;
  includePermissions?: boolean;
  systemOnly?: boolean;
  customOnly?: boolean;
  search?: string;
}

@Injectable()
export class GetAllRolesUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetAllRolesUseCase.name);
  }

  async execute(
    params: GetAllRolesParams = {},
  ): Promise<PaginatedRolesResponseDto> {
    const {
      page = 1,
      limit = 20,
      includeInactive = false,
      includePermissions = false,
      systemOnly,
      customOnly,
      search,
    } = params;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100);

    const result = await this.roleRepository.findPaginated({
      page: validPage,
      limit: validLimit,
      includeInactive,
      includePermissions,
      systemOnly,
      customOnly,
      search,
    });

    return {
      data: result.data.map((role) => this.mapToSummaryDto(role)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  private mapToSummaryDto(role: any): RoleSummaryResponseDto {
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystemRole: role.isSystemRole,
      isActive: role.isActive,
      permissionCount: role._permissionCount ?? role.permissions?.length ?? 0,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
