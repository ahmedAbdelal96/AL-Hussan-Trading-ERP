/**
 * Get All Projects Use Case
 * Business logic for retrieving projects with filters and pagination
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IProjectRepository } from '../repositories';
import { PROJECT_REPOSITORY } from '../repositories';
import { ProjectFiltersDto, ProjectsPaginatedResponseDto } from '../dto';
import { ProjectMappers } from './mappers';

@Injectable()
export class GetAllProjectsUseCase {
  private readonly logger = new Logger(GetAllProjectsUseCase.name);

  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
  ) {}

  async execute(
    filters: ProjectFiltersDto,
  ): Promise<ProjectsPaginatedResponseDto> {
    this.logger.log(`Fetching projects with filters`);

    const { data, total } = await this.projectRepository.findAll(filters);

    const page = filters.page || 1;
    const limit = filters.limit || 5;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((p) => ProjectMappers.toProjectResponseDto(p)),
      meta: {
        page,
        pageSize: limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
