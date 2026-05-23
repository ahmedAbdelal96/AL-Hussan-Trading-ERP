/**
 * Users Reports Module
 * Comprehensive user management, security, RBAC, and compliance reports
 */

import { Module } from '@nestjs/common';
import { UsersReportsController } from './users-reports.controller';
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
import { RbacModule } from '../../rbac/rbac.module';

@Module({
  imports: [RbacModule],
  controllers: [UsersReportsController],
  providers: [
    GetUsersOverviewUseCase,
    GetLoginActivityUseCase,
    GetFailedLoginAttemptsUseCase,
    GetActiveSessionsUseCase,
    GetUserRolesPermissionsUseCase,
    GetAuditLogsUseCase,
    GetLockedAccountsUseCase,
    GetPermissionGrantHistoryUseCase,
  ],
})
export class UsersReportsModule {}
