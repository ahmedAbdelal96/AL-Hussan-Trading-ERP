import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  ICostCategoryRepository,
  COST_CATEGORY_REPOSITORY,
} from '../repositories';
import { UpdateCostCategoryDto, CostCategoryResponseDto } from '../dto';

/**
 * Use case for updating an existing cost category
 */
@Injectable()
export class UpdateCostCategoryUseCase {
  constructor(
    @Inject(COST_CATEGORY_REPOSITORY)
    private readonly repository: ICostCategoryRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(UpdateCostCategoryUseCase.name);
  }

  async execute(
    id: string,
    dto: UpdateCostCategoryDto,
  ): Promise<CostCategoryResponseDto> {
    const category = await this.repository.update(id, dto);

    this.logger.log(`Cost category updated: ${id}`);

    return {
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
    };
  }
}
