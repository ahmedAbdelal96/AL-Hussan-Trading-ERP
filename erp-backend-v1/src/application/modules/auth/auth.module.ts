/**
 * Authentication Module
 * Provides authentication and authorization functionality
 *
 * Features:
 * - JWT-based authentication (access + refresh tokens)
 * - Password hashing with bcrypt
 * - Role-based access control (RBAC)
 * - Permission-based access control
 * - Token refresh mechanism
 * - Audit logging
 * - Passport integration
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { LoginRateLimiterService } from './services/login-rate-limiter.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { DatabaseModule } from '../../../infrastructure/database/database.module';
import { LoggerModule } from '../../../infrastructure/logger/logger.module';
import { RbacModule } from '../rbac/rbac.module';

// Guards
import { RolesGuard, PermissionsGuard } from '../../common/guards';

// Repositories
import { AuthRepository, AUTH_REPOSITORY } from './repositories';

// Use Cases
import {
  LoginUseCase,
  RefreshTokensUseCase,
  LogoutUseCase,
  ChangePasswordUseCase,
  ResetUserPasswordUseCase,
  GetCurrentUserUseCase,
  UnlockAccountUseCase,
  GetActiveSessionsUseCase,
  ForceLogoutUserUseCase,
  ForceLogoutAllUsersUseCase,
} from './use-cases';

@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
    RbacModule, // Import RbacModule for PermissionResolverService
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: (configService.get<string>('jwt.accessExpiresIn') ||
            '15m') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Repositories
    {
      provide: AUTH_REPOSITORY,
      useClass: AuthRepository,
    },

    // Services
    PasswordService,
    TokenService,
    LoginRateLimiterService,

    // Guards
    RolesGuard,
    PermissionsGuard,

    // Use Cases
    LoginUseCase,
    RefreshTokensUseCase,
    LogoutUseCase,
    ChangePasswordUseCase,
    ResetUserPasswordUseCase,
    GetCurrentUserUseCase,
    UnlockAccountUseCase,
    GetActiveSessionsUseCase,
    ForceLogoutUserUseCase,
    ForceLogoutAllUsersUseCase,

    // Strategies
    JwtAccessStrategy,
    JwtRefreshStrategy,
  ],
  exports: [
    PasswordService,
    TokenService,
    LoginRateLimiterService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    RolesGuard,
    PermissionsGuard,
    AUTH_REPOSITORY, // Export for use in other modules
  ],
})
export class AuthModule {}
