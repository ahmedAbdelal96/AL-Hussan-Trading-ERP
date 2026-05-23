# Auth Module - Swagger Decorators

## Overview

الـ Swagger decorators تم فصلها في ملف منفصل لتحسين قابلية القراءة والصيانة للـ Controller.

## File Structure

```
src/application/modules/auth/decorators/
├── auth-swagger.decorators.ts    # Swagger decorators for all endpoints
└── index.ts                       # Barrel export
```

## Benefits

### 1. Clean Controller
الـ Controller الآن أصبح أقصر وأوضح:

**قبل:**
```typescript
@Post('login')
@HttpCode(HttpStatus.OK)
@ApiOperation({
  summary: 'User login',
  description: 'Authenticate user with email and password...',
})
@ApiBody({ type: LoginDto })
@ApiResponse({
  status: 200,
  description: 'Login successful',
  type: LoginResponseDto,
})
@ApiResponse({
  status: 401,
  description: 'Invalid credentials or inactive account',
  schema: { /* ... */ },
})
@ApiResponse({
  status: 400,
  description: 'Validation error',
  schema: { /* ... */ },
})
async login(...) { /* ... */ }
```

**بعد:**
```typescript
@Post('login')
@HttpCode(HttpStatus.OK)
@ApiLogin()
async login(...) { /* ... */ }
```

### 2. Reusability
يمكن إعادة استخدام نفس الـ decorators في أماكن مختلفة:

```typescript
// في controller آخر
@Post('admin/login')
@ApiLogin() // نفس التوثيق
async adminLogin(...) { /* ... */ }
```

### 3. Centralized Documentation
كل التوثيق الخاص بالـ API في مكان واحد، سهل التعديل والصيانة.

### 4. Type Safety
استخدام `applyDecorators` من NestJS يحافظ على الـ type safety.

## Available Decorators

### 1. @ApiLogin()
توثيق endpoint تسجيل الدخول.

**Features:**
- Operation summary and description
- Request body schema (LoginDto)
- Success response (200)
- Validation error response (400)
- Authentication error response (401)

**Usage:**
```typescript
@Public()
@Post('login')
@HttpCode(HttpStatus.OK)
@ApiLogin()
async login(
  @Body() loginDto: LoginDto,
  @Headers('user-agent') userAgent: string,
  @Ip() ipAddress: string,
): Promise<LoginResponseDto> {
  return this.loginUseCase.execute(loginDto, userAgent, ipAddress);
}
```

---

### 2. @ApiRefreshTokens()
توثيق endpoint تحديث الـ tokens.

**Features:**
- Operation summary and description
- Request body schema (RefreshTokenDto)
- Success response (200)
- Invalid token error response (401)

**Usage:**
```typescript
@Public()
@Post('refresh')
@UseGuards(JwtRefreshGuard)
@HttpCode(HttpStatus.OK)
@ApiRefreshTokens()
async refreshTokens(
  @Body() refreshTokenDto: RefreshTokenDto,
  @Headers('user-agent') userAgent: string,
  @Ip() ipAddress: string,
): Promise<TokensDto> {
  return this.refreshTokensUseCase.execute(
    refreshTokenDto.refreshToken,
    userAgent,
    ipAddress,
  );
}
```

---

### 3. @ApiLogout()
توثيق endpoint تسجيل الخروج.

**Features:**
- Bearer authentication required
- Operation summary and description
- Optional request body (refreshToken)
- Success response (200)
- Unauthorized error response (401)

**Usage:**
```typescript
@Post('logout')
@UseGuards(JwtAccessGuard)
@HttpCode(HttpStatus.OK)
@ApiLogout()
async logout(
  @CurrentUser('id') userId: string,
  @Body('refreshToken') refreshToken?: string,
): Promise<MessageResponseDto> {
  await this.logoutUseCase.execute(userId, refreshToken);
  return { message: 'Logout successful' };
}
```

---

### 4. @ApiGetCurrentUser()
توثيق endpoint الحصول على بيانات المستخدم الحالي.

**Features:**
- Bearer authentication required
- Operation summary and description
- Success response with UserInfoDto (200)
- Unauthorized error response (401)

**Usage:**
```typescript
@Get('me')
@UseGuards(JwtAccessGuard)
@ApiGetCurrentUser()
async getCurrentUser(
  @CurrentUser('id') userId: string
): Promise<UserInfoDto> {
  return this.getCurrentUserUseCase.execute(userId);
}
```

---

### 5. @ApiChangePassword()
توثيق endpoint تغيير كلمة المرور.

**Features:**
- Bearer authentication required
- Operation summary and description
- Request body schema (ChangePasswordDto)
- Success response (200)
- Validation error response (400)
- Incorrect password error response (401)

**Usage:**
```typescript
@Put('change-password')
@UseGuards(JwtAccessGuard)
@HttpCode(HttpStatus.OK)
@ApiChangePassword()
async changePassword(
  @CurrentUser('id') userId: string,
  @Body() changePasswordDto: ChangePasswordDto,
): Promise<MessageResponseDto> {
  await this.changePasswordUseCase.execute(userId, changePasswordDto);
  return { message: 'Password changed successfully' };
}
```

---

## Implementation Details

### Using applyDecorators

```typescript
import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'User login',
      description: 'Authenticate user with email and password...',
    }),
    ApiBody({ type: LoginDto }),
    ApiResponse({
      status: 200,
      description: 'Login successful',
      type: LoginResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid credentials or inactive account',
      schema: {
        example: {
          statusCode: 401,
          message: 'Invalid email or password',
          error: 'Unauthorized',
        },
      },
    }),
    // ... more responses
  );
}
```

**Key Points:**
- `applyDecorators` combines multiple decorators into one
- All Swagger decorators can be grouped together
- The resulting decorator can be used like any other decorator
- Type safety is preserved

---

## Creating Custom Decorators

إذا أردت إنشاء decorator جديد:

```typescript
export function ApiYourEndpoint() {
  return applyDecorators(
    // Add ApiBearerAuth if authentication is required
    ApiBearerAuth(),

    // Operation description
    ApiOperation({
      summary: 'Brief summary',
      description: 'Detailed description of what this endpoint does.',
    }),

    // Request body (if applicable)
    ApiBody({ type: YourDto }),

    // Success response
    ApiResponse({
      status: 200,
      description: 'Success description',
      type: YourResponseDto,
    }),

    // Error responses
    ApiResponse({
      status: 400,
      description: 'Validation error',
      schema: {
        example: {
          statusCode: 400,
          message: 'Validation error message',
          error: 'Bad Request',
        },
      },
    }),

    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
  );
}
```

---

## Best Practices

### 1. Consistent Response Examples
احرص على أن تكون أمثلة الـ responses متسقة عبر جميع الـ endpoints:

```typescript
// Good: Consistent error format
schema: {
  example: {
    statusCode: 400,
    message: 'Error message',
    error: 'Bad Request',
  },
}

// Bad: Inconsistent format
schema: {
  example: {
    error: 'Error message',
  },
}
```

### 2. Include All Possible Responses
وثق جميع الـ responses الممكنة:

```typescript
export function ApiYourEndpoint() {
  return applyDecorators(
    // Success
    ApiResponse({ status: 200, ... }),

    // Client errors
    ApiResponse({ status: 400, ... }),
    ApiResponse({ status: 401, ... }),
    ApiResponse({ status: 403, ... }),
    ApiResponse({ status: 404, ... }),

    // Server errors (if applicable)
    ApiResponse({ status: 500, ... }),
  );
}
```

### 3. Use Descriptive Operation Summaries
استخدم ملخصات واضحة ومختصرة:

```typescript
// Good: Clear and concise
ApiOperation({
  summary: 'User login',
  description: 'Authenticate user with email and password. Returns access and refresh tokens.',
})

// Bad: Too vague
ApiOperation({
  summary: 'Login',
  description: 'Login endpoint',
})
```

### 4. Link to DTOs
اربط دائماً بالـ DTOs الفعلية بدلاً من كتابة الـ schemas يدوياً:

```typescript
// Good: Uses actual DTO
ApiBody({ type: LoginDto })
ApiResponse({ status: 200, type: LoginResponseDto })

// Bad: Manual schema definition
ApiBody({
  schema: {
    type: 'object',
    properties: {
      email: { type: 'string' },
      password: { type: 'string' },
    },
  },
})
```

---

## Updated Controller Structure

الـ Controller الآن أصبح:

```typescript
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokensUseCase: RefreshTokensUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiLogin()
  async login(...): Promise<LoginResponseDto> { /* ... */ }

  @Public()
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiRefreshTokens()
  async refreshTokens(...): Promise<TokensDto> { /* ... */ }

  @Post('logout')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiLogout()
  async logout(...): Promise<MessageResponseDto> { /* ... */ }

  @Get('me')
  @UseGuards(JwtAccessGuard)
  @ApiGetCurrentUser()
  async getCurrentUser(...): Promise<UserInfoDto> { /* ... */ }

  @Put('change-password')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiChangePassword()
  async changePassword(...): Promise<MessageResponseDto> { /* ... */ }
}
```

**Controller lines:** من 266 سطر → 140 سطر (تحسين بنسبة 47%)

---

## Summary

✅ **Separation of Concerns** - فصل التوثيق عن منطق الـ Controller
✅ **Improved Readability** - Controller أسهل في القراءة والفهم
✅ **Reusability** - إمكانية إعادة استخدام الـ decorators
✅ **Maintainability** - سهولة تحديث التوثيق في مكان واحد
✅ **Type Safety** - الحفاظ على الـ type safety
✅ **Consistent Documentation** - توثيق متسق عبر جميع الـ endpoints

هذا النمط يعتبر **Best Practice** في NestJS للمشاريع الكبيرة! 🚀
