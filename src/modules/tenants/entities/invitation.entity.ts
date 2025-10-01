import { TenantRole } from '@prisma/client';

export class InvitationEntity {
  id: string;
  email: string;
  token: string;
  role: TenantRole;
  expiresAt: Date;
  accepted: boolean;
  tenantId: string;
  invitedBy: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations (optional, loaded based on query)
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };

  inviter?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };

  constructor(partial: Partial<InvitationEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if invitation is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if invitation is valid (not expired and not accepted)
   */
  isValid(): boolean {
    return !this.accepted && !this.isExpired();
  }

  /**
   * Check if invitation is pending (not accepted yet, regardless of expiration)
   */
  isPending(): boolean {
    return !this.accepted;
  }

  /**
   * Get inviter display name
   */
  getInviterDisplayName(): string {
    if (!this.inviter) return 'Unknown';

    if (this.inviter.firstName && this.inviter.lastName) {
      return `${this.inviter.firstName} ${this.inviter.lastName}`.trim();
    }

    return this.inviter.firstName || this.inviter.lastName || this.inviter.email;
  }

  /**
   * Get time remaining before expiration in hours
   */
  getHoursUntilExpiration(): number {
    const now = new Date();
    const diff = this.expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  }
}
