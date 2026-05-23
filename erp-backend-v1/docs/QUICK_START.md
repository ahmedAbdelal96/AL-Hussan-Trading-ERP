# 🚀 Quick Start Guide - Get Started in 30 Minutes

## 📋 **Prerequisites**

```bash
# Check installations
node --version    # v18+ required
npm --version     # v9+ required
docker --version  # Latest stable
git --version     # Latest stable
```

---

## ⚡ **Quick Setup (Development Environment)**

### **Step 1: Clone & Install (5 minutes)**

```bash
# Navigate to your projects folder
cd D:\Web\full-projects\erp-system\erp-backend-v1

# Install dependencies
npm install

# This will take 3-5 minutes depending on your internet speed
```

### **Step 2: Setup Database with Docker (5 minutes)**

```bash
# Create docker-compose.yml
```

Create this file in project root:

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: erp-postgres
    restart: always
    environment:
      POSTGRES_DB: erp_db
      POSTGRES_USER: erp_user
      POSTGRES_PASSWORD: erp_pass_2024
      POSTGRES_INITDB_ARGS: '-E UTF8'
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U erp_user -d erp_db']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: erp-redis
    restart: always
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 5

  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: erp-redis-ui
    restart: always
    environment:
      REDIS_HOSTS: local:redis:6379
    ports:
      - '8081:8081'
    depends_on:
      - redis

volumes:
  postgres_data:
  redis_data:
```

```bash
# Start services
docker-compose up -d

# Wait for services to be healthy (30 seconds)
docker-compose ps

# Should show both services as "healthy"
```

### **Step 3: Environment Configuration (2 minutes)**

```bash
# Copy environment template
cp .env.example .env
```

Edit [.env](D:\Web\full-projects\erp-system\erp-backend-v1.env):

```bash
# Database
DATABASE_URL="postgresql://erp_user:erp_pass_2024@localhost:5432/erp_db?schema=public"
SHADOW_DATABASE_URL="postgresql://erp_user:erp_pass_2024@localhost:5432/erp_db_shadow?schema=public"

# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# JWT (Generate secure secrets for production!)
JWT_SECRET="dev-secret-minimum-32-chars-long-12345678"
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET="dev-refresh-secret-32-chars-long-12345678"
JWT_REFRESH_EXPIRATION=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TTL=300

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

### **Step 4: Database Setup (10 minutes)**

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# This will:
# 1. Create all tables
# 2. Create indexes
# 3. Setup relationships
# 4. Run seed data

# Seed database with initial data
npx prisma db seed

# Output should show:
# ✅ Created X permissions
# ✅ Created system roles
# ✅ Created Super Admin user
#    Email: admin@erp.com
#    Password: admin123
```

### **Step 5: Start Development Server (2 minutes)**

```bash
# Start in development mode with hot reload
npm run start:dev

# Server will start on http://localhost:3000
# API docs available at http://localhost:3000/api/docs
```

### **Step 6: Test Installation (5 minutes)**

```bash
# Open new terminal

# Test health check
curl http://localhost:3000/health

# Should return: {"status":"ok"}

# Test login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@erp.com","password":"admin123"}'

# Should return access token and refresh token
```

---

## 🎯 **Access Points**

After setup, you can access:

| Service                | URL                            | Credentials                            |
| ---------------------- | ------------------------------ | -------------------------------------- |
| **API Server**         | http://localhost:3000          | -                                      |
| **API Docs (Swagger)** | http://localhost:3000/api/docs | -                                      |
| **PostgreSQL**         | localhost:5432                 | user: erp_user<br>pass: erp_pass_2024  |
| **Redis UI**           | http://localhost:8081          | -                                      |
| **Super Admin Login**  | -                              | email: admin@erp.com<br>pass: admin123 |

---

## 🛠️ **Common Commands**

### **Development**

```bash
# Start dev server (hot reload)
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format
```

### **Database**

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (DANGER: deletes all data)
npx prisma migrate reset

# Seed database
npx prisma db seed

# Open Prisma Studio (database GUI)
npx prisma studio
# Opens at http://localhost:5555
```

### **Docker**

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart postgres

# Remove volumes (delete data)
docker-compose down -v
```

---

## 🧪 **Test API Endpoints**

### **Using Swagger UI**

1. Go to http://localhost:3000/api/docs
2. Click "Authorize" button
3. Login to get token
4. Test endpoints

### **Using Postman**

```bash
# Import this Postman collection:
# [Download Collection](./postman/ERP-API.postman_collection.json)
```

### **Using cURL**

```bash
# 1. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@erp.com",
    "password": "admin123"
  }'

# Copy the accessToken from response

# 2. Get current user
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 3. List employees
curl http://localhost:3000/api/v1/employees \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 4. Create employee
curl -X POST http://localhost:3000/api/v1/employees \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ahmed",
    "lastName": "Mohammed",
    "nationalId": "1234567890",
    "email": "ahmed@example.com",
    "phone": "+966500000001",
    "employmentType": "PERMANENT",
    "hireDate": "2024-01-01",
    "department": "Engineering"
  }'
```

---

## 🐛 **Troubleshooting**

### **Problem: Port 3000 already in use**

```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <PID> /F

# Or change port in .env
PORT=3001
```

### **Problem: Database connection failed**

```bash
# Check if PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Test connection manually
docker exec -it erp-postgres psql -U erp_user -d erp_db
```

### **Problem: Prisma Client not generated**

```bash
# Regenerate Prisma Client
npx prisma generate

# If still fails, delete and regenerate
rm -rf node_modules/.prisma
npx prisma generate
```

### **Problem: Migration failed**

```bash
# Reset database and rerun migrations
npx prisma migrate reset

# If you want to keep data, create backup first
docker exec erp-postgres pg_dump -U erp_user erp_db > backup.sql
```

### **Problem: Redis connection failed**

```bash
# Check if Redis is running
docker-compose ps redis

# Test Redis connection
docker exec -it erp-redis redis-cli ping
# Should return: PONG

# Restart Redis
docker-compose restart redis
```

### **Problem: TypeScript compilation errors**

```bash
# Clean build
rm -rf dist
npm run build

# Check TypeScript version
npx tsc --version

# Update dependencies
npm update
```

---

## 📚 **Next Steps**

### **For Developers**

1. ✅ Read [Architecture Documentation](./IMPLEMENTATION_PLAN.md)
2. ✅ Review [Database Schema](../prisma/schema.prisma)
3. ✅ Check [Code Structure](./IMPLEMENTATION_PLAN.md#project-structure)
4. ✅ Write your first feature
5. ✅ Run tests

### **For Project Managers**

1. ✅ Review [Executive Summary](./EXECUTIVE_SUMMARY.md)
2. ✅ Check [Timeline & Milestones](./EXECUTIVE_SUMMARY.md#realistic-timeline)
3. ✅ Read [Plan Comparison](./PLAN_COMPARISON.md)

### **For DevOps**

1. ✅ Review [Performance Optimization](./PERFORMANCE_OPTIMIZATION.md)
2. ✅ Setup monitoring
3. ✅ Configure CI/CD
4. ✅ Plan production deployment

---

## 🎓 **Learning Resources**

### **NestJS**

- [Official Docs](https://docs.nestjs.com/)
- [NestJS Best Practices](https://github.com/nestjs/nest/tree/master/sample)

### **Prisma**

- [Official Docs](https://www.prisma.io/docs/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

### **Clean Architecture**

- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/tags/domain%20driven%20design.html)

### **TypeScript**

- [Official Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

## 🎉 **Congratulations!**

Your ERP system is now running locally! 🚀

**What you have:**

- ✅ Backend API running on port 3000
- ✅ PostgreSQL database with optimized schema
- ✅ Redis cache ready
- ✅ Super Admin user created
- ✅ API documentation at /api/docs
- ✅ Database GUI at Prisma Studio

**Ready to code?** Start with Week 1 implementation in [Step-by-Step Guide](./STEP_BY_STEP_IMPLEMENTATION.md)

---

## 💬 **Need Help?**

- 📖 Check the [Documentation](./IMPLEMENTATION_PLAN.md)
- 🐛 Report issues in the project repository
- 💡 Review [Troubleshooting](#troubleshooting) section above

**Happy Coding!** 💻✨
