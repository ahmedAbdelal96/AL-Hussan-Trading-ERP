import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../auth/decorators/auth.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { TrackChanges } from '../../../common/decorators/track-changes.decorator';
import { UserEntity } from '../../auth/entities/user.entity';

// DTOs
import {
  CreateCostCategoryDto,
  UpdateCostCategoryDto,
  CostCategoryFiltersDto,
  CreateProjectCostDto,
  UpdateProjectCostDto,
  ProjectCostFiltersDto,
  ApproveProjectCostDto,
  RejectProjectCostDto,
  FinanceStatisticsDto,
  UpdateCostAllocationsDto,
} from '../dto';

// Use Cases
import {
  CreateCostCategoryUseCase,
  GetCostCategoryUseCase,
  GetAllCostCategoriesUseCase,
  UpdateCostCategoryUseCase,
  DeleteCostCategoryUseCase,
  CreateProjectCostUseCase,
  GetProjectCostUseCase,
  GetAllProjectCostsUseCase,
  UpdateProjectCostUseCase,
  DeleteProjectCostUseCase,
  ApproveProjectCostUseCase,
  RejectProjectCostUseCase,
  GetProjectCostSummaryUseCase,
  GetFinanceStatisticsUseCase,
  GetCostAllocationsUseCase,
  UpdateCostAllocationsUseCase,
  ConvertCostToAllocatedUseCase,
  DeleteCostAllocationsUseCase,
} from '../use-cases';

// Swagger Decorators
import {
  SwaggerCreateCostCategory,
  SwaggerGetAllCostCategories,
  SwaggerGetCostCategory,
  SwaggerUpdateCostCategory,
  SwaggerDeleteCostCategory,
  SwaggerCreateProjectCost,
  SwaggerGetAllProjectCosts,
  SwaggerGetProjectCost,
  SwaggerUpdateProjectCost,
  SwaggerDeleteProjectCost,
  SwaggerApproveProjectCost,
  SwaggerRejectProjectCost,
  SwaggerGetProjectCostSummary,
  SwaggerGetCostAllocations,
  SwaggerUpdateCostAllocations,
  SwaggerConvertCostToAllocated,
  SwaggerDeleteCostAllocations,
} from '../decorators/finance-swagger.decorators';
import { AuditLog, NoAuditLog } from '../../../common/decorators';
import { DeleteWithRowVersionDto } from '../../../common/dto';
import { AuditAction } from '@prisma/client';

/**
 * Finance Controller
 * Handles all finance-related operations:
 * - Cost Categories Management
 * - Project Costs Management (Single Project, General Expense, Allocated)
 * - Cost Allocation Management
 * - Cost Approval Workflow
 * - Financial Analytics
 */
@Controller('finance')
@ApiTags('Finance')
export class FinanceController {
  private userHasPermission(user: UserEntity, permission: string): boolean {
    if (!user) return false;
    if (user.roles?.includes('SUPERADMIN') || user.roles?.includes('ADMIN')) {
      return true;
    }
    const [resource, action] = permission.split(':');
    if (!resource || !action) return false;
    return !!user.permissions?.some(
      (p) => p.resource === resource && p.action === action,
    );
  }

  constructor(
    // Cost Category Use Cases
    private readonly createCostCategoryUseCase: CreateCostCategoryUseCase,
    private readonly getCostCategoryUseCase: GetCostCategoryUseCase,
    private readonly getAllCostCategoriesUseCase: GetAllCostCategoriesUseCase,
    private readonly updateCostCategoryUseCase: UpdateCostCategoryUseCase,
    private readonly deleteCostCategoryUseCase: DeleteCostCategoryUseCase,

    // Project Cost Use Cases
    private readonly createProjectCostUseCase: CreateProjectCostUseCase,
    private readonly getProjectCostUseCase: GetProjectCostUseCase,
    private readonly getAllProjectCostsUseCase: GetAllProjectCostsUseCase,
    private readonly updateProjectCostUseCase: UpdateProjectCostUseCase,
    private readonly deleteProjectCostUseCase: DeleteProjectCostUseCase,
    private readonly approveProjectCostUseCase: ApproveProjectCostUseCase,
    private readonly rejectProjectCostUseCase: RejectProjectCostUseCase,
    private readonly getProjectCostSummaryUseCase: GetProjectCostSummaryUseCase,

    // Cost Allocation Use Cases
    private readonly getCostAllocationsUseCase: GetCostAllocationsUseCase,
    private readonly updateCostAllocationsUseCase: UpdateCostAllocationsUseCase,
    private readonly convertCostToAllocatedUseCase: ConvertCostToAllocatedUseCase,
    private readonly deleteCostAllocationsUseCase: DeleteCostAllocationsUseCase,

    // Statistics Use Cases
    private readonly getFinanceStatisticsUseCase: GetFinanceStatisticsUseCase,
  ) {}

  // ============================================================================
  // COST CATEGORY ENDPOINTS
  // ============================================================================

  @Post('categories')
  @AuditLog({ resourceType: 'cost-category', action: AuditAction.CREATE })
  @Auth({ permissions: ['finance:write'] })
  @SwaggerCreateCostCategory()
  async createCategory(@Body() dto: CreateCostCategoryDto) {
    return this.createCostCategoryUseCase.execute(dto);
  }

  @Get('categories')
  @NoAuditLog()
  @Auth({ permissions: ['finance:read'] })
  @SwaggerGetAllCostCategories()
  async getAllCategories(@Query() filters: CostCategoryFiltersDto) {
    return this.getAllCostCategoriesUseCase.execute(filters);
  }

  @Get('categories/:id')
  @NoAuditLog()
  @Auth({ permissions: ['finance:read'] })
  @SwaggerGetCostCategory()
  async getCategory(@Param('id') id: string) {
    return this.getCostCategoryUseCase.execute(id);
  }

  @Put('categories/:id')
  @AuditLog({ resourceType: 'cost-category', action: AuditAction.UPDATE })
  @TrackChanges('cost-category')
  @Auth({ permissions: ['finance:write'] })
  @SwaggerUpdateCostCategory()
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCostCategoryDto,
  ) {
    return this.updateCostCategoryUseCase.execute(id, dto);
  }

  @Delete('categories/:id')
  @AuditLog({ resourceType: 'cost-category', action: AuditAction.DELETE })
  @Auth({ roles: ['ADMIN', 'SUPERADMIN'], permissions: ['finance:delete'] })
  @SwaggerDeleteCostCategory()
  async deleteCategory(
    @Param('id') id: string,
    @Body() dto: DeleteWithRowVersionDto,
  ) {
    return this.deleteCostCategoryUseCase.execute(id, dto.rowVersion);
  }

  // ============================================================================
  // PROJECT COST ENDPOINTS
  // ============================================================================

  @Post('costs')
  @AuditLog({ resourceType: 'project-cost', action: AuditAction.CREATE })
  @Auth({ permissions: ['finance:write'] })
  @SwaggerCreateProjectCost()
  async createCost(
    @Body() dto: CreateProjectCostDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.createProjectCostUseCase.execute(dto, user.id);
  }

  @Get('costs')
  @NoAuditLog()
  @Auth({ permissions: ['finance:read'] })
  @SwaggerGetAllProjectCosts()
  async getAllCosts(@Query() filters: ProjectCostFiltersDto) {
    return this.getAllProjectCostsUseCase.execute(filters);
  }

  @Get('costs/:id')
  @NoAuditLog()
  @Auth({ permissions: ['finance:read'] })
  @SwaggerGetProjectCost()
  async getCost(@Param('id') id: string) {
    return this.getProjectCostUseCase.execute(id);
  }

  @Put('costs/:id')
  @AuditLog({ resourceType: 'project-cost', action: AuditAction.UPDATE })
  @TrackChanges('project-cost')
  @Auth({ permissions: ['finance:write'] })
  @SwaggerUpdateProjectCost()
  async updateCost(
    @Param('id') id: string,
    @Body() dto: UpdateProjectCostDto,
    @CurrentUser() user: UserEntity,
  ) {
    const includesPaymentLifecycleChange =
      dto.paymentStatus !== undefined ||
      dto.paidDate !== undefined ||
      dto.paymentMethod !== undefined ||
      dto.paymentReference !== undefined;

    // Field-level authorization: payment lifecycle updates are approval authority.
    if (
      includesPaymentLifecycleChange &&
      !this.userHasPermission(user, 'finance:approve')
    ) {
      throw new ForbiddenException(
        'Only users with finance:approve permission can update payment status/details.',
      );
    }

    return this.updateProjectCostUseCase.execute(id, dto);
  }

  @Delete('costs/:id')
  @AuditLog({ resourceType: 'project-cost', action: AuditAction.DELETE })
  @Auth({ roles: ['ADMIN', 'SUPERADMIN'], permissions: ['finance:delete'] })
  @SwaggerDeleteProjectCost()
  async deleteCost(
    @Param('id') id: string,
    @Body() dto: DeleteWithRowVersionDto,
  ) {
    return this.deleteProjectCostUseCase.execute(id, dto.rowVersion);
  }

  // ============================================================================
  // COST APPROVAL WORKFLOW ENDPOINTS
  // ============================================================================

  @Post('costs/:id/approve')
  @AuditLog({ resourceType: 'project-cost', action: AuditAction.APPROVE })
  @Auth({ permissions: ['finance:approve'] })
  @SwaggerApproveProjectCost()
  async approveCost(
    @Param('id') id: string,
    @Body() dto: ApproveProjectCostDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.approveProjectCostUseCase.execute(id, dto, user.id);
  }

  @Post('costs/:id/reject')
  @AuditLog({ resourceType: 'project-cost', action: AuditAction.REJECT })
  @Auth({ permissions: ['finance:approve'] })
  @SwaggerRejectProjectCost()
  async rejectCost(
    @Param('id') id: string,
    @Body() dto: RejectProjectCostDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.rejectProjectCostUseCase.execute(id, dto, user.id);
  }

  // ============================================================================
  // ANALYTICS & REPORTS ENDPOINTS
  // ============================================================================

  /**
   * Get finance statistics for dashboard
   * Returns aggregated financial data including:
   * - Total costs, pending, approved, paid amounts
   * - Breakdown by status, type, category
   * - Monthly trends
   * - Top projects by cost
   * - Recent activity metrics
   *
   * @param startDate - Optional start date filter (ISO string)
   * @param endDate - Optional end date filter (ISO string)
   */
  @Get('statistics')
  @NoAuditLog()
  @Auth({ permissions: ['finance:read'] })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<FinanceStatisticsDto> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.getFinanceStatisticsUseCase.execute(start, end);
  }

  @Get('costs/project/:projectId/summary')
  @NoAuditLog()
  @Auth({ permissions: ['finance:read'] })
  @SwaggerGetProjectCostSummary()
  async getProjectSummary(@Param('projectId') projectId: string) {
    return this.getProjectCostSummaryUseCase.execute(projectId);
  }

  // ============================================================================
  // COST ALLOCATION ENDPOINTS
  // ============================================================================

  /**
   * Get allocations for an allocated cost
   *
   * Returns breakdown showing how cost is distributed across projects
   * Includes validation status and summary statistics
   *
   * Use Cases:
   * - Display allocation breakdown in UI
   * - Verify allocation accuracy
   * - Audit trail for cost distribution
   */
  @Get('costs/:id/allocations')
  @NoAuditLog()
  @Auth({ permissions: ['finance:read'] })
  @SwaggerGetCostAllocations()
  async getCostAllocations(@Param('id') id: string) {
    return this.getCostAllocationsUseCase.execute(id);
  }

  /**
   * Update allocations for an allocated cost
   *
   * Strategy: Full replacement (deletes old, creates new)
   * Requires: Minimum 2 projects, sum = 100% or total amount
   * Restrictions: Cannot update paid costs
   *
   * Use Cases:
   * - Reallocate cost after project scope changes
   * - Fix incorrect allocation percentages
   * - Add/remove projects from allocation
   */
  @Put('costs/:id/allocations')
  @AuditLog({ resourceType: 'cost-allocation', action: AuditAction.UPDATE })
  @TrackChanges('cost-allocation')
  @Auth({ permissions: ['finance:write'] })
  @SwaggerUpdateCostAllocations()
  async updateCostAllocations(
    @Param('id') id: string,
    @Body() dto: UpdateCostAllocationsDto,
  ) {
    return this.updateCostAllocationsUseCase.execute(id, dto);
  }

  /**
   * Convert regular cost to allocated cost
   *
   * Converts:
   * - Single-project cost → Allocated cost
   * - General expense → Allocated cost
   *
   * Restrictions: Cannot convert paid costs
   *
   * Use Cases:
   * - Project scope expanded: Split cost across projects
   * - Realize cost should be shared
   * - Assign general expense to specific projects
   */
  @Post('costs/:id/convert-to-allocated')
  @AuditLog({ resourceType: 'cost-allocation', action: AuditAction.UPDATE })
  @TrackChanges('cost-allocation')
  @Auth({ permissions: ['finance:write'] })
  @SwaggerConvertCostToAllocated()
  async convertCostToAllocated(
    @Param('id') id: string,
    @Body() dto: UpdateCostAllocationsDto,
  ) {
    return this.convertCostToAllocatedUseCase.execute(
      id,
      dto.allocations,
      dto.rowVersion,
    );
  }

  /**
   * Delete allocations and convert back to regular cost
   *
   * Converts:
   * - Allocated cost → Single-project cost (if projectId provided)
   * - Allocated cost → General expense (if no projectId)
   *
   * Restrictions: Cannot delete allocations from paid costs
   *
   * Use Cases:
   * - Allocation was mistake: Revert to single project
   * - Project scope changed: Cost now belongs to one project
   * - Simplify accounting: Convert to general expense
   */
  @Delete('costs/:id/allocations')
  @AuditLog({ resourceType: 'cost-allocation', action: AuditAction.DELETE })
  @TrackChanges('cost-allocation')
  @Auth({ permissions: ['finance:write'] })
  @SwaggerDeleteCostAllocations()
  async deleteCostAllocations(
    @Param('id') id: string,
    @Query('projectId') projectId?: string,
    @Query('rowVersion') rowVersion?: string,
  ) {
    const parsedRowVersion =
      typeof rowVersion === 'string' && rowVersion.trim().length > 0
        ? Number(rowVersion)
        : undefined;

    return this.deleteCostAllocationsUseCase.execute(
      id,
      projectId,
      Number.isInteger(parsedRowVersion) ? parsedRowVersion : undefined,
    );
  }
}
