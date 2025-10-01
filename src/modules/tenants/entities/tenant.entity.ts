import { TenantRole } from '@prisma/client';

export class TenantEntity {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations (optional, loaded based on query)
  tenantUsers?: Array<{
    id: string;
    role: TenantRole;
    userId: string;
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
  }>;

  myRole?: TenantRole;
  memberCount?: number;

  constructor(partial: Partial<TenantEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if tenant has a specific user with a specific role
   */
  hasUserWithRole(userId: string, role: TenantRole): boolean {
    if (!this.tenantUsers) return false;
    return this.tenantUsers.some((tu) => tu.userId === userId && tu.role === role);
  }

  /**
   * Check if tenant has owner
   */
  hasOwner(): boolean {
    if (!this.tenantUsers) return false;
    return this.tenantUsers.some((tu) => tu.role === TenantRole.OWNER);
  }

  /**
   * Get owner of the tenant
   */
  getOwner() {
    if (!this.tenantUsers) return null;
    return this.tenantUsers.find((tu) => tu.role === TenantRole.OWNER);
  }

  /**
   * Get member count
   */
  getMemberCount(): number {
    return this.tenantUsers?.length || this.memberCount || 0;
  }
}

export class TenantUserEntity {
  id: string;
  role: TenantRole;
  userId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations (optional)
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  tenant?: {
    id: string;
    name: string;
    slug: string;
  };

  constructor(partial: Partial<TenantUserEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if user is owner
   */
  isOwner(): boolean {
    return this.role === TenantRole.OWNER;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.role === TenantRole.ADMIN;
  }

  /**
   * Check if user is owner or admin
   */
  isOwnerOrAdmin(): boolean {
    return this.role === TenantRole.OWNER || this.role === TenantRole.ADMIN;
  }
}
