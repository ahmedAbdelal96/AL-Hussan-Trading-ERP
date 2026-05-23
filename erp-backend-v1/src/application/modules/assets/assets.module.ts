/**
 * Assets Module
 * Module definition for assets functionality
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../infrastructure/database/database.module';
import { LoggerModule } from '../../../infrastructure/logger/logger.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { DocumentsModule } from '../documents/documents.module';
import { AssetsController } from './controllers/assets.controller';
import { ASSET_REPOSITORY } from './repositories';
import { AssetRepository } from './repositories/asset.repository';
import {
  CreateAssetUseCase,
  GetAssetUseCase,
  GetAllAssetsUseCase,
  UpdateAssetUseCase,
  DeleteAssetUseCase,
  AssignEmployeeToAssetUseCase,
  AssignAssetToProjectUseCase,
  CreateMaintenanceRequestUseCase,
  GetAssetsStatisticsUseCase,
} from './use-cases';

@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
    AuthModule,
    RbacModule,
    DocumentsModule,
  ],
  controllers: [AssetsController],
  providers: [
    // Repository
    {
      provide: ASSET_REPOSITORY,
      useClass: AssetRepository,
    },

    // Use Cases
    CreateAssetUseCase,
    GetAssetUseCase,
    GetAllAssetsUseCase,
    UpdateAssetUseCase,
    DeleteAssetUseCase,
    AssignEmployeeToAssetUseCase,
    AssignAssetToProjectUseCase,
    CreateMaintenanceRequestUseCase,
    GetAssetsStatisticsUseCase,
  ],
  exports: [ASSET_REPOSITORY],
})
export class AssetsModule {}
