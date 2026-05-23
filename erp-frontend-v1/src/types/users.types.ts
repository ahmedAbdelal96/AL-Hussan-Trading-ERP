/**
 * Users Module Types
 * Aligned with Backend DTOs and Entity
 */

// ============= Entity =============
export interface UserEntity {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string; // Computed by backend
  phone?: string | null;
  isActive: boolean;
  profilePicture?: string | null; // Profile picture file path
  roles: string[]; // Array of role names from backend
  role?: string; // Legacy compatibility for older pages/components
  isLocked?: boolean; // Computed by backend
  lastLoginAt?: string | null;
  lastLogin?: string | null; // Legacy compatibility
  lastLoginIp?: string | null;
  failedLoginAttempts: number;
  lastFailedLoginAt?: string | null;
  lockedUntil?: string | null;
  permanentlyLocked: boolean;
  permanentlyLockedAt?: string | null;
  unlockAttemptCount: number;
  tokenVersion: number;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletedByUser?: UserEntity | null; // Populated when fetching deleted users
  department?: string | null; // Legacy compatibility
  jobTitle?: string | null; // Legacy compatibility
  nationalId?: string | null; // Legacy compatibility
  address?: string | null; // Legacy compatibility
}

// ============= DTOs =============
export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleIds?: string[];
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
  roleIds?: string[];
  rowVersion?: number;
}

export interface UserFiltersDto {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  roleId?: string;
  roleName?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ResetPasswordDto {
  newPassword: string;
}

export interface BulkCreateUsersDto {
  users: CreateUserDto[];
}

// ============= Responses =============
export interface PaginatedUsersResponse {
  data: UserEntity[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface UserStatsResponse {
  total: number;
  active: number;
  inactive: number;
  locked: number;
}

// ============= Display Types =============
export interface UserWithFullName extends UserEntity {
  fullName: string;
}

export type UserStatus = "active" | "inactive" | "locked" | "deleted";

export function getUserStatus(user: UserEntity): UserStatus {
  if (user.deletedAt) return "deleted";
  if (user.permanentlyLocked || user.lockedUntil) return "locked";
  if (!user.isActive) return "inactive";
  return "active";
}

export function getUserFullName(user: UserEntity): string {
  return `${user.firstName} ${user.lastName}`;
}
