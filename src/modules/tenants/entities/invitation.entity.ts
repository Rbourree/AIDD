import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TenantRole } from '../enums/tenant-role.enum';
import { User } from '@modules/users/entities/user.entity';
import { Tenant } from './tenant.entity';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ unique: true })
  token: string;

  @Column({
    type: 'enum',
    enum: TenantRole,
    default: TenantRole.MEMBER,
  })
  role: TenantRole;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  accepted: boolean;

  @Column()
  tenantId: string;

  @Column()
  invitedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.invitations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => User, (user) => user.invitations)
  @JoinColumn({ name: 'invitedBy' })
  inviter: User;

  constructor(partial?: Partial<Invitation>) {
    if (partial) {
      Object.assign(this, partial);
    }
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
