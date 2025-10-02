# Architecture Overview

This document provides a high-level overview of the NestJS Multi-Tenant API architecture.

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | NestJS 10.x | Server-side application framework |
| **Language** | TypeScript 5.1+ | Type-safe development |
| **Database** | PostgreSQL 15+ | Relational database |
| **ORM** | Prisma 5.x | Type-safe database access |
| **Authentication** | Passport + JWT | Secure authentication |
| **Validation** | class-validator | Request/response validation |
| **Documentation** | Swagger/OpenAPI | Auto-generated API docs |

## Core Architecture Principles

### 1. Repository Pattern

```
Controller → Service → Repository → Prisma → Database
    ↓          ↓          ↓
   DTOs    Entities   Entities
```

**Key Benefits**:
- Separation of concerns
- Easy to test (mock repositories)
- Database implementation hidden from business logic
- Consistent data access patterns

See [Repository Pattern Guide](./repository-pattern.md) for details.

### 2. Multi-Tenant Architecture

Every resource is scoped to a tenant:

```
User ←→ TenantUser ←→ Tenant
                         ↓
              All tenant data (Items, etc.)
```

**Isolation Methods**:
- JWT contains `tenantId`
- All queries filtered by `tenantId`
- Guards enforce tenant access
- Database foreign keys ensure referential integrity

See [Multi-Tenancy Guide](./multi-tenancy.md) for details.

### 3. Layered Architecture

```
┌─────────────────────────────────────────┐
│           HTTP Layer (NestJS)           │
│  Controllers, Guards, Interceptors      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Business Logic Layer           │
│  Services, Entities, Validation         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Data Access Layer              │
│  Repositories, Mappers                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Database Layer                 │
│  Prisma ORM, PostgreSQL                 │
└─────────────────────────────────────────┘
```

Each layer has clear responsibilities and dependencies flow downward only.

## Project Structure

```
src/
├── common/                    # Shared resources
│   ├── decorators/           # Custom decorators (@Public, @Roles, @CurrentUser)
│   ├── filters/              # Exception filters (HttpExceptionFilter)
│   ├── guards/               # Auth guards (JwtAuthGuard, TenantRoleGuard)
│   ├── interceptors/         # Request/response interceptors (Sentry, Tenant)
│   ├── validators/           # Custom validators (@IsStrongPassword)
│   └── integrations/         # External service integrations
│       ├── mail/            # Mailjet email service
│       ├── yousign/         # Electronic signature
│       ├── ar24/            # Registered mail
│       └── ...
│
├── config/                   # Configuration management
│   ├── configuration.ts     # Environment config loader
│   ├── validation.schema.ts # Joi validation schema
│   └── config.module.ts     # Config module
│
├── database/                 # Database layer
│   ├── prisma.service.ts    # Prisma client service
│   └── database.module.ts   # Database module
│
├── modules/                  # Feature modules
│   ├── auth/                # Authentication & authorization
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/    # RefreshTokenRepository
│   │   ├── strategies/      # JWT strategy
│   │   ├── entities/
│   │   ├── dto/
│   │   └── exceptions/
│   │
│   ├── users/               # User management
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/    # UserRepository
│   │   ├── mappers/        # UserMapper
│   │   ├── entities/
│   │   ├── dto/
│   │   └── exceptions/
│   │
│   ├── tenants/             # Tenant & invitation management
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/    # TenantRepository, InvitationRepository
│   │   ├── mappers/
│   │   ├── entities/
│   │   ├── dto/
│   │   └── exceptions/
│   │
│   ├── items/               # Example tenant-scoped resource
│   │   └── ...
│   │
│   └── health/              # Health check endpoint
│
├── app.module.ts            # Root application module
└── main.ts                  # Application entry point
```

See [Module Structure Guide](./module-structure.md) for module patterns.

## Key Architectural Patterns

### Dependency Injection

NestJS uses dependency injection throughout:

```typescript
@Injectable()
export class ItemsService {
  constructor(
    private readonly itemRepository: ItemRepository,
    private readonly tenantRepository: TenantRepository,
  ) {}
}
```

**Benefits**:
- Loose coupling
- Easy testing (inject mocks)
- Clear dependencies
- Managed lifecycle

### DTOs (Data Transfer Objects)

Input/output validation using class-validator:

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

**Benefits**:
- Runtime validation
- Type safety
- Auto-generated Swagger docs
- Prevents over-posting

### Entities

Domain models with business logic:

```typescript
export class ItemEntity {
  id: string;
  name: string;
  tenantId: string;

  belongsToTenant(tenantId: string): boolean {
    return this.tenantId === tenantId;
  }
}
```

**Benefits**:
- Business logic in one place
- Testable in isolation
- Separate from database models
- Type-safe

### Mappers

Convert between layers:

```typescript
export class ItemMapper {
  static toEntity(prismaItem: Item): ItemEntity { ... }
  static toPrismaCreate(dto: CreateItemDto, tenantId: string) { ... }
}
```

**Benefits**:
- Centralized conversion logic
- Isolates Prisma models from business logic
- Easy to refactor database schema
- Consistent transformations

## Security Architecture

### Defense in Depth

Multiple security layers:

1. **Input Validation** - DTOs with class-validator
2. **Authentication** - JWT verification on every request
3. **Authorization** - Role-based guards
4. **Tenant Isolation** - Automatic filtering
5. **Rate Limiting** - Throttler guards
6. **Security Headers** - Helmet middleware
7. **CORS** - Configured origins only

### Authentication Flow

```
1. User Login
   ↓
2. Validate Credentials (bcrypt)
   ↓
3. Generate JWT (with tenantId)
   ↓
4. Store Refresh Token (hashed)
   ↓
5. Return Tokens
   ↓
6. Client includes JWT in requests
   ↓
7. JwtAuthGuard validates token
   ↓
8. JwtStrategy validates user + tenant
   ↓
9. Request processed
```

See [Authentication Guide](./authentication.md) for details.

### Tenant Isolation

```
1. JWT contains tenantId
   ↓
2. TenantFilterInterceptor extracts tenantId
   ↓
3. Attached to request.user.tenantId
   ↓
4. Services filter all queries by tenantId
   ↓
5. Users only see their tenant's data
```

See [Multi-Tenancy Guide](./multi-tenancy.md) for details.

## Error Handling

### Exception Hierarchy

```
HttpException (NestJS)
  ├── BadRequestException
  ├── UnauthorizedException
  ├── ForbiddenException
  ├── NotFoundException
  └── ...
```

### Custom Exceptions

Each module defines typed exceptions:

```typescript
export class ItemNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Item '${id}' not found`);
  }
}
```

### Global Exception Filter

`HttpExceptionFilter` handles all exceptions:
- Formats error responses
- Logs errors
- Sends to Sentry (production)
- Sanitizes sensitive data

## Configuration Management

### Environment-Based Config

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({...}),
    }),
  ],
})
```

**Features**:
- Type-safe access via ConfigService
- Joi validation on startup
- Fails fast on invalid config
- Environment-specific values

### Configuration Structure

```
configuration.ts
  └── Loads .env
       ↓
  validation.schema.ts
  └── Validates with Joi
       ↓
  ConfigService
  └── Type-safe access
```

## Performance Considerations

### Database Optimization

- **Connection Pooling**: Configured in DATABASE_URL
- **Indexes**: On foreign keys and frequently queried fields
- **Selective Loading**: Prisma `select` and `include`

### Caching Strategy

Currently stateless (no caching). Future improvements:
- Redis for session storage
- Query result caching
- Rate limit counters

### Horizontal Scaling

Application is stateless and can be horizontally scaled:
- No in-memory session storage (JWT-based)
- Database connection pooling
- Load balancer friendly

## Monitoring & Observability

### Sentry Integration

- Error tracking
- Performance monitoring
- User context (tenant, role)
- Request breadcrumbs

### Health Checks

- Database connectivity
- Dependency availability
- Exposed at `/health`

### Logging

- Structured logging with NestJS Logger
- Request/response logging
- Error logging with context

## Next Steps

Dive deeper into specific architectural components:

- [Multi-Tenancy System](./multi-tenancy.md)
- [Repository Pattern](./repository-pattern.md)
- [Authentication System](./authentication.md)
- [Database Schema](./database-schema.md)
- [Module Structure](./module-structure.md)
