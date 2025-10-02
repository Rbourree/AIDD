# Installation

This guide walks you through installing and configuring the NestJS Multi-Tenant API powered by TypeORM.

## Prerequisites

Before you begin, install the following tools:

| Tool | Version | Required | Notes |
|------|---------|----------|-------|
| Node.js | 18+ | ✅ Yes | Download from [nodejs.org](https://nodejs.org) |
| npm | 10+ | ✅ Yes | Comes with recent Node.js versions |
| PostgreSQL | 13+ | ✅ Yes | Primary database |
| Docker | 24+ | ⭕ Optional | Simplest way to run PostgreSQL locally |

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd nestjs-api
```

## Step 2: Install Dependencies

```bash
npm install
```

This installs NestJS, TypeORM, authentication packages (Passport, JWT), and integration SDKs (Mailjet, Yousign, AR24, Sentry).

## Step 3: Provision PostgreSQL

You can either start the Docker Compose stack or point the application to an existing PostgreSQL instance.

### Option A: Docker (Recommended)

```bash
npm run docker:up
```

This starts PostgreSQL with the defaults defined in `.env.example`:
- Host: `localhost`
- Port: `5432`
- Database: `nestjs_db`
- User: `postgres`
- Password: `postgres`

### Option B: Existing PostgreSQL Server

1. Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
2. Create a database:
   ```sql
   CREATE DATABASE nestjs_db;
   ```
3. Ensure the credentials are reflected in your `.env` file

## Step 4: Configure Environment Variables

Copy the example file and adjust values as needed:

```bash
cp .env.example .env
```

Key values to review:

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=nestjs_db

# JWT Secrets (change in production)
JWT_SECRET=change-me
REFRESH_TOKEN_SECRET=change-me-too
```

Refer to the [Configuration Guide](./configuration.md) for every available option.

## Step 5: Run Database Migrations

Apply the latest TypeORM migrations before starting the application:

```bash
npm run typeorm:migration:run
```

The CLI uses the data source defined in `src/config/typeorm.config.ts` and will create all required tables (users, tenants, invitations, refresh tokens, items, etc.).

## Step 6: Start the Application

```bash
npm run start:dev
```

You should see:

```
🚀 Application is running on: http://localhost:3000/api
📚 Swagger documentation: http://localhost:3000/swagger
```

Visit the health endpoint to verify the service:

```
http://localhost:3000/health
```

## Next Steps

- [Quick Start Guide](./quick-start.md) – Spin up the app and call the API
- [First Steps](./first-steps.md) – Register, login, and explore endpoints
- [Architecture Overview](../architecture/overview.md) – Understand the system design

## Troubleshooting

### Port 3000 Already in Use

```bash
PORT=3001 npm run start:dev
```

### Database Connection Fails

```bash
# If using Docker
npm run docker:down
npm run docker:up

# Check container status
docker ps | grep postgres
```

### TypeORM CLI Cannot Connect

Ensure environment variables are loaded when running migrations:

```bash
cat .env | grep DATABASE
npm run typeorm:migration:run
```

### npm install Fails

```bash
npm cache clean --force
npm install
```

For more detailed solutions, read the [Troubleshooting Guide](../troubleshooting.md).
