import {
  Injectable,
  Inject,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { ISiteRepository } from '../repositories';
import { SITE_REPOSITORY } from '../repositories';
import { BulkCreateSitesDto, SiteResponseDto, CreateSiteDto } from '../dto';
import { GenerateSiteCodeUseCase } from './generate-site-code.use-case';

@Injectable()
export class BulkCreateSitesUseCase {
  constructor(
    @Inject(SITE_REPOSITORY)
    private siteRepository: ISiteRepository,
    private generateSiteCode: GenerateSiteCodeUseCase,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    data: BulkCreateSitesDto,
    createdBy: string,
  ): Promise<SiteResponseDto[]> {
    const { sites } = data;

    // Validate uniqueness within the batch
    const codes = sites.filter((s) => s.code).map((s) => s.code!);

    // Check for duplicates within batch
    const duplicateCodes = codes.filter(
      (code, index) => codes.indexOf(code) !== index,
    );
    if (duplicateCodes.length > 0) {
      throw new BadRequestException(
        this.i18n.t('sites.bulk.duplicateCodes', {
          args: { codes: duplicateCodes.join(', ') },
        }),
      );
    }

    // Check against existing records
    for (const site of sites) {
      if (site.code) {
        const codeExists = await this.siteRepository.existsByCode(site.code);
        if (codeExists) {
          throw new ConflictException(
            this.i18n.t('sites.bulk.codeExists', { args: { code: site.code } }),
          );
        }
      }
    }

    // Generate codes for all sites
    const sitesWithCodes: Array<{ data: CreateSiteDto; code: string }> = [];
    for (const site of sites) {
      const code = site.code || (await this.generateSiteCode.execute());
      sitesWithCodes.push({ data: site, code });
    }

    // Create all sites
    const createdSites = await this.siteRepository.bulkCreate(
      sitesWithCodes,
      createdBy,
    );

    return createdSites.map((site) => site.toResponse());
  }
}
