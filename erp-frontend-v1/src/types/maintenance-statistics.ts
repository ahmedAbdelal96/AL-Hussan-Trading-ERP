/**
 * ============================================================================
 * MAINTENANCE STATISTICS TYPES
 * ============================================================================
 *
 * TypeScript types and interfaces for Maintenance Statistics
 *
 * @module MaintenanceStatisticsTypes
 * @version 1.0.0
 */

// ============================================================================
// ENUMS WITH BILINGUAL LABELS
// ============================================================================

export enum MaintenanceStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum MaintenanceType {
  PREVENTIVE = "PREVENTIVE",
  CORRECTIVE = "CORRECTIVE",
  EMERGENCY = "EMERGENCY",
  SCHEDULED = "SCHEDULED",
}

export enum MaintenancePriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum AssetType {
  VEHICLE = "VEHICLE",
  EQUIPMENT = "EQUIPMENT",
  MACHINERY = "MACHINERY",
  TOOL = "TOOL",
  COMPUTER = "COMPUTER",
  FURNITURE = "FURNITURE",
  OTHER = "OTHER",
}

// ============================================================================
// BILINGUAL LABELS
// ============================================================================

export const MAINTENANCE_STATUS_LABELS: Record<
  MaintenanceStatus,
  { ar: string; en: string }
> = {
  [MaintenanceStatus.PENDING]: { ar: "معلق", en: "Pending" },
  [MaintenanceStatus.IN_PROGRESS]: { ar: "قيد التنفيذ", en: "In Progress" },
  [MaintenanceStatus.ON_HOLD]: { ar: "معلق مؤقتاً", en: "On Hold" },
  [MaintenanceStatus.COMPLETED]: { ar: "مكتمل", en: "Completed" },
  [MaintenanceStatus.CANCELLED]: { ar: "ملغي", en: "Cancelled" },
};

export const MAINTENANCE_TYPE_LABELS: Record<
  MaintenanceType,
  { ar: string; en: string }
> = {
  [MaintenanceType.PREVENTIVE]: { ar: "صيانة وقائية", en: "Preventive" },
  [MaintenanceType.CORRECTIVE]: { ar: "صيانة تصحيحية", en: "Corrective" },
  [MaintenanceType.EMERGENCY]: { ar: "صيانة طارئة", en: "Emergency" },
  [MaintenanceType.SCHEDULED]: { ar: "صيانة مجدولة", en: "Scheduled" },
};

export const MAINTENANCE_PRIORITY_LABELS: Record<
  MaintenancePriority,
  { ar: string; en: string }
> = {
  [MaintenancePriority.LOW]: { ar: "منخفض", en: "Low" },
  [MaintenancePriority.MEDIUM]: { ar: "متوسط", en: "Medium" },
  [MaintenancePriority.HIGH]: { ar: "عالي", en: "High" },
  [MaintenancePriority.CRITICAL]: { ar: "حرج", en: "Critical" },
};

export const ASSET_TYPE_LABELS: Record<AssetType, { ar: string; en: string }> =
  {
    [AssetType.VEHICLE]: { ar: "مركبة", en: "Vehicle" },
    [AssetType.EQUIPMENT]: { ar: "معدات", en: "Equipment" },
    [AssetType.MACHINERY]: { ar: "آلات", en: "Machinery" },
    [AssetType.TOOL]: { ar: "أدوات", en: "Tools" },
    [AssetType.COMPUTER]: { ar: "حواسيب", en: "Computers" },
    [AssetType.FURNITURE]: { ar: "أثاث", en: "Furniture" },
    [AssetType.OTHER]: { ar: "أخرى", en: "Other" },
  };

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

export interface MaintenanceStatisticsParams {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  assetId?: string;
  status?: MaintenanceStatus;
  type?: MaintenanceType;
  priority?: MaintenancePriority;
}

// ============================================================================
// BREAKDOWN INTERFACES
// ============================================================================

/**
 * Status Breakdown
 */
export interface StatusBreakdown {
  status: MaintenanceStatus;
  count: number;
  percentage: number;
  totalCost: number;
  averageCost: number;
}

/**
 * Type Breakdown
 */
export interface TypeBreakdown {
  maintenanceType: MaintenanceType;
  count: number;
  percentage: number;
  totalCost: number;
  averageResolutionDays: number;
}

/**
 * Priority Breakdown
 */
export interface PriorityBreakdown {
  priority: MaintenancePriority;
  count: number;
  percentage: number;
  completedCount: number;
  completionRate: number;
}

/**
 * Asset Type Breakdown
 */
export interface AssetTypeBreakdown {
  assetType: AssetType;
  maintenanceCount: number;
  affectedAssets: number;
  percentage: number;
  totalCost: number;
}

/**
 * Monthly Trend
 */
export interface MonthlyTrend {
  month: string; // YYYY-MM format
  newRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  totalCost: number;
  averageResolutionDays: number;
  totalActiveRequests: number;
}

/**
 * Top Assets by Maintenance
 */
export interface TopAsset {
  assetId: string;
  assetName: string;
  assetNumber: string;
  assetType: AssetType;
  maintenanceCount: number;
  totalCost: number;
  averageResolutionDays: number;
  lastMaintenanceDate: Date;
}

/**
 * Cost by Type
 */
export interface CostByType {
  maintenanceType: MaintenanceType;
  totalCost: number;
  percentage: number;
  averageCost: number;
  requestCount: number;
}

/**
 * Resolution Time by Status
 */
export interface ResolutionTime {
  status: MaintenanceStatus;
  averageDays: number;
  minDays: number;
  maxDays: number;
  requestCount: number;
}

// ============================================================================
// MAIN STATISTICS INTERFACE
// ============================================================================

/**
 * Complete Maintenance Statistics
 * Simplified version: 8 KPIs + 5 Charts
 */
export interface MaintenanceStatistics {
  // Overview Metrics (8 KPIs)
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  completionRate: number;
  averageResolutionDays: number;
  totalCost: number;
  highPriorityRequests: number;

  // Breakdowns (5 Charts)
  statusBreakdown: StatusBreakdown[];
  typeBreakdown: TypeBreakdown[];
  priorityBreakdown: PriorityBreakdown[];
  monthlyTrend: MonthlyTrend[];
  costByType: CostByType[];

  // Metadata
  generatedAt: Date;
}

// ============================================================================
// CHART DATA TYPES
// ============================================================================

/**
 * Generic chart data point
 */
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

/**
 * Line chart configuration
 */
export interface LineConfig {
  key: string;
  name: string;
  color: string;
}
