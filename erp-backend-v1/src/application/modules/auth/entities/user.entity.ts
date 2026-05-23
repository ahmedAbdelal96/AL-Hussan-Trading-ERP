/**
 * User Domain Entity
 * Represents authenticated user in the system
 */

export class UserEntity {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive: boolean;
  profilePicture?: string | null; // Profile picture file path
  lastLoginAt?: Date | null;
  lastLoginIp?: string | null;

  // Login security and rate limiting
  failedLoginAttempts: number;
  lastFailedLoginAt?: Date | null;
  lockedUntil?: Date | null;
  permanentlyLocked: boolean;
  permanentlyLockedAt?: Date | null;
  unlockAttemptCount: number;

  // Token versioning for instant logout
  tokenVersion: number;

  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Domain properties (not in database)
  roles?: string[];
  permissions?: Array<{ resource: string; action: string }>;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if user can login
   */
  canLogin(): boolean {
    return (
      this.isActive &&
      !this.deletedAt &&
      !this.isPermanentlyLocked() &&
      !this.isTemporarilyLocked()
    );
  }

  /**
   * Check if account is temporarily locked
   */
  isTemporarilyLocked(): boolean {
    if (!this.lockedUntil) return false;
    return new Date() < this.lockedUntil;
  }

  /**
   * Check if account is permanently locked
   */
  isPermanentlyLocked(): boolean {
    return this.permanentlyLocked;
  }

  /**
   * Get remaining lock time in minutes
   */
  getRemainingLockTime(): number {
    if (!this.lockedUntil) return 0;
    const diff = this.lockedUntil.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60)));
  }

  /**
   * Get full name
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Check if user has role
   */
  hasRole(role: string): boolean {
    return this.roles?.includes(role) || false;
  }

  /**
   * Check if user has permission
   */
  hasPermission(resource: string, action: string): boolean {
    return (
      this.permissions?.some(
        (p) => p.resource === resource && p.action === action,
      ) || false
    );
  }
}
