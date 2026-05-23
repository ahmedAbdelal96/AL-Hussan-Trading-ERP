/**
 * RBAC Module
 * Handles all Role-Based Access Control functionality
 *
 * This module provides:
 * - Permission management (CRUD)
 * - Role management (CRUD)
 * - Role-Permission assignments
 * - User-Role assignments
 * - User custom permissions (GRANT/REVOKE)
 * - Permission resolution and checking
 */

import { Module } from '@nestjs/common';
import { WinstonLoggerService } from '../../../infrastructure/logger/winston-logger.service';

// Import Auth Repository dependencies
import { AuthRepository } from '../auth/repositories/auth.repository';
import { AUTH_REPOSITORY } from '../auth/repositories';

// Import RBAC Repositories
import { PermissionRepository } from './repositories/permission.repository';
import { RoleRepository } from './repositories/role.repository';
import { PERMISSION_REPOSITORY, ROLE_REPOSITORY } from './repositories';

// Import RBAC Services
import { PermissionResolverService } from './services';

// Import Permission Use Cases
import {
  CreatePermissionUseCase,
  CreateBulkPermissionsUseCase,
  UpdatePermissionUseCase,
  DeletePermissionUseCase,
  GetPermissionUseCase,
  GetAllPermissionsUseCase,
  GetResourcesUseCase,
  GetResourceActionsUseCase,
} from './use-cases/permissions';

// Import Role Use Cases
import {
  CreateRoleUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
  GetRoleUseCase,
  GetAllRolesUseCase,
} from './use-cases/roles';

// Import Role Permission Management Use Cases
import {
  AssignPermissionsToRoleUseCase,
  RemovePermissionsFromRoleUseCase,
  ReplaceRolePermissionsUseCase,
} from './use-cases/roles';

// Import User Role Assignment Use Cases
import {
  AssignRoleToUserUseCase,
  RevokeRoleFromUserUseCase,
  GetUserRolesUseCase,
} from './use-cases/user-roles';

// Import User Custom Permission Use Cases
import {
  GrantPermissionToUserUseCase,
  RevokePermissionFromUserUseCase,
  GetUserCustomPermissionsUseCase,
  GetUserEffectivePermissionsUseCase,
  RemoveCustomPermissionUseCase,
} from './use-cases/user-permissions';

// Import Controller
import { RbacController } from './rbac.controller';

@Module({
  controllers: [RbacController],
  providers: [
    // Infrastructure
    WinstonLoggerService,

    // Repositories
    {
      provide: AUTH_REPOSITORY,
      useClass: AuthRepository,
    },
    {
      provide: PERMISSION_REPOSITORY,
      useClass: PermissionRepository,
    },
    {
      provide: ROLE_REPOSITORY,
      useClass: RoleRepository,
    },

    // Services
    PermissionResolverService,

    // Permission Use Cases
    CreatePermissionUseCase,
    CreateBulkPermissionsUseCase,
    UpdatePermissionUseCase,
    DeletePermissionUseCase,
    GetPermissionUseCase,
    GetAllPermissionsUseCase,
    GetResourcesUseCase,
    GetResourceActionsUseCase,

    // Role Use Cases
    CreateRoleUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    GetRoleUseCase,
    GetAllRolesUseCase,

    // Role Permission Management Use Cases
    AssignPermissionsToRoleUseCase,
    RemovePermissionsFromRoleUseCase,
    ReplaceRolePermissionsUseCase,

    // User Role Assignment Use Cases
    AssignRoleToUserUseCase,
    RevokeRoleFromUserUseCase,
    GetUserRolesUseCase,

    // User Custom Permission Use Cases
    GrantPermissionToUserUseCase,
    RevokePermissionFromUserUseCase,
    GetUserCustomPermissionsUseCase,
    GetUserEffectivePermissionsUseCase,
    RemoveCustomPermissionUseCase,
  ],
  exports: [
    // Export services that other modules might need
    PermissionResolverService,
    PERMISSION_REPOSITORY,
    ROLE_REPOSITORY,
  ],
})
export class RbacModule {}
