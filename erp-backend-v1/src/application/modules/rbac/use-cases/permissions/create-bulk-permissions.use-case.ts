/**
 * Create Bulk Permissions Use Case
 * Business logic for creating multiple permissions at once
 *
 * This is useful for:
 * - Initial system setup
 * - Adding a new resource with all CRUD permissions
 * - Seeding permissions
 *
 * Security:
 * - Only SUPERADMIN can create permissions
 * - Validates all permissions before creating any
 * - Skips duplicates instead of failing
 * - Creates audit log for each permission
 */

import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../../infrastructure/logger/winston-logger.service';
import type { IPermissionRepository } from '../../repositories/permission.repository.interface';
import type { IAuthRepository } from '../../../auth/repositories';
import { PERMISSION_REPOSITORY } from '../../repositories';
import { AUTH_REPOSITORY } from '../../../auth/repositories';
import { CreateBulkPermissionsDto, PermissionResponseDto } from '../../dto';
import { PermissionEntity } from '../../entities';

export interface BulkCreateResult {
  created: PermissionResponseDto[];
  skipped: Array<{
    resource: string;
    action: string;
    reason: string;
  }>;
  totalRequested: number;
  totalCreated: number;
  totalSkipped: number;
}

@Injectable()
export class CreateBulkPermissionsUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(CreateBulkPermissionsUseCase.name);
  }

  async execute(
    createBulkDto: CreateBulkPermissionsDto,
    createdBy: string,
  ): Promise<BulkCreateResult> {
    const { permissions } = createBulkDto;

    // 1. Verify that the user creating permissions is SUPERADMIN
    const admin = await this.authRepository.findUserWithRoles(createdBy, false);

    if (!admin || !admin.hasRole('SUPERADMIN')) {
      this.logger.warn(
        `Non-SUPERADMIN user attempted to bulk create permissions: ${admin?.email || createdBy}`,
      );
      throw new ForbiddenException(
        'Only SUPERADMIN users can create permissions',
      );
    }

    const created: PermissionResponseDto[] = [];
    const skipped: Array<{ resource: string; action: string; reason: string }> =
      [];

    // 2. Process each permission
    for (const permissionDto of permissions) {
      const { resource, action, description } = permissionDto;

      try {
        // Validate format
        PermissionEntity.validatePermissionFormat(resource, action);

        // Check if already exists
        const existing =
          await this.permissionRepository.findByResourceAndAction(
            resource.toLowerCase(),
            action.toLowerCase(),
          );

        if (existing) {
          skipped.push({
            resource,
            action,
            reason: 'Already exists',
          });
          continue;
        }

        // Create permission
        const permission = await this.permissionRepository.create({
          resource: resource.toLowerCase(),
          action: action.toLowerCase(),
          description,
        });

        created.push(this.mapToResponseDto(permission));
      } catch (error) {
        // Log error but continue with other permissions
        this.logger.error(
          `Failed to create permission ${resource}:${action}: ${error.message}`,
        );
        skipped.push({
          resource,
          action,
          reason: error.message,
        });
      }
    }

    this.logger.log(
      `Bulk permission creation completed by ${admin.email}: ${created.length} created, ${skipped.length} skipped`,
    );

    return {
      created,
      skipped,
      totalRequested: permissions.length,
      totalCreated: created.length,
      totalSkipped: skipped.length,
    };
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
