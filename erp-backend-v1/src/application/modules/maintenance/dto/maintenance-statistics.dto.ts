/**
 * ============================================================================
 * MAINTENANCE STATISTICS DTOs
 * ============================================================================
 *
 * هذا الملف يحتوي على DTOs الخاصة بإحصائيات الصيانة
 *
 * المحتويات:
 * - MaintenanceStatisticsParams: معاملات الفلترة للإحصائيات
 * - MaintenanceStatisticsDto: الإحصائيات الكاملة
 * - Status/Type/Priority/AssetType Breakdowns
 * - Monthly Trend Analysis
 * - Top Assets by Maintenance
 * - Cost Analysis
 * - Resolution Time Metrics
 *
 * @module MaintenanceStatistics
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';

// ============================================================================
// ENUMS
// ============================================================================

export enum MaintenanceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MaintenanceType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  EMERGENCY = 'EMERGENCY',
  SCHEDULED = 'SCHEDULED',
}

export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AssetType {
  VEHICLE = 'VEHICLE',
  EQUIPMENT = 'EQUIPMENT',
  MACHINERY = 'MACHINERY',
  TOOL = 'TOOL',
  FURNITURE = 'FURNITURE',
  COMPUTER = 'COMPUTER',
  SOFTWARE = 'SOFTWARE',
  OTHER = 'OTHER',
}

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

/**
 * معاملات الفلترة لإحصائيات الصيانة
 * تسمح بتصفية البيانات حسب الفترة الزمنية والمشاريع والأصول
 */
export class MaintenanceStatisticsParams {
  @ApiPropertyOptional({
    description: 'تاريخ البداية للفترة الزمنية (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'تاريخ النهاية للفترة الزمنية (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'معرف المشروع للتصفية',
    example: 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'معرف الأصل للتصفية',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @ApiPropertyOptional({
    description: 'الحالة للتصفية',
    enum: MaintenanceStatus,
    example: MaintenanceStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @ApiPropertyOptional({
    description: 'النوع للتصفية',
    enum: MaintenanceType,
    example: MaintenanceType.PREVENTIVE,
  })
  @IsOptional()
  @IsEnum(MaintenanceType)
  type?: MaintenanceType;

  @ApiPropertyOptional({
    description: 'الأولوية للتصفية',
    enum: MaintenancePriority,
    example: MaintenancePriority.HIGH,
  })
  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;
}

// ============================================================================
// BREAKDOWN DTOs
// ============================================================================

/**
 * التوزيع حسب الحالة
 */
export class StatusBreakdownDto {
  @ApiProperty({
    description: 'الحالة',
    enum: MaintenanceStatus,
    example: MaintenanceStatus.COMPLETED,
  })
  status: MaintenanceStatus;

  @ApiProperty({
    description: 'عدد الطلبات',
    example: 45,
  })
  count: number;

  @ApiProperty({
    description: 'النسبة المئوية',
    example: 35.5,
  })
  percentage: number;

  @ApiProperty({
    description: 'إجمالي التكلفة',
    example: 125000.5,
  })
  totalCost: number;

  @ApiProperty({
    description: 'متوسط التكلفة',
    example: 2777.78,
  })
  averageCost: number;
}

/**
 * التوزيع حسب النوع
 */
export class TypeBreakdownDto {
  @ApiProperty({
    description: 'نوع الصيانة',
    enum: MaintenanceType,
    example: MaintenanceType.PREVENTIVE,
  })
  maintenanceType: MaintenanceType;

  @ApiProperty({
    description: 'عدد الطلبات',
    example: 32,
  })
  count: number;

  @ApiProperty({
    description: 'النسبة المئوية',
    example: 25.2,
  })
  percentage: number;

  @ApiProperty({
    description: 'إجمالي التكلفة',
    example: 85000,
  })
  totalCost: number;

  @ApiProperty({
    description: 'متوسط وقت الإصلاح (بالأيام)',
    example: 3.5,
  })
  averageResolutionDays: number;
}

/**
 * التوزيع حسب الأولوية
 */
export class PriorityBreakdownDto {
  @ApiProperty({
    description: 'مستوى الأولوية',
    enum: MaintenancePriority,
    example: MaintenancePriority.HIGH,
  })
  priority: MaintenancePriority;

  @ApiProperty({
    description: 'عدد الطلبات',
    example: 18,
  })
  count: number;

  @ApiProperty({
    description: 'النسبة المئوية',
    example: 14.2,
  })
  percentage: number;

  @ApiProperty({
    description: 'عدد الطلبات المكتملة',
    example: 15,
  })
  completedCount: number;

  @ApiProperty({
    description: 'معدل الإنجاز',
    example: 83.33,
  })
  completionRate: number;
}

/**
 * التوزيع حسب نوع الأصل
 */
export class AssetTypeBreakdownDto {
  @ApiProperty({
    description: 'نوع الأصل',
    enum: AssetType,
    example: AssetType.VEHICLE,
  })
  assetType: AssetType;

  @ApiProperty({
    description: 'عدد طلبات الصيانة',
    example: 28,
  })
  maintenanceCount: number;

  @ApiProperty({
    description: 'عدد الأصول المتأثرة',
    example: 12,
  })
  affectedAssets: number;

  @ApiProperty({
    description: 'النسبة المئوية',
    example: 22.0,
  })
  percentage: number;

  @ApiProperty({
    description: 'إجمالي التكلفة',
    example: 95000,
  })
  totalCost: number;
}

/**
 * الاتجاه الشهري
 */
export class MonthlyTrendDto {
  @ApiProperty({
    description: 'الشهر (YYYY-MM)',
    example: '2024-03',
  })
  month: string;

  @ApiProperty({
    description: 'الطلبات الجديدة',
    example: 15,
  })
  newRequests: number;

  @ApiProperty({
    description: 'الطلبات المكتملة',
    example: 12,
  })
  completedRequests: number;

  @ApiProperty({
    description: 'الطلبات الملغاة',
    example: 2,
  })
  cancelledRequests: number;

  @ApiProperty({
    description: 'إجمالي التكلفة',
    example: 45000,
  })
  totalCost: number;

  @ApiProperty({
    description: 'متوسط وقت الإصلاح (بالأيام)',
    example: 4.2,
  })
  averageResolutionDays: number;

  @ApiProperty({
    description: 'إجمالي الطلبات النشطة في نهاية الشهر',
    example: 18,
  })
  totalActiveRequests: number;
}

/**
 * الأصول الأكثر صيانة
 */
export class TopAssetDto {
  @ApiProperty({
    description: 'معرف الأصل',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  assetId: string;

  @ApiProperty({
    description: 'اسم الأصل',
    example: 'تويوتا لاندكروزر - ABC-1234',
  })
  assetName: string;

  @ApiProperty({
    description: 'رقم الأصل',
    example: 'AST-0001',
  })
  assetNumber: string;

  @ApiProperty({
    description: 'نوع الأصل',
    enum: AssetType,
    example: AssetType.VEHICLE,
  })
  assetType: AssetType;

  @ApiProperty({
    description: 'عدد طلبات الصيانة',
    example: 8,
  })
  maintenanceCount: number;

  @ApiProperty({
    description: 'إجمالي التكلفة',
    example: 35000,
  })
  totalCost: number;

  @ApiProperty({
    description: 'متوسط وقت الإصلاح (بالأيام)',
    example: 5.2,
  })
  averageResolutionDays: number;

  @ApiProperty({
    description: 'آخر صيانة',
    example: '2024-03-15T10:30:00Z',
  })
  lastMaintenanceDate: Date;
}

/**
 * توزيع التكلفة حسب النوع
 */
export class CostByTypeDto {
  @ApiProperty({
    description: 'نوع الصيانة',
    enum: MaintenanceType,
    example: MaintenanceType.CORRECTIVE,
  })
  maintenanceType: MaintenanceType;

  @ApiProperty({
    description: 'إجمالي التكلفة',
    example: 125000,
  })
  totalCost: number;

  @ApiProperty({
    description: 'النسبة المئوية من إجمالي التكاليف',
    example: 42.5,
  })
  percentage: number;

  @ApiProperty({
    description: 'متوسط التكلفة لكل طلب',
    example: 3906.25,
  })
  averageCost: number;

  @ApiProperty({
    description: 'عدد الطلبات',
    example: 32,
  })
  requestCount: number;
}

/**
 * متوسط وقت الإصلاح حسب الحالة
 */
export class ResolutionTimeDto {
  @ApiProperty({
    description: 'الحالة',
    enum: MaintenanceStatus,
    example: MaintenanceStatus.COMPLETED,
  })
  status: MaintenanceStatus;

  @ApiProperty({
    description: 'متوسط وقت الإصلاح (بالأيام)',
    example: 4.5,
  })
  averageDays: number;

  @ApiProperty({
    description: 'الحد الأدنى (بالأيام)',
    example: 1.0,
  })
  minDays: number;

  @ApiProperty({
    description: 'الحد الأقصى (بالأيام)',
    example: 15.0,
  })
  maxDays: number;

  @ApiProperty({
    description: 'عدد الطلبات',
    example: 45,
  })
  requestCount: number;
}

// ============================================================================
// MAIN STATISTICS DTO
// ============================================================================

/**
 * إحصائيات الصيانة الشاملة
 * تحتوي على جميع المقاييس والتحليلات الرئيسية
 * Simplified version: 8 KPIs instead of 12
 */
export class MaintenanceStatisticsDto {
  // ============================================================================
  // OVERVIEW METRICS (8 KPIs)
  // ============================================================================

  @ApiProperty({
    description: 'إجمالي طلبات الصيانة',
    example: 127,
  })
  totalRequests: number;

  @ApiProperty({
    description: 'الطلبات المعلقة',
    example: 15,
  })
  pendingRequests: number;

  @ApiProperty({
    description: 'الطلبات قيد التنفيذ',
    example: 8,
  })
  inProgressRequests: number;

  @ApiProperty({
    description: 'الطلبات المكتملة',
    example: 95,
  })
  completedRequests: number;

  @ApiProperty({
    description: 'معدل الإنجاز (%)',
    example: 74.8,
  })
  completionRate: number;

  @ApiProperty({
    description: 'متوسط وقت الإصلاح (بالأيام)',
    example: 4.5,
  })
  averageResolutionDays: number;

  @ApiProperty({
    description: 'إجمالي التكلفة',
    example: 456789.5,
  })
  totalCost: number;

  @ApiProperty({
    description: 'طلبات الأولوية العالية والحرجة',
    example: 22,
  })
  highPriorityRequests: number;

  // ============================================================================
  // BREAKDOWNS (5 التحليلات)
  // ============================================================================

  @ApiProperty({
    description: 'التوزيع حسب الحالة',
    type: [StatusBreakdownDto],
  })
  statusBreakdown: StatusBreakdownDto[];

  @ApiProperty({
    description: 'التوزيع حسب النوع',
    type: [TypeBreakdownDto],
  })
  typeBreakdown: TypeBreakdownDto[];

  @ApiProperty({
    description: 'التوزيع حسب الأولوية',
    type: [PriorityBreakdownDto],
  })
  priorityBreakdown: PriorityBreakdownDto[];

  @ApiProperty({
    description: 'الاتجاه الشهري (آخر 12 شهر)',
    type: [MonthlyTrendDto],
  })
  monthlyTrend: MonthlyTrendDto[];

  @ApiProperty({
    description: 'توزيع التكلفة حسب النوع',
    type: [CostByTypeDto],
  })
  costByType: CostByTypeDto[];

  // ============================================================================
  // METADATA
  // ============================================================================

  @ApiProperty({
    description: 'تاريخ إنشاء الإحصائيات',
    example: '2024-03-20T10:30:00Z',
  })
  generatedAt: Date;
}
