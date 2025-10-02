# CLAUDE.md

This file provides guidance when working with the repository.

## Development Commands

### Setup & Database
- `npm install` – Install dependencies
- `npm run docker:up` – Start PostgreSQL in Docker
- `npm run docker:down` – Stop Docker containers
- `npm run typeorm:migration:run` – Apply TypeORM migrations
- `npm run typeorm:migration:revert` – Roll back the last migration
- `npm run typeorm:migration:generate --name <Name>` – Generate a migration from entity changes

### Development
- `npm run start:dev` – Start in watch mode (recommended)
- `npm run start:debug` – Start in debug mode
- `npm run build` – Build production bundle
- `npm run start:prod` – Start production server

### Code Quality
- `npm run lint` – Lint and auto-fix TypeScript files
- `npm run format` – Format code with Prettier

## Architecture Overview

### Multi-Tenancy System

- JWT tokens embed both `sub` (userId) and `tenantId`
- The `TenantUser` join table links users to tenants with a `role` column (`OWNER`, `ADMIN`, `MEMBER`)
- Guards and interceptors enforce tenant context on each request

**Tenant Isolation Mechanisms**
1. `TenantFilterInterceptor` attaches `tenantId` from the JWT to the request
2. `TenantRoleGuard` validates the user has the required role for the active tenant
3. Services always filter queries using the provided tenant ID
4. TypeORM relations enforce cascading deletes per tenant

When adding tenant-scoped entities:
- Include a `tenantId` column
- Filter every repository query by `tenantId`
- Protect routes with `@UseGuards(JwtAuthGuard, TenantRoleGuard)` and `@Roles()` as required

### Authentication Flow

- Registration creates a user, tenant, and `TenantUser` record in a transaction
- Passwords hashed with bcrypt (12 rounds)
- Refresh tokens stored in `refresh_tokens` table (hashed, revocable)
- `AuthThrottlerGuard` limits login attempts to 5/minute
- `JwtStrategy` validates user existence and tenant membership on every request

### Invitation System

- Located in the Tenants module
- Invitations stored in `invitations` table with expiry timestamps
- `MailService` handles outbound emails (Mailjet)
- Acceptance endpoint creates accounts for new users and links them to the tenant

### Role-Based Access Control

Roles defined in `TenantRole` enum (`OWNER`, `ADMIN`, `MEMBER`). Patterns:
- OWNER has full control and cannot be removed
- ADMIN manages members and invitations
- MEMBER accesses tenant data but cannot manage users

Use:
```typescript
@UseGuards(JwtAuthGuard, TenantRoleGuard)
@Roles(TenantRole.OWNER, TenantRole.ADMIN)
```

### Module Structure

Each module follows the layered pattern:

```
controllers/  → HTTP layer
services/     → Business logic
repositories/ → TypeORM access (custom repositories)
entities/     → TypeORM entities/domain models
dto/          → Validation
exceptions/   → Domain-specific errors
```

Controllers call services, services call repositories, and repositories use TypeORM APIs. Keep these responsibilities separated for clarity and testability.
