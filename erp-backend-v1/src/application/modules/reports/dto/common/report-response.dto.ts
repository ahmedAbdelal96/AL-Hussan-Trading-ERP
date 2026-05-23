/**
 * ============================================================================
 * COMMON REPORT RESPONSE DTO
 * ============================================================================
 *
 * استجابات مشتركة لجميع التقارير
 * توحيد شكل الاستجابة لسهولة التعامل في الفرونت إند
 *
 * @module ReportResponseDto
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * معلومات الـ Pagination في الاستجابة
 */
export class PaginationMeta {
  @ApiProperty({
    description: 'رقم الصفحة الحالية',
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    description: 'عدد العناصر في الصفحة',
    example: 10,
  })
  itemsPerPage: number;

  @ApiProperty({
    description: 'إجمالي العناصر',
    example: 100,
  })
  totalItems: number;

  @ApiProperty({
    description: 'إجمالي الصفحات',
    example: 10,
  })
  totalPages: number;

  @ApiProperty({
    description: 'هل يوجد صفحة تالية؟',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'هل يوجد صفحة سابقة؟',
    example: false,
  })
  hasPreviousPage: boolean;
}

/**
 * استجابة تقرير أساسية مع pagination
 */
export class PaginatedReportResponseDto<T> {
  @ApiProperty({
    description: 'البيانات',
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: 'معلومات الـ Pagination',
    type: PaginationMeta,
  })
  meta: PaginationMeta;

  @ApiProperty({
    description: 'وقت إنشاء التقرير',
    example: '2026-01-19T12:00:00.000Z',
  })
  generatedAt: Date;
}

/**
 * استجابة تقرير بسيطة بدون pagination
 */
export class SimpleReportResponseDto<T> {
  @ApiProperty({
    description: 'البيانات',
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: 'عدد العناصر',
    example: 25,
  })
  count: number;

  @ApiProperty({
    description: 'وقت إنشاء التقرير',
    example: '2026-01-19T12:00:00.000Z',
  })
  generatedAt: Date;
}

/**
 * إحصائيات ملخصة (Summary)
 * تستخدم في الـ Dashboard والتقارير الملخصة
 */
export class ReportSummaryDto {
  @ApiProperty({
    description: 'عنوان الإحصائية',
    example: 'إجمالي المصروفات',
  })
  title: string;

  @ApiProperty({
    description: 'القيمة',
    example: 150000,
  })
  value: number | string;

  @ApiPropertyOptional({
    description: 'الوصف',
    example: 'إجمالي المصروفات لهذا الشهر',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'التغيير عن الفترة السابقة',
    example: 15.5,
  })
  changePercentage?: number;

  @ApiPropertyOptional({
    description: 'الاتجاه (زيادة أم نقصان)',
    enum: ['up', 'down', 'neutral'],
    example: 'up',
  })
  trend?: 'up' | 'down' | 'neutral';
}

/**
 * نقطة بيانات في الرسم البياني
 * تستخدم في Charts (Line, Bar, Pie)
 */
export class ChartDataPointDto {
  @ApiProperty({
    description: 'التسمية (Label)',
    example: 'يناير 2026',
  })
  label: string;

  @ApiProperty({
    description: 'القيمة',
    example: 25000,
  })
  value: number;

  @ApiPropertyOptional({
    description: 'اللون (Hex)',
    example: '#3b82f6',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'النسبة المئوية',
    example: 25.5,
  })
  percentage?: number;

  @ApiPropertyOptional({
    description: 'بيانات إضافية',
    example: { count: 10, average: 2500 },
  })
  metadata?: Record<string, any>;
}

/**
 * بيانات الرسم البياني الكاملة
 */
export class ChartDataDto {
  @ApiProperty({
    description: 'عنوان الرسم البياني',
    example: 'المصروفات الشهرية',
  })
  title: string;

  @ApiProperty({
    description: 'نوع الرسم البياني',
    enum: ['line', 'bar', 'pie', 'area'],
    example: 'bar',
  })
  type: 'line' | 'bar' | 'pie' | 'area';

  @ApiProperty({
    description: 'نقاط البيانات',
    type: [ChartDataPointDto],
  })
  data: ChartDataPointDto[];

  @ApiPropertyOptional({
    description: 'الوصف',
    example: 'توزيع المصروفات على مدار السنة',
  })
  description?: string;
}

/**
 * استجابة تقرير شاملة
 * تحتوي على KPIs + Charts + Table Data
 */
export class ComprehensiveReportResponseDto<T> {
  @ApiProperty({
    description: 'ملخص الإحصائيات (KPIs)',
    type: [ReportSummaryDto],
  })
  summary: ReportSummaryDto[];

  @ApiProperty({
    description: 'الرسوم البيانية',
    type: [ChartDataDto],
  })
  charts: ChartDataDto[];

  @ApiProperty({
    description: 'بيانات الجدول التفصيلية',
    isArray: true,
  })
  details: T[];

  @ApiPropertyOptional({
    description: 'معلومات الـ Pagination (إن وجدت)',
    type: PaginationMeta,
  })
  meta?: PaginationMeta;

  @ApiProperty({
    description: 'وقت إنشاء التقرير',
    example: '2026-01-19T12:00:00.000Z',
  })
  generatedAt: Date;
}

/**
 * استجابة التصدير
 */
export class ExportResponseDto {
  @ApiProperty({
    description: 'رابط تحميل الملف',
    example: 'https://storage.example.com/reports/report-2026-01-19.xlsx',
  })
  downloadUrl: string;

  @ApiProperty({
    description: 'اسم الملف',
    example: 'financial_report_2026-01-19.xlsx',
  })
  filename: string;

  @ApiProperty({
    description: 'حجم الملف بالبايت',
    example: 15234,
  })
  fileSize: number;

  @ApiProperty({
    description: 'صيغة الملف',
    enum: ['excel', 'pdf', 'csv'],
    example: 'excel',
  })
  format: 'excel' | 'pdf' | 'csv';

  @ApiProperty({
    description: 'وقت الإنشاء',
    example: '2026-01-19T12:00:00.000Z',
  })
  generatedAt: Date;

  @ApiPropertyOptional({
    description: 'رابط الانتهاء (Expires at)',
    example: '2026-01-20T12:00:00.000Z',
  })
  expiresAt?: Date;
}

/**
 * قائمة التقارير المتاحة
 */
export class AvailableReportDto {
  @ApiProperty({
    description: 'معرف التقرير',
    example: 'finance-expenses-summary',
  })
  id: string;

  @ApiProperty({
    description: 'اسم التقرير',
    example: 'ملخص المصروفات',
  })
  name: string;

  @ApiProperty({
    description: 'الوصف',
    example: 'تقرير شامل لجميع المصروفات حسب الفئة والحالة',
  })
  description: string;

  @ApiProperty({
    description: 'الفئة',
    example: 'finance',
  })
  category: string;

  @ApiProperty({
    description: 'الصلاحية المطلوبة',
    example: 'report:finance',
  })
  permission: string;

  @ApiProperty({
    description: 'هل يدعم التصدير؟',
    example: true,
  })
  supportsExport: boolean;

  @ApiProperty({
    description: 'صيغ التصدير المدعومة',
    example: ['excel', 'pdf', 'csv'],
  })
  exportFormats: string[];
}

/**
 * قائمة فئات التقارير
 */
export class ReportCategoryDto {
  @ApiProperty({
    description: 'معرف الفئة',
    example: 'finance',
  })
  id: string;

  @ApiProperty({
    description: 'اسم الفئة',
    example: 'التقارير المالية',
  })
  name: string;

  @ApiProperty({
    description: 'الأيقونة',
    example: 'dollar-sign',
  })
  icon: string;

  @ApiProperty({
    description: 'عدد التقارير',
    example: 7,
  })
  reportsCount: number;

  @ApiProperty({
    description: 'الصلاحية المطلوبة',
    example: 'report:finance',
  })
  permission: string;
}
