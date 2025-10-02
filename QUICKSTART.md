# 🚀 Quick Start Guide

Get your NestJS multi-tenant API running with TypeORM in just a few minutes.

## Prerequisites

- Node.js 18+
- npm 10+
- Docker (for local PostgreSQL) or an existing PostgreSQL instance

## Step-by-Step Setup

### 1. Install Dependencies (2 min)

```bash
npm install
```

### 2. Configure Environment (30 sec)

```bash
cp .env.example .env
```

Update the database credentials in `.env` if you are not using the default Docker setup.

### 3. Start PostgreSQL (30 sec)

```bash
npm run docker:up
```

Wait a few seconds for the container to be healthy.

### 4. Apply Database Migrations (1 min)

```bash
npm run typeorm:migration:run
```

This runs all TypeORM migrations using `src/config/typeorm.config.ts`.

### 5. Start the API (30 sec)

```bash
npm run start:dev
```

The application will be available at `http://localhost:3000` with Swagger documentation at `/swagger`.

## ✅ You're Ready!

### Create Your First Tenant and User

Use the registration endpoint to bootstrap a tenant and owner account in a single request. When no `tenantId` is provided the API creates a new workspace automatically.

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

The response contains access and refresh tokens with the tenant context embedded. The tenant name defaults to `<firstName>'s Workspace` and can be updated later via the Tenants API.

### Try It Out in Swagger

1. Open http://localhost:3000/swagger
2. Authenticate with `POST /v1/auth/login` or the token from registration
3. Click **Authorize** and paste `Bearer YOUR_ACCESS_TOKEN`
4. Call tenant-scoped endpoints such as `GET /v1/items`

## 📍 Important URLs

- **API Base**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/swagger
- **Health Check**: http://localhost:3000/health

## 🔧 Useful Commands

| Command | Description |
|---------|-------------|
| `npm run typeorm:migration:generate --name <Name>` | Generate a migration from entity changes |
| `npm run typeorm:migration:create <Name>` | Create an empty migration file |
| `npm run typeorm:migration:run` | Apply pending migrations |
| `npm run typeorm:migration:revert` | Roll back the last migration |
| `npm run docker:down` | Stop local PostgreSQL |

## 🐛 Troubleshooting

**Database not connecting?**
```bash
npm run docker:down
npm run docker:up
```

**TypeORM CLI cannot connect?**
```bash
# Verify env variables
cat .env | grep DATABASE

# Test a migration locally
npm run typeorm:migration:run
```

**Port 3000 already used?**
```bash
PORT=3001 npm run start:dev
```

Need more help? Read the full [installation guide](./docs/getting-started/installation.md) and [troubleshooting guide](./docs/troubleshooting.md).

Happy coding! 🚀
