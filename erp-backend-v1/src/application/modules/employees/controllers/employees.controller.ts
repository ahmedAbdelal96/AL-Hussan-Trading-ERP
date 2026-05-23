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
  UseInterceptors,
  UploadedFiles,
  StreamableFile,
  Res,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Auth } from '../../auth/decorators';
import {
  CurrentUser,
  TrackChanges,
  AuditLog,
  NoAuditLog,
} from '../../../common';
import { DocumentsService } from '../../documents/documents.service';
import { UploadDocumentDto } from '../../documents/dto/upload-document.dto';
import { StorageService } from '../../../../infrastructure/storage/storage.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeFiltersDto,
  BulkCreateEmployeesDto,
  EmployeeResponseDto,
  EmployeesPaginatedResponseDto,
  EmployeesStatisticsDto,
  RehireEmployeeDto,
} from '../dto';
import {
  CreateEmployeeUseCase,
  GetAllEmployeesUseCase,
  GetEmployeeUseCase,
  UpdateEmployeeUseCase,
  DeleteEmployeeUseCase,
  BulkCreateEmployeesUseCase,
  GetEmployeesStatisticsUseCase,
  RehireEmployeeUseCase,
} from '../use-cases';
import type { IEmployeeRepository } from '../repositories';
import { EMPLOYEE_REPOSITORY } from '../repositories';
import {
  ApiCreateEmployee,
  ApiGetAllEmployees,
  ApiGetEmployee,
  ApiUpdateEmployee,
  ApiDeleteEmployee,
  ApiBulkCreateEmployees,
  ApiGetEmployeesStatistics,
} from '../decorators';
import {
  DEPARTMENTS,
  POSITIONS,
  CURRENCIES,
  NATIONALITIES,
} from '../../../../common/constants/reference-data.constants';
import { AuditAction } from '@prisma/client';
import { DeleteWithRowVersionDto } from '../../../common/dto';
import { UserEntity } from '../../auth/entities/user.entity';

@ApiTags('Employees')
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
    private readonly getAllEmployeesUseCase: GetAllEmployeesUseCase,
    private readonly getEmployeeUseCase: GetEmployeeUseCase,
    private readonly updateEmployeeUseCase: UpdateEmployeeUseCase,
    private readonly deleteEmployeeUseCase: DeleteEmployeeUseCase,
    private readonly bulkCreateEmployeesUseCase: BulkCreateEmployeesUseCase,
    private readonly getEmployeesStatisticsUseCase: GetEmployeesStatisticsUseCase,
    private readonly rehireEmployeeUseCase: RehireEmployeeUseCase,
    private readonly documentsService: DocumentsService,
    private readonly storageService: StorageService,
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: IEmployeeRepository,
  ) {}

  @Post()
  @AuditLog({ resourceType: 'employee', action: AuditAction.CREATE })
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF'],
    permissions: ['employee:write'],
  })
  @ApiCreateEmployee()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @CurrentUser('id') userId: string,
  ): Promise<EmployeeResponseDto> {
    return this.createEmployeeUseCase.execute(createEmployeeDto, userId);
  }

  @Post('bulk')
  @AuditLog({ resourceType: 'employee', action: AuditAction.CREATE })
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER'],
    permissions: ['employee:write'],
  })
  @ApiBulkCreateEmployees()
  @HttpCode(HttpStatus.CREATED)
  async bulkCreate(
    @Body() bulkCreateDto: BulkCreateEmployeesDto,
    @CurrentUser('id') userId: string,
  ): Promise<EmployeeResponseDto[]> {
    return this.bulkCreateEmployeesUseCase.execute(bulkCreateDto, userId);
  }

  @Get('statistics')
  @NoAuditLog()
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF'],
    permissions: ['employee:read'],
  })
  @ApiGetEmployeesStatistics()
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('department') department?: string,
    @Query('employmentType') employmentType?: string,
  ): Promise<EmployeesStatisticsDto> {
    return this.getEmployeesStatisticsUseCase.execute({
      startDate,
      endDate,
      department,
      employmentType: employmentType as EmployeeFiltersDto['employmentType'],
    });
  }

  @Get('reference-data')
  @NoAuditLog()
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF'],
    permissions: ['employee:read'],
  })
  @ApiOperation({
    summary: 'Get reference data for employees',
    description:
      'Returns lookup data for departments, positions, currencies, and nationalities. Used for dropdowns in employee forms.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reference data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        departments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'ENGINEERING' },
              nameAr: { type: 'string', example: 'الهندسة والمكتب الفني' },
              nameEn: {
                type: 'string',
                example: 'Engineering & Technical Office',
              },
              description: { type: 'string' },
            },
          },
        },
        positions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'CIVIL_ENG' },
              nameAr: { type: 'string', example: 'مهندس مدني' },
              nameEn: { type: 'string', example: 'Civil Engineer' },
              level: {
                type: 'string',
                enum: ['executive', 'senior', 'mid', 'junior'],
              },
            },
          },
        },
        currencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'SAR' },
              nameAr: { type: 'string', example: 'ريال سعودي' },
              nameEn: { type: 'string', example: 'Saudi Riyal' },
              symbol: { type: 'string', example: 'ر.س' },
            },
          },
        },
        nationalities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'SA' },
              nameAr: { type: 'string', example: 'سعودي' },
              nameEn: { type: 'string', example: 'Saudi' },
            },
          },
        },
      },
    },
  })
  getReferenceData() {
    return {
      departments: DEPARTMENTS,
      positions: POSITIONS,
      currencies: CURRENCIES,
      nationalities: NATIONALITIES,
    };
  }

  @Get()
  @NoAuditLog()
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF'],
    permissions: ['employee:read'],
  })
  @ApiGetAllEmployees()
  async findAll(
    @Query() filters: EmployeeFiltersDto,
  ): Promise<EmployeesPaginatedResponseDto> {
    return this.getAllEmployeesUseCase.execute(filters);
  }

  @Get(':id')
  @NoAuditLog()
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF'],
    permissions: ['employee:read'],
  })
  @ApiGetEmployee()
  async findOne(@Param('id') id: string): Promise<EmployeeResponseDto> {
    return this.getEmployeeUseCase.execute(id);
  }

  @Put(':id')
  @AuditLog({ resourceType: 'employee', action: AuditAction.UPDATE })
  @TrackChanges('employee')
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER'],
    permissions: ['employee:write'],
  })
  @ApiUpdateEmployee()
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @CurrentUser() user: UserEntity,
  ): Promise<EmployeeResponseDto> {
    const isSalaryUpdateAttempt =
      updateEmployeeDto.baseSalary !== undefined ||
      updateEmployeeDto.currency !== undefined;

    if (
      isSalaryUpdateAttempt &&
      !(
        user.hasRole('HR_MANAGER') ||
        user.hasRole('ADMIN') ||
        user.hasRole('SUPERADMIN')
      )
    ) {
      throw new ForbiddenException(
        'Salary updates are restricted. Use payroll salary update workflow.',
      );
    }

    return this.updateEmployeeUseCase.execute(id, updateEmployeeDto, user.id);
  }

  @Delete(':id')
  @AuditLog({ resourceType: 'employee', action: AuditAction.DELETE })
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER'],
    permissions: ['employee:delete'],
  })
  @ApiDeleteEmployee()
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteWithRowVersionDto,
    @CurrentUser('id') userId: string,
  ): Promise<{ message: string }> {
    await this.deleteEmployeeUseCase.execute(id, userId, dto.rowVersion);
    return { message: 'Employee deleted successfully' };
  }

  @Post(':id/rehire')
  @AuditLog({ resourceType: 'employee', action: AuditAction.UPDATE })
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER'],
    permissions: ['employee:write'],
  })
  @ApiOperation({ summary: 'Rehire a terminated employee' })
  @ApiResponse({
    status: 200,
    description: 'Employee rehired successfully',
  })
  async rehire(
    @Param('id') id: string,
    @Body() dto: RehireEmployeeDto,
    @CurrentUser('id') userId: string,
  ): Promise<EmployeeResponseDto> {
    return this.rehireEmployeeUseCase.execute(id, dto, userId);
  }

  // ============================================================================
  // PROFILE PICTURE ENDPOINTS
  // ============================================================================

  /**
   * Upload employee profile picture
   * POST /api/v1/employees/:id/profile-picture
   */
  @Post(':id/profile-picture')
  @AuditLog({
    resourceType: 'employee-profile-picture',
    action: AuditAction.CREATE,
  })
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF'],
    permissions: ['employee:write'],
  })
  @UseInterceptors(FilesInterceptor('file', 1))
  @ApiOperation({ summary: 'Upload employee profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload profile picture',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture (jpg, jpeg, png)',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async uploadProfilePicture(
    @Param('id') employeeId: string,
    @UploadedFiles() files: Multer.File[],
    @CurrentUser('id') userId: string,
  ): Promise<EmployeeResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No file provided');
    }

    const file = files[0];
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png'];
    const mimeType = String(file.mimetype);
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        'Invalid file type. Only JPG, JPEG, and PNG are allowed',
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size too large. Maximum size is 5MB');
    }

    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (employee.status === 'TERMINATED') {
      throw new BadRequestException(
        'Cannot update a terminated employee. Use the rehire workflow to reactivate this employee.',
      );
    }

    // Delete old profile picture if exists
    if (employee.profilePicture) {
      try {
        await this.storageService.deleteFile(employee.profilePicture);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    // Upload new profile picture
    const uploadResult = await this.storageService.uploadFile(
      file,
      'employees',
      employee.employeeNumber, // Use employee number (code) for file naming
      0, // Always use index 0 for profile picture
      {
        allowedTypes: allowedMimeTypes,
        maxSize: 5 * 1024 * 1024, // 5MB
      },
    );

    // Update employee with new profile picture path
    const updatedEmployee = await this.employeeRepository.update(
      employeeId,
      { profilePicture: uploadResult.filePath },
      userId,
    );

    return updatedEmployee.toResponse();
  }

  /**
   * Delete employee profile picture
   * DELETE /api/v1/employees/:id/profile-picture
   */
  @Delete(':id/profile-picture')
  @AuditLog({
    resourceType: 'employee-profile-picture',
    action: AuditAction.DELETE,
  })
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF'],
    permissions: ['employee:write'],
  })
  @ApiOperation({ summary: 'Delete employee profile picture' })
  @HttpCode(HttpStatus.OK)
  async deleteProfilePicture(
    @Param('id') employeeId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ message: string }> {
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (employee.status === 'TERMINATED') {
      throw new BadRequestException(
        'Cannot update a terminated employee. Use the rehire workflow to reactivate this employee.',
      );
    }

    if (!employee.profilePicture) {
      throw new BadRequestException('No profile picture to delete');
    }

    // Delete file from storage
    await this.storageService.deleteFile(employee.profilePicture);

    // Update employee to remove profile picture
    await this.employeeRepository.update(
      employeeId,
      { profilePicture: null },
      userId,
    );

    return { message: 'Profile picture deleted successfully' };
  }

  // ============================================================================
  // DOCUMENT MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * Upload documents for an employee
   * POST /api/v1/employees/:id/documents
   *
   * Best Practice: Documents are managed separately from employee creation
   * - Allows uploading documents after employee creation
   * - Supports multipart/form-data (different from JSON endpoints)
   * - Clean separation of concerns
   *
   * @param id - Employee ID
   * @param files - Array of uploaded files (max 10)
   * @param dto - Document metadata (type, name, dates, notes)
   * @param userId - Current user ID (auto-injected)
   * @returns Array of uploaded document records
   */
  @Post(':id/documents')
  @AuditLog({ resourceType: 'employee-document', action: AuditAction.CREATE })
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF'],
    permissions: ['employee:write'],
  })
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files per upload
  @ApiOperation({ summary: 'Upload employee documents' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload multiple documents with metadata',
    schema: {
      type: 'object',
      required: ['files', 'documentType', 'documentName'],
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Files to upload (max 10)',
        },
        documentType: {
          type: 'string',
          enum: ['ID_CARD', 'PASSPORT', 'CONTRACT', 'CERTIFICATE', 'OTHER'],
          example: 'CONTRACT',
        },
        documentName: { type: 'string', example: 'Employment Contract' },
        issueDate: { type: 'string', example: '2024-01-15' },
        expiryDate: { type: 'string', example: '2025-01-15' },
        notes: { type: 'string' },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async uploadDocuments(
    @Param('id') employeeId: string,
    @UploadedFiles() files: Multer.File[],
    @Body() dto: UploadDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    // PERFORMANCE: Fetch employee data in parallel with validation
    const employee = await this.employeeRepository.findById(employeeId);

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Use employeeNumber for file naming (e.g., EMP-001-001.jpg)
    return await this.documentsService.uploadDocuments({
      entityType: 'employees', // Use plural to match profile picture path
      entityId: employeeId,
      entityCode: employee.employeeNumber, // Real employee code from DB
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
   * GET /api/v1/employees/:id/documents
   *
   * @param id - Employee ID
   * @returns Array of employee documents with metadata
   */
  @Get(':id/documents')
  @NoAuditLog()
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF'],
    permissions: ['employee:read'],
  })
  @ApiOperation({ summary: 'Get all employee documents' })
  @ApiResponse({
    status: 200,
    description: 'Returns all documents for the employee',
  })
  async getDocuments(@Param('id') employeeId: string) {
    return await this.documentsService.getDocuments('employees', employeeId);
  }

  /**
   * Update/Replace a specific document
   * POST /api/v1/employees/:id/documents/:documentId
   *
   * Design Decision: Uses POST instead of PUT/PATCH because:
   * - Multipart/form-data is more compatible with POST
   * - Common REST practice for file uploads
   * - Better browser/client compatibility
   *
   * @param id - Employee ID
   * @param documentId - Document ID to update
   * @param files - New file to upload
   * @param dto - Updated metadata
   * @param userId - Current user ID
   * @returns Updated document record
   */
  @Post(':id/documents/:documentId')
  @AuditLog({ resourceType: 'employee-document', action: AuditAction.UPDATE })
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER'],
    permissions: ['employee:write'],
  })
  @UseInterceptors(FilesInterceptor('files', 1)) // Only 1 file for update
  @ApiOperation({ summary: 'Update/Replace employee document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Replace document with new file',
    schema: {
      type: 'object',
      properties: {
        files: { type: 'string', format: 'binary' },
        documentType: { type: 'string' },
        documentName: { type: 'string', example: 'Updated Contract' },
        issueDate: { type: 'string', example: '2024-01-15' },
        expiryDate: { type: 'string', example: '2025-01-15' },
        notes: { type: 'string' },
      },
    },
  })
  async updateDocument(
    @Param('id') employeeId: string,
    @Param('documentId') documentId: string,
    @UploadedFiles() files: Multer.File[],
    @Body() dto: UploadDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    // Validate: Ensure at least one file is provided
    if (!files || files.length === 0) {
      throw new BadRequestException('No file provided for update');
    }

    // Fetch employee for code
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return await this.documentsService.updateDocument(
      'employee',
      documentId,
      files[0], // Only use first file
      employee.employeeNumber,
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
   * Delete a specific document
   * DELETE /api/v1/employees/:id/documents/:documentId
   *
   * IMPORTANT: This removes both the file from storage AND the database record
   * Implements proper cleanup to prevent orphaned files
   *
   * @param id - Employee ID (for route context)
   * @param documentId - Document ID to delete
   * @returns Success message
   */
  @Delete(':id/documents/:documentId')
  @AuditLog({ resourceType: 'employee-document', action: AuditAction.DELETE })
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER'],
    permissions: ['employee:delete'],
  })
  @ApiOperation({ summary: 'Delete employee document' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  async deleteDocument(
    @Param('id') employeeId: string,
    @Param('documentId') documentId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.documentsService.deleteDocument('employees', documentId, userId);
    return { message: 'Document deleted successfully' };
  }

  /**
   * Download a specific document
   * GET /api/v1/employees/:id/documents/:documentId/download
   *
   * Returns the actual file with proper headers for browser download
   * Sets Content-Disposition to trigger download dialog
   *
   * @param id - Employee ID
   * @param documentId - Document ID to download
   * @param res - Express Response object (for headers)
   * @returns StreamableFile with proper MIME type
   */
  @Get(':id/documents/:documentId/download')
  @NoAuditLog()
  @Auth({
    roles: ['SUPERADMIN', 'ADMIN', 'HR_MANAGER', 'HR_STAFF'],
    permissions: ['employee:read'],
  })
  @ApiOperation({ summary: 'Download employee document' })
  @ApiResponse({ status: 200, description: 'File stream' })
  async downloadDocument(
    @Param('id') employeeId: string,
    @Param('documentId') documentId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, fileName, mimeType } =
      await this.documentsService.downloadDocument('employees', documentId);

    // Encode filename for Content-Disposition (RFC 5987)
    // Supports Arabic and special characters
    const encodedFileName = encodeURIComponent(fileName);

    // Set proper HTTP headers for file download
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodedFileName}`,
    });

    return new StreamableFile(buffer);
  }
}
