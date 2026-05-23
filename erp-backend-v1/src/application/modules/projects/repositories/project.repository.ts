/**
 * Project Repository Implementation
 * Handles all database operations for projects
 */

import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { IProjectRepository } from './project.repository.interface';
import { ProjectEntity, ProjectMediaEntity } from '../entities';
import { ProjectFiltersDto, MediaFiltersDto } from '../dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectRepository implements IProjectRepository {
  private readonly logger = new Logger(ProjectRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new project
   */
  async create(data: any, userId: string): Promise<ProjectEntity> {
    this.logger.log(`Creating new project: ${data.name}`);

    // Generate project code
    const projectCode = await this.generateProjectCode();

    const project = await this.prisma.project.create({
      data: {
        projectCode,
        name: data.name,
        tenderNumber: data.tenderNumber,
        description: data.description,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail,
        siteId: data.siteId,
        googleMapsLink: data.googleMapsLink,
        status: data.status || 'PLANNING',
        plannedStartDate: data.plannedStartDate
          ? new Date(data.plannedStartDate as string)
          : null,
        actualStartDate: data.actualStartDate
          ? new Date(data.actualStartDate as string)
          : null,
        budget: data.budget ? new Prisma.Decimal(data.budget as string) : null,
        currency: 'SAR', // Always SAR for Saudi company
        managerId: data.managerId,
        notes: data.notes,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    this.logger.log(`Project created successfully: ${project.projectCode}`);
    return this.mapToEntity(project);
  }

  /**
   * Find project by ID
   */
  async findById(id: string): Promise<ProjectEntity | null> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
            state: true,
            status: true,
          },
        },
        _count: { select: { employees: true } },
      },
    });

    return project ? this.mapToEntity(project) : null;
  }

  /**
   * Find all projects with filters and pagination
   */
  async findAll(
    filters: ProjectFiltersDto,
  ): Promise<{ data: ProjectEntity[]; total: number }> {
    const {
      page = 1,
      limit = 5,
      search,
      status,
      siteId,
      managerId,
      clientName,
      startDateFrom,
      startDateTo,
      minCompletion,
      maxCompletion,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProjectWhereInput = {
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { projectCode: { contains: search, mode: 'insensitive' } },
          { tenderNumber: { contains: search, mode: 'insensitive' } },
          { clientName: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(status && { status }),
      ...(siteId && { siteId }),
      ...(managerId && { managerId }),
      ...(clientName && {
        clientName: { contains: clientName, mode: 'insensitive' },
      }),
      ...(startDateFrom && {
        actualStartDate: { gte: new Date(startDateFrom) },
      }),
      ...(startDateTo && {
        actualStartDate: { lte: new Date(startDateTo) },
      }),
      ...(minCompletion !== undefined && {
        completionPercentage: { gte: new Prisma.Decimal(minCompletion) },
      }),
      ...(maxCompletion !== undefined && {
        completionPercentage: { lte: new Prisma.Decimal(maxCompletion) },
      }),
    };

    // Execute query with pagination
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          site: {
            select: {
              id: true,
              name: true,
              code: true,
              city: true,
              state: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map((p) => this.mapToEntity(p)),
      total,
    };
  }

  /**
   * Update project
   */
  async update(id: string, data: any, userId: string): Promise<ProjectEntity> {
    this.logger.log(`Updating project: ${id}`);

    // Check if project exists
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const updatePayload: any = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.tenderNumber !== undefined && {
        tenderNumber: data.tenderNumber,
      }),
      ...(data.description !== undefined && {
        description: data.description,
      }),
      ...(data.clientName !== undefined && { clientName: data.clientName }),
      ...(data.clientPhone !== undefined && {
        clientPhone: data.clientPhone,
      }),
      ...(data.clientEmail !== undefined && {
        clientEmail: data.clientEmail,
      }),
      ...(data.siteId !== undefined && { siteId: data.siteId }),
      ...(data.googleMapsLink !== undefined && {
        googleMapsLink: data.googleMapsLink,
      }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.latitude !== undefined && {
        latitude: data.latitude
          ? new Prisma.Decimal(data.latitude as string)
          : null,
      }),
      ...(data.longitude !== undefined && {
        longitude: data.longitude
          ? new Prisma.Decimal(data.longitude as string)
          : null,
      }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.plannedStartDate !== undefined && {
        plannedStartDate: data.plannedStartDate
          ? new Date(data.plannedStartDate as string)
          : null,
      }),
      ...(data.actualStartDate !== undefined && {
        actualStartDate: data.actualStartDate
          ? new Date(data.actualStartDate as string)
          : null,
      }),
      ...(data.plannedEndDate !== undefined && {
        plannedEndDate: data.plannedEndDate
          ? new Date(data.plannedEndDate as string)
          : null,
      }),
      ...(data.actualEndDate !== undefined && {
        actualEndDate: data.actualEndDate
          ? new Date(data.actualEndDate as string)
          : null,
      }),
      ...(data.budget !== undefined && {
        budget: data.budget ? new Prisma.Decimal(data.budget as string) : null,
      }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.managerId !== undefined && { managerId: data.managerId }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.completionPercentage !== undefined && {
        completionPercentage: data.completionPercentage
          ? new Prisma.Decimal(data.completionPercentage as string)
          : undefined,
      }),
      ...(data.progressNotes !== undefined && {
        progressNotes: data.progressNotes,
      }),
      ...(data.lastProgressUpdate !== undefined && {
        lastProgressUpdate: data.lastProgressUpdate
          ? new Date(data.lastProgressUpdate as string)
          : undefined,
      }),
      updatedBy: userId,
      rowVersion: { increment: 1 },
    };

    if (typeof data.rowVersion === 'number') {
      const { count } = await this.prisma.project.updateMany({
        where: { id, rowVersion: data.rowVersion },
        data: updatePayload,
      });
      if (count === 0) {
        throw new ConflictException(
          'Project was modified by another user. Refresh and try again.',
        );
      }
    } else {
      await this.prisma.project.update({
        where: { id },
        data: updatePayload,
      });
    }

    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    this.logger.log(`Project updated successfully: ${project.projectCode}`);
    return this.mapToEntity(project);
  }

  /**
   * Soft delete project
   */
  async delete(id: string, userId: string, rowVersion?: number): Promise<void> {
    this.logger.log(`Soft deleting project: ${id}`);

    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    if (typeof rowVersion === 'number') {
      const { count } = await this.prisma.project.updateMany({
        where: { id, rowVersion, deletedAt: null },
        data: {
          deletedAt: new Date(),
          deletedBy: userId,
          rowVersion: { increment: 1 },
        },
      });

      if (count === 0) {
        throw new ConflictException(
          'Project was modified by another user. Refresh and try again.',
        );
      }
    } else {
      await this.prisma.project.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: userId,
          rowVersion: { increment: 1 },
        },
      });
    }

    this.logger.log(`Project soft deleted successfully: ${id}`);
  }

  /**
   * Restore soft-deleted project
   */
  async restore(id: string): Promise<ProjectEntity> {
    this.logger.log(`Restoring project: ${id}`);

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });

    this.logger.log(`Project restored successfully: ${project.projectCode}`);
    return this.mapToEntity(project);
  }

  /**
   * Update project progress
   */
  async updateProgress(
    id: string,
    completionPercentage: number,
    progressNotes?: string,
    userId?: string,
  ): Promise<ProjectEntity> {
    this.logger.log(
      `Updating progress for project: ${id} to ${completionPercentage}%`,
    );

    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        completionPercentage: new Prisma.Decimal(completionPercentage),
        progressNotes: progressNotes || existing.progressNotes,
        lastProgressUpdate: new Date(),
        ...(userId && { updatedBy: userId }),
        rowVersion: { increment: 1 },
      },
    });

    this.logger.log(
      `Progress updated successfully for project: ${project.projectCode}`,
    );
    return this.mapToEntity(project);
  }

  /**
   * Generate unique project code (PRJ-0001, PRJ-0002, etc.)
   */
  async generateProjectCode(): Promise<string> {
    // Get the latest project code
    const lastProject = await this.prisma.project.findFirst({
      where: { projectCode: { startsWith: 'PRJ-' } },
      orderBy: { projectCode: 'desc' },
      select: { projectCode: true },
    });

    if (!lastProject) {
      return 'PRJ-0001';
    }

    // Extract number from last code and increment
    const lastNumber = parseInt(lastProject.projectCode.split('-')[1], 10);
    const nextNumber = lastNumber + 1;

    return `PRJ-${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Find project by project code
   */
  async findByProjectCode(projectCode: string): Promise<ProjectEntity | null> {
    const project = await this.prisma.project.findUnique({
      where: { projectCode },
    });

    return project ? this.mapToEntity(project) : null;
  }

  /**
   * Upload media to project
   */
  async uploadMedia(
    projectId: string,
    fileData: {
      fileName: string;
      originalName: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
    },
    mediaData: any,
    userId: string,
  ): Promise<ProjectMediaEntity> {
    this.logger.log(`Uploading media to project: ${projectId}`);

    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const media = await this.prisma.projectMedia.create({
      data: {
        projectId,
        fileName: fileData.fileName,
        originalName: fileData.originalName,
        filePath: fileData.filePath,
        fileSize: fileData.fileSize,
        mimeType: fileData.mimeType,
        category: mediaData.category || 'OTHER',
        title: mediaData.title,
        description: mediaData.description,
        latitude: mediaData.latitude
          ? new Prisma.Decimal(mediaData.latitude as string)
          : null,
        longitude: mediaData.longitude
          ? new Prisma.Decimal(mediaData.longitude as string)
          : null,
        capturedAt: mediaData.capturedAt
          ? new Date(mediaData.capturedAt as string)
          : null,
        displayOrder: mediaData.displayOrder,
        uploadedBy: userId,
      },
    });

    this.logger.log(`Media uploaded successfully: ${media.id}`);
    return this.mapMediaToEntity(media);
  }

  /**
   * Find media by ID
   */
  async findMediaById(mediaId: string): Promise<ProjectMediaEntity | null> {
    const media = await this.prisma.projectMedia.findUnique({
      where: { id: mediaId },
    });

    return media ? this.mapMediaToEntity(media) : null;
  }

  /**
   * Find all media for a project with filters
   */
  async findMediaByProject(
    projectId: string,
    filters: MediaFiltersDto,
  ): Promise<{ data: ProjectMediaEntity[]; total: number }> {
    const {
      page = 1,
      limit = 50,
      category,
      search,
      sortBy = 'uploadedAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.ProjectMediaWhereInput = {
      projectId,
      deletedAt: null,
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { originalName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [media, total] = await Promise.all([
      this.prisma.projectMedia.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.projectMedia.count({ where }),
    ]);

    return {
      data: media.map((m) => this.mapMediaToEntity(m)),
      total,
    };
  }

  /**
   * Soft delete media
   */
  async deleteMedia(mediaId: string, userId: string): Promise<void> {
    this.logger.log(`Soft deleting media: ${mediaId}`);

    const existing = await this.prisma.projectMedia.findUnique({
      where: { id: mediaId },
    });
    if (!existing) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`);
    }

    await this.prisma.projectMedia.update({
      where: { id: mediaId },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    this.logger.log(`Media soft deleted successfully: ${mediaId}`);
  }

  /**
   * Find projects by site ID
   */
  async findBySiteId(siteId: string): Promise<ProjectEntity[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        siteId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((p) => this.mapToEntity(p));
  }

  /**
   * Get project statistics
   */
  async getProjectStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    avgCompletion: number;
  }> {
    const [total, byStatus, avgResult] = await Promise.all([
      this.prisma.project.count({ where: { deletedAt: null } }),
      this.prisma.project.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.project.aggregate({
        where: { deletedAt: null },
        _avg: { completionPercentage: true },
      }),
    ]);

    const byStatusMap: Record<string, number> = {};
    byStatus.forEach((item) => {
      byStatusMap[item.status] = item._count.id;
    });

    return {
      total,
      byStatus: byStatusMap,
      avgCompletion: avgResult._avg.completionPercentage?.toNumber() || 0,
    };
  }

  /**
   * Map Prisma Project to ProjectEntity
   */
  private mapToEntity(prismaProject: any): ProjectEntity {
    return new ProjectEntity({
      id: prismaProject.id,
      projectCode: prismaProject.projectCode,
      name: prismaProject.name,
      tenderNumber: prismaProject.tenderNumber,
      description: prismaProject.description,
      clientName: prismaProject.clientName,
      clientPhone: prismaProject.clientPhone,
      clientEmail: prismaProject.clientEmail,
      siteId: prismaProject.siteId,
      site: prismaProject.site
        ? {
            id: prismaProject.site.id,
            name: prismaProject.site.name,
            code: prismaProject.site.code,
            city: prismaProject.site.city,
            state: prismaProject.site.state,
            status: prismaProject.site.status,
          }
        : null,
      googleMapsLink: prismaProject.googleMapsLink,
      location: prismaProject.location,
      latitude: prismaProject.latitude,
      longitude: prismaProject.longitude,
      status: prismaProject.status,
      plannedStartDate: prismaProject.plannedStartDate,
      actualStartDate: prismaProject.actualStartDate,
      plannedEndDate: prismaProject.plannedEndDate,
      actualEndDate: prismaProject.actualEndDate,
      budget: prismaProject.budget,
      currency: prismaProject.currency,
      completionPercentage: prismaProject.completionPercentage,
      progressNotes: prismaProject.progressNotes,
      lastProgressUpdate: prismaProject.lastProgressUpdate,
      managerId: prismaProject.managerId,
      notes: prismaProject.notes,
      employeeCount: prismaProject._count?.employees ?? 0,
      deletedAt: prismaProject.deletedAt,
      deletedBy: prismaProject.deletedBy,
      createdAt: prismaProject.createdAt,
      updatedAt: prismaProject.updatedAt,
      createdBy: prismaProject.createdBy,
      updatedBy: prismaProject.updatedBy,
      rowVersion: prismaProject.rowVersion,
    });
  }

  /**
   * Map Prisma ProjectMedia to ProjectMediaEntity
   */
  private mapMediaToEntity(prismaMedia: any): ProjectMediaEntity {
    return new ProjectMediaEntity({
      id: prismaMedia.id,
      projectId: prismaMedia.projectId,
      fileName: prismaMedia.fileName,
      originalName: prismaMedia.originalName,
      filePath: prismaMedia.filePath,
      fileSize: prismaMedia.fileSize,
      mimeType: prismaMedia.mimeType,
      category: prismaMedia.category,
      title: prismaMedia.title,
      description: prismaMedia.description,
      latitude: prismaMedia.latitude,
      longitude: prismaMedia.longitude,
      capturedAt: prismaMedia.capturedAt,
      displayOrder: prismaMedia.displayOrder,
      deletedAt: prismaMedia.deletedAt,
      deletedBy: prismaMedia.deletedBy,
      uploadedBy: prismaMedia.uploadedBy,
      uploadedAt: prismaMedia.uploadedAt,
      updatedAt: prismaMedia.updatedAt,
    });
  }
}
