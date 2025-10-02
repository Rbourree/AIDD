# Troubleshooting Guide

Common issues and solutions for the NestJS Multi-Tenant API.

## Database Issues

### ❌ Database Connection Failed

**Symptoms**:
```
Error: P1001: Can't reach database server
```

**Causes**:
1. PostgreSQL not running
2. Wrong DATABASE_URL
3. Firewall blocking port 5432
4. Database doesn't exist

**Solutions**:

```bash
# Check if Docker container is running
docker ps | grep postgres

# Start PostgreSQL with Docker
npm run docker:up

# Check if local PostgreSQL is running
pg_isready

# Verify database exists
psql -U postgres -l | grep nestjs_db

# Test connection manually
psql -U postgres -d nestjs_db
```

### ❌ Prisma Client Not Generated

**Symptoms**:
```
Error: Cannot find module '@prisma/client'
```

**Solution**:
```bash
npm run prisma:generate
```

### ❌ Migration Conflicts

**Symptoms**:
```
Error: Migration `xxx` failed to apply cleanly
```

**Solutions**:

```bash
# Development (destructive - drops database)
npx prisma migrate reset

# Mark migration as applied
npx prisma migrate resolve --applied MIGRATION_NAME

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

### ❌ Database Schema Out of Sync

**Symptoms**:
```
Error: The table `users` does not exist in the current database
```

**Solution**:
```bash
# Generate Prisma Client
npm run prisma:generate

# Apply migrations
npm run prisma:migrate

# If still broken, reset (dev only)
npx prisma migrate reset
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
2. Invalid JWT_SECRET
3. User doesn't exist
4. User removed from tenant

**Solutions**:

```bash
# Refresh your token
POST /auth/refresh
{
  "refreshToken": "your_refresh_token"
}

# Login again
POST /auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Check JWT_SECRET in .env matches server
echo $JWT_SECRET
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
2. Email doesn't exist
3. Typo in email

**Solutions**:
- Double-check email and password
- Try resetting password (if implemented)
- Check database for user existence:
  ```sql
  SELECT email FROM users WHERE email = 'user@example.com';
  ```

### ❌ Token Expired

**Solution**:
Use refresh token to get new access token:

```bash
POST /auth/refresh
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
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or change port in .env
PORT=3001
```

### ❌ Environment Variables Not Loaded

**Symptoms**:
```
Configuration validation error: "JWT_SECRET" is required
```

**Solutions**:

```bash
# Check .env file exists
ls -la .env

# Copy from example if missing
cp .env.example .env

# Verify variable is set
cat .env | grep JWT_SECRET

# Restart application
npm run start:dev
```

### ❌ Module Not Found

**Symptoms**:
```
Error: Cannot find module 'some-package'
```

**Solutions**:

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
npm install
```

## Email Issues

### ❌ Email Sending Fails

**Symptoms**:
```
Error sending invitation email
```

**Causes**:
1. Invalid Mailjet API keys
2. Sender email not verified
3. API keys have insufficient permissions

**Solutions**:

```bash
# Check Mailjet credentials in .env
echo $MAILJET_API_KEY
echo $MAILJET_SECRET_KEY

# Test Mailjet API directly
curl -X POST https://api.mailjet.com/v3.1/send \
  -u "API_KEY:SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "Messages": [{
      "From": {"Email": "noreply@yourdomain.com"},
      "To": [{"Email": "test@example.com"}],
      "Subject": "Test",
      "HTMLPart": "<p>Test email</p>"
    }]
  }'

# Verify sender email in Mailjet dashboard
# https://app.mailjet.com/account/sender
```

## Rate Limiting

### ❌ 429 Too Many Requests

**Symptoms**:
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

**Causes**:
- Exceeded 100 requests/minute (global)
- Exceeded 5 requests/minute (auth endpoints)

**Solutions**:

```bash
# Wait for rate limit to reset (check header)
X-RateLimit-Reset: 1640000000

# Implement exponential backoff in client
# Reduce request frequency

# Increase limits in .env (production only)
THROTTLE_LIMIT=200
```

## Build Issues

### ❌ TypeScript Compilation Errors

**Symptoms**:
```
error TS2307: Cannot find module '@/common/decorators'
```

**Solutions**:

```bash
# Clean build directory
rm -rf dist

# Rebuild
npm run build

# Check tsconfig.json paths are correct
cat tsconfig.json
```

### ❌ Prisma Types Not Found

**Symptoms**:
```
error TS2305: Module '@prisma/client' has no exported member 'User'
```

**Solution**:
```bash
# Regenerate Prisma Client
npm run prisma:generate

# Rebuild
npm run build
```

## Docker Issues

### ❌ Docker Container Won't Start

**Symptoms**:
```
Error: Container exited with code 1
```

**Solutions**:

```bash
# Check Docker logs
docker-compose logs

# Stop and remove containers
npm run docker:down

# Rebuild and start
npm run docker:up

# Check Docker is running
docker info
```

### ❌ PostgreSQL Container Fails

**Symptoms**:
```
database system was interrupted
```

**Solutions**:

```bash
# Stop containers
npm run docker:down

# Remove volumes (caution: data loss)
docker-compose down -v

# Start fresh
npm run docker:up
```

## Invitation Issues

### ❌ Invitation Email Not Received

**Causes**:
1. Email in spam folder
2. Mailjet not configured
3. Invalid email address

**Solutions**:
- Check spam folder
- Verify Mailjet configuration
- Check logs for email sending errors
- Test with a different email address

### ❌ Invitation Token Expired

**Symptoms**:
```json
{
  "statusCode": 400,
  "message": "Invitation has expired"
}
```

**Solution**:
Ask admin to resend invitation (valid for 24 hours).

### ❌ Invitation Already Accepted

**Symptoms**:
```json
{
  "statusCode": 400,
  "message": "Invitation has already been accepted"
}
```

**Solution**:
Login normally - you're already a member of the tenant.

## Performance Issues

### ❌ Slow API Responses

**Causes**:
1. Missing database indexes
2. N+1 query problems
3. No connection pooling

**Solutions**:

```bash
# Add database indexes (in Prisma schema)
@@index([tenantId, createdAt])

# Enable query logging
# In .env:
DATABASE_URL=postgresql://...?log_queries=true

# Use connection pooling
DATABASE_URL=postgresql://...?connection_limit=10

# Monitor with Prisma Studio
npm run prisma:studio
```

## Development Environment

### ❌ Hot Reload Not Working

**Symptoms**:
Changes to code not reflected

**Solutions**:

```bash
# Restart dev server
npm run start:dev

# Clear .nest cache
rm -rf dist

# Check watch mode is enabled
# Should see: "Starting Nest application... watch mode"
```

### ❌ Debugger Won't Attach

**Symptoms**:
Breakpoints not hitting

**Solutions**:

```bash
# Use debug mode
npm run start:debug

# Attach debugger on port 9229
# VS Code launch.json:
{
  "type": "node",
  "request": "attach",
  "name": "Attach to NestJS",
  "port": 9229
}
```

## Testing Issues

### ❌ Tests Fail to Connect to Database

**Solutions**:

```bash
# Use separate test database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestjs_test

# Reset test database before tests
npx prisma migrate reset --skip-seed

# Run tests
npm run test
```

## Logging & Debugging

### Enable Verbose Logging

```typescript
// In main.ts
app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);
```

### Debug Database Queries

```bash
# Add to DATABASE_URL
DATABASE_URL=postgresql://...?log_queries=true

# Or in Prisma schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  log      = ["query", "info", "warn", "error"]
}
```

### Check Sentry Errors

If Sentry is configured, check dashboard at https://sentry.io for:
- Error traces
- Performance issues
- User context
- Breadcrumbs

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ENOENT: no such file or directory` | File not found | Check file path, run `npm install` |
| `Cannot find module` | Missing dependency | Run `npm install` |
| `P1001: Can't reach database` | Database not running | Start PostgreSQL with `npm run docker:up` |
| `ER_ACCESS_DENIED_ERROR` | Wrong database credentials | Check DATABASE_URL in `.env` |
| `Invalid JWT` | Token expired or invalid | Refresh token or login again |
| `Forbidden` | Insufficient permissions | Check user role in tenant |

## Still Having Issues?

1. **Check Logs**: Look at application logs for detailed error messages
2. **Enable Debug Mode**: Run `npm run start:debug` for verbose output
3. **Check Swagger Docs**: http://localhost:3000/swagger
4. **Inspect Database**: Use `npm run prisma:studio`
5. **Review Configuration**: Verify `.env` variables
6. **Check Documentation**: Review relevant docs in `/docs`
7. **Search Issues**: Check GitHub issues
8. **Ask for Help**: Open a new GitHub issue with:
   - Error message
   - Steps to reproduce
   - Environment (OS, Node version, etc.)
   - Relevant logs

## Related Documentation

- [Installation Guide](./getting-started/installation.md) - Setup instructions
- [Configuration Guide](./getting-started/configuration.md) - Environment variables
- [API Overview](./api/overview.md) - API reference
- [Sentry Integration](./integrations/sentry.md) - Error monitoring
