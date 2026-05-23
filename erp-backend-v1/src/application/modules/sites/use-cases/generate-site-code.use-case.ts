import { Injectable, Inject } from '@nestjs/common';
import type { ISiteRepository } from '../repositories';
import { SITE_REPOSITORY } from '../repositories';

/**
 * Generates unique site codes in format: SITE-XXXX
 * Example: SITE-0001, SITE-0002
 */
@Injectable()
export class GenerateSiteCodeUseCase {
  constructor(
    @Inject(SITE_REPOSITORY)
    private siteRepository: ISiteRepository,
  ) {}

  async execute(attempt = 0): Promise<string> {
    if (attempt > 100) {
      throw new Error(
        'Failed to generate a unique site code after 100 attempts',
      );
    }

    // Counter-based generation requested by product:
    // next = current number of sites in DB + 1.
    // We still keep uniqueness retry for concurrency safety.
    const sitesCount =
      await this.siteRepository.getSitesCountForCodeGeneration();
    const nextNumber = sitesCount + 1 + attempt;

    // Format: SITE-XXXX (e.g., SITE-0001)
    const siteCode = `SITE-${String(nextNumber).padStart(4, '0')}`;

    // Ensure uniqueness (in case of race conditions)
    const exists = await this.siteRepository.existsByCode(siteCode);
    if (exists) {
      // Retry with incremented attempt counter to avoid infinite loop
      return this.execute(attempt + 1);
    }

    return siteCode;
  }
}
