# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup & Database
- `npm install` - Install dependencies
- `npm run docker:up` - Start PostgreSQL in Docker
- `npm run docker:down` - Stop Docker containers
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations (dev)
- `npm run prisma:migrate:prod` - Deploy migrations (production)
- `npm run prisma:seed` - Seed database with sample data
- `npm run prisma:studio` - Open Prisma Studio GUI

### Development
- `npm run start:dev` - Start in watch mode (recommended)
- `npm run start:debug` - Start in debug mode
- `npm run build` - Build production bundle
- `npm run start:prod` - Start production server

### Code Quality
- `npm run lint` - Lint and auto-fix TypeScript files
- `npm run format` - Format code with Prettier

## Architecture Overview

### Multi-Tenancy System

This is a **NestJS-based multi-tenant API** with complete isolation between tenants. The architecture enforces tenant boundaries through:

**JWT Token Pattern**: Every JWT includes both `sub` (userId) and `tenantId`. This binds each request to a specific tenant context.

**Database Schema**: Uses a `TenantUser` join table to create many-to-many relationships between Users and Tenants, with role assignments per tenant. Each tenant has its own isolated data through foreign key relationships.

**Tenant Isolation Mechanisms**:
1. `TenantFilterInterceptor` (src/common/interceptors/tenant-filter.interceptor.ts) - Attaches `tenantId` from JWT to request object
2. `TenantRoleGuard` (src/common/guards/tenant-role.guard.ts) - Validates user has required role in specific tenant
3. Services manually filter by `tenantId` from JWT payload (see pattern in items.service.ts, tenants.service.ts)

**Important**: When implementing new features that store tenant-specific data:
- Add `tenantId` field to the Prisma model
- Always filter database queries by `request.user.tenantId` or `user.tenantId` from JWT
- Use `@UseGuards(JwtAuthGuard, TenantRoleGuard)` and `@Roles()` decorator for role-based access

### Authentication Flow

**Registration** (src/modules/auth/auth.service.ts):
- Creates new User and either joins existing Tenant or creates new one
- New tenants automatically assign user as OWNER role
- Passwords hashed with bcrypt (12 rounds)
- Returns JWT tokens with first tenant as active context
- Refresh token stored in database with expiration

**Login** (src/modules/auth/auth.service.ts):
- Validates credentials with bcrypt (12 rounds)
- Uses first tenant in user's tenant list as active tenant
- Returns JWT tokens with tenantId embedded
- Rate limited: 5 requests/minute via AuthThrottlerGuard

**Token Refresh** (src/modules/auth/auth.service.ts):
- Validates JWT signature and expiration
- Checks token in database (not revoked)
- Preserves tenantId from original token
- Returns new token pair

**Logout** (POST /auth/logout):
- Revokes refresh token in database
- Prevents reuse of compromised tokens

**JWT Strategy Validation** (src/modules/auth/strategies/jwt.strategy.ts):
- Verifies user exists via UserRepository
- Validates user still has access to tenant (checks TenantUser relationship)
- Throws UnauthorizedException if tenant deleted or access revoked

**Password Requirements**:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Enforced via `@IsStrongPassword()` decorator

**Tenant Switching** (src/modules/users/users.service.ts): Users can switch active tenant via `/users/switch-tenant` endpoint, which generates new JWT with different tenantId

### Invitation System

All invitation logic is contained within the **Tenants module** (no separate Invitations module).

**API Endpoints**:
- `POST /tenants/:tenantId/invitations` - Create invitation (OWNER/ADMIN only)
- `GET /tenants/:tenantId/invitations` - List pending invitations (OWNER/ADMIN only)
- `DELETE /tenants/:tenantId/invitations/:id` - Cancel invitation (OWNER/ADMIN only)
- `GET /tenants/invitations/validate/:token` - Validate invitation token (public route)

**Creation Flow** (src/modules/tenants/services/tenants.service.ts):
1. Only OWNER/ADMIN can create invitations
2. Generates UUID token, sets 24h expiration
3. Sends email via Mailjet (MailService)
4. If email fails, invitation is rolled back

**Acceptance Flow** (src/modules/auth/services/auth.service.ts):
1. Validates token (not expired, not accepted)
2. If user doesn't exist, creates account with provided password
3. Creates TenantUser relationship with invited role
4. Returns JWT with invitation's tenantId as active tenant

**Components** (all in `src/modules/tenants/`):
- `entities/invitation.entity.ts` - InvitationEntity with business logic (isExpired, isValid, etc.)
- `repositories/invitation.repository.ts` - InvitationRepository for data access
- `mappers/invitation.mapper.ts` - InvitationMapper for conversions
- `exceptions/invitation.exceptions.ts` - Typed exceptions

### Role-Based Access Control

**Three Roles** (prisma/schema.prisma:10-14):
- `OWNER` - Full control, cannot be changed/removed, one per tenant
- `ADMIN` - Can invite users, manage members, modify tenant
- `MEMBER` - Basic access to tenant resources

**Permission Patterns**:
- Tenant CRUD: OWNER/ADMIN for update, OWNER only for delete
- User management: OWNER/ADMIN can add/remove/update roles (cannot modify OWNER)
- Invitation management: OWNER/ADMIN can create/view/cancel
- Items (example entity): All roles can CRUD their tenant's items

**Guards Usage**:
```typescript
@UseGuards(JwtAuthGuard, TenantRoleGuard)
@Roles(TenantRole.OWNER, TenantRole.ADMIN)
```

### Module Structure

**Modules follow a layered architecture pattern** with Repository, Entity, Mapper, and Service layers:

```
src/modules/[module]/
├── controllers/        # HTTP endpoints, request/response handling
├── services/          # Business logic orchestration
├── repositories/      # Data access layer (ONLY layer that calls Prisma)
├── entities/          # Domain models with business logic methods
├── mappers/           # Conversion between Prisma models, Entities, and DTOs
├── dto/               # Data Transfer Objects for validation
├── exceptions/        # Module-specific typed exceptions
└── [module].module.ts # NestJS module configuration
```

**Layer Responsibilities**:

1. **Controllers** (`controllers/`):
   - Handle HTTP requests/responses
   - Validate input via DTOs
   - Call service methods
   - Return entities or DTOs

2. **Services** (`services/`):
   - Orchestrate business logic
   - Call repositories (NEVER Prisma directly)
   - Validate business rules
   - Throw typed exceptions
   - Work with entities

3. **Repositories** (`repositories/`):
   - **ONLY layer that interacts with Prisma**
   - Perform database queries
   - Use mappers to convert Prisma → Entities
   - Return entities or null
   - No business logic

4. **Entities** (`entities/`):
   - Domain models (classes)
   - Business logic methods (e.g., `isExpired()`, `belongsToTenant()`)
   - Separate from Prisma models
   - Type-safe

5. **Mappers** (`mappers/`):
   - `toEntity()` - Prisma Model → Entity
   - `toEntityArray()` - Prisma Model[] → Entity[]
   - `toPrismaCreate()` - CreateDTO → Prisma create input
   - `toPrismaUpdate()` - UpdateDTO → Prisma update input
   - Centralized conversion logic

6. **Exceptions** (`exceptions/`):
   - Module-specific exception classes
   - Extend NestJS exceptions (NotFoundException, BadRequestException, etc.)
   - Consistent error messages
   - Type-safe error handling

**Example Data Flow**:
```
HTTP Request
  → Controller (validates DTO)
    → Service (business logic)
      → Repository (database query via Prisma)
        → Mapper (Prisma Model → Entity)
      ← Entity
    ← Entity (business logic)
  ← Entity/DTO
HTTP Response
```

**Key Modules**:
- `auth` - Registration, login, token refresh, logout, invitation acceptance (uses Users/Tenants/RefreshToken repositories)
- `users` - User profile, password change, tenant switching
- `tenants` - Tenant CRUD, user management, invitation management (includes all invitation logic)
- `items` - Example tenant-isolated resource (reference implementation)
- `health` - Health check endpoint

**Key Services & Repositories**:
- `PrismaService` (src/database/prisma.service.ts) - Database client, injected ONLY in repositories
- `MailService` (src/common/services/mail/mail.service.ts) - Mailjet email integration
- `YousignService` (src/common/services/yousign/yousign.service.ts) - Yousign electronic signature integration
- `Ar24Service` (src/common/services/ar24/ar24.service.ts) - AR24 registered mail integration
- `UserRepository` - User data access, used by AuthService and UsersService
- `TenantRepository` - Tenant data access, includes TenantUser relationship management, used by guards
- `InvitationRepository` - Invitation data access (part of Tenants module)
- `RefreshTokenRepository` - Refresh token storage and revocation (auth module)
- `ItemRepository` - Example repository showing tenant isolation pattern

**Important Guards**:
- `JwtAuthGuard` (global) - Validates JWT on all routes except `@Public()` decorated
- `TenantRoleGuard` - Validates user has required role in tenant (uses TenantRepository)
- `AuthThrottlerGuard` - Rate limiting for auth endpoints (5 req/min)
- All guards use repositories, NEVER PrismaService directly

### Configuration

Uses `@nestjs/config` with Joi validation (src/config/validation.schema.ts). Configuration loaded from `.env` file and exposed via `ConfigService`.

**Critical Settings**:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` / `REFRESH_TOKEN_SECRET` - Must be secure in production
- `BREVO_API_KEY` - Required for invitation emails
- `INVITATION_BASE_URL` - Frontend URL for invitation links
- `YOUSIGN_API_KEY` - Yousign API key (optional, for electronic signature)
- `YOUSIGN_ENVIRONMENT` - 'sandbox' or 'production' (default: sandbox)

### API Conventions

- **Global Prefix**: All routes are prefixed with `/api`
- **Swagger**: Available at `/api/docs`, includes Bearer auth
- **Validation**: Global `ValidationPipe` with whitelist/transform
- **Error Handling**: `HttpExceptionFilter` formats all exceptions
- **Security**:
  - Helmet enabled for HTTP headers
  - CORS configured via ConfigService
  - Global rate limiting: 100 req/60s (Throttler)
  - Auth endpoints rate limiting: 5 req/60s (AuthThrottlerGuard)
  - Bcrypt password hashing (12 rounds)
  - Strong password validation enforced
  - Refresh token revocation system
  - JWT validation with tenant access check
- **Pagination**: Limited to max 100 items per page via `@Max(100)` decorator

### Testing Pattern

No tests currently in repo, but when adding:
- **Unit tests**: Mock repositories (not PrismaService), test service business logic
- **Integration tests**: Mock external services (mail), test with real database
- Test tenant isolation boundaries thoroughly
- Test role permission enforcement
- Test entity business logic methods
- Test mapper conversions

### Common Development Tasks

**Adding a new tenant-isolated resource** (follow Items module pattern):

1. **Add Prisma Model**:
   ```prisma
   model YourResource {
     id          String   @id @default(uuid())
     name        String
     tenantId    String
     tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
     @@map("your_resources")
   }
   ```
   Run `npm run prisma:migrate`

2. **Create Module Structure**:
   ```bash
   mkdir -p src/modules/your-resource/{controllers,services,repositories,entities,mappers,exceptions,dto}
   ```

3. **Create Entity** (`entities/your-resource.entity.ts`):
   ```typescript
   export class YourResourceEntity {
     id: string;
     name: string;
     tenantId: string;
     // ... other fields

     belongsToTenant(tenantId: string): boolean {
       return this.tenantId === tenantId;
     }
   }
   ```

4. **Create Exceptions** (`exceptions/your-resource.exceptions.ts`):
   ```typescript
   export class YourResourceNotFoundException extends NotFoundException {
     constructor(id?: string) {
       super(id ? `Resource '${id}' not found` : 'Resource not found');
     }
   }

   export class YourResourceForbiddenException extends ForbiddenException {
     constructor() {
       super('You do not have access to this resource');
     }
   }
   ```

5. **Create Mapper** (`mappers/your-resource.mapper.ts`):
   ```typescript
   export class YourResourceMapper {
     static toEntity(prismaModel): YourResourceEntity { /* ... */ }
     static toEntityArray(prismaModels): YourResourceEntity[] { /* ... */ }
     static toPrismaCreate(dto, tenantId) { /* ... */ }
     static toPrismaUpdate(dto) { /* ... */ }
   }
   ```

6. **Create Repository** (`repositories/your-resource.repository.ts`):
   ```typescript
   @Injectable()
   export class YourResourceRepository {
     constructor(private readonly prisma: PrismaService) {}

     async create(dto, tenantId): Promise<YourResourceEntity> {
       const data = YourResourceMapper.toPrismaCreate(dto, tenantId);
       const result = await this.prisma.yourResource.create({ data });
       return YourResourceMapper.toEntity(result);
     }

     async findById(id): Promise<YourResourceEntity | null> { /* ... */ }
     async findAll(options): Promise<YourResourceEntity[]> { /* ... */ }
     // Always filter by tenantId in queries
   }
   ```

7. **Create Service** (`services/your-resource.service.ts`):
   ```typescript
   @Injectable()
   export class YourResourceService {
     constructor(private readonly repository: YourResourceRepository) {}

     async findOne(id: string, userTenantId: string): Promise<YourResourceEntity> {
       const resource = await this.repository.findById(id);
       if (!resource) throw new YourResourceNotFoundException(id);
       if (!resource.belongsToTenant(userTenantId)) {
         throw new YourResourceForbiddenException();
       }
       return resource;
     }
   }
   ```

8. **Create Controller** (`controllers/your-resource.controller.ts`):
   Use `@UseGuards(JwtAuthGuard)` and `@CurrentUser()` decorator

9. **Create Module** (`your-resource.module.ts`):
   ```typescript
   @Module({
     controllers: [YourResourceController],
     providers: [YourResourceService, YourResourceRepository],
     exports: [YourResourceService, YourResourceRepository],
   })
   export class YourResourceModule {}
   ```

**Key Rules When Adding Features**:
- ✅ Services call repositories (NEVER Prisma)
- ✅ Repositories call Prisma, return entities
- ✅ Guards call repositories (NEVER Prisma) - see TenantRoleGuard, JwtStrategy
- ✅ Use mappers for all conversions
- ✅ Use typed exceptions
- ✅ Always filter by `tenantId` for tenant-isolated resources
- ✅ Add business logic to entities, not services
- ✅ Validate password complexity with `@IsStrongPassword()` decorator
- ✅ Hash passwords with bcrypt (12 rounds)
- ✅ Limit pagination with `@Max(100)`
- ✅ Store and validate refresh tokens in database
- ❌ Never inject PrismaService in services or guards
- ❌ Never return raw Prisma models from repositories
- ❌ Never put business logic in repositories or mappers
- ❌ Never use `process.env` directly (use ConfigService)

**Modifying authentication**:
- JWT payload structure defined in src/common/interfaces/jwt-payload.interface.ts
- JWT strategy validates tokens in src/modules/auth/strategies/jwt.strategy.ts
- Update both if changing payload structure
- AuthService uses UserRepository and TenantRepository (not PrismaService directly)

**Changing role permissions**:
- Update TenantRoleGuard logic or add new guards
- Review service methods business logic
- Update exceptions as needed
- Update Swagger decorators for documentation

**Changing database layer**:
- Only modify repositories
- Update mappers if Prisma schema changes
- Services and controllers remain unchanged (benefit of repository pattern)

**Using Yousign for electronic signatures**:
- Import `YousignModule` in your feature module
- Inject `YousignService` in your service
- Basic workflow:
  ```typescript
  // 1. Create signature request
  const signatureRequest = await this.yousignService.createSignatureRequest({
    name: 'Contract for Client X',
    deliveryMode: SignatureRequestDeliveryMode.EMAIL,
  });

  // 2. Upload document
  const document = await this.yousignService.uploadDocument(
    signatureRequest.id,
    {
      file: pdfBuffer,
      filename: 'contract.pdf',
      nature: DocumentNature.SIGNABLE_DOCUMENT,
    },
  );

  // 3. Add signer
  const signer = await this.yousignService.addSigner(
    signatureRequest.id,
    {
      info: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
      signatureLevel: SignatureLevel.ELECTRONIC_SIGNATURE,
      signatureAuthenticationMode: SignatureAuthenticationMode.NO_OTP,
      fields: [{
        documentId: document.id,
        type: SignatureFieldType.SIGNATURE,
        page: 1,
        x: 200,
        y: 400,
      }],
    },
  );

  // 4. Activate (sends email)
  await this.yousignService.activateSignatureRequest(signatureRequest.id);

  // 5. Download signed document when done
  const signedDoc = await this.yousignService.downloadSignedDocument(
    signatureRequest.id,
    document.id,
  );
  ```
- See `src/common/services/yousign/` for full API
- All Yousign exceptions in `exceptions/yousign.exceptions.ts`

**Using AR24 for registered mail**:
- Import `Ar24Module` in your feature module
- Inject `Ar24Service` in your service
- Basic workflow:
  ```typescript
  // 1. Upload attachment (optional)
  const attachment = await this.ar24Service.uploadAttachment({
    idUser: userId,
    file: pdfBuffer,
    filename: 'document.pdf',
    mimeType: 'application/pdf',
  });

  // 2. Send registered mail
  const mail = await this.ar24Service.sendMail({
    idUser: userId,
    recipient: {
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
      type: RecipientType.PROFESSIONAL,
      company: 'Acme Corp',
      address: '123 Main St',
      postalCode: '75001',
      city: 'Paris',
      country: 'FR',
    },
    subject: 'Important notification',
    message: 'This is a registered email with legal value',
    attachmentIds: [attachment.id],
    eidas: true, // Enable eIDAS certification
    reference: 'REF-2024-001',
  });

  // 3. Check mail status
  const mailStatus = await this.ar24Service.getMail(mail.id);

  // 4. Download proofs when available
  const proofAr = await this.ar24Service.downloadProof(mail.id, 'ar'); // Receipt proof
  const proofEv = await this.ar24Service.downloadProof(mail.id, 'ev'); // Initial presentation proof

  // 5. List all mails for user
  const mails = await this.ar24Service.listMails({
    idUser: userId,
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date(),
  });

  // 6. Configure webhook (optional)
  const webhook = await this.ar24Service.configureWebhook({
    url: 'https://your-domain.com/webhooks/ar24',
    eventType: WebhookEventType.REGISTERED_LETTER,
    active: true,
  });
  ```
- **Authentication**: Uses token + signature (SHA-256 hash of date + private key)
- **Timestamp validation**: Requests must be within 10-minute window
- **Proof types**:
  - `ev` - Initial presentation proof
  - `ar` - Receipt proof (Accusé de Réception)
  - `ng` - Negligence proof
  - `rf` - Refusal proof
- **Limits**: 256MB maximum attachment size, 30-day retention
- See `src/common/services/ar24/` for full API
- All AR24 exceptions in `exceptions/ar24.exceptions.ts`

## Error Tracking & Monitoring (Sentry)

The project includes comprehensive Sentry integration for error tracking, performance monitoring, and user context enrichment.

### Configuration

Sentry is configured in `src/app.module.ts` with:
- **Environment-aware sampling**: 10% in production, 100% in development
- **Release tracking**: Automatic version tagging
- **Performance monitoring**: Transaction tracing enabled
- **Privacy**: Automatic filtering of sensitive data (passwords, tokens)

### What Gets Tracked

**Automatic Error Capture**:
- All 5xx server errors
- Critical authentication errors (401, 403)
- Unhandled exceptions
- Validation errors are filtered out

**Enriched Context** (via `SentryInterceptor`):
- User ID and email
- Tenant ID (multi-tenant context)
- User role
- Request metadata (method, URL, query params)
- Breadcrumbs for request flow

**Sanitized Data**:
- Sensitive headers removed (authorization, cookie, x-api-key)
- Password fields redacted from request body
- Token and secret fields filtered

### Environment Variables

```bash
# Required
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Optional (defaults provided)
SENTRY_RELEASE=nestjs-api@1.0.0
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% in prod, 1.0 in dev
SENTRY_PROFILES_SAMPLE_RATE=0.0
```

### How It Works

1. **SentryInterceptor** (`src/common/interceptors/sentry.interceptor.ts`):
   - Runs on every request
   - Adds user/tenant context to Sentry scope
   - Creates breadcrumbs for request tracking

2. **HttpExceptionFilter** (`src/common/filters/http-exception.filter.ts`):
   - Captures exceptions with full context
   - Sanitizes sensitive data before sending to Sentry
   - Logs errors with tenant/user information

3. **SentryModule** (`src/app.module.ts`):
   - Configured with performance monitoring
   - Environment-specific sampling rates
   - Privacy-focused beforeSend hook

### Files Involved

- `src/app.module.ts` - Sentry configuration
- `src/main.ts` - Global interceptor setup
- `src/common/interceptors/sentry.interceptor.ts` - Context enrichment
- `src/common/filters/http-exception.filter.ts` - Error capture
- `src/config/configuration.ts` - Sentry config schema
- `src/config/validation.schema.ts` - Env validation
