# Repository Pattern

This guide explains the Repository pattern implementation and how it separates data access from business logic.

## Overview

The Repository pattern provides a clean abstraction layer between the business logic and data access:

```
Controller → Service → Repository → Prisma → Database
    ↓          ↓          ↓
   DTOs    Entities   Entities
```

**Key Principle**: Only repositories interact with Prisma. Services work with entities.

## Why Repository Pattern?

### Without Repository Pattern ❌

```typescript
@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    // Service talks directly to Prisma
    const items = await this.prisma.item.findMany({
      where: { tenantId },
    });
    return items; // Returns Prisma models
  }
}
```

**Problems**:
- Business logic coupled to database implementation
- Hard to test (must mock entire Prisma client)
- Difficult to change database/ORM
- Prisma types leak into business layer

### With Repository Pattern ✅

```typescript
@Injectable()
export class ItemsService {
  constructor(private itemRepository: ItemRepository) {}

  async findAll(tenantId: string): Promise<ItemEntity[]> {
    // Service works with repository interface
    return this.itemRepository.findAll({ tenantId });
  }
}
```

**Benefits**:
- Clean separation of concerns
- Easy to test (mock simple repository interface)
- Database implementation hidden
- Work with domain entities, not Prisma models

## Layer Responsibilities

### 1. Controllers

**Purpose**: HTTP layer - handle requests/responses

```typescript
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationDto,
  ): Promise<ItemEntity[]> {
    // 1. Validate input (DTOs)
    // 2. Call service
    // 3. Return entities (auto-serialized to JSON)
    return this.itemsService.findAll(user.tenantId, query);
  }
}
```

**Rules**:
- ✅ Use DTOs for validation
- ✅ Call services for business logic
- ✅ Return entities or DTOs
- ❌ Never inject repositories
- ❌ Never inject PrismaService
- ❌ No business logic

### 2. Services

**Purpose**: Business logic orchestration

```typescript
@Injectable()
export class ItemsService {
  constructor(
    private readonly itemRepository: ItemRepository,
    private readonly tenantRepository: TenantRepository,
  ) {}

  async create(dto: CreateItemDto, tenantId: string): Promise<ItemEntity> {
    // 1. Validate business rules
    await this.validateTenantExists(tenantId);

    // 2. Call repository
    const item = await this.itemRepository.create(dto, tenantId);

    // 3. Return entity
    return item;
  }

  async findOne(id: string, tenantId: string): Promise<ItemEntity> {
    const item = await this.itemRepository.findById(id);

    if (!item) {
      throw new ItemNotFoundException(id);
    }

    // Business logic: verify ownership
    if (!item.belongsToTenant(tenantId)) {
      throw new ItemForbiddenException();
    }

    return item;
  }
}
```

**Rules**:
- ✅ Inject repositories (not PrismaService)
- ✅ Implement business logic
- ✅ Throw typed exceptions
- ✅ Work with entities
- ❌ Never inject PrismaService
- ❌ No database queries

### 3. Repositories

**Purpose**: Data access layer - interact with database

```typescript
@Injectable()
export class ItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(options: { tenantId: string }): Promise<ItemEntity[]> {
    // 1. Query database with Prisma
    const items = await this.prisma.item.findMany({
      where: { tenantId: options.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Convert Prisma models to entities
    return ItemMapper.toEntityArray(items);
  }

  async findById(id: string): Promise<ItemEntity | null> {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) return null;

    return ItemMapper.toEntity(item);
  }

  async create(dto: CreateItemDto, tenantId: string): Promise<ItemEntity> {
    // Use mapper to convert DTO to Prisma input
    const data = ItemMapper.toPrismaCreate(dto, tenantId);

    const item = await this.prisma.item.create({ data });

    return ItemMapper.toEntity(item);
  }

  async update(id: string, dto: UpdateItemDto): Promise<ItemEntity> {
    const data = ItemMapper.toPrismaUpdate(dto);

    const item = await this.prisma.item.update({
      where: { id },
      data,
    });

    return ItemMapper.toEntity(item);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.item.delete({ where: { id } });
  }
}
```

**Rules**:
- ✅ ONLY layer that injects PrismaService
- ✅ Perform database queries
- ✅ Use mappers for conversions
- ✅ Return entities or null
- ❌ No business logic
- ❌ No validation beyond data integrity

### 4. Entities

**Purpose**: Domain models with business logic

```typescript
export class ItemEntity {
  id: string;
  name: string;
  description: string | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;

  // Business logic methods
  belongsToTenant(tenantId: string): boolean {
    return this.tenantId === tenantId;
  }

  isOwnedBy(userId: string): boolean {
    // Example business logic
    return this.createdBy === userId;
  }

  canBeEditedBy(user: { userId: string; tenantId: string }): boolean {
    return this.belongsToTenant(user.tenantId);
  }
}
```

**Rules**:
- ✅ Plain TypeScript classes
- ✅ Business logic methods
- ✅ Immutable data (no setters)
- ✅ Separate from Prisma models
- ❌ No database access
- ❌ No external dependencies

### 5. Mappers

**Purpose**: Convert between layers

```typescript
export class ItemMapper {
  // Prisma Model → Entity
  static toEntity(prismaItem: Item): ItemEntity {
    const entity = new ItemEntity();
    entity.id = prismaItem.id;
    entity.name = prismaItem.name;
    entity.description = prismaItem.description;
    entity.tenantId = prismaItem.tenantId;
    entity.createdAt = prismaItem.createdAt;
    entity.updatedAt = prismaItem.updatedAt;
    return entity;
  }

  // Prisma Model[] → Entity[]
  static toEntityArray(prismaItems: Item[]): ItemEntity[] {
    return prismaItems.map(this.toEntity);
  }

  // CreateDTO → Prisma Create Input
  static toPrismaCreate(
    dto: CreateItemDto,
    tenantId: string,
  ): Prisma.ItemCreateInput {
    return {
      name: dto.name,
      description: dto.description,
      tenant: { connect: { id: tenantId } },
    };
  }

  // UpdateDTO → Prisma Update Input
  static toPrismaUpdate(dto: UpdateItemDto): Prisma.ItemUpdateInput {
    return {
      name: dto.name,
      description: dto.description,
    };
  }
}
```

**Rules**:
- ✅ Static methods
- ✅ Pure functions (no side effects)
- ✅ Centralized conversion logic
- ✅ Type-safe conversions
- ❌ No business logic
- ❌ No database access

### 6. DTOs (Data Transfer Objects)

**Purpose**: Input/output validation

```typescript
export class CreateItemDto {
  @ApiProperty({ description: 'Item name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Item description', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;
}

export class UpdateItemDto extends PartialType(CreateItemDto) {}
```

**Rules**:
- ✅ Use class-validator decorators
- ✅ Use Swagger decorators
- ✅ Validation only (no logic)
- ✅ Immutable (readonly properties)
- ❌ No business logic
- ❌ No database types

## Complete Data Flow

### Example: Creating an Item

```typescript
// 1. HTTP Request
POST /items
{
  "name": "New Item",
  "description": "Test"
}

// 2. Controller validates DTO and extracts user
@Post()
async create(
  @Body() createItemDto: CreateItemDto,
  @CurrentUser() user: JwtPayload,
): Promise<ItemEntity> {
  return this.itemsService.create(createItemDto, user.tenantId);
}

// 3. Service implements business logic
async create(dto: CreateItemDto, tenantId: string): Promise<ItemEntity> {
  // Business validation
  await this.validateTenantExists(tenantId);

  // Delegate to repository
  return this.itemRepository.create(dto, tenantId);
}

// 4. Repository performs database operation
async create(dto: CreateItemDto, tenantId: string): Promise<ItemEntity> {
  // Use mapper to create Prisma input
  const data = ItemMapper.toPrismaCreate(dto, tenantId);

  // Execute database query
  const item = await this.prisma.item.create({ data });

  // Convert Prisma model to entity
  return ItemMapper.toEntity(item);
}

// 5. Response (entity auto-serialized to JSON)
{
  "id": "uuid",
  "name": "New Item",
  "description": "Test",
  "tenantId": "tenant-uuid",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Testing with Repositories

### Testing Services (Mock Repository)

```typescript
describe('ItemsService', () => {
  let service: ItemsService;
  let repository: MockType<ItemRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        {
          provide: ItemRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
    repository = module.get(ItemRepository);
  });

  it('should find item by id', async () => {
    const mockItem = new ItemEntity();
    mockItem.id = '123';

    repository.findById.mockResolvedValue(mockItem);

    const result = await service.findOne('123', 'tenant-id');

    expect(result).toEqual(mockItem);
    expect(repository.findById).toHaveBeenCalledWith('123');
  });
});
```

### Testing Repositories (Integration Test)

```typescript
describe('ItemRepository (Integration)', () => {
  let repository: ItemRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    // Use test database
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItemRepository, PrismaService],
    }).compile();

    repository = module.get<ItemRepository>(ItemRepository);
    prisma = module.get<PrismaService>(PrismaService);

    // Clean database
    await prisma.item.deleteMany();
  });

  it('should create item', async () => {
    const dto: CreateItemDto = {
      name: 'Test Item',
      description: 'Test',
    };

    const item = await repository.create(dto, 'tenant-id');

    expect(item.id).toBeDefined();
    expect(item.name).toBe('Test Item');
    expect(item.tenantId).toBe('tenant-id');
  });
});
```

## Common Patterns

### Pattern 1: Pagination

```typescript
// Repository
async findAll(options: {
  tenantId: string;
  skip?: number;
  take?: number;
}): Promise<ItemEntity[]> {
  const items = await this.prisma.item.findMany({
    where: { tenantId: options.tenantId },
    skip: options.skip,
    take: options.take,
    orderBy: { createdAt: 'desc' },
  });

  return ItemMapper.toEntityArray(items);
}

async count(tenantId: string): Promise<number> {
  return this.prisma.item.count({
    where: { tenantId },
  });
}
```

### Pattern 2: Relations

```typescript
// Include relations in Prisma query
async findById(id: string): Promise<ItemEntity | null> {
  const item = await this.prisma.item.findUnique({
    where: { id },
    include: {
      tenant: true,  // Include tenant relation
    },
  });

  if (!item) return null;

  return ItemMapper.toEntity(item);
}

// Mapper handles relations
static toEntity(prismaItem: ItemWithTenant): ItemEntity {
  const entity = new ItemEntity();
  entity.id = prismaItem.id;
  entity.name = prismaItem.name;
  // ...
  entity.tenant = prismaItem.tenant
    ? TenantMapper.toEntity(prismaItem.tenant)
    : null;

  return entity;
}
```

### Pattern 3: Soft Deletes

```typescript
// Add deletedAt to entity
export class ItemEntity {
  id: string;
  name: string;
  deletedAt: Date | null;

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}

// Repository soft delete
async softDelete(id: string): Promise<void> {
  await this.prisma.item.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// Filter out soft-deleted items
async findAll(options: { tenantId: string }): Promise<ItemEntity[]> {
  const items = await this.prisma.item.findMany({
    where: {
      tenantId: options.tenantId,
      deletedAt: null,  // Exclude deleted
    },
  });

  return ItemMapper.toEntityArray(items);
}
```

## Best Practices

1. ✅ **Single Responsibility**: Each layer has one job
2. ✅ **Dependency Direction**: Dependencies flow downward (Controller → Service → Repository)
3. ✅ **Isolation**: Prisma only in repositories
4. ✅ **Consistency**: Use mappers for all conversions
5. ✅ **Testability**: Mock repositories, not Prisma
6. ✅ **Type Safety**: Entities throughout the app
7. ✅ **No Leaking**: Don't return Prisma models from repositories

## Common Mistakes

❌ **Injecting Prisma in Services**
```typescript
// BAD
export class ItemsService {
  constructor(private prisma: PrismaService) {}
}

// GOOD
export class ItemsService {
  constructor(private itemRepository: ItemRepository) {}
}
```

❌ **Business Logic in Repositories**
```typescript
// BAD
async create(dto: CreateItemDto, tenantId: string) {
  if (dto.name.length < 3) {
    throw new BadRequestException('Name too short');
  }
  // ...
}

// GOOD - validation in DTO, business logic in service
```

❌ **Returning Prisma Models**
```typescript
// BAD
async findById(id: string): Promise<Item> {
  return this.prisma.item.findUnique({ where: { id } });
}

// GOOD
async findById(id: string): Promise<ItemEntity | null> {
  const item = await this.prisma.item.findUnique({ where: { id } });
  return item ? ItemMapper.toEntity(item) : null;
}
```

## Related Documentation

- [Module Structure](./module-structure.md) - How modules are organized
- [Adding Features](../development/adding-features.md) - Step-by-step guide
- [Best Practices](../development/best-practices.md) - Coding standards
