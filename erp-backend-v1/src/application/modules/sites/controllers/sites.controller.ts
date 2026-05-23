import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';
import { Auth } from '../../auth/decorators';
import { AuditLog } from '../../../common/decorators/audit-log.decorator';
import { CurrentUser, TrackChanges } from '../../../common';
import { DeleteWithRowVersionDto } from '../../../common/dto';
import {
  CreateSiteDto,
  UpdateSiteDto,
  SiteFiltersDto,
  BulkCreateSitesDto,
  SiteResponseDto,
  SitesPaginatedResponseDto,
} from '../dto';
import { SitesStatsResponseDto } from '../dto/sites-stats-response.dto';
import {
  CreateSiteUseCase,
  GetAllSitesUseCase,
  GetAllDeletedSitesUseCase,
  GetSiteUseCase,
  GetSitesStatsUseCase,
  UpdateSiteUseCase,
  DeleteSiteUseCase,
  RestoreSiteUseCase,
  BulkCreateSitesUseCase,
} from '../use-cases';
import {
  ApiCreateSite,
  ApiGetAllSites,
  ApiGetSite,
  ApiUpdateSite,
  ApiDeleteSite,
  ApiBulkCreateSites,
} from '../decorators';

@ApiTags('Sites')
@Controller('sites')
export class SitesController {
  constructor(
    private readonly createSiteUseCase: CreateSiteUseCase,
    private readonly getAllSitesUseCase: GetAllSitesUseCase,
    private readonly getAllDeletedSitesUseCase: GetAllDeletedSitesUseCase,
    private readonly getSiteUseCase: GetSiteUseCase,
    private readonly getSitesStatsUseCase: GetSitesStatsUseCase,
    private readonly updateSiteUseCase: UpdateSiteUseCase,
    private readonly deleteSiteUseCase: DeleteSiteUseCase,
    private readonly restoreSiteUseCase: RestoreSiteUseCase,
    private readonly bulkCreateSitesUseCase: BulkCreateSitesUseCase,
  ) {}

  @Post()
  @Auth({ permissions: ['site:write'] })
  @AuditLog({
    resourceType: 'site',
    action: AuditAction.CREATE,
    captureRequest: true,
    captureResponse: true,
  })
  @ApiCreateSite()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createSiteDto: CreateSiteDto,
    @CurrentUser('id') userId: string,
  ): Promise<SiteResponseDto> {
    return this.createSiteUseCase.execute(createSiteDto, userId);
  }

  @Post('bulk')
  @Auth({ permissions: ['site:write'] })
  @AuditLog({
    resourceType: 'site',
    action: AuditAction.CREATE,
    captureRequest: true,
    captureResponse: true,
    description: 'Bulk create sites',
  })
  @ApiBulkCreateSites()
  @HttpCode(HttpStatus.CREATED)
  async bulkCreate(
    @Body() bulkCreateDto: BulkCreateSitesDto,
    @CurrentUser('id') userId: string,
  ): Promise<SiteResponseDto[]> {
    return this.bulkCreateSitesUseCase.execute(bulkCreateDto, userId);
  }

  @Get()
  @Auth({ permissions: ['site:read'] })
  @AuditLog({ enabled: false })
  @ApiGetAllSites()
  async findAll(
    @Query() filters: SiteFiltersDto,
  ): Promise<SitesPaginatedResponseDto> {
    return this.getAllSitesUseCase.execute(filters);
  }

  @Get('stats')
  @Auth({ permissions: ['site:read'] })
  @AuditLog({ enabled: false })
  @ApiOperation({ summary: 'Get sites statistics' })
  @ApiResponse({
    status: 200,
    description: 'Sites statistics retrieved successfully',
    type: SitesStatsResponseDto,
  })
  async getStats(): Promise<SitesStatsResponseDto> {
    return this.getSitesStatsUseCase.execute();
  }

  @Get('deleted')
  @Auth({ permissions: ['site:read'] })
  @AuditLog({ enabled: false })
  @ApiOperation({ summary: 'Get all deleted sites' })
  @ApiResponse({
    status: 200,
    description: 'List of deleted sites',
    type: SitesPaginatedResponseDto,
  })
  async findAllDeleted(
    @Query() filters: SiteFiltersDto,
  ): Promise<SitesPaginatedResponseDto> {
    return this.getAllDeletedSitesUseCase.execute(filters);
  }

  @Get(':id')
  @Auth({ permissions: ['site:read'] })
  @AuditLog({
    resourceType: 'site',
    action: AuditAction.VIEW,
    captureResponse: true,
  })
  @ApiGetSite()
  async findOne(@Param('id') id: string): Promise<SiteResponseDto> {
    return this.getSiteUseCase.execute(id);
  }

  @Put(':id')
  @TrackChanges('site')
  @Auth({ permissions: ['site:write'] })
  @AuditLog({
    resourceType: 'site',
    action: AuditAction.UPDATE,
    captureRequest: true,
    captureResponse: true,
    captureChanges: true,
  })
  @ApiUpdateSite()
  async update(
    @Param('id') id: string,
    @Body() updateSiteDto: UpdateSiteDto,
    @CurrentUser('id') userId: string,
  ): Promise<SiteResponseDto> {
    return this.updateSiteUseCase.execute(id, updateSiteDto, userId);
  }

  @Delete(':id')
  @Auth({ permissions: ['site:delete'] })
  @AuditLog({
    resourceType: 'site',
    action: AuditAction.DELETE,
    captureResponse: true,
  })
  @ApiDeleteSite()
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteWithRowVersionDto,
    @CurrentUser('id') userId: string,
  ): Promise<{ message: string; deletedSite: SiteResponseDto }> {
    const site = await this.deleteSiteUseCase.execute(
      id,
      userId,
      dto.rowVersion,
    );
    return {
      message: 'Site deleted successfully',
      deletedSite: site.toResponse(),
    };
  }

  @Patch(':id/restore')
  @TrackChanges('site')
  @Auth({ permissions: ['site:delete'] })
  @AuditLog({
    resourceType: 'site',
    action: AuditAction.RESTORE,
    captureResponse: true,
    description: 'Restore deleted site',
  })
  @ApiOperation({ summary: 'Restore a deleted site' })
  @ApiResponse({
    status: 200,
    description: 'Site restored successfully',
    type: SiteResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<SiteResponseDto> {
    const site = await this.restoreSiteUseCase.execute(id, userId);
    return site.toResponse();
  }
}
