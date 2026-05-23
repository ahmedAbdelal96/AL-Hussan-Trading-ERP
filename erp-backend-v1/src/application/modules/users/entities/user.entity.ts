/**
 * User Entity
 * Represents a system user with authentication and authorization
 */

import { UserResponseDto } from '../dto/user-response.dto';
import { buildPublicUploadsUrl } from '../../../../shared/utils/public-asset-url.util';

export class UserEntity {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  profilePicture: string | null; // Profile picture file path
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  failedLoginAttempts: number;
  lastFailedLoginAt: Date | null;
  lockedUntil: Date | null;
  permanentlyLocked: boolean;
  permanentlyLockedAt: Date | null;
  unlockAttemptCount: number;
  tokenVersion: number;
  rowVersion: number;
  deletedAt: Date | null;
  deletedBy: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations (optional - loaded when needed)
  roles?: string[]; // Array of role names
  deletedByUser?: UserEntity; // User who deleted this user

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Get user's full name
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Check if user account is locked
   */
  isLocked(): boolean {
    if (this.permanentlyLocked) {
      return true;
    }

    if (this.lockedUntil) {
      return new Date() < this.lockedUntil;
    }

    return false;
  }

  /**
   * Check if user has a specific role (requires roles to be loaded)
   */
  hasRole(roleName: string): boolean {
    return this.roles?.includes(roleName) ?? false;
  }

  /**
   * Get full URL for profile picture
   */
  getProfilePictureUrl(): string | null {
    return buildPublicUploadsUrl(this.profilePicture);
  }

  /**
   * Convert to safe response object (without sensitive data)
   */
  toResponse(): UserResponseDto {
    const response = new UserResponseDto();
    response.id = this.id;
    response.email = this.email;
    response.firstName = this.firstName;
    response.lastName = this.lastName;
    response.fullName = this.getFullName();
    response.phone = this.phone;
    response.isActive = this.isActive;
    response.profilePicture = this.getProfilePictureUrl();
    response.isLocked = this.isLocked();
    response.lastLoginAt = this.lastLoginAt;
    response.lastLoginIp = this.lastLoginIp;
    response.failedLoginAttempts = this.failedLoginAttempts;
    response.lastFailedLoginAt = this.lastFailedLoginAt;
    response.lockedUntil = this.lockedUntil;
    response.permanentlyLocked = this.permanentlyLocked;
    response.permanentlyLockedAt = this.permanentlyLockedAt;
    response.unlockAttemptCount = this.unlockAttemptCount;
    response.tokenVersion = this.tokenVersion;
    response.rowVersion = this.rowVersion;
    response.roles = this.roles;
    response.deletedAt = this.deletedAt;
    response.deletedBy = this.deletedBy;
    response.deletedByUser = this.deletedByUser?.toResponse();
    response.createdAt = this.createdAt;
    response.updatedAt = this.updatedAt;
    return response;
  }
}
