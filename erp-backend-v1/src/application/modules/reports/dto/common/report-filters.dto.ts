/**
 * ============================================================================
 * COMMON REPORT FILTERS DTO
 * ============================================================================
 *
 * فلاتر مشتركة لجميع التقارير
 * يمكن استخدامها مباشرة أو توسيعها في كل موديول
 *
 * @module ReportFiltersDto
 * @version 1.0.0
 */

import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

const toInteger = (value: unknown, fallback: number): number => {
  const normalized =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN;

  return Number.isNaN(normalized) ? fallback : normalized;
};

/**
 * فلاتر التاريخ (Date Range)
 * يمكن استخدامها في أي تقرير يحتاج فلترة حسب التاريخ
 */
export class DateRangeFilterDto {
  @ApiPropertyOptional({
    description: 'تاريخ البداية (YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'تاريخ النهاية (YYYY-MM-DD)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * فلاتر التقارير الأساسية
 * تحتوي على الفلاتر المشتركة بين معظم التقارير
 */
export class BaseReportFiltersDto extends DateRangeFilterDto {
  @ApiPropertyOptional({
    description: 'معرف القسم',
    example: 'uuid-department-id',
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'معرف الموقع',
    example: 'uuid-site-id',
  })
  @IsOptional()
  @IsString()
  siteId?: string;

  @ApiPropertyOptional({
    description: 'الحالة',
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'الفئة',
    example: 'CATEGORY_NAME',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'معرف الموظف',
    example: 'uuid-employee-id',
  })
  @IsOptional()
  @IsString()
  employeeId?: string;
}

/**
 * فلاتر الـ Pagination
 * للتقارير التي تحتاج تقسيم النتائج إلى صفحات
 */
export class PaginationDto {
  @ApiPropertyOptional({
    description: 'رقم الصفحة (يبدأ من 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => toInteger(value, 1))
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'عدد العناصر في الصفحة',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => toInteger(value, 10))
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'حقل الترتيب',
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'اتجاه الترتيب',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * فلاتر التقارير مع Pagination
 * الفلاتر الكاملة للتقارير التي تحتاج pagination
 */
export class ReportFiltersDto extends BaseReportFiltersDto {
  @ApiPropertyOptional({
    description: 'رقم الصفحة (يبدأ من 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => toInteger(value, 1))
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'عدد العناصر في الصفحة',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => toInteger(value, 10))
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'حقل الترتيب',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'اتجاه الترتيب',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

/**
 * فلاتر التصدير
 * للتقارير التي تدعم التصدير إلى Excel/PDF
 */
export enum ExportFormat {
  EXCEL = 'excel',
  PDF = 'pdf',
  CSV = 'csv',
}

export class ExportFiltersDto extends BaseReportFiltersDto {
  @ApiPropertyOptional({
    description: 'صيغة التصدير',
    enum: ExportFormat,
    example: ExportFormat.EXCEL,
    default: ExportFormat.EXCEL,
  })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.EXCEL;

  @ApiPropertyOptional({
    description: 'اسم الملف (بدون الامتداد)',
    example: 'financial_report_2026',
  })
  @IsOptional()
  @IsString()
  filename?: string;
}
