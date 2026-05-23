/**
 * Delete Project Use Case
 * Business logic for soft-deleting a project
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IProjectRepository } from '../repositories';
import { PROJECT_REPOSITORY } from '../repositories';

@Injectable()
export class DeleteProjectUseCase {
  private readonly logger = new Logger(DeleteProjectUseCase.name);

  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
  ) {}

  async execute(
    id: string,
    userId: string,
    rowVersion?: number,
  ): Promise<void> {
    this.logger.log(`Deleting project: ${id}`);

    await this.projectRepository.delete(id, userId, rowVersion);

    this.logger.log(`Project deleted successfully: ${id}`);
  }
}
