# Configuration

This guide explains all environment variables and configuration options for the NestJS Multi-Tenant API.

## Environment Files

The application uses environment variables for configuration, loaded from a `.env` file.

### Setup

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your configuration

3. Restart the application to apply changes

## Required Configuration

### Database

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

PostgreSQL connection string using the format:
- `user`: PostgreSQL username
- `password`: PostgreSQL password
- `host`: Database server hostname (e.g., `localhost`)
- `port`: PostgreSQL port (default: `5432`)
- `database`: Database name

**Example**:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestjs_db
```

**Production**: Use connection pooling for better performance:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=10
```

### JWT Authentication

```bash
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d
```

- `JWT_SECRET`: Secret key for signing access tokens
- `JWT_EXPIRATION`: Token lifespan (e.g., `15m`, `1h`, `7d`)

**⚠️ Security Note**: In production, use a strong secret:
```bash
# Generate a secure secret:
openssl rand -base64 32

# Example output:
JWT_SECRET=Xy4kL9mN2pQ7rS8tU3vW6xY0zA1bC4dE5fG8hJ9kL2m
```

### Refresh Tokens

```bash
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRATION=30d
```

- `REFRESH_TOKEN_SECRET`: Secret key for refresh tokens (must be different from JWT_SECRET)
- `REFRESH_TOKEN_EXPIRATION`: Refresh token lifespan

**Best Practice**: Refresh tokens should live longer than access tokens but not indefinitely.

### Application

```bash
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
```

- `PORT`: Server port (default: `3000`)
- `NODE_ENV`: Environment mode (`development` | `production` | `test`)
- `CORS_ORIGIN`: Allowed origin for CORS (comma-separated for multiple origins)

**Production CORS**:
```bash
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

## Email Service (Mailjet)

```bash
MAILJET_API_KEY=your-mailjet-api-key
MAILJET_SECRET_KEY=your-mailjet-secret-key
MAILJET_SENDER_EMAIL=noreply@yourdomain.com
MAILJET_SENDER_NAME=Your App Name
INVITATION_BASE_URL=http://localhost:3001/accept-invitation
```

- `MAILJET_API_KEY`: Mailjet API key (from Mailjet dashboard)
- `MAILJET_SECRET_KEY`: Mailjet secret key
- `MAILJET_SENDER_EMAIL`: Verified sender email address
- `MAILJET_SENDER_NAME`: Display name for sent emails
- `INVITATION_BASE_URL`: Frontend URL for invitation acceptance

**Setup**:
1. Sign up at [mailjet.com](https://www.mailjet.com)
2. Get API credentials from dashboard
3. Verify your sender email address
4. Update `.env` with credentials

**Alternative**: The application uses Brevo (formerly Sendinblue) API keys which are compatible with Mailjet format.

## Rate Limiting

```bash
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

- `THROTTLE_TTL`: Time window in seconds (default: 60)
- `THROTTLE_LIMIT`: Max requests per time window (default: 100)

This applies to all endpoints. Auth endpoints have stricter limits (5 requests/minute) configured separately in code.

**Production**: Adjust based on expected traffic:
```bash
THROTTLE_TTL=60
THROTTLE_LIMIT=200  # Higher limit for production
```

## Error Tracking (Sentry)

```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_RELEASE=nestjs-api@1.0.0
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_PROFILES_SAMPLE_RATE=0.0
```

- `SENTRY_DSN`: Sentry project DSN (Data Source Name)
- `SENTRY_RELEASE`: Release version for tracking deployments
- `SENTRY_TRACES_SAMPLE_RATE`: Performance monitoring sample rate (0.0 to 1.0)
- `SENTRY_PROFILES_SAMPLE_RATE`: Profiling sample rate (0.0 to 1.0)

**Recommended Production Settings**:
```bash
SENTRY_DSN=https://...@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% sampling to reduce costs
SENTRY_PROFILES_SAMPLE_RATE=0.0  # Disable profiling in production
```

**Setup**:
1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project
3. Copy the DSN from project settings
4. Update `.env`

See [Sentry Integration Guide](../integrations/sentry.md) for more details.

## Yousign (Electronic Signature)

```bash
YOUSIGN_API_KEY=your-yousign-api-key
YOUSIGN_ENVIRONMENT=sandbox
```

- `YOUSIGN_API_KEY`: Yousign API key
- `YOUSIGN_ENVIRONMENT`: `sandbox` or `production`

**Optional** - Only required if you're using electronic signature features.

**Setup**:
1. Sign up at [yousign.com](https://yousign.com)
2. Get API key from dashboard
3. Use `sandbox` for testing, `production` for live signatures

See [Yousign Integration Guide](../integrations/yousign.md) for usage examples.

## AR24 (Registered Mail)

```bash
AR24_TOKEN=your-ar24-token
AR24_PRIVATE_KEY=your-ar24-private-key
AR24_ENVIRONMENT=sandbox
```

- `AR24_TOKEN`: AR24 authentication token
- `AR24_PRIVATE_KEY`: AR24 private key for request signing
- `AR24_ENVIRONMENT`: `sandbox` or `production`

**Optional** - Only required if you're using registered mail features.

**Setup**:
1. Sign up at [ar24.fr](https://www.ar24.fr)
2. Get credentials from dashboard
3. Use `sandbox` for testing, `production` for live mails

See [AR24 Integration Guide](../integrations/ar24.md) for usage examples.

## Configuration Validation

The application uses [Joi](https://joi.dev) for environment variable validation (see `src/config/validation.schema.ts`).

If required variables are missing or invalid, the application will fail to start with a clear error message:

```
[Nest] ERROR [ConfigService]
  Configuration validation error:
  "JWT_SECRET" is required
```

## Environment-Specific Configs

### Development

```bash
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001
SENTRY_TRACES_SAMPLE_RATE=1.0  # 100% sampling for debugging
```

### Production

```bash
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourdomain.com
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% sampling to reduce costs
THROTTLE_LIMIT=200  # Higher limit for production traffic

# Use strong secrets (generated with openssl rand -base64 32)
JWT_SECRET=<strong-random-secret>
REFRESH_TOKEN_SECRET=<strong-random-secret>

# Production database with connection pooling
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=10
```

### Testing

```bash
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestjs_test
```

## Configuration Service

Environment variables are accessed via NestJS's `ConfigService`:

```typescript
import { ConfigService } from '@nestjs/config';

constructor(private configService: ConfigService) {}

const port = this.configService.get<number>('port');
const jwtSecret = this.configService.get<string>('jwt.secret');
```

**Important**: Never access `process.env` directly. Always use `ConfigService` for type safety and validation.

## Next Steps

- [Quick Start](./quick-start.md) - Get the API running
- [First Steps](./first-steps.md) - Make your first API calls
- [Development Setup](../development/setup.md) - Set up your dev environment
