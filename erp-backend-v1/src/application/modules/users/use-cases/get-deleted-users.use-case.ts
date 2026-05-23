/**
 * Get Deleted Users Use Case
 *
 * Retrieves all soft-deleted users for restoration purposes.
 * Only accessible by SUPERADMIN for security reasons.
 *
 * Business Rules:
 * - Only returns users where deletedAt IS NOT NULL
 * - Includes deletion metadata (who deleted, when)
 * - Supports pagination and search
 * - Ordered by deletion date (newest first)
 *
 * @module GetDeletedUsersUseCase
 */

import { Injectable, Inject } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { IUserRepository, USER_REPOSITORY } from '../repositories';
import { UserFiltersDto, UsersPaginatedResponseDto } from '../dto';

@Injectable()
export class GetDeletedUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Execute the use case
   *
   * @param filters - Pagination and search filters
   * @returns Paginated list of deleted users with metadata
   */
  async execute(filters: UserFiltersDto): Promise<UsersPaginatedResponseDto> {
    const { users, total } = await this.userRepository.findDeleted(filters);

    // Transform to response DTOs
    const data = users.map((u) => u.toResponse());

    return new UsersPaginatedResponseDto(
      data,
      filters.page!,
      filters.pageSize!,
      total,
    );
  }
}
