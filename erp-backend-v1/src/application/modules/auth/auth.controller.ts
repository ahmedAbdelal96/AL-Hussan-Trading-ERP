/**
 * Authentication Controller
 * Handles all authentication-related HTTP endpoints
 *
 * Endpoints:
 * - POST /auth/login - User login
 * - POST /auth/refresh - Refresh access token
 * - POST /auth/logout - User logout
 * - GET /auth/me - Get current user
 * - PUT /auth/change-password - Change password
 * - POST /auth/unlock-account/:userId - Unlock user account (SUPERADMIN only)
 */

import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  LoginDto,
  ChangePasswordDto,
  ResetUserPasswordDto,
  RefreshTokenDto,
  LoginResponseDto,
  UserInfoDto,
  TokensDto,
  MessageResponseDto,
} from './dto';
import { JwtAccessGuard } from '../../common/guards';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Public, CurrentUser, TrackChanges } from '../../common/decorators';
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
import {
  ApiLogin,
  ApiRefreshTokens,
  ApiLogout,
  ApiGetCurrentUser,
  ApiChangePassword,
  ApiResetUserPassword,
  ApiUnlockAccount,
  ApiGetActiveSessions,
  ApiForceLogoutUser,
  ApiForceLogoutAll,
  Auth,
} from './decorators';
import {
  AuditLog,
  NoAuditLog,
} from '../../common/decorators/audit-log.decorator';
import { AuditAction } from '@prisma/client';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokensUseCase: RefreshTokensUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly resetUserPasswordUseCase: ResetUserPasswordUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly unlockAccountUseCase: UnlockAccountUseCase,
    private readonly getActiveSessionsUseCase: GetActiveSessionsUseCase,
    private readonly forceLogoutUserUseCase: ForceLogoutUserUseCase,
    private readonly forceLogoutAllUsersUseCase: ForceLogoutAllUsersUseCase,
  ) {}

  /**
   * Login endpoint
   */
  @Public()
  @Post('login')
  @AuditLog({ resourceType: 'auth', action: AuditAction.LOGIN })
  @HttpCode(HttpStatus.OK)
  @ApiLogin()
  async login(
    @Body() loginDto: LoginDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
  ): Promise<LoginResponseDto> {
    return this.loginUseCase.execute(loginDto, userAgent, ipAddress);
  }

  /**
   * Refresh token endpoint
   */
  @Public()
  @Post('refresh')
  @NoAuditLog()
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

  /**
   * Logout endpoint
   */
  @Post('logout')
  @AuditLog({ resourceType: 'auth', action: AuditAction.LOGOUT })
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

  /**
   * Get current user endpoint
   */
  @Get('me')
  @NoAuditLog()
  @UseGuards(JwtAccessGuard)
  @ApiGetCurrentUser()
  async getCurrentUser(
    @CurrentUser('id') userId: string,
  ): Promise<UserInfoDto> {
    return this.getCurrentUserUseCase.execute(userId);
  }

  /**
   * Change password endpoint
   * Available to all authenticated users to change their own password
   */
  @Put('change-password')
  @AuditLog({ resourceType: 'auth', action: AuditAction.UPDATE })
  @TrackChanges({
    resourceType: 'user',
    excludeFields: ['password', 'oldPassword', 'newPassword'],
  })
  @Auth() // Any authenticated user can change their own password
  @HttpCode(HttpStatus.OK)
  @ApiChangePassword()
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    await this.changePasswordUseCase.execute(userId, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  /**
   * Reset user password endpoint (ADMIN/SUPERADMIN only)
   */
  @Put('admin/reset-user-password/:userId')
  @AuditLog({ resourceType: 'auth', action: AuditAction.UPDATE })
  @TrackChanges({
    resourceType: 'user',
    excludeFields: ['password', 'newPassword'],
    resourceIdParam: 'userId',
  })
  @Auth({ roles: ['SUPERADMIN', 'ADMIN'] })
  // Role check will be done in use case
  @HttpCode(HttpStatus.OK)
  @ApiResetUserPassword()
  async resetUserPassword(
    @CurrentUser('id') adminUserId: string,
    @Param('userId') targetUserId: string,
    @Body() resetPasswordDto: ResetUserPasswordDto,
  ): Promise<MessageResponseDto> {
    await this.resetUserPasswordUseCase.execute(
      adminUserId,
      targetUserId,
      resetPasswordDto,
    );
    return { message: 'User password reset successfully' };
  }

  /**
   * Unlock account endpoint (SUPERADMIN only)
   */
  @Post('unlock-account/:userId')
  @AuditLog({ resourceType: 'user', action: AuditAction.UPDATE })
  @Auth({ roles: ['SUPERADMIN', 'ADMIN'] })
  @HttpCode(HttpStatus.OK)
  @ApiUnlockAccount()
  async unlockAccount(
    @Param('userId') userId: string,
    @CurrentUser('id') superadminId: string,
  ): Promise<MessageResponseDto> {
    await this.unlockAccountUseCase.execute(userId, superadminId);
    return { message: 'Account unlocked successfully' };
  }

  /**
   * Get active sessions endpoint (ADMIN/SUPERADMIN only)
   */
  @Get('sessions/active')
  @NoAuditLog()
  @Auth({ roles: ['SUPERADMIN', 'ADMIN'] })
  @ApiGetActiveSessions()
  async getActiveSessions(@CurrentUser('id') userId: string) {
    return this.getActiveSessionsUseCase.execute(userId);
  }

  /**
   * Force logout specific user endpoint (ADMIN/SUPERADMIN only)
   */
  @Post('sessions/force-logout/:targetUserId')
  @AuditLog({ resourceType: 'user', action: AuditAction.LOGOUT })
  @Auth({ roles: ['SUPERADMIN', 'ADMIN'] })
  @HttpCode(HttpStatus.OK)
  @ApiForceLogoutUser()
  async forceLogoutUser(
    @Param('targetUserId') targetUserId: string,
    @CurrentUser('id') adminId: string,
  ): Promise<MessageResponseDto> {
    await this.forceLogoutUserUseCase.execute(adminId, targetUserId);
    return { message: 'User logged out successfully from all sessions' };
  }

  /**
   * Force logout all users endpoint (SUPERADMIN only)
   */
  @Post('sessions/force-logout-all')
  @AuditLog({ resourceType: 'user', action: AuditAction.LOGOUT })
  @Auth({ roles: ['SUPERADMIN', 'ADMIN'] })
  @HttpCode(HttpStatus.OK)
  @ApiForceLogoutAll()
  async forceLogoutAll(
    @CurrentUser('id') superadminId: string,
  ): Promise<MessageResponseDto> {
    const result = await this.forceLogoutAllUsersUseCase.execute(superadminId);
    return {
      message: `Successfully logged out all users. Total sessions revoked: ${result.affectedSessions}`,
    };
  }
}
