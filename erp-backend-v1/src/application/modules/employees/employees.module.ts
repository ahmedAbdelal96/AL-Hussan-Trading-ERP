import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../infrastructure/database/database.module';
import { LoggerModule } from '../../../infrastructure/logger/logger.module';
import { StorageModule } from '../../../infrastructure/storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { DocumentsModule } from '../documents/documents.module';
import { EmployeesController } from './controllers/employees.controller';
import { DepartmentsController } from './controllers/departments.controller';
import { PositionsController } from './controllers/positions.controller';
import {
  EmployeeRepository,
  EMPLOYEE_REPOSITORY,
  DepartmentRepository,
  DEPARTMENT_REPOSITORY,
  PositionRepository,
  POSITION_REPOSITORY,
} from './repositories';
import {
  GenerateEmployeeNumberUseCase,
  CreateEmployeeUseCase,
  GetAllEmployeesUseCase,
  GetEmployeeUseCase,
  UpdateEmployeeUseCase,
  DeleteEmployeeUseCase,
  BulkCreateEmployeesUseCase,
  GetEmployeesStatisticsUseCase,
  // Departments
  CreateDepartmentUseCase,
  GetAllDepartmentsUseCase,
  GetActiveDepartmentsUseCase,
  GetDepartmentUseCase,
  UpdateDepartmentUseCase,
  DeleteDepartmentUseCase,
  // Positions
  CreatePositionUseCase,
  GetAllPositionsUseCase,
  GetActivePositionsUseCase,
  GetPositionUseCase,
  UpdatePositionUseCase,
  DeletePositionUseCase,
  RehireEmployeeUseCase,
} from './use-cases';

@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
    StorageModule,
    AuthModule,
    RbacModule,
    DocumentsModule,
  ],
  controllers: [
    EmployeesController,
    DepartmentsController,
    PositionsController,
  ],
  providers: [
    // Repositories
    { provide: EMPLOYEE_REPOSITORY, useClass: EmployeeRepository },
    { provide: DEPARTMENT_REPOSITORY, useClass: DepartmentRepository },
    { provide: POSITION_REPOSITORY, useClass: PositionRepository },

    // Employee Use Cases
    GenerateEmployeeNumberUseCase,
    CreateEmployeeUseCase,
    GetAllEmployeesUseCase,
    GetEmployeeUseCase,
    UpdateEmployeeUseCase,
    DeleteEmployeeUseCase,
    BulkCreateEmployeesUseCase,
    GetEmployeesStatisticsUseCase,
    RehireEmployeeUseCase,

    // Department Use Cases
    CreateDepartmentUseCase,
    GetAllDepartmentsUseCase,
    GetActiveDepartmentsUseCase,
    GetDepartmentUseCase,
    UpdateDepartmentUseCase,
    DeleteDepartmentUseCase,

    // Position Use Cases
    CreatePositionUseCase,
    GetAllPositionsUseCase,
    GetActivePositionsUseCase,
    GetPositionUseCase,
    UpdatePositionUseCase,
    DeletePositionUseCase,
  ],
  exports: [
    EMPLOYEE_REPOSITORY,
    DEPARTMENT_REPOSITORY,
    GetActiveDepartmentsUseCase,
    POSITION_REPOSITORY,
    GetActivePositionsUseCase,
  ],
})
export class EmployeesModule {}
