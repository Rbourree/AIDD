# Quick Start

This quick start shows how to boot the NestJS Multi-Tenant API using TypeORM and create your first tenant.

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment Variables

```bash
cp .env.example .env
```

Adjust the database settings if you are not using the provided Docker container.

## 3. Start PostgreSQL

```bash
npm run docker:up
```

Use `docker ps` to confirm the container is ready before continuing.

## 4. Run Migrations

```bash
npm run typeorm:migration:run
```

All entities registered in `src/config/typeorm.config.ts` will be synced via migrations. Do **not** enable `synchronize` in production.

## 5. Launch the API

```bash
npm run start:dev
```

- API base URL: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/swagger`
- Health check: `http://localhost:3000/health`

## 6. Register the First Tenant Owner

Send a request to create a user and tenant in one step. Leaving `tenantId` empty creates a brand new workspace automatically.

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

You can now log in with the same credentials using `POST /v1/auth/login`. The generated tenant will be named "Ada's Workspace" and can be updated later via the Tenants API.

## Useful npm Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start the application in watch mode |
| `npm run typeorm:migration:run` | Apply pending migrations |
| `npm run typeorm:migration:revert` | Roll back the last migration |
| `npm run typeorm:migration:generate --name <Name>` | Generate a migration from entity changes |
| `npm run docker:down` | Stop PostgreSQL |

## Tips

- Keep `.env` in sync with your database credentials when running migrations.
- Run `npm run typeorm:migration:generate` after changing entities to keep the schema consistent.
- Swagger authentication requires a bearer token from `POST /v1/auth/login`.

For a more in-depth walkthrough, check the [Installation Guide](./installation.md) and [First Steps](./first-steps.md).
