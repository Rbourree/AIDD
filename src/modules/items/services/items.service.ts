import { Injectable } from '@nestjs/common';
import { ItemRepository } from '../repositories/item.repository';
import { Item } from '../entities/item.entity';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { PaginationDto } from '@common/dtos/pagination.dto';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface';
import { ItemNotFoundException, ItemForbiddenException } from '../exceptions/item.exceptions';

@Injectable()
export class ItemsService {
  constructor(private readonly itemRepository: ItemRepository) {}

  async create(createItemDto: CreateItemDto, userTenantId: string): Promise<Item> {
    return this.itemRepository.create(createItemDto, userTenantId);
  }

  async findAll(
    paginationDto: PaginationDto,
    userTenantId: string,
  ): Promise<PaginatedResponse<Item>> {
    const { page, limit, search } = paginationDto;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.itemRepository.findAll({
        tenantId: userTenantId,
        skip,
        take: limit,
        search,
      }),
      this.itemRepository.count(userTenantId, search),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userTenantId: string): Promise<Item> {
    const item = await this.itemRepository.findById(id);

    if (!item) {
      throw new ItemNotFoundException(id);
    }

    // Verify that the user has access to this item's tenant
    if (!item.belongsToTenant(userTenantId)) {
      throw new ItemForbiddenException();
    }

    return item;
  }

  async update(
    id: string,
    updateItemDto: UpdateItemDto,
    userTenantId: string,
  ): Promise<Item> {
    // First, verify the item exists and user has access
    await this.findOne(id, userTenantId);

    return this.itemRepository.update(id, updateItemDto);
  }

  async remove(id: string, userTenantId: string): Promise<{ message: string }> {
    // First, verify the item exists and user has access
    await this.findOne(id, userTenantId);

    await this.itemRepository.delete(id);

    return { message: 'Item deleted successfully' };
  }
}
