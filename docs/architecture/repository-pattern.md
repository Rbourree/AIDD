# Repository Pattern

This guide explains how the repository pattern is implemented with TypeORM to separate data access from business logic.

## Overview

```
Controller → Service → Repository → TypeORM → Database
    ↓          ↓          ↓
   DTOs    Domain    TypeORM
           entities repositories
```

**Key principle:** Only repositories interact with TypeORM. Services consume repositories and work with domain entities.

## Why Use Repositories?

### Without Repositories ❌

```typescript
@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly items: Repository<Item>,
  ) {}

  async findAll(tenantId: string) {
    // Service knows about TypeORM internals
    return this.items.find({ where: { tenantId } });
  }
}
```

Issues:
- Business logic tied to persistence implementation
- Difficult to mock in tests
- TypeORM entities leak into higher layers

### With Repositories ✅

```typescript
@Injectable()
export class ItemsService {
  constructor(private readonly items: ItemRepository) {}

  async findAll(tenantId: string) {
    return this.items.findAll({ tenantId });
  }
}
```

Benefits:
- Clean separation of concerns
- Simple interfaces to mock
- TypeORM specifics encapsulated in one place

## Layer Responsibilities

### Controllers

- Validate input using DTOs
- Apply guards/interceptors
- Call services and return responses
- Never access repositories directly

### Services

- Contain business rules
- Coordinate multiple repositories
- Throw domain-specific exceptions
- Work with entities/DTOs, not persistence models

```typescript
@Injectable()
export class ItemsService {
  constructor(private readonly items: ItemRepository) {}

  async create(dto: CreateItemDto, tenantId: string) {
    const item = await this.items.create(dto, tenantId);
    return item;
  }
}
```

### Repositories

- Use `@InjectRepository(Entity)` to access TypeORM repositories
- Contain all queries, joins, and transaction logic
- Convert persistence models to domain entities when required

```typescript
@Injectable()
export class ItemRepository {
  constructor(
    @InjectRepository(Item)
    private readonly repository: Repository<Item>,
  ) {}

  async findAll(options: { tenantId: string }) {
    return this.repository.find({
      where: { tenantId: options.tenantId },
      orderBy: { createdAt: 'DESC' },
      relations: ['tenant'],
    });
  }
}
```

## Mapping Strategies

For simple modules the TypeORM entity can act as the domain model. If additional business logic is required, create a mapper class to convert between persistence entities and richer domain objects.

```typescript
export class ItemMapper {
  static toDomain(item: Item): ItemEntity {
    return new ItemEntity(item);
  }
}
```

## Testing Repositories

- Unit test services by mocking repository methods
- Integration test repositories with a test database or an in-memory database
- Use NestJS testing module with `TypeOrmModule.forRoot` configured for SQLite if needed

## Transactions

When operations span multiple repositories, encapsulate them at the repository layer using the `DataSource`:

```typescript
await this.dataSource.transaction(async (manager) => {
  await manager.getRepository(Tenant).save(tenant);
  await manager.getRepository(TenantUser).save(tenantUser);
});
```

Keep transaction boundaries within repositories to avoid leaking persistence concerns into services.

## Summary

1. Controllers handle HTTP concerns
2. Services orchestrate business logic
3. Repositories own TypeORM queries
4. Domain entities stay free of ORM concerns

Following this pattern keeps the codebase testable and maintains a clear separation between layers.
