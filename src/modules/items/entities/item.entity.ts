export class ItemEntity {
  id: string;
  name: string;
  description: string | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations (optional, loaded based on query)
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };

  constructor(partial: Partial<ItemEntity>) {
    Object.assign(this, partial);
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
