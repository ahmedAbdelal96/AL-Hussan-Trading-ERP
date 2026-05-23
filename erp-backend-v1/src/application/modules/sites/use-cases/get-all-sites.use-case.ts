import { Injectable, Inject } from '@nestjs/common';
import type { ISiteRepository } from '../repositories';
import { SITE_REPOSITORY } from '../repositories';
import { SiteFiltersDto, SitesPaginatedResponseDto } from '../dto';

@Injectable()
export class GetAllSitesUseCase {
  constructor(
    @Inject(SITE_REPOSITORY)
    private siteRepository: ISiteRepository,
  ) {}

  async execute(filters: SiteFiltersDto): Promise<SitesPaginatedResponseDto> {
    const { sites, total } = await this.siteRepository.findAll(filters);
    const data = sites.map((site) => site.toResponse());
    return new SitesPaginatedResponseDto(
      data,
      filters.page!,
      filters.pageSize!,
      total,
    );
  }
}
