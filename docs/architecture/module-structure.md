# Module Structure

This document explains the modular architecture and how modules are organized in the application.

## Module Pattern

Each feature is organized as a NestJS module following a consistent structure:

```
src/modules/[module-name]/
├── controllers/                # HTTP layer
│   └── [module].controller.ts
├── services/                   # Business logic
│   └── [module].service.ts
├── repositories/               # Data access
│   └── [module].repository.ts
├── entities/                   # Domain models
│   └── [module].entity.ts
├── mappers/                    # Data transformations
│   └── [module].mapper.ts
├── dto/                        # Data transfer objects
│   ├── create-[module].dto.ts
│   ├── update-[module].dto.ts
│   └── ...
├── exceptions/                 # Custom exceptions
│   └── [module].exceptions.ts
└── [module].module.ts          # Module configuration
```

## Layer Responsibilities

### Controllers (controllers/)

**Purpose**: Handle HTTP requests and responses

```typescript
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({ status: 201, type: ItemEntity })
  async create(
    @Body() createItemDto: CreateItemDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ItemEntity> {
    return this.itemsService.create(createItemDto, user.tenantId);
  }
}
```

**Responsibilities**:
- Define HTTP routes
- Validate input (DTOs)
- Extract request data (body, params, query)
- Call services
- Return responses
- API documentation (Swagger)

**Do**:
- ✅ Use decorators (`@Get`, `@Post`, `@Body`, etc.)
- ✅ Apply guards (`@UseGuards()`)
- ✅ Document with Swagger (`@ApiOperation`, `@ApiResponse`)
- ✅ Extract user from `@CurrentUser()` decorator

**Don't**:
- ❌ Implement business logic
- ❌ Access database directly
- ❌ Inject PrismaService or repositories

### Services (services/)

**Purpose**: Implement business logic

```typescript
@Injectable()
export class ItemsService {
  constructor(
    private readonly itemRepository: ItemRepository,
    private readonly tenantRepository: TenantRepository,
  ) {}

  async create(dto: CreateItemDto, tenantId: string): Promise<ItemEntity> {
    // 1. Business validation
    await this.validateTenantExists(tenantId);

    // 2. Additional business rules
    if (dto.name.length < 3) {
      throw new BadRequestException('Name must be at least 3 characters');
    }

    // 3. Delegate to repository
    return this.itemRepository.create(dto, tenantId);
  }

  async findOne(id: string, tenantId: string): Promise<ItemEntity> {
    const item = await this.itemRepository.findById(id);

    if (!item) {
      throw new ItemNotFoundException(id);
    }

    // Verify ownership
    if (!item.belongsToTenant(tenantId)) {
      throw new ItemForbiddenException();
    }

    return item;
  }
}
```

**Responsibilities**:
- Implement business logic
- Validate business rules
- Orchestrate repository calls
- Throw exceptions
- Return entities

**Do**:
- ✅ Inject repositories
- ✅ Validate business rules
- ✅ Throw typed exceptions
- ✅ Work with entities
- ✅ Orchestrate multiple repositories

**Don't**:
- ❌ Access database (use repositories)
- ❌ Handle HTTP concerns
- ❌ Inject PrismaService
- ❌ Return Prisma models

### Repositories (repositories/)

**Purpose**: Data access layer

```typescript
@Injectable()
export class ItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(options: { tenantId: string }): Promise<ItemEntity[]> {
    const items = await this.prisma.item.findMany({
      where: { tenantId: options.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return ItemMapper.toEntityArray(items);
  }

  async findById(id: string): Promise<ItemEntity | null> {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    return item ? ItemMapper.toEntity(item) : null;
  }

  async create(dto: CreateItemDto, tenantId: string): Promise<ItemEntity> {
    const data = ItemMapper.toPrismaCreate(dto, tenantId);

    const item = await this.prisma.item.create({ data });

    return ItemMapper.toEntity(item);
  }
}
```

**Responsibilities**:
- Execute database queries
- Use mappers for conversions
- Return entities
- Handle database errors

**Do**:
- ✅ Inject PrismaService (ONLY layer that does)
- ✅ Use mappers
- ✅ Return entities
- ✅ Filter by tenantId

**Don't**:
- ❌ Implement business logic
- ❌ Throw business exceptions
- ❌ Return Prisma models

### Entities (entities/)

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

  canBeEditedBy(user: { userId: string; tenantId: string }): boolean {
    return this.belongsToTenant(user.tenantId);
  }

  isRecent(): boolean {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return this.createdAt > oneDayAgo;
  }
}
```

**Responsibilities**:
- Define domain model
- Implement business logic methods
- Encapsulate business rules

**Do**:
- ✅ Use plain classes
- ✅ Add business logic methods
- ✅ Keep immutable

**Don't**:
- ❌ Add decorators
- ❌ Access database
- ❌ Have external dependencies

### Mappers (mappers/)

**Purpose**: Convert between layers

```typescript
export class ItemMapper {
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

  static toEntityArray(prismaItems: Item[]): ItemEntity[] {
    return prismaItems.map(this.toEntity);
  }

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

  static toPrismaUpdate(dto: UpdateItemDto): Prisma.ItemUpdateInput {
    return {
      name: dto.name,
      description: dto.description,
    };
  }
}
```

**Responsibilities**:
- Convert Prisma models to entities
- Convert DTOs to Prisma inputs
- Centralize conversion logic

**Do**:
- ✅ Static methods
- ✅ Pure functions
- ✅ Handle null/undefined

**Don't**:
- ❌ Business logic
- ❌ Database access
- ❌ Throw exceptions

### DTOs (dto/)

**Purpose**: Validate input/output

```typescript
export class CreateItemDto {
  @ApiProperty({ description: 'Item name', example: 'My Item' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Item description',
    required: false,
    example: 'Description here',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;
}

export class UpdateItemDto extends PartialType(CreateItemDto) {}
```

**Responsibilities**:
- Define input/output structure
- Validate data
- Generate Swagger docs

**Do**:
- ✅ Use class-validator decorators
- ✅ Use Swagger decorators
- ✅ Make properties readonly

**Don't**:
- ❌ Include business logic
- ❌ Access database

### Exceptions (exceptions/)

**Purpose**: Typed exceptions

```typescript
export class ItemNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Item '${id}' not found`);
  }
}

export class ItemForbiddenException extends ForbiddenException {
  constructor() {
    super('You do not have access to this item');
  }
}
```

**Responsibilities**:
- Define module-specific exceptions
- Provide clear error messages

**Do**:
- ✅ Extend NestJS exceptions
- ✅ Provide context in message
- ✅ Keep simple

**Don't**:
- ❌ Add business logic
- ❌ Access database

## Module Configuration

Each module exports its configuration:

```typescript
@Module({
  imports: [
    // Import required modules
    DatabaseModule,
    UsersModule,
  ],
  controllers: [
    // Register controllers
    ItemsController,
  ],
  providers: [
    // Register services and repositories
    ItemsService,
    ItemRepository,
  ],
  exports: [
    // Export for use in other modules
    ItemsService,
    ItemRepository,
  ],
})
export class ItemsModule {}
```

## Core Modules

### AuthModule

**Location**: `src/modules/auth/`

**Purpose**: Authentication and authorization

**Key Components**:
- `AuthController` - Registration, login, logout, refresh
- `AuthService` - Auth business logic
- `JwtStrategy` - JWT validation
- `RefreshTokenRepository` - Token storage

**Exports**: `AuthService`

### UsersModule

**Location**: `src/modules/users/`

**Purpose**: User management

**Key Components**:
- `UsersController` - User CRUD, profile, tenant switching
- `UsersService` - User business logic
- `UserRepository` - User data access
- `UserMapper` - User conversions

**Exports**: `UsersService`, `UserRepository`

### TenantsModule

**Location**: `src/modules/tenants/`

**Purpose**: Tenant and invitation management

**Key Components**:
- `TenantsController` - Tenant CRUD, user management
- `TenantsService` - Tenant business logic
- `TenantRepository` - Tenant data access
- `InvitationRepository` - Invitation data access
- `TenantMapper`, `InvitationMapper`

**Exports**: `TenantsService`, `TenantRepository`, `InvitationRepository`

### ItemsModule

**Location**: `src/modules/items/`

**Purpose**: Example tenant-scoped resource

**Key Components**:
- `ItemsController` - Item CRUD
- `ItemsService` - Item business logic
- `ItemRepository` - Item data access
- `ItemMapper` - Item conversions

**Exports**: `ItemsService`, `ItemRepository`

### HealthModule

**Location**: `src/modules/health/`

**Purpose**: Health check endpoint

**Key Components**:
- `HealthController` - Health check endpoint

## Shared Modules

### DatabaseModule

**Location**: `src/database/`

**Purpose**: Prisma client

**Exports**: `PrismaService`

**Global**: Yes

### ConfigModule

**Location**: `src/config/`

**Purpose**: Environment configuration

**Exports**: `ConfigService`

**Global**: Yes

## Integration Modules

### MailModule

**Location**: `src/common/integrations/mail/`

**Purpose**: Email service (Mailjet)

**Exports**: `MailService`

### YousignModule

**Location**: `src/common/integrations/yousign/`

**Purpose**: Electronic signature

**Exports**: `YousignService`

### Ar24Module

**Location**: `src/common/integrations/ar24/`

**Purpose**: Registered mail

**Exports**: `Ar24Service`

## Module Dependencies

```
AppModule
├── ConfigModule (global)
├── DatabaseModule (global)
├── AuthModule
│   └── UsersModule
│       └── TenantsModule
├── TenantsModule
├── ItemsModule
│   ├── UsersModule
│   └── TenantsModule
├── HealthModule
└── Integrations
    ├── MailModule
    ├── YousignModule
    └── Ar24Module
```

## Creating a New Module

Use NestJS CLI:

```bash
# Generate module
nest g module modules/projects

# Generate controller
nest g controller modules/projects/controllers/projects --flat

# Generate service
nest g service modules/projects/services/projects --flat
```

Then manually create:
- Repository
- Entity
- Mapper
- DTOs
- Exceptions

See [Adding Features Guide](../development/adding-features.md) for complete steps.

## Best Practices

1. ✅ **One responsibility per layer** - Controllers handle HTTP, services handle logic, repositories handle data
2. ✅ **Consistent structure** - All modules follow the same pattern
3. ✅ **Export selectively** - Only export what other modules need
4. ✅ **Dependency direction** - Dependencies flow downward (Controller → Service → Repository)
5. ✅ **Isolate Prisma** - Only repositories inject PrismaService
6. ✅ **Use mappers** - Always convert between layers
7. ✅ **Typed exceptions** - Create module-specific exceptions

## Related Documentation

- [Repository Pattern](./repository-pattern.md) - Layer responsibilities in detail
- [Adding Features](../development/adding-features.md) - Step-by-step module creation
- [Best Practices](../development/best-practices.md) - Coding standards
