/**
 * Response DTOs for Maintenance Deep-Dive Reports (Part 3)
 *
 * Report 8: MTBF/MTTR Per Asset
 * Report 9: Maintenance Cost Per Asset
 * Report 10: Maintenance Budget vs. Actual
 */
import { PaginationMeta } from '../../dto/common/report-response.dto';

// ─────────────────────────────────────────────────────────────────────────────
// Report 8: MTBF/MTTR Per Asset
// ─────────────────────────────────────────────────────────────────────────────

export class AssetMtbfMttrItemDto {
  assetId: string;
  assetNumber: string;
  assetName: string;
  assetType: string;
  /** Total maintenance requests for this asset (all statuses) */
  totalMaintenanceCount: number;
  /** COMPLETED requests used for MTBF/MTTR calculation */
  completedCount: number;
  /** Mean Time To Repair in days (0 if no eligible completed requests) */
  mttr: number;
  /** Mean Time Between Failures in days (0 if < 2 completed requests) */
  mtbf: number;
  /** ISO date of first maintenance request */
  firstMaintenanceDate?: string;
  /** ISO date of most recent completed maintenance */
  lastMaintenanceDate?: string;
  /**
   * Composite reliability score 0-100.
   * High MTBF + Low MTTR = higher score.
   * Formula: clamp(mtbf / (mtbf + mttr) * 100, 0, 100)
   * Returns 0 if mtbf = 0.
   */
  reliabilityScore: number;
}

export class MtbfMttrSummaryDto {
  totalAssets: number;
  /** Avg MTTR across all assets with at least 1 completed request (days) */
  avgMttr: number;
  /** Avg MTBF across all assets with at least 2 completed requests (days) */
  avgMtbf: number;
  avgReliabilityScore: number;
}

export class MaintenanceMtbfMttrResponseDto {
  assets: AssetMtbfMttrItemDto[];
  summary: MtbfMttrSummaryDto;
  meta?: PaginationMeta;
  generatedAt: string;
  startDate?: string;
  endDate?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Report 9: Maintenance Cost Per Asset
// ─────────────────────────────────────────────────────────────────────────────

export class AssetCostByTypeDto {
  maintenanceType: string;
  requestCount: number;
  estimatedCost: number;
  actualCost: number;
}

export class AssetCostItemDto {
  assetId: string;
  assetNumber: string;
  assetName: string;
  assetType: string;
  requestCount: number;
  totalEstimated: number;
  totalActual: number;
  /** estimated - actual (+= under budget) */
  costVariance: number;
  /** (variance / estimated) * 100, null if estimated = 0 */
  variancePercentage: number | null;
  avgCostPerRequest: number;
  /** Asset purchase price (null if not set on the asset) */
  purchasePrice?: number | null;
  /** (totalActual / purchasePrice) * 100 — null if purchasePrice is null/0 */
  costToValueRatio?: number | null;
  /** Per-type breakdown (only when includeTypeBreakdown = true) */
  costByType?: AssetCostByTypeDto[];
}

export class CostPerAssetSummaryDto {
  totalAssets: number;
  grandTotalActual: number;
  grandTotalEstimated: number;
  totalVariance: number;
  avgCostPerAsset: number;
  mostExpensiveAssetName?: string;
}

export class MaintenanceCostPerAssetResponseDto {
  assets: AssetCostItemDto[];
  summary: CostPerAssetSummaryDto;
  meta?: PaginationMeta;
  currency: string;
  generatedAt: string;
  startDate?: string;
  endDate?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Report 10: Maintenance Budget vs. Actual
// ─────────────────────────────────────────────────────────────────────────────

export class BudgetPeriodItemDto {
  /** "2026-01" | "VEHICLE" | "PREVENTIVE" depending on groupBy */
  period: string;
  requestCount: number;
  /** Sum of estimatedCost (budget) */
  estimatedCost: number;
  /** Sum of actualCost (actual spend) */
  actualCost: number;
  /** estimated - actual (+= under budget) */
  variance: number;
  /** (variance / estimated) * 100; null if estimated = 0 */
  variancePercentage: number | null;
  budgetStatus: 'UNDER_BUDGET' | 'ON_BUDGET' | 'OVER_BUDGET';
}

export class BudgetActualSummaryDto {
  totalRequests: number;
  totalEstimated: number;
  totalActual: number;
  totalVariance: number;
  /** (totalVariance / totalEstimated) * 100; null if estimated = 0 */
  variancePercentage: number | null;
  overBudgetCount: number;
  underBudgetCount: number;
  onBudgetCount: number;
}

export class MaintenanceBudgetActualResponseDto {
  items: BudgetPeriodItemDto[];
  summary: BudgetActualSummaryDto;
  meta?: PaginationMeta;
  groupBy: 'month' | 'assetType' | 'maintenanceType';
  currency: string;
  generatedAt: string;
  startDate?: string;
  endDate?: string;
}
