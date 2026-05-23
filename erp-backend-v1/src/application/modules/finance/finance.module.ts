import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../infrastructure/database/database.module';
import { LoggerModule } from '../../../infrastructure/logger/logger.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';

// Controllers
import { FinanceController } from './controllers/finance.controller';

// Repositories
import { CostCategoryRepository } from './repositories/cost-category.repository';
import { ProjectCostRepository } from './repositories/project-cost.repository';
import { CostAllocationRepository } from './repositories/cost-allocation.repository';
import {
  COST_CATEGORY_REPOSITORY,
  PROJECT_COST_REPOSITORY,
} from './repositories';

// Services
import { CostAllocationValidatorService } from './services/cost-allocation-validator.service';

// Use Cases
import {
  CreateCostCategoryUseCase,
  GetCostCategoryUseCase,
  GetAllCostCategoriesUseCase,
  UpdateCostCategoryUseCase,
  DeleteCostCategoryUseCase,
  CreateProjectCostUseCase,
  GetProjectCostUseCase,
  GetAllProjectCostsUseCase,
  UpdateProjectCostUseCase,
  DeleteProjectCostUseCase,
  ApproveProjectCostUseCase,
  RejectProjectCostUseCase,
  GetProjectCostSummaryUseCase,
  GetFinanceStatisticsUseCase,
  GetCostAllocationsUseCase,
  UpdateCostAllocationsUseCase,
  ConvertCostToAllocatedUseCase,
  DeleteCostAllocationsUseCase,
} from './use-cases';

/**
 * Finance Module
 *
 * Manages all financial operations:
 * - Cost Categories (hierarchical structure)
 * - Project Costs (with approval workflow)
 * - Financial Analytics and Reports
 *
 * Permissions:
 * - finance:categories:create
 * - finance:categories:read
 * - finance:categories:update
 * - finance:categories:delete
 * - finance:costs:create
 * - finance:costs:read
 * - finance:costs:update
 * - finance:costs:delete
 * - finance:costs:approve
 */
@Module({
  imports: [DatabaseModule, LoggerModule, AuthModule, RbacModule],
  controllers: [FinanceController],
  providers: [
    // Repositories
    {
      provide: COST_CATEGORY_REPOSITORY,
      useClass: CostCategoryRepository,
    },
    {
      provide: PROJECT_COST_REPOSITORY,
      useClass: ProjectCostRepository,
    },
    CostAllocationRepository,

    // Services
    CostAllocationValidatorService,

    // Cost Category Use Cases
    CreateCostCategoryUseCase,
    GetCostCategoryUseCase,
    GetAllCostCategoriesUseCase,
    UpdateCostCategoryUseCase,
    DeleteCostCategoryUseCase,

    // Project Cost Use Cases
    CreateProjectCostUseCase,
    GetProjectCostUseCase,
    GetAllProjectCostsUseCase,
    UpdateProjectCostUseCase,
    DeleteProjectCostUseCase,
    ApproveProjectCostUseCase,
    RejectProjectCostUseCase,
    GetProjectCostSummaryUseCase,

    // Cost Allocation Use Cases
    GetCostAllocationsUseCase,
    UpdateCostAllocationsUseCase,
    ConvertCostToAllocatedUseCase,
    DeleteCostAllocationsUseCase,

    // Statistics Use Cases
    GetFinanceStatisticsUseCase,
  ],
  exports: [COST_CATEGORY_REPOSITORY, PROJECT_COST_REPOSITORY],
})
export class FinanceModule {}
