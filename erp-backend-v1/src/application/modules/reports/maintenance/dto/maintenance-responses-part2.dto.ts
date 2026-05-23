import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MaintenanceType,
  MaintenanceStatus,
  MaintenancePriority,
  AssetType,
} from '@prisma/client';

// ============================================================================
// REPORT 5: MAINTENANCE COST ANALYSIS
// ============================================================================

/**
 * Monthly cost trend data point
 */
export class MonthlyCostTrendDto {
  @ApiProperty({ example: '2024-06' })
  month: string;

  @ApiProperty({ example: 12 })
  requestCount: number;

  @ApiProperty({ example: 55000 })
  estimatedCost: number;

  @ApiProperty({ example: 48500 })
  actualCost: number;

  @ApiProperty({ example: 6500 })
  costVariance: number;

  @ApiProperty({ example: 11.8 })
  variancePercentage: number;
}

/**
 * Cost breakdown by maintenance type
 */
export class CostByTypeDto {
  @ApiProperty({ enum: MaintenanceType })
  type: MaintenanceType;

  @ApiProperty({ example: 65 })
  requestCount: number;

  @ApiProperty({ example: 180000 })
  estimatedCost: number;

  @ApiProperty({ example: 165000 })
  actualCost: number;

  @ApiProperty({ example: 15000 })
  costVariance: number;

  @ApiProperty({ example: 8.3 })
  variancePercentage: number;

  @ApiProperty({ example: 2538 })
  averageCostPerRequest: number;
}

/**
 * Cost breakdown by asset type
 */
export class CostByAssetTypeDto {
  @ApiProperty({ enum: AssetType })
  assetType: AssetType;

  @ApiProperty({ example: 45 })
  assetCount: number;

  @ApiProperty({ example: 125 })
  requestCount: number;

  @ApiProperty({ example: 320000 })
  totalCost: number;

  @ApiProperty({ example: 2560 })
  averageCostPerRequest: number;

  @ApiProperty({ example: 7111 })
  averageCostPerAsset: number;
}

/**
 * Cost breakdown by vendor
 */
export class CostByVendorDto {
  @ApiProperty({ example: 'ABC Maintenance Co.' })
  vendor: string;

  @ApiProperty({ example: 28 })
  requestCount: number;

  @ApiProperty({ example: 125000 })
  totalCost: number;

  @ApiProperty({ example: 4464 })
  averageCostPerRequest: number;

  @ApiProperty({ example: 21.6 })
  percentageOfTotalCost: number;
}

/**
 * Top costly maintenance request
 */
export class TopCostlyMaintenanceDto {
  @ApiProperty({ example: 'MNT-0089' })
  maintenanceNumber: string;

  @ApiProperty({ example: 'Major Engine Overhaul' })
  title: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  assetId: string;

  @ApiProperty({ example: 'VEH-015' })
  assetNumber: string;

  @ApiProperty({ example: 'Caterpillar 320D' })
  assetName: string;

  @ApiProperty({ enum: MaintenanceType })
  type: MaintenanceType;

  @ApiProperty({ example: 45000 })
  estimatedCost: number;

  @ApiProperty({ example: 52000 })
  actualCost: number;

  @ApiProperty({ example: 7000 })
  costVariance: number;

  @ApiProperty({ example: 15.6 })
  variancePercentage: number;
}

/**
 * Response DTO for Maintenance Cost Analysis Report
 */
export class MaintenanceCostAnalysisResponseDto {
  @ApiProperty({ example: 250 })
  totalRequests: number;

  @ApiProperty({ example: 650000 })
  totalEstimatedCost: number;

  @ApiProperty({ example: 580000 })
  totalActualCost: number;

  @ApiProperty({ example: 70000 })
  totalCostVariance: number;

  @ApiProperty({ example: 10.8 })
  variancePercentage: number;

  @ApiProperty({ example: 2600 })
  averageCostPerRequest: number;

  @ApiProperty({ type: [CostByTypeDto] })
  costByType: CostByTypeDto[];

  @ApiProperty({ type: [CostByAssetTypeDto] })
  costByAssetType: CostByAssetTypeDto[];

  @ApiPropertyOptional({ type: [CostByVendorDto] })
  costByVendor?: CostByVendorDto[];

  @ApiPropertyOptional({ type: [MonthlyCostTrendDto] })
  monthlyTrends?: MonthlyCostTrendDto[];

  @ApiPropertyOptional({ type: [TopCostlyMaintenanceDto] })
  topCostlyRequests?: TopCostlyMaintenanceDto[];

  @ApiProperty({ example: '2024-01-01' })
  startDate: string;

  @ApiProperty({ example: '2024-12-31' })
  endDate: string;
}

// ============================================================================
// REPORT 6: MAINTENANCE PERFORMANCE
// ============================================================================

/**
 * Employee performance metrics
 */
export class EmployeePerformanceDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  employeeId: string;

  @ApiProperty({ example: 'John Smith' })
  employeeName: string;

  @ApiProperty({ example: 35 })
  assignedCount: number;

  @ApiProperty({ example: 32 })
  completedCount: number;

  @ApiProperty({ example: 91.4 })
  completionRate: number;

  @ApiProperty({ example: 3.2 })
  averageCompletionTime: number; // in days

  @ApiProperty({ example: 28 })
  onTimeCompletions: number;

  @ApiProperty({ example: 87.5 })
  onTimeRate: number;
}

/**
 * Vendor performance metrics
 */
export class VendorPerformanceDto {
  @ApiProperty({ example: 'ABC Maintenance Co.' })
  vendor: string;

  @ApiProperty({ example: 28 })
  assignedCount: number;

  @ApiProperty({ example: 26 })
  completedCount: number;

  @ApiProperty({ example: 92.9 })
  completionRate: number;

  @ApiProperty({ example: 4.5 })
  averageCompletionTime: number; // in days

  @ApiProperty({ example: 125000 })
  totalCost: number;

  @ApiProperty({ example: 4464 })
  averageCostPerRequest: number;

  @ApiProperty({ example: 8.5 })
  costVariancePercentage: number;
}

/**
 * MTTR analysis by type
 */
export class MTTRByTypeDto {
  @ApiProperty({ enum: MaintenanceType })
  type: MaintenanceType;

  @ApiProperty({ example: 3.5 })
  mttr: number; // Mean Time To Repair in days

  @ApiProperty({ example: 58 })
  completedCount: number;
}

/**
 * On-time completion metrics
 */
export class OnTimeMetricsDto {
  @ApiProperty({ example: 180 })
  totalCompleted: number;

  @ApiProperty({ example: 145 })
  onTimeCompletions: number;

  @ApiProperty({ example: 35 })
  lateCompletions: number;

  @ApiProperty({ example: 80.6 })
  onTimeRate: number;

  @ApiProperty({ example: 5.8 })
  averageDelayDays: number; // for late completions
}

/**
 * Response DTO for Maintenance Performance Report
 */
export class MaintenancePerformanceResponseDto {
  @ApiProperty({ example: 250 })
  totalRequests: number;

  @ApiProperty({ example: 180 })
  completedRequests: number;

  @ApiProperty({ example: 72.0 })
  overallCompletionRate: number;

  @ApiProperty({ example: 3.8 })
  mttr: number; // Overall Mean Time To Repair in days

  @ApiProperty({ example: 15.5 })
  mtbf: number; // Estimated Mean Time Between Failures in days

  @ApiProperty({ type: [MTTRByTypeDto] })
  mttrByType: MTTRByTypeDto[];

  @ApiPropertyOptional({ type: OnTimeMetricsDto })
  onTimeMetrics?: OnTimeMetricsDto;

  @ApiPropertyOptional({ type: [EmployeePerformanceDto] })
  employeePerformance?: EmployeePerformanceDto[];

  @ApiPropertyOptional({ type: [VendorPerformanceDto] })
  vendorPerformance?: VendorPerformanceDto[];

  @ApiProperty({ example: 85.5 })
  emergencyResponseRate: number; // percentage handled within SLA

  @ApiProperty({ example: 1.8 })
  averageEmergencyResponseTime: number; // in hours

  @ApiProperty({ example: '2024-01-01' })
  startDate: string;

  @ApiProperty({ example: '2024-12-31' })
  endDate: string;
}

// ============================================================================
// REPORT 7: PREVENTIVE MAINTENANCE
// ============================================================================

/**
 * Upcoming preventive maintenance schedule
 */
export class UpcomingPreventiveMaintenanceDto {
  @ApiProperty({ example: 'MNT-0245' })
  maintenanceNumber: string;

  @ApiProperty({ example: 'Scheduled Oil Change' })
  title: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  assetId: string;

  @ApiProperty({ example: 'VEH-001' })
  assetNumber: string;

  @ApiProperty({ example: 'Ford Transit' })
  assetName: string;

  @ApiProperty({ enum: AssetType })
  assetType: AssetType;

  @ApiProperty({ example: '2024-12-25T10:00:00Z' })
  scheduledDate: Date;

  @ApiProperty({ example: 5 })
  daysUntilDue: number;

  @ApiProperty({ example: 3500 })
  estimatedCost: number;

  @ApiProperty({ enum: MaintenanceStatus })
  status: MaintenanceStatus;
}

/**
 * Overdue preventive maintenance
 */
export class OverduePreventiveMaintenanceDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  assetId: string;

  @ApiProperty({ example: 'VEH-008' })
  assetNumber: string;

  @ApiProperty({ example: 'Toyota Hilux' })
  assetName: string;

  @ApiProperty({ enum: AssetType })
  assetType: AssetType;

  @ApiProperty({ example: 'MNT-0198' })
  maintenanceNumber: string;

  @ApiProperty({ example: 'Scheduled Inspection' })
  title: string;

  @ApiProperty({ example: '2024-10-15T10:00:00Z' })
  scheduledDate: Date;

  @ApiProperty({ example: 35 })
  daysOverdue: number;

  @ApiProperty({ enum: MaintenancePriority })
  priority: MaintenancePriority;
}

/**
 * Asset without preventive maintenance schedule
 */
export class UnscheduledAssetDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  assetId: string;

  @ApiProperty({ example: 'EQP-025' })
  assetNumber: string;

  @ApiProperty({ example: 'Hydraulic Jack' })
  assetName: string;

  @ApiProperty({ enum: AssetType })
  assetType: AssetType;

  @ApiProperty({ example: '2023-08-10T00:00:00Z' })
  purchaseDate: Date;

  @ApiProperty({ example: 480 })
  daysSincePurchase: number;

  @ApiProperty({ example: 3 })
  correctiveMaintenanceCount: number;

  @ApiProperty({ example: 8500 })
  totalCorrectiveCost: number;
}

/**
 * Cost savings analysis from preventive maintenance
 */
export class CostSavingsAnalysisDto {
  @ApiProperty({ example: 85 })
  preventiveCount: number;

  @ApiProperty({ example: 180000 })
  preventiveCost: number;

  @ApiProperty({ example: 45 })
  correctiveCount: number;

  @ApiProperty({ example: 245000 })
  correctiveCost: number;

  @ApiProperty({ example: 2118 })
  avgPreventiveCost: number;

  @ApiProperty({ example: 5444 })
  avgCorrectiveCost: number;

  @ApiProperty({ example: 3326 })
  estimatedSavingsPerPreventive: number;

  @ApiProperty({ example: 282710 })
  totalEstimatedSavings: number;

  @ApiProperty({ example: 53.5 })
  preventiveToCorrectiveRatio: number; // percentage
}

/**
 * Response DTO for Preventive Maintenance Report
 */
export class PreventiveMaintenanceResponseDto {
  @ApiProperty({ example: 85 })
  totalPreventiveCount: number;

  @ApiProperty({ example: 65 })
  completedPreventiveCount: number;

  @ApiProperty({ example: 12 })
  upcomingCount: number;

  @ApiProperty({ example: 8 })
  overdueCount: number;

  @ApiProperty({ example: 76.5 })
  complianceRate: number; // percentage of on-time preventive maintenance

  @ApiProperty({ example: 180000 })
  totalPreventiveCost: number;

  @ApiPropertyOptional({ type: [UpcomingPreventiveMaintenanceDto] })
  upcomingSchedule?: UpcomingPreventiveMaintenanceDto[];

  @ApiPropertyOptional({ type: [OverduePreventiveMaintenanceDto] })
  overduePreventive?: OverduePreventiveMaintenanceDto[];

  @ApiPropertyOptional({ type: [UnscheduledAssetDto] })
  unscheduledAssets?: UnscheduledAssetDto[];

  @ApiPropertyOptional({ type: CostSavingsAnalysisDto })
  costSavings?: CostSavingsAnalysisDto;

  @ApiProperty({ example: '2024-01-01' })
  startDate: string;

  @ApiProperty({ example: '2024-12-31' })
  endDate: string;
}
