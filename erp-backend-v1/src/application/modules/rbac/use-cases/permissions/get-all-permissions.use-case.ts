/**
 * Get All Permissions Use Case
 * Business logic for retrieving all permissions with pagination and filtering
 *
 * Features:
 * - Pagination support
 * - Search by resource, action, or description
 * - Filter by resource
 *
 * Security:
 * - Only authenticated users with 'permissions:read' permission can access
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import type { IPermissionRepository } from '../../repositories/permission.repository.interface';
import { PERMISSION_REPOSITORY } from '../../repositories';
import {
  PaginatedPermissionsResponseDto,
  PermissionResponseDto,
} from '../../dto';

interface GetAllPermissionsParams {
  page?: number;
  limit?: number;
  resource?: string;
  search?: string;
}

@Injectable()
export class GetAllPermissionsUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetAllPermissionsUseCase.name);
  }

  async execute(
    params: GetAllPermissionsParams = {},
  ): Promise<PaginatedPermissionsResponseDto> {
    const { page = 1, limit = 20, resource, search } = params;

    // Validate pagination params
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page

    // Get paginated permissions
    const result = await this.permissionRepository.findPaginated({
      page: validPage,
      limit: validLimit,
      resource,
      search,
    });

    return {
      data: result.data.map((permission) => this.mapToResponseDto(permission)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
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
