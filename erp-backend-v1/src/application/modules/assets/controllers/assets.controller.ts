/**
 * Assets Controller
 * Handles all asset-related HTTP endpoints
 *
 * Endpoints:
 * - Asset CRUD operations
 * - Employee assignments
 * - Project assignments
 * - Maintenance requests
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UploadedFiles,
  UseInterceptors,
  Res,
  StreamableFile,
  Inject,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { Multer } from 'multer';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Auth } from '../../auth/decorators';
import {
  CurrentUser,
  TrackChanges,
  AuditLog,
  NoAuditLog,
} from '../../../common/decorators';
import { DeleteWithRowVersionDto } from '../../../common/dto';
import { DocumentsService } from '../../documents/documents.service';
import { UploadDocumentDto } from '../../documents/dto/upload-document.dto';
import { ASSET_REPOSITORY } from '../repositories';
import type { AssetRepository } from '../repositories/asset.repository';
import {
  CreateAssetDto,
  UpdateAssetDto,
  AssetFiltersDto,
  AssignEmployeeToAssetDto,
  AssignAssetToProjectDto,
  CreateMaintenanceRequestDto,
  AssetsStatisticsDto,
} from '../dto';
import {
  CreateAssetUseCase,
  GetAssetUseCase,
  GetAllAssetsUseCase,
  UpdateAssetUseCase,
  DeleteAssetUseCase,
  AssignEmployeeToAssetUseCase,
  AssignAssetToProjectUseCase,
  CreateMaintenanceRequestUseCase,
  GetAssetsStatisticsUseCase,
} from '../use-cases';
import {
  SwaggerCreateAsset,
  SwaggerGetAsset,
  SwaggerGetAllAssets,
  SwaggerUpdateAsset,
  SwaggerDeleteAsset,
  SwaggerAssignEmployeeToAsset,
  SwaggerAssignAssetToProject,
  SwaggerCreateMaintenanceRequest,
  SwaggerGetAssetsStatistics,
} from '../decorators';
import { AuditAction } from '@prisma/client';

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(
    private readonly createAssetUseCase: CreateAssetUseCase,
    private readonly getAssetUseCase: GetAssetUseCase,
    private readonly getAllAssetsUseCase: GetAllAssetsUseCase,
    private readonly updateAssetUseCase: UpdateAssetUseCase,
    private readonly deleteAssetUseCase: DeleteAssetUseCase,
    private readonly assignEmployeeToAssetUseCase: AssignEmployeeToAssetUseCase,
    private readonly assignAssetToProjectUseCase: AssignAssetToProjectUseCase,
    private readonly createMaintenanceRequestUseCase: CreateMaintenanceRequestUseCase,
    private readonly getAssetsStatisticsUseCase: GetAssetsStatisticsUseCase,
    private readonly documentsService: DocumentsService,
    @Inject(ASSET_REPOSITORY)
    private readonly assetRepository: AssetRepository,
  ) {}

  /**
   * Create a new asset
   */
  @Post()
  @AuditLog({ resourceType: 'asset', action: AuditAction.CREATE })
  @Auth({ permissions: ['asset:write'] })
  @HttpCode(HttpStatus.CREATED)
  @SwaggerCreateAsset()
  async create(@Body() dto: CreateAssetDto, @CurrentUser('id') userId: string) {
    return this.createAssetUseCase.execute(dto, userId);
  }

  /**
   * Get all assets with filters
   */
  @Get()
  @NoAuditLog()
  @Auth({ permissions: ['asset:read'] })
  @SwaggerGetAllAssets()
  async findAll(@Query() filters: AssetFiltersDto) {
    return this.getAllAssetsUseCase.execute(filters);
  }

  /**
   * Get comprehensive asset statistics
   * IMPORTANT: Must be before @Get(':id') to avoid route conflicts
   */
  @Get('statistics')
  @NoAuditLog()
  @Auth({ permissions: ['asset:read'] })
  @SwaggerGetAssetsStatistics()
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('assetType') assetType?: string,
    @Query('status') status?: string,
    @Query('location') location?: string,
  ): Promise<AssetsStatisticsDto> {
    return this.getAssetsStatisticsUseCase.execute({
      startDate,
      endDate,
      assetType: assetType as any,
      status: status as any,
      location,
    });
  }

  /**
   * Get asset by ID
   */
  @Get(':id')
  @NoAuditLog()
  @Auth({ permissions: ['asset:read'] })
  @SwaggerGetAsset()
  async findOne(@Param('id') id: string) {
    return this.getAssetUseCase.execute(id);
  }

  /**
   * Update asset
   */
  @Put(':id')
  @AuditLog({ resourceType: 'asset', action: AuditAction.UPDATE })
  @TrackChanges('asset')
  @Auth({ permissions: ['asset:write'] })
  @SwaggerUpdateAsset()
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.updateAssetUseCase.execute(id, dto, userId);
  }

  /**
   * Delete asset (soft delete)
   */
  @Delete(':id')
  @AuditLog({ resourceType: 'asset', action: AuditAction.DELETE })
  @Auth({ roles: ['ADMIN', 'SUPERADMIN'], permissions: ['asset:delete'] })
  @SwaggerDeleteAsset()
  async delete(
    @Param('id') id: string,
    @Body() dto: DeleteWithRowVersionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.deleteAssetUseCase.execute(id, userId, dto.rowVersion);
  }

  /**
   * Assign employee to asset
   */
  @Post(':id/assign-employee')
  @AuditLog({ resourceType: 'asset', action: AuditAction.UPDATE })
  @Auth({ permissions: ['asset:write'] })
  @HttpCode(HttpStatus.CREATED)
  @SwaggerAssignEmployeeToAsset()
  async assignEmployee(
    @Param('id') assetId: string,
    @Body() dto: AssignEmployeeToAssetDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.assignEmployeeToAssetUseCase.execute(assetId, dto, userId);
  }

  /**
   * Assign asset to project
   */
  @Post(':id/assign-project')
  @AuditLog({ resourceType: 'asset', action: AuditAction.UPDATE })
  @Auth({ permissions: ['asset:write'] })
  @HttpCode(HttpStatus.CREATED)
  @SwaggerAssignAssetToProject()
  async assignToProject(
    @Param('id') assetId: string,
    @Body() dto: AssignAssetToProjectDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.assignAssetToProjectUseCase.execute(assetId, dto, userId);
  }

  /**
   * Return asset from project (unassign)
   */
  @Post(':id/return-project')
  @AuditLog({ resourceType: 'asset', action: AuditAction.UPDATE })
  @Auth({ permissions: ['asset:write'] })
  @HttpCode(HttpStatus.OK)
  async returnFromProject(
    @Param('id') assetId: string,
    @Body() body: { returnDate?: string; notes?: string },
  ) {
    return this.assetRepository.returnFromProject(
      assetId,
      body.returnDate ? new Date(body.returnDate) : undefined,
      body.notes,
    );
  }

  /**
   * Get employees assigned to an asset
   */
  @Get(':id/employees')
  @NoAuditLog()
  @Auth({ permissions: ['asset:read'] })
  async getEmployees(
    @Param('id') assetId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.assetRepository.getAssetEmployees(
      assetId,
      activeOnly !== 'false',
    );
  }

  /**
   * Get project assignment history for an asset
   */
  @Get(':id/projects')
  @NoAuditLog()
  @Auth({ permissions: ['asset:read'] })
  async getProjectAssignments(@Param('id') assetId: string) {
    return this.assetRepository.getProjectHistory(assetId);
  }

  /**
   * Get maintenance requests for an asset
   */
  @Get(':id/maintenance')
  @NoAuditLog()
  @Auth({ permissions: ['asset:read'] })
  async getMaintenanceRequests(@Param('id') assetId: string) {
    return this.assetRepository.getAssetMaintenanceHistory(assetId);
  }

  /**
   * Create maintenance request for asset
   */
  @Post(':id/maintenance')
  @AuditLog({ resourceType: 'maintenance', action: AuditAction.CREATE })
  @Auth({ permissions: ['asset:write'] })
  @HttpCode(HttpStatus.CREATED)
  @SwaggerCreateMaintenanceRequest()
  async createMaintenanceRequest(
    @Param('id') assetId: string,
    @Body() dto: CreateMaintenanceRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.createMaintenanceRequestUseCase.execute(assetId, dto, userId);
  }

  /**
   * Upload documents for an asset
   * POST /api/v1/assets/:id/documents
   */
  @Post('/:id/documents')
  @AuditLog({ resourceType: 'asset-document', action: AuditAction.CREATE })
  @Auth({ permissions: ['asset:write'] })
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload asset documents',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        documentType: {
          type: 'string',
          enum: [
            'ID_CARD',
            'PASSPORT',
            'CONTRACT',
            'CERTIFICATE',
            'OTHER',
            'INVOICE',
            'WARRANTY',
            'INSURANCE',
          ],
        },
        documentName: { type: 'string' },
        issueDate: { type: 'string', format: 'date' },
        expiryDate: { type: 'string', format: 'date' },
        notes: { type: 'string' },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async uploadDocuments(
    @Param('id') assetId: string,
    @UploadedFiles() files: Multer.File[],
    @Body() dto: UploadDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    return await this.documentsService.uploadDocuments({
      entityType: 'asset',
      entityId: assetId,
      entityCode: asset.assetNumber,
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
   * Get all documents for an asset
   * GET /api/v1/assets/:id/documents
   */
  @Get('/:id/documents')
  @NoAuditLog()
  @Auth({ permissions: ['asset:read'] })
  async getDocuments(@Param('id') assetId: string) {
    return await this.documentsService.getDocuments('asset', assetId);
  }

  /**
   * Delete a document
   * DELETE /api/v1/assets/:id/documents/:documentId
   */
  @Delete('/:id/documents/:documentId')
  @AuditLog({ resourceType: 'asset-document', action: AuditAction.DELETE })
  @Auth({ permissions: ['asset:write'] })
  async deleteDocument(
    @Param('id') assetId: string,
    @Param('documentId') documentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.documentsService.deleteDocument(
      'asset',
      documentId,
      userId,
    );
  }

  /**
   * Download a document
   * GET /api/v1/assets/:id/documents/:documentId/download
   */
  @Get('/:id/documents/:documentId/download')
  @NoAuditLog()
  @Auth({ permissions: ['asset:read'] })
  async downloadDocument(
    @Param('id') assetId: string,
    @Param('documentId') documentId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const result = await this.documentsService.downloadDocument(
      'asset',
      documentId,
    );

    res.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(result.fileName)}`,
    });

    return new StreamableFile(result.buffer);
  }
}
