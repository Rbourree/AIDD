# Module Structure

This document explains the modular architecture and how modules are organized in the application when using TypeORM.

## Module Pattern

Each feature module follows a consistent structure:

```
src/modules/<feature>/
├── controllers/      # HTTP layer
├── services/         # Business logic
├── repositories/     # Data access using TypeORM
├── entities/         # TypeORM entities / domain models
├── dto/              # Validation schemas
├── exceptions/       # Typed errors
└── <feature>.module.ts
```

Optional directories such as `mappers/` or `strategies/` appear when the module requires them.

## Layer Responsibilities

### Controllers (`controllers/`)

Purpose: Handle HTTP requests and responses.

```typescript
@Controller('v1/items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  async create(
    @Body() dto: CreateItemDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.itemsService.create(dto, user.tenantId);
  }
}
```

Responsibilities:
- Declare routes and Swagger metadata
- Validate incoming payloads via DTOs
- Extract context (current user, params, query)
- Delegate work to services

Controllers **never** talk to the database directly.

### Services (`services/`)

Purpose: Encapsulate business logic.

```typescript
@Injectable()
export class ItemsService {
  constructor(private readonly itemRepository: ItemRepository) {}

  async create(dto: CreateItemDto, tenantId: string) {
    const item = await this.itemRepository.create(dto, tenantId);
    return item;
  }
}
```

Services:
- Apply business rules
- Coordinate multiple repositories/integrations
- Raise domain-specific exceptions
- Return domain entities or DTOs

Services **do not** use `DataSource` or `Repository` from TypeORM directly—they rely on custom repositories.

### Repositories (`repositories/`)

Purpose: Encapsulate database access using TypeORM.

```typescript
@Injectable()
export class ItemRepository {
  constructor(
    @InjectRepository(Item)
    private readonly repository: Repository<Item>,
  ) {}

  async create(dto: CreateItemDto, tenantId: string) {
    const entity = this.repository.create({ ...dto, tenantId });
    await this.repository.save(entity);
    return this.repository.findOne({
      where: { id: entity.id },
      relations: ['tenant'],
    });
  }
}
```

Repositories:
- Use `@InjectRepository(Entity)` to access TypeORM repositories
- Build complex queries using the query builder
- Map results to domain entities when required
- Stay isolated from HTTP/business concerns

### Entities (`entities/`)

TypeORM entities map to database tables and may include domain helpers.

```typescript
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

  @ManyToOne(() => Tenant, (tenant) => tenant.items)
  tenant: Tenant;

  belongsToTenant(tenantId: string): boolean {
    return this.tenantId === tenantId;
  }
}
```

### DTOs (`dto/`)

DTOs use class-validator to enforce rules at the controller boundary.

```typescript
export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
```

### Exceptions (`exceptions/`)

Custom exceptions provide clear error semantics.

```typescript
export class ItemNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Item ${id} not found`);
  }
}
```

## Module Registration

Modules declare their providers and TypeORM entities.

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Item])],
  controllers: [ItemsController],
  providers: [ItemsService, ItemRepository],
  exports: [ItemsService],
})
export class ItemsModule {}
```

## Best Practices

1. **Keep layers isolated** – controllers → services → repositories.
2. **Use DTOs** – never expose raw request payloads to services.
3. **Leverage TypeORM relations** – eager load only what you need to avoid N+1 queries.
4. **Prefer transactions sparingly** – use `DataSource.transaction()` inside repositories when business rules require atomicity.
5. **Avoid circular dependencies** – extract shared logic to the `common/` directory.

Following this structure keeps modules predictable and easy to evolve.
