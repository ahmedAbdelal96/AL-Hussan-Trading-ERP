# Quick Start Guide

## 🚀 البدء السريع

### 1. التثبيت
```bash
npm install
```

### 2. إعداد قاعدة البيانات
```bash
# إنشاء database
createdb erp_db

# تشغيل migrations
npm run prisma:migrate

# Seed البيانات الأولية
npm run prisma:seed
```

### 3. إعداد Environment Variables
```bash
cp .env.example .env
# عدل الملف حسب الحاجة
```

### 4. تشغيل المشروع
```bash
npm run start:dev
```

---

## 📚 الوصول للتطبيق

- **API Base URL**: `http://localhost:9000/api/v1`
- **Swagger Docs**: `http://localhost:9000/api/v1/docs`

---

## 🔐 Authentication

### تسجيل مستخدم جديد
```bash
POST http://localhost:9000/api/v1/auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Password123!",
  "firstName": "Admin",
  "lastName": "User"
}
```

### تسجيل الدخول
```bash
POST http://localhost:9000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User"
  }
}
```

### استخدام Token
```bash
GET http://localhost:9000/api/v1/auth/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 🛡️ Authorization

### استخدام @Auth() Decorator

#### 1. Authentication فقط
```typescript
@Get()
@Auth()
findAll() {
  return 'أي مستخدم مسجل';
}
```

#### 2. Role-Based
```typescript
@Delete(':id')
@Auth({ roles: ['ADMIN', 'SUPERADMIN'] })
delete(@Param('id') id: string) {
  return 'فقط ADMIN أو SUPERADMIN';
}
```

#### 3. Permission-Based
```typescript
@Post()
@Auth({ permissions: ['products:create'] })
create(@Body() dto: CreateProductDto) {
  return 'يحتاج صلاحية products:create';
}
```

#### 4. Role + Permission
```typescript
@Put('settings')
@Auth({
  roles: ['ADMIN'],
  permissions: ['settings:update']
})
updateSettings(@Body() dto: UpdateSettingsDto) {
  return 'يحتاج ADMIN + settings:update';
}
```

#### 5. Public Endpoint
```typescript
@Post('login')
@Public()
login(@Body() loginDto: LoginDto) {
  return 'متاح للجميع';
}
```

---

## 👤 الحصول على المستخدم الحالي

```typescript
import { Auth } from '@app/auth/decorators';
import { CurrentUser } from '@app/common';
import { UserEntity } from '@app/auth/entities';

@Get('profile')
@Auth()
getProfile(@CurrentUser() user: UserEntity) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.getFullName(),
    roles: user.roles
  };
}
```

---

## 🔑 RBAC Management

### إنشاء Permission
```bash
POST http://localhost:9000/api/v1/rbac/permissions
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "resource": "products",
  "action": "create",
  "description": "إنشاء منتج جديد"
}
```

### إنشاء Role
```bash
POST http://localhost:9000/api/v1/rbac/roles
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "MANAGER",
  "description": "مدير النظام",
  "isSystemRole": false
}
```

### تعيين Permissions لـ Role
```bash
POST http://localhost:9000/api/v1/rbac/roles/{roleId}/permissions
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "permissionIds": ["uuid1", "uuid2", "uuid3"]
}
```

### تعيين Role لـ User
```bash
POST http://localhost:9000/api/v1/rbac/user-roles/assign
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "userId": "user-uuid",
  "roleId": "role-uuid"
}
```

### منح Permission مخصصة لـ User (GRANT)
```bash
POST http://localhost:9000/api/v1/rbac/user-permissions/grant
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "userId": "user-uuid",
  "permissionId": "permission-uuid",
  "reason": "حالة خاصة",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### إلغاء Permission من User (REVOKE)
```bash
POST http://localhost:9000/api/v1/rbac/user-permissions/revoke
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "userId": "user-uuid",
  "permissionId": "permission-uuid",
  "reason": "لم يعد يحتاجها"
}
```

### الحصول على Effective Permissions
```bash
GET http://localhost:9000/api/v1/rbac/user-permissions/{userId}/effective
Authorization: Bearer TOKEN
```

**Response:**
```json
{
  "userId": "uuid",
  "permissions": [
    "products:read",
    "products:create",
    "users:read"
  ],
  "sources": {
    "rolePermissions": ["products:read", "users:read"],
    "grantedPermissions": ["products:create"],
    "revokedPermissions": []
  }
}
```

---

## 📖 الصلاحيات الفعلية (Effective Permissions)

**الصيغة:**
```
Effective Permissions = (Role Permissions + GRANT) - REVOKE
```

**مثال:**
```
User له Role: EMPLOYEE
  → Role Permissions: [products:read, users:read]

تم منحه (GRANT): products:create
تم إلغاؤه (REVOKE): users:read

Effective Permissions = ([products:read, users:read] + [products:create]) - [users:read]
                      = [products:read, products:create]
```

**SUPERADMIN:**
- يتجاوز فحص الصلاحيات تلقائياً
- لكن لا يتجاوز فحص الأدوار

---

## 🎯 أمثلة واقعية

### مثال 1: Products Controller
```typescript
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { Auth } from '@app/auth/decorators';
import { CurrentUser } from '@app/common';
import { UserEntity } from '@app/auth/entities';

@Controller('products')
export class ProductsController {

  // أي مستخدم مسجل
  @Get()
  @Auth({ permissions: ['products:read'] })
  findAll() {
    return 'جميع المنتجات';
  }

  // يحتاج صلاحية products:create
  @Post()
  @Auth({ permissions: ['products:create'] })
  create(@Body() dto: any) {
    return 'إنشاء منتج';
  }

  // يحتاج صلاحية products:update
  @Put(':id')
  @Auth({ permissions: ['products:update'] })
  update(@Param('id') id: string) {
    return 'تحديث منتج';
  }

  // يحتاج ADMIN + products:delete
  @Delete(':id')
  @Auth({
    roles: ['ADMIN', 'SUPERADMIN'],
    permissions: ['products:delete']
  })
  delete(@Param('id') id: string) {
    return 'حذف منتج';
  }

  // الحصول على المفضلة
  @Get('my-favorites')
  @Auth({ permissions: ['products:read'] })
  getMyFavorites(@CurrentUser() user: UserEntity) {
    return {
      userId: user.id,
      favorites: []
    };
  }
}
```

### مثال 2: Users Controller
```typescript
@Controller('users')
export class UsersController {

  @Get()
  @Auth({ permissions: ['users:read'] })
  findAll() {
    return 'جميع المستخدمين';
  }

  @Post()
  @Auth({
    roles: ['ADMIN', 'SUPERADMIN'],
    permissions: ['users:create']
  })
  create(@Body() dto: any) {
    return 'إنشاء مستخدم';
  }

  @Delete(':id')
  @Auth({
    roles: ['SUPERADMIN'],
    permissions: ['users:delete']
  })
  delete(@Param('id') id: string) {
    return 'حذف مستخدم';
  }

  @Post(':id/reset-password')
  @Auth({ roles: ['SUPERADMIN'] })
  resetPassword(@Param('id') id: string) {
    return 'إعادة تعيين كلمة المرور';
  }
}
```

---

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage
```bash
npm run test:cov
```

---

## 📁 Project Structure

```
src/
├── application/
│   ├── common/              # Shared Components
│   │   ├── decorators/      # @CurrentUser(), @Public()
│   │   ├── guards/          # JwtAccessGuard, RolesGuard, etc.
│   │   └── common.module.ts
│   └── modules/
│       ├── auth/            # Authentication
│       └── rbac/            # Authorization (Roles & Permissions)
├── infrastructure/
│   ├── database/            # Prisma
│   ├── logger/              # Winston
│   └── config/              # Configuration
└── shared/                  # Utilities
```

---

## 📚 المزيد من التوثيق

- [Project Structure](./PROJECT_STRUCTURE.md) - هيكل المشروع الكامل
- [Common Module](./src/application/common/README.md) - Shared Components
- [Auth Decorator Usage](./src/application/modules/auth/docs/auth-decorator-usage.md) - دليل @Auth()
- [Auth Examples](./src/application/modules/auth/docs/auth-examples.ts) - أمثلة كاملة

---

## 🛠️ الأوامر المفيدة

```bash
# Development
npm run start:dev         # تشغيل dev mode

# Build
npm run build            # بناء المشروع
npm run start:prod       # تشغيل production

# Database
npm run prisma:migrate   # تشغيل migrations
npm run prisma:seed      # seed البيانات
npm run prisma:studio    # فتح Prisma Studio

# Code Quality
npm run lint             # فحص الكود
npm run format           # تنسيق الكود

# Tests
npm run test            # unit tests
npm run test:e2e        # e2e tests
npm run test:cov        # coverage
```

---

## ❓ الأسئلة الشائعة

### كيف أضيف module جديد؟
```bash
nest g module application/modules/my-module
nest g controller application/modules/my-module
nest g service application/modules/my-module
```

### كيف أستخدم @Auth() في module جديد؟
```typescript
import { Auth } from '@app/auth/decorators';
import { CurrentUser } from '@app/common';

@Controller('my-resource')
export class MyController {
  @Get()
  @Auth({ permissions: ['my-resource:read'] })
  findAll(@CurrentUser() user: UserEntity) {
    // ...
  }
}
```

### كيف أضيف Permission جديد؟
1. أنشئ Permission عبر API
2. عين Permission لـ Role
3. استخدمه في Controller:
```typescript
@Auth({ permissions: ['my-new-permission'] })
```

---

## 📞 المساعدة

إذا واجهت أي مشكلة:
1. راجع [Swagger Docs](http://localhost:9000/api/v1/docs)
2. راجع [Project Structure](./PROJECT_STRUCTURE.md)
3. راجع [Auth Examples](./src/application/modules/auth/docs/auth-examples.ts)

---

**🎉 جاهز للبدء! Happy Coding! 🚀**
