/**
 * ============================================================================
 * GET MONTHLY TREND USE CASE
 * ============================================================================
 *
 * Time-series analysis of costs over months.
 * Shows trends, patterns, and seasonal variations.
 *
 * @module GetMonthlyTrendUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import { Prisma } from '@prisma/client';
import {
  MonthlyTrendFiltersDto,
  MonthlyTrendResponseDto,
  MonthDataPointDto,
} from '../dto';
import { fetchProjectScopedCosts } from './project-cost-scope.helper';
import { DEFAULT_ACCOUNTING_COST_STATUSES } from '../../../finance/utils/cost-accounting-status.util';

@Injectable()
export class GetMonthlyTrendUseCase {
  constructor(
    private prisma: PrismaService,
    private baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: MonthlyTrendFiltersDto,
  ): Promise<MonthlyTrendResponseDto> {
    const months = filters.months || 12;
    const monthRanges = this.baseReportService.getLastNMonths(months);

    const where: Prisma.CostWhereInput = {};
    if (filters.costType) where.costType = filters.costType;
    where.paymentStatus = { in: DEFAULT_ACCOUNTING_COST_STATUSES };

    const dateRangeWhere = {
      ...where,
      transactionDate: {
        gte: monthRanges[0].start,
        lte: monthRanges[monthRanges.length - 1].end,
      },
    };

    const costsRaw = filters.projectId
      ? await fetchProjectScopedCosts(
          this.prisma,
          filters.projectId,
          dateRangeWhere,
        )
      : await this.prisma.cost.findMany({
          where: dateRangeWhere,
          select: {
            amount: true,
            transactionDate: true,
          },
        });

    const costs: Array<{ amount: number; transactionDate: Date }> =
      costsRaw.map((cost) => ({
        amount: Number(cost.amount),
        transactionDate: cost.transactionDate,
      }));

    // Group by month
    const monthlyData = new Map<string, { amount: number; count: number }>();

    monthRanges.forEach((range) => {
      const monthKey = this.baseReportService.formatMonthYear(range.start);
      monthlyData.set(monthKey, { amount: 0, count: 0 });
    });

    costs.forEach((cost) => {
      const monthKey = this.baseReportService.formatMonthYear(
        cost.transactionDate,
      );
      const existing = monthlyData.get(monthKey);
      if (existing) {
        existing.amount += cost.amount;
        existing.count += 1;
      }
    });

    // Transform to response format
    const data: MonthDataPointDto[] = Array.from(monthlyData.entries()).map(
      ([monthKey, values]) => ({
        month: monthKey,
        monthName: this.formatMonthName(monthKey),
        totalAmount: values.amount,
        count: values.count,
        avgCost: values.count > 0 ? values.amount / values.count : 0,
      }),
    );

    const totalAmount = data.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalCount = data.reduce((sum, item) => sum + item.count, 0);
    const avgPerMonth = data.length > 0 ? totalAmount / data.length : 0;

    // Determine trend (compare first and last month)
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (data.length >= 2) {
      const firstAmount = data[0].totalAmount;
      const lastAmount = data[data.length - 1].totalAmount;
      const change = lastAmount - firstAmount;
      const changePercentage =
        firstAmount > 0 ? (change / firstAmount) * 100 : 0;

      if (changePercentage > 5) trend = 'up';
      else if (changePercentage < -5) trend = 'down';
      else trend = 'neutral';
    }

    return {
      data,
      totalAmount,
      totalCount,
      avgPerMonth,
      trend,
      currency: 'SAR',
      generatedAt: new Date(),
    };
  }

  /**
   * Format month key (YYYY-MM) to display name (e.g., "Jan 2026")
   */
  private formatMonthName(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }
}
