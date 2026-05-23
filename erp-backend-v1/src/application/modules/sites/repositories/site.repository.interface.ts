import { SiteEntity } from '../entities/site.entity';
import { CreateSiteDto, UpdateSiteDto, SiteFiltersDto } from '../dto';

export const SITE_REPOSITORY = 'SITE_REPOSITORY';

export interface ISiteRepository {
  create(
    data: CreateSiteDto,
    code: string,
    createdBy: string,
  ): Promise<SiteEntity>;
  findAll(
    filters: SiteFiltersDto,
  ): Promise<{ sites: SiteEntity[]; total: number }>;
  findAllDeleted(
    filters: SiteFiltersDto,
  ): Promise<{ sites: SiteEntity[]; total: number }>;
  findById(id: string): Promise<SiteEntity | null>;
  findByCode(code: string): Promise<SiteEntity | null>;
  update(
    id: string,
    data: UpdateSiteDto,
    updatedBy: string,
  ): Promise<SiteEntity>;
  delete(id: string, deletedBy: string, rowVersion?: number): Promise<void>;
  findDeletedById(id: string): Promise<SiteEntity | null>;
  restore(id: string, restoredBy: string): Promise<SiteEntity>;
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
  getSitesCountForCodeGeneration(): Promise<number>;
  getLastSiteCode(): Promise<string | null>;
  bulkCreate(
    sites: Array<{ data: CreateSiteDto; code: string }>,
    createdBy: string,
  ): Promise<SiteEntity[]>;
  getStats(): Promise<{
    totalSites: number;
    activeSites: number;
    inactiveSites: number;
    underPreparation: number;
    closedSites: number;
    byCity: Array<{ name: string; count: number }>;
    byState: Array<{ name: string; count: number }>;
  }>;
}
