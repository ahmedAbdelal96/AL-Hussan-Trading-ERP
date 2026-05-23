/**
 * ============================================================================
 * ASSETS REPORTS - TypeScript Types
 * ============================================================================
 * Mirrors the backend AssetsReports DTOs exactly.
 *
 * @module AssetsReportTypes
 */

export type AssetType =
  | "VEHICLE"
  | "EQUIPMENT"
  | "MACHINERY"
  | "TOOL"
  | "COMPUTER"
  | "FURNITURE"
  | "OTHER";

export type AssetStatus =
  | "AVAILABLE"
  | "IN_USE"
  | "UNDER_MAINTENANCE"
  | "OUT_OF_SERVICE"
  | "RETIRED";

export interface BaseAssetFilters {
  startDate?: string;
  endDate?: string;
  assetType?: AssetType;
  status?: AssetStatus;
  location?: string;
  category?: string;
  manufacturer?: string;
}

export interface AssetsOverviewFilters extends BaseAssetFilters {
  includeComparison?: boolean;
  includeWarrantyStatus?: boolean;
}
export interface AssetsByTypeFilters extends BaseAssetFilters {
  minAssets?: number;
  includeManufacturers?: boolean;
  sortBy?: "assetCount" | "totalValue" | "assetType";
  sortOrder?: "asc" | "desc";
}
export interface AssetsByStatusFilters extends BaseAssetFilters {
  includeTransitions?: boolean;
  includeAlerts?: boolean;
  sortBy?: "assetCount" | "totalValue" | "status";
  sortOrder?: "asc" | "desc";
}
export interface AssetsByLocationFilters extends BaseAssetFilters {
  minAssets?: number;
  includeUtilization?: boolean;
  sortBy?: "assetCount" | "totalValue" | "location" | "utilizationRate";
  sortOrder?: "asc" | "desc";
}
export interface DepreciationAnalysisFilters extends BaseAssetFilters {
  minValue?: number;
  maxValue?: number;
  depreciationRate?: number;
  includeTopAssets?: boolean;
}
export interface UtilizationReportFilters extends BaseAssetFilters {
  minUtilization?: number;
  maxUtilization?: number;
  includeOperations?: boolean;
  includeIdleAssets?: boolean;
  sortBy?: "utilizationRate" | "assetCount" | "totalHours";
  sortOrder?: "asc" | "desc";
}

export interface PeriodComparison {
  totalAssets: number;
  totalValue: number;
  assetChange: number;
  valueChange: number;
  assetChangePercentage: number;
  valueChangePercentage: number;
}
export interface WarrantyStatus {
  activeWarranty: number;
  expiredWarranty: number;
  expiringSoon: number;
  noWarranty: number;
}
export interface AssetsOverviewResponse {
  totalAssets: number;
  totalValue: number;
  averageValue: number;
  availableAssets: number;
  assetsInUse: number;
  assetsUnderMaintenance: number;
  assetsOutOfService: number;
  retiredAssets: number;
  newAcquisitions: number;
  newAcquisitionsValue: number;
  assetsRetiredThisPeriod: number;
  utilizationRate: number;
  maintenanceRate: number;
  availabilityRate: number;
  totalDepreciation: number;
  comparison?: PeriodComparison;
  warrantyStatus?: WarrantyStatus;
}

export interface StatusDistribution {
  status: AssetStatus;
  count: number;
  percentage: number;
}
export interface TopManufacturer {
  manufacturer: string;
  count: number;
  totalValue: number;
}
export interface AssetTypeBreakdown {
  assetType: AssetType;
  assetCount: number;
  totalValue: number;
  percentage: number;
  averageValue: number;
  averageAge: number;
  statusDistribution: StatusDistribution[];
  topManufacturers?: TopManufacturer[];
}
export interface AssetsByTypeResponse {
  breakdown: AssetTypeBreakdown[];
  totalAssets: number;
  totalValue: number;
  mostCommonType: AssetType;
  highestValueType: AssetType;
}

export interface StatusTransition {
  fromStatus: AssetStatus;
  toStatus: AssetStatus;
  count: number;
  lastTransition: string;
}
export interface AssetAlert {
  assetId: string;
  assetNumber: string;
  name: string;
  status: AssetStatus;
  alertReason: string;
  daysInStatus: number;
}
export interface AssetStatusBreakdown {
  status: AssetStatus;
  assetCount: number;
  totalValue: number;
  percentage: number;
  averageAge: number;
  averageDaysInStatus: number;
}
export interface AssetsByStatusResponse {
  breakdown: AssetStatusBreakdown[];
  totalAssets: number;
  totalValue: number;
  transitions?: StatusTransition[];
  alerts?: AssetAlert[];
  operationalEfficiency: number;
}

export interface LocationTypeDistribution {
  assetType: AssetType;
  count: number;
  percentage: number;
}
export interface LocationBreakdown {
  location: string;
  assetCount: number;
  totalValue: number;
  percentage: number;
  typeDistribution: LocationTypeDistribution[];
  utilizationRate?: number;
  availableAssets: number;
  assetsInUse: number;
}
export interface AssetsByLocationResponse {
  breakdown: LocationBreakdown[];
  totalLocations: number;
  totalAssets: number;
  totalValue: number;
  topLocation: string;
  highestValueLocation: string;
  averageAssetsPerLocation: number;
}

export interface AgeGroupBreakdown {
  ageGroup: string;
  assetCount: number;
  purchaseValue: number;
  currentValue: number;
  totalDepreciation: number;
  depreciationPercentage: number;
}
export interface TypeDepreciation {
  assetType: AssetType;
  assetCount: number;
  purchaseValue: number;
  currentValue: number;
  totalDepreciation: number;
  depreciationPercentage: number;
  averageAge: number;
}
export interface HighValueAsset {
  assetId: string;
  assetNumber: string;
  name: string;
  assetType: AssetType;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  totalDepreciation: number;
  age: number;
}
export interface DepreciationAnalysisResponse {
  totalPurchaseValue: number;
  totalCurrentValue: number;
  totalDepreciation: number;
  averageDepreciationPercentage: number;
  byType: TypeDepreciation[];
  byAgeGroup: AgeGroupBreakdown[];
  highValueAssets?: HighValueAsset[];
  depreciationRate: number;
  totalAssets: number;
}

export interface AssetOperationSummary {
  assetId: string;
  assetNumber: string;
  name: string;
  assetType: AssetType;
  totalHours: number;
  operationCount: number;
  totalFuelConsumption?: number;
  totalDistance?: number;
  utilizationRate: number;
  lastOperation: string;
}
export interface TypeUtilization {
  assetType: AssetType;
  assetCount: number;
  averageUtilization: number;
  totalHours: number;
  highUtilization: number;
  lowUtilization: number;
  idleAssets: number;
}
export interface IdleAsset {
  assetId: string;
  assetNumber: string;
  name: string;
  assetType: AssetType;
  status: AssetStatus;
  daysIdle: number;
  lastOperation: string | null;
  location: string;
}
export interface UtilizationReportResponse {
  overallUtilization: number;
  totalOperationHours: number;
  totalAssets: number;
  highUtilizationCount: number;
  lowUtilizationCount: number;
  idleAssetsCount: number;
  byType: TypeUtilization[];
  mostUtilized?: AssetOperationSummary[];
  leastUtilized?: AssetOperationSummary[];
  idleAssets?: IdleAsset[];
  totalFuelConsumption?: number;
  totalDistance?: number;
}
