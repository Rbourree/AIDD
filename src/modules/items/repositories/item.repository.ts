import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { ItemEntity } from '../entities/item.entity';
import { ItemMapper } from '../mappers/item.mapper';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';

export interface FindAllItemsOptions {
  tenantId: string;
  skip?: number;
  take?: number;
  search?: string;
}

@Injectable()
export class ItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new item
   */
  async create(dto: CreateItemDto, tenantId: string): Promise<ItemEntity> {
    const data = ItemMapper.toPrismaCreate(dto, tenantId);

    const item = await this.prisma.item.create({
      data,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return ItemMapper.toEntity(item);
  }

  /**
   * Find item by ID
   */
  async findById(id: string): Promise<ItemEntity | null> {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return item ? ItemMapper.toEntity(item) : null;
  }

  /**
   * Find all items with pagination and filtering
   */
  async findAll(options: FindAllItemsOptions): Promise<ItemEntity[]> {
    const { tenantId, skip, take, search } = options;

    const where: any = {
      tenantId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const items = await this.prisma.item.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return ItemMapper.toEntityArray(items);
  }

  /**
   * Count items with filtering
   */
  async count(tenantId: string, search?: string): Promise<number> {
    const where: any = {
      tenantId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    return this.prisma.item.count({ where });
  }

  /**
   * Update an item
   */
  async update(id: string, dto: UpdateItemDto): Promise<ItemEntity> {
    const data = ItemMapper.toPrismaUpdate(dto);

    const item = await this.prisma.item.update({
      where: { id },
      data,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return ItemMapper.toEntity(item);
  }

  /**
   * Delete an item
   */
  async delete(id: string): Promise<void> {
    await this.prisma.item.delete({
      where: { id },
    });
  }
}
