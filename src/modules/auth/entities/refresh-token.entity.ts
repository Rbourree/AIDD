export class RefreshTokenEntity {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<RefreshTokenEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if refresh token is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if refresh token is valid (not expired and not revoked)
   */
  isValid(): boolean {
    return !this.isExpired() && !this.revoked;
  }
}
