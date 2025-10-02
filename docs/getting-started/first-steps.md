# First Steps

This guide will walk you through making your first API calls and exploring the multi-tenant system.

## Prerequisites

- API is running (see [Quick Start](./quick-start.md))
- Sample data seeded (run `npm run prisma:seed`)

## Option 1: Using Swagger UI (Recommended for Beginners)

Swagger provides an interactive interface to explore and test the API.

### 1. Open Swagger

Visit: http://localhost:3000/swagger

### 2. Register a New User

1. Find `POST /auth/register` endpoint
2. Click "Try it out"
3. Use this request body:

```json
{
  "email": "john@example.com",
  "password": "MySecure123!",
  "firstName": "John",
  "lastName": "Doe",
  "tenantName": "My Company"
}
```

4. Click "Execute"
5. You should receive:
   - `accessToken` (JWT for authentication)
   - `refreshToken` (for renewing expired access tokens)
   - User information
   - Tenant information

**Copy the `accessToken`** - you'll need it for subsequent requests.

### 3. Authorize with Your Token

1. Click the green **"Authorize"** button at the top of Swagger
2. Enter: `Bearer YOUR_ACCESS_TOKEN`
3. Click "Authorize"
4. Click "Close"

All subsequent requests will now include your authentication token.

### 4. Get Your Profile

1. Find `GET /users/me` endpoint
2. Click "Try it out"
3. Click "Execute"

You should see your user profile with:
- Your personal information
- List of tenants you belong to
- Your active tenant

### 5. Create an Item

Let's create a tenant-scoped resource:

1. Find `POST /items` endpoint
2. Click "Try it out"
3. Use this request body:

```json
{
  "name": "My First Item",
  "description": "This item is automatically scoped to my active tenant"
}
```

4. Click "Execute"

Notice: You don't need to specify `tenantId` - it's automatically set from your JWT token.

### 6. List Your Items

1. Find `GET /items` endpoint
2. Click "Try it out"
3. Click "Execute"

You'll only see items that belong to your active tenant (automatic tenant filtering).

### 7. Invite a User

1. Find `POST /tenants/{tenantId}/invitations` endpoint
2. Click "Try it out"
3. Enter your tenant ID (from your profile in step 4)
4. Use this request body:

```json
{
  "email": "jane@example.com",
  "role": "MEMBER"
}
```

5. Click "Execute"

An invitation email will be sent (if Mailjet is configured). Check the response for the invitation token.

## Option 2: Using cURL

If you prefer the command line:

### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "MySecure123!",
    "firstName": "John",
    "lastName": "Doe",
    "tenantName": "My Company"
  }'
```

Save the `accessToken` from the response.

### 2. Get Your Profile

```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Create an Item

```bash
curl -X POST http://localhost:3000/api/items \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Item",
    "description": "Test item"
  }'
```

### 4. List Items

```bash
curl -X GET http://localhost:3000/api/items \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Option 3: Using a REST Client (Postman, Insomnia, etc.)

### 1. Import Collection

Create a new request collection with the base URL: `http://localhost:3000/api`

### 2. Setup Authorization

Most REST clients allow you to set authorization at the collection level:
- Type: **Bearer Token**
- Token: `YOUR_ACCESS_TOKEN`

### 3. Create Requests

Follow the same endpoints as in the cURL examples above.

## Understanding Multi-Tenancy

### Active Tenant Concept

Your JWT token contains an **active tenant ID**. All operations are scoped to this tenant:

- When you create resources (items, etc.), they belong to your active tenant
- When you query data, you only see your active tenant's data
- Other users in different tenants cannot access your data

### Switching Tenants

If you belong to multiple tenants, you can switch the active one:

```bash
POST /users/switch-tenant
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "tenantId": "uuid-of-another-tenant"
}
```

You'll receive a new JWT with the new active tenant.

### Tenant Isolation

Try this experiment:

1. Register User A with "Company A"
2. Register User B with "Company B"
3. User A creates an item
4. User B tries to list items
5. User B will see **zero items** - complete isolation!

## Role-Based Access Control

The system has three roles:

| Role | Permissions |
|------|-------------|
| **OWNER** | Full control, cannot be removed, one per tenant |
| **ADMIN** | Can invite users, manage members, update tenant |
| **MEMBER** | Basic access to tenant data |

### Testing Permissions

1. Login as the seeded admin user:
   ```json
   {
     "email": "admin@example.com",
     "password": "password123"
   }
   ```

2. Try to invite a user (should work - OWNER role)

3. Login as the seeded regular user:
   ```json
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

4. Try to invite a user (should fail - MEMBER role doesn't have permission)

## Token Lifecycle

### Access Token Expiration

Access tokens expire after 7 days (configurable). When expired, you'll receive:

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Refreshing Tokens

Use your refresh token to get new access tokens without re-authenticating:

```bash
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "YOUR_REFRESH_TOKEN"
}
```

Response includes new access and refresh tokens.

### Logout

To invalidate your refresh token:

```bash
POST /auth/logout
Authorization: Bearer YOUR_ACCESS_TOKEN
```

This prevents the refresh token from being used again (security measure).

## Exploring the Data

### Using Prisma Studio

For a visual database explorer:

```bash
npm run prisma:studio
```

Visit http://localhost:5555 to browse:
- Users
- Tenants
- TenantUser relationships
- Invitations
- Items
- Refresh tokens

This is great for understanding the data model and relationships.

## Common Workflows

### Workflow 1: Onboarding a New Organization

1. User registers with a new tenant name
2. User receives OWNER role automatically
3. User invites team members
4. Team members accept invitations
5. Owner assigns ADMIN role to managers
6. Team starts creating tenant-scoped data

### Workflow 2: Joining an Existing Organization

1. Admin invites you via email
2. You receive invitation email with token
3. You accept invitation (creates account or links existing account)
4. You receive JWT with new tenant as active tenant
5. You can now access that tenant's data

### Workflow 3: Working with Multiple Tenants

1. You belong to Tenant A and Tenant B
2. Login sets Tenant A as active
3. All operations are scoped to Tenant A
4. Switch to Tenant B using `/users/switch-tenant`
5. All operations now scoped to Tenant B

## Next Steps

Now that you've made your first API calls:

- [Explore the Architecture](../architecture/overview.md) - Understand how it works
- [API Reference](../api/overview.md) - See all available endpoints
- [Add Your First Feature](../development/adding-features.md) - Create a new module
- [Deploy to Production](../deployment/production.md) - Go live

## Need Help?

- Check the [API Documentation](../api/overview.md) for all endpoints
- See [Troubleshooting Guide](../troubleshooting.md) for common issues
- Review Swagger docs for interactive testing
- Inspect database with Prisma Studio
