import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { TenantRole } from '../enums/tenant-role.enum';
import { User } from '@modules/users/entities/user.entity';
import { Tenant } from './tenant.entity';

@Entity('tenant_users')
@Unique(['userId', 'tenantId'])
export class TenantUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TenantRole,
    default: TenantRole.MEMBER,
  })
  role: TenantRole;

  @Column()
  userId: string;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.tenantUsers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Tenant, (tenant) => tenant.tenantUsers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  constructor(partial?: Partial<TenantUser>) {
    if (partial) {
      Object.assign(this, partial);
    }
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
