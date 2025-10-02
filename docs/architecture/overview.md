# Architecture Overview

This document provides a high-level overview of the NestJS Multi-Tenant API architecture.

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | NestJS 10.x | Modular server-side application framework |
| **Language** | TypeScript 5.1+ | Type-safe development |
| **Database** | PostgreSQL 15+ | Relational database |
| **ORM** | TypeORM 0.3.x | Data mapping and migrations |
| **Authentication** | Passport + JWT | Secure authentication |
| **Validation** | class-validator | Request/response validation |
| **Documentation** | Swagger/OpenAPI | Auto-generated API docs |

## Core Architecture Principles

### 1. Repository Pattern

```
Controller → Service → Repository → TypeORM → Database
    ↓          ↓          ↓
   DTOs    Entities   TypeORM repositories
```

**Key Benefits**
- Separation of concerns between HTTP, business logic, and persistence
- Easy to test (repositories can be mocked)
- Database implementation hidden from services
- Consistent data-access patterns across modules

See [Repository Pattern Guide](./repository-pattern.md) for details.

### 2. Multi-Tenant Architecture

Every resource is scoped to a tenant:

```
User ←→ TenantUser ←→ Tenant
                         ↓
              Tenant data (Items, etc.)
```

Isolation is enforced through JWT tenant context, guards, and TypeORM relations. More details in the [Multi-Tenancy Guide](./multi-tenancy.md).

### 3. Layered Architecture

```
┌─────────────────────────────────────────┐
│           HTTP Layer (NestJS)           │
│  Controllers, Guards, Interceptors      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Business Logic Layer           │
│  Services, Domain Entities, Validation  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Data Access Layer              │
│  Repositories, TypeORM, Mappers         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Database Layer                 │
│  PostgreSQL                             │
└─────────────────────────────────────────┘
```

Responsibilities flow downward only, keeping upper layers unaware of lower-level implementation details.

## Project Structure

```
src/
├── common/                    # Shared resources
│   ├── decorators/           # Custom decorators (@Public, @Roles, @CurrentUser)
│   ├── filters/              # Global exception filters
│   ├── guards/               # Auth & tenant guards
│   ├── interceptors/         # Request/response interceptors (Sentry, Tenant)
│   ├── validators/           # Custom validation constraints
│   └── integrations/         # External service integrations (Mailjet, Yousign, AR24)
│
├── config/                   # Configuration management
│   ├── configuration.ts     # Environment config loader
│   ├── validation.schema.ts # Joi validation schema
│   ├── typeorm.config.ts    # TypeORM DataSource configuration
│   └── config.module.ts     # Config module bootstrap
│
├── database/                 # Database module
│   └── database.module.ts   # Registers TypeORM using ConfigService
│
├── modules/                  # Feature modules
│   ├── auth/
│   ├── users/
│   ├── tenants/
│   ├── items/
│   └── health/
│
├── app.module.ts            # Root application module
└── main.ts                  # Application entry point
```

See [Module Structure Guide](./module-structure.md) for detailed conventions inside each module.

## Dependency Injection

NestJS uses dependency injection everywhere:

```typescript
@Injectable()
export class ItemsService {
  constructor(
    private readonly itemRepository: ItemRepository,
    private readonly tenantsService: TenantsService,
  ) {}
}
```

Benefits:
- Loose coupling
- Easy unit testing (replace repositories with mocks)
- Explicit dependencies
- Managed lifecycle by NestJS

## DTOs (Data Transfer Objects)

Data validation is handled by class-validator decorators:

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

DTOs ensure consistent validation, Swagger documentation, and type safety.

## Domain Entities vs. TypeORM Entities

Domain entities encapsulate business logic, while TypeORM entities map to database tables. For simple modules they can be the same class (as in `items/entities/item.entity.ts`). Complex modules can use separate mapper classes to convert between persistence models and domain objects.

## Request Lifecycle

1. **Controller** receives the HTTP request and validates DTOs
2. **Guards/Interceptors** enforce authentication, tenant context, and logging
3. **Service** executes business logic and orchestrates repositories
4. **Repositories** use TypeORM to query or persist data
5. **Entities/DTOs** return the response to the client

Understanding this flow helps when adding new modules or debugging issues. Continue with the [Module Structure](./module-structure.md) and [Repository Pattern](./repository-pattern.md) guides for deeper dives.
