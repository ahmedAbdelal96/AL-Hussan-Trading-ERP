import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  IProjectCostRepository,
  PROJECT_COST_REPOSITORY,
} from '../repositories';
import { RejectProjectCostDto, ProjectCostResponseDto } from '../dto';

@Injectable()
export class RejectProjectCostUseCase {
  constructor(
    @Inject(PROJECT_COST_REPOSITORY)
    private readonly repository: IProjectCostRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(RejectProjectCostUseCase.name);
  }

  async execute(
    id: string,
    dto: RejectProjectCostDto,
    userId: string,
  ): Promise<ProjectCostResponseDto> {
    const cost = await this.repository.reject(
      id,
      userId,
      dto.rejectedReason,
      dto.rowVersion,
    );
    this.logger.log(`Project cost rejected: ${id} by user ${userId}`);
    return cost as ProjectCostResponseDto;
  }
}
