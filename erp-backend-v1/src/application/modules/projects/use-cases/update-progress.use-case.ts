/**
 * Update Progress Use Case
 * Business logic for updating project progress
 */

import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import type { IProjectRepository } from '../repositories';
import { PROJECT_REPOSITORY } from '../repositories';
import { UpdateProgressDto, ProjectResponseDto } from '../dto';
import { ProjectMappers } from './mappers';
import { assertProjectAllowsProgressUpdate } from './project-status.guard';

@Injectable()
export class UpdateProgressUseCase {
  private readonly logger = new Logger(UpdateProgressUseCase.name);

  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateProgressDto,
    userId: string,
  ): Promise<ProjectResponseDto> {
    this.logger.log(
      `Updating progress for project: ${id} to ${dto.completionPercentage}%`,
    );

    const existingProject = await this.projectRepository.findById(id);
    if (!existingProject || existingProject.deletedAt) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    assertProjectAllowsProgressUpdate(existingProject);

    const project = await this.projectRepository.updateProgress(
      id,
      dto.completionPercentage,
      dto.progressNotes,
      userId,
    );

    this.logger.log(
      `Progress updated successfully for project: ${project.projectCode}`,
    );

    return ProjectMappers.toProjectResponseDto(project);
  }
}
