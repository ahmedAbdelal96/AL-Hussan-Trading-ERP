import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { ISiteRepository } from '../repositories';
import { SITE_REPOSITORY } from '../repositories';
import { SiteResponseDto } from '../dto';
import type { IProjectRepository } from '../../projects/repositories';
import { PROJECT_REPOSITORY } from '../../projects/repositories';

@Injectable()
export class GetSiteUseCase {
  constructor(
    @Inject(SITE_REPOSITORY)
    private siteRepository: ISiteRepository,
    @Inject(PROJECT_REPOSITORY)
    private projectRepository: IProjectRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(id: string): Promise<SiteResponseDto> {
    const site = await this.siteRepository.findById(id);
    if (!site) {
      throw new NotFoundException(this.i18n.t('sites.get.notFound'));
    }

    // Fetch related projects
    const projects = await this.projectRepository.findBySiteId(id);

    return {
      ...site.toResponse(),
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        projectCode: p.projectCode,
        status: p.status,
        plannedStartDate: p.plannedStartDate,
        actualStartDate: p.actualStartDate,
        plannedEndDate: p.plannedEndDate,
        actualEndDate: p.actualEndDate,
      })),
    };
  }
}
