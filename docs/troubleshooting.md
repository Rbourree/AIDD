# Troubleshooting Guide

Common issues and solutions for the NestJS Multi-Tenant API.

## Database Issues

### ❌ Database Connection Failed

**Symptoms**:
```
Error: connect ECONNREFUSED ::1:5432
```

**Causes**:
1. PostgreSQL container not running
2. Wrong credentials in `.env`
3. Firewall blocking port 5432
4. Database not created yet

**Solutions**:

```bash
# Check if Docker container is running
docker ps | grep postgres

# Start PostgreSQL with Docker
npm run docker:up

# Test connection manually
psql -h localhost -U postgres -d nestjs_db -c '\dt'
```

### ❌ TypeORM CLI Cannot Connect

**Symptoms**:
```
Error during Data Source initialization
```

**Solutions**:

```bash
# Ensure environment variables are loaded
cat .env | grep DATABASE

# Re-run migrations
npm run typeorm:migration:run

# Roll back a broken migration
npm run typeorm:migration:revert
```

### ❌ Migration Failed Midway

**Symptoms**:
```
QueryFailedError: relation "items" already exists
```

**Solutions**:

```bash
# Revert the migration
npm run typeorm:migration:revert

# Manually fix the database if necessary, then rerun
npm run typeorm:migration:run
```

## Authentication Issues

### ❌ 401 Unauthorized

**Symptoms**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Causes**:
1. Token expired
2. Invalid JWT secret
3. User removed from tenant

**Solutions**:

```bash
# Refresh your token
POST /v1/auth/refresh
{
  "refreshToken": "your_refresh_token"
}

# Login again
POST /v1/auth/login
{
  "email": "user@example.com",
  "password": "Password123!"
}

# Check JWT secret
cat .env | grep JWT_SECRET
```

### ❌ Invalid Credentials

**Symptoms**:
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

**Causes**:
1. Wrong password
2. Email does not exist
3. User revoked from tenant

**Solutions**:
- Double-check credentials
- Reset password if implemented
- Verify user exists:
  ```sql
  SELECT email FROM users WHERE email = 'user@example.com';
  ```

### ❌ Token Expired

Use the refresh endpoint:

```bash
POST /v1/auth/refresh
{
  "refreshToken": "your_refresh_token"
}
```

## Application Start Issues

### ❌ Port Already in Use

**Symptoms**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions**:

```bash
# Find process
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or run on a different port
PORT=3001 npm run start:dev
```

### ❌ Environment Variables Not Loaded

**Symptoms**:
```
Configuration validation error: "JWT_SECRET" is required
```

**Solutions**:

```bash
# Check .env exists
ls -la .env

# Copy from example if missing
cp .env.example .env
```

## TypeORM Tips

### Check Pending Migrations

```bash
npm run typeorm -- migration:show -d src/config/typeorm.config.ts
```

### Generate a Migration

```bash
npm run typeorm:migration:generate --name AddNewEntity
```

### Reset Database in Development

If the schema is out of sync and you are in development, you can drop and recreate the database manually:

```bash
psql -h localhost -U postgres -c 'DROP DATABASE IF EXISTS nestjs_db;'
psql -h localhost -U postgres -c 'CREATE DATABASE nestjs_db;'
npm run typeorm:migration:run
```

## Logging & Monitoring

- Enable verbose TypeORM logging by setting `TYPEORM_LOGGING=true` in `.env`
- Check application logs for stack traces when errors occur
- Configure Sentry for production error reporting (see [Sentry Integration](./integrations/sentry.md))

## Need More Help?

- Review the [Installation Guide](./getting-started/installation.md)
- Consult the [Architecture docs](./architecture/overview.md)
- Open an issue if you encounter an undocumented problem
