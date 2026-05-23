import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';
import type { Response } from 'express';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { Auth } from '../../auth/decorators';
import {
  CurrentUser,
  TrackChanges,
  AuditLog,
  NoAuditLog,
} from '../../../common/decorators';
import { DeleteWithRowVersionDto } from '../../../common/dto';
import { UserEntity } from '../../auth/entities';
import { DocumentsService } from '../../documents/documents.service';
import { UploadDocumentDto } from '../../documents/dto/upload-document.dto';
import {
  CreateMaintenanceRequestDto,
  UpdateMaintenanceRequestDto,
  MaintenanceFiltersDto,
  MaintenanceStatisticsParams,
} from '../dto';
import {
  CreateMaintenanceRequestUseCase,
  GetMaintenanceRequestUseCase,
  GetAllMaintenanceRequestsUseCase,
  UpdateMaintenanceRequestUseCase,
  DeleteMaintenanceRequestUseCase,
  GetMaintenanceStatisticsUseCase,
} from '../use-cases';
import {
  SwaggerCreateMaintenanceRequest,
  SwaggerGetAllMaintenanceRequests,
  SwaggerGetMaintenanceRequest,
  SwaggerUpdateMaintenanceRequest,
  SwaggerDeleteMaintenanceRequest,
  SwaggerGetMaintenanceStatistics,
} from '../decorators/maintenance-swagger.decorators';
import { AuditAction } from '@prisma/client';

/**
 * Controller for Maintenance Request operations
 * Handles CRUD operations for maintenance requests
 */
@Controller('maintenance')
@ApiTags('Maintenance')
export class MaintenanceController {
  constructor(
    private readonly createUseCase: CreateMaintenanceRequestUseCase,
    private readonly getUseCase: GetMaintenanceRequestUseCase,
    private readonly getAllUseCase: GetAllMaintenanceRequestsUseCase,
    private readonly updateUseCase: UpdateMaintenanceRequestUseCase,
    private readonly deleteUseCase: DeleteMaintenanceRequestUseCase,
    private readonly getStatisticsUseCase: GetMaintenanceStatisticsUseCase,
    private readonly documentsService: DocumentsService,
  ) {}

  /**
   * Create new maintenance request
   */
  @Post()
  @AuditLog({ resourceType: 'maintenance', action: AuditAction.CREATE })
  @Auth({ permissions: ['maintenance:write'] })
  @SwaggerCreateMaintenanceRequest()
  async create(
    @Body() dto: CreateMaintenanceRequestDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.createUseCase.execute(dto, user.id);
  }

  /**
   * Get all maintenance requests with filters
   */
  @Get()
  @NoAuditLog()
  @Auth({ permissions: ['maintenance:read'] })
  @SwaggerGetAllMaintenanceRequests()
  async findAll(@Query() filters: MaintenanceFiltersDto) {
    return this.getAllUseCase.execute(filters);
  }

  /**
   * Get maintenance statistics
   * IMPORTANT: Must be defined before ':id' route to avoid routing conflicts
   */
  @Get('statistics')
  @NoAuditLog()
  @Auth({ permissions: ['maintenance:read'] })
  @SwaggerGetMaintenanceStatistics()
  async getStatistics(@Query() params: MaintenanceStatisticsParams) {
    return this.getStatisticsUseCase.execute(params);
  }

  /**
   * Get maintenance request by ID
   */
  @Get(':id')
  @NoAuditLog()
  @Auth({ permissions: ['maintenance:read'] })
  @SwaggerGetMaintenanceRequest()
  async findOne(@Param('id') id: string) {
    return this.getUseCase.execute(id);
  }

  /**
   * Update maintenance request
   */
  @Put(':id')
  @AuditLog({ resourceType: 'maintenance', action: AuditAction.UPDATE })
  @TrackChanges('maintenance')
  @Auth({ permissions: ['maintenance:write'] })
  @SwaggerUpdateMaintenanceRequest()
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceRequestDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.updateUseCase.execute(id, dto, user.id);
  }

  /**
   * Delete maintenance request
   */
  @Delete(':id')
  @AuditLog({ resourceType: 'maintenance', action: AuditAction.DELETE })
  @Auth({
    roles: ['ADMIN', 'SUPERADMIN'],
    permissions: ['maintenance:delete'],
  })
  @SwaggerDeleteMaintenanceRequest()
  async delete(
    @Param('id') id: string,
    @Body() dto: DeleteWithRowVersionDto,
    @CurrentUser() user: UserEntity,
  ) {
    await this.deleteUseCase.execute(id, user.id, dto.rowVersion);
    return { message: 'Maintenance request deleted successfully' };
  }

  /**
   * Upload documents for maintenance request
   * POST /api/v1/maintenance/:id/documents
   */
  @Post('/:id/documents')
  @AuditLog({
    resourceType: 'maintenance-document',
    action: AuditAction.CREATE,
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @Auth({ permissions: ['maintenance:write'] })
  async uploadDocuments(
    @Param('id') maintenanceId: string,
    @UploadedFiles() files: Multer.File[],
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: UserEntity,
  ) {
    const maintenance = await this.getUseCase.execute(maintenanceId);
    if (!maintenance) {
      throw new Error('Maintenance request not found');
    }

    const documents = await this.documentsService.uploadDocuments({
      entityType: 'maintenance',
      entityId: maintenanceId,
      entityCode: maintenance.maintenanceNumber,
      files,
      documentType: dto.documentType,
      documentName: dto.documentName,
      issueDate: dto.issueDate,
      expiryDate: dto.expiryDate,
      notes: dto.notes,
      uploadedBy: user.id,
    });

    return documents;
  }

  /**
   * Get all documents for maintenance request
   * GET /api/v1/maintenance/:id/documents
   */
  @Get('/:id/documents')
  @NoAuditLog()
  @Auth({ permissions: ['maintenance:read'] })
  async getDocuments(@Param('id') maintenanceId: string) {
    return this.documentsService.getDocuments('maintenance', maintenanceId);
  }

  /**
   * Delete a document
   * DELETE /api/v1/maintenance/:id/documents/:documentId
   */
  @Delete('/:id/documents/:documentId')
  @AuditLog({
    resourceType: 'maintenance-document',
    action: AuditAction.DELETE,
  })
  @Auth({ permissions: ['maintenance:write'] })
  async deleteDocument(
    @Param('id') maintenanceId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.documentsService.deleteDocument(
      'maintenance',
      documentId,
      user.id,
    );
  }

  /**
   * Download a document
   * GET /api/v1/maintenance/:id/documents/:documentId/download
   */
  @Get('/:id/documents/:documentId/download')
  @NoAuditLog()
  @Auth({ permissions: ['maintenance:read'] })
  async downloadDocument(
    @Param('id') maintenanceId: string,
    @Param('documentId') documentId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const result = await this.documentsService.downloadDocument(
      'maintenance',
      documentId,
    );

    res.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(result.fileName)}`,
    });

    return new StreamableFile(result.buffer);
  }
}
