/**
 * UserCustomPermission Domain Entity
 * Represents custom permission grants or revocations for individual users
 *
 * This entity allows for fine-grained permission control:
 * - GRANT: Add a specific permission to a user (in addition to their role permissions)
 * - REVOKE: Remove a specific permission from a user (even if their role has it)
 *
 * Use Cases:
 * - Grant temporary elevated access to a user
 * - Revoke a specific permission while keeping the role
 * - Handle exceptions to role-based permissions
 *
 * Business Rules:
 * - REVOKE takes precedence over GRANT and role permissions
 * - Custom permissions can be temporary (with expiration)
 * - Only SUPERADMIN can grant/revoke custom permissions
 * - All custom permission changes are audited
 */

import { PermissionEntity } from './permission.entity';

export enum PermissionType {
  GRANT = 'GRANT',
  REVOKE = 'REVOKE',
}

export class UserCustomPermissionEntity {
  id: string;
  userId: string;
  permissionId: string;
  permissionType: PermissionType;
  grantedBy: string;
  grantedAt: Date;
  expiresAt: Date | null;

  // Related data (loaded when needed)
  permission?: PermissionEntity;

  constructor(data: {
    id: string;
    userId: string;
    permissionId: string;
    permissionType: PermissionType;
    grantedBy: string;
    grantedAt: Date;
    expiresAt: Date | null;
    permission?: PermissionEntity;
  }) {
    this.id = data.id;
    this.userId = data.userId;
    this.permissionId = data.permissionId;
    this.permissionType = data.permissionType;
    this.grantedBy = data.grantedBy;
    this.grantedAt = data.grantedAt;
    this.expiresAt = data.expiresAt;
    this.permission = data.permission;
  }

  /**
   * Check if this custom permission is currently active
   * A custom permission is active if:
   * - It hasn't expired (or has no expiration date)
   * - The permission itself is active (if loaded)
   */
  isActive(): boolean {
    // Check if expired
    if (this.isExpired()) {
      return false;
    }

    // All permissions in database are active
    return true;
  }

  /**
   * Check if this custom permission has expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) {
      return false; // No expiration date = never expires
    }

    return new Date() > this.expiresAt;
  }

  /**
   * Check if this is a GRANT type
   */
  isGrant(): boolean {
    return this.permissionType === PermissionType.GRANT;
  }

  /**
   * Check if this is a REVOKE type
   */
  isRevoke(): boolean {
    return this.permissionType === PermissionType.REVOKE;
  }

  /**
   * Check if this is a permanent custom permission (no expiration)
   */
  isPermanent(): boolean {
    return this.expiresAt === null;
  }

  /**
   * Check if this is a temporary custom permission (has expiration)
   */
  isTemporary(): boolean {
    return this.expiresAt !== null;
  }

  /**
   * Get remaining time in days until expiration
   * @returns Number of days remaining, or null if permanent
   */
  getRemainingDays(): number | null {
    if (this.isPermanent()) {
      return null;
    }

    const now = new Date();
    const expiresAt = this.expiresAt!;

    if (now > expiresAt) {
      return 0; // Already expired
    }

    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Check if custom permission is expiring soon (within specified days)
   * @param days - Number of days to check
   */
  isExpiringSoon(days: number = 7): boolean {
    const remainingDays = this.getRemainingDays();

    if (remainingDays === null) {
      return false; // Permanent permissions don't expire
    }

    return remainingDays > 0 && remainingDays <= days;
  }

  /**
   * Extend the expiration date by specified days
   * @param days - Number of days to extend
   * @throws Error if custom permission is permanent
   */
  extend(days: number): void {
    if (this.isPermanent()) {
      throw new Error('Cannot extend permanent custom permission');
    }

    if (days <= 0) {
      throw new Error('Extension days must be positive');
    }

    const newExpiresAt = new Date(this.expiresAt!);
    newExpiresAt.setDate(newExpiresAt.getDate() + days);

    this.expiresAt = newExpiresAt;
  }

  /**
   * Make custom permission permanent (remove expiration)
   */
  makePermanent(): void {
    this.expiresAt = null;
  }

  /**
   * Set expiration date
   * @param expiresAt - The expiration date
   * @throws Error if expiration date is in the past
   */
  setExpiration(expiresAt: Date): void {
    if (expiresAt < new Date()) {
      throw new Error('Expiration date cannot be in the past');
    }

    this.expiresAt = expiresAt;
  }

  /**
   * Load permission data into this custom permission
   */
  loadPermission(permission: PermissionEntity): void {
    this.permission = permission;
  }

  /**
   * Get the permission string (if permission is loaded)
   */
  getPermissionString(): string | undefined {
    return this.permission?.getPermissionString();
  }

  /**
   * Get the permission resource (if permission is loaded)
   */
  getPermissionResource(): string | undefined {
    return this.permission?.resource;
  }

  /**
   * Get the permission action (if permission is loaded)
   */
  getPermissionAction(): string | undefined {
    return this.permission?.action;
  }

  /**
   * Check if this custom permission affects a specific permission string
   * @param permissionString - Format: 'resource:action'
   */
  affectsPermission(permissionString: string): boolean {
    if (!this.permission) {
      return false;
    }

    return this.permission.matches(permissionString);
  }

  /**
   * Validate reason
   * @param reason - The reason to validate
   * @throws Error if validation fails
   */
  static validateReason(reason: string): void {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason cannot be empty');
    }

    if (reason.length < 10) {
      throw new Error('Reason must be at least 10 characters');
    }

    if (reason.length > 500) {
      throw new Error('Reason cannot exceed 500 characters');
    }
  }

  /**
   * Validate custom permission type
   * @param type - The type to validate
   * @throws Error if validation fails
   */
  static validateType(type: unknown): asserts type is PermissionType {
    if (type !== 'GRANT' && type !== 'REVOKE') {
      throw new Error('Invalid permission type. Must be GRANT or REVOKE');
    }
  }

  /**
   * Validate expiration date
   * @param expiresAt - The date to validate
   * @throws Error if validation fails
   */
  static validateExpirationDate(expiresAt: Date): void {
    if (!(expiresAt instanceof Date) || isNaN(expiresAt.getTime())) {
      throw new Error('Invalid expiration date');
    }

    if (expiresAt < new Date()) {
      throw new Error('Expiration date must be in the future');
    }

    // Check reasonable maximum (e.g., 2 years for custom permissions)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);

    if (expiresAt > maxDate) {
      throw new Error(
        'Expiration date cannot be more than 2 years in the future',
      );
    }
  }

  /**
   * Convert to plain object for API responses
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      permissionId: this.permissionId,
      permission: this.permission?.toJSON(),
      permissionType: this.permissionType,
      grantedBy: this.grantedBy,
      grantedAt: this.grantedAt,
      expiresAt: this.expiresAt,
      isPermanent: this.isPermanent(),
      isExpired: this.isExpired(),
      isActive: this.isActive(),
      remainingDays: this.getRemainingDays(),
    };
  }

  /**
   * Convert to summary object for list views
   */
  toSummary() {
    return {
      id: this.id,
      permissionId: this.permissionId,
      permissionString: this.getPermissionString(),
      permissionType: this.permissionType,
      grantedAt: this.grantedAt,
      expiresAt: this.expiresAt,
      isPermanent: this.isPermanent(),
      isExpired: this.isExpired(),
      remainingDays: this.getRemainingDays(),
    };
  }
}
