import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { ISiteRepository } from '../repositories';
import { SITE_REPOSITORY } from '../repositories';
import { SiteEntity } from '../entities/site.entity';

@Injectable()
export class DeleteSiteUseCase {
  constructor(
    @Inject(SITE_REPOSITORY)
    private siteRepository: ISiteRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    id: string,
    deletedBy: string,
    rowVersion?: number,
  ): Promise<SiteEntity> {
    const site = await this.siteRepository.findById(id);
    if (!site) {
      throw new NotFoundException(this.i18n.t('sites.delete.notFound'));
    }

    await this.siteRepository.delete(id, deletedBy, rowVersion);

    // Return the site data before deletion for audit log
    return site;
  }
}
