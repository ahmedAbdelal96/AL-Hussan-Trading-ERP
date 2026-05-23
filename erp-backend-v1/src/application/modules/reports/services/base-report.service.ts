/**
 * ============================================================================
 * BASE REPORT SERVICE
 * ============================================================================
 *
 * خدمة أساسية مشتركة لجميع التقارير
 * توفر وظائف مشتركة مثل التصفية، الترتيب، والـ Pagination
 *
 * @module BaseReportService
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import {
  PaginationMeta,
  PaginatedReportResponseDto,
  SimpleReportResponseDto,
} from '../dto/common/report-response.dto';
import { ReportFiltersDto } from '../dto/common/report-filters.dto';

@Injectable()
export class BaseReportService {
  constructor(protected readonly prisma: PrismaService) {}

  /**
   * حساب معلومات الـ Pagination
   */
  calculatePaginationMeta(
    currentPage: number,
    itemsPerPage: number,
    totalItems: number,
  ): PaginationMeta {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return {
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }

  /**
   * إنشاء استجابة مع pagination
   */
  createPaginatedResponse<T>(
    data: T[],
    currentPage: number,
    itemsPerPage: number,
    totalItems: number,
  ): PaginatedReportResponseDto<T> {
    return {
      data,
      meta: this.calculatePaginationMeta(currentPage, itemsPerPage, totalItems),
      generatedAt: new Date(),
    };
  }

  /**
   * إنشاء استجابة بسيطة بدون pagination
   */
  createSimpleResponse<T>(data: T[]): SimpleReportResponseDto<T> {
    return {
      data,
      count: data.length,
      generatedAt: new Date(),
    };
  }

  /**
   * تطبيق فلاتر التاريخ
   */
  applyDateRangeFilter(startDate?: string, endDate?: string) {
    const filter: Record<string, Date> = {};

    if (startDate) {
      filter.gte = new Date(startDate);
    }

    if (endDate) {
      const end = new Date(endDate);
      // إضافة يوم واحد للتأكد من تضمين اليوم الأخير
      end.setHours(23, 59, 59, 999);
      filter.lte = end;
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  /**
   * بناء Where Clause من الفلاتر
   */
  buildWhereClause(filters: ReportFiltersDto): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    // فلتر التاريخ
    if (filters.startDate || filters.endDate) {
      const dateFilter = this.applyDateRangeFilter(
        filters.startDate,
        filters.endDate,
      );
      if (dateFilter) {
        where.createdAt = dateFilter;
      }
    }

    // فلتر القسم
    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    // فلتر الموقع
    if (filters.siteId) {
      where.siteId = filters.siteId;
    }

    // فلتر الحالة
    if (filters.status) {
      where.status = filters.status;
    }

    // فلتر الفئة
    if (filters.category) {
      where.category = filters.category;
    }

    // فلتر الموظف
    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }

    return where;
  }

  /**
   * بناء OrderBy Clause من الفلاتر
   */
  buildOrderByClause(
    filters: ReportFiltersDto,
  ): Record<string, 'asc' | 'desc'> {
    if (!filters.sortBy) {
      return { createdAt: 'desc' };
    }

    return {
      [filters.sortBy]: filters.sortOrder || 'desc',
    };
  }

  /**
   * حساب Skip و Take للـ Pagination
   */
  calculatePagination(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const take = limit;

    return { skip, take };
  }

  /**
   * تنسيق الأرقام الكبيرة
   * مثال: 1500000 => "1.5M"
   */
  formatLargeNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }

  /**
   * تقريب الأرقام إلى منزلتين عشريتين
   */
  roundNumber(value: number, decimals: number = 2): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  /**
   * حساب النسبة المئوية
   */
  calculatePercentage(part: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((part / total) * 100 * 10) / 10; // دقة عشرية واحدة
  }

  /**
   * حساب التغيير بين قيمتين
   */
  calculateChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  /**
   * تحديد الاتجاه (up, down, neutral)
   */
  determineTrend(change: number): 'up' | 'down' | 'neutral' {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
  }

  /**
   * تنسيق التاريخ إلى YYYY-MM
   */
  formatMonthYear(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * الحصول على تاريخ بداية الشهر
   */
  getMonthStart(monthsAgo: number = 0): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * الحصول على تاريخ نهاية الشهر
   */
  getMonthEnd(monthsAgo: number = 0): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo + 1);
    date.setDate(0);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  /**
   * الحصول على آخر N أشهر
   */
  getLastNMonths(n: number): { start: Date; end: Date }[] {
    const months: { start: Date; end: Date }[] = [];

    for (let i = n - 1; i >= 0; i--) {
      months.push({
        start: this.getMonthStart(i),
        end: this.getMonthEnd(i),
      });
    }

    return months;
  }

  /**
   * تجميع البيانات حسب الشهر
   */
  groupByMonth<T extends { createdAt: Date }>(items: T[]): Map<string, T[]> {
    const grouped = new Map<string, T[]>();

    items.forEach((item) => {
      const monthKey = this.formatMonthYear(item.createdAt);
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, []);
      }
      grouped.get(monthKey)!.push(item);
    });

    return grouped;
  }

  /**
   * حساب المتوسط
   */
  calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / values.length) * 100) / 100;
  }

  /**
   * حساب المجموع
   */
  calculateSum(values: number[]): number {
    return values.reduce((acc, val) => acc + val, 0);
  }

  /**
   * إيجاد القيمة الأكبر
   */
  findMax(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.max(...values);
  }

  /**
   * إيجاد القيمة الأصغر
   */
  findMin(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.min(...values);
  }

  /**
   * تنظيف البيانات من القيم null/undefined
   */
  cleanData<T extends Record<string, any>>(obj: T): T {
    const cleaned = {} as T;

    Object.keys(obj).forEach((key) => {
      if (obj[key] !== null && obj[key] !== undefined) {
        cleaned[key as keyof T] = obj[key];
      }
    });

    return cleaned;
  }
}
