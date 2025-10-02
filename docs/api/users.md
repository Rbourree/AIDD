# Users API

User management endpoints.

## Endpoints

### GET /users/me

Get current user profile.

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "tenants": [
    {
      "id": "uuid",
      "name": "Company A",
      "role": "OWNER"
    }
  ]
}
```

---

### GET /users/me/tenants

List all tenants user belongs to.

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
{
  "tenants": [
    { "id": "uuid-1", "name": "Company A", "role": "OWNER" },
    { "id": "uuid-2", "name": "Company B", "role": "MEMBER" }
  ]
}
```

---

### POST /users/switch-tenant

Switch active tenant (generates new JWT).

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "tenantId": "uuid"
}
```

**Response** (200):
```json
{
  "accessToken": "eyJhbGc...",  // New token with new tenantId
  "refreshToken": "eyJhbGc..."
}
```

**Errors**:
- `403` - User doesn't have access to tenant

---

### PATCH /users/:id/password

Change user password.

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!"
}
```

**Response** (200):
```json
{
  "message": "Password updated successfully"
}
```

---

### GET /users

List all users (paginated).

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 10, max: 100)

**Response** (200):
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

---

### GET /users/:id

Get user by ID.

**Headers**: `Authorization: Bearer {token}`

---

### PATCH /users/:id

Update user.

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "firstName": "John",
  "lastName": "Doe"
}
```

---

### DELETE /users/:id

Delete user.

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
{
  "message": "User deleted successfully"
}
```

## Related

- [Multi-Tenancy Guide](../architecture/multi-tenancy.md)
- [First Steps](../getting-started/first-steps.md)
