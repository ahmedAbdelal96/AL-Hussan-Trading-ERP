/**
 * Dashboard Module
 * Aggregates statistics from all modules for the main dashboard
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../infrastructure/database/database.module';
import { LoggerModule } from '../../../infrastructure/logger/logger.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';

// Import all module statistics use cases
import { AssetsModule } from '../assets/assets.module';
import { ProjectsModule } from '../projects/projects.module';
import { EmployeesModule } from '../employees/employees.module';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { FinanceModule } from '../finance/finance.module';

// Import use cases
import { GetAssetsStatisticsUseCase } from '../assets/use-cases/get-assets-statistics.use-case';
import { GetProjectsStatisticsUseCase } from '../projects/use-cases/get-projects-statistics.use-case';
import { GetEmployeesStatisticsUseCase } from '../employees/use-cases/get-employees-statistics.use-case';
import { GetMaintenanceStatisticsUseCase } from '../maintenance/use-cases/get-maintenance-statistics.use-case';
import { GetFinanceStatisticsUseCase } from '../finance/use-cases/get-finance-statistics.use-case';

// Dashboard components
import { DashboardController } from './controllers/dashboard.controller';
import { GetDashboardStatisticsUseCase } from './use-cases';

@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
    AuthModule,
    RbacModule,
    // Import all modules to access their use cases
    AssetsModule,
    ProjectsModule,
    EmployeesModule,
    MaintenanceModule,
    FinanceModule,
  ],
  controllers: [DashboardController],
  providers: [
    // Dashboard Use Case
    GetDashboardStatisticsUseCase,
    // Module-specific statistics use cases
    GetAssetsStatisticsUseCase,
    GetProjectsStatisticsUseCase,
    GetEmployeesStatisticsUseCase,
    GetMaintenanceStatisticsUseCase,
    GetFinanceStatisticsUseCase,
  ],
  exports: [GetDashboardStatisticsUseCase],
})
export class DashboardModule {}
