import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  IProjectCostRepository,
  PROJECT_COST_REPOSITORY,
} from '../repositories';
import { ApproveProjectCostDto, ProjectCostResponseDto } from '../dto';

@Injectable()
export class ApproveProjectCostUseCase {
  constructor(
    @Inject(PROJECT_COST_REPOSITORY)
    private readonly repository: IProjectCostRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(ApproveProjectCostUseCase.name);
  }

  async execute(
    id: string,
    dto: ApproveProjectCostDto,
    userId: string,
  ): Promise<ProjectCostResponseDto> {
    const cost = await this.repository.approve(
      id,
      userId,
      dto.notes,
      dto.rowVersion,
    );
    this.logger.log(`Project cost approved: ${id} by user ${userId}`);
    return cost as ProjectCostResponseDto;
  }
}
