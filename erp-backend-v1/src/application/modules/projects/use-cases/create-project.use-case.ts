/**
 * Create Project Use Case
 * Business logic for creating a new project
 */

import { Injectable, Inject, ConflictException, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { IProjectRepository } from '../repositories';
import { PROJECT_REPOSITORY } from '../repositories';
import { CreateProjectDto, ProjectResponseDto } from '../dto';
import { ProjectMappers } from './mappers';

@Injectable()
export class CreateProjectUseCase {
  private readonly logger = new Logger(CreateProjectUseCase.name);

  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    dto: CreateProjectDto,
    userId: string,
  ): Promise<ProjectResponseDto> {
    this.logger.log(`Creating new project: ${dto.name}`);

    try {
      // Check if tender number already exists (if provided)
      if (dto.tenderNumber) {
        const existing = await this.projectRepository.findAll({
          search: dto.tenderNumber,
          page: 1,
          limit: 1,
        });

        if (existing.total > 0) {
          throw new ConflictException(
            this.i18n.t('projects.create.tenderNumberExists', {
              args: { number: dto.tenderNumber },
            }),
          );
        }
      }

      // Create the project
      const project = await this.projectRepository.create(dto, userId);

      this.logger.log(`Project created successfully: ${project.projectCode}`);

      return ProjectMappers.toProjectResponseDto(project);
    } catch (error) {
      this.logger.error(
        `Failed to create project: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
