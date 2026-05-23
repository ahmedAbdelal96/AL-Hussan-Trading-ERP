import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  IProjectCostRepository,
  PROJECT_COST_REPOSITORY,
} from '../repositories';
import { MessageResponseDto } from '../dto';
import { assertCostIsDeletable } from './cost-payment-status.guard';

@Injectable()
export class DeleteProjectCostUseCase {
  constructor(
    @Inject(PROJECT_COST_REPOSITORY)
    private readonly repository: IProjectCostRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(DeleteProjectCostUseCase.name);
  }

  async execute(id: string, rowVersion?: number): Promise<MessageResponseDto> {
    // Fetch current record to validate payment status before deletion
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Project cost ${id} not found`);
    }
    assertCostIsDeletable(existing);

    await this.repository.delete(id, rowVersion);
    this.logger.log(`Project cost deleted: ${id}`);
    return { message: 'Project cost deleted successfully' };
  }
}
