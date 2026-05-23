/**
 * ============================================================================
 * ASSETS STATISTICS TYPES
 * ============================================================================
 *
 * TypeScript type definitions for asset analytics and reporting.
 * Mirrors backend DTOs for type safety across the full stack.
 *
 * Features:
 * - Complete type coverage for all asset metrics
 * - Bilingual label mappings (Arabic/English)
 * - Enum types matching Prisma schema
 * - Reusable across dashboard components
 *
 * @module AssetsStatisticsTypes
 * @version 1.0.0
 */

// ============================================================================
// ENUMS - Asset Classification Types
// ============================================================================

/**
 * Asset Type Classification
 * Defines the primary category of each asset
 */
export type AssetType =
  | "VEHICLE"
  | "EQUIPMENT"
  | "MACHINERY"
  | "TOOL"
  | "COMPUTER"
  | "FURNITURE"
  | "OTHER";

/**
 * Asset Operational Status
 * Current state of asset in the inventory system
 */
export type AssetStatus =
  | "AVAILABLE"
  | "IN_USE"
  | "UNDER_MAINTENANCE"
  | "OUT_OF_SERVICE"
  | "RETIRED";

// ============================================================================
// BREAKDOWN INTERFACES - Granular Analytics
// ============================================================================

/**
 * Asset Type Distribution
 * Shows how assets are distributed across different types
 */
export interface AssetTypeBreakdown {
  assetType: AssetType;
  assetCount: number;
  totalValue: number;
  percentage: number;
}

/**
 * Asset Status Distribution
 * Current operational status of assets
 */
export interface AssetStatusBreakdown {
  status: AssetStatus;
  assetCount: number;
  totalValue: number;
  percentage: number;
}

/**
 * Asset Category Distribution
 * Custom categories for more specific classification
 */
export interface AssetCategoryBreakdown {
  category: string;
  assetCount: number;
  totalValue: number;
  percentage: number;
  inUseCount: number;
}

/**
 * Asset Location Distribution
 * Geographic or site-based distribution
 */
export interface AssetLocationBreakdown {
  location: string;
  assetCount: number;
  totalValue: number;
  percentage: number;
}

/**
 * Asset Age Group Distribution
 * Age-based segmentation for depreciation tracking
 */
export interface AssetAgeGroupBreakdown {
  ageGroup: string;
  assetCount: number;
  totalValue: number;
  percentage: number;
  averageAge: number;
}

/**
 * Asset Value Range Distribution
 * Price-based segmentation
 */
export interface AssetValueRangeBreakdown {
  valueRange: string;
  assetCount: number;
  totalValue: number;
  percentage: number;
}

/**
 * Asset Manufacturer Distribution
 * Brand/manufacturer analytics
 */
export interface AssetManufacturerBreakdown {
  manufacturer: string;
  assetCount: number;
  totalValue: number;
  percentage: number;
}

/**
 * Monthly Asset Trend
 * Time-series data for acquisition and disposal tracking
 */
export interface MonthlyAssetTrend {
  month: string; // YYYY-MM format
  assetsPurchased: number;
  totalPurchaseCost: number;
  assetsRetired: number;
  netChange: number;
  totalActiveAssets: number;
}

// ============================================================================
// MAIN STATISTICS INTERFACE
// ============================================================================

/**
 * Complete Assets Statistics Response
 * Aggregates all metrics and breakdowns for dashboard rendering
 */
export interface AssetsStatistics {
  // Overview Metrics (14 KPIs)
  totalAssets: number;
  totalValue: number;
  availableAssets: number;
  inUseAssets: number;
  underMaintenanceAssets: number;
  outOfServiceAssets: number;
  newAssetsLast30Days: number;
  retiredAssetsLast30Days: number;
  utilizationRate: number;
  averageAge: number;
  expiredWarrantyCount: number;
  totalMaintenanceRequests: number;
  averageAssetValue: number;
  highValueAssetsCount: number;

  // Detailed Breakdowns (8 categories)
  assetTypeBreakdown: AssetTypeBreakdown[];
  statusBreakdown: AssetStatusBreakdown[];
  categoryBreakdown: AssetCategoryBreakdown[];
  locationBreakdown: AssetLocationBreakdown[];
  ageGroupBreakdown: AssetAgeGroupBreakdown[];
  valueRangeBreakdown: AssetValueRangeBreakdown[];
  manufacturerBreakdown: AssetManufacturerBreakdown[];
  monthlyTrend: MonthlyAssetTrend[];

  // Metadata
  generatedAt: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Query Parameters for Filtering Statistics
 * Optional filters for narrowing analysis scope
 */
export interface AssetsStatisticsParams {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  assetType?: AssetType;
  status?: AssetStatus;
  location?: string;
}

// ============================================================================
// LABEL MAPPINGS - Bilingual Support (AR/EN)
// ============================================================================

/**
 * Asset Type Labels
 * Human-readable labels for asset types in both languages
 */
export const ASSET_TYPE_LABELS: Record<AssetType, { en: string; ar: string }> =
  {
    VEHICLE: { en: "Vehicle", ar: "مركبة" },
    EQUIPMENT: { en: "Equipment", ar: "معدات" },
    MACHINERY: { en: "Machinery", ar: "آلات" },
    TOOL: { en: "Tool", ar: "أداة" },
    COMPUTER: { en: "Computer", ar: "حاسوب" },
    FURNITURE: { en: "Furniture", ar: "أثاث" },
    OTHER: { en: "Other", ar: "أخرى" },
  };

/**
 * Asset Status Labels
 * Human-readable labels for asset statuses in both languages
 */
export const ASSET_STATUS_LABELS: Record<
  AssetStatus,
  { en: string; ar: string }
> = {
  AVAILABLE: { en: "Available", ar: "متاح" },
  IN_USE: { en: "In Use", ar: "قيد الاستخدام" },
  UNDER_MAINTENANCE: { en: "Under Maintenance", ar: "تحت الصيانة" },
  OUT_OF_SERVICE: { en: "Out of Service", ar: "خارج الخدمة" },
  RETIRED: { en: "Retired", ar: "متقاعد" },
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Chart Data Point (Generic)
 * Reusable type for chart rendering
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  percentage?: number;
  color?: string;
}

/**
 * KPI Metric
 * Reusable type for KPI cards
 */
export interface KPIMetric {
  value: number | string;
  label: string;
  description?: string;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  format?: "number" | "currency" | "percentage";
}
