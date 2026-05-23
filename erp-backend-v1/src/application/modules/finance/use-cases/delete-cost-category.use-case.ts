import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  ICostCategoryRepository,
  COST_CATEGORY_REPOSITORY,
} from '../repositories';
import { MessageResponseDto } from '../dto';

/**
 * Use case for deleting a cost category
 */
@Injectable()
export class DeleteCostCategoryUseCase {
  constructor(
    @Inject(COST_CATEGORY_REPOSITORY)
    private readonly repository: ICostCategoryRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(DeleteCostCategoryUseCase.name);
  }

  async execute(id: string, rowVersion?: number): Promise<MessageResponseDto> {
    await this.repository.delete(id, rowVersion);

    this.logger.log(`Cost category deleted: ${id}`);

    return {
      message: 'Cost category deleted successfully',
    };
  }
}
