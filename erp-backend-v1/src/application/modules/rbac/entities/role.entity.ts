/**
 * Role Domain Entity
 * Represents a role that groups multiple permissions
 *
 * A Role is a collection of permissions that can be assigned to users.
 * Roles simplify permission management by grouping related permissions together.
 *
 * Business Rules:
 * - System roles (SUPERADMIN, ADMIN, etc.) cannot be deleted or renamed
 * - Role slug must be unique and URL-safe
 * - Inactive roles cannot be assigned to users
 * - A role can have multiple permissions
 * - Permissions can be added/removed from roles dynamically
 */

import { PermissionEntity } from './permission.entity';

export class RoleEntity {
  id: string;
  name: string;
  slug: string;
  description: string;
  isSystemRole: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Related data (loaded when needed)
  permissions?: PermissionEntity[];

  constructor(data: {
    id: string;
    name: string;
    slug: string;
    description: string;
    isSystemRole: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    permissions?: PermissionEntity[];
  }) {
    this.id = data.id;
    this.name = data.name;
    this.slug = data.slug;
    this.description = data.description;
    this.isSystemRole = data.isSystemRole;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.permissions = data.permissions;
  }

  /**
   * Check if this role is active and can be assigned
   */
  canBeAssigned(): boolean {
    return this.isActive;
  }

  /**
   * Check if this role is a system role
   * System roles have special protections (cannot be deleted/renamed)
   */
  checkIsSystemRole(): boolean {
    return this.isSystemRole;
  }

  /**
   * Check if this role can be modified
   * System roles cannot be deleted or renamed, but permissions can be adjusted
   */
  canBeDeleted(): boolean {
    return !this.isSystemRole;
  }

  /**
   * Check if this role can be renamed
   * System roles have fixed names
   */
  canBeRenamed(): boolean {
    return !this.isSystemRole;
  }

  /**
   * Check if this role has a specific permission
   * @param permissionString - Format: 'resource:action' (e.g., 'users:create')
   */
  hasPermission(permissionString: string): boolean {
    if (!this.permissions || this.permissions.length === 0) {
      return false;
    }

    return this.permissions.some((permission) =>
      permission.matches(permissionString),
    );
  }

  /**
   * Check if this role has all of the specified permissions
   * @param permissionStrings - Array of permission strings
   */
  hasAllPermissions(permissionStrings: string[]): boolean {
    return permissionStrings.every((permission) =>
      this.hasPermission(permission),
    );
  }

  /**
   * Check if this role has any of the specified permissions
   * @param permissionStrings - Array of permission strings
   */
  hasAnyPermission(permissionStrings: string[]): boolean {
    return permissionStrings.some((permission) =>
      this.hasPermission(permission),
    );
  }

  /**
   * Get all permission strings for this role
   * @returns Array of permission strings (e.g., ['users:create', 'users:read'])
   */
  getPermissionStrings(): string[] {
    if (!this.permissions) {
      return [];
    }

    return this.permissions.map((permission) =>
      permission.getPermissionString(),
    );
  }

  /**
   * Get active permissions only
   */
  getActivePermissions(): PermissionEntity[] {
    if (!this.permissions) {
      return [];
    }

    // All permissions in database are active
    return this.permissions;
  }

  /**
   * Check if this role has permissions for a specific resource
   * @param resource - The resource to check (e.g., 'users', 'projects')
   */
  hasPermissionsFor(resource: string): boolean {
    if (!this.permissions) {
      return false;
    }

    return this.permissions.some((permission) =>
      permission.appliesTo(resource),
    );
  }

  /**
   * Get all permissions for a specific resource
   * @param resource - The resource to filter by
   */
  getPermissionsFor(resource: string): PermissionEntity[] {
    if (!this.permissions) {
      return [];
    }

    return this.permissions.filter((permission) =>
      permission.appliesTo(resource),
    );
  }

  /**
   * Activate the role (make it available for assignment)
   */
  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  /**
   * Deactivate the role (prevent new assignments, existing remain)
   */
  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Update role name (only for non-system roles)
   * @throws Error if trying to rename a system role
   */
  updateName(name: string): void {
    if (this.isSystemRole) {
      throw new Error('Cannot rename system role');
    }

    this.name = name;
    this.updatedAt = new Date();
  }

  /**
   * Update role slug (only for non-system roles)
   * @throws Error if trying to change slug of a system role
   */
  updateSlug(slug: string): void {
    if (this.isSystemRole) {
      throw new Error('Cannot change slug of system role');
    }

    RoleEntity.validateSlug(slug);
    this.slug = slug;
    this.updatedAt = new Date();
  }

  /**
   * Update role description
   */
  updateDescription(description: string): void {
    this.description = description;
    this.updatedAt = new Date();
  }

  /**
   * Load permissions into this role
   * Used when fetching role with its permissions from repository
   */
  loadPermissions(permissions: PermissionEntity[]): void {
    this.permissions = permissions;
  }

  /**
   * Validate slug format
   * - Must be lowercase
   * - Only alphanumeric characters, hyphens, and underscores
   * - Must not be empty
   *
   * @throws Error if validation fails
   */
  static validateSlug(slug: string): void {
    const validPattern = /^[a-z0-9_-]+$/;

    if (!slug || !validPattern.test(slug)) {
      throw new Error(
        'Invalid slug format. Must be lowercase alphanumeric with hyphens and underscores only.',
      );
    }
  }

  /**
   * Validate role name
   * - Must not be empty
   * - Must be reasonable length (3-50 characters)
   *
   * @throws Error if validation fails
   */
  static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Role name cannot be empty');
    }

    if (name.length < 3 || name.length > 50) {
      throw new Error('Role name must be between 3 and 50 characters');
    }
  }

  /**
   * Convert to plain object for API responses
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      isSystemRole: this.isSystemRole,
      isActive: this.isActive,
      permissionCount: this.permissions?.length || 0,
      permissions: this.permissions?.map((p) => p.toJSON()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convert to summary object (without permissions) for list views
   */
  toSummary() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      isSystemRole: this.isSystemRole,
      isActive: this.isActive,
      permissionCount: this.permissions?.length || 0,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
