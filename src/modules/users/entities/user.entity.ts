import { TenantRole } from '@prisma/client';

export class UserEntity {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations (optional, loaded based on query)
  tenantUsers?: Array<{
    id: string;
    role: TenantRole;
    tenantId: string;
    tenant: {
      id: string;
      name: string;
      slug: string;
      createdAt: Date;
    };
  }>;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Get user's full name
   */
  getFullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`.trim();
    }
    return this.firstName || this.lastName || this.email;
  }

  /**
   * Get user's initials
   */
  getInitials(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
    }
    if (this.firstName) {
      return this.firstName.substring(0, 2).toUpperCase();
    }
    return this.email.substring(0, 2).toUpperCase();
  }

  /**
   * Check if user has access to a specific tenant
   */
  hasTenantAccess(tenantId: string): boolean {
    if (!this.tenantUsers) return false;
    return this.tenantUsers.some((tu) => tu.tenantId === tenantId);
  }

  /**
   * Get user's role in a specific tenant
   */
  getRoleInTenant(tenantId: string): TenantRole | null {
    if (!this.tenantUsers) return null;
    const tenantUser = this.tenantUsers.find((tu) => tu.tenantId === tenantId);
    return tenantUser?.role || null;
  }

  /**
   * Check if user has a complete profile
   */
  hasCompleteProfile(): boolean {
    return !!(this.firstName && this.lastName);
  }
}
