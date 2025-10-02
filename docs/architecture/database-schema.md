# Database Schema

The project uses PostgreSQL with TypeORM entities located under `src/modules/**/entities`. This document summarises the core tables and relationships.

## Entities Overview

| Entity | Table | Description |
|--------|-------|-------------|
| `User` | `users` | Application users with authentication credentials |
| `Tenant` | `tenants` | Organizations/companies |
| `TenantUser` | `tenant_users` | Join table associating users to tenants with roles |
| `Invitation` | `invitations` | Pending invitations to join a tenant |
| `RefreshToken` | `refresh_tokens` | Stored refresh tokens for JWT rotation |
| `Item` | `items` | Example tenant-scoped resource |

All entities use UUID primary keys and timestamp columns managed by TypeORM.

## User

Located at `src/modules/users/entities/user.entity.ts`.

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  firstName: string | null;

  @Column({ nullable: true })
  lastName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => TenantUser, (tenantUser) => tenantUser.user)
  tenantUsers: TenantUser[];
}
```

## Tenant & TenantUser

Tenants live in `src/modules/tenants/entities/tenant.entity.ts` and are connected to users through `TenantUser`.

```typescript
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @OneToMany(() => TenantUser, (tenantUser) => tenantUser.tenant)
  tenantUsers: TenantUser[];
}
```

```typescript
@Entity('tenant_users')
@Unique(['userId', 'tenantId'])
export class TenantUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TenantRole, default: TenantRole.MEMBER })
  role: TenantRole;

  @Column()
  userId: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.tenantUsers, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @ManyToOne(() => User, (user) => user.tenantUsers, { onDelete: 'CASCADE' })
  user: User;
}
```

This join table enforces multi-tenancy and role-based access control.

## Invitation

`src/modules/tenants/entities/invitation.entity.ts` stores pending invitations with expiration timestamps and optional acceptance metadata.

## RefreshToken

`src/modules/auth/entities/refresh-token.entity.ts` persists refresh tokens with expiration, revocation state, and linkage to users.

## Item

An example tenant-scoped entity defined in `src/modules/items/entities/item.entity.ts`.

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

  @ManyToOne(() => Tenant, (tenant) => tenant.items, { onDelete: 'CASCADE' })
  tenant: Tenant;
}
```

## Migrations

- Migrations live under `src/database/migrations/`
- Run `npm run typeorm:migration:run` to apply them
- Generate new migrations with `npm run typeorm:migration:generate --name <Name>`

## Indexes & Constraints

- Unique constraint on `users.email`
- Unique constraint on `tenants.slug`
- Unique constraint on `(userId, tenantId)` in `tenant_users`
- Foreign keys cascade deletes to maintain tenant isolation

## Seed Data

No automatic seed script is provided. Use the registration endpoint or custom scripts to bootstrap tenants and users.

## Diagram

```
User ──< TenantUser >── Tenant
  │                      │
  └──────< Invitation    └──< Item
         RefreshToken
```

This structure ensures every tenant's data is isolated while allowing users to join multiple tenants with specific roles.
