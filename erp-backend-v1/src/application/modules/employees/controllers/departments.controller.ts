import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Auth } from '../../auth/decorators';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentFiltersDto,
  DepartmentResponseDto,
  DepartmentsPaginatedResponseDto,
} from '../dto';
import { DeleteWithRowVersionDto } from '../../../common/dto';
import {
  CreateDepartmentUseCase,
  GetAllDepartmentsUseCase,
  GetActiveDepartmentsUseCase,
  GetDepartmentUseCase,
  UpdateDepartmentUseCase,
  DeleteDepartmentUseCase,
} from '../use-cases';

@ApiTags('Departments')
@Controller('employees/departments')
export class DepartmentsController {
  constructor(
    private readonly createDepartmentUseCase: CreateDepartmentUseCase,
    private readonly getAllDepartmentsUseCase: GetAllDepartmentsUseCase,
    private readonly getActiveDepartmentsUseCase: GetActiveDepartmentsUseCase,
    private readonly getDepartmentUseCase: GetDepartmentUseCase,
    private readonly updateDepartmentUseCase: UpdateDepartmentUseCase,
    private readonly deleteDepartmentUseCase: DeleteDepartmentUseCase,
  ) {}

  @Post()
  @Auth({ permissions: ['department:write'] })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 201, type: DepartmentResponseDto })
  async create(
    @Body() dto: CreateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    return this.createDepartmentUseCase.execute(dto);
  }

  @Get()
  @Auth({ permissions: ['department:read'] })
  @ApiOperation({ summary: 'Get all departments (paginated)' })
  @ApiResponse({ status: 200, type: DepartmentsPaginatedResponseDto })
  async findAll(
    @Query() filters: DepartmentFiltersDto,
  ): Promise<DepartmentsPaginatedResponseDto> {
    return this.getAllDepartmentsUseCase.execute(filters);
  }

  @Get('active')
  @Auth({ permissions: ['department:read'] })
  @ApiOperation({
    summary: 'Get all active departments (no pagination - for dropdowns)',
  })
  @ApiResponse({ status: 200, type: [DepartmentResponseDto] })
  async findActive(): Promise<DepartmentResponseDto[]> {
    return this.getActiveDepartmentsUseCase.execute();
  }

  @Get(':id')
  @Auth({ permissions: ['department:read'] })
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiResponse({ status: 200, type: DepartmentResponseDto })
  async findOne(@Param('id') id: string): Promise<DepartmentResponseDto> {
    return this.getDepartmentUseCase.execute(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['department:write'] })
  @ApiOperation({ summary: 'Update a department' })
  @ApiResponse({ status: 200, type: DepartmentResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    return this.updateDepartmentUseCase.execute(id, dto);
  }

  @Delete(':id')
  @Auth({ permissions: ['department:delete'] })
  @ApiOperation({ summary: 'Delete a department' })
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteWithRowVersionDto,
  ): Promise<{ message: string; department: DepartmentResponseDto }> {
    return this.deleteDepartmentUseCase.execute(id, dto.rowVersion);
  }
}
