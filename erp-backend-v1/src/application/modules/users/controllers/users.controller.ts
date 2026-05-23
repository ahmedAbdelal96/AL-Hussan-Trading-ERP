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
  UploadedFile,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Auth } from '../../auth/decorators';
import {
  CurrentUser,
  TrackChanges,
  AuditLog,
  NoAuditLog,
} from '../../../common';
import { UserEntity } from '../../auth/entities';
import { StorageService } from '../../../../infrastructure/storage/storage.service';
import type { IUserRepository } from '../repositories';
import { USER_REPOSITORY } from '../repositories';
import {
  CreateUserDto,
  UpdateUserDto,
  UserFiltersDto,
  ResetPasswordDto,
  BulkCreateUsersDto,
} from '../dto';
import {
  CreateUserUseCase,
  GetAllUsersUseCase,
  GetUsersStatisticsUseCase,
  GetUserUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
  HardDeleteUserUseCase,
  ResetUserPasswordUseCase,
  BulkCreateUsersUseCase,
  GetDeletedUsersUseCase,
  RestoreUserUseCase,
} from '../use-cases';
import {
  SwaggerCreateUser,
  SwaggerGetAllUsers,
  SwaggerGetUser,
  SwaggerUpdateUser,
  SwaggerDeleteUser,
  SwaggerResetPassword,
  SwaggerBulkCreateUsers,
} from '../decorators/users-swagger.decorators';
import { AuditAction } from '@prisma/client';
import { DeleteWithRowVersionDto } from '../../../common/dto';

const CRITICAL_SYSTEM_ROLES = ['SUPERADMIN', 'IT_ADMIN'];

@Controller('users')
@ApiTags('Users Management')
export class UsersController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private getAllUsersUseCase: GetAllUsersUseCase,
    private getUsersStatisticsUseCase: GetUsersStatisticsUseCase,
    private getUserUseCase: GetUserUseCase,
    private updateUserUseCase: UpdateUserUseCase,
    private deleteUserUseCase: DeleteUserUseCase,
    private hardDeleteUserUseCase: HardDeleteUserUseCase,
    private resetPasswordUseCase: ResetUserPasswordUseCase,
    private bulkCreateUsersUseCase: BulkCreateUsersUseCase,
    private getDeletedUsersUseCase: GetDeletedUsersUseCase,
    private restoreUserUseCase: RestoreUserUseCase,
    private readonly storageService: StorageService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  @Post()
  @AuditLog({ resourceType: 'user', action: AuditAction.CREATE })
  @Auth({ roles: CRITICAL_SYSTEM_ROLES })
  @SwaggerCreateUser()
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: UserEntity) {
    return this.createUserUseCase.execute(dto, user.id);
  }

  @Post('bulk')
  @AuditLog({ resourceType: 'user', action: AuditAction.CREATE })
  @Auth({ roles: CRITICAL_SYSTEM_ROLES })
  @SwaggerBulkCreateUsers()
  async bulkCreate(
    @Body() dto: BulkCreateUsersDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.bulkCreateUsersUseCase.execute(dto, user.id);
  }

  @Get()
  @NoAuditLog()
  @Auth({ permissions: ['user:read'] })
  @SwaggerGetAllUsers()
  async findAll(@Query() filters: UserFiltersDto) {
    return this.getAllUsersUseCase.execute(filters);
  }

  @Get('statistics')
  @NoAuditLog()
  @Auth({ permissions: ['user:read'] })
  @ApiOperation({
    summary: 'Get users statistics',
    description:
      'Returns aggregate users KPIs (total/active/inactive/locked) independent of pagination.',
  })
  async getStatistics() {
    return this.getUsersStatisticsUseCase.execute();
  }

  @Get(':id')
  @NoAuditLog()
  @Auth({ permissions: ['user:read'], allowSelf: true })
  @SwaggerGetUser()
  async findOne(@Param('id') id: string) {
    return this.getUserUseCase.execute(id);
  }

  @Put(':id')
  @AuditLog({ resourceType: 'user', action: AuditAction.UPDATE })
  @TrackChanges('user')
  @Auth({ permissions: ['user:write'] })
  @SwaggerUpdateUser()
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.updateUserUseCase.execute(id, dto, user.id);
  }

  @Delete(':id')
  @AuditLog({ resourceType: 'user', action: AuditAction.DELETE })
  @Auth({ roles: CRITICAL_SYSTEM_ROLES })
  @SwaggerDeleteUser()
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id') id: string,
    @Body() dto: DeleteWithRowVersionDto,
    @CurrentUser() user: UserEntity,
  ) {
    await this.deleteUserUseCase.execute(id, user.id, dto.rowVersion);
    return { message: 'User deleted successfully' };
  }

  @Delete(':id/permanent')
  @AuditLog({ resourceType: 'user', action: AuditAction.DELETE })
  @Auth({ roles: CRITICAL_SYSTEM_ROLES })
  @HttpCode(HttpStatus.OK)
  async permanentlyDelete(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ) {
    await this.hardDeleteUserUseCase.execute(id, user.id);
    return { message: 'User permanently deleted successfully' };
  }

  @Post(':id/reset-password')
  @AuditLog({ resourceType: 'user', action: AuditAction.UPDATE })
  @Auth({ roles: CRITICAL_SYSTEM_ROLES })
  @SwaggerResetPassword()
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() user: UserEntity,
  ) {
    await this.resetPasswordUseCase.execute(id, dto, user.id);
    return { message: 'Password reset successfully' };
  }

  /**
   * Get all deleted users (soft-deleted)
   * Only SUPERADMIN / IT_ADMIN can view deleted users for restoration
   */
  @Get('deleted/list')
  @NoAuditLog()
  @Auth({ roles: CRITICAL_SYSTEM_ROLES })
  @SwaggerGetAllUsers() // Reuse same swagger, just different endpoint
  async findDeleted(@Query() filters: UserFiltersDto) {
    return this.getDeletedUsersUseCase.execute(filters);
  }

  /**
   * Restore a soft-deleted user
   * Reactivates the user account and clears deletion metadata
   */
  @Post(':id/restore')
  @AuditLog({ resourceType: 'user', action: AuditAction.RESTORE })
  @Auth({ roles: CRITICAL_SYSTEM_ROLES })
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    const restoredUser = await this.restoreUserUseCase.execute(id, user.id);
    return {
      message: 'User restored successfully',
      data: restoredUser,
    };
  }

  // ============================================================================
  // PROFILE PICTURE MANAGEMENT (SIMPLE)
  // ============================================================================

  /**
   * Upload or Update User Profile Picture
   * POST /api/v1/users/:id/profile-picture
   *
   * Simple Design:
   * - Single image file stored in uploads/users/{userId}/profile.jpg
   * - File path saved in user.profilePicture field
   * - Replaces old file automatically
   * - Picture returned with user data in GET /users/:id
   *
   * @param id - User ID
   * @param file - Profile picture image file
   * @param currentUser - Current logged-in user
   */
  @Post(':id/profile-picture')
  @AuditLog({
    resourceType: 'user-profile-picture',
    action: AuditAction.CREATE,
  })
  @Auth({ permissions: ['user:write'], allowSelf: true })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload or update user profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture (JPG, PNG only)',
        },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async uploadProfilePicture(
    @Param('id') userId: string,
    @UploadedFile() file: Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No profile picture file provided');
    }

    // Validate image types only
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!file.mimetype || !allowedMimeTypes.includes(file.mimetype as string)) {
      throw new BadRequestException(
        'Invalid file type. Only JPG and PNG images are allowed',
      );
    }

    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      try {
        await this.storageService.deleteFile(user.profilePicture);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    // Upload new profile picture
    const uploadResult = await this.storageService.uploadFile(
      file,
      'users',
      userId,
      0, // Always use index 0 for profile picture
      {
        allowedTypes: allowedMimeTypes,
        maxSize: 5 * 1024 * 1024, // 5MB
      },
    );

    // Update user record with new profile picture path
    await this.userRepository.update(userId, {
      profilePicture: uploadResult.filePath,
    });

    return {
      message: 'Profile picture uploaded successfully',
      profilePicture: uploadResult.fileUrl,
    };
  }

  /**
   * Delete User Profile Picture
   * DELETE /api/v1/users/:id/profile-picture
   *
   * Removes profile picture file and clears database field
   *
   * @param id - User ID
   * @param currentUser - Current logged-in user
   */
  @Delete(':id/profile-picture')
  @AuditLog({
    resourceType: 'user-profile-picture',
    action: AuditAction.DELETE,
  })
  @Auth({ permissions: ['user:write'], allowSelf: true })
  @ApiOperation({ summary: 'Delete user profile picture' })
  async deleteProfilePicture(@Param('id') userId: string) {
    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.profilePicture) {
      throw new NotFoundException('User does not have a profile picture');
    }

    // Delete file from storage
    await this.storageService.deleteFile(user.profilePicture);

    // Clear profilePicture field
    await this.userRepository.update(userId, {
      profilePicture: null,
    });

    return {
      message: 'Profile picture deleted successfully',
    };
  }
}
