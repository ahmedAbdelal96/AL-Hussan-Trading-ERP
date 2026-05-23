import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  IProjectCostRepository,
  PROJECT_COST_REPOSITORY,
} from '../repositories';
import { ProjectCostSummaryDto } from '../dto';

@Injectable()
export class GetProjectCostSummaryUseCase {
  constructor(
    @Inject(PROJECT_COST_REPOSITORY)
    private readonly repository: IProjectCostRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetProjectCostSummaryUseCase.name);
  }

  async execute(projectId: string): Promise<ProjectCostSummaryDto> {
    const summary = await this.repository.getProjectSummary(projectId);
    this.logger.log(`Project cost summary retrieved for project: ${projectId}`);
    return summary;
  }
}
