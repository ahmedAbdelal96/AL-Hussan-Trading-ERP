/**
 * Documents Controller
 * Generic endpoints for document management
 * Used by: Employees, Assets, Projects, Maintenance, Users
 */

import {
  BadRequestException,
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../../common';
import { DocumentsService } from './documents.service';
import { StorageCleanupService } from './storage-cleanup.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly cleanupService: StorageCleanupService,
  ) {}

  /**
   * Upload documents for an employee
   * POST /api/v1/documents/employee/:id
   */
  @Post('employee/:id')
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER'],
    permissions: ['employee:write'],
  })
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @ApiOperation({ summary: 'Upload employee documents' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        documentType: { type: 'string', example: 'CONTRACT' },
        documentName: { type: 'string', example: 'Employment Contract' },
        issueDate: { type: 'string', example: '2024-01-15' },
        expiryDate: { type: 'string', example: '2025-01-15' },
        notes: { type: 'string' },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async uploadEmployeeDocuments(
    @Param('id') employeeId: string,
    @UploadedFiles() files: Multer.File[],
    @Body() dto: UploadDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    const employeeCode = await this.documentsService.resolveEntityCode(
      'employee',
      employeeId,
    );

    return await this.documentsService.uploadDocuments({
      entityType: 'employee',
      entityId: employeeId,
      entityCode: employeeCode,
      files,
      documentType: dto.documentType,
      documentName: dto.documentName,
      issueDate: dto.issueDate,
      expiryDate: dto.expiryDate,
      notes: dto.notes,
      uploadedBy: userId,
    });
  }

  /**
   * Get all documents for an employee
   * GET /api/v1/documents/employee/:id
   */
  @Get('employee/:id')
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF'],
    permissions: ['employee:read'],
  })
  @ApiOperation({ summary: 'Get employee documents' })
  async getEmployeeDocuments(@Param('id') employeeId: string) {
    return await this.documentsService.getDocuments('employee', employeeId);
  }

  /**
   * Update/Replace a document
   * PUT /api/v1/documents/:entityType/:documentId
   */
  @Post(':entityType/:documentId/update')
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER'],
    permissions: ['employee:write'],
  })
  @UseInterceptors(FilesInterceptor('file', 1)) // Single file replacement
  @ApiOperation({ summary: 'Update/Replace document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        documentType: { type: 'string', example: 'CONTRACT' },
        documentName: { type: 'string', example: 'Updated Contract' },
        issueDate: { type: 'string', example: '2024-01-15' },
        expiryDate: { type: 'string', example: '2025-01-15' },
        notes: { type: 'string' },
      },
    },
  })
  async updateDocument(
    @Param('entityType') entityType: string,
    @Param('documentId') documentId: string,
    @UploadedFiles() files: Multer.File[],
    @Body() dto: UploadDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No file provided');
    }

    const entityCode = await this.documentsService.resolveEntityCodeByDocument(
      entityType,
      documentId,
    );

    return await this.documentsService.updateDocument(
      entityType,
      documentId,
      files[0],
      entityCode,
      {
        documentType: dto.documentType,
        documentName: dto.documentName,
        issueDate: dto.issueDate,
        expiryDate: dto.expiryDate,
        notes: dto.notes,
      },
      userId,
    );
  }

  /**
   * Delete a document
   * DELETE /api/v1/documents/:entityType/:documentId
   */
  @Delete(':entityType/:documentId')
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER'],
    permissions: ['employee:write'],
  })
  @ApiOperation({ summary: 'Delete document' })
  @HttpCode(HttpStatus.OK)
  async deleteDocument(
    @Param('entityType') entityType: string,
    @Param('documentId') documentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.documentsService.deleteDocument(
      entityType,
      documentId,
      userId,
    );
  }

  /**
   * Download a document
   * GET /api/v1/documents/:entityType/:documentId/download
   */
  @Get(':entityType/:documentId/download')
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF'],
    permissions: ['employee:read'],
  })
  @ApiOperation({ summary: 'Download document' })
  async downloadDocument(
    @Param('entityType') entityType: string,
    @Param('documentId') documentId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, fileName, mimeType } =
      await this.documentsService.downloadDocument(entityType, documentId);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    return new StreamableFile(buffer);
  }

  /**
   * Cleanup orphaned files (Admin only)
   * POST /api/v1/documents/cleanup
   */
  @Post('cleanup')
  @Auth({
    roles: ['SUPERADMIN'],
    permissions: ['system:admin'],
  })
  @ApiOperation({
    summary: 'Cleanup orphaned files (Admin only)',
    description:
      'Scans storage and removes files that are not referenced in database',
  })
  @HttpCode(HttpStatus.OK)
  async cleanupOrphanedFiles() {
    return await this.cleanupService.manualCleanup();
  }
}
