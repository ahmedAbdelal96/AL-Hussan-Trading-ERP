/**
 * Authentication Types
 */

// ============= User Entity =============
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;

  // Login security and rate limiting
  failedLoginAttempts: number;
  lastFailedLoginAt: Date | null;
  lockedUntil: Date | null;
  permanentlyLocked: boolean;
  permanentlyLockedAt: Date | null;
  unlockAttemptCount: number;

  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Domain properties
  role?: string; // Normalized single role (uppercase)
  roles?: string[]; // Original roles from backend
  permissions?: string[]; // Resolved permissions from backend (e.g. 'employee:read')
}

// ============= DTOs =============

/**
 * Login DTO
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Change Password DTO
 */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Reset User Password DTO (Admin Only)
 */
export interface ResetUserPasswordDto {
  newPassword: string;
  confirmPassword: string;
}

/**
 * Refresh Token DTO
 */
export interface RefreshTokenDto {
  refreshToken: string;
}

// ============= Response DTOs =============

/**
 * Tokens Response
 */
export interface TokensDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

/**
 * User Info Response
 */
export interface UserInfoDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[]; // Resolved effective permissions from backend
  isActive: boolean;
}

/**
 * Login Response
 */
export interface LoginResponseDto {
  user: UserInfoDto;
  tokens: TokensDto;
}

/**
 * Message Response
 */
export interface MessageResponseDto {
  message: string;
}

/**
 * Auth Error Response
 */
export interface AuthErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  timestamp?: string;
  path?: string;
}

// ============= Form Types =============

/**
 * Login Form Values
 */
export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Change Password Form Values
 */
export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Reset User Password Form Values (Admin Only)
 */
export interface ResetUserPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

// ============= Auth Context Types =============

/**
 * Auth State
 */
export interface AuthState {
  user: UserInfoDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Auth Context Value
 */
export interface AuthContextValue extends AuthState {
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUser: (user: UserInfoDto) => void;
}
