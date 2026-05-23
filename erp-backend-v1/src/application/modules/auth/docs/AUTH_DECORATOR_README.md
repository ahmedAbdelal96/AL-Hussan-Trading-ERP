# @Auth Decorator - دليل الاستخدام الشامل

## 🎯 نظرة عامة

الـ `@Auth()` decorator هو **decorator موحد** لإدارة المصادقة والتفويض (Authentication & Authorization) في المشروع.

بدلاً من استخدام decorators متعددة مثل:
```typescript
@UseGuards(JwtAuthGuard)
@UseGuards(RolesGuard)
@UseGuards(PermissionsGuard)
@RequireRoles(['ADMIN'])
@RequirePermissions(['users:create'])
```

الآن استخدم decorator واحد فقط:
```typescript
@Auth({ roles: ['ADMIN'], permissions: ['users:create'] })
```

---

## ✨ المميزات

- ✅ **Unified** - decorator واحد بدلاً من decorators متعددة
- ✅ **Flexible** - يدعم Roles و Permissions معاً أو منفصلين
- ✅ **Smart** - SUPERADMIN يتجاوز فحص الصلاحيات تلقائياً
- ✅ **Effective Permissions** - يحسب الصلاحيات الفعلية: `(Role Permissions + GRANT) - REVOKE`
- ✅ **TypeScript Support** - دعم كامل للـ TypeScript
- ✅ **Easy to Use** - سهل الاستخدام والفهم

---

## 📦 التثبيت والإعداد

### 1. الملفات المطلوبة

الـ `@Auth()` decorator يستخدم الملفات التالية:

```
src/application/modules/auth/
├── decorators/
│   └── auth.decorator.ts          # الـ decorator الرئيسي
├── guards/
│   ├── jwt-access.guard.ts        # المصادقة بـ JWT
│   ├── roles.guard.ts             # فحص الأدوار
│   └── permissions.guard.ts       # فحص الصلاحيات
└── auth.module.ts                 # تسجيل الـ Guards
```

### 2. AuthModule Setup

تأكد من أن الـ `AuthModule` يستورد `RbacModule`:

```typescript
@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
    RbacModule, // ✅ مهم لـ PermissionResolverService
    // ...
  ],
  providers: [
    RolesGuard,
    PermissionsGuard,
    // ...
  ],
  exports: [
    RolesGuard,
    PermissionsGuard,
    // ...
  ],
})
export class AuthModule {}
```

---

## 🚀 الاستخدام

### الاستيراد
```typescript
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
```

### الأنواع المختلفة للاستخدام

#### 1️⃣ Authentication فقط (تسجيل دخول مطلوب)
```typescript
@Get('profile')
@Auth() // ✅ فقط المستخدمين المسجلين
getProfile() {
  return 'يمكن لأي مستخدم مسجل الوصول';
}
```

#### 2️⃣ Role-Based Access
```typescript
@Delete('users/:id')
@Auth({ roles: ['ADMIN', 'SUPERADMIN'] })
deleteUser() {
  return 'فقط ADMIN أو SUPERADMIN';
}
```

#### 3️⃣ Permission-Based Access
```typescript
@Post('products')
@Auth({ permissions: ['products:create'] })
createProduct() {
  return 'يحتاج صلاحية products:create';
}
```

#### 4️⃣ Multiple Permissions
```typescript
@Get('reports/financial')
@Auth({
  permissions: ['reports:read', 'financial:access']
})
getFinancialReport() {
  return 'يحتاج كل الصلاحيات';
}
```

#### 5️⃣ Roles + Permissions
```typescript
@Put('settings/system')
@Auth({
  roles: ['ADMIN', 'SUPERADMIN'],
  permissions: ['settings:update']
})
updateSystemSettings() {
  return 'يحتاج ADMIN/SUPERADMIN + صلاحية settings:update';
}
```

#### 6️⃣ Public Endpoints
```typescript
@Post('login')
@Public() // ✅ متاح للجميع (بدون مصادقة)
login() {
  return 'متاح للجميع';
}
```

#### 7️⃣ Get Current User
```typescript
@Get('my-profile')
@Auth()
getMyProfile(@CurrentUser() user: UserEntity) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.getFullName(),
  };
}
```

---

## 🔒 كيف يعمل؟

### ترتيب تنفيذ الـ Guards

عند استخدام `@Auth()`, يتم تنفيذ الـ Guards بالترتيب التالي:

```
Request → JwtAccessGuard → RolesGuard → PermissionsGuard → Controller
           ↓                 ↓            ↓
         Authentication    Role Check   Permission Check
```

### 1. **JwtAccessGuard** (المصادقة)
- يتحقق من وجود JWT token صحيح في الـ Header
- يفك تشفير الـ token ويحمل معلومات المستخدم
- يضع المستخدم في `request.user`
- إذا فشل → **401 Unauthorized**

### 2. **RolesGuard** (فحص الأدوار)
```typescript
@Auth({ roles: ['ADMIN', 'MANAGER'] })
```
- يتحقق من أن المستخدم لديه **واحد على الأقل** من الأدوار المطلوبة
- إذا لم تحدد `roles`, يتم تجاوز هذا الـ Guard
- إذا فشل → **403 Forbidden** (Required roles: ADMIN, MANAGER)

### 3. **PermissionsGuard** (فحص الصلاحيات)
```typescript
@Auth({ permissions: ['users:create', 'users:update'] })
```
- يتحقق من أن المستخدم لديه **جميع** الصلاحيات المطلوبة
- يحسب الصلاحيات الفعلية: `(Role Permissions + GRANT) - REVOKE`
- **SUPERADMIN يتجاوز فحص الصلاحيات تلقائياً**
- إذا لم تحدد `permissions`, يتم تجاوز هذا الـ Guard
- إذا فشل → **403 Forbidden** (Missing permissions: users:create)

---

## 📊 الفرق بين Roles و Permissions

| **Feature** | **Roles** | **Permissions** |
|------------|-----------|-----------------|
| **النوع** | ثابتة (SUPERADMIN, ADMIN, USER) | ديناميكية (users:create, products:read) |
| **الصيغة** | نص بسيط (ADMIN) | resource:action (users:create) |
| **التحقق** | واحد على الأقل | جميع الصلاحيات |
| **المصدر** | UserRole table | Role Permissions + Custom Permissions |
| **SUPERADMIN Bypass** | ❌ لا | ✅ نعم |

### متى تستخدم Roles؟
- للعمليات الإدارية الحساسة
- عندما تحتاج دور محدد (مثل SUPERADMIN فقط)
- للعمليات التي تتطلب مستوى إداري محدد

```typescript
@Delete('system/reset-all')
@Auth({ roles: ['SUPERADMIN'] })
resetSystem() {
  // فقط SUPERADMIN
}
```

### متى تستخدم Permissions؟
- لعمليات CRUD العادية
- للتحكم الدقيق في الصلاحيات
- عندما تريد مرونة أكثر في إدارة الصلاحيات

```typescript
@Post('products')
@Auth({ permissions: ['products:create'] })
createProduct() {
  // أي مستخدم لديه صلاحية products:create
}
```

### متى تجمع بينهما؟
- للعمليات الحساسة جداً
- عندما تريد قيد مزدوج (دور + صلاحية)

```typescript
@Post('invoices/:id/approve')
@Auth({
  roles: ['MANAGER', 'ADMIN'],
  permissions: ['invoices:approve']
})
approveInvoice() {
  // يجب أن يكون MANAGER أو ADMIN + لديه صلاحية invoices:approve
}
```

---

## 🎭 SUPERADMIN Bypass

المستخدم الذي لديه دور `SUPERADMIN` **يتجاوز فحص الصلاحيات تلقائياً**:

```typescript
// ✅ SUPERADMIN يمكنه الوصول بدون الصلاحية
@Delete('products/:id')
@Auth({ permissions: ['products:delete'] })
deleteProduct() {
  // SUPERADMIN ✅ يمكنه الحذف (حتى بدون الصلاحية)
  // المستخدمين الآخرين ❌ يحتاجون الصلاحية
}

// ❌ SUPERADMIN لا يتجاوز فحص الأدوار
@Post('create-admin')
@Auth({ roles: ['SUPERADMIN'] })
createAdmin() {
  // فقط SUPERADMIN (لا يتم تجاوزه لأنه role check)
}
```

**ملاحظة مهمة:**
- SUPERADMIN يتجاوز **فحص الصلاحيات فقط**
- لا يتجاوز **فحص الأدوار**
- لا يتجاوز **المصادقة** (يجب أن يكون مسجل دخول)

---

## 🧮 حساب الصلاحيات الفعلية

الصلاحيات الفعلية للمستخدم تحسب بالمعادلة:

```
Effective Permissions = (Role Permissions + GRANT) - REVOKE
```

### مثال عملي:

```typescript
// المستخدم لديه دور MANAGER
Role Permissions = ['products:read', 'products:create', 'products:update']

// تم منحه صلاحية إضافية (GRANT)
GRANT = ['products:delete']

// تم إلغاء صلاحية منه (REVOKE)
REVOKE = ['products:update']

// الصلاحيات الفعلية:
Effective = ['products:read', 'products:create', 'products:delete']
```

**REVOKE له الأولوية على كل شيء!**

### كيف يتم الحساب؟

يتم الحساب تلقائياً بواسطة `PermissionResolverService`:

```typescript
// في PermissionsGuard
const effectivePermissions = await this.permissionResolverService
  .resolveUserEffectivePermissions(userId);

// effectivePermissions = Set<string>
// مثال: Set(['products:read', 'products:create', 'products:delete'])
```

---

## 🔍 رسائل الخطأ

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
**السبب:**
- لا يوجد JWT token في الـ Header
- الـ token غير صحيح أو منتهي الصلاحية
- الـ token تم التلاعب به

**الحل:**
- أرسل token صحيح في الـ Header: `Authorization: Bearer <token>`
- سجل دخول مرة أخرى للحصول على token جديد

---

### 403 Forbidden - Roles
```json
{
  "statusCode": 403,
  "message": "Access denied. Required roles: ADMIN, SUPERADMIN"
}
```
**السبب:**
- المستخدم ليس لديه أحد الأدوار المطلوبة
- المستخدم مسجل دخول لكن ليس لديه الصلاحية الكافية

**الحل:**
- تأكد من أن المستخدم لديه الدور المطلوب
- اطلب من SUPERADMIN تعيين الدور المناسب

---

### 403 Forbidden - Permissions
```json
{
  "statusCode": 403,
  "message": "Access denied. Missing permissions: products:delete, products:update"
}
```
**السبب:**
- المستخدم ليس لديه الصلاحيات المطلوبة
- الصلاحيات تم إلغاؤها (REVOKE)

**الحل:**
- اطلب من SUPERADMIN منح الصلاحيات المطلوبة
- تحقق من أن الصلاحيات لم يتم إلغاؤها (REVOKE)

---

## ✅ Best Practices

### 1. استخدم Permissions للـ CRUD
```typescript
// ✅ جيد
@Get()
@Auth({ permissions: ['users:read'] })

@Post()
@Auth({ permissions: ['users:create'] })

@Put(':id')
@Auth({ permissions: ['users:update'] })

@Delete(':id')
@Auth({ permissions: ['users:delete'] })
```

### 2. استخدم Roles للعمليات الإدارية
```typescript
// ✅ جيد
@Post('system/backup')
@Auth({ roles: ['SUPERADMIN'] })

@Delete('system/reset')
@Auth({ roles: ['SUPERADMIN'] })
```

### 3. اجمع بينهما للعمليات الحساسة
```typescript
// ✅ جيد
@Post('financial/approve-payment')
@Auth({
  roles: ['MANAGER', 'ADMIN'],
  permissions: ['financial:approve-payment']
})
```

### 4. استخدم @Public() فقط للمسارات العامة
```typescript
// ✅ جيد
@Post('login')
@Public()

@Post('register')
@Public()

// ❌ سيء
@Get('sensitive-data')
@Public() // لا تفعل هذا!
```

### 5. لا تترك endpoints بدون حماية
```typescript
// ❌ سيء
@Get('users')
findAll() {
  // غير محمي!
}

// ✅ جيد
@Get('users')
@Auth({ permissions: ['users:read'] })
findAll() {
  // محمي
}
```

---

## 📝 أمثلة كاملة

### مثال 1: Products CRUD
```typescript
@Controller('products')
export class ProductsController {

  @Get()
  @Auth({ permissions: ['products:read'] })
  findAll() {}

  @Get(':id')
  @Auth({ permissions: ['products:read'] })
  findOne(@Param('id') id: string) {}

  @Post()
  @Auth({ permissions: ['products:create'] })
  create(@Body() createDto: CreateProductDto) {}

  @Put(':id')
  @Auth({ permissions: ['products:update'] })
  update(@Param('id') id: string, @Body() updateDto: UpdateProductDto) {}

  @Delete(':id')
  @Auth({
    roles: ['ADMIN', 'SUPERADMIN'],
    permissions: ['products:delete']
  })
  remove(@Param('id') id: string) {}
}
```

### مثال 2: Auth Controller
```typescript
@Controller('auth')
export class AuthController {

  @Post('login')
  @Public()
  login(@Body() loginDto: LoginDto) {}

  @Post('register')
  @Public()
  register(@Body() registerDto: RegisterDto) {}

  @Get('profile')
  @Auth()
  getProfile(@CurrentUser() user: UserEntity) {}

  @Put('change-password')
  @Auth()
  changePassword(@CurrentUser() user: UserEntity, @Body() dto: ChangePasswordDto) {}
}
```

### مثال 3: Admin Controller
```typescript
@Controller('admin')
export class AdminController {

  @Get('dashboard')
  @Auth({ roles: ['ADMIN', 'SUPERADMIN'] })
  getDashboard() {}

  @Post('users/:id/reset-password')
  @Auth({ roles: ['ADMIN', 'SUPERADMIN'] })
  resetUserPassword(@Param('id') id: string) {}

  @Delete('cache')
  @Auth({ roles: ['SUPERADMIN'] })
  clearCache() {}

  @Post('system/backup')
  @Auth({ roles: ['SUPERADMIN'] })
  createBackup() {}
}
```

---

## 🎓 الخلاصة

الـ `@Auth()` decorator يوفر طريقة **موحدة، بسيطة، ومرنة** لإدارة المصادقة والتفويض:

| الاستخدام | الكود |
|-----------|-------|
| تسجيل دخول فقط | `@Auth()` |
| فحص دور واحد | `@Auth({ roles: ['ADMIN'] })` |
| فحص عدة أدوار | `@Auth({ roles: ['ADMIN', 'MANAGER'] })` |
| فحص صلاحية واحدة | `@Auth({ permissions: ['users:create'] })` |
| فحص عدة صلاحيات | `@Auth({ permissions: ['users:create', 'users:update'] })` |
| دور + صلاحية | `@Auth({ roles: ['ADMIN'], permissions: ['users:delete'] })` |
| مسار عام | `@Public()` |

**تذكر:**
- ✅ **Roles** → واحد على الأقل
- ✅ **Permissions** → جميع الصلاحيات
- ✅ **SUPERADMIN** → يتجاوز فحص الصلاحيات
- ✅ **Formula** → `(Role Permissions + GRANT) - REVOKE`

**Happy Coding! 🚀**
