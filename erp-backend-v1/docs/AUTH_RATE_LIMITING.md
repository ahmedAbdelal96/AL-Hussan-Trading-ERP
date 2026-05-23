# Auth Module - Login Rate Limiting & Account Locking

## نظرة عامة

تم تنفيذ نظام حماية متقدم لتسجيل الدخول يحمي من هجمات Brute Force مع نظام تدريجي للعقوبات.

## قواعد الأمان

### 1. المحاولات الفاشلة
- يتم تتبع كل محاولة تسجيل دخول فاشلة
- العداد يتم إعادة تعيينه بنجاح تسجيل الدخول

### 2. القفل المؤقت (Temporary Lock)
**الشروط:**
- بعد **5 محاولات فاشلة** متتالية
- **المرة الأولى** فقط (عندما `unlockAttemptCount = 0`)

**التأثير:**
- قفل الحساب لمدة **15 دقيقة**
- رسالة للمستخدم توضح المدة المتبقية
- يتم فك القفل تلقائياً بعد انتهاء المدة

**رسالة الخطأ:**
```
Your account has been temporarily locked for 15 minutes due to 5 failed login attempts.
```

### 3. القفل الدائم (Permanent Lock)
**الشروط:**
- بعد **5 محاولات فاشلة** متتالية
- **بعد** فك القفل المؤقت (عندما `unlockAttemptCount >= 1`)

**التأثير:**
- قفل الحساب بشكل دائم
- لا يمكن للمستخدم تسجيل الدخول نهائياً
- فقط **SUPERADMIN** يمكنه فك القفل

**رسالة الخطأ:**
```
Your account has been permanently locked due to repeated failed login attempts.
Please contact system administrator.
```

### 4. فك القفل بواسطة SUPERADMIN
- Endpoint مخصص: `POST /auth/unlock-account/:userId`
- يتطلب دور **SUPERADMIN** فقط
- يعيد تعيين جميع العدادات والأقفال
- يتم تسجيل العملية في Audit Log

---

## Database Schema Changes

### حقول جديدة في جدول `users`

```sql
-- Failed login tracking
failed_login_attempts   INTEGER   DEFAULT 0
last_failed_login_at    TIMESTAMPTZ

-- Temporary lock
locked_until            TIMESTAMPTZ

-- Permanent lock
permanently_locked      BOOLEAN   DEFAULT false
permanently_locked_at   TIMESTAMPTZ

-- Unlock tracking
unlock_attempt_count    INTEGER   DEFAULT 0
```

---

## Architecture Components

### 1. Domain Layer (Entities)

#### UserEntity - New Methods

```typescript
/**
 * Check if user can login
 * Now includes lock checks
 */
canLogin(): boolean {
  return (
    this.isActive &&
    !this.deletedAt &&
    !this.isPermanentlyLocked() &&
    !this.isTemporarilyLocked()
  );
}

/**
 * Check if account is temporarily locked
 */
isTemporarilyLocked(): boolean {
  if (!this.lockedUntil) return false;
  return new Date() < this.lockedUntil;
}

/**
 * Check if account is permanently locked
 */
isPermanentlyLocked(): boolean {
  return this.permanentlyLocked;
}

/**
 * Get remaining lock time in minutes
 */
getRemainingLockTime(): number {
  if (!this.lockedUntil) return 0;
  const diff = this.lockedUntil.getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60)));
}
```

---

### 2. Repository Layer

#### IAuthRepository - New Methods

```typescript
interface IAuthRepository {
  // ... existing methods

  // Login rate limiting operations
  incrementFailedLoginAttempts(userId: string): Promise<number>;
  resetFailedLoginAttempts(userId: string): Promise<void>;
  lockAccountTemporarily(userId: string, lockDurationMinutes: number): Promise<void>;
  lockAccountPermanently(userId: string): Promise<void>;
  unlockAccount(userId: string): Promise<void>;
}
```

#### AuthRepository - Implementation

**incrementFailedLoginAttempts:**
```typescript
async incrementFailedLoginAttempts(userId: string): Promise<number> {
  const user = await this.prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: { increment: 1 },
      lastFailedLoginAt: new Date(),
    },
  });
  return user.failedLoginAttempts;
}
```

**lockAccountTemporarily:**
```typescript
async lockAccountTemporarily(
  userId: string,
  lockDurationMinutes: number,
): Promise<void> {
  const lockedUntil = add(new Date(), { minutes: lockDurationMinutes });

  await this.prisma.user.update({
    where: { id: userId },
    data: { lockedUntil },
  });

  this.logger.warn(`User ${userId} temporarily locked until ${lockedUntil}`);
}
```

**lockAccountPermanently:**
```typescript
async lockAccountPermanently(userId: string): Promise<void> {
  const user = await this.prisma.user.update({
    where: { id: userId },
    data: {
      permanentlyLocked: true,
      permanentlyLockedAt: new Date(),
      unlockAttemptCount: { increment: 1 },
    },
  });

  this.logger.error(`User ${userId} permanently locked`);
}
```

**unlockAccount:**
```typescript
async unlockAccount(userId: string): Promise<void> {
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      permanentlyLocked: false,
      permanentlyLockedAt: null,
      lockedUntil: null,
      failedLoginAttempts: 0,
      lastFailedLoginAt: null,
    },
  });

  this.logger.log(`User ${userId} unlocked by SUPERADMIN`);
}
```

---

### 3. Service Layer

#### LoginRateLimiterService

**Configuration:**
```typescript
private readonly MAX_FAILED_ATTEMPTS = 5;
private readonly TEMPORARY_LOCK_DURATION_MINUTES = 15;
```

**validateLoginAttempt(user):**
- يتحقق من القفل الدائم
- يتحقق من القفل المؤقت
- يرمي `UnauthorizedException` مع رسالة مناسبة

**handleFailedLogin(user):**
- يزيد عداد المحاولات الفاشلة
- يقفل الحساب مؤقتاً عند الوصول لـ 5 محاولات (أول مرة)
- يقفل الحساب دائماً عند الوصول لـ 5 محاولات (ثاني مرة)

**handleSuccessfulLogin(user):**
- يعيد تعيين عداد المحاولات الفاشلة
- يزيل القفل المؤقت

---

### 4. Use Case Layer

#### LoginUseCase - Updated Flow

```typescript
async execute(loginDto, userAgent, ipAddress) {
  try {
    // 1. Find user by email
    const user = await findUserByEmail(email);

    // 2. Check rate limiting (NEW)
    await loginRateLimiter.validateLoginAttempt(user);

    // 3. Check if user can login (active, not deleted)
    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Account is inactive or deleted');
    }

    // 4. Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      // Handle failed login (NEW)
      await loginRateLimiter.handleFailedLogin(user);
    }

    // 5. Reset failed attempts on success (NEW)
    await loginRateLimiter.handleSuccessfulLogin(user);

    // 6-11. Continue with normal login flow...

  } catch (error) {
    // Log failed attempt in audit
    if (error instanceof UnauthorizedException) {
      await createAuditLog({
        userId: user.id,
        action: 'LOGIN',
        status: 'FAILED',
      });
    }
    throw error;
  }
}
```

#### UnlockAccountUseCase - New Use Case

```typescript
async execute(userId, unlockedBy) {
  // 1. Verify SUPERADMIN role
  const superadmin = await findUserWithRoles(unlockedBy);

  if (!superadmin.hasRole('SUPERADMIN')) {
    throw new ForbiddenException('Only SUPERADMIN can unlock accounts');
  }

  // 2. Check if user exists
  const user = await findUserById(userId);

  // 3. Check if account is locked
  const isLocked = user.isPermanentlyLocked() || user.isTemporarilyLocked();

  if (!isLocked) {
    return; // Already unlocked
  }

  // 4. Unlock account
  await loginRateLimiter.unlockAccount(userId);

  // 5. Create audit log
  await createAuditLog({
    userId: unlockedBy,
    action: 'UNLOCK_ACCOUNT',
    resourceId: userId,
    status: 'SUCCESS',
  });
}
```

---

### 5. Controller Layer

#### New Endpoint: Unlock Account

```typescript
/**
 * POST /auth/unlock-account/:userId
 * SUPERADMIN only
 */
@Post('unlock-account/:userId')
@UseGuards(JwtAccessGuard)
@HttpCode(HttpStatus.OK)
async unlockAccount(
  @Param('userId') userId: string,
  @CurrentUser('id') superadminId: string,
): Promise<MessageResponseDto> {
  await this.unlockAccountUseCase.execute(userId, superadminId);
  return { message: 'Account unlocked successfully' };
}
```

**Swagger Documentation:**
- Summary: "Unlock user account (SUPERADMIN only)"
- Description: "Unlocks permanently or temporarily locked account"
- Responses:
  - 200: Account unlocked successfully
  - 403: Forbidden - Only SUPERADMIN can unlock
  - 404: User not found

---

## User Experience

### سيناريو 1: أول 4 محاولات فاشلة

**Request:**
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "wrong_password"
}
```

**Response:**
```json
{
  "statusCode": 401,
  "message": "Invalid email or password. 4 attempt(s) remaining before account lock.",
  "error": "Unauthorized"
}
```

---

### سيناريو 2: المحاولة الخامسة الفاشلة (القفل المؤقت)

**Request:**
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "wrong_password"
}
```

**Response:**
```json
{
  "statusCode": 401,
  "message": "Your account has been temporarily locked for 15 minutes due to 5 failed login attempts.",
  "error": "Unauthorized"
}
```

---

### سيناريو 3: محاولة تسجيل دخول أثناء القفل المؤقت

**Request:**
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "correct_password"
}
```

**Response:**
```json
{
  "statusCode": 401,
  "message": "Your account is temporarily locked due to failed login attempts. Please try again in 12 minute(s).",
  "error": "Unauthorized"
}
```

---

### سيناريو 4: بعد فك القفل التلقائي (15 دقيقة) → 5 محاولات فاشلة مرة أخرى

**Request:**
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "wrong_password"
}
```

**Response (بعد المحاولة الخامسة):**
```json
{
  "statusCode": 401,
  "message": "Your account has been permanently locked due to repeated failed login attempts. Please contact system administrator.",
  "error": "Unauthorized"
}
```

---

### سيناريو 5: محاولة تسجيل دخول لحساب مقفول دائماً

**Request:**
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "correct_password"
}
```

**Response:**
```json
{
  "statusCode": 401,
  "message": "Your account has been permanently locked due to multiple failed login attempts. Please contact system administrator.",
  "error": "Unauthorized"
}
```

---

### سيناريو 6: SUPERADMIN يفك قفل الحساب

**Request:**
```bash
POST /auth/unlock-account/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <superadmin-access-token>
```

**Response:**
```json
{
  "message": "Account unlocked successfully"
}
```

---

## Audit Logging

جميع العمليات يتم تسجيلها في `audit_logs`:

### Failed Login Attempt
```json
{
  "userId": "user-uuid",
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "action": "LOGIN",
  "resourceType": "auth",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "status": "FAILED",
  "createdAt": "2026-01-08T21:30:00Z"
}
```

### Successful Login After Reset
```json
{
  "userId": "user-uuid",
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "action": "LOGIN",
  "resourceType": "auth",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "status": "SUCCESS",
  "createdAt": "2026-01-08T21:45:00Z"
}
```

### Account Unlock by SUPERADMIN
```json
{
  "userId": "superadmin-uuid",
  "userEmail": "superadmin@example.com",
  "userName": "Super Admin",
  "action": "UNLOCK_ACCOUNT",
  "resourceType": "user",
  "resourceId": "locked-user-uuid",
  "resourceName": "user@example.com",
  "status": "SUCCESS",
  "createdAt": "2026-01-08T22:00:00Z"
}
```

---

## Security Best Practices

### ✅ المميزات المطبقة

1. **Brute Force Protection** - حماية من هجمات التخمين
2. **Progressive Penalties** - عقوبات تدريجية (مؤقت → دائم)
3. **Automatic Unlocking** - فك القفل التلقائي للقفل المؤقت
4. **Admin Override** - SUPERADMIN يمكنه فك أي قفل
5. **Comprehensive Logging** - تسجيل كامل لكل المحاولات
6. **Clear User Messages** - رسائل واضحة للمستخدم
7. **IP & User-Agent Tracking** - تتبع الجهاز والموقع

### ⚠️ تحذيرات أمنية

1. **لا تكشف عن معلومات حساسة:**
   - رسائل الخطأ لا تكشف إذا كان البريد موجود أم لا
   - رسائل موحدة: "Invalid email or password"

2. **تتبع IP Address:**
   - يتم تسجيل IP مع كل محاولة
   - يمكن استخدامه لتتبع الهجمات

3. **Permanent Lock:**
   - قرار خطير - فقط بعد القفل المؤقت
   - يتطلب تدخل SUPERADMIN

---

## Testing the Feature

### Test Case 1: Temporary Lock After 5 Attempts

```bash
# Attempt 1-5 with wrong password
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"user@example.com","password":"wrong"}'
  echo "\n--- Attempt $i ---\n"
  sleep 1
done

# Expected: 5th attempt should lock account for 15 minutes
```

### Test Case 2: Automatic Unlock After 15 Minutes

```bash
# Wait 15 minutes (or update database manually for testing)

# Try login with correct password
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"correct"}'

# Expected: Should succeed and reset counter
```

### Test Case 3: Permanent Lock After Second Cycle

```bash
# After auto-unlock, try 5 wrong attempts again
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"user@example.com","password":"wrong"}'
  echo "\n--- Attempt $i ---\n"
  sleep 1
done

# Expected: 5th attempt should permanently lock account
```

### Test Case 4: SUPERADMIN Unlock

```bash
# Login as SUPERADMIN first
SUPERADMIN_TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@example.com","password":"admin123"}' \
  | jq -r '.tokens.accessToken')

# Unlock the locked account
curl -X POST http://localhost:3000/api/v1/auth/unlock-account/USER_ID_HERE \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN"

# Expected: "Account unlocked successfully"
```

---

## Configuration

### Environment Variables

يمكن تخصيص القيم من خلال متغيرات البيئة (اختياري):

```env
# Login Rate Limiting (future enhancement)
MAX_FAILED_LOGIN_ATTEMPTS=5
TEMPORARY_LOCK_DURATION_MINUTES=15
```

### Current Hardcoded Values

```typescript
// في LoginRateLimiterService
private readonly MAX_FAILED_ATTEMPTS = 5;
private readonly TEMPORARY_LOCK_DURATION_MINUTES = 15;
```

---

## Summary

✅ **Implemented Features:**
- تتبع المحاولات الفاشلة
- قفل مؤقت (15 دقيقة) بعد 5 محاولات
- قفل دائم بعد دورة ثانية من الفشل
- فك قفل تلقائي للقفل المؤقت
- endpoint لـ SUPERADMIN لفك القفل
- تسجيل كامل في Audit Log
- رسائل واضحة للمستخدمين

✅ **Security Enhancements:**
- حماية من Brute Force attacks
- تدرج في العقوبات
- تتبع IP و User-Agent
- Comprehensive logging

✅ **Production Ready:**
- Clean Architecture
- Type-safe implementation
- Comprehensive error handling
- Full Swagger documentation

الميزة جاهزة للإنتاج! 🚀
