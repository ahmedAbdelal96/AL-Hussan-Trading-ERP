/**
 * Get Resource Actions Use Case
 * Business logic for retrieving all actions for a specific resource
 *
 * Example: For resource 'users', returns ['create', 'read', 'update', 'delete', 'list']
 *
 * This is useful for:
 * - Building UI permission selectors
 * - Showing available actions for a resource
 * - Validating permission requests
 *
 * Security:
 * - Only authenticated users with 'permissions:read' permission can access
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import type { IPermissionRepository } from '../../repositories/permission.repository.interface';
import { PERMISSION_REPOSITORY } from '../../repositories';
import { ResourceActionsResponseDto } from '../../dto';

@Injectable()
export class GetResourceActionsUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetResourceActionsUseCase.name);
  }

  async execute(resource: string): Promise<ResourceActionsResponseDto> {
    // Get all actions for the specified resource (only active permissions)
    const actions =
      await this.permissionRepository.getActionsForResource(resource);

    return {
      resource,
      actions,
      count: actions.length,
    };
  }
}
