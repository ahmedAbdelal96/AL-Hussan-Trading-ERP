/**
 * RBAC Controller - Read & Assignment Operations Only
 *
 * IMPORTANT: This controller provides READ operations for roles/permissions
 * and ASSIGNMENT operations for users. It does NOT provide CREATE/UPDATE/DELETE
 * operations for roles and permissions because:
 *
 * 1. All roles & permissions are defined in code (permissions.constants.ts)
 * 2. They are seeded via database migrations
 * 3. Creating roles/permissions at runtime won't make them usable in @Auth decorators
 * 4. This prevents inconsistencies between code and database
 *
 * Available Operations:
 * ✅ READ: View all roles, permissions, and their relationships
 * ✅ ASSIGN: Assign/revoke roles to/from users
 * ✅ GRANT: Grant/revoke custom permissions to/from users
 * ✅ QUERY: Get user's effective permissions
 *
 * ❌ NOT Available: Create/Update/Delete roles or permissions (managed in code)
 *
 * Endpoint Groups:
 * 1. Permissions - READ ONLY (/permissions)
 * 2. Roles - READ ONLY (/roles)
 * 3. User Roles - ASSIGN/REVOKE (/users/roles)
 * 4. User Custom Permissions - GRANT/REVOKE (/users/custom-permissions)
 * 5. User Effective Permissions - QUERY (/users/:id/effective-permissions)
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators';

// Import DTOs
import {
  // CreatePermissionDto, // DISABLED: Not used (permissions managed in code)
  // CreateBulkPermissionsDto, // DISABLED: Not used
  // UpdatePermissionDto, // DISABLED: Not used
  PermissionResponseDto,
  PaginatedPermissionsResponseDto,
  ResourcesResponseDto,
  ResourceActionsResponseDto,
  // CreateRoleDto, // DISABLED: Not used (roles managed in code)
  // UpdateRoleDto, // DISABLED: Not used
  RoleResponseDto,
  PaginatedRolesResponseDto,
  // AssignPermissionsDto, // DISABLED: Not used (role-permission mapping in code)
  // RemovePermissionsDto, // DISABLED: Not used
  // ReplacePermissionsDto, // DISABLED: Not used
  AssignRoleDto,
  RevokeRoleDto,
  UserRolesResponseDto,
  GrantPermissionDto,
  RevokePermissionDto,
  UserCustomPermissionsResponseDto,
  ResolvedPermissionsResponseDto,
  MessageResponseDto,
} from './dto';

// Import Use Cases - Permissions
import {
  // CreatePermissionUseCase, // DISABLED: Not used
  // CreateBulkPermissionsUseCase, // DISABLED: Not used
  // UpdatePermissionUseCase, // DISABLED: Not used
  // DeletePermissionUseCase, // DISABLED: Not used
  GetPermissionUseCase,
  GetAllPermissionsUseCase,
  GetResourcesUseCase,
  GetResourceActionsUseCase,
} from './use-cases/permissions';

// Import Use Cases - Roles
import {
  // CreateRoleUseCase, // DISABLED: Not used
  // UpdateRoleUseCase, // DISABLED: Not used
  // DeleteRoleUseCase, // DISABLED: Not used
  GetRoleUseCase,
  GetAllRolesUseCase,
  // AssignPermissionsToRoleUseCase, // DISABLED: Not used (managed in code)
  // RemovePermissionsFromRoleUseCase, // DISABLED: Not used
  // ReplaceRolePermissionsUseCase, // DISABLED: Not used
} from './use-cases/roles';

// Import Use Cases - User Roles
import {
  AssignRoleToUserUseCase,
  RevokeRoleFromUserUseCase,
  GetUserRolesUseCase,
} from './use-cases/user-roles';

// Import Use Cases - User Permissions
import {
  GrantPermissionToUserUseCase,
  RevokePermissionFromUserUseCase,
  GetUserCustomPermissionsUseCase,
  GetUserEffectivePermissionsUseCase,
  RemoveCustomPermissionUseCase,
} from './use-cases/user-permissions';
import {
  AuditLog,
  NoAuditLog,
} from '../../common/decorators/audit-log.decorator';
import { AuditAction } from '@prisma/client';

const CRITICAL_SYSTEM_ROLES = ['SUPERADMIN', 'IT_ADMIN'];

@ApiTags('RBAC')
@ApiBearerAuth()
@Controller('rbac')
export class RbacController {
  constructor(
    // Permission Use Cases - Only READ operations
    // private readonly createPermissionUseCase: CreatePermissionUseCase, // DISABLED
    // private readonly createBulkPermissionsUseCase: CreateBulkPermissionsUseCase, // DISABLED
    // private readonly updatePermissionUseCase: UpdatePermissionUseCase, // DISABLED
    // private readonly deletePermissionUseCase: DeletePermissionUseCase, // DISABLED
    private readonly getPermissionUseCase: GetPermissionUseCase,
    private readonly getAllPermissionsUseCase: GetAllPermissionsUseCase,
    private readonly getResourcesUseCase: GetResourcesUseCase,
    private readonly getResourceActionsUseCase: GetResourceActionsUseCase,

    // Role Use Cases - Only READ operations
    // private readonly createRoleUseCase: CreateRoleUseCase, // DISABLED
    // private readonly updateRoleUseCase: UpdateRoleUseCase, // DISABLED
    // private readonly deleteRoleUseCase: DeleteRoleUseCase, // DISABLED
    private readonly getRoleUseCase: GetRoleUseCase,
    private readonly getAllRolesUseCase: GetAllRolesUseCase,
    // private readonly assignPermissionsToRoleUseCase: AssignPermissionsToRoleUseCase, // DISABLED
    // private readonly removePermissionsFromRoleUseCase: RemovePermissionsFromRoleUseCase, // DISABLED
    // private readonly replaceRolePermissionsUseCase: ReplaceRolePermissionsUseCase, // DISABLED

    // User Role Use Cases - ACTIVE (for daily operations)
    private readonly assignRoleToUserUseCase: AssignRoleToUserUseCase,
    private readonly revokeRoleFromUserUseCase: RevokeRoleFromUserUseCase,
    private readonly getUserRolesUseCase: GetUserRolesUseCase,

    // User Permission Use Cases - ACTIVE (for custom permissions)
    private readonly grantPermissionToUserUseCase: GrantPermissionToUserUseCase,
    private readonly revokePermissionFromUserUseCase: RevokePermissionFromUserUseCase,
    private readonly getUserCustomPermissionsUseCase: GetUserCustomPermissionsUseCase,
    private readonly getUserEffectivePermissionsUseCase: GetUserEffectivePermissionsUseCase,
    private readonly removeCustomPermissionUseCase: RemoveCustomPermissionUseCase,
  ) {}

  // ============================================================================
  // PERMISSION ENDPOINTS - READ ONLY
  // ============================================================================
  // NOTE: CREATE/UPDATE/DELETE endpoints are disabled because permissions
  // are managed in code (permissions.constants.ts) and seeded via migrations.
  // Creating permissions at runtime won't make them usable in @Auth decorators.
  // ============================================================================

  /*
  // DISABLED: Permissions are managed in code, not at runtime
  @Post('permissions')
  @Auth({ roles: ['SUPERADMIN'], permissions: ['rbac:write'] })
  @ApiOperation({ summary: 'Create a new permission (DISABLED - Use code instead)' })
  @ApiResponse({ status: 201, type: PermissionResponseDto })
  async createPermission(
    @Body() createPermissionDto: CreatePermissionDto,
    @CurrentUser('id') userId: string,
  ): Promise<PermissionResponseDto> {
    return this.createPermissionUseCase.execute(createPermissionDto, userId);
  }

  @Post('permissions/bulk')
  @Auth({ roles: ['SUPERADMIN'], permissions: ['rbac:write'] })
  @ApiOperation({
    summary: 'Create multiple permissions at once (DISABLED - Use code instead)',
  })
  @ApiResponse({ status: 201 })
  async createBulkPermissions(
    @Body() createBulkDto: CreateBulkPermissionsDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.createBulkPermissionsUseCase.execute(createBulkDto, userId);
  }
  */

  @Get('permissions')
  @NoAuditLog()
  @Auth({ permissions: ['rbac:read'] })
  @ApiOperation({ summary: 'Get all permissions with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'resource', required: false, type: String })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, type: PaginatedPermissionsResponseDto })
  async getAllPermissions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('resource') resource?: string,
    @Query('search') search?: string,
  ): Promise<PaginatedPermissionsResponseDto> {
    return this.getAllPermissionsUseCase.execute({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      resource,
      search,
    });
  }

  @Get('permissions/resources')
  @NoAuditLog()
  @Auth({ permissions: ['rbac:read'] })
  @ApiOperation({ summary: 'Get all unique resources' })
  @ApiResponse({ status: 200, type: ResourcesResponseDto })
  async getResources(): Promise<ResourcesResponseDto> {
    return this.getResourcesUseCase.execute();
  }

  @Get('permissions/resources/:resource/actions')
  @NoAuditLog()
  @Auth({ permissions: ['rbac:read'] })
  @ApiOperation({ summary: 'Get all actions for a specific resource' })
  @ApiResponse({ status: 200, type: ResourceActionsResponseDto })
  async getResourceActions(
    @Param('resource') resource: string,
  ): Promise<ResourceActionsResponseDto> {
    return this.getResourceActionsUseCase.execute(resource);
  }

  @Get('permissions/:id')
  @NoAuditLog()
  @Auth({ permissions: ['rbac:read'] })
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ status: 200, type: PermissionResponseDto })
  async getPermission(@Param('id') id: string): Promise<PermissionResponseDto> {
    return this.getPermissionUseCase.execute(id);
  }

  /*
  // DISABLED: Permissions are managed in code, not at runtime
  @Put('permissions/:id')
  @Auth({ roles: ['SUPERADMIN'], permissions: ['rbac:write'] })
  @ApiOperation({ summary: 'Update permission (DISABLED - Use code instead)' })
  @ApiResponse({ status: 200, type: PermissionResponseDto })
  async updatePermission(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @CurrentUser('id') userId: string,
  ): Promise<PermissionResponseDto> {
    return this.updatePermissionUseCase.execute(
      id,
      updatePermissionDto,
      userId,
    );
  }

  @Delete('permissions/:id')
  @Auth({ roles: ['SUPERADMIN'], permissions: ['rbac:write'] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete permission (DISABLED - Use code instead)' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async deletePermission(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<MessageResponseDto> {
    return this.deletePermissionUseCase.execute(id, userId);
  }
  */

  // ============================================================================
  // ROLE ENDPOINTS - READ ONLY
  // ============================================================================
  // NOTE: CREATE/UPDATE/DELETE endpoints are disabled because roles
  // are managed in code (permissions.constants.ts) and seeded via migrations.
  // ============================================================================

  /*
  // DISABLED: Roles are managed in code, not at runtime
  @Post('roles')
  @Auth({ roles: ['SUPERADMIN'], permissions: ['rbac:write'] })
  @ApiOperation({ summary: 'Create a new role (DISABLED - Use code instead)' })
  @ApiResponse({ status: 201, type: RoleResponseDto })
  async createRole(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser('id') userId: string,
  ): Promise<RoleResponseDto> {
    return this.createRoleUseCase.execute(createRoleDto, userId);
  }
  */

  @Get('roles')
  @NoAuditLog()
  @Auth({ permissions: ['rbac:read'] })
  @ApiOperation({ summary: 'Get all roles with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'includePermissions', required: false, type: Boolean })
  @ApiQuery({ name: 'systemOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'customOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, type: PaginatedRolesResponseDto })
  async getAllRoles(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('includeInactive') includeInactive?: boolean,
    @Query('includePermissions') includePermissions?: boolean,
    @Query('systemOnly') systemOnly?: boolean,
    @Query('customOnly') customOnly?: boolean,
    @Query('search') search?: string,
  ): Promise<PaginatedRolesResponseDto> {
    return this.getAllRolesUseCase.execute({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      includeInactive: includeInactive === true,
      includePermissions: includePermissions === true,
      systemOnly: systemOnly === true,
      customOnly: customOnly === true,
      search,
    });
  }

  @Get('roles/:id')
  @NoAuditLog()
  @Auth({ permissions: ['rbac:read'] })
  @ApiOperation({ summary: 'Get role by ID with permissions' })
  @ApiResponse({ status: 200, type: RoleResponseDto })
  async getRole(@Param('id') id: string): Promise<RoleResponseDto> {
    return this.getRoleUseCase.execute(id);
  }

  /*
  // DISABLED: Roles are managed in code, not at runtime
  @Put('roles/:id')
  @Auth({ roles: ['SUPERADMIN'], permissions: ['rbac:write'] })
  @ApiOperation({ summary: 'Update role (DISABLED - Use code instead)' })
  @ApiResponse({ status: 200, type: RoleResponseDto })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser('id') userId: string,
  ): Promise<RoleResponseDto> {
    return this.updateRoleUseCase.execute(id, updateRoleDto, userId);
  }

  @Delete('roles/:id')
  @Auth({ roles: ['SUPERADMIN'], permissions: ['rbac:write'] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete role (DISABLED - Use code instead)' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async deleteRole(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<MessageResponseDto> {
    return this.deleteRoleUseCase.execute(id, userId);
  }
  */

  // ============================================================================
  // ROLE-PERMISSION MANAGEMENT - DISABLED
  // ============================================================================
  // NOTE: These endpoints are disabled because role-permission mappings
  // are managed in code (ROLE_PERMISSIONS_MAP) and seeded via migrations.
  // ============================================================================

  /*
  // DISABLED: Role-permission mappings are managed in code
  @Post('roles/:id/permissions')
  @Auth({ roles: ['SUPERADMIN'], permissions: ['rbac:write'] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign permissions to role (DISABLED - Use code instead)' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async assignPermissionsToRole(
    @Param('id') roleId: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
    @CurrentUser('id') userId: string,
  ): Promise<MessageResponseDto> {
    return this.assignPermissionsToRoleUseCase.execute(
      roleId,
      assignPermissionsDto,
      userId,
    );
  }

  @Delete('roles/:id/permissions')
  @Auth({ roles: ['SUPERADMIN'], permissions: ['rbac:write'] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove permissions from role (DISABLED - Use code instead)' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async removePermissionsFromRole(
    @Param('id') roleId: string,
    @Body() removePermissionsDto: RemovePermissionsDto,
    @CurrentUser('id') userId: string,
  ): Promise<MessageResponseDto> {
    return this.removePermissionsFromRoleUseCase.execute(
      roleId,
      removePermissionsDto,
      userId,
    );
  }

  @Put('roles/:id/permissions')
  @Auth({ roles: ['SUPERADMIN'], permissions: ['rbac:write'] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Replace all role permissions (DISABLED - Use code instead)' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async replaceRolePermissions(
    @Param('id') roleId: string,
    @Body() replacePermissionsDto: ReplacePermissionsDto,
    @CurrentUser('id') userId: string,
  ): Promise<MessageResponseDto> {
    return this.replaceRolePermissionsUseCase.execute(
      roleId,
      replacePermissionsDto,
      userId,
    );
  }
  */

  // ============================================================================
  // USER ROLE ASSIGNMENT ENDPOINTS - ACTIVE
  // ============================================================================
  // These endpoints are ACTIVE and important for daily operations
  // ============================================================================

  @Post('users/roles')
  @AuditLog({ resourceType: 'rbac', action: AuditAction.ASSIGN_ROLE })
  @Auth({ roles: CRITICAL_SYSTEM_ROLES })
  @ApiOperation({ summary: 'Assign role to user (SUPERADMIN / IT_ADMIN)' })
  @ApiResponse({ status: 201 })
  async assignRoleToUser(
    @Body() assignRoleDto: AssignRoleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.assignRoleToUserUseCase.execute(assignRoleDto, userId);
  }

  @Delete('users/roles')
  @AuditLog({ resourceType: 'rbac', action: AuditAction.REVOKE_ROLE })
  @Auth({ roles: CRITICAL_SYSTEM_ROLES })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke role from user (SUPERADMIN / IT_ADMIN)' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async revokeRoleFromUser(
    @Body() revokeRoleDto: RevokeRoleDto,
    @CurrentUser('id') userId: string,
  ): Promise<MessageResponseDto> {
    return this.revokeRoleFromUserUseCase.execute(revokeRoleDto, userId);
  }

  @Get('users/:userId/roles')
  @NoAuditLog()
  @Auth({ permissions: ['rbac:read'] })
  @ApiOperation({ summary: 'Get all roles for a user' })
  @ApiQuery({ name: 'includeExpired', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: UserRolesResponseDto })
  async getUserRoles(
    @Param('userId') userId: string,
    @Query('includeExpired') includeExpired?: boolean,
  ): Promise<UserRolesResponseDto> {
    return this.getUserRolesUseCase.execute(userId, includeExpired === true);
  }

  // ============================================================================
  // USER CUSTOM PERMISSION ENDPOINTS - ACTIVE
  // ============================================================================
  // These endpoints are ACTIVE for granting temporary/custom permissions
  // ============================================================================

  @Post('users/custom-permissions/grant')
  @AuditLog({
    resourceType: 'rbac',
    action: AuditAction.GRANT_CUSTOM_PERMISSION,
  })
  @Auth({ roles: CRITICAL_SYSTEM_ROLES })
  @ApiOperation({
    summary: 'Grant custom permission to user (SUPERADMIN / IT_ADMIN)',
  })
  @ApiResponse({ status: 201 })
  async grantPermissionToUser(
    @Body() grantPermissionDto: GrantPermissionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.grantPermissionToUserUseCase.execute(
      grantPermissionDto,
      userId,
    );
  }

  @Post('users/custom-permissions/revoke')
  @AuditLog({
    resourceType: 'rbac',
    action: AuditAction.REVOKE_CUSTOM_PERMISSION,
  })
  @Auth({ roles: CRITICAL_SYSTEM_ROLES })
  @ApiOperation({
    summary: 'Revoke custom permission from user (SUPERADMIN / IT_ADMIN)',
  })
  @ApiResponse({ status: 201 })
  async revokePermissionFromUser(
    @Body() revokePermissionDto: RevokePermissionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.revokePermissionFromUserUseCase.execute(
      revokePermissionDto,
      userId,
    );
  }

  @Delete('users/custom-permissions/:customPermissionId')
  @AuditLog({
    resourceType: 'rbac',
    action: AuditAction.REVOKE_CUSTOM_PERMISSION,
  })
  @Auth({ roles: CRITICAL_SYSTEM_ROLES })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove custom permission completely (SUPERADMIN / IT_ADMIN)',
  })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async removeCustomPermission(
    @Param('customPermissionId') customPermissionId: string,
    @CurrentUser('id') userId: string,
  ): Promise<MessageResponseDto> {
    return this.removeCustomPermissionUseCase.execute(
      { customPermissionId },
      userId,
    );
  }

  @Get('users/:userId/custom-permissions')
  @NoAuditLog()
  @Auth({ permissions: ['rbac:read'] })
  @ApiOperation({ summary: 'Get all custom permissions for a user' })
  @ApiQuery({ name: 'includeExpired', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: UserCustomPermissionsResponseDto })
  async getUserCustomPermissions(
    @Param('userId') userId: string,
    @Query('includeExpired') includeExpired?: boolean,
  ): Promise<UserCustomPermissionsResponseDto> {
    return this.getUserCustomPermissionsUseCase.execute(
      userId,
      includeExpired === true,
    );
  }

  @Get('users/:userId/effective-permissions')
  @NoAuditLog()
  @Auth({ permissions: ['rbac:read'] })
  @ApiOperation({
    summary: 'Get effective permissions for a user (with full breakdown)',
  })
  @ApiResponse({ status: 200, type: ResolvedPermissionsResponseDto })
  async getUserEffectivePermissions(
    @Param('userId') userId: string,
  ): Promise<ResolvedPermissionsResponseDto> {
    return this.getUserEffectivePermissionsUseCase.execute(userId);
  }
}
