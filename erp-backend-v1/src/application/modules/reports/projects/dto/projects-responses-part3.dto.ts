/**
 * ============================================================================
 * PROJECTS REPORTS - RESPONSE DTOs PART 3
 * ============================================================================
 *
 * Response DTOs for Phase 1 new reports:
 *   - Report 8: Project Cost Breakdown
 *   - Report 9: Project Labor Cost
 *   - Report 10: Project Asset Utilization
 *
 * @module ProjectsResponsesPart3Dto
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CostType, ProjectStatus } from '@prisma/client';

// ============================================================================
// REPORT 8: PROJECT COST BREAKDOWN
// ============================================================================

export class CostTypeBreakdownItemDto {
  @ApiProperty({ enum: CostType })
  costType: CostType;

  @ApiProperty()
  amount: number;

  @ApiProperty({ description: 'Percentage of total project cost' })
  percentage: number;

  @ApiProperty()
  transactionCount: number;
}

export class ProjectCostBreakdownItemDto {
  @ApiProperty()
  projectId: string;

  @ApiProperty()
  projectCode: string;

  @ApiProperty()
  projectName: string;

  @ApiProperty({ enum: ProjectStatus })
  status: ProjectStatus;

  @ApiPropertyOptional()
  siteId?: string;

  @ApiPropertyOptional()
  siteName?: string;

  @ApiProperty()
  budget: number;

  @ApiProperty({ description: 'Sum of direct + allocated costs' })
  totalCost: number;

  @ApiProperty({ description: 'Budget - totalCost (positive = under budget)' })
  budgetVariance: number;

  @ApiProperty({ description: '(totalCost / budget) * 100' })
  budgetUtilization: number;

  @ApiProperty({ description: 'Direct costs assigned to this project' })
  directCosts: number;

  @ApiProperty({ description: 'Costs allocated from shared cost pool' })
  allocatedCosts: number;

  @ApiProperty({ type: [CostTypeBreakdownItemDto] })
  costByType: CostTypeBreakdownItemDto[];
}

export class CostTypeTotalDto {
  @ApiProperty({ enum: CostType })
  costType: CostType;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  percentage: number;

  @ApiProperty()
  projectCount: number;
}

export class ProjectCostBreakdownResponseDto {
  @ApiProperty({ type: [ProjectCostBreakdownItemDto] })
  projects: ProjectCostBreakdownItemDto[];

  @ApiProperty({ description: 'Grand total across all projects' })
  grandTotalCost: number;

  @ApiProperty({ description: 'Grand total budget across all projects' })
  grandTotalBudget: number;

  @ApiProperty({ description: 'Overall budget utilization %' })
  overallBudgetUtilization: number;

  @ApiProperty({
    type: [CostTypeTotalDto],
    description: 'Cost totals by type across all projects',
  })
  costTypesSummary: CostTypeTotalDto[];

  @ApiProperty()
  projectCount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  generatedAt: string;
}

// ============================================================================
// REPORT 9: PROJECT LABOR COST
// ============================================================================

export class ProjectEmployeeCostDetailDto {
  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  employeeCode: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  position: string;

  @ApiProperty()
  department: string;

  @ApiProperty({
    description: 'Salary allocation % to this project (from ProjectEmployee)',
  })
  allocationPercentage: number;

  @ApiProperty({
    description: 'SALARY costs recorded for this employee on this project',
  })
  salaryCost: number;

  @ApiProperty({
    description: 'ALLOWANCE costs recorded for this employee on this project',
  })
  allowanceCost: number;

  @ApiProperty()
  totalLaborCost: number;
}

export class ProjectLaborCostItemDto {
  @ApiProperty()
  projectId: string;

  @ApiProperty()
  projectCode: string;

  @ApiProperty()
  projectName: string;

  @ApiProperty({ enum: ProjectStatus })
  status: ProjectStatus;

  @ApiPropertyOptional()
  siteId?: string;

  @ApiPropertyOptional()
  siteName?: string;

  @ApiProperty()
  budget: number;

  @ApiProperty({ description: 'SALARY costs for this project' })
  salaryCost: number;

  @ApiProperty({ description: 'ALLOWANCE costs for this project' })
  allowanceCost: number;

  @ApiProperty({ description: 'salaryCost + allowanceCost' })
  totalLaborCost: number;

  @ApiProperty({
    description: 'Non-labor costs (everything except SALARY + ALLOWANCE)',
  })
  otherCosts: number;

  @ApiProperty({
    description: 'totalLaborCost + otherCosts (full project cost)',
  })
  totalProjectCost: number;

  @ApiProperty({ description: '(totalLaborCost / budget) * 100' })
  laborBudgetPercentage: number;

  @ApiProperty({ description: '(totalLaborCost / totalProjectCost) * 100' })
  laborCostShare: number;

  @ApiProperty({ description: 'Number of employees currently assigned' })
  assignedEmployeeCount: number;

  @ApiPropertyOptional({ type: [ProjectEmployeeCostDetailDto] })
  employeeDetails?: ProjectEmployeeCostDetailDto[];
}

export class LaborCostSummaryDto {
  @ApiProperty()
  totalLaborCost: number;

  @ApiProperty()
  totalSalaryCost: number;

  @ApiProperty()
  totalAllowanceCost: number;

  @ApiProperty()
  totalBudget: number;

  @ApiProperty()
  totalProjectCost: number;

  @ApiProperty({
    description: 'Labor as % of total project cost across all projects',
  })
  overallLaborShare: number;

  @ApiProperty()
  totalAssignedEmployees: number;

  @ApiProperty({ description: 'Average labor cost per project' })
  avgLaborCostPerProject: number;
}

export class ProjectLaborCostResponseDto {
  @ApiProperty({ type: [ProjectLaborCostItemDto] })
  projects: ProjectLaborCostItemDto[];

  @ApiProperty({ type: LaborCostSummaryDto })
  summary: LaborCostSummaryDto;

  @ApiProperty()
  projectCount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  generatedAt: string;
}

// ============================================================================
// REPORT 10: PROJECT ASSET UTILIZATION
// ============================================================================

export class ProjectAssetDetailDto {
  @ApiProperty()
  assetId: string;

  @ApiProperty()
  assetCode: string;

  @ApiProperty()
  assetName: string;

  @ApiProperty()
  assetType: string;

  @ApiProperty()
  assetStatus: string;

  @ApiProperty({ description: 'Purchase price from Asset model' })
  purchasePrice: number;

  @ApiProperty({ description: 'Allocation % from ProjectAsset.percentage' })
  allocationPercentage: number;

  @ApiProperty({ description: 'purchasePrice * (allocationPercentage / 100)' })
  allocatedAssetValue: number;

  @ApiProperty({
    description: 'MAINTENANCE costs recorded for this asset on this project',
  })
  maintenanceCost: number;

  @ApiProperty({ description: 'allocatedAssetValue + maintenanceCost' })
  totalAssetCost: number;

  @ApiPropertyOptional({ description: 'Date assigned to this project' })
  assignedDate?: string;

  @ApiPropertyOptional({ description: 'Expected return date' })
  returnDate?: string;
}

export class ProjectAssetUtilizationItemDto {
  @ApiProperty()
  projectId: string;

  @ApiProperty()
  projectCode: string;

  @ApiProperty()
  projectName: string;

  @ApiProperty({ enum: ProjectStatus })
  status: ProjectStatus;

  @ApiPropertyOptional()
  siteId?: string;

  @ApiPropertyOptional()
  siteName?: string;

  @ApiProperty({ description: 'Number of active asset assignments' })
  totalAssets: number;

  @ApiProperty({
    description: 'Sum of (purchasePrice * allocationPercentage / 100)',
  })
  totalAllocatedAssetValue: number;

  @ApiProperty({
    description: 'Total MAINTENANCE costs for assets in this project',
  })
  totalMaintenanceCost: number;

  @ApiProperty({
    description: 'totalAllocatedAssetValue + totalMaintenanceCost',
  })
  totalAssetCost: number;

  @ApiProperty({
    description:
      '(totalMaintenanceCost / totalAllocatedAssetValue) * 100 — maintenance intensity',
  })
  maintenanceIntensity: number;

  @ApiPropertyOptional({ type: [ProjectAssetDetailDto] })
  assets?: ProjectAssetDetailDto[];
}

export class AssetUtilizationSummaryDto {
  @ApiProperty()
  totalAssignedAssets: number;

  @ApiProperty()
  totalAllocatedAssetValue: number;

  @ApiProperty()
  totalMaintenanceCost: number;

  @ApiProperty()
  totalAssetCost: number;

  @ApiProperty({ description: 'Average asset count per project' })
  avgAssetsPerProject: number;

  @ApiProperty({ description: 'Overall maintenance intensity %' })
  overallMaintenanceIntensity: number;
}

export class ProjectAssetUtilizationResponseDto {
  @ApiProperty({ type: [ProjectAssetUtilizationItemDto] })
  projects: ProjectAssetUtilizationItemDto[];

  @ApiProperty({ type: AssetUtilizationSummaryDto })
  summary: AssetUtilizationSummaryDto;

  @ApiProperty()
  projectCount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  generatedAt: string;
}
