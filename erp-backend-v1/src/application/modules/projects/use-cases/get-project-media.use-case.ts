/**
 * Get Project Media Use Case
 * Business logic for retrieving project media
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IProjectRepository } from '../repositories';
import { PROJECT_REPOSITORY } from '../repositories';
import { MediaFiltersDto, ProjectMediaResponseDto } from '../dto';
import { ProjectMappers } from './mappers';

@Injectable()
export class GetProjectMediaUseCase {
  private readonly logger = new Logger(GetProjectMediaUseCase.name);

  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
  ) {}

  async execute(
    projectId: string,
    filters: MediaFiltersDto,
  ): Promise<{ data: ProjectMediaResponseDto[]; total: number }> {
    this.logger.log(`Fetching media for project: ${projectId}`);

    const { data, total } = await this.projectRepository.findMediaByProject(
      projectId,
      filters,
    );

    return {
      data: data.map((m) => ProjectMappers.toMediaResponseDto(m)),
      total,
    };
  }
}
