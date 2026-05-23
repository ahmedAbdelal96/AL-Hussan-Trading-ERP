/**
 * Role Repository Interface
 * Defines the contract for role data access operations
 */

import { RoleEntity, PermissionEntity } from '../entities';

export interface IRoleRepository {
  /**
   * Find role by ID
   * @param includePermissions - Whether to include associated permissions
   */
  findById(
    id: string,
    includePermissions?: boolean,
  ): Promise<RoleEntity | null>;

  /**
   * Find role by slug
   * @param includePermissions - Whether to include associated permissions
   */
  findBySlug(
    slug: string,
    includePermissions?: boolean,
  ): Promise<RoleEntity | null>;

  /**
   * Find all roles
   * @param includeInactive - Whether to include inactive roles
   * @param includePermissions - Whether to include associated permissions
   */
  findAll(
    includeInactive?: boolean,
    includePermissions?: boolean,
  ): Promise<RoleEntity[]>;

  /**
   * Find roles by IDs
   * @param includePermissions - Whether to include associated permissions
   */
  findByIds(ids: string[], includePermissions?: boolean): Promise<RoleEntity[]>;

  /**
   * Find system roles
   * @param includePermissions - Whether to include associated permissions
   */
  findSystemRoles(includePermissions?: boolean): Promise<RoleEntity[]>;

  /**
   * Find custom (non-system) roles
   * @param includePermissions - Whether to include associated permissions
   */
  findCustomRoles(includePermissions?: boolean): Promise<RoleEntity[]>;

  /**
   * Search roles
   * @param searchTerm - Search term for name, slug, or description
   * @param includeInactive - Whether to include inactive roles
   * @param includePermissions - Whether to include associated permissions
   */
  search(
    searchTerm: string,
    includeInactive?: boolean,
    includePermissions?: boolean,
  ): Promise<RoleEntity[]>;

  /**
   * Check if role exists by slug
   */
  existsBySlug(slug: string): Promise<boolean>;

  /**
   * Get role permissions
   * Returns all active permissions for a role
   */
  getRolePermissions(roleId: string): Promise<PermissionEntity[]>;

  /**
   * Create a new role
   */
  create(data: {
    name: string;
    slug: string;
    description: string;
    isSystemRole: boolean;
    isActive?: boolean;
  }): Promise<RoleEntity>;

  /**
   * Update role
   * Note: Cannot update slug or isSystemRole for system roles
   */
  update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      isActive?: boolean;
    },
  ): Promise<RoleEntity>;

  /**
   * Activate role
   */
  activate(id: string): Promise<RoleEntity>;

  /**
   * Deactivate role
   */
  deactivate(id: string): Promise<RoleEntity>;

  /**
   * Delete role
   * Should only be allowed for non-system roles
   * Should check if role is assigned to any users
   */
  delete(id: string): Promise<void>;

  /**
   * Check if role is assigned to any user
   */
  isAssignedToAnyUser(id: string): Promise<boolean>;

  /**
   * Assign permissions to role
   * @param roleId - The role ID
   * @param permissionIds - Array of permission IDs to assign
   */
  assignPermissions(roleId: string, permissionIds: string[]): Promise<void>;

  /**
   * Remove permissions from role
   * @param roleId - The role ID
   * @param permissionIds - Array of permission IDs to remove
   */
  removePermissions(roleId: string, permissionIds: string[]): Promise<void>;

  /**
   * Replace all role permissions
   * Removes existing permissions and adds new ones
   * @param roleId - The role ID
   * @param permissionIds - Array of permission IDs
   */
  replacePermissions(roleId: string, permissionIds: string[]): Promise<void>;

  /**
   * Check if role has a specific permission
   */
  hasPermission(roleId: string, permissionId: string): Promise<boolean>;

  /**
   * Get roles for a user
   * @param userId - The user ID
   * @param includeExpired - Whether to include expired role assignments
   * @param includePermissions - Whether to include role permissions
   */
  getUserRoles(
    userId: string,
    includeExpired?: boolean,
    includePermissions?: boolean,
  ): Promise<RoleEntity[]>;

  /**
   * Count total roles
   */
  count(includeInactive?: boolean): Promise<number>;

  /**
   * Get paginated roles
   */
  findPaginated(params: {
    page: number;
    limit: number;
    includeInactive?: boolean;
    includePermissions?: boolean;
    systemOnly?: boolean;
    customOnly?: boolean;
    search?: string;
  }): Promise<{
    data: RoleEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}

/**
 * Role Repository DI Token
 * Use this Symbol for dependency injection to avoid circular dependencies
 */
export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
