/**
 * Restore Site Use Case
 *
 * Restores a soft-deleted site.
 *
 * Business Rules:
 * - Site must be soft-deleted (deletedAt IS NOT NULL)
 * - Clears deletion metadata
 * - Logs the restoration in audit trail
 *
 * Security Considerations:
 * - Validates site exists and is actually deleted
 * - Prevents restoration of permanently deleted sites
 * - Tracks who performed the restoration
 *
 * @module RestoreSiteUseCase
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { ISiteRepository } from '../repositories';
import { SITE_REPOSITORY } from '../repositories';
import { SiteEntity } from '../entities/site.entity';

@Injectable()
export class RestoreSiteUseCase {
  constructor(
    @Inject(SITE_REPOSITORY) private siteRepository: ISiteRepository,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Execute the restore operation
   *
   * @param siteId - UUID of the site to restore
   * @param restoredBy - UUID of the user performing the restoration
   * @returns The restored site data
   * @throws NotFoundException if site doesn't exist
   * @throws BadRequestException if site is not deleted
   */
  async execute(siteId: string, restoredBy: string): Promise<SiteEntity> {
    // Find the deleted site (including soft-deleted)
    const site = await this.siteRepository.findDeletedById(siteId);

    if (!site) {
      throw new NotFoundException(this.i18n.t('sites.get.notFound'));
    }

    // Verify site is actually deleted
    if (!site.deletedAt) {
      throw new BadRequestException(
        this.i18n.t('sites.restore.notDeleted', {
          args: { name: site.name },
        }),
      );
    }

    // Restore the site
    const restoredSite = await this.siteRepository.restore(siteId, restoredBy);

    return restoredSite;
  }
}
