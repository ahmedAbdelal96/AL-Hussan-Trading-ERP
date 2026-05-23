/**
 * Permission Repository Interface
 * Defines the contract for permission data access operations
 */

import { PermissionEntity } from '../entities';

export interface IPermissionRepository {
  /**
   * Find permission by ID
   */
  findById(id: string): Promise<PermissionEntity | null>;

  /**
   * Find permission by resource and action
   * @param resource - The resource (e.g., 'users', 'projects')
   * @param action - The action (e.g., 'create', 'read', 'update', 'delete')
   */
  findByResourceAndAction(
    resource: string,
    action: string,
  ): Promise<PermissionEntity | null>;

  /**
   * Find permission by permission string (resource:action)
   * @param permissionString - Format: 'resource:action'
   */
  findByPermissionString(
    permissionString: string,
  ): Promise<PermissionEntity | null>;

  /**
   * Find all permissions
   */
  findAll(): Promise<PermissionEntity[]>;

  /**
   * Find permissions by resource
   * @param resource - The resource to filter by
   */
  findByResource(resource: string): Promise<PermissionEntity[]>;

  /**
   * Find permissions by IDs
   * @param ids - Array of permission IDs
   */
  findByIds(ids: string[]): Promise<PermissionEntity[]>;

  /**
   * Search permissions
   * @param searchTerm - Search term for resource, action, or description
   */
  search(searchTerm: string): Promise<PermissionEntity[]>;

  /**
   * Get all unique resources
   * @returns Array of unique resource names
   */
  getAllResources(): Promise<string[]>;

  /**
   * Get all actions for a specific resource
   * @param resource - The resource to get actions for
   */
  getActionsForResource(resource: string): Promise<string[]>;

  /**
   * Check if permission exists by resource and action
   */
  existsByResourceAndAction(resource: string, action: string): Promise<boolean>;

  /**
   * Create a new permission
   */
  create(data: {
    resource: string;
    action: string;
    description: string;
  }): Promise<PermissionEntity>;

  /**
   * Create multiple permissions in bulk
   * Useful for seeding or creating related permissions
   */
  createMany(
    data: Array<{
      resource: string;
      action: string;
      description: string;
    }>,
  ): Promise<PermissionEntity[]>;

  /**
   * Update permission
   * Note: Cannot update resource or action, only description
   */
  update(
    id: string,
    data: {
      description?: string;
    },
  ): Promise<PermissionEntity>;

  /**
   * Delete permission (soft delete if implemented, or hard delete)
   * Should only be allowed if not assigned to any role
   */
  delete(id: string): Promise<void>;

  /**
   * Check if permission is assigned to any role
   */
  isAssignedToAnyRole(id: string): Promise<boolean>;

  /**
   * Count total permissions
   */
  count(): Promise<number>;

  /**
   * Get paginated permissions
   */
  findPaginated(params: {
    page: number;
    limit: number;
    resource?: string;
    search?: string;
  }): Promise<{
    data: PermissionEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}

/**
 * Permission Repository DI Token
 * Use this Symbol for dependency injection to avoid circular dependencies
 */
export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');
