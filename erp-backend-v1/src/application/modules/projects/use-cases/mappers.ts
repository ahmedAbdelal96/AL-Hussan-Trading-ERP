/**
 * Shared Mappers
 * Common mapping functions for use-cases
 */

import { ProjectResponseDto, ProjectMediaResponseDto } from '../dto';

export class ProjectMappers {
  static toProjectResponseDto(project: any): ProjectResponseDto {
    return {
      id: project.id,
      projectCode: project.projectCode,
      name: project.name,
      tenderNumber: project.tenderNumber,
      description: project.description,
      clientName: project.clientName,
      clientPhone: project.clientPhone,
      clientEmail: project.clientEmail,
      siteId: project.siteId,
      site: project.site
        ? {
            id: project.site.id,
            name: project.site.name,
            code: project.site.code,
            city: project.site.city,
            state: project.site.state,
            status: project.site.status,
          }
        : null,
      googleMapsLink: project.googleMapsLink,
      location: project.location,
      latitude: project.latitude?.toNumber() || null,
      longitude: project.longitude?.toNumber() || null,
      status: project.status,
      plannedStartDate: project.plannedStartDate?.toISOString() || null,
      actualStartDate: project.actualStartDate?.toISOString() || null,
      plannedEndDate: project.plannedEndDate?.toISOString() || null,
      actualEndDate: project.actualEndDate?.toISOString() || null,
      budget: project.budget?.toNumber() || null,
      currency: project.currency,
      completionPercentage: project.completionPercentage.toNumber(),
      progressNotes: project.progressNotes,
      lastProgressUpdate: project.lastProgressUpdate?.toISOString() || null,
      managerId: project.managerId,
      notes: project.notes,
      deletedAt: project.deletedAt?.toISOString() || null,
      deletedBy: project.deletedBy,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      createdBy: project.createdBy,
      updatedBy: project.updatedBy,
      employeeCount: project.employeeCount ?? 0,
      rowVersion: project.rowVersion,
    };
  }

  static toMediaResponseDto(media: any): ProjectMediaResponseDto {
    return {
      id: media.id,
      projectId: media.projectId,
      fileName: media.fileName,
      originalName: media.originalName,
      filePath: media.filePath,
      fileSize: media.fileSize,
      mimeType: media.mimeType,
      category: media.category,
      title: media.title,
      description: media.description,
      latitude: media.latitude?.toNumber() || null,
      longitude: media.longitude?.toNumber() || null,
      capturedAt: media.capturedAt?.toISOString() || null,
      displayOrder: media.displayOrder,
      deletedAt: media.deletedAt?.toISOString() || null,
      deletedBy: media.deletedBy,
      uploadedBy: media.uploadedBy,
      uploadedAt: media.uploadedAt.toISOString(),
      updatedAt: media.updatedAt.toISOString(),
    };
  }
}
