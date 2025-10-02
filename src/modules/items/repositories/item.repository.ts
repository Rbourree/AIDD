import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../entities/item.entity';
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
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}

  /**
   * Create a new item
   */
  async create(dto: CreateItemDto, tenantId: string): Promise<Item> {
    const item = this.itemRepository.create({
      ...dto,
      tenantId,
    });

    await this.itemRepository.save(item);

    return this.itemRepository.findOne({
      where: { id: item.id },
      relations: ['tenant'],
    });
  }

  /**
   * Find item by ID
   */
  async findById(id: string): Promise<Item | null> {
    return this.itemRepository.findOne({
      where: { id },
      relations: ['tenant'],
    });
  }

  /**
   * Find all items with pagination and filtering
   */
  async findAll(options: FindAllItemsOptions): Promise<Item[]> {
    const { tenantId, skip, take, search } = options;

    const queryBuilder = this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.tenant', 'tenant')
      .where('item.tenantId = :tenantId', { tenantId })
      .orderBy('item.createdAt', 'DESC');

    if (search) {
      queryBuilder.andWhere(
        '(item.name ILIKE :search OR item.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (skip !== undefined) {
      queryBuilder.skip(skip);
    }

    if (take !== undefined) {
      queryBuilder.take(take);
    }

    return queryBuilder.getMany();
  }

  /**
   * Count items with filtering
   */
  async count(tenantId: string, search?: string): Promise<number> {
    const queryBuilder = this.itemRepository
      .createQueryBuilder('item')
      .where('item.tenantId = :tenantId', { tenantId });

    if (search) {
      queryBuilder.andWhere(
        '(item.name ILIKE :search OR item.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return queryBuilder.getCount();
  }

  /**
   * Update an item
   */
  async update(id: string, dto: UpdateItemDto): Promise<Item> {
    await this.itemRepository.update(id, dto);

    return this.itemRepository.findOne({
      where: { id },
      relations: ['tenant'],
    });
  }

  /**
   * Delete an item
   */
  async delete(id: string): Promise<void> {
    await this.itemRepository.delete(id);
  }
}
