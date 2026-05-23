import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  IProjectCostRepository,
  PROJECT_COST_REPOSITORY,
} from '../repositories';
import { ProjectCostFiltersDto, ProjectCostListResponseDto } from '../dto';

@Injectable()
export class GetAllProjectCostsUseCase {
  constructor(
    @Inject(PROJECT_COST_REPOSITORY)
    private readonly repository: IProjectCostRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetAllProjectCostsUseCase.name);
  }

  async execute(
    filters: ProjectCostFiltersDto,
  ): Promise<ProjectCostListResponseDto> {
    const result = await this.repository.findAll(filters);
    this.logger.log(`Retrieved ${result.data.length} project costs`);
    return result;
  }
}
