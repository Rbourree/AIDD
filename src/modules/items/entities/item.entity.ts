import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '@modules/tenants/entities/tenant.entity';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string | null;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  constructor(partial?: Partial<Item>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * Check if the item belongs to a specific tenant
   */
  belongsToTenant(tenantId: string): boolean {
    return this.tenantId === tenantId;
  }

  /**
   * Check if item has a description
   */
  hasDescription(): boolean {
    return !!this.description && this.description.length > 0;
  }
}
