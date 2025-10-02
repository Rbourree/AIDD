import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TenantRole } from '@modules/tenants/enums/tenant-role.enum';
import { TenantUser } from '@modules/tenants/entities/tenant-user.entity';
import { Invitation } from '@modules/tenants/entities/invitation.entity';
import { RefreshToken } from '@modules/auth/entities/refresh-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  firstName: string | null;

  @Column({ nullable: true })
  lastName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => TenantUser, (tenantUser) => tenantUser.user)
  tenantUsers: TenantUser[];

  @OneToMany(() => Invitation, (invitation) => invitation.inviter)
  invitations: Invitation[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  constructor(partial?: Partial<User>) {
    if (partial) {
      Object.assign(this, partial);
    }
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
