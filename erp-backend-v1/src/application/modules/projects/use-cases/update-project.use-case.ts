/**
 * Update Project Use Case
 * Business logic for updating an existing project
 */

import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import type { IProjectRepository } from '../repositories';
import { PROJECT_REPOSITORY } from '../repositories';
import { UpdateProjectDto, ProjectResponseDto } from '../dto';
import { ProjectMappers } from './mappers';
import { assertProjectAllowsProgressUpdate } from './project-status.guard';

@Injectable()
export class UpdateProjectUseCase {
  private readonly logger = new Logger(UpdateProjectUseCase.name);

  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateProjectDto,
    userId: string,
  ): Promise<ProjectResponseDto> {
    this.logger.log(`Updating project: ${id}`);

    const existingProject = await this.projectRepository.findById(id);
    if (!existingProject || existingProject.deletedAt) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const hasProgressMutation =
      dto.completionPercentage !== undefined || dto.progressNotes !== undefined;
    if (hasProgressMutation) {
      assertProjectAllowsProgressUpdate(existingProject);
    }

    const project = await this.projectRepository.update(id, dto, userId);

    this.logger.log(`Project updated successfully: ${project.projectCode}`);

    return ProjectMappers.toProjectResponseDto(project);
  }
}
