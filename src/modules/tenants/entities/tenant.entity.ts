import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TenantRole } from '../enums/tenant-role.enum';
import { TenantUser } from './tenant-user.entity';
import { Invitation } from './invitation.entity';
import { Item } from '@modules/items/entities/item.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => TenantUser, (tenantUser) => tenantUser.tenant)
  tenantUsers: TenantUser[];

  @OneToMany(() => Invitation, (invitation) => invitation.tenant)
  invitations: Invitation[];

  @OneToMany(() => Item, (item) => item.tenant)
  items: Item[];

  // Transient properties (not persisted in database)
  myRole?: TenantRole;
  memberCount?: number;

  constructor(partial?: Partial<Tenant>) {
    if (partial) {
      Object.assign(this, partial);
    }
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
