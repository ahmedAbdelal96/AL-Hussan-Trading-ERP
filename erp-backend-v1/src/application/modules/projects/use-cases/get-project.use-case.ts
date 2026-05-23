/**
 * Get Project Use Case
 * Business logic for retrieving a single project
 */

import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { IProjectRepository } from '../repositories';
import { PROJECT_REPOSITORY } from '../repositories';
import { ProjectResponseDto } from '../dto';
import { ProjectMappers } from './mappers';

@Injectable()
export class GetProjectUseCase {
  private readonly logger = new Logger(GetProjectUseCase.name);

  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(id: string): Promise<ProjectResponseDto> {
    this.logger.log(`Fetching project: ${id}`);

    const project = await this.projectRepository.findById(id);

    if (!project) {
      throw new NotFoundException(
        this.i18n.t('projects.get.notFound', { args: { id } }),
      );
    }

    return ProjectMappers.toProjectResponseDto(project);
  }
}
