/**
 * ============================================================================
 * GET MAINTENANCE STATISTICS USE CASE
 * ============================================================================
 *
 * حالة استخدام لجلب إحصائيات الصيانة الشاملة
 *
 * المسؤوليات:
 * - حساب جميع مقاييس الأداء الرئيسية (8 KPI)
 * - إنشاء 5 تحليلات مختلفة (Status, Type, Priority, Monthly, Cost)
 * - معالجة الفلترة حسب التاريخ والمشروع والأصل
 * - استخدام Parallel Queries لتحسين الأداء
 * - حساب النسب المئوية والمتوسطات
 *
 * تحسينات الأداء:
 * - Parallel execution لجميع الاستعلامات
 * - Optimized aggregations
 * - Single database round-trip
 * - Efficient date calculations
 *
 * @module GetMaintenanceStatisticsUseCase
 * @version 2.0.0 (Simplified)
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  MaintenanceStatisticsParams,
  MaintenanceStatisticsDto,
  StatusBreakdownDto,
  TypeBreakdownDto,
  PriorityBreakdownDto,
  AssetTypeBreakdownDto,
  MonthlyTrendDto,
  TopAssetDto,
  CostByTypeDto,
  ResolutionTimeDto,
  MaintenanceStatus,
  MaintenancePriority,
} from '../dto/maintenance-statistics.dto';
import {
  IMaintenanceRepository,
  MAINTENANCE_REPOSITORY,
} from '../repositories/maintenance.repository.interface';

@Injectable()
export class GetMaintenanceStatisticsUseCase {
  private readonly toErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

  private readonly toErrorTrace = (error: unknown): string =>
    error instanceof Error ? (error.stack ?? error.message) : String(error);

  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly maintenanceRepository: IMaintenanceRepository,
    private readonly logger: WinstonLoggerService,
  ) {}

  /**
   * تنفيذ حالة الاستخدام
   * @param params معاملات الفلترة (اختيارية)
   * @returns إحصائيات الصيانة الشاملة
   */
  async execute(
    params?: MaintenanceStatisticsParams,
  ): Promise<MaintenanceStatisticsDto> {
    const startTime = Date.now();
    this.logger.log(
      'GetMaintenanceStatisticsUseCase',
      `Fetching maintenance statistics with params: ${JSON.stringify(params)}`,
    );

    try {
      // بناء شروط الفلترة الأساسية
      const baseFilter = this.buildBaseFilter(params);

      // تنفيذ جميع الاستعلامات بالتوازي لتحسين الأداء (Simplified: 8 queries)
      const [
        totalRequests,
        statusCounts,
        typeCounts,
        priorityCounts,
        completedRequests,
        resolutionTimes,
        costData,
        monthlyData,
        highPriorityCount,
      ] = await Promise.all([
        // 1. إجمالي الطلبات
        this.getTotalRequests(baseFilter),

        // 2. التوزيع حسب الحالة
        this.getStatusBreakdown(baseFilter),

        // 3. التوزيع حسب النوع
        this.getTypeBreakdown(baseFilter),

        // 4. التوزيع حسب الأولوية
        this.getPriorityBreakdown(baseFilter),

        // 5. الطلبات المكتملة (لحساب معدل الإنجاز)
        this.getCompletedRequests(baseFilter),

        // 6. أوقات الإصلاح
        this.getResolutionTimes(baseFilter),

        // 7. بيانات التكلفة
        this.getCostData(baseFilter),

        // 8. البيانات الشهرية
        this.getMonthlyTrend(params),

        // 9. الطلبات عالية الأولوية
        this.getHighPriorityCount(baseFilter),
      ]);

      // حساب المقاييس المشتقة
      const completionRate =
        totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;

      const averageResolutionDays = this.calculateAverageResolutionDays(
        resolutionTimes.find((r) => r.status === MaintenanceStatus.COMPLETED),
      );

      // بناء النتिجة النهائية (Simplified: 8 KPIs + 5 Breakdowns)
      const statistics: MaintenanceStatisticsDto = {
        // Overview Metrics (8 KPIs)
        totalRequests,
        pendingRequests: this.getCountByStatus(
          statusCounts,
          MaintenanceStatus.PENDING,
        ),
        inProgressRequests: this.getCountByStatus(
          statusCounts,
          MaintenanceStatus.IN_PROGRESS,
        ),
        completedRequests,
        completionRate: parseFloat(completionRate.toFixed(2)),
        averageResolutionDays: parseFloat(averageResolutionDays.toFixed(2)),
        totalCost: costData.totalCost,
        highPriorityRequests: highPriorityCount,

        // Breakdowns (5 Charts)
        statusBreakdown: this.formatStatusBreakdown(
          statusCounts,
          totalRequests,
        ),
        typeBreakdown: this.formatTypeBreakdown(typeCounts, totalRequests),
        priorityBreakdown: this.formatPriorityBreakdown(
          priorityCounts,
          totalRequests,
        ),
        monthlyTrend: monthlyData,
        costByType: this.formatCostByType(
          costData.costByType,
          costData.totalCost,
        ),

        generatedAt: new Date(),
      };

      const executionTime = Date.now() - startTime;
      this.logger.log(
        'GetMaintenanceStatisticsUseCase',
        `Statistics generated successfully in ${executionTime}ms`,
      );

      return statistics;
    } catch (error: unknown) {
      this.logger.error(
        'GetMaintenanceStatisticsUseCase',
        `Error fetching statistics: ${this.toErrorMessage(error)}`,
        this.toErrorTrace(error),
      );
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS - DATA FETCHING
  // ============================================================================

  /**
   * بناء شروط الفلترة الأساسية
   */
  private buildBaseFilter(params?: MaintenanceStatisticsParams): any {
    const filter: any = {};

    if (params?.startDate || params?.endDate) {
      filter.createdAt = {};
      if (params.startDate) {
        filter.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        filter.createdAt.lte = new Date(params.endDate);
      }
    }

    if (params?.projectId) {
      filter.projectId = params.projectId;
    }

    if (params?.assetId) {
      filter.assetId = params.assetId;
    }

    if (params?.status) {
      filter.status = params.status;
    }

    if (params?.type) {
      filter.maintenanceType = params.type;
    }

    if (params?.priority) {
      filter.priority = params.priority;
    }

    return filter;
  }

  /**
   * الحصول على إجمالي عدد الطلبات
   */
  private async getTotalRequests(filter: any): Promise<number> {
    return this.maintenanceRepository.count(filter);
  }

  /**
   * الحصول على التوزيع حسب الحالة
   */
  private async getStatusBreakdown(filter: any): Promise<any[]> {
    return this.maintenanceRepository.groupBy({
      where: filter,
      by: ['status'],
      _count: true,
      _sum: {
        actualCost: true,
      },
    });
  }

  /**
   * الحصول على التوزيع حسب النوع
   */
  private async getTypeBreakdown(filter: any): Promise<any[]> {
    return this.maintenanceRepository.groupBy({
      where: filter,
      by: ['maintenanceType'],
      _count: true,
      _sum: {
        actualCost: true,
      },
    });
  }

  /**
   * الحصول على التوزيع حسب الأولوية
   */
  private async getPriorityBreakdown(filter: any): Promise<any[]> {
    return this.maintenanceRepository.groupBy({
      where: filter,
      by: ['priority'],
      _count: true,
    });
  }

  /**
   * الحصول على التوزيع حسب نوع الأصل
   */
  private async getAssetTypeBreakdown(filter: any): Promise<any[]> {
    // نحتاج للانضمام مع جدول الأصول
    const requests = (await this.maintenanceRepository.findMany({
      where: filter,
      select: {
        assetId: true,
        actualCost: true,
        asset: {
          select: {
            assetType: true,
          },
        },
      },
    })) as Array<{
      assetId: string;
      actualCost: number | null;
      asset: { assetType: string };
    }>;

    // تجميع حسب نوع الأصل
    const grouped = requests.reduce<
      Record<
        string,
        {
          count: number;
          cost: number;
          assets: Set<string>;
        }
      >
    >((acc, req) => {
      const type = req.asset.assetType;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          cost: 0,
          assets: new Set(),
        };
      }
      acc[type].count++;
      acc[type].cost += Number(req.actualCost || 0);
      acc[type].assets.add(req.assetId);
      return acc;
    }, {});

    return Object.entries(grouped).map(([type, data]) => ({
      assetType: type,
      count: data.count,
      totalCost: data.cost,
      affectedAssets: data.assets.size,
    }));
  }

  /**
   * الحصول على عدد الطلبات المكتملة
   */
  private async getCompletedRequests(filter: any): Promise<number> {
    return this.maintenanceRepository.count({
      ...filter,
      status: MaintenanceStatus.COMPLETED,
    });
  }

  /**
   * الحصول على أوقات الإصلاح
   */
  private async getResolutionTimes(filter: any): Promise<ResolutionTimeDto[]> {
    const completedRequests = (await this.maintenanceRepository.findMany({
      where: {
        ...filter,
        status: MaintenanceStatus.COMPLETED,
        completedAt: { not: null },
        startedAt: { not: null },
      },
      select: {
        status: true,
        startedAt: true,
        completedAt: true,
      },
    })) as Array<{
      status: MaintenanceStatus;
      startedAt: Date;
      completedAt: Date;
    }>;

    if (completedRequests.length === 0) {
      return [
        {
          status: MaintenanceStatus.COMPLETED,
          averageDays: 0,
          minDays: 0,
          maxDays: 0,
          requestCount: 0,
        },
      ];
    }

    const durations = completedRequests.map((req) => {
      const start = req.startedAt.getTime();
      const end = req.completedAt.getTime();
      return (end - start) / (1000 * 60 * 60 * 24); // Convert to days
    });

    return [
      {
        status: MaintenanceStatus.COMPLETED,
        averageDays:
          durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minDays: Math.min(...durations),
        maxDays: Math.max(...durations),
        requestCount: completedRequests.length,
      },
    ];
  }

  /**
   * الحصول على بيانات التكلفة
   */
  private async getCostData(filter: any): Promise<{
    totalCost: number;
    costByType: Array<{
      maintenanceType: string;
      count: number;
      totalCost: number;
    }>;
  }> {
    const requests = await this.maintenanceRepository.findMany({
      where: filter,
      select: {
        maintenanceType: true,
        actualCost: true,
      },
    });

    const totalCost = requests.reduce(
      (sum, req) => sum + Number(req.actualCost || 0),
      0,
    );

    // تجميع التكلفة حسب النوع
    const costByType = requests.reduce<
      Record<string, { count: number; totalCost: number }>
    >((acc, req) => {
      const type = req.maintenanceType;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          totalCost: 0,
        };
      }
      acc[type].count++;
      acc[type].totalCost += Number(req.actualCost || 0);
      return acc;
    }, {});

    return {
      totalCost,
      costByType: Object.entries(costByType).map(([type, data]) => ({
        maintenanceType: type,
        count: data.count,
        totalCost: data.totalCost,
      })),
    };
  }

  /**
   * الحصول على البيانات الشهرية (آخر 12 شهر)
   */
  private async getMonthlyTrend(
    params?: MaintenanceStatisticsParams,
  ): Promise<MonthlyTrendDto[]> {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const requests = (await this.maintenanceRepository.findMany({
      where: {
        createdAt: {
          gte: twelveMonthsAgo,
        },
        ...(params?.projectId && { projectId: params.projectId }),
        ...(params?.assetId && { assetId: params.assetId }),
      },
      select: {
        createdAt: true,
        completedAt: true,
        status: true,
        actualCost: true,
        startedAt: true,
      },
    })) as Array<{
      createdAt: Date;
      completedAt: Date | null;
      status: MaintenanceStatus;
      actualCost: number | null;
      startedAt: Date | null;
    }>;

    // تجميع البيانات حسب الشهر
    const monthlyData: Record<
      string,
      {
        month: string;
        newRequests: number;
        completedRequests: number;
        cancelledRequests: number;
        totalCost: number;
        resolutionDays: number[];
        activeRequests: number;
      }
    > = {};

    // تهيئة جميع الأشهر بقيم صفرية
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = {
        month: monthKey,
        newRequests: 0,
        completedRequests: 0,
        cancelledRequests: 0,
        totalCost: 0,
        resolutionDays: [],
        activeRequests: 0,
      };
    }

    // ملء البيانات الفعلية
    requests.forEach((req) => {
      const createdMonth = this.getMonthKey(req.createdAt);
      if (monthlyData[createdMonth]) {
        monthlyData[createdMonth].newRequests++;
      }

      if (req.completedAt) {
        const completedMonth = this.getMonthKey(req.completedAt);
        if (monthlyData[completedMonth]) {
          monthlyData[completedMonth].completedRequests++;
          monthlyData[completedMonth].totalCost += Number(req.actualCost || 0);

          // حساب مدة الإصلاح
          if (req.startedAt) {
            const duration =
              (req.completedAt.getTime() - req.startedAt.getTime()) /
              (1000 * 60 * 60 * 24);
            monthlyData[completedMonth].resolutionDays.push(duration);
          }
        }
      }

      if (req.status === MaintenanceStatus.CANCELLED) {
        const month = this.getMonthKey(req.createdAt);
        if (monthlyData[month]) {
          monthlyData[month].cancelledRequests++;
        }
      }
    });

    // تحويل إلى مصفوفة وحساب المتوسطات
    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((data) => ({
        month: data.month,
        newRequests: data.newRequests,
        completedRequests: data.completedRequests,
        cancelledRequests: data.cancelledRequests,
        totalCost: data.totalCost,
        averageResolutionDays:
          data.resolutionDays.length > 0
            ? data.resolutionDays.reduce(
                (sum: number, d: number) => sum + d,
                0,
              ) / data.resolutionDays.length
            : 0,
        totalActiveRequests:
          data.newRequests - data.completedRequests - data.cancelledRequests,
      }));
  }

  /**
   * الحصول على الأصول الأكثر صيانة (أعلى 10)
   */
  private async getTopAssets(filter: any): Promise<TopAssetDto[]> {
    const requests = (await this.maintenanceRepository.findMany({
      where: filter,
      select: {
        assetId: true,
        actualCost: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        asset: {
          select: {
            id: true,
            name: true,
            assetNumber: true,
            assetType: true,
          },
        },
      },
    })) as Array<{
      assetId: string;
      actualCost: number | null;
      startedAt: Date | null;
      completedAt: Date | null;
      createdAt: Date;
      asset: {
        id: string;
        name: string;
        assetNumber: string;
        assetType: string;
      };
    }>;

    // تجميع حسب الأصل
    const assetData = requests.reduce<
      Record<
        string,
        {
          asset: {
            id: string;
            name: string;
            assetNumber: string;
            assetType: string;
          };
          count: number;
          totalCost: number;
          resolutionDays: number[];
          lastMaintenanceDate: Date;
        }
      >
    >((acc, req) => {
      const assetId = req.assetId;
      if (!acc[assetId]) {
        acc[assetId] = {
          asset: req.asset,
          count: 0,
          totalCost: 0,
          resolutionDays: [],
          lastMaintenanceDate: req.createdAt,
        };
      }
      acc[assetId].count++;
      acc[assetId].totalCost += Number(req.actualCost || 0);

      if (req.startedAt && req.completedAt) {
        const duration =
          (req.completedAt.getTime() - req.startedAt.getTime()) /
          (1000 * 60 * 60 * 24);
        acc[assetId].resolutionDays.push(duration);
      }

      if (req.createdAt > acc[assetId].lastMaintenanceDate) {
        acc[assetId].lastMaintenanceDate = req.createdAt;
      }

      return acc;
    }, {});

    // تحويل إلى مصفوفة وترتيب حسب العدد
    return Object.entries(assetData)
      .map(([assetId, data]) => ({
        assetId,
        assetName: data.asset.name,
        assetNumber: data.asset.assetNumber,
        assetType: data.asset.assetType as TopAssetDto['assetType'],
        maintenanceCount: data.count,
        totalCost: data.totalCost,
        averageResolutionDays:
          data.resolutionDays.length > 0
            ? data.resolutionDays.reduce(
                (sum: number, d: number) => sum + d,
                0,
              ) / data.resolutionDays.length
            : 0,
        lastMaintenanceDate: data.lastMaintenanceDate,
      }))
      .sort((a, b) => b.maintenanceCount - a.maintenanceCount)
      .slice(0, 10);
  }

  /**
   * الحصول على عدد الطلبات عالية الأولوية
   */
  private async getHighPriorityCount(filter: any): Promise<number> {
    return this.maintenanceRepository.count({
      ...filter,
      priority: {
        in: [MaintenancePriority.HIGH, MaintenancePriority.CRITICAL],
      },
    });
  }

  /**
   * الحصول على عدد الطلبات المتأخرة
   */
  private async getOverdueCount(filter: any): Promise<number> {
    const now = new Date();
    return this.maintenanceRepository.count({
      ...filter,
      scheduledDate: {
        lt: now,
      },
      status: {
        notIn: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED],
      },
    });
  }

  // ============================================================================
  // HELPER METHODS - DATA FORMATTING
  // ============================================================================

  /**
   * تنسيق التوزيع حسب الحالة
   */
  private formatStatusBreakdown(
    data: any[],
    total: number,
  ): StatusBreakdownDto[] {
    return data.map((item) => ({
      status: item.status,
      count: item._count,
      percentage: total > 0 ? (item._count / total) * 100 : 0,
      totalCost: Number(item._sum?.actualCost || 0),
      averageCost:
        item._count > 0 ? Number(item._sum?.actualCost || 0) / item._count : 0,
    }));
  }

  /**
   * تنسيق التوزيع حسب النوع
   */
  private formatTypeBreakdown(data: any[], total: number): TypeBreakdownDto[] {
    return data.map((item) => ({
      maintenanceType: item.maintenanceType,
      count: item._count,
      percentage: total > 0 ? (item._count / total) * 100 : 0,
      totalCost: Number(item._sum?.actualCost || 0),
      averageResolutionDays: 0, // سيتم حسابه من بيانات أخرى إذا لزم الأمر
    }));
  }

  /**
   * تنسيق التوزيع حسب الأولوية
   */
  private formatPriorityBreakdown(
    data: any[],
    total: number,
  ): PriorityBreakdownDto[] {
    return data.map((item) => ({
      priority: item.priority,
      count: item._count,
      percentage: total > 0 ? (item._count / total) * 100 : 0,
      completedCount: 0, // سيتم حسابه من استعلام منفصل إذا لزم الأمر
      completionRate: 0,
    }));
  }

  /**
   * تنسيق التوزيع حسب نوع الأصل
   */
  private formatAssetTypeBreakdown(
    data: any[],
    total: number,
  ): AssetTypeBreakdownDto[] {
    return data.map((item) => ({
      assetType: item.assetType,
      maintenanceCount: item.count,
      affectedAssets: item.affectedAssets,
      percentage: total > 0 ? (item.count / total) * 100 : 0,
      totalCost: item.totalCost,
    }));
  }

  /**
   * تنسيق التكلفة حسب النوع
   */
  private formatCostByType(data: any[], totalCost: number): CostByTypeDto[] {
    return data.map((item) => ({
      maintenanceType: item.maintenanceType,
      totalCost: item.totalCost,
      percentage: totalCost > 0 ? (item.totalCost / totalCost) * 100 : 0,
      averageCost: item.count > 0 ? item.totalCost / item.count : 0,
      requestCount: item.count,
    }));
  }

  /**
   * الحصول على العدد حسب الحالة
   */
  private getCountByStatus(data: any[], status: MaintenanceStatus): number {
    const item = data.find((d) => d.status === status);
    return item?._count || 0;
  }

  /**
   * حساب متوسط وقت الإصلاح
   */
  private calculateAverageResolutionDays(data?: ResolutionTimeDto): number {
    return data?.averageDays || 0;
  }

  /**
   * الحصول على مفتاح الشهر (YYYY-MM)
   */
  private getMonthKey(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
