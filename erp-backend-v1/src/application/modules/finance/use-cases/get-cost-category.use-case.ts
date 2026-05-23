import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  ICostCategoryRepository,
  COST_CATEGORY_REPOSITORY,
} from '../repositories';
import { CostCategoryResponseDto } from '../dto';

/**
 * Use case for retrieving a single cost category by ID
 */
@Injectable()
export class GetCostCategoryUseCase {
  constructor(
    @Inject(COST_CATEGORY_REPOSITORY)
    private readonly repository: ICostCategoryRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(GetCostCategoryUseCase.name);
  }

  async execute(
    id: string,
    includeRelations: boolean = true,
  ): Promise<CostCategoryResponseDto> {
    const category = await this.repository.findById(id, includeRelations);

    if (!category) {
      throw new NotFoundException(
        this.i18n.t('finance.costCategory.notFound', { args: { id } }),
      );
    }

    this.logger.log(`Cost category retrieved: ${id}`);

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
      childrenCount: category.children?.length || 0,
    };
  }
}
