/**
 * Authentication API Service
 *
 * Central hub for all authentication-related API calls.
 * Provides clean abstraction over HTTP layer with proper error handling.
 *
 * Architecture:
 * - Centralized endpoint management (easier to maintain)
 * - Type-safe requests and responses
 * - Consistent error handling at API level
 * - Easy to mock for testing
 *
 * Performance:
 * - Reuses axios instance with configured interceptors
 * - No request duplication or N+1 issues
 */

import { apiClient } from "./axiosConfig";
import type {
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
  TokensDto,
  UserInfoDto,
  ChangePasswordDto,
  ResetUserPasswordDto,
  MessageResponseDto,
} from "@/types/auth.types";

const BASE_URL = "/auth";
const SESSIONS_URL = "/auth/sessions";

/**
 * Active Session DTO
 * Returned from backend when querying active sessions
 */
export interface ActiveSessionDto {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  activeSessions: number;
  lastActivity?: Date;
  devices?: Array<{
    userAgent: string;
    ipAddress: string;
    createdAt: Date;
  }>;
}

/**
 * Force logout all result DTO
 * Statistics returned after force logout all operation
 */
export interface ForceLogoutAllResultDto {
  message: string;
  affectedUsers: number;
  affectedSessions: number;
  executedBy: string;
  executedAt: Date;
}

/**
 * Authentication API endpoints
 * Each method is documented with its endpoint, parameters, and return type
 */
export const authApi = {
  /**
   * POST /auth/login
   * User authentication endpoint
   *
   * @param credentials - Email and password
   * @returns User info with access and refresh tokens
   * @throws 401 Unauthorized if credentials invalid or user inactive
   * @throws 429 Too Many Requests if rate limited
   */
  login: async (credentials: LoginDto): Promise<LoginResponseDto> => {
    const { data } = await apiClient.post<LoginResponseDto>(
      `${BASE_URL}/login`,
      credentials,
    );
    return data;
  },

  /**
   * POST /auth/refresh
   * Token refresh endpoint
   *
   * @param refreshToken - Valid refresh token from previous login
   * @returns New token pair (access + refresh)
   * @throws 401 Unauthorized if token invalid/expired/revoked
   */
  refreshToken: async (refreshToken: string): Promise<TokensDto> => {
    const { data } = await apiClient.post<TokensDto>(`${BASE_URL}/refresh`, {
      refreshToken,
    } as RefreshTokenDto);
    return data;
  },

  /**
   * POST /auth/logout
   * User logout endpoint
   *
   * @param refreshToken - Optional token to revoke
   * @returns Success message
   * @note Invalidates the provided refresh token on server
   */
  logout: async (refreshToken?: string): Promise<MessageResponseDto> => {
    const { data } = await apiClient.post<MessageResponseDto>(
      `${BASE_URL}/logout`,
      { refreshToken },
    );
    return data;
  },

  /**
   * GET /auth/me
   * Get current authenticated user information
   *
   * @returns Current user info with roles
   * @throws 401 Unauthorized if token expired/invalid
   * @note Used to validate active session
   */
  getCurrentUser: async (): Promise<UserInfoDto> => {
    const { data } = await apiClient.get<UserInfoDto>(`${BASE_URL}/me`);
    return data;
  },

  /**
   * PUT /auth/change-password
   * Change user password endpoint
   *
   * @param passwordData - Current password + new password + confirmation
   * @returns Success message
   * @throws 400 Bad Request if password validation fails
   * @throws 401 Unauthorized if current password incorrect
   * @note Revokes all existing tokens after successful change
   */
  changePassword: async (
    passwordData: ChangePasswordDto,
  ): Promise<MessageResponseDto> => {
    const { data } = await apiClient.put<MessageResponseDto>(
      `${BASE_URL}/change-password`,
      passwordData,
    );
    return data;
  },

  /**
   * PUT /auth/admin/reset-user-password/:userId
   * Reset user password (Admin Only)
   *
   * @param userId - Target user ID
   * @param passwordData - New password + confirmation (no current password required)
   * @returns Success message
   * @throws 400 Bad Request if password validation fails
   * @throws 403 Forbidden if not ADMIN/SUPERADMIN or role hierarchy violation
   * @throws 404 Not Found if user doesn't exist
   * @note ADMIN/SUPERADMIN only. Revokes all user tokens after reset.
   */
  resetUserPassword: async (
    userId: string,
    passwordData: ResetUserPasswordDto,
  ): Promise<MessageResponseDto> => {
    const { data } = await apiClient.put<MessageResponseDto>(
      `${BASE_URL}/admin/reset-user-password/${userId}`,
      passwordData,
    );
    return data;
  },

  /**
   * POST /auth/unlock-account/:userId
   * Unlock a locked user account
   *
   * @param userId - Target user ID to unlock
   * @returns Success message
   * @throws 403 Forbidden if not SUPERADMIN
   * @throws 404 Not Found if user doesn't exist
   * @note SUPERADMIN only operation
   */
  unlockAccount: async (userId: string): Promise<MessageResponseDto> => {
    const { data } = await apiClient.post<MessageResponseDto>(
      `${BASE_URL}/unlock-account/${userId}`,
    );
    return data;
  },

  /**
   * GET /auth/sessions/active
   * Get all active user sessions across the system
   *
   * @returns Array of users with their active sessions and device info
   * @throws 403 Forbidden if not ADMIN/SUPERADMIN
   * @note Used for session management and monitoring
   *
   * Performance Note:
   * - Returns aggregated data grouped by user
   * - Includes device fingerprinting for audit
   * - Most recent activity sorted first
   */
  getActiveSessions: async (): Promise<ActiveSessionDto[]> => {
    const { data } = await apiClient.get<ActiveSessionDto[]>(
      `${SESSIONS_URL}/active`,
    );
    return data;
  },

  /**
   * POST /auth/sessions/force-logout/:targetUserId
   * Force logout a specific user from all devices
   *
   * @param targetUserId - User ID to force logout
   * @returns Success message
   * @throws 400 Bad Request if user ID invalid or self-logout
   * @throws 403 Forbidden if insufficient permissions
   * @throws 404 Not Found if user doesn't exist
   *
   * Security Notes:
   * - Cannot logout yourself (prevents accidental lockout)
   * - ADMIN cannot logout SUPERADMIN (role hierarchy)
   * - All tokens revoked immediately
   * - Creates audit log entry
   */
  forceLogoutUser: async (
    targetUserId: string,
  ): Promise<MessageResponseDto> => {
    const { data } = await apiClient.post<MessageResponseDto>(
      `${SESSIONS_URL}/force-logout/${targetUserId}`,
    );
    return data;
  },

  /**
   * POST /auth/sessions/force-logout-all
   * Force logout ALL users in the system (EMERGENCY)
   *
   * @returns Statistics about the operation
   * @throws 403 Forbidden if not SUPERADMIN
   *
   * ⚠️ CRITICAL OPERATION ⚠️
   * - Affects ALL users in the system
   * - All tokens immediately revoked
   * - Every user must re-authenticate
   * - Creates critical audit log
   *
   * Use Cases:
   * - Security breach detected
   * - Critical system update
   * - Emergency maintenance
   * - Token compromise detected
   */
  forceLogoutAllUsers: async (): Promise<ForceLogoutAllResultDto> => {
    const { data } = await apiClient.post<ForceLogoutAllResultDto>(
      `${SESSIONS_URL}/force-logout-all`,
    );
    return data;
  },
};
