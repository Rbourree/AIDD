# Installation

This guide will help you install and set up the NestJS Multi-Tenant API on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

| Tool | Version | Required | Notes |
|------|---------|----------|-------|
| Node.js | 18+ | ✅ Yes | Download from [nodejs.org](https://nodejs.org) |
| npm | 9+ | ✅ Yes | Comes with Node.js |
| PostgreSQL | 15+ | ✅ Yes | Database server |
| Docker | 24+ | ⭕ Optional | For containerized PostgreSQL |

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd nestjs-api
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- NestJS framework
- Prisma ORM
- Authentication packages (Passport, JWT)
- Integration SDKs (Mailjet, Yousign, AR24, Sentry)

Installation typically takes 1-2 minutes depending on your internet connection.

## Step 3: Setup PostgreSQL

You have two options for setting up PostgreSQL:

### Option A: Using Docker (Recommended)

If you have Docker installed:

```bash
npm run docker:up
```

This will start a PostgreSQL 15 container with the following credentials:
- Host: `localhost`
- Port: `5432`
- Database: `nestjs_db`
- User: `postgres`
- Password: `postgres`

### Option B: Local PostgreSQL Installation

If you prefer to use a local PostgreSQL installation:

1. Install PostgreSQL 15+ from [postgresql.org](https://www.postgresql.org/download/)
2. Create a new database:
   ```sql
   CREATE DATABASE nestjs_db;
   ```
3. Update your `.env` file with your PostgreSQL credentials (see next step)

## Step 4: Configure Environment Variables

Create your environment configuration file:

```bash
cp .env.example .env
```

The `.env.example` file contains all necessary configuration with sensible defaults. For local development, you can use it as-is, or customize the following key variables:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestjs_db

# JWT Secrets (change these in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# Application
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
```

**Important**: For production, you must change the JWT secrets to secure values. You can generate strong secrets using:

```bash
openssl rand -base64 32
```

See [Configuration Guide](./configuration.md) for all available environment variables.

## Step 5: Initialize the Database

Generate the Prisma Client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```

This will create all necessary tables (User, Tenant, TenantUser, Invitation, RefreshToken, Item).

## Step 6: Seed Sample Data (Optional)

To populate your database with sample data for testing:

```bash
npm run prisma:seed
```

This creates two users:
- **Admin User**: `admin@example.com` / `password123` (OWNER role)
- **Regular User**: `user@example.com` / `password123` (MEMBER role)

Both belong to a sample tenant called "Acme Corporation".

## Verify Installation

To verify everything is set up correctly:

1. Check database connection:
   ```bash
   npm run prisma:studio
   ```
   This should open Prisma Studio at http://localhost:5555

2. Start the development server:
   ```bash
   npm run start:dev
   ```

3. You should see:
   ```
   🚀 Application is running on: http://localhost:3000/api
   📚 Swagger documentation: http://localhost:3000/swagger
   ```

4. Visit http://localhost:3000/health - you should see a health check response

## Next Steps

- [Quick Start Guide](./quick-start.md) - Get started in 5 minutes
- [Configuration Guide](./configuration.md) - Learn about all configuration options
- [First Steps](./first-steps.md) - Make your first API calls

## Troubleshooting

### Port 3000 Already in Use

Change the port in your `.env` file:
```bash
PORT=3001
```

### Database Connection Failed

**Check that PostgreSQL is running:**
```bash
# If using Docker:
docker ps

# If using local PostgreSQL:
pg_isready
```

**Verify your DATABASE_URL** in `.env` matches your PostgreSQL setup.

### Prisma Client Not Generated

If you see errors about `@prisma/client` not found:
```bash
npm run prisma:generate
```

### npm install Fails

Clear npm cache and retry:
```bash
npm cache clean --force
npm install
```

For more troubleshooting help, see the [Troubleshooting Guide](../troubleshooting.md).
