# Remember Me Feature - Banking Model

## Overview

The Remember Me feature allows users to stay logged in for an extended period when they check "Remember Me" during login.

## Security Model

We use the **Banking Model** which balances security with user experience:

### Token Expiry

- **Access Token**: 15 minutes (same for all users)
- **Refresh Token with Remember Me**: 7 days
- **Refresh Token without Remember Me**: 24 hours

### Why Banking Model?

- ✅ **Secure**: Short access tokens (15m) minimize exposure
- ✅ **Convenient**: Remember Me gives 7 days session for trusted devices
- ✅ **Balanced**: 24 hours for regular login is reasonable for ERP systems
- ✅ **Flexible**: Users choose their security level

## Configuration

### Environment Variables

```env
# Access Token (short-lived, same for all)
JWT_ACCESS_EXPIRES_IN=15m

# Refresh Token - Remember Me checked (7 days)
JWT_REFRESH_EXPIRES_IN_WITH_REMEMBER=7d

# Refresh Token - Remember Me NOT checked (24 hours)
JWT_REFRESH_EXPIRES_IN_WITHOUT_REMEMBER=24h
```

### Supported Time Formats

- `s` - seconds
- `m` - minutes
- `h` - hours
- `d` - days

Examples: `15m`, `24h`, `7d`, `30d`

## Implementation

### Backend (NestJS)

#### 1. LoginDto

```typescript
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean; // Default: false
}
```

#### 2. TokenService

```typescript
async generateTokenPair(
  user: User,
  userAgent?: string,
  ipAddress?: string,
  rememberMe: boolean = false,
): Promise<TokenPair> {
  // Access token: always 15 minutes
  const accessToken = this.jwtService.sign(accessPayload, {
    secret: this.accessTokenSecret,
    expiresIn: this.accessTokenExpiry, // 15m
  });

  // Refresh token: 7 days or 24 hours based on Remember Me
  const refreshTokenExpiry = rememberMe
    ? this.refreshTokenExpiryWithRemember  // 7d
    : this.refreshTokenExpiryWithoutRemember; // 24h

  const refreshToken = this.jwtService.sign(refreshPayload, {
    secret: this.refreshTokenSecret,
    expiresIn: refreshTokenExpiry,
  });

  return { accessToken, refreshToken, expiresIn: 900 }; // 15m in seconds
}
```

#### 3. LoginUseCase

```typescript
async execute(loginDto: LoginDto, ...): Promise<LoginResponseDto> {
  const { email, password, rememberMe = false } = loginDto;

  // ... authentication logic ...

  const tokens = await this.tokenService.generateTokenPair(
    user,
    userAgent,
    ipAddress,
    rememberMe, // Pass Remember Me flag
  );

  return { user, tokens };
}
```

#### 4. RefreshTokensUseCase

```typescript
async execute(refreshToken: string, ...): Promise<TokensDto> {
  // Verify token
  const payload = await this.tokenService.verifyRefreshToken(refreshToken);

  // Detect if original token had Remember Me (by checking expiry duration)
  const rememberMe = await this.tokenService.wasTokenCreatedWithRememberMe(refreshToken);

  // Generate new token pair with same Remember Me setting
  const tokens = await this.tokenService.generateTokenPair(
    user,
    userAgent,
    ipAddress,
    rememberMe, // Preserve Remember Me setting
  );

  return tokens;
}
```

#### 5. Remember Me Detection

```typescript
// In TokenService
async wasTokenCreatedWithRememberMe(token: string): Promise<boolean> {
  const storedToken = await this.prisma.refreshToken.findUnique({
    where: { token },
  });

  // Calculate duration in hours
  const durationMs = storedToken.expiresAt.getTime() - storedToken.createdAt.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  // If token expires in more than 25 hours, it was created with Remember Me
  return durationHours > 25;
}
```

### Frontend (React)

#### SignIn Form

```typescript
const form = useForm<LoginFormData>({
  defaultValues: {
    email: '',
    password: '',
    rememberMe: false,
  },
});

const onSubmit = async (data: LoginFormData) => {
  // Send all fields including rememberMe to backend
  await loginMutation.mutateAsync(data);
};
```

#### API Hook

```typescript
export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe, // Include in request
      });
      return response.data;
    },
  });
};
```

## Token Refresh Flow

1. **Initial Login**:
   - User logs in with/without Remember Me
   - Backend generates access token (15m) + refresh token (7d or 24h)
   - Frontend stores both tokens
   - **Refresh token stored in database with creation time and expiry time**

2. **Access Token Expiry (after 15m)**:
   - Frontend detects 401 Unauthorized
   - Automatically calls `/auth/refresh` with refresh token
   - **Backend detects if original token had Remember Me by checking expiry duration**
   - Backend generates new token pair **with same Remember Me setting**
   - User continues working seamlessly

3. **Refresh Token Expiry**:
   - **With Remember Me**: After 7 days → User must login again
   - **Without Remember Me**: After 24 hours → User must login again

### Remember Me Persistence

When refreshing tokens, the system automatically detects if the original token was created with "Remember Me":

- **Duration > 25 hours** → Token was created with Remember Me → New token also gets 7 days
- **Duration ≤ 25 hours** → Token was created without Remember Me → New token gets 24 hours

This ensures users don't lose their "Remember Me" preference when tokens are refreshed.

## Security Features

### Token Storage

- Refresh tokens stored in database with metadata:
  - User Agent (browser/device)
  - IP Address
  - Creation timestamp
  - Expiry timestamp

### Token Revocation

- Force logout increments `tokenVersion` → All existing tokens become invalid
- Admin can revoke specific refresh tokens
- Automatic cleanup of expired tokens

### Rate Limiting

- Failed login attempts tracked per user
- Temporary lock after 5 failed attempts (15 minutes)
- Permanent lock after 10 failed attempts (requires admin unlock)

## Testing

### Test Remember Me = true (7 days)

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123",
    "rememberMe": true
  }'
```

Expected refresh token expiry: 7 days from now

### Test Remember Me = false (24 hours)

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123",
    "rememberMe": false
  }'
```

Expected refresh token expiry: 24 hours from now

### Verify Token Expiry

Check database `RefreshToken` table:

```sql
SELECT
  userId,
  token,
  expiresAt,
  EXTRACT(EPOCH FROM (expiresAt - createdAt))/3600 as hours_until_expiry
FROM "RefreshToken"
WHERE userId = 'user-id-here'
ORDER BY createdAt DESC
LIMIT 5;
```

## Troubleshooting

### Refresh Token Always 7 Days

**Problem**: Refresh token always 7 days regardless of Remember Me
**Solution**: Check `rememberMe` is passed from frontend → backend → TokenService

### Refresh Token Always 24 Hours

**Problem**: Refresh token always 24 hours even with Remember Me
**Solution**: Check ENV variables are loaded correctly in jwt.config.ts

### ENV Not Loading

**Problem**: Still using default values
**Solution**:

1. Check `.env` file exists in backend root
2. Restart backend server
3. Verify ConfigModule loads .env file

## Alternative Security Models

### Standard Model (Most Common)

- Access: 15 minutes
- Refresh with Remember: 30 days
- Refresh without Remember: 7 days

**Use when**: General web applications, lower security requirements

### Aggressive Model (High Security)

- Access: 5 minutes
- Refresh with Remember: 24 hours
- Refresh without Remember: 1 hour

**Use when**: Banking apps, financial systems, healthcare systems

### Relaxed Model (Convenience)

- Access: 1 hour
- Refresh with Remember: 90 days
- Refresh without Remember: 30 days

**Use when**: Internal tools, low-risk applications

## Best Practices

1. ✅ **Use HTTPS**: Always use HTTPS in production
2. ✅ **Secure Storage**: Store refresh tokens in httpOnly cookies (not localStorage)
3. ✅ **Device Tracking**: Track user agent and IP for security
4. ✅ **Token Rotation**: Rotate refresh tokens on each use
5. ✅ **Audit Logs**: Log all login/logout events
6. ✅ **Force Logout**: Implement global logout feature
7. ✅ **Session Management**: Allow users to view active sessions

## Future Enhancements

- [ ] Refresh token rotation (generate new refresh token on each refresh)
- [ ] Multi-device session management UI
- [ ] Email notification on new device login
- [ ] Automatic logout on password change
- [ ] Remember device fingerprinting
- [ ] Suspicious activity detection

## References

- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
