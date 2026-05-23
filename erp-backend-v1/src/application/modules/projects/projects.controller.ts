/**
 * Projects Controller
 * Handles all project-related HTTP endpoints
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
  NotFoundException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { Multer } from 'multer';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Auth } from '../auth/decorators';
import {
  CurrentUser,
  TrackChanges,
  AuditLog,
  NoAuditLog,
} from '../../common/decorators';
import { DeleteWithRowVersionDto } from '../../common/dto';
import { AuditAction } from '@prisma/client';
import { DocumentsService } from '../documents/documents.service';
import { UploadDocumentDto } from '../documents/dto/upload-document.dto';
import { PROJECT_REPOSITORY } from './repositories';
import { ProjectRepository } from './repositories/project.repository';
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProgressDto,
  ProjectResponseDto,
  ProjectsPaginatedResponseDto,
  MessageResponseDto,
  ProjectFiltersDto,
  MediaFiltersDto,
  ProjectMediaResponseDto,
  ProjectsStatisticsDto,
  ProjectsStatisticsParams,
  AssignEmployeeToProjectDto,
  UpdateProjectEmployeeDto,
  ProjectEmployeeResponseDto,
} from './dto';
import {
  CreateProjectUseCase,
  GetProjectUseCase,
  GetAllProjectsUseCase,
  UpdateProjectUseCase,
  DeleteProjectUseCase,
  UpdateProgressUseCase,
  GetProjectMediaUseCase,
  GetProjectsStatisticsUseCase,
  AssignEmployeeToProjectUseCase,
  GetProjectEmployeesUseCase,
  UpdateProjectEmployeeUseCase,
  RemoveProjectEmployeeUseCase,
  GetProjectAssetsUseCase,
  AssignAssetToProjectUseCase,
  AssignAssetToProjectFromProjectDto,
  RemoveProjectAssetUseCase,
} from './use-cases';
import {
  SwaggerCreateProject,
  SwaggerGetProject,
  SwaggerGetAllProjects,
  SwaggerUpdateProject,
  SwaggerDeleteProject,
  SwaggerUpdateProgress,
  SwaggerGetProjectMedia,
  SwaggerGetProjectsStatistics,
} from './decorators';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly getProjectUseCase: GetProjectUseCase,
    private readonly getAllProjectsUseCase: GetAllProjectsUseCase,
    private readonly updateProjectUseCase: UpdateProjectUseCase,
    private readonly deleteProjectUseCase: DeleteProjectUseCase,
    private readonly updateProgressUseCase: UpdateProgressUseCase,
    private readonly getProjectMediaUseCase: GetProjectMediaUseCase,
    private readonly getProjectsStatisticsUseCase: GetProjectsStatisticsUseCase,
    private readonly assignEmployeeToProjectUseCase: AssignEmployeeToProjectUseCase,
    private readonly getProjectEmployeesUseCase: GetProjectEmployeesUseCase,
    private readonly updateProjectEmployeeUseCase: UpdateProjectEmployeeUseCase,
    private readonly removeProjectEmployeeUseCase: RemoveProjectEmployeeUseCase,
    private readonly getProjectAssetsUseCase: GetProjectAssetsUseCase,
    private readonly assignAssetToProjectUseCase: AssignAssetToProjectUseCase,
    private readonly removeProjectAssetUseCase: RemoveProjectAssetUseCase,
    private readonly documentsService: DocumentsService,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
  ) {}

  /**
   * Create a new project
   */
  @Post()
  @AuditLog({ resourceType: 'project', action: AuditAction.CREATE })
  @Auth({ permissions: ['project:write'] })
  @HttpCode(HttpStatus.CREATED)
  @SwaggerCreateProject()
  async create(
    @Body() dto: CreateProjectDto,
    @CurrentUser('id') userId: string,
  ): Promise<ProjectResponseDto> {
    return this.createProjectUseCase.execute(dto, userId);
  }

  /**
   * Get all projects with filters
   */
  @Get()
  @NoAuditLog()
  @Auth({ permissions: ['project:read'] })
  @SwaggerGetAllProjects()
  async findAll(
    @Query() filters: ProjectFiltersDto,
  ): Promise<ProjectsPaginatedResponseDto> {
    return this.getAllProjectsUseCase.execute(filters);
  }

  /**
   * Get projects statistics
   */
  @Get('statistics')
  @NoAuditLog()
  @Auth({ permissions: ['project:read'] })
  @SwaggerGetProjectsStatistics()
  async getStatistics(
    @Query() params: ProjectsStatisticsParams,
  ): Promise<ProjectsStatisticsDto> {
    return this.getProjectsStatisticsUseCase.execute(params);
  }

  /**
   * Get project by ID
   */
  @Get(':id')
  @NoAuditLog()
  @Auth({ permissions: ['project:read'] })
  @SwaggerGetProject()
  async findOne(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.getProjectUseCase.execute(id);
  }

  /**
   * Update project
   */
  @Put(':id')
  @AuditLog({ resourceType: 'project', action: AuditAction.UPDATE })
  @TrackChanges('project')
  @Auth({ permissions: ['project:write'] })
  @SwaggerUpdateProject()
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser('id') userId: string,
  ): Promise<ProjectResponseDto> {
    return this.updateProjectUseCase.execute(id, dto, userId);
  }

  /**
   * Delete project (soft delete)
   */
  @Delete(':id')
  @AuditLog({ resourceType: 'project', action: AuditAction.DELETE })
  @Auth({ roles: ['ADMIN', 'SUPERADMIN'], permissions: ['project:delete'] })
  @SwaggerDeleteProject()
  async delete(
    @Param('id') id: string,
    @Body() dto: DeleteWithRowVersionDto,
    @CurrentUser('id') userId: string,
  ): Promise<MessageResponseDto> {
    await this.deleteProjectUseCase.execute(id, userId, dto.rowVersion);
    return { message: 'Project deleted successfully' };
  }

  /**
   * Update project progress
   */
  @Put(':id/progress')
  @AuditLog({ resourceType: 'project', action: AuditAction.UPDATE })
  @TrackChanges('project')
  @Auth({ permissions: ['project:write'] })
  @SwaggerUpdateProgress()
  async updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser('id') userId: string,
  ): Promise<ProjectResponseDto> {
    return this.updateProgressUseCase.execute(id, dto, userId);
  }

  /**
   * Get project media
   */
  @Get(':id/media')
  @NoAuditLog()
  @Auth({ permissions: ['project:read'] })
  @SwaggerGetProjectMedia()
  async getMedia(
    @Param('id') id: string,
    @Query() filters: MediaFiltersDto,
  ): Promise<{ data: ProjectMediaResponseDto[]; total: number }> {
    return this.getProjectMediaUseCase.execute(id, filters);
  }

  /**
   * Upload documents for a project
   * POST /api/v1/projects/:id/documents
   */
  @Post('/:id/documents')
  @AuditLog({ resourceType: 'project-document', action: AuditAction.CREATE })
  @Auth({ permissions: ['project:write'] })
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload project documents',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        documentType: {
          type: 'string',
          enum: ['ID_CARD', 'PASSPORT', 'CONTRACT', 'CERTIFICATE', 'OTHER'],
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
    @Param('id') projectId: string,
    @UploadedFiles() files: Multer.File[],
    @Body() dto: UploadDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return await this.documentsService.uploadDocuments({
      entityType: 'projects',
      entityId: projectId,
      entityCode: project.projectCode,
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
   * Get all documents for a project
   * GET /api/v1/projects/:id/documents
   */
  @Get(':id/documents')
  @NoAuditLog()
  @Auth({ permissions: ['project:read'] })
  async getDocuments(@Param('id') projectId: string) {
    return await this.documentsService.getDocuments('projects', projectId);
  }

  /**
   * Delete a document
   * DELETE /api/v1/projects/:id/documents/:documentId
   */
  @Delete(':id/documents/:documentId')
  @AuditLog({ resourceType: 'project-document', action: AuditAction.DELETE })
  @Auth({ permissions: ['project:write'] })
  async deleteDocument(
    @Param('documentId') documentId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.documentsService.deleteDocument('projects', documentId, userId);
    return { message: 'Document deleted successfully' };
  }

  /**
   * Download a document
   * GET /api/v1/projects/:id/documents/:documentId/download
   */
  @Get(':id/documents/:documentId/download')
  @NoAuditLog()
  @Auth({ permissions: ['project:read'] })
  async downloadDocument(
    @Param('id') _projectId: string,
    @Param('documentId') documentId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, fileName, mimeType } =
      await this.documentsService.downloadDocument('projects', documentId);

    const encodedFileName = encodeURIComponent(String(fileName));

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodedFileName}`,
    });

    return new StreamableFile(buffer);
  }

  // ─── Project Employee Assignment Endpoints ────────────────────────────────

  /**
   * List employees assigned to a project
   * GET /api/v1/projects/:id/employees
   */
  @Get(':id/employees')
  @NoAuditLog()
  @Auth({ permissions: ['project:read'] })
  getProjectEmployees(
    @Param('id') projectId: string,
    @Query('activeOnly') activeOnly?: string,
  ): Promise<ProjectEmployeeResponseDto[]> {
    return this.getProjectEmployeesUseCase.execute(
      projectId,
      activeOnly !== 'false',
    );
  }

  /**
   * Assign an employee to a project
   * POST /api/v1/projects/:id/employees
   */
  @Post(':id/employees')
  @AuditLog({ resourceType: 'project-employee', action: AuditAction.CREATE })
  @Auth({ permissions: ['project:write'] })
  @HttpCode(HttpStatus.CREATED)
  assignEmployee(
    @Param('id') projectId: string,
    @Body() dto: AssignEmployeeToProjectDto,
    @CurrentUser('id') userId: string,
  ): Promise<ProjectEmployeeResponseDto> {
    return this.assignEmployeeToProjectUseCase.execute(projectId, dto, userId);
  }

  /**
   * Update a project employee assignment (percentage, role, etc.)
   * PATCH /api/v1/projects/:id/employees/:assignmentId
   */
  @Patch(':id/employees/:assignmentId')
  @AuditLog({ resourceType: 'project-employee', action: AuditAction.UPDATE })
  @Auth({ permissions: ['project:write'] })
  updateProjectEmployee(
    @Param('id') projectId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: UpdateProjectEmployeeDto,
  ): Promise<ProjectEmployeeResponseDto> {
    return this.updateProjectEmployeeUseCase.execute(
      projectId,
      assignmentId,
      dto,
    );
  }

  /**
   * Remove (deactivate) an employee assignment from a project
   * DELETE /api/v1/projects/:id/employees/:assignmentId
   */
  @Delete(':id/employees/:assignmentId')
  @AuditLog({ resourceType: 'project-employee', action: AuditAction.DELETE })
  @Auth({ permissions: ['project:write'] })
  removeProjectEmployee(
    @Param('id') projectId: string,
    @Param('assignmentId') assignmentId: string,
  ): Promise<{ message: string }> {
    return this.removeProjectEmployeeUseCase.execute(projectId, assignmentId);
  }

  // ─── Project Asset Assignment Endpoints ──────────────────────────────────

  /**
   * List assets assigned to a project
   * GET /api/v1/projects/:id/assets
   */
  @Get(':id/assets')
  @NoAuditLog()
  @Auth({ permissions: ['project:read'] })
  getProjectAssets(
    @Param('id') projectId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.getProjectAssetsUseCase.execute(
      projectId,
      activeOnly !== 'false',
    );
  }

  /**
   * Assign an asset to a project
   * POST /api/v1/projects/:id/assets
   */
  @Post(':id/assets')
  @AuditLog({ resourceType: 'project-asset', action: AuditAction.CREATE })
  @Auth({ permissions: ['project:write'] })
  @HttpCode(HttpStatus.CREATED)
  assignAsset(
    @Param('id') projectId: string,
    @Body() dto: AssignAssetToProjectFromProjectDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.assignAssetToProjectUseCase.execute(projectId, dto, userId);
  }

  /**
   * Remove (return) an asset from a project
   * DELETE /api/v1/projects/:id/assets/:assignmentId
   */
  @Delete(':id/assets/:assignmentId')
  @AuditLog({ resourceType: 'project-asset', action: AuditAction.DELETE })
  @Auth({ permissions: ['project:write'] })
  removeProjectAsset(
    @Param('id') projectId: string,
    @Param('assignmentId') assignmentId: string,
  ): Promise<{ message: string }> {
    return this.removeProjectAssetUseCase.execute(projectId, assignmentId);
  }
}
