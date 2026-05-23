import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../infrastructure/database/database.module';
import { LoggerModule } from '../../../infrastructure/logger/logger.module';
import { RbacModule } from '../rbac/rbac.module';
import { DocumentsModule } from '../documents/documents.module';
import { MaintenanceController } from './controllers/maintenance.controller';
import { MAINTENANCE_REPOSITORY, MaintenanceRepository } from './repositories';
import {
  CreateMaintenanceRequestUseCase,
  GetMaintenanceRequestUseCase,
  GetAllMaintenanceRequestsUseCase,
  UpdateMaintenanceRequestUseCase,
  DeleteMaintenanceRequestUseCase,
  GetMaintenanceStatisticsUseCase,
} from './use-cases';

/**
 * Maintenance Module
 * Handles maintenance request management for assets
 */
@Module({
  imports: [DatabaseModule, LoggerModule, RbacModule, DocumentsModule],
  controllers: [MaintenanceController],
  providers: [
    // Repository
    {
      provide: MAINTENANCE_REPOSITORY,
      useClass: MaintenanceRepository,
    },

    // Use Cases
    CreateMaintenanceRequestUseCase,
    GetMaintenanceRequestUseCase,
    GetAllMaintenanceRequestsUseCase,
    UpdateMaintenanceRequestUseCase,
    DeleteMaintenanceRequestUseCase,
    GetMaintenanceStatisticsUseCase,
  ],
  exports: [MAINTENANCE_REPOSITORY],
})
export class MaintenanceModule {}
