import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../infrastructure/database/database.module';
import { LoggerModule } from '../../../infrastructure/logger/logger.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { ProjectsModule } from '../projects/projects.module';
import { SitesController } from './controllers/sites.controller';
import { SiteRepository, SITE_REPOSITORY } from './repositories';
import {
  GenerateSiteCodeUseCase,
  CreateSiteUseCase,
  GetAllSitesUseCase,
  GetAllDeletedSitesUseCase,
  GetSiteUseCase,
  GetSitesStatsUseCase,
  UpdateSiteUseCase,
  DeleteSiteUseCase,
  RestoreSiteUseCase,
  BulkCreateSitesUseCase,
} from './use-cases';

@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
    AuthModule,
    RbacModule,
    ProjectsModule,
  ],
  controllers: [SitesController],
  providers: [
    // Repository
    {
      provide: SITE_REPOSITORY,
      useClass: SiteRepository,
    },

    // Use Cases
    GenerateSiteCodeUseCase,
    CreateSiteUseCase,
    GetAllSitesUseCase,
    GetAllDeletedSitesUseCase,
    GetSiteUseCase,
    GetSitesStatsUseCase,
    UpdateSiteUseCase,
    DeleteSiteUseCase,
    RestoreSiteUseCase,
    BulkCreateSitesUseCase,
  ],
  exports: [SITE_REPOSITORY],
})
export class SitesModule {}
