# 🏗️ ERP System for Construction Companies

> Enterprise Resource Planning system built with **NestJS**, **PostgreSQL**, and **Prisma** following **Clean Architecture** and **Domain-Driven Design** principles.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D)](https://redis.io/)

---

## ✨ **Features**

### **Core Modules**

- 🔐 **Authentication & Authorization** - JWT + RBAC with temporary permissions
- 👥 **User Management** - Users, roles, permissions
- 👷 **HR Module** - Employees, contracts, payroll, allowances, loans
- 📊 **Project Management** - Project tracking, assignments
- 🚜 **Asset Management** - Equipment/vehicles, operations tracking
- 🔧 **Maintenance Module** - Requests, workflows, costs
- 💰 **Finance Module** - Cost tracking, budget management
- 📈 **Reports Module** - Comprehensive reports + Excel export
- 📝 **Audit System** - Complete audit trail

### **Technical Features**

- ⚡ **High Performance** - Redis caching, optimized queries
- 🏗️ **Clean Architecture** - Testable, maintainable
- 🛡️ **Security First** - JWT, rate limiting, validation
- 📦 **Scalable** - Horizontal scaling ready
- 🧪 **Well Tested** - Unit, integration, E2E tests
- 📚 **Fully Documented** - Swagger docs, code comments
- 🐳 **Docker Ready** - Dev and production configs

---

## 🚀 **Quick Start**

### **Installation (5 minutes)**

```bash
# Install dependencies
npm install

# Start infrastructure
docker-compose up -d

# Setup environment
cp .env.example .env

# Run migrations
npx prisma migrate dev
npx prisma db seed

# Start server
npm run start:dev
```

### **Access**

- 🌐 **API**: http://localhost:3000
- 📚 **Docs**: http://localhost:3000/api/docs
- 🗄️ **DB UI**: http://localhost:5555 (`npx prisma studio`)

### **Default Login**

```
Email: admin@erp.com
Password: admin123
```

📖 **Full guide**: [Quick Start](./docs/QUICK_START.md)

---

## 📚 **Documentation**

- 📋 [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)
- 🎯 [Step-by-Step Guide](./docs/STEP_BY_STEP_IMPLEMENTATION.md)
- ⚡ [Performance Optimization](./docs/PERFORMANCE_OPTIMIZATION.md)
- 📊 [Executive Summary](./docs/EXECUTIVE_SUMMARY.md)
- 📈 [Plan Comparison](./docs/PLAN_COMPARISON.md)

---

## 🏗️ **Architecture**

```
Presentation → Application → Domain → Infrastructure
```

- ✅ **Repository Pattern** - Abstract data access
- ✅ **Use Case Pattern** - Business logic encapsulation
- ✅ **CQRS** - Read/write separation
- ✅ **Event-Driven** - Domain events
- ✅ **Dependency Injection** - Loose coupling

---

## 💻 **Development**

```bash
# Development
npm run start:dev      # Hot reload

# Testing
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Coverage

# Database
npm run prisma:migrate # Migrations
npm run prisma:studio  # DB GUI

# Code Quality
npm run lint           # Lint
npm run format         # Format
```

---

## 🔌 **API Endpoints**

### **Auth**

- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Current user

### **Employees**

- `GET /api/v1/employees` - List
- `POST /api/v1/employees` - Create
- `GET /api/v1/employees/:id` - Get
- `PUT /api/v1/employees/:id` - Update

### **Projects**

- `GET /api/v1/projects` - List
- `POST /api/v1/projects` - Create
- `POST /api/v1/projects/:id/employees` - Assign

📚 **Full docs**: http://localhost:3000/api/docs

---

## 📁 **Project Structure**

```
src/
├── core/              # Business logic
│   ├── domain/        # Entities, value objects
│   ├── interfaces/    # Contracts
│   └── use-cases/     # Application logic
├── infrastructure/    # External
│   ├── database/      # Prisma, repos
│   ├── cache/         # Redis
│   └── queue/         # Bull
├── application/       # NestJS
│   ├── modules/       # Features
│   ├── common/        # Shared
│   └── config/        # Configuration
└── shared/            # Utilities
```

---

## 🛠️ **Tech Stack**

- **Backend**: NestJS 10.x + TypeScript 5.x
- **Database**: PostgreSQL 15 + Prisma 5
- **Cache**: Redis 7
- **Queue**: Bull 4
- **Auth**: JWT + bcrypt
- **Docs**: Swagger/OpenAPI
- **Testing**: Jest + Supertest
- **Tools**: ESLint, Prettier, Docker

---

## 🚀 **Deployment**

```bash
# Build
npm run build

# Production
npm run start:prod
```

---

## 📊 **Project Status**

| Phase        | Status         | Progress |
| ------------ | -------------- | -------- |
| Foundation   | ✅ Complete    | 100%     |
| Core Modules | 🚧 In Progress | 60%      |
| Operations   | 📋 Planned     | 0%       |
| Reports      | 📋 Planned     | 0%       |

**Version**: 0.1.0-alpha
**Launch**: Week 18

---

<div align="center">

**Built with ❤️ using NestJS, PostgreSQL, and Prisma**

[Documentation](./docs) • [Quick Start](./docs/QUICK_START.md) • [API Docs](http://localhost:3000/api/docs)

</div>
