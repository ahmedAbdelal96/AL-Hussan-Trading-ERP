/**
 * Refresh Token Domain Entity
 */

export class RefreshTokenEntity {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  isRevoked: boolean;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date;

  constructor(partial: Partial<RefreshTokenEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if token is valid
   */
  isValid(): boolean {
    return !this.isRevoked && this.expiresAt > new Date();
  }

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  /**
   * Revoke token
   */
  revoke(): void {
    this.isRevoked = true;
  }
}
