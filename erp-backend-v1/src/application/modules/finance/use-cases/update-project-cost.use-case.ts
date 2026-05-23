import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  IProjectCostRepository,
  PROJECT_COST_REPOSITORY,
} from '../repositories';
import { UpdateProjectCostDto, ProjectCostResponseDto } from '../dto';
import { assertCostIsEditable } from './cost-payment-status.guard';

/**
 * Use case for updating project cost
 *
 * Note: This use case handles basic cost field updates.
 * For updating allocations, use UpdateCostAllocationsUseCase (separate use case)
 *
 * Design Decision:
 * Separate allocation updates from basic updates to:
 * 1. Maintain single responsibility principle
 * 2. Simplify validation logic
 * 3. Provide clear API endpoints
 * 4. Better permission control (some users can update cost details, but not allocations)
 */
@Injectable()
export class UpdateProjectCostUseCase {
  constructor(
    @Inject(PROJECT_COST_REPOSITORY)
    private readonly repository: IProjectCostRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(UpdateProjectCostUseCase.name);
  }

  async execute(
    id: string,
    dto: UpdateProjectCostDto,
  ): Promise<ProjectCostResponseDto> {
    // Fetch current record to validate payment status before applying changes
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Project cost ${id} not found`);
    }
    assertCostIsEditable(existing);

    const cost = await this.repository.update(id, dto);
    this.logger.log(`Project cost updated: ${id}`);
    return cost as ProjectCostResponseDto;
  }
}
