# First Steps

This guide walks you through creating your first tenant, switching contexts, and exploring the multi-tenant features of the API.

## Prerequisites

- Application running locally (see [Quick Start](./quick-start.md))
- PostgreSQL database prepared via TypeORM migrations

## Option 1: Swagger UI (Recommended)

Swagger provides an interactive interface to try endpoints quickly.

### 1. Open Swagger

Visit http://localhost:3000/swagger.

### 2. Register a Tenant Owner

1. Expand `POST /v1/auth/register`
2. Click **Try it out**
3. Use the request body below:
   ```json
   {
     "email": "owner@example.com",
     "password": "Password123!",
     "firstName": "Ada",
     "lastName": "Lovelace"
   }
   ```
4. Execute the request and copy the `accessToken` from the response

### 3. Authorise Swagger Requests

1. Click the **Authorize** button
2. Paste `Bearer YOUR_ACCESS_TOKEN`
3. Confirm to attach the token to every call

### 4. Inspect Your Profile

- Call `GET /v1/users/me`
- The response lists your user information, active tenant, and available roles

### 5. Create a Tenant-Scoped Item

1. Open `POST /v1/items`
2. Provide:
   ```json
   {
     "name": "Welcome Pack",
     "description": "Tenant-specific resource"
   }
   ```
3. Execute—`tenantId` is inferred from the JWT payload

### 6. List Items for the Tenant

- Call `GET /v1/items`
- Only items belonging to your active tenant are returned

### 7. Invite Another User

1. Fetch your tenant ID from `GET /v1/users/me`
2. Call `POST /v1/tenants/{tenantId}/invitations`
3. Use:
   ```json
   {
     "email": "member@example.com",
     "role": "MEMBER"
   }
   ```
4. The response includes an invitation token (email delivery requires Mailjet configuration)

## Option 2: Command Line (cURL)

### 1. Register

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
        "email": "owner@example.com",
        "password": "Password123!",
        "firstName": "Ada",
        "lastName": "Lovelace"
      }'
```

### 2. Login (Optional)

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
        "email": "owner@example.com",
        "password": "Password123!"
      }'
```

Save the `accessToken` from either response.

### 3. Call Protected Endpoints

```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

```bash
curl -X POST http://localhost:3000/api/v1/items \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "CLI Item",
        "description": "Created via cURL"
      }'
```

## Switching Tenants

When a user belongs to multiple tenants, request a new token scoped to a different tenant:

```bash
curl -X POST http://localhost:3000/api/v1/users/switch-tenant \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "tenantId": "<another-tenant-id>" }'
```

The response includes a fresh `accessToken` with the chosen tenant as context.

## Key Concepts Recap

- **Active Tenant**: The tenant encoded inside the JWT. All reads and writes use this tenant automatically.
- **Role-Based Access**: OWNER and ADMIN roles can invite users or manage tenants; MEMBER has read/write access to tenant data but limited management capabilities.
- **Tenant Isolation**: Every entity contains a `tenantId` column enforced through TypeORM relations and guards, preventing cross-tenant access.

Continue exploring the [API Overview](../api/overview.md) and [Multi-Tenancy architecture guide](../architecture/multi-tenancy.md) for deeper insights.
