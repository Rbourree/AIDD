# Authentication API

Authentication and authorization endpoints.

## Endpoints

### POST /auth/register

Register a new user and create or join a tenant.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "tenantName": "My Company"  // Optional
}
```

**Response** (201):
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "tenant": {
    "id": "uuid",
    "name": "My Company",
    "role": "OWNER"
  }
}
```

---

### POST /auth/login

Login with email and password.

**Rate Limit**: 5 requests/minute

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Errors**:
- `401` - Invalid credentials
- `429` - Too many requests

---

### POST /auth/refresh

Refresh access token using refresh token.

**Request**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response** (200):
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Errors**:
- `401` - Invalid or expired refresh token

---

### POST /auth/logout

Logout and revoke refresh tokens.

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

---

### POST /auth/accept-invitation

Accept an invitation to join a tenant.

**Request** (existing user):
```json
{
  "token": "invitation-uuid"
}
```

**Request** (new user):
```json
{
  "token": "invitation-uuid",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response** (200):
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {...},
  "tenant": {
    "id": "uuid",
    "name": "Company Name",
    "role": "MEMBER"
  }
}
```

**Errors**:
- `400` - Invalid or expired token
- `400` - Invitation already accepted

## Related

- [Authentication Architecture](../architecture/authentication.md)
- [First Steps Guide](../getting-started/first-steps.md)
