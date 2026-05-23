/**
 * Permission Resolver Service
 * Calculates effective permissions for a user based on:
 * - Role-based permissions
 * - Custom GRANT permissions
 * - Custom REVOKE permissions
 *
 * Algorithm:
 * Effective Permissions = (Role Permissions + Custom GRANTs) - Custom REVOKEs
 *
 * This service is critical for authorization checks throughout the system.
 */

import { Injectable } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { PermissionEntity } from '../entities';

/**
 * Represents the resolved permissions for a user
 */
export interface ResolvedPermissions {
  /**
   * All effective permissions (resource:action format)
   */
  permissions: string[];

  /**
   * Permissions from roles (before custom grants/revokes)
   */
  rolePermissions: string[];

  /**
   * Custom granted permissions
   */
  grantedPermissions: string[];

  /**
   * Custom revoked permissions
   */
  revokedPermissions: string[];

  /**
   * Role slugs the user has
   */
  roles: string[];
}

@Injectable()
export class PermissionResolverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(PermissionResolverService.name);
  }

  /**
   * Resolve all effective permissions for a user
   * This is the main method used by the authorization system
   *
   * @param userId - The user ID to resolve permissions for
   * @returns ResolvedPermissions object with all permission details
   */
  async resolvePermissions(userId: string): Promise<ResolvedPermissions> {
    const now = new Date();

    // 1. Get user's active roles with their permissions
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: {},
        OR: [
          { expiresAt: null }, // Permanent role
          { expiresAt: { gt: now } }, // Not expired
        ],
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // 2. Get user's custom permissions (both GRANT and REVOKE)
    const customPermissions = await this.prisma.userCustomPermission.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null }, // Permanent custom permission
          { expiresAt: { gt: now } }, // Not expired
        ],
      },
      include: {
        permission: true,
      },
    });

    // 3. Extract role permissions
    const rolePermissionStrings = new Set<string>();
    const roleNames: string[] = [];

    for (const userRole of userRoles) {
      roleNames.push(userRole.role.slug);

      for (const rolePermission of userRole.role.rolePermissions) {
        const permissionString = `${rolePermission.permission.resource}:${rolePermission.permission.action}`;
        rolePermissionStrings.add(permissionString);
      }
    }

    // 4. Extract custom GRANT and REVOKE permissions
    const grantedPermissionStrings = new Set<string>();
    const revokedPermissionStrings = new Set<string>();

    for (const customPermission of customPermissions) {
      const permissionString = `${customPermission.permission.resource}:${customPermission.permission.action}`;

      if (customPermission.permissionType === 'GRANT') {
        grantedPermissionStrings.add(permissionString);
      } else if (customPermission.permissionType === 'REVOKE') {
        revokedPermissionStrings.add(permissionString);
      }
    }

    // 5. Calculate effective permissions
    // Formula: (Role Permissions + GRANT) - REVOKE
    const effectivePermissions = new Set<string>();

    // Add all role permissions
    rolePermissionStrings.forEach((permission) => {
      effectivePermissions.add(permission);
    });

    // Add custom GRANTs
    grantedPermissionStrings.forEach((permission) => {
      effectivePermissions.add(permission);
    });

    // Remove custom REVOKEs (takes precedence)
    revokedPermissionStrings.forEach((permission) => {
      effectivePermissions.delete(permission);
    });

    // 6. Return resolved permissions
    return {
      permissions: Array.from(effectivePermissions).sort(),
      rolePermissions: Array.from(rolePermissionStrings).sort(),
      grantedPermissions: Array.from(grantedPermissionStrings).sort(),
      revokedPermissions: Array.from(revokedPermissionStrings).sort(),
      roles: roleNames.sort(),
    };
  }

  /**
   * Resolve user's effective permissions as a Set (for Guards)
   * This is a convenience method for authorization guards
   *
   * @param userId - The user ID
   * @returns Set of permission strings (e.g., 'users:create', 'products:read')
   */
  async resolveUserEffectivePermissions(userId: string): Promise<Set<string>> {
    const resolved = await this.resolvePermissions(userId);
    return new Set(resolved.permissions);
  }

  /**
   * Check if user has a specific permission
   * Supports wildcard matching (e.g., 'users:*', '*:read', '*:*')
   *
   * @param userId - The user ID
   * @param requiredPermission - Permission to check (e.g., 'users:create')
   * @returns true if user has the permission
   */
  async hasPermission(
    userId: string,
    requiredPermission: string,
  ): Promise<boolean> {
    const resolved = await this.resolvePermissions(userId);

    // Check exact match
    if (resolved.permissions.includes(requiredPermission)) {
      return true;
    }

    // Check wildcard patterns
    const [requiredResource, requiredAction] = requiredPermission.split(':');

    for (const permission of resolved.permissions) {
      const [resource, action] = permission.split(':');

      // Check if permission matches with wildcards
      const resourceMatches = resource === '*' || resource === requiredResource;
      const actionMatches = action === '*' || action === requiredAction;

      if (resourceMatches && actionMatches) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has ALL of the specified permissions
   *
   * @param userId - The user ID
   * @param requiredPermissions - Array of permissions to check
   * @returns true if user has all permissions
   */
  async hasAllPermissions(
    userId: string,
    requiredPermissions: string[],
  ): Promise<boolean> {
    if (requiredPermissions.length === 0) {
      return true;
    }

    const results = await Promise.all(
      requiredPermissions.map((permission) =>
        this.hasPermission(userId, permission),
      ),
    );

    return results.every((result) => result === true);
  }

  /**
   * Check if user has ANY of the specified permissions
   *
   * @param userId - The user ID
   * @param requiredPermissions - Array of permissions to check
   * @returns true if user has at least one permission
   */
  async hasAnyPermission(
    userId: string,
    requiredPermissions: string[],
  ): Promise<boolean> {
    if (requiredPermissions.length === 0) {
      return false;
    }

    const results = await Promise.all(
      requiredPermissions.map((permission) =>
        this.hasPermission(userId, permission),
      ),
    );

    return results.some((result) => result === true);
  }

  /**
   * Check if user has a specific role
   *
   * @param userId - The user ID
   * @param roleSlug - The role slug to check (case-insensitive)
   * @returns true if user has the role
   */
  async hasRole(userId: string, roleSlug: string): Promise<boolean> {
    const now = new Date();

    const count = await this.prisma.userRole.count({
      where: {
        userId,
        isActive: true,
        role: {
          slug: {
            equals: roleSlug,
            mode: 'insensitive',
          },
        },
        OR: [
          { expiresAt: null }, // Permanent role
          { expiresAt: { gt: now } }, // Not expired
        ],
      },
    });

    return count > 0;
  }

  /**
   * Check if user has ALL of the specified roles
   *
   * @param userId - The user ID
   * @param roleSlugs - Array of role slugs to check
   * @returns true if user has all roles
   */
  async hasAllRoles(userId: string, roleSlugs: string[]): Promise<boolean> {
    if (roleSlugs.length === 0) {
      return true;
    }

    const results = await Promise.all(
      roleSlugs.map((roleSlug) => this.hasRole(userId, roleSlug)),
    );

    return results.every((result) => result === true);
  }

  /**
   * Check if user has ANY of the specified roles
   *
   * @param userId - The user ID
   * @param roleSlugs - Array of role slugs to check
   * @returns true if user has at least one role
   */
  async hasAnyRole(userId: string, roleSlugs: string[]): Promise<boolean> {
    if (roleSlugs.length === 0) {
      return false;
    }

    const results = await Promise.all(
      roleSlugs.map((roleSlug) => this.hasRole(userId, roleSlug)),
    );

    return results.some((result) => result === true);
  }

  /**
   * Get permissions for a specific resource
   *
   * @param userId - The user ID
   * @param resource - The resource to filter by (e.g., 'users', 'projects')
   * @returns Array of actions the user can perform on the resource
   */
  async getPermissionsForResource(
    userId: string,
    resource: string,
  ): Promise<string[]> {
    const resolved = await this.resolvePermissions(userId);

    const actions: string[] = [];

    for (const permission of resolved.permissions) {
      const [permResource, action] = permission.split(':');

      if (permResource === resource || permResource === '*') {
        actions.push(action);
      }
    }

    return [...new Set(actions)].sort(); // Remove duplicates and sort
  }

  /**
   * Check if user is SUPERADMIN
   * SUPERADMIN has full access to everything
   *
   * @param userId - The user ID
   * @returns true if user is SUPERADMIN
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, 'SUPERADMIN');
  }

  /**
   * Get a summary of user's permissions and roles
   * Useful for debugging and admin interfaces
   *
   * @param userId - The user ID
   * @returns Detailed permission summary
   */
  async getPermissionSummary(userId: string): Promise<{
    userId: string;
    roles: string[];
    totalPermissions: number;
    rolePermissionsCount: number;
    grantedPermissionsCount: number;
    revokedPermissionsCount: number;
    effectivePermissions: string[];
    isSuperAdmin: boolean;
  }> {
    const resolved = await this.resolvePermissions(userId);
    const isSuperAdmin = await this.isSuperAdmin(userId);

    return {
      userId,
      roles: resolved.roles,
      totalPermissions: resolved.permissions.length,
      rolePermissionsCount: resolved.rolePermissions.length,
      grantedPermissionsCount: resolved.grantedPermissions.length,
      revokedPermissionsCount: resolved.revokedPermissions.length,
      effectivePermissions: resolved.permissions,
      isSuperAdmin,
    };
  }

  /**
   * Validate if a permission string is valid
   * @param permissionString - Format: 'resource:action'
   */
  validatePermissionString(permissionString: string): boolean {
    try {
      PermissionEntity.parsePermissionString(permissionString);
      return true;
    } catch {
      return false;
    }
  }
}
