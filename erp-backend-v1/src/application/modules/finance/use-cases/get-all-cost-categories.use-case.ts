import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  ICostCategoryRepository,
  COST_CATEGORY_REPOSITORY,
} from '../repositories';
import { CostCategoryFiltersDto, CostCategoryListResponseDto } from '../dto';

/**
 * Use case for retrieving all cost categories with filtering and pagination
 */
@Injectable()
export class GetAllCostCategoriesUseCase {
  constructor(
    @Inject(COST_CATEGORY_REPOSITORY)
    private readonly repository: ICostCategoryRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetAllCostCategoriesUseCase.name);
  }

  async execute(
    filters: CostCategoryFiltersDto,
  ): Promise<CostCategoryListResponseDto> {
    const result = await this.repository.findAll(filters);

    this.logger.log(`Retrieved ${result.data.length} cost categories`);

    return {
      data: result.data.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        parentId: category.parentId,
        isActive: category.isActive,
        rowVersion: category.rowVersion,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        parent: category.parent,
        children: category.children,
        childrenCount: category.children?.length || 0,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
