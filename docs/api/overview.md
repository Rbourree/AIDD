# API Overview

Complete reference for the NestJS Multi-Tenant API endpoints.

## Base URL

- **Local Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Interactive Documentation

Swagger UI is available at `/swagger`:

- **Local**: http://localhost:3000/swagger
- **Production**: https://your-domain.com/swagger

## Authentication

Most endpoints require authentication via JWT tokens.

### Adding Authorization Header

```
Authorization: Bearer {your_access_token}
```

### Public Endpoints

The following endpoints don't require authentication:
- `GET /health` - Health check
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh
- `GET /tenants/invitations/validate/:token` - Validate invitation

All other endpoints require a valid JWT.

## API Conventions

### HTTP Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `GET` | Retrieve resources | `GET /items` |
| `POST` | Create resources | `POST /items` |
| `PATCH` | Partial update | `PATCH /items/:id` |
| `DELETE` | Delete resources | `DELETE /items/:id` |

### Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| `200` | OK | Successful GET, PATCH, DELETE |
| `201` | Created | Successful POST |
| `400` | Bad Request | Invalid input data |
| `401` | Unauthorized | Missing or invalid JWT |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |

### Request Headers

```http
Content-Type: application/json
Authorization: Bearer {token}
```

### Response Format

#### Success Response

```json
{
  "id": "uuid",
  "name": "Item name",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Error Response

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Pagination

Endpoints that return lists support pagination:

```http
GET /items?page=1&limit=10
```

**Query Parameters**:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

**Response**:
```json
{
  "data": [...],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Filtering

Some endpoints support filtering:

```http
GET /items?name=search&sort=createdAt:desc
```

### Timestamps

All timestamps are in ISO 8601 format (UTC):

```
2024-01-01T12:30:45.123Z
```

## Rate Limiting

### Global Rate Limit

- **Limit**: 100 requests per minute
- **Scope**: Per IP address

### Auth Endpoint Rate Limit

- **Limit**: 5 requests per minute
- **Endpoints**: `/auth/login`, `/auth/register`
- **Scope**: Per IP address

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Tenant Scoping

Most resources are automatically scoped to the active tenant in your JWT:

- ✅ **Automatic**: Resources filtered by `tenantId` from JWT
- ✅ **Isolation**: You only see your tenant's data
- ✅ **Security**: Cannot access other tenants' data

To switch active tenant, use:

```http
POST /users/switch-tenant
{
  "tenantId": "new-tenant-uuid"
}
```

## API Endpoints

### Authentication

See [Authentication API](./authentication.md)

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and revoke tokens
- `POST /auth/accept-invitation` - Accept invitation

### Users

See [Users API](./users.md)

- `GET /users/me` - Get current user
- `GET /users/me/tenants` - List user's tenants
- `POST /users/switch-tenant` - Switch active tenant
- `PATCH /users/:id/password` - Change password
- `GET /users` - List users (paginated)
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Tenants

See [Tenants API](./tenants.md)

- `POST /tenants` - Create tenant
- `GET /tenants` - List user's tenants
- `GET /tenants/:id` - Get tenant details
- `PATCH /tenants/:id` - Update tenant
- `DELETE /tenants/:id` - Delete tenant
- `GET /tenants/:id/users` - List tenant users
- `POST /tenants/:id/users` - Add user to tenant
- `PATCH /tenants/:id/users/:userId/role` - Update user role
- `DELETE /tenants/:id/users/:userId` - Remove user from tenant

### Invitations

See [Invitations API](./invitations.md)

- `POST /tenants/:id/invitations` - Create invitation
- `GET /tenants/:id/invitations` - List pending invitations
- `DELETE /tenants/:id/invitations/:invId` - Cancel invitation
- `GET /tenants/invitations/validate/:token` - Validate token (public)

### Items (Example)

- `POST /items` - Create item
- `GET /items` - List items (tenant-filtered)
- `GET /items/:id` - Get item by ID
- `PATCH /items/:id` - Update item
- `DELETE /items/:id` - Delete item

### Health

- `GET /health` - Health check (public)

## Example Requests

### cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Get profile (with token)
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create item
curl -X POST http://localhost:3000/api/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Item","description":"Test"}'
```

### JavaScript (fetch)

```javascript
// Login
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'password123',
  }),
});

const { accessToken } = await response.json();

// Get profile
const profile = await fetch('http://localhost:3000/api/users/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

## Error Handling

### Validation Errors

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

### Authentication Errors

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Authorization Errors

```json
{
  "statusCode": 403,
  "message": "You do not have access to this resource"
}
```

### Not Found Errors

```json
{
  "statusCode": 404,
  "message": "Item 'abc123' not found"
}
```

## Testing with Swagger

1. Visit http://localhost:3000/swagger
2. Click "Try it out" on any endpoint
3. For protected endpoints:
   - First call `POST /auth/login`
   - Copy the `accessToken`
   - Click green "Authorize" button
   - Enter: `Bearer YOUR_TOKEN`
   - Click "Authorize"
4. All requests now include your token

## Best Practices

1. ✅ **Always use HTTPS in production**
2. ✅ **Store tokens securely** (not in localStorage for sensitive apps)
3. ✅ **Refresh tokens before expiry** (proactive refresh)
4. ✅ **Handle rate limits** (implement backoff)
5. ✅ **Validate responses** (check status codes)
6. ✅ **Log errors** (for debugging)
7. ✅ **Use environment variables** (for API URLs)

## Related Documentation

- [Authentication API](./authentication.md) - Auth endpoints
- [Users API](./users.md) - User endpoints
- [Tenants API](./tenants.md) - Tenant endpoints
- [Invitations API](./invitations.md) - Invitation endpoints
- [First Steps Guide](../getting-started/first-steps.md) - Getting started
