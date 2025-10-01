import { Item as PrismaItem } from '@prisma/client';
import { ItemEntity } from '../entities/item.entity';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';

type PrismaItemWithTenant = PrismaItem & {
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
};

export class ItemMapper {
  /**
   * Convert Prisma Item to ItemEntity
   */
  static toEntity(prismaItem: PrismaItemWithTenant): ItemEntity {
    return new ItemEntity({
      id: prismaItem.id,
      name: prismaItem.name,
      description: prismaItem.description,
      tenantId: prismaItem.tenantId,
      createdAt: prismaItem.createdAt,
      updatedAt: prismaItem.updatedAt,
      tenant: prismaItem.tenant,
    });
  }

  /**
   * Convert array of Prisma Items to ItemEntity array
   */
  static toEntityArray(prismaItems: PrismaItemWithTenant[]): ItemEntity[] {
    return prismaItems.map((item) => this.toEntity(item));
  }

  /**
   * Convert CreateItemDto to Prisma create input
   */
  static toPrismaCreate(dto: CreateItemDto, tenantId: string) {
    return {
      name: dto.name,
      description: dto.description,
      tenantId,
    };
  }

  /**
   * Convert UpdateItemDto to Prisma update input
   */
  static toPrismaUpdate(dto: UpdateItemDto) {
    const data: any = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    return data;
  }
}
