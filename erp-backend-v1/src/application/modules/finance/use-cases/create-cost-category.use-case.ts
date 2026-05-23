import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  ICostCategoryRepository,
  COST_CATEGORY_REPOSITORY,
} from '../repositories';
import { CreateCostCategoryDto, CostCategoryResponseDto } from '../dto';

/**
 * Use case for creating a new cost category
 */
@Injectable()
export class CreateCostCategoryUseCase {
  constructor(
    @Inject(COST_CATEGORY_REPOSITORY)
    private readonly repository: ICostCategoryRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(CreateCostCategoryUseCase.name);
  }

  async execute(dto: CreateCostCategoryDto): Promise<CostCategoryResponseDto> {
    const category = await this.repository.create(dto);

    this.logger.log(`Cost category created: ${category.name}`);

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
