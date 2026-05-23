/**
 * ============================================================================
 * GET PROJECTS STATISTICS USE CASE
 * ============================================================================
 *
 * حالة استخدام لجلب إحصائيات المشاريع الشاملة
 *
 * المسؤوليات:
 * - حساب جميع مقاييس الأداء الرئيسية (14 KPI)
 * - إنشاء 8 تحليلات مختلفة (Status, Timeline, Budget, Monthly, etc.)
 * - معالجة الفلترة حسب التاريخ والموقع والمدير
 * - استخدام Parallel Queries لتحسين الأداء
 * - حساب النسب المئوية والمتوسطات
 *
 * تحسينات الأداء:
 * - Parallel execution لجميع الاستعلامات
 * - Optimized aggregations
 * - Single database round-trip
 * - Efficient date calculations
 *
 * @module GetProjectsStatisticsUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import {
  ProjectsStatisticsParams,
  ProjectsStatisticsDto,
  StatusBreakdownDto,
  TimelineBreakdownDto,
  BudgetBreakdownDto,
  MonthlyTrendDto,
  TopProjectDto,
  EmployeeDistributionDto,
  SiteDistributionDto,
  ProjectStatus,
  TimelineStatus,
  BudgetStatus,
} from '../dto/projects-statistics.dto';

interface ProjectStatusBreakdownRow {
  status: string;
  _count: number;
  totalBudget: number;
  totalActualCost: number;
  averageCompletion: number;
}

@Injectable()
export class GetProjectsStatisticsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {}

  /**
   * تنفيذ حالة الاستخدام
   * @param params معاملات الفلترة (اختيارية)
   * @returns إحصائيات المشاريع الشاملة
   */
  async execute(
    params?: ProjectsStatisticsParams,
  ): Promise<ProjectsStatisticsDto> {
    const startTime = Date.now();
    this.logger.log(
      'GetProjectsStatisticsUseCase',
      `Fetching projects statistics with params: ${JSON.stringify(params)}`,
    );

    try {
      // بناء شروط الفلترة الأساسية
      const baseFilter = this.buildBaseFilter(params);

      // تنفيذ جميع الاستعلامات بالتوازي لتحسين الأداء
      const [
        totalProjects,
        statusCounts,
        completedProjects,
        budgetData,
        monthlyData,
        topByBudget,
        topByCost,
        employeeData,
        siteData,
      ] = await Promise.all([
        // 1. إجمالي المشاريع
        this.getTotalProjects(baseFilter),

        // 2. التوزيع حسب الحالة
        this.getStatusBreakdown(baseFilter),

        // 3. المشاريع المكتملة
        this.getCompletedProjects(baseFilter),

        // 4. بيانات الميزانية
        this.getBudgetData(baseFilter),

        // 5. البيانات الشهرية
        this.getMonthlyTrend(params),

        // 6. أكبر المشاريع حسب الميزانية
        this.getTopProjectsByBudget(baseFilter),

        // 7. أكبر المشاريع حسب التكلفة
        this.getTopProjectsByCost(baseFilter),

        // 8. توزيع الموظفين
        this.getEmployeeDistribution(baseFilter),

        // 9. توزيع المواقع
        this.getSiteDistribution(baseFilter),
      ]);

      // حساب المقاييس المشتقة
      const completionRate =
        totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

      const budgetVariance =
        budgetData.totalBudget - budgetData.totalActualCost;

      const averageCompletion =
        statusCounts.find((s) => s.status === 'ACTIVE')?.averageCompletion || 0;

      // بناء النتيجة النهائية
      const statistics: ProjectsStatisticsDto = {
        // Overview Metrics
        totalProjects,
        draftProjects: this.getCountByStatus(statusCounts, ProjectStatus.DRAFT),
        planningProjects: this.getCountByStatus(
          statusCounts,
          ProjectStatus.PLANNING,
        ),
        activeProjects: this.getCountByStatus(
          statusCounts,
          ProjectStatus.ACTIVE,
        ),
        onHoldProjects: this.getCountByStatus(
          statusCounts,
          ProjectStatus.ON_HOLD,
        ),
        completedProjects: completedProjects,
        cancelledProjects: this.getCountByStatus(
          statusCounts,
          ProjectStatus.CANCELLED,
        ),
        completionRate: parseFloat(completionRate.toFixed(2)),
        totalBudget: budgetData.totalBudget,
        totalActualCost: budgetData.totalActualCost,
        budgetVariance: parseFloat(budgetVariance.toFixed(2)),
        averageCompletion: parseFloat(averageCompletion.toFixed(2)),

        // Breakdowns
        statusBreakdown: this.formatStatusBreakdown(
          statusCounts,
          totalProjects,
        ),
        monthlyTrend: monthlyData,
        topProjectsByBudget: topByBudget,
        topProjectsByCost: topByCost,
        employeeDistribution: employeeData,
        siteDistribution: siteData,

        generatedAt: new Date(),
      };

      const executionTime = Date.now() - startTime;
      this.logger.log(
        'GetProjectsStatisticsUseCase',
        `Statistics generated successfully in ${executionTime}ms`,
      );

      return statistics;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        'GetProjectsStatisticsUseCase',
        `Error fetching statistics: ${message}`,
        stack,
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
  private buildBaseFilter(params?: ProjectsStatisticsParams): any {
    const filter: any = {
      deletedAt: null, // Exclude soft-deleted projects
    };

    if (params?.startDate || params?.endDate) {
      filter.actualStartDate = {};
      if (params.startDate) {
        filter.actualStartDate.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        filter.actualStartDate.lte = new Date(params.endDate);
      }
    }

    if (params?.status) {
      filter.status = params.status;
    }

    if (params?.siteId) {
      filter.siteId = params.siteId;
    }

    if (params?.managerId) {
      filter.managerId = params.managerId;
    }

    return filter;
  }

  /**
   * الحصول على إجمالي عدد المشاريع
   */
  private async getTotalProjects(filter: any): Promise<number> {
    return this.prisma.project.count({ where: filter });
  }

  /**
   * الحصول على التوزيع حسب الحالة
   */
  private async getStatusBreakdown(
    filter: any,
  ): Promise<ProjectStatusBreakdownRow[]> {
    const groups = await this.prisma.project.groupBy({
      where: filter,
      by: ['status'],
      _count: true,
      _sum: {
        budget: true,
      },
      _avg: {
        completionPercentage: true,
      },
    });

    // Avoid N+1 aggregate queries by fetching status-cost totals in one grouped SQL query.
    const costByStatus = await this.getActualCostByProjectStatus(filter);

    return groups.map((group) => ({
      status: group.status,
      _count: group._count,
      totalBudget: Number(group._sum.budget || 0),
      totalActualCost: costByStatus.get(group.status as string) || 0,
      averageCompletion: Number(group._avg.completionPercentage || 0),
    }));
  }

  /**
   * Returns aggregated actual costs grouped by project status for the same
   * project filter used across this use-case.
   */
  private async getActualCostByProjectStatus(
    filter: any,
  ): Promise<Map<string, number>> {
    const conditions: Prisma.Sql[] = [Prisma.sql`p.deleted_at IS NULL`];

    if (filter.status) {
      conditions.push(Prisma.sql`p.status = ${filter.status}::project_status`);
    }
    if (filter.siteId) {
      conditions.push(Prisma.sql`p.site_id = ${filter.siteId}`);
    }
    if (filter.managerId) {
      conditions.push(Prisma.sql`p.manager_id = ${filter.managerId}`);
    }
    if (filter.actualStartDate?.gte) {
      conditions.push(
        Prisma.sql`p.actual_start_date >= ${filter.actualStartDate.gte}`,
      );
    }
    if (filter.actualStartDate?.lte) {
      conditions.push(
        Prisma.sql`p.actual_start_date <= ${filter.actualStartDate.lte}`,
      );
    }

    let whereSql = conditions[0];
    for (let i = 1; i < conditions.length; i += 1) {
      whereSql = Prisma.sql`${whereSql} AND ${conditions[i]}`;
    }
    const rows = await this.prisma.$queryRaw<
      Array<{ status: string; total_actual_cost: string }>
    >(
      Prisma.sql`
        SELECT
          p.status::text AS status,
          COALESCE(SUM(c.amount), 0)::text AS total_actual_cost
        FROM projects p
        LEFT JOIN costs c ON c.project_id = p.id
        WHERE ${whereSql}
        GROUP BY p.status
      `,
    );

    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.status, Number(row.total_actual_cost || 0));
    }
    return map;
  }

  /**
   * الحصول على المشاريع المكتملة
   */
  private async getCompletedProjects(filter: any): Promise<number> {
    const count = await this.prisma.project.count({
      where: {
        ...filter,
        status: ProjectStatus.COMPLETED,
      },
    });

    return count;
  }

  /**
   * الحصول على بيانات الميزانية
   */
  private async getBudgetData(filter: any): Promise<any> {
    const [budgetAgg, costsAgg] = await Promise.all([
      this.prisma.project.aggregate({
        where: filter,
        _sum: {
          budget: true,
        },
      }),
      this.prisma.cost.aggregate({
        where: {
          project: filter,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const totalBudget = Number(budgetAgg._sum.budget || 0);
    const totalActualCost = Number(costsAgg._sum.amount || 0);

    return {
      totalBudget,
      totalActualCost,
    };
  }

  /**
   * Fetch aggregated actual costs for a list of projects in one grouped query.
   */
  private async getCostMapByProjectIds(
    projectIds: string[],
  ): Promise<Map<string, number>> {
    if (projectIds.length === 0) {
      return new Map<string, number>();
    }

    const costGroups = await this.prisma.cost.groupBy({
      by: ['projectId'],
      where: {
        projectId: { in: projectIds },
      },
      _sum: {
        amount: true,
      },
    });

    return new Map(
      costGroups
        .filter((group) => Boolean(group.projectId))
        .map((group) => [
          group.projectId as string,
          Number(group._sum.amount || 0),
        ]),
    );
  }

  /**
   * الحصول على المشاريع النشطة مع التواريخ
   */
  private async getActiveProjectsWithDates(filter: any): Promise<any[]> {
    return this.prisma.project.findMany({
      where: {
        ...filter,
        status: {
          in: [ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD],
        },
      },
      select: {
        id: true,
        actualStartDate: true,
        plannedEndDate: true,
        completionPercentage: true,
      },
    });
  }

  /**
   * الحصول على البيانات الشهرية (آخر 12 شهر)
   */
  private async getMonthlyTrend(
    params?: ProjectsStatisticsParams,
  ): Promise<MonthlyTrendDto[]> {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const projects = await this.prisma.project.findMany({
      where: {
        deletedAt: null,
        OR: [
          { actualStartDate: { gte: twelveMonthsAgo } },
          { actualEndDate: { gte: twelveMonthsAgo } },
        ],
        ...(params?.siteId && { siteId: params.siteId }),
        ...(params?.managerId && { managerId: params.managerId }),
      },
      select: {
        id: true,
        actualStartDate: true,
        actualEndDate: true,
        status: true,
        budget: true,
      },
    });

    const costMap = await this.getCostMapByProjectIds(
      projects.map((project) => project.id),
    );

    // تهيئة جميع الأشهر بقيم صفرية
    const monthlyData: { [key: string]: any } = {};
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = {
        month: monthKey,
        projectsStarted: 0,
        projectsCompleted: 0,
        projectsCancelled: 0,
        totalBudget: 0,
        totalActualCost: 0,
        activeProjectsCount: 0,
      };
    }

    // ملء البيانات الفعلية
    projects.forEach((project) => {
      if (project.actualStartDate) {
        const startMonth = this.getMonthKey(project.actualStartDate);
        if (monthlyData[startMonth]) {
          monthlyData[startMonth].projectsStarted++;
          monthlyData[startMonth].totalBudget += Number(project.budget || 0);
        }
      }

      if (project.actualEndDate) {
        const endMonth = this.getMonthKey(project.actualEndDate);
        if (monthlyData[endMonth]) {
          if (project.status === 'COMPLETED') {
            monthlyData[endMonth].projectsCompleted++;
          } else if (project.status === 'CANCELLED') {
            monthlyData[endMonth].projectsCancelled++;
          }

          monthlyData[endMonth].totalActualCost += costMap.get(project.id) || 0;
        }
      }
    });

    // حساب عدد المشاريع النشطة في نهاية كل شهر
    const monthKeys = Object.keys(monthlyData).sort();
    let runningActive = 0;
    monthKeys.forEach((monthKey) => {
      runningActive +=
        monthlyData[monthKey].projectsStarted -
        monthlyData[monthKey].projectsCompleted -
        monthlyData[monthKey].projectsCancelled;
      monthlyData[monthKey].activeProjectsCount = Math.max(0, runningActive);
    });

    return Object.values(monthlyData).sort((a: any, b: any) =>
      a.month.localeCompare(b.month),
    );
  }

  /**
   * الحصول على أكبر المشاريع حسب الميزانية
   */
  private async getTopProjectsByBudget(filter: any): Promise<TopProjectDto[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        ...filter,
        budget: { not: null },
      },
      select: {
        id: true,
        projectCode: true,
        name: true,
        status: true,
        budget: true,
        completionPercentage: true,
        actualStartDate: true,
        actualEndDate: true,
        plannedEndDate: true,
      },
      orderBy: {
        budget: 'desc',
      },
      take: 10,
    });

    const costMap = await this.getCostMapByProjectIds(
      projects.map((project) => project.id),
    );

    return projects.map((project) => {
      const actualCost = costMap.get(project.id) || 0;
      const budget = Number(project.budget || 0);
      const budgetVariance = budget - actualCost;

      let durationDays = 0;
      if (project.actualStartDate) {
        const endDate =
          project.actualEndDate || project.plannedEndDate || new Date();
        durationDays =
          (new Date(endDate).getTime() -
            new Date(project.actualStartDate).getTime()) /
          (1000 * 60 * 60 * 24);
      }

      return {
        projectId: project.id,
        projectCode: project.projectCode,
        projectName: project.name,
        status: project.status as ProjectStatus,
        budget,
        actualCost,
        budgetVariance,
        completionPercentage: Number(project.completionPercentage),
        durationDays: Math.round(durationDays),
      };
    });
  }

  /**
   * الحصول على أكبر المشاريع حسب التكلفة الفعلية
   */
  private async getTopProjectsByCost(filter: any): Promise<TopProjectDto[]> {
    const groupedCosts = await this.prisma.cost.groupBy({
      by: ['projectId'],
      where: {
        project: filter,
        projectId: { not: null },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: 10,
    });

    const projectIds = groupedCosts
      .map((group) => group.projectId)
      .filter((projectId): projectId is string => Boolean(projectId));
    if (projectIds.length === 0) {
      return [];
    }

    const projects = await this.prisma.project.findMany({
      where: {
        ...filter,
        id: { in: projectIds },
      },
      select: {
        id: true,
        projectCode: true,
        name: true,
        status: true,
        budget: true,
        completionPercentage: true,
        actualStartDate: true,
        actualEndDate: true,
        plannedEndDate: true,
      },
    });

    const projectMap = new Map(
      projects.map((project) => [project.id, project]),
    );

    return groupedCosts
      .map((group) => {
        if (!group.projectId) return null;
        const project = projectMap.get(group.projectId);
        if (!project) return null;

        const actualCost = Number(group._sum.amount || 0);
        const budget = Number(project.budget || 0);
        const budgetVariance = budget - actualCost;

        let durationDays = 0;
        if (project.actualStartDate) {
          const endDate =
            project.actualEndDate || project.plannedEndDate || new Date();
          durationDays =
            (new Date(endDate).getTime() -
              new Date(project.actualStartDate).getTime()) /
            (1000 * 60 * 60 * 24);
        }

        return {
          projectId: project.id,
          projectCode: project.projectCode,
          projectName: project.name,
          status: project.status as ProjectStatus,
          budget,
          actualCost,
          budgetVariance,
          completionPercentage: Number(project.completionPercentage),
          durationDays: Math.round(durationDays),
        };
      })
      .filter((item): item is TopProjectDto => Boolean(item));
  }

  /**
   * الحصول على توزيع الموظفين
   */
  private async getEmployeeDistribution(
    filter: any,
  ): Promise<EmployeeDistributionDto[]> {
    const projectEmployees = await this.prisma.projectEmployee.groupBy({
      where: {
        project: filter,
      },
      by: ['projectId'],
      _count: {
        employeeId: true,
      },
    });

    const projectIds = projectEmployees.map((pe) => pe.projectId);
    if (projectIds.length === 0) {
      return [];
    }

    const [projects, salaryCosts] = await Promise.all([
      this.prisma.project.findMany({
        where: {
          id: { in: projectIds },
        },
        select: {
          id: true,
          name: true,
        },
      }),
      this.prisma.cost.groupBy({
        by: ['projectId'],
        where: {
          projectId: { in: projectIds },
          costType: 'SALARY',
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const projectNameMap = new Map(
      projects.map((project) => [project.id, project.name]),
    );
    const salaryMap = new Map(
      salaryCosts
        .filter((item) => Boolean(item.projectId))
        .map((item) => [
          item.projectId as string,
          Number(item._sum.amount || 0),
        ]),
    );

    return projectEmployees
      .map((item) => ({
        projectId: item.projectId,
        projectName: projectNameMap.get(item.projectId) || '',
        employeeCount: item._count.employeeId,
        totalEmployeeCost: salaryMap.get(item.projectId) || 0,
      }))
      .filter((item) => item.employeeCount > 0)
      .sort((a, b) => b.employeeCount - a.employeeCount)
      .slice(0, 10);
  }

  /**
   * الحصول على توزيع المواقع
   */
  private async getSiteDistribution(
    filter: any,
  ): Promise<SiteDistributionDto[]> {
    const groupedProjects = await this.prisma.project.groupBy({
      by: ['siteId', 'status'],
      where: {
        ...filter,
        siteId: { not: null },
      },
      _count: {
        _all: true,
      },
      _sum: {
        budget: true,
      },
    });

    const siteIds = [
      ...new Set(
        groupedProjects
          .map((group) => group.siteId)
          .filter((siteId): siteId is string => Boolean(siteId)),
      ),
    ];
    if (siteIds.length === 0) {
      return [];
    }

    const sites = await this.prisma.site.findMany({
      where: {
        id: { in: siteIds },
      },
      select: {
        id: true,
        name: true,
      },
    });
    const siteNameMap = new Map(sites.map((site) => [site.id, site.name]));

    const siteDataMap = new Map<
      string,
      {
        siteId: string;
        siteName: string;
        projectCount: number;
        totalBudget: number;
        activeProjectsCount: number;
        completedProjectsCount: number;
      }
    >();

    for (const group of groupedProjects) {
      if (!group.siteId) continue;

      if (!siteDataMap.has(group.siteId)) {
        siteDataMap.set(group.siteId, {
          siteId: group.siteId,
          siteName: siteNameMap.get(group.siteId) || 'Unknown Site',
          projectCount: 0,
          totalBudget: 0,
          activeProjectsCount: 0,
          completedProjectsCount: 0,
        });
      }

      const siteData = siteDataMap.get(group.siteId)!;
      siteData.projectCount += group._count._all;
      siteData.totalBudget += Number(group._sum.budget || 0);
      if (group.status === 'ACTIVE') {
        siteData.activeProjectsCount += group._count._all;
      }
      if (group.status === 'COMPLETED') {
        siteData.completedProjectsCount += group._count._all;
      }
    }

    return Array.from(siteDataMap.values()).sort(
      (a, b) => b.projectCount - a.projectCount,
    );
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
      status: item.status as ProjectStatus,
      count: item._count,
      percentage: total > 0 ? (item._count / total) * 100 : 0,
      totalBudget: item.totalBudget,
      totalActualCost: item.totalActualCost,
      averageCompletion: item.averageCompletion,
    }));
  }

  /**
   * حساب التوزيع حسب الجدول الزمني
   */
  private calculateTimelineBreakdown(
    projects: Array<{
      actualStartDate?: Date | null;
      plannedEndDate?: Date | null;
      completionPercentage: number;
    }>,
  ): TimelineBreakdownDto[] {
    const now = new Date();
    const breakdown: { [key: string]: any } = {
      [TimelineStatus.ON_TIME]: {
        count: 0,
        daysVariances: [],
      },
      [TimelineStatus.BEHIND_SCHEDULE]: {
        count: 0,
        daysVariances: [],
      },
      [TimelineStatus.AHEAD_OF_SCHEDULE]: {
        count: 0,
        daysVariances: [],
      },
      [TimelineStatus.NOT_STARTED]: {
        count: 0,
        daysVariances: [],
      },
    };

    projects.forEach((project) => {
      if (!project.actualStartDate) {
        breakdown[TimelineStatus.NOT_STARTED].count++;
        return;
      }

      if (!project.plannedEndDate) {
        breakdown[TimelineStatus.ON_TIME].count++;
        return;
      }

      const plannedEnd = project.plannedEndDate;
      const completion = Number(project.completionPercentage);

      // تقدير التاريخ المتوقع للإنجاز بناءً على نسبة الإنجاز
      const daysSinceStart =
        (now.getTime() - project.actualStartDate.getTime()) /
        (1000 * 60 * 60 * 24);
      const estimatedTotalDays =
        completion > 0 ? (daysSinceStart / completion) * 100 : daysSinceStart;
      const estimatedEndDate = new Date(project.actualStartDate.getTime());
      estimatedEndDate.setDate(estimatedEndDate.getDate() + estimatedTotalDays);

      const daysVariance =
        (estimatedEndDate.getTime() - plannedEnd.getTime()) /
        (1000 * 60 * 60 * 24);

      if (Math.abs(daysVariance) <= 7) {
        breakdown[TimelineStatus.ON_TIME].count++;
        breakdown[TimelineStatus.ON_TIME].daysVariances.push(daysVariance);
      } else if (daysVariance > 7) {
        breakdown[TimelineStatus.BEHIND_SCHEDULE].count++;
        breakdown[TimelineStatus.BEHIND_SCHEDULE].daysVariances.push(
          daysVariance,
        );
      } else {
        breakdown[TimelineStatus.AHEAD_OF_SCHEDULE].count++;
        breakdown[TimelineStatus.AHEAD_OF_SCHEDULE].daysVariances.push(
          daysVariance,
        );
      }
    });

    const total = projects.length;

    return Object.entries(breakdown).map(([status, data]: [string, any]) => ({
      timelineStatus: status as TimelineStatus,
      count: data.count,
      percentage: total > 0 ? (data.count / total) * 100 : 0,
      averageDaysVariance:
        data.daysVariances.length > 0
          ? data.daysVariances.reduce((sum: number, v: number) => sum + v, 0) /
            data.daysVariances.length
          : 0,
    }));
  }

  /**
   * حساب التوزيع حسب الميزانية
   */
  private calculateBudgetBreakdown(projects: any[]): BudgetBreakdownDto[] {
    const breakdown: { [key: string]: any } = {
      [BudgetStatus.WITHIN_BUDGET]: {
        count: 0,
        variances: [],
        variancePercentages: [],
      },
      [BudgetStatus.OVER_BUDGET]: {
        count: 0,
        variances: [],
        variancePercentages: [],
      },
      [BudgetStatus.UNDER_BUDGET]: {
        count: 0,
        variances: [],
        variancePercentages: [],
      },
      [BudgetStatus.NO_BUDGET]: {
        count: 0,
        variances: [],
        variancePercentages: [],
      },
    };

    projects.forEach((project) => {
      if (project.budget === 0) {
        breakdown[BudgetStatus.NO_BUDGET].count++;
        return;
      }

      const variance = project.variance;
      const variancePercentage = (variance / project.budget) * 100;

      if (Math.abs(variancePercentage) <= 10) {
        breakdown[BudgetStatus.WITHIN_BUDGET].count++;
        breakdown[BudgetStatus.WITHIN_BUDGET].variances.push(variance);
        breakdown[BudgetStatus.WITHIN_BUDGET].variancePercentages.push(
          variancePercentage,
        );
      } else if (variance < 0) {
        breakdown[BudgetStatus.OVER_BUDGET].count++;
        breakdown[BudgetStatus.OVER_BUDGET].variances.push(variance);
        breakdown[BudgetStatus.OVER_BUDGET].variancePercentages.push(
          variancePercentage,
        );
      } else {
        breakdown[BudgetStatus.UNDER_BUDGET].count++;
        breakdown[BudgetStatus.UNDER_BUDGET].variances.push(variance);
        breakdown[BudgetStatus.UNDER_BUDGET].variancePercentages.push(
          variancePercentage,
        );
      }
    });

    const totalWithBudget = projects.filter((p) => p.budget > 0).length;

    return Object.entries(breakdown).map(([status, data]: [string, any]) => ({
      budgetStatus: status as BudgetStatus,
      count: data.count,
      percentage:
        status === 'NO_BUDGET'
          ? projects.length > 0
            ? (data.count / projects.length) * 100
            : 0
          : totalWithBudget > 0
            ? (data.count / totalWithBudget) * 100
            : 0,
      totalVariance:
        data.variances.length > 0
          ? data.variances.reduce((sum: number, v: number) => sum + v, 0)
          : 0,
      averageVariancePercentage:
        data.variancePercentages.length > 0
          ? data.variancePercentages.reduce(
              (sum: number, v: number) => sum + v,
              0,
            ) / data.variancePercentages.length
          : 0,
    }));
  }

  /**
   * الحصول على العدد حسب الحالة
   */
  private getCountByStatus(data: any[], status: ProjectStatus): number {
    const item = data.find((d) => d.status === status);
    return item?._count || 0;
  }

  /**
   * الحصول على مفتاح الشهر (YYYY-MM)
   */
  private getMonthKey(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
