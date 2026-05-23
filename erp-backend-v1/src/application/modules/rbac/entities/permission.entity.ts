/**
 * Permission Domain Entity
 * Represents a single permission in the system
 *
 * A Permission is defined by:
 * - Resource: The entity being accessed (e.g., 'users', 'projects', 'roles')
 * - Action: The operation being performed (e.g., 'create', 'read', 'update', 'delete')
 *
 * Format: resource:action (e.g., 'users:create', 'projects:read')
 *
 * Business Rules:
 * - Permission can only be deleted if not assigned to any role
 * - System permissions cannot be modified or deleted
 * - Inactive permissions cannot be assigned to roles
 * - Resource and action must follow naming conventions (lowercase, alphanumeric + underscore)
 */

export class PermissionEntity {
  id: string;
  name: string; // Format: resource:action (e.g., "users:create")
  resource: string;
  action: string;
  description: string;
  descriptionAr: string;
  createdAt: Date;

  constructor(data: {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string;
    descriptionAr?: string;
    createdAt: Date;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.resource = data.resource;
    this.action = data.action;
    this.description = data.description;
    this.descriptionAr = data.descriptionAr || data.description;
    this.createdAt = data.createdAt;
  }

  /**
   * Get the full permission string in format: resource:action
   * @example 'users:create', 'projects:read'
   */
  getPermissionString(): string {
    return `${this.resource}:${this.action}`;
  }

  /**
   * Check if this permission can be assigned
   * All permissions in the database are assignable
   */
  canBeAssigned(): boolean {
    return true;
  }

  /**
   * Check if permission matches a given permission string
   * Supports wildcards (* for any resource or action)
   *
   * @param permissionString - The permission to check (e.g., 'users:create', 'users:*', '*:read')
   * @returns true if this permission matches
   *
   * @example
   * permission = 'users:create'
   * permission.matches('users:create') // true
   * permission.matches('users:*') // true
   * permission.matches('*:create') // true
   * permission.matches('*:*') // true
   * permission.matches('projects:create') // false
   */
  matches(permissionString: string): boolean {
    const [targetResource, targetAction] = permissionString.split(':');

    // Check resource match
    const resourceMatches =
      targetResource === '*' ||
      this.resource === targetResource ||
      targetResource === this.resource;

    // Check action match
    const actionMatches =
      targetAction === '*' ||
      this.action === targetAction ||
      targetAction === this.action;

    return resourceMatches && actionMatches;
  }

  /**
   * Check if this permission applies to a specific resource
   * @param resource - The resource to check (e.g., 'users', 'projects')
   */
  appliesTo(resource: string): boolean {
    return this.resource === resource;
  }

  /**
   * Check if this permission allows a specific action
   * @param action - The action to check (e.g., 'create', 'read', 'update', 'delete')
   */
  allows(action: string): boolean {
    return this.action === action;
  }

  /**
   * Update permission description
   */
  updateDescription(description: string): void {
    this.description = description;
  }

  /**
   * Validate permission naming conventions
   * - Resource and action must be lowercase
   * - Only alphanumeric characters and underscores allowed
   * - Must not be empty
   *
   * @throws Error if validation fails
   */
  static validatePermissionFormat(resource: string, action: string): void {
    const validPattern = /^[a-z0-9_]+$/;

    if (!resource || !validPattern.test(resource)) {
      throw new Error(
        'Invalid resource format. Must be lowercase alphanumeric with underscores only.',
      );
    }

    if (!action || !validPattern.test(action)) {
      throw new Error(
        'Invalid action format. Must be lowercase alphanumeric with underscores only.',
      );
    }
  }

  /**
   * Parse a permission string into resource and action
   * @param permissionString - Format: 'resource:action'
   * @returns { resource, action }
   * @throws Error if format is invalid
   */
  static parsePermissionString(permissionString: string): {
    resource: string;
    action: string;
  } {
    const parts = permissionString.split(':');

    if (parts.length !== 2) {
      throw new Error(
        'Invalid permission format. Expected format: resource:action',
      );
    }

    const [resource, action] = parts;

    this.validatePermissionFormat(resource, action);

    return { resource, action };
  }

  /**
   * Check if two permissions are equal
   */
  equals(other: PermissionEntity): boolean {
    return this.resource === other.resource && this.action === other.action;
  }

  /**
   * Convert to plain object for API responses
   */
  toJSON() {
    return {
      id: this.id,
      resource: this.resource,
      action: this.action,
      permission: this.getPermissionString(),
      description: this.description,
      createdAt: this.createdAt,
    };
  }
}
