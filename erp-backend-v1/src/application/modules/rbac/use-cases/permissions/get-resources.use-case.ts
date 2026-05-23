/**
 * Get Resources Use Case
 * Business logic for retrieving all unique resources in the system
 *
 * This is useful for:
 * - Building UI permission selectors
 * - Showing available resources for permission creation
 * - System documentation and reporting
 *
 * Security:
 * - Only authenticated users with 'permissions:read' permission can access
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import type { IPermissionRepository } from '../../repositories/permission.repository.interface';
import { PERMISSION_REPOSITORY } from '../../repositories';
import { ResourcesResponseDto } from '../../dto';

@Injectable()
export class GetResourcesUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetResourcesUseCase.name);
  }

  async execute(): Promise<ResourcesResponseDto> {
    // Get all unique resources (only active permissions)
    const resources = await this.permissionRepository.getAllResources();

    return {
      resources,
      count: resources.length,
    };
  }
}
