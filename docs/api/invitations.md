# Invitations API

Tenant invitation management endpoints.

## Endpoints

### POST /tenants/:tenantId/invitations

Create an invitation (ADMIN/OWNER only).

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "email": "newuser@example.com",
  "role": "MEMBER"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "email": "newuser@example.com",
  "token": "invitation-token-uuid",
  "role": "MEMBER",
  "expiresAt": "2024-01-02T00:00:00Z",
  "accepted": false
}
```

**Notes**:
- Invitation valid for 24 hours
- Email sent automatically via Mailjet
- Token used in invitation link

---

### GET /tenants/:tenantId/invitations

List pending invitations (ADMIN/OWNER only).

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "role": "MEMBER",
    "expiresAt": "2024-01-02T00:00:00Z",
    "accepted": false,
    "invitedBy": {
      "id": "uuid",
      "email": "admin@example.com"
    }
  }
]
```

---

### DELETE /tenants/:tenantId/invitations/:invitationId

Cancel invitation (ADMIN/OWNER only).

**Headers**: `Authorization: Bearer {token}`

**Response** (200):
```json
{
  "message": "Invitation cancelled successfully"
}
```

---

### GET /tenants/invitations/validate/:token

Validate invitation token (public route).

**No authentication required**

**Response** (200):
```json
{
  "valid": true,
  "email": "user@example.com",
  "tenantName": "Company A",
  "role": "MEMBER",
  "expiresAt": "2024-01-02T00:00:00Z"
}
```

**Errors**:
- `400` - Invalid token
- `400` - Invitation expired
- `400` - Invitation already accepted

## Invitation Flow

1. **Admin creates invitation**: `POST /tenants/:id/invitations`
2. **Email sent** to invitee with token link
3. **Invitee validates token**: `GET /tenants/invitations/validate/:token`
4. **Invitee accepts**: `POST /auth/accept-invitation`
5. **User joins tenant** with specified role

## Related

- [Authentication API](./authentication.md) - Accept invitation endpoint
- [Tenants API](./tenants.md)
- [Architecture Guide](../architecture/multi-tenancy.md)
