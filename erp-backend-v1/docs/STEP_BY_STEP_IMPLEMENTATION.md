# 🎯 Step-by-Step Implementation Guide

## 📅 **Week 1: Project Foundation**

### **Day 1-2: Initial Setup**

```bash
# ============================================================================
# STEP 1: Create NestJS Project
# ============================================================================

# Install NestJS CLI globally
npm i -g @nestjs/cli

# Create new project
nest new erp-backend-v1

cd erp-backend-v1

# ============================================================================
# STEP 2: Install Core Dependencies
# ============================================================================

# Database & ORM
npm install prisma @prisma/client
npm install -D prisma

# Authentication
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt

# Validation & Transformation
npm install class-validator class-transformer

# Configuration
npm install @nestjs/config

# API Documentation
npm install @nestjs/swagger swagger-ui-express

# Caching
npm install @nestjs/cache-manager cache-manager
npm install cache-manager-redis-store redis
npm install ioredis
npm install -D @types/ioredis

# Queue
npm install @nestjs/bull bull
npm install -D @types/bull

# Utilities
npm install uuid moment
npm install -D @types/uuid

# Excel & PDF Export
npm install exceljs pdfkit
npm install -D @types/pdfkit

# Testing
npm install -D @nestjs/testing supertest @types/supertest

# Logging
npm install winston nest-winston

# Rate Limiting
npm install @nestjs/throttler

# ============================================================================
# STEP 3: Setup Prisma
# ============================================================================

# Initialize Prisma
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env file
```

### **Day 3-4: Project Structure**

```bash
# ============================================================================
# CREATE DIRECTORY STRUCTURE
# ============================================================================

# Core Domain Layer
mkdir -p src/core/domain/entities
mkdir -p src/core/domain/value-objects
mkdir -p src/core/domain/events
mkdir -p src/core/interfaces/repositories
mkdir -p src/core/interfaces/services
mkdir -p src/core/use-cases/auth
mkdir -p src/core/use-cases/employees
mkdir -p src/core/use-cases/projects
mkdir -p src/core/use-cases/assets

# Infrastructure Layer
mkdir -p src/infrastructure/database/prisma
mkdir -p src/infrastructure/database/repositories
mkdir -p src/infrastructure/database/seeds
mkdir -p src/infrastructure/cache
mkdir -p src/infrastructure/queue/processors
mkdir -p src/infrastructure/storage
mkdir -p src/infrastructure/logger

# Application Layer
mkdir -p src/application/modules/auth/dto
mkdir -p src/application/modules/auth/strategies
mkdir -p src/application/modules/users/dto
mkdir -p src/application/modules/employees/dto
mkdir -p src/application/modules/employees/mappers
mkdir -p src/application/modules/projects/dto
mkdir -p src/application/modules/assets/dto
mkdir -p src/application/modules/maintenance/dto
mkdir -p src/application/modules/finance/dto
mkdir -p src/application/modules/reports/generators

# Common/Shared
mkdir -p src/application/common/decorators
mkdir -p src/application/common/guards
mkdir -p src/application/common/interceptors
mkdir -p src/application/common/filters
mkdir -p src/application/common/pipes

# Configuration
mkdir -p src/application/config

# Shared utilities
mkdir -p src/shared/utils
mkdir -p src/shared/constants
mkdir -p src/shared/types
mkdir -p src/shared/helpers

# Docs
mkdir -p docs/architecture
mkdir -p docs/api
mkdir -p docs/database

# Scripts
mkdir -p scripts

# Tests
mkdir -p test/unit
mkdir -p test/integration
mkdir -p test/e2e
```

### **Day 5-7: Database Schema & Configuration**

**1. Update Prisma Schema**

Copy the optimized schema from `schema-optimized.prisma` to `prisma/schema.prisma`

**2. Create Database Configuration**

```typescript
// src/application/config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  logLevel: process.env.DB_LOG_LEVEL || 'error',
  poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
  connectionTimeout: parseInt(process.env.DB_TIMEOUT || '5000', 10),
}));
```

**3. Create Prisma Service**

```typescript
// src/infrastructure/database/prisma/prisma.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private config: ConfigService) {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    // Connect to database
    await this.$connect();
    this.logger.log('✅ Database connected successfully');

    // Setup query logging in development
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as never, (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // Log slow queries in production
    this.$on('query' as never, (e: any) => {
      if (e.duration > 1000) {
        this.logger.warn(
          `🐌 Slow query detected (${e.duration}ms): ${e.query}`,
        );
      }
    });

    // Setup query performance middleware
    this.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      const duration = after - before;

      // Log queries > 100ms
      if (duration > 100) {
        this.logger.warn({
          message: 'Slow query detected',
          model: params.model,
          action: params.action,
          duration: `${duration}ms`,
        });
      }

      return result;
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Clean database for testing
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this).filter((key) => key[0] !== '_');

    return Promise.all(
      models.map((modelKey) => {
        const model = this[modelKey as string] as any;
        if (model && typeof model.deleteMany === 'function') {
          return model.deleteMany();
        }
      }),
    );
  }

  /**
   * Execute transaction with automatic retry on deadlock
   */
  async transaction<T>(
    fn: (tx: any) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.$transaction(fn);
      } catch (error: any) {
        lastError = error;

        // Retry on deadlock
        if (error.code === 'P2034' || error.message.includes('deadlock')) {
          this.logger.warn(
            `Deadlock detected, retrying (${i + 1}/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
          continue;
        }

        throw error;
      }
    }

    throw lastError!;
  }
}
```

**4. Create Database Module**

```typescript
// src/infrastructure/database/database.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

**5. Setup Environment Variables**

```bash
# .env
# Database
DATABASE_URL="postgresql://erp_user:erp_pass@localhost:5432/erp_db?schema=public"
SHADOW_DATABASE_URL="postgresql://erp_user:erp_pass@localhost:5432/erp_db_shadow?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long-change-in-production"
JWT_EXPIRATION="15m"
JWT_REFRESH_SECRET="your-refresh-token-secret-minimum-32-characters"
JWT_REFRESH_EXPIRATION="7d"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
REDIS_TTL=300

# Application
NODE_ENV="development"
PORT=3000
API_PREFIX="api/v1"
API_VERSION="1.0.0"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES="image/jpeg,image/png,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

# Logging
LOG_LEVEL="debug"
LOG_FILE="logs/app.log"

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# Email (for future)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM="noreply@erp.com"
```

**6. Run Migrations**

```bash
# Generate Prisma Client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init

# Seed database with initial data
npx prisma db seed
```

**7. Create Seed Script**

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Permissions
  const permissions = [
    // Users
    { name: 'users.view', resource: 'users', action: 'view' },
    { name: 'users.create', resource: 'users', action: 'create' },
    { name: 'users.update', resource: 'users', action: 'update' },
    { name: 'users.delete', resource: 'users', action: 'delete' },

    // Employees
    { name: 'employees.view', resource: 'employees', action: 'view' },
    { name: 'employees.create', resource: 'employees', action: 'create' },
    { name: 'employees.update', resource: 'employees', action: 'update' },
    { name: 'employees.delete', resource: 'employees', action: 'delete' },
    {
      name: 'employees.view_salary',
      resource: 'employees',
      action: 'view_salary',
    },
    {
      name: 'employees.update_salary',
      resource: 'employees',
      action: 'update_salary',
    },

    // Projects
    { name: 'projects.view', resource: 'projects', action: 'view' },
    { name: 'projects.create', resource: 'projects', action: 'create' },
    { name: 'projects.update', resource: 'projects', action: 'update' },
    { name: 'projects.delete', resource: 'projects', action: 'delete' },
    {
      name: 'projects.assign_employees',
      resource: 'projects',
      action: 'assign_employees',
    },
    {
      name: 'projects.assign_assets',
      resource: 'projects',
      action: 'assign_assets',
    },

    // Assets
    { name: 'assets.view', resource: 'assets', action: 'view' },
    { name: 'assets.create', resource: 'assets', action: 'create' },
    { name: 'assets.update', resource: 'assets', action: 'update' },
    { name: 'assets.delete', resource: 'assets', action: 'delete' },

    // Finance
    { name: 'finance.view_costs', resource: 'finance', action: 'view_costs' },
    { name: 'finance.create_cost', resource: 'finance', action: 'create_cost' },
    {
      name: 'finance.approve_cost',
      resource: 'finance',
      action: 'approve_cost',
    },

    // Reports
    { name: 'reports.view', resource: 'reports', action: 'view' },
    { name: 'reports.export', resource: 'reports', action: 'export' },
  ];

  console.log('Creating permissions...');
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log(`✅ Created ${permissions.length} permissions`);

  // 2. Create Roles
  const superAdminRole = await prisma.role.upsert({
    where: { slug: 'super-admin' },
    update: {},
    create: {
      name: 'Super Admin',
      slug: 'super-admin',
      description: 'Full system access',
      isSystemRole: true,
      priority: 100,
    },
  });

  const hrManagerRole = await prisma.role.upsert({
    where: { slug: 'hr-manager' },
    update: {},
    create: {
      name: 'HR Manager',
      slug: 'hr-manager',
      description: 'Human Resources Management',
      isSystemRole: true,
      priority: 80,
    },
  });

  const financeManagerRole = await prisma.role.upsert({
    where: { slug: 'finance-manager' },
    update: {},
    create: {
      name: 'Finance Manager',
      slug: 'finance-manager',
      description: 'Financial Operations Management',
      isSystemRole: true,
      priority: 80,
    },
  });

  console.log('✅ Created system roles');

  // 3. Assign all permissions to Super Admin
  const allPermissions = await prisma.permission.findMany();

  console.log('Assigning permissions to Super Admin...');
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log(
    `✅ Assigned ${allPermissions.length} permissions to Super Admin`,
  );

  // 4. Create Super Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: {},
    create: {
      email: 'admin@erp.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+966500000000',
      isActive: true,
    },
  });

  // Assign Super Admin role
  await prisma.userRole.upsert({
    where: {
      unique_active_user_role: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
        isActive: true,
      },
    },
    update: {},
    create: {
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
      grantedBy: superAdminUser.id,
      isActive: true,
    },
  });

  console.log('✅ Created Super Admin user');
  console.log('   Email: admin@erp.com');
  console.log('   Password: admin123');

  // 5. Create Allowance Types
  const allowanceTypes = [
    { name: 'Housing Allowance', nameAr: 'بدل سكن' },
    { name: 'Transportation Allowance', nameAr: 'بدل مواصلات' },
    { name: 'Food Allowance', nameAr: 'بدل طعام' },
    { name: 'Mobile Allowance', nameAr: 'بدل جوال' },
    { name: 'Overtime', nameAr: 'عمل إضافي' },
    { name: 'Performance Bonus', nameAr: 'مكافأة أداء' },
  ];

  console.log('Creating allowance types...');
  for (const type of allowanceTypes) {
    await prisma.allowanceType.upsert({
      where: { name: type.name },
      update: {},
      create: {
        ...type,
        createdBy: superAdminUser.id,
      },
    });
  }
  console.log(`✅ Created ${allowanceTypes.length} allowance types`);

  // 6. Create Cost Categories
  const costCategories = [
    { name: 'Labor', nameAr: 'عمالة' },
    { name: 'Materials', nameAr: 'مواد' },
    { name: 'Equipment', nameAr: 'معدات' },
    { name: 'Maintenance', nameAr: 'صيانة' },
    { name: 'Utilities', nameAr: 'مرافق' },
    { name: 'Transportation', nameAr: 'نقل' },
    { name: 'Administrative', nameAr: 'إدارية' },
  ];

  console.log('Creating cost categories...');
  for (const category of costCategories) {
    await prisma.costCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }
  console.log(`✅ Created ${costCategories.length} cost categories`);

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**8. Update package.json**

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

---

## 📅 **Week 2: Authentication & RBAC**

### **Day 1-3: Authentication Module**

```typescript
// src/application/modules/auth/dto/login.dto.ts
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@erp.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'admin123', minimum: 6 })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

// src/application/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
```

---

**This implementation guide continues for all 18 weeks...**
**Would you like me to continue with the complete guide?**
