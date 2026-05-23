/**
 * Auth cache key helpers.
 *
 * Keeping key generation centralized avoids hard-coded string drift between
 * auth and RBAC modules and makes invalidation reliable.
 */

export const buildAuthMeCacheKey = (userId: string): string =>
  `auth:me:${userId}`;
export const buildJwtAuthContextCacheKey = (
  userId: string,
  tokenVersion: number,
): string => `auth:jwt-context:${userId}:${tokenVersion}`;
export const buildJwtAuthContextUserPattern = (userId: string): string =>
  `auth:jwt-context:${userId}:*`;
