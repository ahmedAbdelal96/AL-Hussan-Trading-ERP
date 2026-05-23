/**
 * User Information Interface
 * Lightweight user data for audit trails and references
 * Used across the system for createdBy, deletedBy, approvedBy, etc.
 */
export interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

/**
 * Helper to get full name from UserInfo
 */
export function getUserFullName(user: UserInfo | null | undefined): string {
  if (!user) return '-';
  return `${user.firstName} ${user.lastName}`.trim();
}
