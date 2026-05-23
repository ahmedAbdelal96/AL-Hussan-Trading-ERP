/**
 * Users Reports Controller
 * Comprehensive user management, security, RBAC, and compliance reports
 */

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../auth/decorators';
import {
  GetUsersOverviewUseCase,
  GetLoginActivityUseCase,
  GetFailedLoginAttemptsUseCase,
  GetActiveSessionsUseCase,
  GetUserRolesPermissionsUseCase,
  GetAuditLogsUseCase,
  GetLockedAccountsUseCase,
  GetPermissionGrantHistoryUseCase,
} from './use-cases';
import {
  UsersOverviewFiltersDto,
  LoginActivityFiltersDto,
  FailedLoginAttemptsFiltersDto,
  ActiveSessionsFiltersDto,
  UserRolesPermissionsFiltersDto,
  AuditLogsFiltersDto,
  LockedAccountsFiltersDto,
  PermissionGrantHistoryFiltersDto,
} from './dto';
import {
  UsersOverviewDocs,
  LoginActivityDocs,
  FailedLoginAttemptsDocs,
  ActiveSessionsDocs,
  UserRolesPermissionsDocs,
  AuditLogsDocs,
  LockedAccountsDocs,
  PermissionGrantHistoryDocs,
} from './decorators';

@ApiTags('Reports - Users')
@Controller('reports/users')
export class UsersReportsController {
  constructor(
    private readonly getUsersOverviewUseCase: GetUsersOverviewUseCase,
    private readonly getLoginActivityUseCase: GetLoginActivityUseCase,
    private readonly getFailedLoginAttemptsUseCase: GetFailedLoginAttemptsUseCase,
    private readonly getActiveSessionsUseCase: GetActiveSessionsUseCase,
    private readonly getUserRolesPermissionsUseCase: GetUserRolesPermissionsUseCase,
    private readonly getAuditLogsUseCase: GetAuditLogsUseCase,
    private readonly getLockedAccountsUseCase: GetLockedAccountsUseCase,
    private readonly getPermissionGrantHistoryUseCase: GetPermissionGrantHistoryUseCase,
  ) {}

  @Get('overview')
  @Auth({ permissions: ['report:users'] })
  @UsersOverviewDocs()
  async getUsersOverview(@Query() filters: UsersOverviewFiltersDto) {
    return this.getUsersOverviewUseCase.execute(filters);
  }

  @Get('login-activity')
  @Auth({ permissions: ['report:users'] })
  @LoginActivityDocs()
  async getLoginActivity(@Query() filters: LoginActivityFiltersDto) {
    return this.getLoginActivityUseCase.execute(filters);
  }

  @Get('failed-login-attempts')
  @Auth({ permissions: ['report:users'] })
  @FailedLoginAttemptsDocs()
  async getFailedLoginAttempts(
    @Query() filters: FailedLoginAttemptsFiltersDto,
  ) {
    return this.getFailedLoginAttemptsUseCase.execute(filters);
  }

  @Get('active-sessions')
  @Auth({ permissions: ['report:users'] })
  @ActiveSessionsDocs()
  async getActiveSessions(@Query() filters: ActiveSessionsFiltersDto) {
    return this.getActiveSessionsUseCase.execute(filters);
  }

  @Get('roles-permissions')
  @Auth({ permissions: ['report:users'] })
  @UserRolesPermissionsDocs()
  async getUserRolesPermissions(
    @Query() filters: UserRolesPermissionsFiltersDto,
  ) {
    return this.getUserRolesPermissionsUseCase.execute(filters);
  }

  @Get('audit-logs')
  @Auth({ permissions: ['report:users'] })
  @AuditLogsDocs()
  async getAuditLogs(@Query() filters: AuditLogsFiltersDto) {
    return this.getAuditLogsUseCase.execute(filters);
  }

  @Get('locked-accounts')
  @Auth({ permissions: ['report:users'] })
  @LockedAccountsDocs()
  async getLockedAccounts(@Query() filters: LockedAccountsFiltersDto) {
    return this.getLockedAccountsUseCase.execute(filters);
  }

  @Get('permission-grant-history')
  @Auth({ permissions: ['report:users'] })
  @PermissionGrantHistoryDocs()
  async getPermissionGrantHistory(
    @Query() filters: PermissionGrantHistoryFiltersDto,
  ) {
    return this.getPermissionGrantHistoryUseCase.execute(filters);
  }
}
