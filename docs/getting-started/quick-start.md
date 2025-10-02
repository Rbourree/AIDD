# 🚀 Quick Start Guide

Get your NestJS Multi-Tenant API running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Docker Desktop installed and running

## Step-by-Step Setup

### 1. Install Dependencies (2 min)

```bash
npm install
```

### 2. Configure Environment (30 sec)

```bash
cp .env.example .env
```

**Optional**: Edit `.env` if you want to customize (JWT secrets, ports, etc.)

For quick start, the defaults work fine!

### 3. Start Database (30 sec)

```bash
npm run docker:up
```

Wait for PostgreSQL to be ready (about 10 seconds).

### 4. Setup Database (1 min)

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

This creates sample users:
- `admin@example.com` / `password123` (OWNER role)
- `user@example.com` / `password123` (MEMBER role)

### 5. Start the API (30 sec)

```bash
npm run start:dev
```

Wait for the message: `🚀 Application is running on: http://localhost:3000/api`

## ✅ You're Ready!

### Try It Out

1. **Open Swagger Documentation**: http://localhost:3000/swagger

2. **Login as Admin**:
   - Click on `POST /auth/login`
   - Click "Try it out"
   - Use credentials:
     ```json
     {
       "email": "admin@example.com",
       "password": "password123"
     }
     ```
   - Copy the `accessToken` from the response

3. **Authorize in Swagger**:
   - Click the green "Authorize" button at the top
   - Paste token in format: `Bearer YOUR_ACCESS_TOKEN`
   - Click "Authorize"

4. **Test Protected Endpoints**:
   - Try `GET /users/me` to see your profile
   - Try `GET /tenants` to see your tenants
   - Try `GET /items` to see tenant-filtered items

## 📍 Important URLs

- **API Base**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/swagger
- **Health Check**: http://localhost:3000/health
- **Prisma Studio**: Run `npm run prisma:studio` → http://localhost:5555

## 🔑 Test Accounts

| Email | Password | Role | Tenant |
|-------|----------|------|--------|
| admin@example.com | password123 | OWNER | Acme Corporation |
| user@example.com | password123 | MEMBER | Acme Corporation |

## 🎯 Next Steps

1. **Explore the API**: Use Swagger to test all endpoints
2. **Read the Docs**: Check the [Architecture Guide](../architecture/overview.md)
3. **Make Your First API Call**: Follow the [First Steps Guide](./first-steps.md)
4. **Add a Feature**: Learn how in the [Development Guide](../development/adding-features.md)

## 🐛 Troubleshooting

**Database not connecting?**
```bash
npm run docker:down
npm run docker:up
```

**Port 3000 already in use?**
- Change `PORT=3001` in `.env`
- Restart: `npm run start:dev`

**Prisma errors?**
```bash
npm run prisma:generate
npx prisma migrate reset
npm run prisma:seed
```

**Need help?**
- Check the [Troubleshooting Guide](../troubleshooting.md)
- Review Swagger documentation
- Check Docker logs: `docker-compose logs`

## 🎉 That's It!

You now have a production-ready multi-tenant API with:
- ✅ JWT Authentication
- ✅ Role-based Access Control
- ✅ Multi-tenant Isolation
- ✅ Email Invitations (configure Mailjet for production)
- ✅ Complete API Documentation

Happy coding! 🚀
