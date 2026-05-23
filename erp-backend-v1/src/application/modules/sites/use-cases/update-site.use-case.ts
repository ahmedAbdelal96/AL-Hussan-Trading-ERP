import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { ISiteRepository } from '../repositories';
import { SITE_REPOSITORY } from '../repositories';
import { UpdateSiteDto, SiteResponseDto } from '../dto';

@Injectable()
export class UpdateSiteUseCase {
  constructor(
    @Inject(SITE_REPOSITORY)
    private siteRepository: ISiteRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    id: string,
    data: UpdateSiteDto,
    updatedBy: string,
  ): Promise<SiteResponseDto> {
    const site = await this.siteRepository.findById(id);
    if (!site) {
      throw new NotFoundException(this.i18n.t('sites.update.notFound'));
    }

    // Check if code is being changed and already exists
    if (data.code && data.code !== site.code) {
      const codeExists = await this.siteRepository.existsByCode(data.code, id);
      if (codeExists) {
        throw new ConflictException(this.i18n.t('sites.update.codeExists'));
      }
    }

    const updatedSite = await this.siteRepository.update(id, data, updatedBy);
    return updatedSite.toResponse();
  }
}
