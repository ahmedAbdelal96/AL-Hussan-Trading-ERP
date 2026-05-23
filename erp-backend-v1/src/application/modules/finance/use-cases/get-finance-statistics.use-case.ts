import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import {
  FinanceStatisticsDto,
  StatusBreakdownDto,
  CostTypeBreakdownDto,
  CategoryBreakdownDto,
  MonthlyTrendDto,
  TopProjectDto,
} from '../dto';
import { PaymentStatus, CostType } from '@prisma/client';
import {
  DEFAULT_ACCOUNTING_COST_STATUSES,
  getDefaultAccountingCostWhere,
} from '../utils/cost-accounting-status.util';

function toErrorTrace(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return String(error);
}

@Injectable()
export class GetFinanceStatisticsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetFinanceStatisticsUseCase.name);
  }

  /**
   * Finance statistics built with DB-side aggregation.
   * This avoids loading large cost datasets into memory and scales better in production.
   */
  async execute(
    startDate?: Date,
    endDate?: Date,
  ): Promise<FinanceStatisticsDto> {
    this.logger.log('Calculating finance statistics...');

    try {
      const where = this.buildWhereFilter(startDate, endDate);
      const rejectedWhere: Prisma.CostWhereInput = {
        ...this.buildDateWhereFilter(startDate, endDate),
        paymentStatus: PaymentStatus.REJECTED,
      };

      const [
        overview,
        byStatus,
        byType,
        byCategory,
        monthlyTrend,
        topProjects,
        recentCosts,
        rejectedAgg,
      ] = await Promise.all([
        this.prisma.cost.aggregate({
          where,
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.cost.groupBy({
          by: ['paymentStatus'],
          where,
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.cost.groupBy({
          by: ['costType'],
          where,
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.cost.groupBy({
          by: ['categoryId'],
          where: {
            ...where,
            categoryId: { not: null },
          },
          _sum: { amount: true },
          _count: { _all: true },
          orderBy: {
            _sum: { amount: 'desc' },
          },
          take: 10,
        }),
        this.getMonthlyTrend(where, 6),
        this.getTopProjects(where, 5),
        this.prisma.cost.count({
          where: {
            ...where,
            createdAt: {
              gte: this.getDaysAgo(30),
            },
          },
        }),
        this.prisma.cost.aggregate({
          where: rejectedWhere,
          _sum: { amount: true },
          _count: { _all: true },
        }),
      ]);

      const totalCosts = Number(overview._sum.amount || 0);
      const totalEntries = overview._count._all;

      const statusBreakdown = this.mapStatusBreakdown(byStatus, totalCosts);
      const costTypeBreakdown = this.mapCostTypeBreakdown(byType, totalCosts);
      const categoryBreakdown = await this.mapCategoryBreakdown(
        byCategory,
        totalCosts,
      );

      const pendingAmount = this.getStatusAmount(
        statusBreakdown,
        PaymentStatus.PENDING,
      );
      const approvedAmount = this.getStatusAmount(
        statusBreakdown,
        PaymentStatus.APPROVED,
      );
      const paidAmount = this.getStatusAmount(
        statusBreakdown,
        PaymentStatus.PAID,
      );
      const rejectedAmount = Number(rejectedAgg._sum.amount || 0);

      const averageCost = totalEntries > 0 ? totalCosts / totalEntries : 0;
      const growthRate = await this.calculateGrowthRate(where);

      const statistics: FinanceStatisticsDto = {
        totalCosts,
        pendingAmount,
        approvedAmount,
        paidAmount,
        rejectedAmount,
        totalEntries,
        statusBreakdown,
        costTypeBreakdown,
        categoryBreakdown,
        monthlyTrend,
        topProjects,
        recentCosts,
        growthRate,
        averageCost,
        currency: 'SAR',
        calculatedAt: new Date(),
      };

      this.logger.log('Finance statistics calculated successfully');
      return statistics;
    } catch (error) {
      this.logger.error(
        'Failed to calculate finance statistics',
        toErrorTrace(error),
      );
      throw error;
    }
  }

  private buildWhereFilter(
    startDate?: Date,
    endDate?: Date,
  ): Prisma.CostWhereInput {
    return {
      ...this.buildDateWhereFilter(startDate, endDate),
      ...getDefaultAccountingCostWhere(),
    };
  }

  private buildDateWhereFilter(
    startDate?: Date,
    endDate?: Date,
  ): Prisma.CostWhereInput {
    const where: Prisma.CostWhereInput = {};
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = startDate;
      }
      if (endDate) {
        where.transactionDate.lte = endDate;
      }
    }
    return where;
  }

  private mapStatusBreakdown(
    rows: Array<{
      paymentStatus: PaymentStatus;
      _count: { _all: number };
      _sum: { amount: Prisma.Decimal | null };
    }>,
    totalAmount: number,
  ): StatusBreakdownDto[] {
    const groupedMap = new Map(
      rows.map((row) => [
        row.paymentStatus,
        {
          count: row._count._all,
          amount: Number(row._sum.amount || 0),
        },
      ]),
    );

    return DEFAULT_ACCOUNTING_COST_STATUSES.map((status) => {
      const grouped = groupedMap.get(status) || { count: 0, amount: 0 };
      return {
        status,
        count: grouped.count,
        amount: grouped.amount,
        percentage: totalAmount > 0 ? (grouped.amount / totalAmount) * 100 : 0,
      };
    });
  }

  private mapCostTypeBreakdown(
    rows: Array<{
      costType: CostType;
      _count: { _all: number };
      _sum: { amount: Prisma.Decimal | null };
    }>,
    totalAmount: number,
  ): CostTypeBreakdownDto[] {
    return rows
      .map((row) => {
        const amount = Number(row._sum.amount || 0);
        return {
          type: row.costType,
          count: row._count._all,
          amount,
          percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  private async mapCategoryBreakdown(
    rows: Array<{
      categoryId: string | null;
      _count: { _all: number };
      _sum: { amount: Prisma.Decimal | null };
    }>,
    totalAmount: number,
  ): Promise<CategoryBreakdownDto[]> {
    const categoryIds = rows
      .map((row) => row.categoryId)
      .filter((id): id is string => Boolean(id));
    const categories =
      categoryIds.length > 0
        ? await this.prisma.costCategory.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true },
          })
        : [];
    const categoryNameMap = new Map(
      categories.map((category) => [category.id, category.name]),
    );

    return rows
      .filter((row) => Boolean(row.categoryId))
      .map((row) => {
        const amount = Number(row._sum.amount || 0);
        return {
          categoryId: row.categoryId as string,
          categoryName:
            categoryNameMap.get(row.categoryId as string) || 'Unknown',
          count: row._count._all,
          amount,
          percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  private async getMonthlyTrend(
    where: Prisma.CostWhereInput,
    months: number,
  ): Promise<MonthlyTrendDto[]> {
    const startOfRange = new Date();
    startOfRange.setMonth(startOfRange.getMonth() - (months - 1));
    startOfRange.setDate(1);
    startOfRange.setHours(0, 0, 0, 0);

    const txDateFilter = where.transactionDate as
      | Prisma.DateTimeFilter<'Cost'>
      | undefined;
    const startDate = txDateFilter?.gte
      ? (txDateFilter.gte as Date)
      : startOfRange;
    const endDate = txDateFilter?.lte ? (txDateFilter.lte as Date) : new Date();
    const statuses = this.resolvePaymentStatusesForTrend(where);
    const statusSql =
      statuses.length > 0
        ? Prisma.sql`AND c.payment_status IN (${Prisma.join(
            statuses.map(
              (status) =>
                Prisma.sql`CAST(${status} AS "public"."payment_status")`,
            ),
          )})`
        : Prisma.empty;

    const rows = await this.prisma.$queryRaw<
      Array<{ month: string; amount: string; count: string }>
    >(
      Prisma.sql`
        SELECT
          TO_CHAR(DATE_TRUNC('month', transaction_date), 'YYYY-MM') AS month,
          COALESCE(SUM(amount), 0)::TEXT AS amount,
          COUNT(*)::TEXT AS count
        FROM costs c
        WHERE c.transaction_date >= ${startDate}
          AND c.transaction_date <= ${endDate}
          ${statusSql}
        GROUP BY DATE_TRUNC('month', transaction_date)
        ORDER BY DATE_TRUNC('month', transaction_date) ASC
      `,
    );

    return rows.map((row) => {
      const [year, month] = row.month.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
      return {
        month: date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        amount: Number(row.amount),
        count: Number(row.count),
      };
    });
  }

  private async getTopProjects(
    where: Prisma.CostWhereInput,
    limit: number,
  ): Promise<TopProjectDto[]> {
    const rows = await this.prisma.cost.groupBy({
      by: ['projectId'],
      where: {
        ...where,
        projectId: { not: null },
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _sum: { amount: 'desc' },
      },
      take: limit,
    });

    const projectIds = rows
      .map((row) => row.projectId)
      .filter((projectId): projectId is string => Boolean(projectId));
    if (projectIds.length === 0) {
      return [];
    }

    const [projects, projectStatusRows] = await Promise.all([
      this.prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: { id: true, name: true },
      }),
      this.prisma.cost.groupBy({
        by: ['projectId', 'paymentStatus'],
        where: {
          ...where,
          projectId: { in: projectIds },
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const projectNameMap = new Map(
      projects.map((project) => [project.id, project.name]),
    );
    const statusMap = new Map<string, Map<PaymentStatus, number>>();
    for (const row of projectStatusRows) {
      if (!row.projectId) continue;
      if (!statusMap.has(row.projectId)) {
        statusMap.set(row.projectId, new Map<PaymentStatus, number>());
      }
      statusMap.get(row.projectId)!.set(row.paymentStatus, row._count._all);
    }

    const output: TopProjectDto[] = [];
    for (const row of rows) {
      if (!row.projectId) continue;

      const statuses =
        statusMap.get(row.projectId) || new Map<PaymentStatus, number>();
      let dominantStatus: PaymentStatus = PaymentStatus.PENDING;
      let max = -1;
      statuses.forEach((count, status) => {
        if (count > max) {
          max = count;
          dominantStatus = status;
        }
      });

      output.push({
        projectId: row.projectId,
        projectName: projectNameMap.get(row.projectId) || 'Unknown Project',
        totalCost: Number(row._sum.amount || 0),
        costCount: row._count._all,
        dominantStatus,
      });
    }

    return output;
  }

  private getStatusAmount(
    statusBreakdown: StatusBreakdownDto[],
    status: PaymentStatus,
  ): number {
    return statusBreakdown.find((item) => item.status === status)?.amount || 0;
  }

  private getDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  private async calculateGrowthRate(
    where: Prisma.CostWhereInput,
  ): Promise<number> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    const [currentMonthAgg, previousMonthAgg] = await Promise.all([
      this.prisma.cost.aggregate({
        where: {
          AND: [
            where,
            {
              transactionDate: {
                gte: currentMonthStart,
                lt: nextMonthStart,
              },
            },
          ],
        },
        _sum: { amount: true },
      }),
      this.prisma.cost.aggregate({
        where: {
          AND: [
            where,
            {
              transactionDate: {
                gte: previousMonthStart,
                lt: currentMonthStart,
              },
            },
          ],
        },
        _sum: { amount: true },
      }),
    ]);

    const current = Number(currentMonthAgg._sum.amount || 0);
    const previous = Number(previousMonthAgg._sum.amount || 0);
    if (previous === 0) {
      return 0;
    }
    return ((current - previous) / previous) * 100;
  }

  /**
   * Extract payment statuses applied by the caller.
   * Falls back to accounting default statuses when no explicit status filter exists.
   */
  private resolvePaymentStatusesForTrend(
    where: Prisma.CostWhereInput,
  ): PaymentStatus[] {
    const paymentStatusFilter = where.paymentStatus as
      | PaymentStatus
      | Prisma.EnumPaymentStatusFilter
      | undefined;

    if (!paymentStatusFilter) {
      return [...DEFAULT_ACCOUNTING_COST_STATUSES];
    }

    if (typeof paymentStatusFilter === 'string') {
      return [paymentStatusFilter];
    }

    if (paymentStatusFilter.equals) {
      return [paymentStatusFilter.equals];
    }

    if (
      Array.isArray(paymentStatusFilter.in) &&
      paymentStatusFilter.in.length > 0
    ) {
      return [...paymentStatusFilter.in];
    }

    if (
      Array.isArray(paymentStatusFilter.notIn) &&
      paymentStatusFilter.notIn.length > 0
    ) {
      return DEFAULT_ACCOUNTING_COST_STATUSES.filter(
        (status) => !paymentStatusFilter.notIn?.includes(status),
      );
    }

    return [...DEFAULT_ACCOUNTING_COST_STATUSES];
  }
}
