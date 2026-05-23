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
  CreatePositionDto,
  UpdatePositionDto,
  PositionFiltersDto,
  PositionResponseDto,
  PositionsPaginatedResponseDto,
} from '../dto';
import { DeleteWithRowVersionDto } from '../../../common/dto';
import {
  CreatePositionUseCase,
  GetAllPositionsUseCase,
  GetActivePositionsUseCase,
  GetPositionUseCase,
  UpdatePositionUseCase,
  DeletePositionUseCase,
} from '../use-cases';

@ApiTags('Positions')
@Controller('employees/positions')
export class PositionsController {
  constructor(
    private readonly createPositionUseCase: CreatePositionUseCase,
    private readonly getAllPositionsUseCase: GetAllPositionsUseCase,
    private readonly getActivePositionsUseCase: GetActivePositionsUseCase,
    private readonly getPositionUseCase: GetPositionUseCase,
    private readonly updatePositionUseCase: UpdatePositionUseCase,
    private readonly deletePositionUseCase: DeletePositionUseCase,
  ) {}

  @Post()
  @Auth({ permissions: ['position:write'] })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new position' })
  @ApiResponse({ status: 201, type: PositionResponseDto })
  async create(@Body() dto: CreatePositionDto): Promise<PositionResponseDto> {
    return this.createPositionUseCase.execute(dto);
  }

  @Get()
  @Auth({ permissions: ['position:read'] })
  @ApiOperation({ summary: 'Get all positions (paginated)' })
  @ApiResponse({ status: 200, type: PositionsPaginatedResponseDto })
  async findAll(
    @Query() filters: PositionFiltersDto,
  ): Promise<PositionsPaginatedResponseDto> {
    return this.getAllPositionsUseCase.execute(filters);
  }

  @Get('active')
  @Auth({ permissions: ['position:read'] })
  @ApiOperation({
    summary:
      'Get all active positions (for dropdowns), optionally filtered by departmentId',
  })
  @ApiResponse({ status: 200, type: [PositionResponseDto] })
  async findActive(
    @Query('departmentId') departmentId?: string,
  ): Promise<PositionResponseDto[]> {
    return this.getActivePositionsUseCase.execute(departmentId);
  }

  @Get(':id')
  @Auth({ permissions: ['position:read'] })
  @ApiOperation({ summary: 'Get position by ID' })
  @ApiResponse({ status: 200, type: PositionResponseDto })
  async findOne(@Param('id') id: string): Promise<PositionResponseDto> {
    return this.getPositionUseCase.execute(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['position:write'] })
  @ApiOperation({ summary: 'Update a position' })
  @ApiResponse({ status: 200, type: PositionResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePositionDto,
  ): Promise<PositionResponseDto> {
    return this.updatePositionUseCase.execute(id, dto);
  }

  @Delete(':id')
  @Auth({ permissions: ['position:delete'] })
  @ApiOperation({ summary: 'Delete a position' })
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteWithRowVersionDto,
  ): Promise<{ message: string; position: PositionResponseDto }> {
    return this.deletePositionUseCase.execute(id, dto.rowVersion);
  }
}
