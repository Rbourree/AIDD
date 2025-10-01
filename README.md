<div align="center">

# 🚀 NestJS Multi-Tenant API Boilerplate

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-10.0-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5.1-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-5.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-15+-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

<p align="center">
  <strong>A production-ready NestJS boilerplate with multi-tenant architecture, comprehensive security, and enterprise-grade integrations</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-api-documentation">API</a> •
  <a href="#-deployment">Deployment</a>
</p>

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🏢 Multi-Tenancy
- Complete tenant isolation
- Role-based access control (OWNER/ADMIN/MEMBER)
- Tenant switching with JWT context
- Automatic data filtering per tenant

### 🔐 Security & Authentication
- JWT authentication with refresh tokens
- Bcrypt password hashing (12 rounds)
- Refresh token revocation system
- Strong password validation
- Rate limiting (global + auth-specific)
- Helmet security headers
- CORS configuration

</td>
<td width="50%">

### 🛠️ Enterprise Integrations
- **Sentry** - Error tracking & performance monitoring
- **Mailjet** - Email service for invitations
- **Yousign** - Electronic signature (eIDAS)
- **AR24** - Registered mail service

### 🚀 Developer Experience
- TypeScript 5.1+ strict mode
- Repository pattern with Prisma
- Auto-generated Swagger documentation
- Hot-reload development
- ESLint + Prettier + Husky
- Docker Compose setup

</td>
</tr>
</table>

---

## 📋 Prerequisites

| Tool | Version | Required |
|------|---------|----------|
| Node.js | 18+ | ✅ |
| npm | 9+ | ✅ |
| PostgreSQL | 15+ | ✅ |
| Docker | 24+ | ⭕ Optional |

---

## ⚡ Quick Start

### 1️⃣ Clone & Install

```bash
git clone <repository-url>
cd nestjs-api
npm install
```

### 2️⃣ Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

<details>
<summary>📄 View Environment Variables</summary>

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestjs_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRATION=30d

# Application
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001

# Mailjet (Email Service)
MAILJET_API_KEY=your-mailjet-api-key
MAILJET_SECRET_KEY=your-mailjet-secret-key
MAILJET_SENDER_EMAIL=noreply@yourdomain.com
MAILJET_SENDER_NAME=Your App Name
INVITATION_BASE_URL=http://localhost:3001/accept-invitation

# Sentry (Error Tracking)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_RELEASE=nestjs-api@1.0.0
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_PROFILES_SAMPLE_RATE=0.0

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Yousign (Electronic Signature)
YOUSIGN_API_KEY=
YOUSIGN_ENVIRONMENT=sandbox

# AR24 (Registered Mail)
AR24_TOKEN=
AR24_PRIVATE_KEY=
AR24_ENVIRONMENT=sandbox
```

</details>

### 3️⃣ Setup Database

```bash
# Start PostgreSQL with Docker
npm run docker:up

# Run migrations
npm run prisma:migrate
npm run prisma:generate

# Seed sample data (optional)
npm run prisma:seed
```

### 4️⃣ Launch Application

```bash
# Development mode with hot-reload
npm run start:dev

# Production mode
npm run build && npm run start:prod
```

### 5️⃣ Access Services

<table>
<tr>
<th>Service</th>
<th>URL</th>
<th>Description</th>
</tr>
<tr>
<td>🌐 API</td>
<td><code>http://localhost:3000/api</code></td>
<td>Main API endpoint</td>
</tr>
<tr>
<td>📚 Swagger</td>
<td><code>http://localhost:3000/api/docs</code></td>
<td>Interactive API documentation</td>
</tr>
<tr>
<td>💚 Health</td>
<td><code>http://localhost:3000/health</code></td>
<td>Application health check</td>
</tr>
<tr>
<td>🗄️ Prisma Studio</td>
<td><code>npm run prisma:studio</code></td>
<td>Database GUI</td>
</tr>
</table>

---

## 🏗️ Architecture

### Repository Pattern Structure

```
src/
├── 📁 common/                      # Shared resources
│   ├── decorators/                # @Public, @Roles, @CurrentUser
│   ├── filters/                   # HttpExceptionFilter (Sentry integration)
│   ├── guards/                    # JwtAuthGuard, TenantRoleGuard, AuthThrottlerGuard
│   ├── interceptors/              # SentryInterceptor, TenantFilterInterceptor
│   ├── validators/                # @IsStrongPassword
│   └── services/
│       ├── mail/                  # MailService (Mailjet)
│       ├── yousign/               # YousignService (e-signature)
│       └── ar24/                  # Ar24Service (registered mail)
│
├── 📁 config/                      # Configuration
│   ├── configuration.ts           # Environment config
│   ├── validation.schema.ts       # Joi validation
│   └── config.module.ts
│
├── 📁 database/                    # Database layer
│   ├── prisma.service.ts
│   └── database.module.ts
│
├── 📁 modules/
│   ├── auth/                      # Authentication
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── strategies/            # JWT strategy
│   │   ├── repositories/          # RefreshTokenRepository
│   │   ├── entities/
│   │   ├── dto/
│   │   └── exceptions/
│   │
│   ├── users/                     # User management
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/          # UserRepository
│   │   ├── mappers/               # UserMapper
│   │   ├── entities/
│   │   └── dto/
│   │
│   ├── tenants/                   # Tenant + Invitations
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/          # TenantRepository, InvitationRepository
│   │   ├── mappers/
│   │   ├── entities/
│   │   └── dto/
│   │
│   ├── items/                     # Sample module (tenant-scoped)
│   └── health/                    # Health checks
│
├── app.module.ts
└── main.ts
```

### Key Architectural Principles

<table>
<tr>
<td width="50%">

#### ✅ Repository Pattern
- Prisma isolated in repositories only
- Services use repositories, never PrismaService
- Clean separation of concerns
- Easy to test and maintain

</td>
<td width="50%">

#### ✅ Entity/Mapper Pattern
- Prisma models → Internal entities
- Mappers convert between layers
- Consistent API responses
- Type safety throughout

</td>
</tr>
<tr>
<td width="50%">

#### ✅ Exception Handling
- Custom exceptions per module
- Automatic Sentry capture
- Sanitized error responses
- Filtered sensitive data

</td>
<td width="50%">

#### ✅ Security Layers
- JWT validation on every request
- Tenant validation in strategy
- Role guards per endpoint
- Rate limiting on auth routes

</td>
</tr>
</table>

---

## 🔐 Authentication & Multi-Tenancy

### JWT Payload Structure

```typescript
interface JwtPayload {
  sub: string;        // User ID
  tenantId: string;   // Active tenant ID
  email?: string;     // User email
  iat?: number;       // Issued at
  exp?: number;       // Expiration
}
```

### Authentication Flow

```mermaid
graph LR
    A[Login] --> B[Validate Credentials]
    B --> C[Generate JWT + Refresh Token]
    C --> D[Store Refresh Token in DB]
    D --> E[Return Tokens]
    E --> F[Use Access Token]
    F --> G{Token Expired?}
    G -->|Yes| H[Use Refresh Token]
    G -->|No| F
    H --> I{Valid & Not Revoked?}
    I -->|Yes| C
    I -->|No| A
```

### Security Features

| Feature | Implementation | Status |
|---------|---------------|--------|
| Password Hashing | Bcrypt (12 rounds) | ✅ |
| Password Strength | 8+ chars, upper/lower/number/special | ✅ |
| Token Refresh | Database-backed with SHA-256 | ✅ |
| Token Revocation | Logout blacklist system | ✅ |
| Rate Limiting | 5 req/min on auth endpoints | ✅ |
| Global Rate Limit | 100 req/min per IP | ✅ |
| JWT Validation | User + Tenant existence check | ✅ |
| Tenant Isolation | Automatic filtering per request | ✅ |

### Multi-Tenant System

#### 🔹 Active Tenant Concept

- Users can belong to **multiple tenants**
- Only **ONE tenant active** at a time (in JWT)
- All operations scoped to active tenant
- Switch tenants anytime via API

#### 🔹 Tenant Switching

```http
POST /api/users/switch-tenant
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "tenantId": "uuid-of-target-tenant"
}
```

**Response**: New JWT with new active `tenantId`

#### 🔹 Roles & Permissions

| Role | Permissions |
|------|------------|
| 👑 **OWNER** | Full control, cannot be removed, one per tenant |
| 🛡️ **ADMIN** | Manage users, invitations, update tenant settings |
| 👤 **MEMBER** | Access tenant data, no admin privileges |

---

## 🌐 Integrations

### 📧 Mailjet (Email Service)

Send transactional emails via Mailjet API v3.1:

```typescript
// Automatic invitation emails
await this.mailService.sendInvitationEmail({
  toEmail: 'user@example.com',
  toName: 'John Doe',
  invitationLink: 'https://...',
  tenantName: 'Acme Corp',
  inviterName: 'Admin User',
});
```

**Features**:
- Invitation system with 24h token expiry
- HTML email templates
- API Key + Secret Key authentication
- Transactional email tracking
- Sender verification required

### 📝 Yousign (Electronic Signature)

eIDAS-compliant electronic signatures:

```typescript
// 1. Create signature request
const request = await yousignService.createSignatureRequest({
  name: 'Contract 2024',
  deliveryMode: SignatureRequestDeliveryMode.EMAIL,
});

// 2. Upload document
const doc = await yousignService.uploadDocument(request.id, {
  file: pdfBuffer,
  filename: 'contract.pdf',
  nature: DocumentNature.SIGNABLE_DOCUMENT,
});

// 3. Add signer
await yousignService.addSigner(request.id, {
  info: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  signatureLevel: SignatureLevel.ELECTRONIC_SIGNATURE,
  fields: [{ documentId: doc.id, type: SignatureFieldType.SIGNATURE, page: 1, x: 200, y: 400 }],
});

// 4. Activate
await yousignService.activateSignatureRequest(request.id);
```

### 📮 AR24 (Registered Mail)

Send legally-binding registered emails:

```typescript
// Send registered mail with proof
const mail = await ar24Service.sendMail({
  idUser: userId,
  recipient: {
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com',
    type: RecipientType.PROFESSIONAL,
  },
  subject: 'Legal Notice',
  message: 'This is a registered email',
  eidas: true, // eIDAS certification
});

// Download legal proofs
const proofAr = await ar24Service.downloadProof(mail.id, 'ar'); // Receipt proof
const proofEv = await ar24Service.downloadProof(mail.id, 'ev'); // Presentation proof
```

**Proof Types**:
- `ev` - Initial presentation
- `ar` - Receipt (Accusé de Réception)
- `ng` - Negligence
- `rf` - Refusal

### 🐛 Sentry (Error Tracking)

Comprehensive error monitoring:

**Automatic Capture**:
- ✅ All 5xx server errors
- ✅ Critical auth errors (401, 403)
- ✅ Unhandled exceptions
- ❌ Validation errors (filtered)

**Enriched Context**:
- User ID, email, tenant ID
- Request metadata (method, URL, query)
- Custom tags (endpoint, tenant, role)
- Breadcrumbs for request flow

**Privacy**:
- Sensitive headers removed
- Passwords/tokens redacted
- SHA-256 hashing for tokens

**Configuration**:
```bash
SENTRY_DSN=https://...@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% in prod, 100% in dev
```

---

## 📡 API Documentation

### Authentication Endpoints

<details>
<summary><code>POST /api/auth/register</code> - Register new user</summary>

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "tenantName": "Acme Corp"
}
```

**Response**: JWT tokens + user info

</details>

<details>
<summary><code>POST /api/auth/login</code> - Login user</summary>

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response**: JWT tokens
**Rate Limit**: 5 requests/minute

</details>

<details>
<summary><code>POST /api/auth/refresh</code> - Refresh access token</summary>

```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response**: New JWT tokens

</details>

<details>
<summary><code>POST /api/auth/logout</code> - Logout (revoke refresh token)</summary>

**Headers**: `Authorization: Bearer {token}`

**Response**: Success message

</details>

<details>
<summary><code>POST /api/auth/accept-invitation</code> - Accept invitation</summary>

```json
{
  "token": "uuid-invitation-token",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response**: JWT tokens (existing or new user)

</details>

### User Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/users/me` | Get current user profile | ✅ |
| `GET` | `/api/users/me/tenants` | List user's tenants | ✅ |
| `POST` | `/api/users/switch-tenant` | Switch active tenant | ✅ |
| `GET` | `/api/users?page=1&limit=10` | List all users (paginated) | ✅ |
| `GET` | `/api/users/:id` | Get user by ID | ✅ |
| `PATCH` | `/api/users/:id` | Update user | ✅ |
| `DELETE` | `/api/users/:id` | Delete user | ✅ |
| `PATCH` | `/api/users/:id/password` | Change password | ✅ |

### Tenant Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/api/tenants` | Create new tenant | Any |
| `GET` | `/api/tenants` | List user's tenants | Any |
| `GET` | `/api/tenants/:id` | Get tenant details | Any |
| `PATCH` | `/api/tenants/:id` | Update tenant | ADMIN/OWNER |
| `DELETE` | `/api/tenants/:id` | Delete tenant | OWNER |
| `GET` | `/api/tenants/:id/users` | List tenant users | Any |
| `POST` | `/api/tenants/:id/users` | Add user to tenant | ADMIN/OWNER |
| `PATCH` | `/api/tenants/:id/users/:userId` | Update user role | ADMIN/OWNER |
| `DELETE` | `/api/tenants/:id/users/:userId` | Remove user | ADMIN/OWNER |

### Invitation Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/api/tenants/:id/invitations` | Create invitation | ADMIN/OWNER |
| `GET` | `/api/tenants/:id/invitations` | List pending invitations | ADMIN/OWNER |
| `DELETE` | `/api/tenants/:id/invitations/:invId` | Cancel invitation | ADMIN/OWNER |
| `GET` | `/api/tenants/invitations/validate/:token` | Validate token | Public |

### Full API Documentation

**Interactive Swagger UI**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

---

## 🗄️ Database Schema

```sql
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│      User       │         │   TenantUser    │         │     Tenant      │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ id (PK)         │◄───────┤ userId (FK)     │         │ id (PK)         │
│ email (unique)  │         │ tenantId (FK)   ├────────►│ name            │
│ password        │         │ role (enum)     │         │ slug (unique)   │
│ firstName       │         │ createdAt       │         │ createdAt       │
│ lastName        │         │ updatedAt       │         │ updatedAt       │
│ createdAt       │         └─────────────────┘         └─────────────────┘
│ updatedAt       │                                              │
└─────────────────┘                                              │
                                                                 │
┌─────────────────┐         ┌─────────────────┐                │
│   Invitation    │         │  RefreshToken   │                │
├─────────────────┤         ├─────────────────┤                │
│ id (PK)         │         │ id (PK)         │                │
│ email           │         │ userId (FK)     │                │
│ token (unique)  │         │ token (SHA-256) │                │
│ role            │         │ expiresAt       │                │
│ expiresAt       │         │ revoked         │                │
│ accepted        │         │ createdAt       │                │
│ tenantId (FK)   ├────────►│ updatedAt       │                │
│ invitedBy (FK)  │         └─────────────────┘                │
│ createdAt       │                                             │
│ updatedAt       │         ┌─────────────────┐                │
└─────────────────┘         │      Item       │                │
                            ├─────────────────┤                │
                            │ id (PK)         │                │
                            │ name            │                │
                            │ description     │                │
                            │ tenantId (FK)   ├───────────────►│
                            │ createdAt       │
                            │ updatedAt       │
                            └─────────────────┘
```

### Models Overview

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `User` | User accounts | email (unique), password (hashed), firstName, lastName |
| `Tenant` | Organizations | name, slug (unique) |
| `TenantUser` | User-Tenant relationship | userId, tenantId, role (OWNER/ADMIN/MEMBER) |
| `Invitation` | Pending invitations | email, token (UUID), role, expiresAt (24h), tenantId |
| `RefreshToken` | Token management | userId, token (SHA-256), expiresAt, revoked |
| `Item` | Sample tenant data | name, description, tenantId |

---

## 🐳 Deployment

### Docker Development

```bash
# Start all services
npm run docker:up

# View logs
docker-compose logs -f

# Stop services
npm run docker:down
```

### Docker Production Build

```bash
# Build image
docker build -t nestjs-api:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  nestjs-api:latest
```

### Environment-Specific Configuration

<details>
<summary>🔧 Production Environment Variables</summary>

```bash
# Application
NODE_ENV=production
PORT=3000

# Database (use connection pooling)
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=10

# JWT (use strong secrets)
JWT_SECRET=<generate-with-openssl-rand-base64-32>
REFRESH_TOKEN_SECRET=<generate-with-openssl-rand-base64-32>

# CORS (restrict to your domain)
CORS_ORIGIN=https://yourdomain.com

# Sentry (enable monitoring)
SENTRY_DSN=https://...@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% sampling in production

# Rate Limiting (adjust based on traffic)
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

</details>

### Prisma Migrations in Production

```bash
# Run migrations
npm run prisma:migrate:prod

# Generate Prisma Client
npm run prisma:generate
```

---

## 🛠️ Development Tools

### NPM Scripts

```bash
# Development
npm run start:dev          # Hot-reload development server
npm run start:debug        # Debug mode with inspector

# Production
npm run build              # Compile TypeScript to JavaScript
npm run start:prod         # Run production build

# Database
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Create and apply migrations
npm run prisma:migrate:prod # Production migrations
npm run prisma:seed        # Seed database with sample data
npm run prisma:studio      # Open Prisma Studio (database GUI)

# Docker
npm run docker:up          # Start PostgreSQL container
npm run docker:down        # Stop containers

# Code Quality
npm run lint               # ESLint auto-fix
npm run format             # Prettier formatting
npm run prepare            # Setup Husky git hooks
```

### Seed Data

After running `npm run prisma:seed`, you'll have:

| User | Email | Password | Role | Tenant |
|------|-------|----------|------|--------|
| Admin | admin@example.com | password123 | OWNER | Acme Corp |
| User | user@example.com | password123 | MEMBER | Acme Corp |

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

---

## 🔒 Security Checklist

| Category | Item | Status |
|----------|------|--------|
| **Authentication** | JWT with refresh tokens | ✅ |
| | Token revocation system | ✅ |
| | Password strength validation | ✅ |
| | Bcrypt hashing (12 rounds) | ✅ |
| **Authorization** | Role-based access control | ✅ |
| | Tenant isolation | ✅ |
| | JWT tenant validation | ✅ |
| **Rate Limiting** | Global throttling | ✅ |
| | Auth endpoint limiting (5/min) | ✅ |
| **Data Protection** | Input validation | ✅ |
| | SQL injection prevention (Prisma) | ✅ |
| | XSS prevention (validation) | ✅ |
| | Sensitive data filtering (Sentry) | ✅ |
| **Headers** | Helmet security headers | ✅ |
| | CORS configuration | ✅ |
| **Monitoring** | Sentry error tracking | ✅ |
| | Performance monitoring | ✅ |

---

## 🐛 Troubleshooting

<details>
<summary>❌ Database connection failed</summary>

**Check**:
1. PostgreSQL is running: `docker ps` or `pg_isready`
2. DATABASE_URL is correct in `.env`
3. Database exists: `psql -U postgres -l`
4. Firewall allows port 5432

**Fix**:
```bash
npm run docker:up
npm run prisma:migrate
```

</details>

<details>
<summary>❌ Prisma Client not generated</summary>

**Error**: `@prisma/client` not found

**Fix**:
```bash
npm run prisma:generate
```

</details>

<details>
<summary>❌ Migration conflicts</summary>

**Error**: Migration failed, schema out of sync

**Fix**:
```bash
# Development (destructive)
npx prisma migrate reset

# Production (safe)
npx prisma migrate resolve --applied <migration-name>
```

</details>

<details>
<summary>❌ Email sending fails</summary>

**Check**:
1. Mailjet API Key and Secret Key are valid
2. Sender email is verified in Mailjet dashboard
3. API credentials have transactional email permissions

**Test**:
```bash
curl -X POST https://api.mailjet.com/v3.1/send \
  -u "YOUR_API_KEY:YOUR_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"Messages":[{"From":{"Email":"test@domain.com","Name":"Test"},"To":[{"Email":"recipient@domain.com"}],"Subject":"Test","HTMLPart":"<p>Test</p>"}]}'
```

</details>

<details>
<summary>❌ JWT errors (401 Unauthorized)</summary>

**Common causes**:
1. Token expired (refresh it)
2. Invalid JWT_SECRET in `.env`
3. User or tenant no longer exists
4. Token revoked (user logged out)

**Check JWT**:
```bash
# Decode JWT at https://jwt.io
# Verify `sub` (userId) and `tenantId` exist in database
```

</details>

---

## 📚 Additional Resources

| Resource | Link | Description |
|----------|------|-------------|
| 🌐 **NestJS Docs** | [docs.nestjs.com](https://docs.nestjs.com) | Official NestJS documentation |
| 🗄️ **Prisma Docs** | [prisma.io/docs](https://www.prisma.io/docs) | Prisma ORM guide |
| 📧 **Mailjet API** | [dev.mailjet.com](https://dev.mailjet.com) | Email API reference |
| 📝 **Yousign API** | [developers.yousign.com](https://developers.yousign.com) | E-signature API |
| 📮 **AR24 API** | [developers.ar24.fr](https://developers.ar24.fr) | Registered mail API |
| 🐛 **Sentry Docs** | [docs.sentry.io](https://docs.sentry.io) | Error tracking setup |

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

**Code Standards**:
- Follow ESLint + Prettier rules
- Write descriptive commit messages
- Add tests for new features
- Update documentation

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

- 🐛 **Bug reports**: [Open an issue](https://github.com/your-repo/issues)
- 💡 **Feature requests**: [Start a discussion](https://github.com/your-repo/discussions)
- 📧 **Email**: support@yourdomain.com

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Built with ❤️ using NestJS, Prisma, TypeScript**

<p>
  <a href="https://nestjs.com">
    <img src="https://img.shields.io/badge/Powered%20by-NestJS-E0234E?style=flat-square&logo=nestjs" alt="NestJS" />
  </a>
  <a href="https://www.typescriptlang.org">
    <img src="https://img.shields.io/badge/Written%20in-TypeScript-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  </a>
  <a href="https://www.prisma.io">
    <img src="https://img.shields.io/badge/ORM-Prisma-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  </a>
</p>

</div>
