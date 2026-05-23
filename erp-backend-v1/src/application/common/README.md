# Common Module

## نظرة عامة

هذا الـ module يحتوي على الـ **Shared Components** المستخدمة في جميع أنحاء التطبيق.

تم تصميمه كـ **Global Module** بحيث تكون جميع exports متاحة في كل modules بدون الحاجة لاستيراده.

---

## الهيكل

```
common/
├── decorators/          # Shared Decorators
│   ├── current-user.decorator.ts
│   ├── public.decorator.ts
│   └── index.ts
├── guards/             # Authorization Guards
│   ├── jwt-access.guard.ts
│   ├── roles.guard.ts
│   ├── permissions.guard.ts
│   └── index.ts
├── filters/            # Exception Filters (قريباً)
├── interceptors/       # Response Interceptors (قريباً)
├── pipes/              # Validation Pipes (قريباً)
├── interfaces/         # Shared Interfaces (قريباً)
├── common.module.ts    # Module Definition
├── index.ts            # Barrel Export
└── README.md          # هذا الملف
```

---

## المكونات

### 1. Decorators

#### `@CurrentUser()`
للحصول على معلومات المستخدم الحالي:
```typescript
import { CurrentUser } from '@app/common';

@Get('profile')
@Auth()
getProfile(@CurrentUser() user: UserEntity) {
  return user;
}
```

#### `@Public()`
لجعل endpoint عام (بدون authentication):
```typescript
import { Public } from '@app/common';

@Post('login')
@Public()
login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

---

### 2. Guards

#### `JwtAccessGuard`
- يتحقق من صحة JWT access token
- يحترم `@Public()` decorator
- يستخرج معلومات المستخدم من token

#### `RolesGuard`
- يتحقق من أن المستخدم لديه **واحد على الأقل** من الأدوار المطلوبة
- يستخدم مع `@Auth({ roles: [...] })`

#### `PermissionsGuard`
- يتحقق من أن المستخدم لديه **جميع** الصلاحيات المطلوبة
- يحسب الصلاحيات الفعلية: `(Role Permissions + GRANT) - REVOKE`
- SUPERADMIN يتجاوز فحص الصلاحيات تلقائياً
- يستخدم مع `@Auth({ permissions: [...] })`

---

## الاستخدام

### Import في Module

لا تحتاج لاستيراد `CommonModule` في modules أخرى لأنه **Global Module**.

فقط استخدم الـ components مباشرة:

```typescript
import { Auth } from '@app/auth/decorators';
import { CurrentUser, Public } from '@app/common';
```

---

### أمثلة

#### مثال 1: Endpoint محمي بـ Authentication فقط
```typescript
@Get('dashboard')
@Auth()
getDashboard(@CurrentUser() user: UserEntity) {
  return { message: 'Welcome ' + user.email };
}
```

#### مثال 2: Endpoint محمي بـ Role
```typescript
@Delete('users/:id')
@Auth({ roles: ['ADMIN', 'SUPERADMIN'] })
deleteUser(@Param('id') id: string) {
  return this.usersService.delete(id);
}
```

#### مثال 3: Endpoint محمي بـ Permission
```typescript
@Post('products')
@Auth({ permissions: ['products:create'] })
createProduct(@Body() dto: CreateProductDto) {
  return this.productsService.create(dto);
}
```

#### مثال 4: Endpoint محمي بـ Role + Permission
```typescript
@Post('settings/system')
@Auth({
  roles: ['ADMIN', 'SUPERADMIN'],
  permissions: ['settings:update']
})
updateSystemSettings(@Body() dto: UpdateSettingsDto) {
  return this.settingsService.update(dto);
}
```

#### مثال 5: Public Endpoint
```typescript
@Post('auth/login')
@Public()
login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

---

## كيف يعمل؟

### 1. Guard Execution Order

عند استخدام `@Auth()` decorator، يتم تنفيذ Guards بالترتيب:

```
1. JwtAccessGuard   → يتحقق من JWT token
2. RolesGuard       → يتحقق من الأدوار
3. PermissionsGuard → يتحقق من الصلاحيات
```

### 2. Metadata

الـ `@Auth()` decorator يضع metadata:
```typescript
@Auth({ roles: ['ADMIN'], permissions: ['users:create'] })
// يضع:
// - auth:roles = ['ADMIN']
// - auth:permissions = ['users:create']
```

### 3. Guards تقرأ Metadata

كل guard يقرأ الـ metadata الخاص به:
```typescript
// RolesGuard
const requiredRoles = reflector.get('auth:roles', ...);

// PermissionsGuard
const requiredPermissions = reflector.get('auth:permissions', ...);
```

---

## Best Practices

### ✅ استخدم Common Components

بدلاً من إنشاء decorators/guards مكررة:
```typescript
// ❌ سيء
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// ✅ جيد
import { JwtAccessGuard } from '@app/common';
```

### ✅ استخدم Barrel Exports

```typescript
// ✅ جيد
import { JwtAccessGuard, RolesGuard, CurrentUser } from '@app/common';

// ❌ سيء
import { JwtAccessGuard } from '@app/common/guards/jwt-access.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';
```

### ✅ استخدم @Auth() decorator

بدلاً من استخدام guards مباشرة:
```typescript
// ❌ سيء
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(['ADMIN'])

// ✅ جيد
@Auth({ roles: ['ADMIN'] })
```

---

## مستقبل الـ Module

### Filters (قريباً)
- `HttpExceptionFilter` - معالجة الأخطاء بشكل موحد
- `ValidationExceptionFilter` - معالجة أخطاء validation

### Interceptors (قريباً)
- `TransformInterceptor` - تحويل response format
- `LoggingInterceptor` - logging للـ requests

### Pipes (قريباً)
- `ValidationPipe` - validation موحد
- `ParseIntPipe` - تحويل parameters

---

## الخلاصة

الـ **Common Module** يوفر:
- ✅ **Reusability** - مكونات مشتركة في مكان واحد
- ✅ **Consistency** - نفس السلوك في كل التطبيق
- ✅ **Maintainability** - سهولة التعديل والصيانة
- ✅ **Global Access** - متاح في كل modules بدون import

---

**📌 ملاحظة:** هذا الـ module هو جزء من **Clean Architecture** للمشروع.
