# Tenants API

Tenant management endpoints.

## Endpoints

### POST /tenants

Create a new tenant.

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "name": "My New Company"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "name": "My New Company",
  "slug": "my-new-company",
  "role": "OWNER"
}
```

---

### GET /tenants

List all tenants user belongs to.

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
[
  {
    "id": "uuid",
    "name": "Company A",
    "slug": "company-a",
    "role": "OWNER"
  }
]
```

---

### GET /tenants/:id

Get tenant details.

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
{
  "id": "uuid",
  "name": "Company A",
  "slug": "company-a",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### PATCH /tenants/:id

Update tenant (ADMIN/OWNER only).

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "name": "Updated Company Name"
}
```

---

### DELETE /tenants/:id

Delete tenant (OWNER only).

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
{
  "message": "Tenant deleted successfully"
}
```

---

### GET /tenants/:id/users

List all users in tenant.

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
[
  {
    "userId": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "OWNER"
  }
]
```

---

### POST /tenants/:id/users

Add existing user to tenant (ADMIN/OWNER only).

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "userId": "uuid",
  "role": "MEMBER"
}
```

---

### PATCH /tenants/:tenantId/users/:userId/role

Update user role in tenant (ADMIN/OWNER only).

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "role": "ADMIN"
}
```

**Note**: Cannot change OWNER role.

---

### DELETE /tenants/:tenantId/users/:userId

Remove user from tenant (ADMIN/OWNER only).

**Headers**: `Authorization: Bearer {token}`

**Note**: Cannot remove OWNER.

## Related

- [Invitations API](./invitations.md)
- [Multi-Tenancy Guide](../architecture/multi-tenancy.md)
