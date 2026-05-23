/**
 * App Module
 * Root module that bootstraps the entire application
 *
 * Architecture Layers:
 * - Infrastructure: Database, Cache, Logger
 * - Application: Configuration, Health Checks
 * - Shared: Common utilities (filters, interceptors, guards, pipes)
 * - Domain: Business modules (will be added later)
 */

import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { I18nModule, AcceptLanguageResolver } from 'nestjs-i18n';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';

// Infrastructure
import { DatabaseModule } from './infrastructure/database/database.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { StorageModule } from './infrastructure/storage/storage.module';

// Application
import { ConfigurationModule } from './application/config/config.module';

// Shared
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './shared/interceptors/timeout.interceptor';
import { ChangeTrackingInterceptor } from './application/common/interceptors/change-tracking.interceptor';
import { AuditInterceptor } from './application/common/interceptors/audit.interceptor';
import { JwtAccessGuard } from './application/common/guards/jwt-access.guard';

// Audit Services
import { AuditLogsCleanupService } from './application/modules/audit/cleanup-audit-logs.service';

// Application Modules
import { AuthModule } from './application/modules/auth/auth.module';
import { RbacModule } from './application/modules/rbac/rbac.module';
import { UsersModule } from './application/modules/users/users.module';
import { EmployeesModule } from './application/modules/employees/employees.module';
import { SitesModule } from './application/modules/sites/sites.module';
import { ProjectsModule } from './application/modules/projects/projects.module';
import { AssetsModule } from './application/modules/assets/assets.module';
import { FinanceModule } from './application/modules/finance/finance.module';
import { PayrollModule } from './application/modules/payroll/payroll.module';
import { MaintenanceModule } from './application/modules/maintenance/maintenance.module';
import { ReportsModule } from './application/modules/reports/reports.module';
import { FinanceReportsModule } from './application/modules/reports/finance/finance-reports.module';
import { PayrollReportsModule } from './application/modules/reports/payroll/payroll-reports.module';
import { ProjectsReportsModule } from './application/modules/reports/projects/projects-reports.module';
import { EmployeesReportsModule } from './application/modules/reports/employees/employees-reports.module';
import { AssetsReportsModule } from './application/modules/reports/assets/assets-reports.module';
import { MaintenanceReportsModule } from './application/modules/reports/maintenance/maintenance-reports.module';
import { SitesReportsModule } from './application/modules/reports/sites/sites-reports.module';
import { UsersReportsModule } from './application/modules/reports/users/users-reports.module';
import { ExecutiveReportsModule } from './application/modules/reports/executive/executive-reports.module';
import { DocumentsModule } from './application/modules/documents/documents.module';
import { DashboardModule } from './application/modules/dashboard/dashboard.module';
import { HealthModule } from './application/modules/health/health.module';

@Module({
  imports: [
    // Configuration (must be first - provides env variables)
    ConfigurationModule,

    // Scheduling (for cron jobs like audit log cleanup)
    ScheduleModule.forRoot(),

    // Rate Limiting — Global throttle to prevent abuse
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: (config.get<number>('RATE_LIMIT_TTL') || 60) * 1000,
            limit: config.get<number>('RATE_LIMIT_LIMIT') || 100,
          },
        ],
      }),
    }),

    // Internationalization
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(process.cwd(), 'src/i18n'),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),

    // Infrastructure Modules (Global)
    DatabaseModule,
    CacheModule,
    LoggerModule,
    StorageModule, // File storage for all entities

    // Application Modules
    HealthModule,
    AuthModule,
    RbacModule,
    DashboardModule, // Main dashboard aggregating all module statistics
    UsersModule,
    EmployeesModule,
    SitesModule,
    ProjectsModule,
    AssetsModule,
    FinanceModule,
    PayrollModule,
    MaintenanceModule,
    DocumentsModule, // Generic document management
    ReportsModule,
    FinanceReportsModule,
    PayrollReportsModule,
    ProjectsReportsModule,
    EmployeesReportsModule,
    AssetsReportsModule,
    MaintenanceReportsModule,
    SitesReportsModule,
    UsersReportsModule,
    ExecutiveReportsModule,

    // Future modules will be added here
    // etc.
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // Audit Services (with cron jobs)
    AuditLogsCleanupService,

    // Global Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Global JWT Authentication Guard (defense-in-depth)
    // All routes require JWT auth by default; use @Public() to opt out
    {
      provide: APP_GUARD,
      useClass: JwtAccessGuard,
    },

    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    // Global Change Tracking Interceptor - Must run BEFORE AuditInterceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: ChangeTrackingInterceptor,
    },

    // Global Audit Interceptor - Logs all requests automatically
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },

    // Global Logging Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    // Global Timeout Interceptor (30 seconds)
    {
      provide: APP_INTERCEPTOR,
      useFactory: () => new TimeoutInterceptor(30000),
    },
  ],
})
export class AppModule {}
