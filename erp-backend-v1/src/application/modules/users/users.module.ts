import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../infrastructure/database/database.module';
import { LoggerModule } from '../../../infrastructure/logger/logger.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { StorageModule } from '../../../infrastructure/storage/storage.module';
import { UsersController } from './controllers/users.controller';
import { UserRepository, USER_REPOSITORY } from './repositories';
import {
  CreateUserUseCase,
  GetAllUsersUseCase,
  GetUserUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
  HardDeleteUserUseCase,
  ResetUserPasswordUseCase,
  BulkCreateUsersUseCase,
  GetDeletedUsersUseCase,
  RestoreUserUseCase,
  GetUsersStatisticsUseCase,
} from './use-cases';

@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
    AuthModule, // For PasswordService
    RbacModule, // For PermissionResolverService (used by PermissionsGuard)
    StorageModule, // For profile picture upload
  ],
  controllers: [UsersController],
  providers: [
    // Repository
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },

    // Use Cases
    CreateUserUseCase,
    GetAllUsersUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    HardDeleteUserUseCase,
    ResetUserPasswordUseCase,
    BulkCreateUsersUseCase,
    GetDeletedUsersUseCase,
    RestoreUserUseCase,
    GetUsersStatisticsUseCase,
  ],
  exports: [USER_REPOSITORY], // Export in case other modules need it
})
export class UsersModule {}
