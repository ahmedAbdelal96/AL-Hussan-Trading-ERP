/**
 * UserRole Domain Entity
 * Represents the assignment of a role to a user
 *
 * This entity tracks:
 * - Which roles are assigned to which users
 * - When the assignment was made and by whom
 * - Optional expiration date for temporary role assignments
 *
 * Business Rules:
 * - A user can have multiple roles
 * - A role assignment can be temporary (with expiration)
 * - Expired assignments are automatically excluded from permission checks
 * - SUPERADMIN can assign/revoke roles
 * - Assignment history is tracked for audit purposes
 */

import { RoleEntity } from './role.entity';

export class UserRoleEntity {
  id: string;
  userId: string;
  roleId: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt: Date | null;

  // Related data (loaded when needed)
  role?: RoleEntity;

  constructor(data: {
    id: string;
    userId: string;
    roleId: string;
    grantedBy: string;
    grantedAt: Date;
    expiresAt: Date | null;
    role?: RoleEntity;
  }) {
    this.id = data.id;
    this.userId = data.userId;
    this.roleId = data.roleId;
    this.grantedBy = data.grantedBy;
    this.grantedAt = data.grantedAt;
    this.expiresAt = data.expiresAt;
    this.role = data.role;
  }

  /**
   * Check if this role assignment is currently active
   * An assignment is active if:
   * - It hasn't expired (or has no expiration date)
   * - The role itself is active
   */
  isActive(): boolean {
    // Check if expired
    if (this.isExpired()) {
      return false;
    }

    // Check if role is active (if role data is loaded)
    if (this.role && !this.role.isActive) {
      return false;
    }

    return true;
  }

  /**
   * Check if this assignment has expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) {
      return false; // No expiration date = never expires
    }

    return new Date() > this.expiresAt;
  }

  /**
   * Check if this is a permanent assignment (no expiration)
   */
  isPermanent(): boolean {
    return this.expiresAt === null;
  }

  /**
   * Check if this is a temporary assignment (has expiration)
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
   * Check if assignment is expiring soon (within specified days)
   * @param days - Number of days to check
   */
  isExpiringSoon(days: number = 7): boolean {
    const remainingDays = this.getRemainingDays();

    if (remainingDays === null) {
      return false; // Permanent assignments don't expire
    }

    return remainingDays > 0 && remainingDays <= days;
  }

  /**
   * Extend the expiration date by specified days
   * @param days - Number of days to extend
   * @throws Error if assignment is permanent
   */
  extend(days: number): void {
    if (this.isPermanent()) {
      throw new Error('Cannot extend permanent role assignment');
    }

    if (days <= 0) {
      throw new Error('Extension days must be positive');
    }

    const newExpiresAt = new Date(this.expiresAt!);
    newExpiresAt.setDate(newExpiresAt.getDate() + days);

    this.expiresAt = newExpiresAt;
  }

  /**
   * Make assignment permanent (remove expiration)
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
   * Load role data into this assignment
   */
  loadRole(role: RoleEntity): void {
    this.role = role;
  }

  /**
   * Get the role slug (if role is loaded)
   */
  getRoleSlug(): string | undefined {
    return this.role?.slug;
  }

  /**
   * Get the role name (if role is loaded)
   */
  getRoleName(): string | undefined {
    return this.role?.name;
  }

  /**
   * Check if this assignment is for a specific role
   * @param roleSlug - The role slug to check
   */
  isForRole(roleSlug: string): boolean {
    return this.role?.slug === roleSlug;
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

    // Check reasonable maximum (e.g., 5 years)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5);

    if (expiresAt > maxDate) {
      throw new Error(
        'Expiration date cannot be more than 5 years in the future',
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
      roleId: this.roleId,
      role: this.role?.toSummary(),
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
      roleId: this.roleId,
      roleName: this.getRoleName(),
      roleSlug: this.getRoleSlug(),
      grantedAt: this.grantedAt,
      expiresAt: this.expiresAt,
      isPermanent: this.isPermanent(),
      isExpired: this.isExpired(),
      remainingDays: this.getRemainingDays(),
    };
  }
}
