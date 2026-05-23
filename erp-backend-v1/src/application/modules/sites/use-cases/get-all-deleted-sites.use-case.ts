/**
 * Get All Deleted Sites Use Case
 *
 * Retrieves paginated list of soft-deleted sites with filtering.
 *
 * @module GetAllDeletedSitesUseCase
 */

import { Injectable, Inject } from '@nestjs/common';
import type { ISiteRepository } from '../repositories';
import { SITE_REPOSITORY } from '../repositories';
import { SiteFiltersDto, SitesPaginatedResponseDto } from '../dto';

@Injectable()
export class GetAllDeletedSitesUseCase {
  constructor(
    @Inject(SITE_REPOSITORY) private siteRepository: ISiteRepository,
  ) {}

  async execute(filters: SiteFiltersDto): Promise<SitesPaginatedResponseDto> {
    const { sites, total } = await this.siteRepository.findAllDeleted(filters);

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;

    return new SitesPaginatedResponseDto(
      sites.map((site) => site.toResponse()),
      page,
      pageSize,
      total,
    );
  }
}
