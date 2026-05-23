# @Auth Decorator - دليل الاستخدام

## نظرة عامة

الـ `@Auth()` decorator هو decorator موحد لإدارة المصادقة والتفويض (Authentication & Authorization) في المشروع.

### المميزات
- ✅ **Unified** - decorator واحد بدلاً من decorators متعددة
- ✅ **Flexible** - يدعم Roles و Permissions
- ✅ **Smart** - SUPERADMIN يتجاوز فحص الصلاحيات تلقائياً
- ✅ **Effective Permissions** - يحسب الصلاحيات الفعلية: `(Role Permissions + GRANT) - REVOKE`

---

## الاستخدام الأساسي

### 1. Authentication فقط (تسجيل دخول مطلوب)
```typescript
import { Auth } from '../auth/decorators/auth.decorator';

@Controller('products')
export class ProductsController {

  @Get()
  @Auth() // فقط المستخدمين المسجلين
  findAll() {
    return 'يمكن لأي مستخدم مسجل الوصول';
  }
}
```

---

### 2. Role-Based Access (حسب الدور)
```typescript
@Controller('admin')
export class AdminController {

  @Get('dashboard')
  @Auth({ roles: ['ADMIN', 'SUPERADMIN'] })
  getDashboard() {
    return 'فقط ADMIN أو SUPERADMIN';
  }

  @Delete('users/:id')
  @Auth({ roles: ['SUPERADMIN'] })
  deleteUser() {
    return 'فقط SUPERADMIN';
  }
}
```

---

### 3. Permission-Based Access (حسب الصلاحيات)
```typescript
@Controller('products')
export class ProductsController {

  @Get()
  @Auth({ permissions: ['products:read'] })
  findAll() {
    return 'يحتاج صلاحية products:read';
  }

  @Post()
  @Auth({ permissions: ['products:create'] })
  create() {
    return 'يحتاج صلاحية products:create';
  }

  @Put(':id')
  @Auth({ permissions: ['products:update'] })
  update() {
    return 'يحتاج صلاحية products:update';
  }

  @Delete(':id')
  @Auth({ permissions: ['products:delete'] })
  delete() {
    return 'يحتاج صلاحية products:delete';
  }
}
```

---

### 4. Multiple Permissions (صلاحيات متعددة)
```typescript
@Controller('reports')
export class ReportsController {

  @Get('financial')
  @Auth({
    permissions: ['reports:read', 'financial:access']
  })
  getFinancialReport() {
    // المستخدم يجب أن يكون عنده كل الصلاحيات
    return 'يحتاج reports:read و financial:access';
  }
}
```

---

### 5. Combining Roles + Permissions
```typescript
@Controller('settings')
export class SettingsController {

  @Put('system')
  @Auth({
    roles: ['ADMIN', 'SUPERADMIN'],
    permissions: ['settings:update']
  })
  updateSystemSettings() {
    // يجب أن يكون ADMIN أو SUPERADMIN
    // و عنده صلاحية settings:update
    return 'محمي بـ role و permission';
  }
}
```

---

### 6. Public Endpoints (مسارات عامة)
```typescript
import { Public } from '../auth/decorators/public.decorator';

@Controller('auth')
export class AuthController {

  @Post('login')
  @Public() // لا يحتاج تسجيل دخول
  login() {
    return 'متاح للجميع';
  }

  @Post('register')
  @Public()
  register() {
    return 'متاح للجميع';
  }

  @Get('profile')
  @Auth() // يحتاج تسجيل دخول
  getProfile() {
    return 'فقط للمستخدمين المسجلين';
  }
}
```

---

## كيف يعمل الـ Guard؟

### 1. **JwtAuthGuard** (المصادقة)
- يتحقق من وجود JWT token صحيح
- يحمل معلومات المستخدم ويضعها في `request.user`

### 2. **RolesGuard** (فحص الأدوار)
- يتحقق من أن المستخدم لديه **واحد على الأقل** من الأدوار المطلوبة
- إذا لم تحدد أدوار، يتم تجاوزه

### 3. **PermissionsGuard** (فحص الصلاحيات)
- يتحقق من أن المستخدم لديه **جميع** الصلاحيات المطلوبة
- يحسب الصلاحيات الفعلية باستخدام: `(Role Permissions + GRANT) - REVOKE`
- SUPERADMIN يتجاوز فحص الصلاحيات تلقائياً
- إذا لم تحدد صلاحيات، يتم تجاوزه

---

## أمثلة واقعية

### مثال 1: نظام إدارة المستخدمين
```typescript
@Controller('users')
export class UsersController {

  @Get()
  @Auth({ permissions: ['users:read'] })
  findAll() {
    // أي مستخدم لديه صلاحية users:read
  }

  @Post()
  @Auth({
    roles: ['ADMIN', 'SUPERADMIN'],
    permissions: ['users:create']
  })
  create() {
    // يجب أن يكون ADMIN أو SUPERADMIN + لديه users:create
  }

  @Put(':id')
  @Auth({ permissions: ['users:update'] })
  update() {
    // أي مستخدم لديه users:update
  }

  @Delete(':id')
  @Auth({
    roles: ['SUPERADMIN'],
    permissions: ['users:delete']
  })
  delete() {
    // فقط SUPERADMIN + لديه users:delete
  }

  @Post(':id/reset-password')
  @Auth({ roles: ['ADMIN', 'SUPERADMIN'] })
  resetPassword() {
    // فقط ADMIN أو SUPERADMIN
  }
}
```

### مثال 2: نظام إدارة المشاريع
```typescript
@Controller('projects')
export class ProjectsController {

  @Get()
  @Auth({ permissions: ['projects:read'] })
  findAll() {}

  @Post()
  @Auth({
    roles: ['MANAGER', 'ADMIN'],
    permissions: ['projects:create']
  })
  create() {}

  @Put(':id/status')
  @Auth({ permissions: ['projects:update-status'] })
  updateStatus() {}

  @Delete(':id')
  @Auth({
    roles: ['ADMIN', 'SUPERADMIN'],
    permissions: ['projects:delete']
  })
  delete() {}
}
```

### مثال 3: نظام مالي
```typescript
@Controller('invoices')
export class InvoicesController {

  @Get()
  @Auth({ permissions: ['invoices:read'] })
  findAll() {}

  @Post()
  @Auth({
    roles: ['ACCOUNTANT', 'ADMIN'],
    permissions: ['invoices:create']
  })
  create() {}

  @Post(':id/approve')
  @Auth({
    roles: ['MANAGER', 'ADMIN'],
    permissions: ['invoices:approve']
  })
  approve() {}

  @Get('reports/monthly')
  @Auth({
    permissions: ['invoices:read', 'reports:financial']
  })
  getMonthlyReport() {}
}
```

---

## الحصول على المستخدم الحالي

استخدم الـ `@CurrentUser()` decorator للحصول على معلومات المستخدم:

```typescript
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../auth/entities/user.entity';

@Controller('profile')
export class ProfileController {

  @Get()
  @Auth()
  getProfile(@CurrentUser() user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.getFullName(),
      roles: user.roles,
    };
  }

  @Put()
  @Auth({ permissions: ['profile:update'] })
  updateProfile(
    @CurrentUser() user: UserEntity,
    @Body() updateDto: UpdateProfileDto,
  ) {
    // user.id متاح هنا
    return this.profileService.update(user.id, updateDto);
  }
}
```

---

## الفرق بين Roles و Permissions

### Roles (الأدوار)
- أدوار ثابتة في النظام (SUPERADMIN, ADMIN, MANAGER, USER, etc.)
- المستخدم يمكن أن يكون لديه **دور واحد أو أكثر**
- للتحقق: المستخدم يجب أن يكون لديه **واحد على الأقل** من الأدوار المطلوبة

### Permissions (الصلاحيات)
- صلاحيات ديناميكية بصيغة `resource:action`
- تأتي من **الأدوار** + **GRANT** - **REVOKE**
- للتحقق: المستخدم يجب أن يكون لديه **جميع** الصلاحيات المطلوبة

---

## SUPERADMIN Bypass

المستخدم الذي لديه دور `SUPERADMIN` يتجاوز فحص الصلاحيات تلقائياً:

```typescript
@Controller('admin')
export class AdminController {

  @Delete('dangerous-operation')
  @Auth({ permissions: ['admin:dangerous-operation'] })
  dangerousOperation() {
    // SUPERADMIN يمكنه الوصول حتى بدون الصلاحية
    // المستخدمين الآخرين يحتاجون الصلاحية
  }

  @Post('create-superadmin')
  @Auth({ roles: ['SUPERADMIN'] })
  createSuperadmin() {
    // فقط SUPERADMIN (لا يتم تجاوزه لأنه role check)
  }
}
```

---

## رسائل الخطأ

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
**السبب**: لا يوجد JWT token أو token غير صحيح

### 403 Forbidden - Roles
```json
{
  "statusCode": 403,
  "message": "Access denied. Required roles: ADMIN, SUPERADMIN"
}
```
**السبب**: المستخدم ليس لديه الدور المطلوب

### 403 Forbidden - Permissions
```json
{
  "statusCode": 403,
  "message": "Access denied. Missing permissions: products:delete, products:update"
}
```
**السبب**: المستخدم ليس لديه الصلاحيات المطلوبة

---

## Best Practices

### 1. ✅ استخدم Permissions للـ CRUD Operations
```typescript
@Get()
@Auth({ permissions: ['users:read'] })

@Post()
@Auth({ permissions: ['users:create'] })

@Put(':id')
@Auth({ permissions: ['users:update'] })

@Delete(':id')
@Auth({ permissions: ['users:delete'] })
```

### 2. ✅ استخدم Roles للعمليات الإدارية
```typescript
@Post('reset-all-passwords')
@Auth({ roles: ['SUPERADMIN'] })

@Delete('delete-all-data')
@Auth({ roles: ['SUPERADMIN'] })
```

### 3. ✅ اجمع بين Roles + Permissions للعمليات الحساسة
```typescript
@Post('financial/approve-payment')
@Auth({
  roles: ['MANAGER', 'ADMIN'],
  permissions: ['financial:approve-payment']
})
```

### 4. ✅ استخدم `@Public()` للمسارات العامة فقط
```typescript
@Post('login')
@Public()

@Post('register')
@Public()

@Get('public/announcements')
@Public()
```

### 5. ❌ لا تستخدم `@Auth()` بدون معاملات في كل المسارات
```typescript
// ❌ سيء
@Get()
@Auth() // أي مستخدم مسجل

// ✅ جيد
@Get()
@Auth({ permissions: ['users:read'] }) // صلاحية محددة
```

---

## الخلاصة

الـ `@Auth()` decorator يوفر طريقة موحدة وبسيطة لإدارة المصادقة والتفويض:

- **`@Auth()`** - تسجيل دخول فقط
- **`@Auth({ roles: [...] })`** - فحص الأدوار
- **`@Auth({ permissions: [...] })`** - فحص الصلاحيات
- **`@Auth({ roles: [...], permissions: [...] })`** - كلاهما
- **`@Public()`** - بدون مصادقة

**الصلاحيات الفعلية = (Role Permissions + GRANT) - REVOKE**

**SUPERADMIN يتجاوز فحص الصلاحيات تلقائياً! 🚀**
