# Database Schema

This document describes the database schema, models, and relationships.

## Database Overview

- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5.x
- **Schema Location**: `prisma/schema.prisma`
- **Migrations**: `prisma/migrations/`

## Schema Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│      User       │         │   TenantUser    │         │     Tenant      │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ id (PK)         │◄───────┤ userId (FK)     │         │ id (PK)         │
│ email (unique)  │         │ tenantId (FK)   ├────────►│ name            │
│ password        │         │ role (enum)     │         │ slug (unique)   │
│ firstName       │         │ createdAt       │         │ createdAt       │
│ lastName        │         │ updatedAt       │         │ updatedAt       │
│ createdAt       │         └─────────────────┘         └─────────────────┘
│ updatedAt       │                                              │
└─────────────────┘                                              │
                                                                 │
┌─────────────────┐         ┌─────────────────┐                │
│   Invitation    │         │  RefreshToken   │                │
├─────────────────┤         ├─────────────────┤                │
│ id (PK)         │         │ id (PK)         │                │
│ email           │         │ userId (FK)     │                │
│ token (unique)  │         │ token (SHA-256) │                │
│ role            │         │ expiresAt       │                │
│ expiresAt       │         │ revoked         │                │
│ accepted        │         │ createdAt       │                │
│ tenantId (FK)   ├────────►│ updatedAt       │                │
│ invitedBy (FK)  │         └─────────────────┘                │
│ createdAt       │                                             │
│ updatedAt       │         ┌─────────────────┐                │
└─────────────────┘         │      Item       │                │
                            ├─────────────────┤                │
                            │ id (PK)         │                │
                            │ name            │                │
                            │ description     │                │
                            │ tenantId (FK)   ├───────────────►│
                            │ createdAt       │
                            │ updatedAt       │
                            └─────────────────┘
```

## Core Models

### User

Represents a user account.

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String   // Bcrypt hashed
  firstName     String
  lastName      String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  tenantUsers   TenantUser[]
  refreshTokens RefreshToken[]
  invitationsSent Invitation[]

  @@map("users")
}
```

**Key Fields**:
- `email`: Unique, used for login
- `password`: Bcrypt hashed (12 rounds)
- `tenantUsers`: Many-to-many relationship with tenants

### Tenant

Represents an organization or workspace.

```prisma
model Tenant {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  tenantUsers TenantUser[]
  invitations Invitation[]
  items       Item[]

  @@map("tenants")
}
```

**Key Fields**:
- `name`: Display name
- `slug`: URL-friendly unique identifier (auto-generated from name)

### TenantUser

Join table linking users to tenants with roles.

```prisma
enum TenantRole {
  OWNER   // Full control, cannot be removed
  ADMIN   // Can manage users and invitations
  MEMBER  // Basic access
}

model TenantUser {
  userId    String
  tenantId  String
  role      TenantRole
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@id([userId, tenantId])
  @@map("tenant_users")
}
```

**Key Features**:
- Composite primary key (`userId` + `tenantId`)
- `onDelete: Cascade` - Deleting user or tenant removes relationship
- `role`: OWNER, ADMIN, or MEMBER

### Invitation

Pending invitations to join a tenant.

```prisma
model Invitation {
  id         String      @id @default(uuid())
  email      String
  token      String      @unique @default(uuid())
  role       TenantRole
  expiresAt  DateTime    // 24 hours from creation
  accepted   Boolean     @default(false)
  tenantId   String
  invitedBy  String
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  // Relations
  tenant      Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  inviter     User   @relation(fields: [invitedBy], references: [id], onDelete: Cascade)

  @@map("invitations")
}
```

**Key Fields**:
- `token`: UUID used in invitation link
- `expiresAt`: Invitation valid for 24 hours
- `accepted`: Prevents reuse of invitation
- `invitedBy`: User who created the invitation

### RefreshToken

Stores refresh tokens for authentication.

```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique  // SHA-256 hash
  userId    String
  expiresAt DateTime
  revoked   Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
}
```

**Key Fields**:
- `token`: SHA-256 hash of JWT (not plaintext)
- `expiresAt`: Default 30 days
- `revoked`: Set to true on logout

### Item

Example tenant-scoped resource (reference implementation).

```prisma
model Item {
  id          String   @id @default(uuid())
  name        String
  description String?
  tenantId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("items")
}
```

**Key Features**:
- `tenantId`: Foreign key for multi-tenant isolation
- `onDelete: Cascade`: Deleting tenant deletes all items

## Relationships

### One-to-Many

```prisma
// One User has many RefreshTokens
User.refreshTokens ←→ RefreshToken.user

// One Tenant has many Invitations
Tenant.invitations ←→ Invitation.tenant

// One Tenant has many Items
Tenant.items ←→ Item.tenant
```

### Many-to-Many

```prisma
// Many Users ←→ Many Tenants (through TenantUser)
User.tenantUsers ←→ TenantUser.user
Tenant.tenantUsers ←→ TenantUser.tenant
```

## Indexes

Automatic indexes created by Prisma:
- Primary keys (`@id`)
- Unique constraints (`@unique`)
- Foreign keys (automatically indexed)

**Custom indexes** can be added:

```prisma
model Item {
  // ...
  @@index([tenantId, createdAt])  // Optimize tenant-filtered queries
}
```

## Migrations

### Creating Migrations

```bash
# Create a new migration
npm run prisma:migrate

# Name the migration when prompted
# e.g., "add_user_profile_fields"
```

### Applying Migrations

```bash
# Development
npm run prisma:migrate

# Production
npm run prisma:migrate:prod
```

### Resetting Database (Development Only)

```bash
npx prisma migrate reset
# This will:
# 1. Drop the database
# 2. Create a new database
# 3. Apply all migrations
# 4. Run seed script
```

## Seeding

Located at `prisma/seed.ts`

**Creates**:
- 1 sample tenant ("Acme Corporation")
- 2 sample users:
  - `admin@example.com` / `password123` (OWNER)
  - `user@example.com` / `password123` (MEMBER)
- Sample items

```bash
npm run prisma:seed
```

## Prisma Client

### Generated Types

Prisma automatically generates TypeScript types:

```typescript
import { User, Tenant, TenantRole } from '@prisma/client';

// Type-safe database access
const user: User = await prisma.user.findUnique({
  where: { email: 'john@example.com' },
});
```

### Regenerate Client

After schema changes:

```bash
npm run prisma:generate
```

## Common Queries

### Find User with Tenants

```typescript
const userWithTenants = await prisma.user.findUnique({
  where: { email: 'john@example.com' },
  include: {
    tenantUsers: {
      include: {
        tenant: true,
      },
    },
  },
});
```

### Find Tenant with Users

```typescript
const tenantWithUsers = await prisma.tenant.findUnique({
  where: { id: 'tenant-uuid' },
  include: {
    tenantUsers: {
      include: {
        user: true,
      },
    },
  },
});
```

### Filter Items by Tenant

```typescript
const items = await prisma.item.findMany({
  where: { tenantId: 'tenant-uuid' },
  orderBy: { createdAt: 'desc' },
});
```

### Check User Access to Tenant

```typescript
const access = await prisma.tenantUser.findUnique({
  where: {
    userId_tenantId: {
      userId: 'user-uuid',
      tenantId: 'tenant-uuid',
    },
  },
});

const hasAccess = access !== null;
```

## Data Integrity

### Cascade Deletes

- **Delete User**: Removes all `TenantUser` relationships, `RefreshToken`s, and `Invitation`s sent by user
- **Delete Tenant**: Removes all `TenantUser` relationships, `Invitation`s, and tenant-scoped data (Items, etc.)

### Constraints

- **Unique Email**: Users must have unique emails
- **Unique Slug**: Tenants must have unique slugs
- **Composite Key**: User can only belong to a tenant once
- **Foreign Keys**: Ensure referential integrity

## Database Management

### Prisma Studio

Visual database browser:

```bash
npm run prisma:studio
```

Accessible at http://localhost:5555

### Backup & Restore

```bash
# Backup
pg_dump -U postgres nestjs_db > backup.sql

# Restore
psql -U postgres nestjs_db < backup.sql
```

## Best Practices

1. ✅ **Always use migrations** - Never modify database manually
2. ✅ **Use Prisma Client** - Type-safe queries
3. ✅ **Test migrations** - Run on dev/staging before production
4. ✅ **Use indexes** - For frequently queried fields
5. ✅ **Cascade deletes** - Clean up orphaned data
6. ✅ **Validate at application level** - Don't rely only on database constraints
7. ✅ **Use transactions** - For multi-step operations
8. ✅ **Monitor query performance** - Use Prisma logging

## Adding a New Model

Example: Adding a `Project` model scoped to tenants

```prisma
model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  tenantId    String
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  tenant  Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  creator User   @relation(fields: [createdBy], references: [id], onDelete: Cascade)

  @@map("projects")
}
```

Then:

```bash
# Create migration
npm run prisma:migrate

# Generate Prisma Client
npm run prisma:generate

# Create Repository, Service, Controller, etc.
```

See [Adding Features Guide](../development/adding-features.md) for complete steps.

## Related Documentation

- [Multi-Tenancy System](./multi-tenancy.md) - How tenant isolation works
- [Repository Pattern](./repository-pattern.md) - How to query the database
- [Adding Features](../development/adding-features.md) - Adding new models
