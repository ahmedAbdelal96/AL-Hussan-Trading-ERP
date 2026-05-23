import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, Site } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { ISiteRepository } from './site.repository.interface';
import { SiteEntity } from '../entities/site.entity';
import { CreateSiteDto, UpdateSiteDto, SiteFiltersDto } from '../dto';

@Injectable()
export class SiteRepository implements ISiteRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper method to convert Prisma Site to SiteEntity
   * Converts Decimal types to number for latitude/longitude
   */
  private toEntity(site: Site): SiteEntity {
    return new SiteEntity({
      ...site,
      latitude: site.latitude ? Number(site.latitude) : null,
      longitude: site.longitude ? Number(site.longitude) : null,
      area: site.area ? Number(site.area) : null,
      capacity: site.capacity ? Number(site.capacity) : null,
    });
  }

  async create(
    data: CreateSiteDto,
    code: string,
    createdBy: string,
  ): Promise<SiteEntity> {
    const site = await this.prisma.site.create({
      data: {
        name: data.name,
        code,
        description: data.description || null,
        address: data.address,
        city: data.city,
        state: data.state || null,
        postalCode: data.postalCode || null,
        country: data.country || 'المملكة العربية السعودية',
        googleMapsLink: data.googleMapsLink || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        status: data.status || 'ACTIVE',
        area: data.area ?? null,
        contactPerson: data.contactPerson || null,
        contactPhone: data.contactPhone || null,
        contactEmail: data.contactEmail || null,
        notes: data.notes || null,
        createdBy,
      },
    });

    return this.toEntity(site);
  }

  async findAll(
    filters: SiteFiltersDto,
  ): Promise<{ sites: SiteEntity[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      search,
      status,
      city,
      state,
      country,
      code,
    } = filters;
    const skip = (page - 1) * pageSize;

    const where: Prisma.SiteWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (state) where.state = { contains: state, mode: 'insensitive' };
    if (country) where.country = { contains: country, mode: 'insensitive' };
    if (code) where.code = { contains: code, mode: 'insensitive' };

    const [sites, total] = await Promise.all([
      this.prisma.site.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.site.count({ where }),
    ]);

    return {
      sites: sites.map((site) => this.toEntity(site)),
      total,
    };
  }

  async findAllDeleted(
    filters: SiteFiltersDto,
  ): Promise<{ sites: SiteEntity[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      search,
      status,
      city,
      state,
      country,
      code,
    } = filters;
    const skip = (page - 1) * pageSize;

    const where: Prisma.SiteWhereInput = {
      deletedAt: { not: null },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (state) where.state = { contains: state, mode: 'insensitive' };
    if (country) where.country = { contains: country, mode: 'insensitive' };
    if (code) where.code = { contains: code, mode: 'insensitive' };

    const [sites, total] = await Promise.all([
      this.prisma.site.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.site.count({ where }),
    ]);

    return {
      sites: sites.map((site) => this.toEntity(site)),
      total,
    };
  }

  async findById(id: string): Promise<SiteEntity | null> {
    const site = await this.prisma.site.findFirst({
      where: { id, deletedAt: null },
    });

    return site ? this.toEntity(site) : null;
  }

  async findByCode(code: string): Promise<SiteEntity | null> {
    const site = await this.prisma.site.findFirst({
      where: { code, deletedAt: null },
    });

    return site ? this.toEntity(site) : null;
  }

  async update(
    id: string,
    data: UpdateSiteDto,
    _updatedBy: string,
  ): Promise<SiteEntity> {
    void _updatedBy;
    const updateData: Prisma.SiteUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.description !== undefined)
      updateData.description = data.description || null;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state || null;
    if (data.postalCode !== undefined)
      updateData.postalCode = data.postalCode || null;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.googleMapsLink !== undefined)
      updateData.googleMapsLink = data.googleMapsLink || null;
    if (data.latitude !== undefined)
      updateData.latitude = data.latitude ?? null;
    if (data.longitude !== undefined)
      updateData.longitude = data.longitude ?? null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.area !== undefined) updateData.area = data.area ?? null;
    if (data.contactPerson !== undefined)
      updateData.contactPerson = data.contactPerson || null;
    if (data.contactPhone !== undefined)
      updateData.contactPhone = data.contactPhone || null;
    if (data.contactEmail !== undefined)
      updateData.contactEmail = data.contactEmail || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    updateData.rowVersion = { increment: 1 };

    let site: Site | null;
    if (typeof data.rowVersion === 'number') {
      const { count } = await this.prisma.site.updateMany({
        where: { id, rowVersion: data.rowVersion },
        data: updateData as Prisma.SiteUpdateManyMutationInput,
      });
      if (count === 0) {
        throw new ConflictException(
          'Site was modified by another user. Refresh and try again.',
        );
      }
      site = await this.prisma.site.findUnique({ where: { id } });
    } else {
      site = await this.prisma.site.update({
        where: { id },
        data: updateData,
      });
    }

    if (!site) {
      throw new ConflictException(
        'Site was modified by another user. Refresh and try again.',
      );
    }

    return this.toEntity(site);
  }

  async delete(
    id: string,
    deletedBy: string,
    rowVersion?: number,
  ): Promise<void> {
    if (typeof rowVersion === 'number') {
      const { count } = await this.prisma.site.updateMany({
        where: { id, rowVersion, deletedAt: null },
        data: {
          deletedAt: new Date(),
          deletedBy,
          status: 'INACTIVE',
          rowVersion: { increment: 1 },
        },
      });
      if (count === 0) {
        throw new ConflictException(
          'Site was modified by another user. Refresh and try again.',
        );
      }
      return;
    }

    await this.prisma.site.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
        status: 'INACTIVE',
        rowVersion: { increment: 1 },
      },
    });
  }

  async findDeletedById(id: string): Promise<SiteEntity | null> {
    const site = await this.prisma.site.findFirst({
      where: {
        id,
        deletedAt: { not: null },
      },
    });

    return site ? this.toEntity(site) : null;
  }

  async restore(id: string, restoredBy: string): Promise<SiteEntity> {
    const site = await this.prisma.site.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
        status: 'ACTIVE',
        updatedBy: restoredBy,
      },
    });

    return this.toEntity(site);
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const where: any = { code, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };

    const count = await this.prisma.site.count({ where });
    return count > 0;
  }

  async getSitesCountForCodeGeneration(): Promise<number> {
    return this.prisma.site.count();
  }

  async getLastSiteCode(): Promise<string | null> {
    // Only consider auto-generated codes in SITE-NNNN format (e.g. SITE-0001).
    // Manually-assigned codes like SITE-RYD-001 use a different schema and must
    // be excluded - otherwise alphabetical ordering returns them first, causing
    // the code generator to always produce SITE-0001 and loop infinitely when
    // that code is already taken.
    const result = await this.prisma.$queryRaw<{ code: string }[]>`
      SELECT code FROM sites
      WHERE code ~ '^SITE-[0-9]+$'
      ORDER BY code DESC
      LIMIT 1
    `;

    return result[0]?.code ?? null;
  }

  async bulkCreate(
    sites: Array<{ data: CreateSiteDto; code: string }>,
    createdBy: string,
  ): Promise<SiteEntity[]> {
    const createData = sites.map(({ data, code }) => ({
      name: data.name,
      code,
      description: data.description || null,
      address: data.address,
      city: data.city,
      state: data.state || null,
      postalCode: data.postalCode || null,
      country: data.country || 'المملكة العربية السعودية',
      googleMapsLink: data.googleMapsLink || null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      status: (data.status as any) || 'ACTIVE',
      area: data.area ?? null,
      contactPerson: data.contactPerson || null,
      contactPhone: data.contactPhone || null,
      contactEmail: data.contactEmail || null,
      notes: data.notes || null,
      createdBy,
    }));

    await this.prisma.site.createMany({
      data: createData,
    });

    // Fetch all created sites
    const siteCodes = sites.map((s) => s.code);
    const createdSites = await this.prisma.site.findMany({
      where: { code: { in: siteCodes } },
    });

    return createdSites.map((site) => this.toEntity(site));
  }

  /**
   * Get simplified statistics about sites
   */
  async getStats(): Promise<{
    totalSites: number;
    activeSites: number;
    inactiveSites: number;
    underPreparation: number;
    closedSites: number;
    byCity: Array<{ name: string; count: number }>;
    byState: Array<{ name: string; count: number }>;
  }> {
    // Get essential counts in parallel for performance
    const [
      totalSites,
      activeSites,
      inactiveSites,
      underPreparation,
      closedSites,
      cityGroups,
      stateGroups,
    ] = await Promise.all([
      // Total sites (non-deleted only)
      this.prisma.site.count({
        where: { deletedAt: null },
      }),

      // Active sites
      this.prisma.site.count({
        where: { status: 'ACTIVE', deletedAt: null },
      }),

      // Inactive sites
      this.prisma.site.count({
        where: { status: 'INACTIVE', deletedAt: null },
      }),

      // Under preparation
      this.prisma.site.count({
        where: { status: 'UNDER_PREPARATION', deletedAt: null },
      }),

      // Closed sites
      this.prisma.site.count({
        where: { status: 'CLOSED', deletedAt: null },
      }),

      // Group by city
      this.prisma.site.groupBy({
        by: ['city'],
        where: { deletedAt: null },
        _count: true,
        orderBy: { _count: { city: 'desc' } },
        take: 10, // Top 10 cities
      }),

      // Group by state
      this.prisma.site.groupBy({
        by: ['state'],
        where: { deletedAt: null, state: { not: null } },
        _count: true,
        orderBy: { _count: { state: 'desc' } },
        take: 10, // Top 10 states
      }),
    ]);

    return {
      totalSites,
      activeSites,
      inactiveSites,
      underPreparation,
      closedSites,
      byCity: cityGroups
        .filter((g) => g.city !== null)
        .map((g) => ({ name: g.city, count: g._count })),
      byState: stateGroups
        .filter((g) => g.state !== null)
        .map((g) => ({ name: g.state as string, count: g._count })),
    };
  }
}
