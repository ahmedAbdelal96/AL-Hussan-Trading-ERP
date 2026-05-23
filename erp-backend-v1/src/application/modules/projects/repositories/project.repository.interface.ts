/**
 * Project Repository Interface
 * Defines contract for project data access
 */

import { ProjectEntity, ProjectMediaEntity } from '../entities';
import { ProjectFiltersDto, MediaFiltersDto } from '../dto';

export interface IProjectRepository {
  // Project CRUD operations
  create(data: any, userId: string): Promise<ProjectEntity>;
  findById(id: string): Promise<ProjectEntity | null>;
  findAll(
    filters: ProjectFiltersDto,
  ): Promise<{ data: ProjectEntity[]; total: number }>;
  update(id: string, data: any, userId: string): Promise<ProjectEntity>;
  delete(id: string, userId: string, rowVersion?: number): Promise<void>;
  restore(id: string): Promise<ProjectEntity>;

  // Progress tracking
  updateProgress(
    id: string,
    completionPercentage: number,
    progressNotes?: string,
    userId?: string,
  ): Promise<ProjectEntity>;

  // Project code generation
  generateProjectCode(): Promise<string>;
  findByProjectCode(projectCode: string): Promise<ProjectEntity | null>;

  // Media operations
  uploadMedia(
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
  ): Promise<ProjectMediaEntity>;

  findMediaById(mediaId: string): Promise<ProjectMediaEntity | null>;
  findMediaByProject(
    projectId: string,
    filters: MediaFiltersDto,
  ): Promise<{ data: ProjectMediaEntity[]; total: number }>;
  deleteMedia(mediaId: string, userId: string): Promise<void>;

  // Site-related operations
  findBySiteId(siteId: string): Promise<ProjectEntity[]>;

  // Statistics
  getProjectStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    avgCompletion: number;
  }>;
}

export const PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY');
