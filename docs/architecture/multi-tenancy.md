# Multi-Tenancy System

This guide explains how the application enforces tenant isolation with TypeORM and NestJS.

## Overview

- A single PostgreSQL database stores all tenants
- Every row contains a `tenantId` foreign key
- Users can belong to multiple tenants but act within one tenant at a time
- Guards and interceptors enforce tenant context on each request

## Core Concepts

### Tenant

Represents an organization or workspace.

```typescript
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;
}
```

### TenantUser

Join table linking users to tenants with roles.

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
}
```

### Active Tenant

- Stored in the JWT payload as `tenantId`
- Determines which tenant all service queries operate against
- Users switch tenants via `/v1/users/switch-tenant`

## JWT Payload

```typescript
interface JwtPayload {
  sub: string;      // user id
  tenantId: string; // active tenant id
  email: string;
  iat: number;
  exp: number;
}
```

## Isolation Mechanisms

### 1. JWT Strategy Validation

`JwtStrategy` checks tenant membership on every request:

```typescript
const user = await this.usersRepository.findById(payload.sub);
if (!user) throw new UnauthorizedException();

const membership = await this.tenantUsersRepository.findOne(payload.sub, payload.tenantId);
if (!membership) throw new UnauthorizedException();
```

If a user loses access to a tenant, their existing token becomes invalid immediately.

### 2. Tenant Filter Interceptor

Adds `tenantId` from the authenticated user to the request object.

```typescript
if (request.user?.tenantId) {
  request.tenantId = request.user.tenantId;
}
```

### 3. Service-Level Filtering

Services require the tenant ID when querying repositories.

```typescript
async findOne(id: string, tenantId: string) {
  const item = await this.itemRepository.findById(id);
  if (!item || !item.belongsToTenant(tenantId)) {
    throw new ItemForbiddenException();
  }
  return item;
}
```

### 4. Database Constraints

TypeORM relations enforce ownership. Example from `items/entities/item.entity.ts`:

```typescript
@ManyToOne(() => Tenant, (tenant) => tenant.items, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'tenantId' })
tenant: Tenant;
```

Cascading deletes ensure all tenant data is removed when the tenant is deleted.

## Tenant Roles

| Role | Count | Permissions | Removable |
|------|-------|-------------|-----------|
| OWNER | 1 per tenant | Full control | No |
| ADMIN | Many | Manage users and invitations | Yes |
| MEMBER | Many | Access tenant resources | Yes |

Role checks are implemented with `@Roles()` decorator and `TenantRoleGuard`.

```typescript
@UseGuards(JwtAuthGuard, TenantRoleGuard)
@Roles(TenantRole.OWNER, TenantRole.ADMIN)
@Post(':tenantId/invitations')
createInvitation() { /* ... */ }
```

## Tenant Switching

Users with multiple memberships can obtain a token for a different tenant.

```bash
curl -X POST http://localhost:3000/api/v1/users/switch-tenant \
  -H "Authorization: Bearer <token>" \
  -d '{ "tenantId": "other-tenant-uuid" }'
```

The response contains a new JWT whose `tenantId` matches the requested tenant.

## Summary

- Tenant context comes from the JWT and is attached to each request
- Services always receive the tenant ID explicitly
- TypeORM relations and foreign keys provide a final safety net
- Guards and interceptors prevent cross-tenant access

This layered approach delivers strict data isolation while allowing users to collaborate across multiple tenants.
