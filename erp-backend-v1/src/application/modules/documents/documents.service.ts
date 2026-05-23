/**
 * Documents Service
 * Handles document upload/delete for any entity type
 */

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Multer } from 'multer';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { DocumentType } from '@prisma/client';

export interface UploadDocumentParams {
  entityType:
    | 'employee'
    | 'employees'
    | 'asset'
    | 'assets'
    | 'project'
    | 'projects'
    | 'maintenance'
    | 'user';
  entityId: string;
  entityCode: string; // For file naming (EMP-001, ASSET-001, PRJ-001, etc.)
  files: Multer.File[];
  documentType?: DocumentType;
  documentName?: string;
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
  uploadedBy: string;
}

type NormalizedEntityType = 'employee' | 'project' | 'asset' | 'maintenance';
type StoredDocumentRecord = {
  id: string;
  filePath: string;
  documentName: string;
  mimeType: string;
  documentType?: DocumentType;
  issueDate?: Date | null;
  expiryDate?: Date | null;
  notes?: string | null;
};

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Normalize singular/plural aliases to a canonical entity type.
   * We keep this centralized so all document operations behave consistently.
   */
  private normalizeEntityType(entityType: string): NormalizedEntityType {
    const normalized = entityType?.toLowerCase?.().trim?.();
    switch (normalized) {
      case 'employee':
      case 'employees':
        return 'employee';
      case 'project':
      case 'projects':
        return 'project';
      case 'asset':
      case 'assets':
        return 'asset';
      case 'maintenance':
        return 'maintenance';
      default:
        throw new BadRequestException(`Unsupported entity type: ${entityType}`);
    }
  }

  /**
   * Resolve entity code used in file naming.
   * This removes hardcoded placeholders and guarantees traceable storage paths.
   */
  async resolveEntityCode(
    entityType: string,
    entityId: string,
  ): Promise<string> {
    const normalizedType = this.normalizeEntityType(entityType);

    switch (normalizedType) {
      case 'employee': {
        const employee = await this.prisma.employee.findUnique({
          where: { id: entityId },
          select: { employeeNumber: true, deletedAt: true },
        });
        if (!employee || employee.deletedAt) {
          throw new NotFoundException('Employee not found');
        }
        return employee.employeeNumber;
      }
      case 'project': {
        const project = await this.prisma.project.findUnique({
          where: { id: entityId },
          select: { projectCode: true, deletedAt: true },
        });
        if (!project || project.deletedAt) {
          throw new NotFoundException('Project not found');
        }
        return project.projectCode;
      }
      case 'asset': {
        const asset = await this.prisma.asset.findUnique({
          where: { id: entityId },
          select: { assetNumber: true, deletedAt: true },
        });
        if (!asset || asset.deletedAt) {
          throw new NotFoundException('Asset not found');
        }
        return asset.assetNumber;
      }
      case 'maintenance': {
        const request = await this.prisma.maintenanceRequest.findUnique({
          where: { id: entityId },
          select: { maintenanceNumber: true },
        });
        if (!request) {
          throw new NotFoundException('Maintenance request not found');
        }
        return request.maintenanceNumber;
      }
      default:
        // Exhaustiveness safety
        throw new BadRequestException(`Unsupported entity type: ${entityType}`);
    }
  }

  /**
   * Resolve entity code using document id.
   * Used by update flow where API receives (entityType, documentId) only.
   */
  async resolveEntityCodeByDocument(
    entityType: string,
    documentId: string,
  ): Promise<string> {
    const normalizedType = this.normalizeEntityType(entityType);

    switch (normalizedType) {
      case 'employee': {
        const doc = await this.prisma.employeeDocument.findUnique({
          where: { id: documentId },
          select: { employeeId: true },
        });
        if (!doc) {
          throw new NotFoundException('Document not found');
        }
        return this.resolveEntityCode('employee', doc.employeeId);
      }
      case 'project': {
        const doc = await this.prisma.projectDocument.findUnique({
          where: { id: documentId },
          select: { projectId: true },
        });
        if (!doc) {
          throw new NotFoundException('Document not found');
        }
        return this.resolveEntityCode('project', doc.projectId);
      }
      case 'asset': {
        const doc = await this.prisma.assetDocument.findUnique({
          where: { id: documentId },
          select: { assetId: true },
        });
        if (!doc) {
          throw new NotFoundException('Document not found');
        }
        return this.resolveEntityCode('asset', doc.assetId);
      }
      case 'maintenance': {
        const doc = await this.prisma.maintenanceDocument.findUnique({
          where: { id: documentId },
          select: { maintenanceId: true },
        });
        if (!doc) {
          throw new NotFoundException('Document not found');
        }
        return this.resolveEntityCode('maintenance', doc.maintenanceId);
      }
      default:
        throw new BadRequestException(`Unsupported entity type: ${entityType}`);
    }
  }

  /**
   * Upload documents for any entity
   */
  async uploadDocuments(params: UploadDocumentParams) {
    const {
      entityType,
      entityId,
      entityCode,
      files,
      documentType = DocumentType.OTHER,
      documentName,
      issueDate,
      expiryDate,
      notes,
      uploadedBy,
    } = params;
    const normalizedEntityType = this.normalizeEntityType(entityType);

    // Get current document count for this entity (for sequential naming)
    const existingCount = await this.getDocumentCount(
      normalizedEntityType,
      entityId,
    );

    // Upload files to storage
    const uploadedFiles = await this.storageService.uploadFiles(
      files,
      normalizedEntityType,
      entityCode,
      existingCount,
    );

    // Save metadata to database
    const documents = await Promise.all(
      uploadedFiles.map(async (file, index) => {
        const docName =
          documentName || files[index].originalname || file.fileName;

        // Choose the correct table based on entity type
        switch (normalizedEntityType) {
          case 'employee':
            return await this.prisma.employeeDocument.create({
              data: {
                employeeId: entityId,
                documentType,
                documentName: docName,
                filePath: file.filePath,
                fileSize: file.size,
                mimeType: file.mimeType,
                issueDate: issueDate ? new Date(issueDate) : null,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                notes,
                uploadedBy,
              },
            });

          case 'project':
            return await this.prisma.projectDocument.create({
              data: {
                projectId: entityId,
                documentType,
                documentName: docName,
                filePath: file.filePath,
                fileSize: file.size,
                mimeType: file.mimeType,
                issueDate: issueDate ? new Date(issueDate) : null,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                notes,
                uploadedBy,
              },
            });

          case 'asset':
            return await this.prisma.assetDocument.create({
              data: {
                assetId: entityId,
                documentType,
                documentName: docName,
                filePath: file.filePath,
                fileSize: file.size,
                mimeType: file.mimeType,
                issueDate: issueDate ? new Date(issueDate) : null,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                notes,
                uploadedBy,
              },
            });

          case 'maintenance':
            return await this.prisma.maintenanceDocument.create({
              data: {
                maintenanceId: entityId,
                documentType,
                documentName: docName,
                filePath: file.filePath,
                fileSize: file.size,
                mimeType: file.mimeType,
                issueDate: issueDate ? new Date(issueDate) : null,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                notes,
                uploadedBy,
              },
            });

          // Add other entity types as needed
          default:
            throw new Error(`Unsupported entity type: ${entityType}`);
        }
      }),
    );

    this.logger.log(
      `Uploaded ${documents.length} documents for ${entityType}:${entityId}`,
    );

    return documents;
  }

  /**
   * Get document count for entity (for sequential naming)
   */
  private async getDocumentCount(
    entityType: string,
    entityId: string,
  ): Promise<number> {
    const normalizedType = this.normalizeEntityType(entityType);
    switch (normalizedType) {
      case 'employee':
        return await this.prisma.employeeDocument.count({
          where: { employeeId: entityId },
        });

      case 'project':
        return await this.prisma.projectDocument.count({
          where: { projectId: entityId },
        });

      case 'asset':
        return await this.prisma.assetDocument.count({
          where: { assetId: entityId },
        });

      case 'maintenance':
        return await this.prisma.maintenanceDocument.count({
          where: { maintenanceId: entityId },
        });

      // Add other entity types
      default:
        throw new BadRequestException(`Unsupported entity type: ${entityType}`);
    }
  }

  /**
   * Get all documents for an entity
   */
  async getDocuments(entityType: string, entityId: string) {
    const normalizedType = this.normalizeEntityType(entityType);
    switch (normalizedType) {
      case 'employee':
        return await this.prisma.employeeDocument.findMany({
          where: { employeeId: entityId },
          orderBy: { uploadedAt: 'desc' },
        });

      case 'project':
        return await this.prisma.projectDocument.findMany({
          where: { projectId: entityId },
          orderBy: { uploadedAt: 'desc' },
        });

      case 'asset':
        return await this.prisma.assetDocument.findMany({
          where: { assetId: entityId },
          orderBy: { uploadedAt: 'desc' },
        });

      case 'maintenance':
        return await this.prisma.maintenanceDocument.findMany({
          where: { maintenanceId: entityId },
          orderBy: { uploadedAt: 'desc' },
        });

      // Add other entity types
      default:
        throw new BadRequestException(`Unsupported entity type: ${entityType}`);
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(entityType: string, documentId: string, userId: string) {
    let document: StoredDocumentRecord | null = null;
    const normalizedType = this.normalizeEntityType(entityType);

    // Get document
    switch (normalizedType) {
      case 'employee':
        document = await this.prisma.employeeDocument.findUnique({
          where: { id: documentId },
        });
        break;

      case 'project':
        document = await this.prisma.projectDocument.findUnique({
          where: { id: documentId },
        });
        break;

      case 'asset':
        document = await this.prisma.assetDocument.findUnique({
          where: { id: documentId },
        });
        break;

      case 'maintenance':
        document = await this.prisma.maintenanceDocument.findUnique({
          where: { id: documentId },
        });
        break;

      default:
        throw new BadRequestException(`Unsupported entity type: ${entityType}`);
    }

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete from storage
    await this.storageService.deleteFile(document.filePath);

    // Delete from database
    switch (normalizedType) {
      case 'employee':
        await this.prisma.employeeDocument.delete({
          where: { id: documentId },
        });
        break;

      case 'project':
        await this.prisma.projectDocument.delete({
          where: { id: documentId },
        });
        break;

      case 'asset':
        await this.prisma.assetDocument.delete({
          where: { id: documentId },
        });
        break;

      case 'maintenance':
        await this.prisma.maintenanceDocument.delete({
          where: { id: documentId },
        });
        break;
    }

    this.logger.log(`Deleted document ${documentId} by user ${userId}`);

    return { message: 'Document deleted successfully' };
  }

  /**
   * Update/Replace document
   * Deletes old file and uploads new one
   */
  async updateDocument(
    entityType: string,
    documentId: string,
    newFile: Multer.File,
    entityCode: string,
    updateData?: {
      documentType?: DocumentType;
      documentName?: string;
      issueDate?: string;
      expiryDate?: string;
      notes?: string;
    },
    userId?: string,
  ) {
    let oldDocument: StoredDocumentRecord | null = null;
    const normalizedType = this.normalizeEntityType(entityType);

    // 1. Get old document from database
    switch (normalizedType) {
      case 'employee':
        oldDocument = await this.prisma.employeeDocument.findUnique({
          where: { id: documentId },
        });
        break;
      case 'project':
        oldDocument = await this.prisma.projectDocument.findUnique({
          where: { id: documentId },
        });
        break;
      case 'asset':
        oldDocument = await this.prisma.assetDocument.findUnique({
          where: { id: documentId },
        });
        break;
      case 'maintenance':
        oldDocument = await this.prisma.maintenanceDocument.findUnique({
          where: { id: documentId },
        });
        break;

      default:
        throw new BadRequestException(`Unsupported entity type: ${entityType}`);
    }

    if (!oldDocument) {
      throw new NotFoundException('Document not found');
    }

    const oldFilePath = oldDocument.filePath;

    try {
      // 2. Upload new file (with same index to keep numbering)
      // Extract index from old filename (e.g., EMP-001-003.jpg -> 3)
      const oldFileName = oldFilePath.split('/').pop();
      const indexMatch = oldFileName?.match(/-(\d{3})\./);
      const index = indexMatch ? parseInt(indexMatch[1], 10) - 1 : 0;

      const uploadResult = await this.storageService.uploadFile(
        newFile,
        normalizedType,
        entityCode,
        index,
      );

      // 3. Update database record
      const updatedDocument = await this.updateDocumentInDb(
        entityType,
        // normalized type is expected by update helper
        documentId,
        {
          ...uploadResult,
          documentType: (updateData?.documentType ??
            oldDocument.documentType) as DocumentType,
          documentName: updateData?.documentName || newFile.originalname,
          issueDate: updateData?.issueDate
            ? new Date(updateData.issueDate)
            : oldDocument.issueDate,
          expiryDate: updateData?.expiryDate
            ? new Date(updateData.expiryDate)
            : oldDocument.expiryDate,
          notes: updateData?.notes ?? oldDocument.notes,
        },
      );

      // 4. Delete old file from storage (after successful upload)
      try {
        await this.storageService.deleteFile(oldFilePath);
        this.logger.log(`Deleted old file: ${oldFilePath}`);
      } catch (error) {
        // Log error but don't fail the update
        this.logger.warn(`Failed to delete old file: ${oldFilePath}`, error);
      }

      this.logger.log(
        `Updated document ${documentId} for ${entityType} by user ${userId}`,
      );

      return updatedDocument;
    } catch (error) {
      // If upload fails, keep old file
      this.logger.error(`Failed to update document ${documentId}`, error);
      throw error;
    }
  }

  /**
   * Helper: Update document in database
   */
  private async updateDocumentInDb(
    entityType: string,
    documentId: string,
    data: {
      fileName: string;
      filePath: string;
      size: number;
      mimeType: string;
      documentType: DocumentType;
      documentName: string;
      issueDate?: Date | null;
      expiryDate?: Date | null;
      notes?: string | null;
    },
  ) {
    const normalizedType = this.normalizeEntityType(entityType);
    switch (normalizedType) {
      case 'employee':
        return await this.prisma.employeeDocument.update({
          where: { id: documentId },
          data: {
            documentType: data.documentType,
            documentName: data.documentName,
            filePath: data.filePath,
            fileSize: data.size,
            mimeType: data.mimeType,
            issueDate: data.issueDate,
            expiryDate: data.expiryDate,
            notes: data.notes,
          },
        });

      case 'project':
        return await this.prisma.projectDocument.update({
          where: { id: documentId },
          data: {
            documentType: data.documentType,
            documentName: data.documentName,
            filePath: data.filePath,
            fileSize: data.size,
            mimeType: data.mimeType,
            issueDate: data.issueDate,
            expiryDate: data.expiryDate,
            notes: data.notes,
          },
        });

      case 'asset':
        return await this.prisma.assetDocument.update({
          where: { id: documentId },
          data: {
            documentType: data.documentType,
            documentName: data.documentName,
            filePath: data.filePath,
            fileSize: data.size,
            mimeType: data.mimeType,
            issueDate: data.issueDate,
            expiryDate: data.expiryDate,
            notes: data.notes,
          },
        });

      case 'maintenance':
        return await this.prisma.maintenanceDocument.update({
          where: { id: documentId },
          data: {
            documentType: data.documentType,
            documentName: data.documentName,
            filePath: data.filePath,
            fileSize: data.size,
            mimeType: data.mimeType,
            issueDate: data.issueDate,
            expiryDate: data.expiryDate,
            notes: data.notes,
          },
        });

      default:
        throw new BadRequestException(`Unsupported entity type: ${entityType}`);
    }
  }

  /**
   * Download document
   */
  async downloadDocument(
    entityType: string,
    documentId: string,
  ): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    let document: StoredDocumentRecord | null = null;
    const normalizedType = this.normalizeEntityType(entityType);

    // Get document
    switch (normalizedType) {
      case 'employee':
        document = await this.prisma.employeeDocument.findUnique({
          where: { id: documentId },
        });
        break;

      case 'project':
        document = await this.prisma.projectDocument.findUnique({
          where: { id: documentId },
        });
        break;

      case 'asset':
        document = await this.prisma.assetDocument.findUnique({
          where: { id: documentId },
        });
        break;

      case 'maintenance':
        document = await this.prisma.maintenanceDocument.findUnique({
          where: { id: documentId },
        });
        break;

      default:
        throw new BadRequestException(`Unsupported entity type: ${entityType}`);
    }

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Get file from storage
    const fileBuffer = await this.storageService.getFile(document.filePath);

    return {
      buffer: fileBuffer,
      fileName: document.documentName,
      mimeType: document.mimeType,
    };
  }
}
