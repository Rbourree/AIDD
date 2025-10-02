# Multi-Tenancy System

This guide explains the multi-tenant architecture that provides complete data isolation between organizations.

## Overview

The application uses a **row-level multi-tenancy** pattern where:
- Multiple tenants (organizations) share the same database
- Each row of data belongs to exactly one tenant
- Complete data isolation enforced at the application level
- Users can belong to multiple tenants

## Core Concepts

### Tenant

A tenant represents an organization or workspace:

```typescript
{
  id: "uuid",
  name: "Acme Corporation",
  slug: "acme-corp",  // unique identifier
  createdAt: Date,
  updatedAt: Date
}
```

### Active Tenant

Users can belong to multiple tenants, but only **one tenant is active at a time**:

- Active tenant stored in JWT token (`tenantId` claim)
- All operations scoped to the active tenant
- Users can switch active tenant anytime

### TenantUser Relationship

The `TenantUser` join table links users to tenants with roles:

```typescript
{
  userId: "user-uuid",
  tenantId: "tenant-uuid",
  role: "OWNER" | "ADMIN" | "MEMBER"
}
```

A user can have different roles in different tenants.

## JWT Token Structure

Every JWT contains tenant context:

```typescript
interface JwtPayload {
  sub: string;        // User ID
  tenantId: string;   // Active tenant ID
  email?: string;     // User email (optional)
  iat: number;        // Issued at timestamp
  exp: number;        // Expiration timestamp
}
```

**Example decoded JWT**:
```json
{
  "sub": "123e4567-e89b-12d3-a456-426614174000",
  "tenantId": "987fcdeb-51a2-43d7-9012-345678901234",
  "email": "john@example.com",
  "iat": 1640000000,
  "exp": 1640604800
}
```

## Tenant Isolation Mechanisms

### 1. JWT Strategy Validation

The `JwtStrategy` validates tenant access on every request:

```typescript
// src/modules/auth/strategies/jwt.strategy.ts
async validate(payload: JwtPayload) {
  // 1. Verify user exists
  const user = await this.userRepository.findById(payload.sub);
  if (!user) throw new UnauthorizedException();

  // 2. Verify user has access to tenant
  const hasAccess = await this.tenantRepository.userHasAccessToTenant(
    payload.sub,
    payload.tenantId
  );
  if (!hasAccess) throw new UnauthorizedException();

  // 3. Attach user + tenantId to request
  return {
    userId: payload.sub,
    tenantId: payload.tenantId,
    email: payload.email,
  };
}
```

**Security**: If a user is removed from a tenant, their JWT becomes invalid immediately (checked on every request).

### 2. Tenant Filter Interceptor

Attaches tenant context to request object:

```typescript
// src/common/interceptors/tenant-filter.interceptor.ts
@Injectable()
export class TenantFilterInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Extract tenantId from JWT and make it easily accessible
    if (user?.tenantId) {
      request.tenantId = user.tenantId;
    }

    return next.handle();
  }
}
```

### 3. Service-Level Filtering

All services filter queries by `tenantId`:

```typescript
// Example from ItemsService
async findAll(tenantId: string): Promise<ItemEntity[]> {
  // Automatically filter by tenantId
  return this.itemRepository.findAll({ tenantId });
}

async findOne(id: string, tenantId: string): Promise<ItemEntity> {
  const item = await this.itemRepository.findById(id);

  if (!item) {
    throw new ItemNotFoundException(id);
  }

  // Verify item belongs to user's tenant
  if (!item.belongsToTenant(tenantId)) {
    throw new ItemForbiddenException();
  }

  return item;
}
```

**Pattern**: Always pass `tenantId` from `request.user.tenantId` to services.

### 4. Database Schema Enforcement

Every tenant-scoped table has a `tenantId` foreign key:

```prisma
model Item {
  id          String   @id @default(uuid())
  name        String
  description String?
  tenantId    String   // Foreign key
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("items")
}
```

**Cascade Deletes**: When a tenant is deleted, all related data is automatically deleted.

## Tenant Roles

Three roles with different permissions:

| Role | Count | Permissions | Removable |
|------|-------|------------|-----------|
| **OWNER** | 1 per tenant | Full control | ❌ No |
| **ADMIN** | 0-N per tenant | Manage users, invitations, update tenant | ✅ Yes |
| **MEMBER** | 0-N per tenant | Access tenant data | ✅ Yes |

### Role Enforcement

Using the `TenantRoleGuard`:

```typescript
@Controller('tenants')
export class TenantsController {
  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @Roles(TenantRole.OWNER, TenantRole.ADMIN)
  @Post(':tenantId/invitations')
  async createInvitation(@Param('tenantId') tenantId: string) {
    // Only OWNER and ADMIN can create invitations
  }

  @UseGuards(JwtAuthGuard, TenantRoleGuard)
  @Roles(TenantRole.OWNER)
  @Delete(':tenantId')
  async deleteTenant(@Param('tenantId') tenantId: string) {
    // Only OWNER can delete tenant
  }
}
```

### Role Assignment Rules

1. **New Tenant**: Creator automatically gets OWNER role
2. **Invitations**: Inviter specifies role (ADMIN or MEMBER)
3. **Role Changes**: OWNER/ADMIN can change roles (except OWNER)
4. **OWNER Protection**: OWNER role cannot be reassigned or removed

## User-Tenant Workflows

### Workflow 1: Creating a New Tenant

```typescript
// POST /auth/register
{
  "email": "john@example.com",
  "password": "Secure123!",
  "firstName": "John",
  "lastName": "Doe",
  "tenantName": "New Company"  // Creates new tenant
}

// Response includes JWT with new tenant as active
{
  "accessToken": "eyJhbGc...",
  "user": { ... },
  "tenant": {
    "id": "uuid",
    "name": "New Company",
    "role": "OWNER"
  }
}
```

### Workflow 2: Inviting Users to Existing Tenant

```typescript
// 1. Admin creates invitation
POST /tenants/{tenantId}/invitations
{
  "email": "jane@example.com",
  "role": "MEMBER"
}

// 2. Jane receives invitation email

// 3. Jane accepts invitation
POST /auth/accept-invitation
{
  "token": "invitation-token",
  "password": "Secure123!",
  "firstName": "Jane",
  "lastName": "Smith"
}

// 4. Jane gets JWT with invited tenant as active
```

### Workflow 3: Switching Between Tenants

```typescript
// Get list of tenants user belongs to
GET /users/me/tenants

// Response
{
  "tenants": [
    { "id": "uuid-1", "name": "Company A", "role": "OWNER" },
    { "id": "uuid-2", "name": "Company B", "role": "MEMBER" }
  ]
}

// Switch to Company B
POST /users/switch-tenant
{
  "tenantId": "uuid-2"
}

// Response includes new JWT with Company B as active tenant
{
  "accessToken": "eyJhbGc...",  // New JWT
  "refreshToken": "..."
}
```

## Data Access Patterns

### Pattern 1: Automatic Filtering (Recommended)

Always filter by `tenantId` in repository queries:

```typescript
// Repository
async findAll(options: { tenantId: string }): Promise<ItemEntity[]> {
  const items = await this.prisma.item.findMany({
    where: { tenantId: options.tenantId },
  });
  return items.map(ItemMapper.toEntity);
}

// Service
async findAll(user: JwtPayload): Promise<ItemEntity[]> {
  return this.itemRepository.findAll({ tenantId: user.tenantId });
}

// Controller
@Get()
async findAll(@CurrentUser() user: JwtPayload) {
  return this.itemsService.findAll(user);
}
```

### Pattern 2: Ownership Verification

For single resource access, verify ownership:

```typescript
async findOne(id: string, user: JwtPayload): Promise<ItemEntity> {
  const item = await this.itemRepository.findById(id);

  if (!item) {
    throw new ItemNotFoundException(id);
  }

  // Verify item belongs to user's active tenant
  if (!item.belongsToTenant(user.tenantId)) {
    throw new ItemForbiddenException();
  }

  return item;
}
```

### Pattern 3: Cross-Tenant Queries (Admin Only)

Some endpoints may need to query across tenants:

```typescript
// Only for admin/system endpoints
async findAllSystemWide(): Promise<ItemEntity[]> {
  // No tenant filter - returns all items
  return this.itemRepository.findAll({});
}
```

**Warning**: Use sparingly and protect with appropriate guards.

## Tenant Deletion

When a tenant is deleted:

1. All `TenantUser` relationships removed
2. All tenant-scoped data cascade deleted (items, invitations, etc.)
3. Users remain in the system (may belong to other tenants)
4. Orphaned users (no remaining tenants) can create new tenants

```typescript
@Delete(':id')
@Roles(TenantRole.OWNER)
async delete(@Param('id') id: string) {
  // Only OWNER can delete
  await this.tenantsService.delete(id);
}
```

## Security Considerations

### Isolation Guarantees

- ✅ **JWT Validation**: User must have access to tenant in JWT
- ✅ **Query Filtering**: All queries filter by `tenantId`
- ✅ **Ownership Checks**: Resources verified to belong to tenant
- ✅ **Role Enforcement**: Guards check roles per tenant
- ✅ **Database Constraints**: Foreign keys enforce referential integrity

### Common Security Pitfalls (Avoided)

❌ **Direct ID Access**: Don't allow `tenantId` in request body
```typescript
// BAD
@Post()
create(@Body() dto: { tenantId: string, name: string }) {
  // User could specify any tenantId!
}

// GOOD
@Post()
create(@Body() dto: { name: string }, @CurrentUser() user: JwtPayload) {
  return this.service.create(dto, user.tenantId);
}
```

❌ **Missing Tenant Filter**: Always filter queries
```typescript
// BAD
async findById(id: string) {
  return this.prisma.item.findUnique({ where: { id } });
  // Returns item from ANY tenant!
}

// GOOD
async findById(id: string, tenantId: string) {
  return this.prisma.item.findUnique({
    where: { id, tenantId }
  });
}
```

❌ **Trusting Client**: Never trust `tenantId` from client
```typescript
// BAD
@Get(':tenantId/items')
async getItems(@Param('tenantId') tenantId: string) {
  // Client controls tenantId!
}

// GOOD
@Get('items')
async getItems(@CurrentUser() user: JwtPayload) {
  return this.service.findAll(user.tenantId);
}
```

## Testing Tenant Isolation

Test that tenant isolation works:

```typescript
describe('Tenant Isolation', () => {
  it('should not allow access to other tenant data', async () => {
    // Create two tenants
    const tenant1 = await createTenant('Tenant 1');
    const tenant2 = await createTenant('Tenant 2');

    // Create item in tenant 1
    const item1 = await createItem(tenant1.id, 'Item 1');

    // Login as user in tenant 2
    const user2Token = await loginAsUserInTenant(tenant2.id);

    // Try to access item from tenant 1
    const response = await request(app)
      .get(`/items/${item1.id}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(403);  // Forbidden

    expect(response.body.message).toContain('access');
  });
});
```

## Best Practices

1. ✅ **Always use `@CurrentUser()` decorator** to get `tenantId`
2. ✅ **Filter all tenant-scoped queries** by `tenantId`
3. ✅ **Verify ownership** before updating/deleting resources
4. ✅ **Use guards** for role-based access control
5. ✅ **Test isolation** between tenants
6. ✅ **Document tenant scope** in API endpoints
7. ✅ **Log tenant context** in error messages (for debugging)

## Related Documentation

- [Authentication System](./authentication.md) - How JWTs work
- [Database Schema](./database-schema.md) - Tenant data model
- [Adding Features](../development/adding-features.md) - How to add tenant-scoped resources
