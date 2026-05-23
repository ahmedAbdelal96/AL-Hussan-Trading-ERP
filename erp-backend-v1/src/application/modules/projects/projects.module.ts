/**
 * Projects Module
 * Module definition for projects functionality
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../infrastructure/database/database.module';
import { LoggerModule } from '../../../infrastructure/logger/logger.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { DocumentsModule } from '../documents/documents.module';
import { ProjectsController } from './projects.controller';
import { PROJECT_REPOSITORY } from './repositories';
import { ProjectRepository } from './repositories/project.repository';
import {
  CreateProjectUseCase,
  GetProjectUseCase,
  GetAllProjectsUseCase,
  UpdateProjectUseCase,
  DeleteProjectUseCase,
  UpdateProgressUseCase,
  GetProjectMediaUseCase,
  GetProjectsStatisticsUseCase,
  AssignEmployeeToProjectUseCase,
  GetProjectEmployeesUseCase,
  UpdateProjectEmployeeUseCase,
  RemoveProjectEmployeeUseCase,
  GetProjectAssetsUseCase,
  AssignAssetToProjectUseCase,
  RemoveProjectAssetUseCase,
} from './use-cases';

@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
    AuthModule,
    RbacModule,
    DocumentsModule,
  ],
  controllers: [ProjectsController],
  providers: [
    // Repository
    {
      provide: PROJECT_REPOSITORY,
      useClass: ProjectRepository,
    },

    // Use Cases
    CreateProjectUseCase,
    GetProjectUseCase,
    GetAllProjectsUseCase,
    UpdateProjectUseCase,
    DeleteProjectUseCase,
    UpdateProgressUseCase,
    GetProjectMediaUseCase,
    GetProjectsStatisticsUseCase,

    // Project Employee Assignment Use Cases
    AssignEmployeeToProjectUseCase,
    GetProjectEmployeesUseCase,
    UpdateProjectEmployeeUseCase,
    RemoveProjectEmployeeUseCase,

    // Project Asset Assignment Use Cases
    GetProjectAssetsUseCase,
    AssignAssetToProjectUseCase,
    RemoveProjectAssetUseCase,
  ],
  exports: [PROJECT_REPOSITORY],
})
export class ProjectsModule {}
